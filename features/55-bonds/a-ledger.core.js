// Bonds, part 1 of 3: the shared history of a bond (Road to Ten, Relationships 4).
//
// 21-npc-initiative began a log on every bond, pc.rel[pid].hist = [{y, t}]: "You lent her 40 suns". It was text only.
// Here every line also carries what it did to the bond, and keeps doing it:
//   - a line is written by anything that touches that person: an event choice with ctx.pid, an interaction, a duel,
//     an NPC's move, a death in the family. The opinion it moved is its weight (w), in the event's own units;
//   - a weight fades with a half-life set by its size (a long talk 2 years, a betrayal 12, a killing 60), and is topped
//     up when the same thing happens again;
//   - once a year the sum of a bond's weights pulls opinion toward itself, on both sides: good memories hold it up,
//     wrongs pull it down. A bond with strong memories is not forgotten for idleness;
//   - events cite it: a {history} token for any event with ctx.pid ("She has not forgotten 1112, when you insulted her
//     at the fair."), events of this feature that are about one past line, and a "Between you" line under any event
//     about someone you share history with.
//
// Engine side: wrappers around A.eventChoose, A.interact, A.duelConsequences/duelClose, A.callFavor and A.getToKnow
// open a "window"; A.addOp and A.link inside it are summed per person and written to the line made in that window
// (or to a new one). The yearly pull runs from the month hook. Rendering (UI.bondHist, the event aside) only reads.
// State: optional fields on hist entries (v, w, h, k, s, d, of) and pc.bonds; old saves load with weightless lines.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const low = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const BD = A.BONDS = Object.assign(A.BONDS || {}, {
    HIST: 12,       // lines kept per bond (21-npc-initiative's number)
    PULL: 0.3,      // share of the gap between opinion and its memories closed each year
    HOLD: 12,       // memories this strong keep a bond from being forgotten for idleness
    M_CAP: 60,      // the most memories can hold an opinion up or down
    W_CAP: 50,      // the heaviest single line
    MIN: 3,         // an action that moves a bond less than this leaves no line of its own
    CITE: 6,        // a line must still weigh this much to be quoted under an event
  });
  // runtime counters for tests and the bench (not saved)
  BD.stats = BD.stats || { pull: 0, pullN: 0, led: 0, ledN: 0, lines: 0, textCites: 0, cite_bd: 0, cite_past: 0, cite_token: 0, asides: 0, pidEvents: 0, events: 0 };
  BD.resetStats = () => { for (const k in BD.stats) BD.stats[k] = 0; };
  BD.h = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; };
  BD.hp = (list, ...a) => list[Math.min(list.length - 1, Math.floor(BD.h(...a) * list.length))];
  BD.cap = cap; BD.low = low;
  const clean = s => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  BD.clean = clean;
  BD.isPc = p => !!(p && A.S && p.id === A.S.pc);
  // pc.bonds: y (last year step), sec, hook, mine, b (budget when 21-npc-initiative is absent), cool
  BD.state = pc => {
    const s = pc.bonds && typeof pc.bonds === 'object' ? pc.bonds : (pc.bonds = {});
    for (const k of ['sec', 'hook', 'cool']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
    if (!Array.isArray(s.mine)) s.mine = [];
    if (typeof s.b !== 'number' || !Number.isFinite(s.b)) s.b = 0.5;
    return s;
  };
  BD.histOf = (pc, t) => pc && t && pc.rel && pc.rel[t.id] && Array.isArray(pc.rel[t.id].hist) ? pc.rel[t.id].hist : [];
  // the sum of what a bond remembers, held within M_CAP (pure)
  BD.mem = (pc, t) => clamp(BD.histOf(pc, t).reduce((a, e) => a + (e && typeof e.w === 'number' ? e.w : 0), 0), -BD.M_CAP, BD.M_CAP);
  BD.memOfRel = r => clamp((r && Array.isArray(r.hist) ? r.hist : []).reduce((a, e) => a + (e && typeof e.w === 'number' ? e.w : 0), 0), -BD.M_CAP, BD.M_CAP);

  // how long a line lasts: small kindness fades in a couple of years, a great wrong outlives a generation
  const INT_HALF = { time: 2, talk: 2, compliment: 2, train: 2, spar: 2, advice: 2, flirt: 2, gift: 3, date: 3, apologize: 3, recruit: 3,
    askmoney: 3, insult: 4, argue: 4, help: 5, breakup: 6, divorce: 10, propose: 8, swear: 15, duel: 6, murder: 25 };
  BD.half = (v, k) => {
    if (k && /^int:/.test(k)) { const h = INT_HALF[k.slice(4)]; if (h) return h; }
    const a = Math.abs(v || 0);
    return a < 8 ? 3 : a < 15 ? 6 : a < 30 ? 12 : 25;
  };

  // ---------------------------------------------------------------- writing a line

  // pruning keeps the heaviest memories: the weightless and the faded go first, the oldest of them first
  BD.prune = function (hist) {
    while (hist.length > BD.HIST) {
      let at = 0, best = Infinity;
      for (let i = 0; i < hist.length - 1; i++) { const w = Math.abs(hist[i] && typeof hist[i].w === 'number' ? hist[i].w : 0); if (w < best) { best = w; at = i; } }
      hist.splice(at, 1);
    }
  };
  const setW = (e, v, k) => {
    v = Math.round(v);
    if (!v) return e;
    if (typeof e.w !== 'number') { e.v = clamp(v, -BD.W_CAP, BD.W_CAP); e.w = e.v; e.h = BD.half(v, k || e.k); }
    else { e.v = clamp((e.v || 0) + v, -BD.W_CAP, BD.W_CAP); e.w = clamp(e.w + v, -BD.W_CAP, BD.W_CAP); e.h = Math.max(e.h || 0, BD.half(e.v, k || e.k)); }
    return e;
  };
  // m: { v weight, k kind (a repeat of the same kind within two years tops the old line up), s source, d deed clause,
  //      of / src (a memory carried from someone else), h half-life, y year }
  BD.add = function (pc, t, text, m) {
    if (!pc || !t || !pc.rel || !pc.rel[t.id]) return null;
    const s = clean(text);
    if (!s) return null;
    m = m || {};
    const r = pc.rel[t.id], hist = Array.isArray(r.hist) ? r.hist : (r.hist = []), yr = m.y != null ? m.y : A.S.year;
    if (m.k && m.v) {
      const old = hist.find(e => e && e.k === m.k && yr - e.y <= 2 && typeof e.w === 'number' && Math.sign(e.w) === Math.sign(m.v));
      if (old) { old.w = clamp(old.w + m.v * 0.5, -Math.max(Math.abs(m.v) * 2, 10), Math.max(Math.abs(m.v) * 2, 10)); old.v = Math.round(old.w); old.y = yr; old.t = s; return old; }
    }
    const last = hist[hist.length - 1];
    if (last && last.y === yr && last.t === s) { if (m.v) setW(last, m.v, m.k); return last; }
    const e = { y: yr, t: s };
    if (m.k) e.k = String(m.k).slice(0, 40);
    if (m.s) e.s = String(m.s).slice(0, 8);
    if (m.d) e.d = clean(m.d);
    if (m.of) e.of = clean(m.of);
    if (m.src) e.src = clean(m.src);
    if (m.v) setW(e, m.v, m.k);
    if (m.h) e.h = m.h;
    hist.push(e);
    BD.prune(hist);
    BD.stats.lines++;
    return e;
  };
  // the shared writer every feature calls (21-npc-initiative defined it; this one weighs and keeps the strong lines)
  A.bondNote = function (pc, t, text, y, meta) {
    const e = BD.add(pc, t, text, Object.assign({}, meta || {}, y != null ? { y } : {}));
    if (e && BD.win && BD.isPc(pc)) BD.win.noted[t.id] = e;
    return e;
  };

  // ---------------------------------------------------------------- windows: what an action did to each bond

  BD.win = null;
  BD.open = function (kind, info) {
    if (BD.win) { BD.win.depth++; return BD.win; }
    BD.win = Object.assign({ kind, depth: 1, acc: {}, noted: {} }, info || {});
    return BD.win;
  };
  BD.close = function () {
    const w = BD.win;
    if (!w) return;
    if (--w.depth > 0) return;
    BD.win = null;
    try { BD.flush(w); } catch (e) { console.error('bonds flush', e); }
  };
  BD.within = function (kind, info, fn) {
    BD.open(kind, info);
    try { return fn(); } finally { BD.close(); }
  };
  const addOp0 = A.addOp;
  A.addOp = function (a, b, d) {
    const w = BD.win;
    if (w && a && b && typeof d === 'number' && d && A.S) {
      const pid = A.S.pc;
      if (a.id === pid && a.rel && a.rel[b.id]) w.acc[b.id] = (w.acc[b.id] || 0) + d;
      else if (b.id === pid && b.rel && b.rel[a.id]) w.acc[a.id] = (w.acc[a.id] || 0) + d;
    }
    return addOp0.apply(this, arguments);
  };
  const link0 = A.link;
  A.link = function (a, b, type, op) {
    const w = BD.win, pid = A.S && A.S.pc;
    const before = w && a && b && a.id === pid && a.rel ? (a.rel[b.id] ? a.rel[b.id].op || 0 : null) : undefined;
    const res = link0.apply(this, arguments);
    if (w && before !== undefined && a.rel[b.id]) { const d = (a.rel[b.id].op || 0) - (before == null ? 0 : before); if (d) w.acc[b.id] = (w.acc[b.id] || 0) + d; }
    return res;
  };

  // past tense of an imperative label: "Pull him out" -> "you pulled him out" (null when the label is not a verb)
  const IRR = { take: 'took', tell: 'told', let: 'let', give: 'gave', go: 'went', make: 'made', keep: 'kept', send: 'sent', say: 'said', pay: 'paid',
    find: 'found', sell: 'sold', bring: 'brought', stand: 'stood', teach: 'taught', ride: 'rode', buy: 'bought', write: 'wrote', swear: 'swore',
    speak: 'spoke', leave: 'left', do: 'did', run: 'ran', put: 'put', hold: 'held', fight: 'fought', hide: 'hid', throw: 'threw', cut: 'cut',
    break: 'broke', forgive: 'forgave', read: 'read', sit: 'sat', have: 'had', drink: 'drank', get: 'got', be: 'were', lend: 'lent', meet: 'met',
    forbid: 'forbade', set: 'set', sing: 'sang', shoot: 'shot', lay: 'laid', shut: 'shut', choose: 'chose', feed: 'fed', lead: 'led', build: 'built',
    draw: 'drew', wake: 'woke', strike: 'struck', lose: 'lost', win: 'won', split: 'split', spread: 'spread', steal: 'stole', hear: 'heard',
    beat: 'beat', bite: 'bit', tear: 'tore', become: 'became', spend: 'spent', spit: 'spat', wear: 'wore', hang: 'hung', come: 'came',
    sweep: 'swept', sleep: 'slept', weep: 'wept', seek: 'sought', think: 'thought', catch: 'caught', fall: 'fell', grind: 'ground', dig: 'dug',
    deal: 'dealt', mean: 'meant', kneel: 'knelt', bear: 'bore', flee: 'fled', forget: 'forgot', know: 'knew', shake: 'shook', rise: 'rose',
    light: 'lit', bind: 'bound', withdraw: 'withdrew', undercut: 'undercut', outdo: 'outdid', repay: 'repaid', hit: 'hit', bet: 'bet', wed: 'wed',
    weave: 'wove', swim: 'swam', slay: 'slew', overlook: 'overlooked', mislead: 'misled', understand: 'understood', stick: 'stuck', sink: 'sank',
    show: 'showed', sew: 'sewed', lie: 'lied', die: 'died', tie: 'tied', panic: 'panicked', dive: 'dived', quit: 'quit', rid: 'rid',
    drive: 'drove', eat: 'ate', see: 'saw', bleed: 'bled', ring: 'rang', begin: 'began', creep: 'crept', spin: 'spun', bid: 'bid', bend: 'bent',
    cling: 'clung', sling: 'slung', fly: 'flew', freeze: 'froze', leap: 'leapt', breed: 'bred', cast: 'cast', stride: 'strode', swing: 'swung',
    sting: 'stung', slide: 'slid', shine: 'shone', undertake: 'undertook', mistake: 'mistook', foresee: 'foresaw', outrun: 'outran',
    oversee: 'oversaw', rebuild: 'rebuilt', retell: 'retold', resell: 'resold', rewrite: 'rewrote', unsay: 'unsaid', outbid: 'outbid',
    forecast: 'forecast', withhold: 'withheld', uphold: 'upheld', forswear: 'forswore', forsake: 'forsook', grow: 'grew', blow: 'blew',
    burst: 'burst', string: 'strung', shrink: 'shrank', shed: 'shed', slit: 'slit', thrust: 'thrust', tread: 'trod', wring: 'wrung',
    smite: 'smote', arise: 'arose', awake: 'awoke', speed: 'sped', feel: 'felt', spring: 'sprang', cost: 'cost', hurt: 'hurt', overhear: 'overheard',
    outride: 'outrode', outfight: 'outfought', outsell: 'outsold', outthink: 'outthought', overthrow: 'overthrew', upset: 'upset', unbind: 'unbound',
    traffic: 'trafficked', picnic: 'picnicked', mimic: 'mimicked' };
  const DBL = new Set(('beg slip step skip drop swap nod stop outwit nap spar chop drag tap rig acquit shrug plan slam trip tip rip admit ship rub rob pat grab hug ' +
    'jog plod sob stab trap wrap whip pin chip clap snap strip trim drum bar man club sip hum skim prop pan spur grit pen commit regret control patrol ' +
    'rebel expel compel refer prefer occur submit permit transfer confer equip ram jab dab hop mop shun stun tug wag fan jam cram hem ').trim().split(' '));
  const VERBS = new Set(('ask refuse warn report talk stay answer offer turn argue walk learn laugh accept call burn confront help listen paint share promise agree nurse ' +
    'work play demand shout join trade hand propose challenge settle haggle prove look decline point back obey deny open return watch use bargain raise ' +
    'wait end plead search push follow confess thank negotiate guide bribe pull sign pour try move complain love weigh hire organize insist court forge ' +
    'pass squeeze expose seat blame pretend vote cheat enjoy wish charm bow claim rally discipline test loosen ignore wrestle carve borrow raid question ' +
    'congratulate tease disown praise testify plant petition punish match train accuse track thrash saddle smile free persuade row dismiss shame press ' +
    'remind support preach escape glean scream debate calm consent apologize apologise rage spoil object worry acknowledge live remain sulk mend denounce ' +
    'disarm charge cheer crowd load plough wax study cook fine dismount haul bury hunt welcome wade sneak mention advise defend mock graze douse shoulder ' +
    'travel invite check remember receive chain judge appeal flatter box clean kiss exaggerate divide quote shoe measure brew finish sue close inform ' +
    'shelter face stitch prosecute deliver befriend undermine concede grieve count frighten cross humble earn cover sober compete announce trust drill ' +
    'collect draft sort threaten campaign summon requisition embrace oppose honor honour march vouch add shade miss nail double fetch knock fire sail ' +
    'water float pick save protect marry rescue visit kill spare guard bless pray curse gamble fix wash mark own side split greet thank refuse sell ' +
    'dress bandage treat heal tend hurry slow chase release arrest hire fire lift carry open sign seal flee wave pardon spurn reject scold comfort ' +
    'console kneel salute toast question interrogate execute hang banish exile adopt foster ' +
    // added in the writer's pass: every verb the release's and the features' labels start with that the list above missed
    'climb name copy volunteer dance serve enter gather start lower recite seize swallow fill rest grant steer change endure shore race broker lean ' +
    'stare mind starve declare order arrange recommend rule drain translate chant describe lock rope contest ration jump reach practise practice ' +
    'apprentice force forage cry kick admire poison explain correct attack tighten bang rent believe pledge rebury untie anchor cite ford pole spear ' +
    'farm flatten board reap bare scratch daydream decide act fish proclaim salvage spy host aim protest store partner drown audit pawn certify ' +
    'investigate unpick stretch pack roll smother pilot resign apply pose shadow lash mine crawl breathe whisper smoke queue lease fake melt loot ' +
    'winter loose explore snatch patch pool stake outwork squint organise shield sprint stalk picket hack burrow crouch shirk celebrate dare present ' +
    'rock pinch toddle groom parley survey resow salt master bluff beach yield mortgage recognize recognise trace abstain smooth retaliate punch ease ' +
    'mix approach attempt replace fortify elope rekindle unhorse excuse mouth perform mourn redeem canvass scatter publish clear mediate recuse twist ' +
    'destroy govern soften sharpen convince unchain cure dedicate coach sentence switch shorten fail spill dry sound paste captain shave warm fell ' +
    'found second fast bathe wipe scrub sweat haggle hammer mend polish pray recover repair rescue retreat return ride sketch sow tally taste thatch ' +
    'tidy wander whittle yell bellow hail signal tally listen beckon nudge shove grip clutch hug stroke pet soothe rouse warn hush silence summon ' +
    'gossip boast brag joke jest flirt woo serenade marvel ponder pace kneel linger loiter lurk dodge duck parry block feint lunge charge withdraw ' +
    'surrender yield insist interrupt accompany escort lead obey defy rebuke chide forbid permit allow urge beg bargain barter haggle wager tip ' +
    'reward fine tax levy muster recruit drill arm disband pay hide bury exhume unearth dig plant harvest thresh mill bake brew ferment hope pretend ' +
    'keep wish').split(' ').concat(Object.keys(IRR), [...DBL]));
  const pastOf = w => {
    if (IRR[w]) return IRR[w];
    if (DBL.has(w)) return w + w.slice(-1) + 'ed';
    if (/e$/.test(w)) return w + 'd';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
    return w + 'ed';
  };
  // the first clause of a label: "Laugh, and teach him" -> "Laugh"; "Decline: you cannot" -> "Decline"
  const firstClause = s => clean(s).replace(/[“”‘’]/g, '').split(/\s*[,:;(—–]\s*|\s+-\s+/)[0].replace(/[.!?]+$/, '').trim();
  // words a label can start with that are not a verb: such a label is not turned into a deed
  const NOT_VERB = new Set(('a an the your his her their my our its this that these those yes no not never nothing none all both neither either one two ' +
    'three some any every each it they them we i you he she just only very quietly simply finally half more less much still also too so then now again ' +
    'over out up down in on off with without for from to by of at as because if but and or nor what who why how where when well fine good perhaps maybe ' +
    'certainly gladly sir madam lord lady ' +
    'something someone anything everything once before after next first last money fists patience peace honest mostly actually mama dada cup poppy ' +
    'willow goat aye nay alone together tonight today tomorrow later soon here there enough thanks please').split(' '));
  // an adverb before the verb stays with it: "Quietly pay him" -> "you quietly paid him"; "Just listen" -> "you listened"
  const ADV = { just: '', simply: '', only: 'only ', quietly: 'quietly ', gently: 'gently ', calmly: 'calmly ', politely: 'politely ', firmly: 'firmly ',
    openly: 'openly ', slowly: 'slowly ', carefully: 'carefully ', quickly: 'quickly ', finally: 'finally ', still: 'still ', humbly: 'humbly ',
    boldly: 'boldly ', coldly: 'coldly ', warmly: 'warmly ', meekly: 'meekly ', bluntly: 'bluntly ', loudly: 'loudly ', silently: 'silently ',
    secretly: 'secretly ', honestly: 'honestly ', gladly: 'gladly ', kindly: 'kindly ', sternly: 'sternly ', briskly: 'briskly ' };
  // a short answer is a thing said: "Yes" -> "you said yes"; "Neither" -> "you chose neither"
  const SAID = { yes: 'you said yes', aye: 'you said yes', no: 'you said no', nay: 'you said no', never: 'you said never', nothing: 'you said nothing' };
  const CHOSE = new Set(['neither', 'both', 'none', 'either']);
  // words that are verbs but after "and" are more often a thing: "the bread and water", "your name and face"
  const NOUNISH = new Set(('water back face shoulder box nail side mark wax fire sail shade row crowd load shoe measure brew cover cross match plant ' +
    'train track saddle smile wave toast seal sign float double own open love trade hand chain court question salt mine pool stake shield picket ' +
    'host store partner board spear pole ford rope lock order rule rest change race present master ration fast second found fell cup coach ' +
    'sentence switch sound paste captain winter patch trace mouth fish smoke queue shadow lash roll pack pilot audit spy aim protest step drop ' +
    'trip tip ship pin chip strip drum bar man club pen fan jam').split(' '));
  // a second verb after "and", "or" or "then" goes into the past tense too: "Rock him and sing" -> "you rocked him and sang".
  // A word after it that is a pronoun, a name or a thing stays as it was ("the bread and cheese")
  // after "make him", "let her", "help them" the next verb is theirs, not yours: "Make him confess and pay" stays as it is
  const CAUSE = new Set(['make', 'let', 'have', 'help', 'watch', 'see', 'hear', 'bid', 'leave']);
  const andVerbs = rest => rest.replace(/\b(and|or|then)\s+([a-z]+)\b/g, (m, c, x) => (VERBS.has(x) && !NOUNISH.has(x) && !NOT_VERB.has(x) ? `${c} ${pastOf(x)}` : m));
  // how a failed attempt ends, picked by the label so the same choice always reads the same
  const PHR = { 'lie low': 'lay low', 'lie down': 'lay down', 'lie still': 'lay still', 'lie quiet': 'lay quiet', 'lie awake': 'lay awake', 'lie in': 'lay in',
    'lie with': 'lay with', 'lie back': 'lay back', 'lie flat': 'lay flat', 'lie hidden': 'lay hidden' };
  const FAILED = [', and failed', ', and could not', ', and it went wrong', ', and it came to nothing'];
  const failTail = (label, from) => FAILED[from + Math.floor(BD.h(label, 'fail') * (FAILED.length - from))];
  BD.deedOf = function (label, failed) {
    const c = firstClause(label);
    const m = c.match(/^([A-Za-z]+)\b(.*)$/);
    if (!m) return null;
    let w = m[1].toLowerCase(), rest = m[2], adv = '';
    if (SAID[w] && !/\S/.test(rest)) return failed ? SAID[w] + failTail(label, 2) : SAID[w];
    if (CHOSE.has(w) && !/\S/.test(rest)) return `you chose ${w}`;
    if (ADV[w] != null) {
      const m2 = rest.match(/^\s+([a-z]+)\b(.*)$/);
      if (!m2 || !VERBS.has(m2[1])) return null;
      adv = ADV[w]; w = m2[1]; rest = m2[2];
    }
    if (NOT_VERB.has(w)) return null;
    if (failed) return `you tried to ${adv}${w}${rest}${failTail(label, 0)}`;
    // a verb this list knows goes into the past tense; any other first word is taken as a verb all the same
    // "Lie low" is not "lie to him": a verb with a word after it that changes its past
    const two = (w + ' ' + (rest.match(/^\s+([a-z]+)/) || ['', ''])[1]).trim();
    if (PHR[two]) return `you ${adv}${PHR[two]}${rest.replace(/^\s+[a-z]+/, '')}`.replace(/\s+$/, '');
    return VERBS.has(w) ? `you ${adv}${pastOf(w)}${CAUSE.has(w) ? rest : andVerbs(rest)}` : `you chose to ${adv}${w}${rest}`;
  };
  BD.pastOf = pastOf;
  BD.VERBS = VERBS;
  // past forms, for a deed told in other words ("that she won the tournament")
  BD.PAST = new Set(Object.values(IRR));

  // what a window writes when nothing more particular was noted
  const INT_TEXT = {
    time: 'You spent a day together', talk: 'A long talk', compliment: 'You paid {khim} a compliment', gift: 'You gave {khim} a gift',
    advice: 'You asked {khis} advice', train: 'You trained together', spar: 'You sparred', insult: 'You insulted {khim}', argue: 'You quarrelled',
    flirt: 'You flirted with {khim}', date: 'You courted {khim}', apologize: 'You apologised to {khim}', help: 'You helped {khim}',
    swear: 'You swore to stand by each other', recruit: 'You asked {khim} to join your company', breakup: 'You broke it off', divorce: 'You set {khim} aside',
    askmoney: 'You asked {khim} for money', duel: 'You challenged {khim} to a duel', murder: 'You tried to have {khim} killed',
  };
  const fillT = (t, s) => s.replace(/\{khim\}/g, A.him(t)).replace(/\{khis\}/g, A.his(t)).replace(/\{khe\}/g, A.he(t));
  BD.genLine = function (w, t, v) {
    if (w.kind === 'event') {
      const title = clean(w.title || ''), deed = BD.deedOf(w.label || '', w.success === false);
      // "The toll: you paid it"; a title that asks or cries out takes the deed as its own sentence ("Can you help? You helped")
      const head = d => (/[?!]$/.test(title) ? `${title} ${cap(d)}` : `${title}: ${d}`);
      if (deed) return { t: title ? head(deed) : cap(deed), d: deed, k: 'ev:' + (w.ev || '') + ':' + t.id };
      const cl = low(firstClause(w.label || ''));
      if (title) { const d = cl.split(' ').length >= 2 ? `you chose ${cl}` : `you gave your answer`; return { t: head(d), d, k: 'ev:' + (w.ev || '') + ':' + t.id }; }
      return null;
    }
    if (w.kind === 'int') { const s = INT_TEXT[w.key]; return s ? { t: fillT(t, s), d: low(fillT(t, s)), k: 'int:' + w.key } : null; }
    if (w.kind === 'duel') {
      const D = w.D || {}, won = D.result === 'win' || D.result === 'beastfled';
      const s = won ? `You beat ${A.him(t)} in a fight` : D.result === 'fled' ? `You ran from a fight with ${A.him(t)}` : D.result === 'draw' ? `You fought ${A.him(t)} to a draw` : `${cap(A.he(t))} beat you in a fight`;
      return { t: s, d: low(s), k: 'duel:' + t.id };
    }
    if (w.kind === 'favor') { const s = `You called in a favour ${A.he(t)} owed you`; return { t: s, d: low(s), k: 'fav:' + t.id }; }
    return null;
  };
  BD.flush = function (w) {
    const pc = A.pc();
    if (!pc || !pc.rel) return;
    const ids = new Set(Object.keys(w.acc).concat(Object.keys(w.noted)));
    for (const pid of ids) {
      const t = A.P(pid), v = Math.round(w.acc[pid] || 0), e = w.noted[pid];
      if (!t || !pc.rel[pid]) continue;
      if (e) {
        if (!e.k && w.kind === 'int' && w.key) e.k = 'int:' + w.key;   // an interaction's line fades at its own pace
        if (Math.abs(v) >= 2) { setW(e, v, e.k); BD.stats.led += Math.abs(v); BD.stats.ledN++; }
        if (!e.d && w.kind === 'event') { const deed = BD.deedOf(w.label || '', w.success === false); if (deed && pid === String(w.pid)) e.d = deed; }
        continue;
      }
      if (Math.abs(v) < BD.MIN) continue;
      const g = BD.genLine(w, t, v);
      if (!g) continue;
      BD.add(pc, t, g.t, { v, k: g.k, s: w.npc ? 'npc' : w.kind, d: g.d });
      BD.stats.led += Math.abs(v); BD.stats.ledN++;
    }
  };

  // the windows
  const evChoose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0];
    if (!q || q.type !== 'event' || q.result) return evChoose.apply(this, arguments);
    const v = q.view || A.eventView(q), vc = v && v.choices ? v.choices[idx] : null;
    const pc = A.pc(), pid = q.ctx && q.ctx.pid;
    // the bench's question: does this event cite what passed between you (in its text, or under it)?
    try {
      BD.stats.events++;
      const t = pid && A.P(pid);
      if (t && pc && pc.rel[pid] && t.id !== pc.id) {
        BD.stats.pidEvents++;
        const by = BD.citesInText(q, v);
        if (by) { BD.stats.textCites++; BD.stats['cite_' + by] = (BD.stats['cite_' + by] || 0) + 1; }
        else if (BD.aside(pc, t, v)) BD.stats.asides++;
      }
    } catch (e) { console.error('bonds cite', e); }
    const info = { ev: q.ev, title: v && v.title, label: vc && vc.t, pid, npc: !!(q.ctx && q.ctx.npcMove) || !!(A.EV[q.ev] && A.EV[q.ev].npc) };
    BD.open('event', info);
    const was = BD.blameCtx;
    // a death of the person a scheme's scene is about is your doing (39-schemes' poison or knife); a death in any other
    // scene is not (a deathbed, a fever, a stranger dying on the road): their kin take up the memories instead
    BD.blameCtx = pid && q.ctx && q.ctx.sc ? { pid: String(pid), how: 'scheme' } : null;
    try {
      const r = evChoose.apply(this, arguments);
      if (BD.win) BD.win.success = q.result ? q.result.success : null;
      return r;
    } finally { BD.blameCtx = was; BD.close(); }
  };
  // who a death right now would be blamed on: { pid, how } while the player acts on that person (part 3 reads it)
  BD.blameCtx = null;
  BD.blaming = (pid, how, fn) => { const was = BD.blameCtx; BD.blameCtx = pid != null ? { pid: String(pid), how } : null; try { return fn(); } finally { BD.blameCtx = was; } };
  const interact0 = A.interact;
  A.interact = function (tid, key) {
    return BD.within('int', { key, pid: tid }, () => interact0.apply(this, arguments));
  };
  if (typeof A.duelConsequences === 'function') {
    const dc = A.duelConsequences;
    A.duelConsequences = function (D) {
      const foe = D && D.b && D.b.pid;
      return BD.blaming(foe, 'duel', () => BD.within('duel', { D, pid: foe }, () => dc.apply(this, arguments)));
    };
  }
  if (typeof A.duelClose === 'function') {
    const dcl = A.duelClose;
    A.duelClose = function () {
      const q = A.S.queue[0], D = q && q.type === 'duel' ? q.d : null;
      return BD.within('duel', { D, pid: D && D.b && D.b.pid }, () => dcl.apply(this, arguments));
    };
  }
  if (typeof A.callFavor === 'function') {
    const cf = A.callFavor;
    A.callFavor = function (tid) { return BD.within('favor', { pid: tid }, () => cf.apply(this, arguments)); };
  }
  if (typeof A.getToKnow === 'function') {
    const gk = A.getToKnow;
    A.getToKnow = function (pid) { return BD.within('know', { pid }, () => gk.apply(this, arguments)); };
  }

  // ---------------------------------------------------------------- the year: memories fade, and move opinion

  BD.year = function (pc) {
    const st = BD.state(pc), y = A.S.year;
    if (st.y === y) return;
    const first = st.y == null;
    st.y = y;
    if (first) return;
    for (const id of Object.keys(pc.rel || {})) {
      const r = pc.rel[id], hist = Array.isArray(r.hist) ? r.hist : null;
      if (!hist || !hist.length) continue;
      for (const e of hist) {
        if (!e || typeof e.w !== 'number') continue;
        e.w = e.w * Math.pow(0.5, 1 / Math.max(1, e.h || 3));
        if (Math.abs(e.w) < 1) e.w = 0;
        else e.w = Math.round(e.w * 10) / 10;
      }
      const t = A.P(id);
      if (!t || !t.alive) continue;
      const M = BD.memOfRel(r);
      if (Math.abs(M) < 2) continue;
      // their side (the number the engine reads), then yours
      const sides = [t.rel && t.rel[pc.id], r];
      let moved = 0;
      for (const s of sides) {
        if (!s || typeof s.op !== 'number') continue;
        const gap = M - s.op;
        if ((M > 0 && gap > 0) || (M < 0 && gap < 0)) {
          const d = Math.sign(gap) * Math.min(Math.abs(gap), Math.max(1, Math.round(Math.abs(gap) * BD.PULL)));
          s.op = clamp(s.op + d, -100, 100);
          moved += Math.abs(d);
        }
      }
      if (moved) { r.mp = { y, d: Math.sign(M) * moved }; BD.stats.pull += moved; BD.stats.pullN++; }
    }
  };
  // strong memories keep a bond from being forgotten: the release drops quiet acquaintances after three years and
  // quiet foes after four; a bond whose memories still weigh HOLD or more is put back as it was
  if (typeof A.bondsYear === 'function') {
    const by = A.bondsYear;
    A.bondsYear = function (pc) {
      const keep = [];
      try {
        if (pc && pc.rel) for (const id of Object.keys(pc.rel)) {
          const r = pc.rel[id];
          if (Math.abs(BD.memOfRel(r)) >= BD.HOLD) { const p = A.P(id); keep.push([id, r, p && p.rel ? p.rel[pc.id] : null, p]); }
        }
      } catch (e) {}
      const res = by.apply(this, arguments);
      for (const [id, r, back, p] of keep) {
        if (!pc.rel[id]) pc.rel[id] = r;
        if (p && p.rel && back && !p.rel[pc.id]) p.rel[pc.id] = back;
      }
      return res;
    };
  }

  // ---------------------------------------------------------------- citing a line (pure)

  // the line most worth quoting: from an earlier year, still weighing `min`, of the asked sign; the heaviest, then the latest
  BD.cite = function (pc, t, o) {
    o = o || {};
    const hist = BD.histOf(pc, t), y = A.S.year, min = o.min != null ? o.min : 4;
    let best = null;
    for (const e of hist) {
      if (!e || typeof e.t !== 'string' || typeof e.w !== 'number' || e.y >= y - (o.age || 0) || Math.abs(e.w) < min) continue;
      if (o.sign && Math.sign(e.w) !== o.sign) continue;
      if (o.kin != null && (!!e.of || e.s === 'kin') !== !!o.kin) continue;
      if (!best || Math.abs(e.w) > Math.abs(best.w) || (Math.abs(e.w) === Math.abs(best.w) && e.y > best.y)) best = e;
    }
    return best;
  };
  // a deed of a word or two ("you accepted") carries the scene's title when the title names a thing: "you accepted (the
  // toll at the bridge)", as 67-memory-weave does
  BD.deedLine = e => {
    const d = e.d || low(e.t), m = e.d && (e.d.split(' ').length <= 3 || e.d === 'you gave your answer') && /^((?:A|An|The) [a-z][^:?!]{2,50}):/.exec(e.t || '');
    return m && !/[{}]/.test(m[1]) ? `${d} (${low(m[1])})` : d;
  };
  // "She has not forgotten 1112, when you insulted her at the fair."
  BD.citeLine = function (pc, t, e) {
    if (!e) return '';
    const He = cap(A.he(t)), his = A.his(t);
    if (e.of) return e.w > 0 ? `${He} knows what you did for ${his} ${e.of} in ${e.y}: ${e.src || low(e.t)}.` : `${He} has not forgotten what passed between you and ${his} ${e.of} in ${e.y}: ${e.src || low(e.t)}.`;
    return e.w > 0 ? `${He} still speaks of ${e.y}, when ${BD.deedLine(e)}.` : `${He} has not forgotten ${e.y}, when ${BD.deedLine(e)}.`;
  };
  // {history} for any event with ctx.pid (an event that uses it is dropped when there is nothing to quote, as with any
  // unfilled token); {histYear} and {histDeed} for events that want their own sentence
  const tokens = A.ctxTokens;
  A.ctxTokens = function (pc, ctx) {
    const o = tokens.apply(this, arguments);
    try {
      if (ctx && ctx.pid && pc && o.history == null) {
        const t = A.P(ctx.pid), e = t && BD.cite(pc, t);
        if (e) { o.history = BD.citeLine(pc, t, e); o.histYear = String(e.y); o.histDeed = BD.deedLine(e); }
      }
    } catch (e) {}
    return o;
  };
  // does this event's text already quote the past? (this feature's events, 21-npc-initiative's {past}, or {history})
  // which: 'bd' (a scene of this feature), 'past' (21-npc-initiative's {past}), 'token' ({history} in any other event)
  BD.citesInText = function (q, v) {
    const ctx = q.ctx || {}, text = (v && v.text) || '';
    if (ctx.bdCite) return 'bd';
    if (ctx.past && String(ctx.past).trim() && text.includes(String(ctx.past).trim().slice(0, 30))) return 'past';
    return /(has not forgotten|still speaks of|You both remember|knows what you did for)[^.]*\b1\d{3}\b/.test(text) ? 'token' : '';
  };
  // the line under an event about someone you share history with, unless the text already cites it (pure)
  BD.aside = function (pc, t, v) {
    if (!pc || !t || !pc.rel || !pc.rel[t.id] || t.id === pc.id) return '';
    const e = BD.cite(pc, t, { min: BD.CITE });
    if (!e) return '';
    if (v && v.text && v.text.includes(String(e.y))) return '';
    return `Between you: ${e.y}, ${BD.deedLine(e)}.`;
  };
  if (typeof UI.eventModal === 'function') {
    const em = UI.eventModal;
    UI.eventModal = function (q) {
      const h = em.apply(this, arguments);
      try {
        const pc = A.pc(), pid = q && q.ctx && q.ctx.pid, t = pid && A.P(pid);
        if (!t || !pc || q.result || BD.citesInText(q, q.view)) return h;
        const line = BD.aside(pc, t, q.view);
        if (!line) return h;
        const at = h.indexOf('<div class="mtext">');
        const end = at >= 0 ? h.indexOf('</div>', at) : -1;
        return end > 0 ? h.slice(0, end + 6) + `<div class="tiny muted bd-past" style="margin-top:4px">${UI.esc(line)}</div>` + h.slice(end + 6) : h;
      } catch (e) { return h; }
    };
  }

  // ---------------------------------------------------------------- the person view: what has passed between you (pure)

  const fmtW = e => {
    if (typeof e.w !== 'number') return '';
    const w = Math.round(e.w);
    if (!w) return '<span class="tiny muted"> · faded</span>';
    const fading = Math.abs(e.w) < Math.abs(e.v || e.w) * 0.6;
    return ` <span class="tiny ${w > 0 ? 'good' : 'bad'}">${w > 0 ? '+' : '−'}${Math.abs(w)}${fading ? ', fading' : ''}</span>`;
  };
  BD.histHtml = function (pc, t, r) {
    const h = r && Array.isArray(r.hist) ? r.hist.filter(e => e && typeof e.t === 'string') : [];
    if (!h.length) return '';
    const M = Math.round(BD.memOfRel(r));
    const sum = Math.abs(M) >= 2 ? `<div class="tiny ${M > 0 ? 'good' : 'bad'}">${UI.esc(M > 0 ? `What you have been to each other holds ${A.his(t)} opinion of you up (${'+' + M}).` : `What has passed between you pulls ${A.his(t)} opinion of you down (−${Math.abs(M)}).`)}</div>` : '';
    return `<div class="bond-hist" style="margin-top:6px"><div class="tiny muted">What has passed between you</div>${sum}` +
      h.slice().reverse().map(e => `<div class="small prof-li"><span class="muted">${UI.esc(String(e.y))}</span> ${UI.esc(e.t)}${fmtW(e)}</div>`).join('') + '</div>';
  };
  // 21-npc-initiative's patch calls UI.bondHist in the person view; secrets (part 2) add to it through BD.personExtra
  BD.personExtra = BD.personExtra || [];
  UI.bondHist = function (pc, t, r) {
    let h = '';
    try { h = BD.histHtml(pc, t, r); } catch (e) { h = ''; }
    for (const f of BD.personExtra) { try { h += f(pc, t, r) || ''; } catch (e) {} }
    return h;
  };
  // without that patch (a build without 21-npc-initiative) the same block goes in after "Between you"
  if (typeof UI.personModal === 'function') {
    const pm = UI.personModal;
    UI.personModal = function (t) {
      const h = pm.apply(this, arguments);
      try {
        if (h.includes('class="bond-hist"') || h.includes('class="bd-sec')) return h;
        const pc = A.pc(); if (!pc || !t || !pc.rel[t.id]) return h;
        const block = UI.bondHist(pc, t, pc.rel[t.id]);
        if (!block) return h;
        const at = h.indexOf('<div class="group-h">Between you</div>');
        if (at < 0) return h;
        const row = h.indexOf('</div>', h.indexOf('<div class="row small">', at));
        return row > 0 ? h.slice(0, row + 6) + block + h.slice(row + 6) : h;
      } catch (e) { return h; }
    };
  }

  // ---------------------------------------------------------------- condition helpers

  // C.bondMemory(p, sign, dead): someone you share a remembered line with (weight 10 or more, from an earlier year)
  A.C.bondMemory = (p, sign, dead) => {
    if (!p || !p.rel) return false;
    for (const id in p.rel) {
      const t = A.P(id);
      if (!t || (dead ? t.alive : !t.alive)) continue;
      if (BD.cite(p, t, { min: 10, sign: sign || 0 })) return true;
    }
    return false;
  };

  // ---------------------------------------------------------------- fx.bonds: one effect key for all three parts

  // fx.bonds = { settle: 0.3 } etc.; each part registers its handlers in BD.FX (handler(pc, value, ctx, fx) -> text)
  (A.FX_EXTRA = A.FX_EXTRA || []).push('bonds');
  BD.FX = BD.FX || {};
  const apply0 = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply0.apply(this, arguments);
    let out = '';
    try {
      const v = fx && typeof fx === 'object' ? fx.bonds : null;
      if (v && typeof v === 'object' && pc && BD.isPc(pc)) for (const k of Object.keys(v)) if (BD.FX[k]) { const s = BD.FX[k](pc, v[k], ctx || {}, fx); if (typeof s === 'string' && s) out += (out ? ' ' : '') + s; }
      if (fx && typeof fx === 'object' && BD.onFx) for (const f of BD.onFx) f(pc, fx, ctx || {});
    } catch (e) { console.error('bonds fx', e); }
    return out ? [r, out].filter(Boolean).join(' ') : r;
  };
  BD.onFx = BD.onFx || [];

  // the line an event is about (ctx.hy, ctx.ht set by its setup)
  BD.lineOf = (pc, ctx) => { const t = A.P(ctx.pid); return t ? BD.histOf(pc, t).find(e => e && e.y === +ctx.hy && e.t === ctx.ht) || null : null; };
  // settle: what is left of the line shrinks to this share (an apology, blood money); refresh: back to full weight;
  // spend: a debt called in, halved
  BD.FX.settle = (pc, f, ctx) => { const e = BD.lineOf(pc, ctx); if (e && typeof e.w === 'number') { e.w = Math.round(e.w * clamp(+f || 0, 0, 1) * 10) / 10; e.set = A.S.year; } return ''; };
  BD.FX.refresh = (pc, f, ctx) => { const e = BD.lineOf(pc, ctx); if (e && typeof e.w === 'number') e.w = Math.sign(e.w || e.v || 0) * Math.max(Math.abs(e.w), Math.abs(e.v || 0)); return ''; };
  BD.FX.spend = (pc, f, ctx) => { const e = BD.lineOf(pc, ctx); if (e && typeof e.w === 'number') e.w = Math.round(e.w * 0.5 * 10) / 10; return ''; };
  // note: a line of its own for this choice, with its weight: { t: 'You apologised for {hy}', v: 8 }
  BD.FX.note = (pc, n, ctx) => {
    const t = A.P(ctx.pid); if (!t || !pc.rel[t.id] || !n) return '';
    const text = A.T(String(n.t || n), A.ctxTokens(pc, ctx));
    const e = A.bondNote(pc, t, cap(text), null, { k: n.k || null, s: 'you' });
    if (e && n.v && !BD.win) setW(e, n.v);
    return '';
  };

  // setup for an event about one past line of the bond with ctx.pid (sign +1 good, -1 bad; kin: a line about their kin)
  BD.pastSetup = (sign, o) => (p, ctx) => {
    o = o || {};
    const t = A.P(ctx.pid);
    if (!t || !t.alive || t.id === p.id || !p.rel[t.id]) { ctx.skip = true; return; }
    const e = BD.cite(p, t, { sign, min: o.min || 8, kin: o.kin != null ? o.kin : null, age: o.age || 0 });
    if (!e) { ctx.skip = true; return; }
    ctx.hy = e.y; ctx.ht = e.t; ctx.hline = BD.citeLine(p, t, e); ctx.hdeed = BD.deedLine(e); ctx.bdCite = 1;
    ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);
    if (e.of) ctx.hof = e.of;
    if (o.then) o.then(p, ctx, t, e);
  };
  // a sum that suits both purses (as 21-npc-initiative does)
  const CAPS = { slave: 20, serf: 30, peasant: 60, artisan: 150, merchant: 500, gentry: 800, noble: 2000, royal: 5000 };
  BD.sum = (pc, t, frac, lo) => {
    let v = Math.round(Math.max(lo, Math.min((pc.coin || 0) * frac, CAPS[t.status] || 100)));
    if ((pc.coin || 0) < v) v = Math.max(1, Math.floor((pc.coin || 0) * 0.5));
    return v;
  };
  BD.coin = n => (A.coin ? A.coin(n) : n + ' suns');

  // ---------------------------------------------------------------- NPC moves that come out of the history

  // Registered as kinds of 21-npc-initiative's monthly move (its budget, cooldowns, trait weights and "why" line).
  // Without that feature a small budget of its own runs them (BD.solo).
  BD.KINDS = BD.KINDS || {};
  BD.kind = function (k, K) {
    K = Object.assign({ near: .5, adult: 1, tr: {}, mot: {} }, K);
    BD.KINDS[k] = K;
    if (A.NPCI && A.NPCI.KINDS) A.NPCI.KINDS[k] = K;
  };
  const has = (p, t) => !!(p && Array.isArray(p.traits) && p.traits.includes(t));
  // someone you did right by, years ago, comes back with something
  BD.kind('bd_kind', { ev: 'bd_old_kindness', g: 'warm', base: .8, op: 15,
    tr: { generous: 1.6, loyal: 1.5, kind: 1.3, gregarious: 1.2, honest: 1.1, greedy: .6, proud: .8 }, mot: { kin: .3, faith: .2 },
    sit: (pc, t) => BD.cite(pc, t, { sign: 1, min: 10, age: 2, kin: false }) ? 1.6 : 0 });
  // someone you wronged brings it up
  BD.kind('bd_wrong', { ev: 'bd_old_wrong', g: 'hostile', base: 1, op: 0, near: .3,
    tr: { vengeful: 2, wrathful: 1.6, proud: 1.5, stubborn: 1.3, forgiving: .3, calm: .5, kind: .6 }, mot: { feud: 1 },
    sit: (pc, t) => BD.cite(pc, t, { sign: -1, min: 10, age: 1, kin: false }) ? 1.6 : 0 });
  // the kin of someone you wronged, or killed
  BD.kind('bd_blood', { ev: 'bd_kin_grudge', g: 'hostile', base: 1.2, op: -10, near: .3,
    tr: { vengeful: 2, wrathful: 1.5, brave: 1.3, proud: 1.2, forgiving: .3, craven: .5 }, mot: { feud: 1 },
    sit: (pc, t) => BD.cite(pc, t, { sign: -1, min: 12, kin: true }) ? 2 : 0 });
  // the kin of someone you did right by
  BD.kind('bd_heirloom', { ev: 'bd_kin_debt', g: 'warm', base: .9, op: 10,
    tr: { loyal: 1.5, generous: 1.3, honest: 1.2, greedy: .8 }, mot: { kin: .4 },
    sit: (pc, t) => BD.cite(pc, t, { sign: 1, min: 8, kin: true }) ? 1.6 : 0 });

  // without 21-npc-initiative: about 0.6 of these moves a year, from whoever wants one most (engine only)
  BD.solo = function (pc) {
    if (A.NPCI || !A.isAdult(pc) || pc.prison) return;
    const st = BD.state(pc);
    st.b = Math.min(2, st.b + 0.6 / 12);
    if (st.b < 1 || A.S.queue.some(q => q && q.ctx && q.ctx.npcMove && !q.result) || !A.chance(0.3)) return;
    const list = [];
    for (const id of Object.keys(pc.rel || {})) {
      const r = pc.rel[id], t = A.P(id);
      if (!t || !t.alive || !A.isAdult(t) || t.prison || (st.cool[id] && A.S.year - st.cool[id] < 3)) continue;
      const o = t.rel && t.rel[pc.id] ? t.rel[pc.id].op : (r.op || 0) * .8;
      for (const k of Object.keys(BD.KINDS)) {
        const K = BD.KINDS[k];
        if (K.g === 'hostile' ? o > K.op + 15 * (t.traits || []).filter(x => (K.tr[x] || 0) >= 1.5).length : o < K.op) continue;
        let w = K.base * (K.sit(pc, t, r, o) || 0);
        if (!w) continue;
        for (const x of t.traits || []) if (K.tr[x]) w *= K.tr[x];
        if (w >= .15) list.push({ t, k, w });
      }
    }
    const x = list.length ? A.wpick(list, z => z.w) : null;
    if (!x) return;
    st.b -= 1; st.cool[x.t.id] = A.S.year;
    A.queue({ type: 'event', ev: BD.KINDS[x.k].ev, ctx: { pid: x.t.id, npcMove: true, nk: x.k } });
  };
  BD.has = has;

  A.onMonth.push(pc => { if (pc && pc.alive && BD.isPc(pc)) { BD.year(pc); BD.solo(pc); } });
})();
