// The fight audit (Road to Ten, Power 1). Reads every event choice and says whether it is a fight, the scale it assumes
// (one person, a party or an army; an animal, a great beast or a titan), what decides it (a plain check, fighting worth,
// the group resolver, the duel) and what it can cost (death, a maiming wound, a bad hurt). Pure: it reads A.EV and the
// bestiary and changes nothing. fight.core.js routes fights through fighting worth with the spec FL.spec builds from these
// tags, and bench/fights-audit.mjs runs A.FL.audit() on any build (it loads this file into builds that lack it).
const FL = A.FL = A.FL || {};

// ---- reading an event --------------------------------------------------------------------------------------------
// the words a player reads: the string literals of a function's source, or the string itself (code is not prose)
FL.words = function (x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (typeof x !== 'function') return '';
  const s = String(x), out = [];
  for (const m of s.matchAll(/`((?:[^`\\]|\\.)*)`|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)) out.push(m[1] || m[2] || m[3] || '');
  return out.join(' ');
};
const low = x => FL.words(x).toLowerCase();
const fnSrc = x => typeof x === 'function' ? String(x) : '';

FL.COMBAT = ['melee', 'sword', 'axe', 'spear', 'dagger', 'dualwield', 'shield', 'unarmed', 'lance', 'mounted'];
FL.RANGED = ['bow', 'xbow', 'throwing'];
FL.BODY = ['str', 'spd', 'ins', 'sta', 'wil', 'athletics'];
FL.WEAPON_OF = { sword: 'sword', axe: 'axe', spear: 'spear', dagger: 'dagger', unarmed: 'fists', lance: 'lance' };

const RX = FL.RX = {
  // a label that fights
  act: /\b(fight|fights|fighting|draw (?:steel|your|a |the |his |her |my |both)|steel out|strike|attack|charge (?:into|at|in|down|home|them|him|her|it|the (?:line|wall|gate|enemy|beast|boar|bear|scrum)|first|straight|without)|kill|slay|wrestle|grapple|punch|brawl|duel|stand (?:and fight|your ground|firm|fast|over|in the (?:gap|line|front|ditch|door))|hold (?:the|your|this) (?:line|ground|bridge|gate|door|wall|pass|ford|stair|breach|road|heap|gap|rank)|hold (?:it|them) (?:off|back|with)|defend|cut (?:him|her|them|it|down|your way|through)|stab|spear (?:it|him|the)|face (?:it|him|her|them|the)|take (?:them|him|her|it) (?:on|all|down)|go for (?:him|her|it|the|his|its|their)|rush (?:him|her|them|it|the)|tackle|swing|fists|hit (?:him|her|it|them|back|first)|beat (?:him|her|them|it|\{\w+\})|lunge|meet (?:the|them|him|it|her)|fend (?:off|it|them|him)|jump (?:him|them)|throw (?:a punch|him|her|the boy|yourself (?:at|in))|break (?:his|her|their) (?:jaw|nose|arm|head)|bludgeon|smash (?:him|it)|hunt (?:it|the|them|down)|protect (?:him|her|them|the)|shield (?:him|her|them|the)|seize (?:him|her|\{\w+\})|overpower|disarm|knock (?:him|her) down|bring (?:him|her|\{\w+\}) down|challenge|wade in|join the fight|into the fray|fall on|set on|pull (?:him|her) off|grab (?:his|her|the) (?:arm|wrist)|throttle|strangle|board (?:her|them|the)|ride (?:them|him) down|ride (?:in|at|beside|with) .{0,30}(?:wave|charge|against)|go out with|go down among|sail with him and fight|sign on|serve the crown|march with|the first wave)\b/,
  // a label that does something else: runs, hides, talks, pays, sues, teaches, or watches others fight
  other: /\b(run|flee|hide|escape|slip|sneak|bribe|pay|talk|reason|plead|beg|pray|yield|surrender|give (?:up|in|them|him|her|your oath)|call (?:for|the|out)|shout for|climb|swim|wait|leave|walk (?:away|on)|refuse|lie |bluff|negotiate|persuade|warn|report|back (?:away|off|down)|retreat|scare|threaten|offer|apologi|bargain|buy|play dead|keep still|stay still|let (?:him|her|them|it|\{\w+\}) (?:go|win|fight|have|make|lead)|court|courts|council|in writing|petition|vote|oath not to fight|teach|lesson|learn|study|watch|bet on|wager|ask (?:him|her|them|\{\w+\}|for|how)|send|order|hire|fight (?:it|the \w+) (?:in|at|openly)|fight (?:the|his|her) (?:in-laws|heirs|toll)|for the money|strike (?:it|me|his|her|my|your|their|\{\w+\})(?: name)? ?(?:off|out)|charge (?:a|the|full|double|him|her|them|by|for|what|every|\d)|slaughter|salt them|make it a custom|set traps|dig the pit|nets|burn the letter|draw the designs|cut (?:it|every|the timber) (?:true|virtue)|speak against|rally|tell|engine|build)\b/,
  // a scene where blows can fall
  scene: /\b(ambush\w*|bandits?|robbers?|brigands?|raiders?|outlaws?|cutthroats?|assassins?|hired knife|thugs?|toughs?|footpads?|highwaym[ae]n|deserters?|pirates?|reavers?|mob|brawl|fight|fighting|duel|attacks?|attacked|blades?|swords?|knife|knives|daggers?|axes?|spears?|cudgels?|clubs?|steel|lunges?|charges|melee|skirmish|battle|raid|assault|killers?|punch|fists|wrestl\w*|bout|pit|ring)\b/,
  // a result where blows fell
  blow: /\b(cut (?:him|her|them|it|you|down|your|his)|kill|kills|killed|slay|slain|dead|blood|bloody|blade|sword|knife|stab\w*|wound\w*|blow|blows|punch\w*|fist|fists|wrestl\w*|throat|bleed\w*|beaten|beat (?:him|them|you|her)|knock\w*|struck|strike|hack\w*|gut|spear|arrow|bolt|cudgel|club|bite|bit|claws?|maul\w*|gore\w*|tusks?|fangs?|jaws|teeth|horn|broken (?:nose|arm|ribs|jaw|leg)|cracked|smash\w*|throws? (?:you|him|her)|thrown|floored|the ground|lance|pike)\b/,
  army: /\b(army|armies|host|battle|battlefield|regiments?|column|shield ?wall|the line|front rank|ranks|cavalry|the charge|siege|breach|ramparts?|sortie|ladders|vanguard|rearguard|flank|warband|war band|the enemy|enemy (?:line|lines|horse|foot|spearmen|camp|riders)|first wave|next wave|wave|pikes|pike block|the press|melee of|sign on|for a season|a season of|campaign|the wars?|muster|serve the crown|levy|levies|march with|volunteer for|marines|boarding)\b/,
  allies: /\b(your men|your squad|your file|your company|your lance|your riders|your crew|the crew|your friends?|your companions?|your brothers?|your sons?|the hunters|hunters with you|with the hunters|the villagers|the village|the guards with you|beside (?:you|\{\w+\})|at your side|together|your band|your party|your mates|your shield-?mates|your comrades|your fellows|the others|your cousins|your kin|with two others|three friends|with (?:them|\{\w+\}|tarn|him)|join|the beaters|the barge master|the court|the party|in the party|herders?|shepherds)\b/,
  party: /\b(hunting party|hunt is called|the hunt|ivory party|a party of|beaters|hounds? (?:have|bay)|the court|the whole village|expedition)\b/,
  alone: /\b(alone|by yourself|on your own|single-handed|single combat|one spear|no one else)\b/,
  sport: /\b(joust|tourney|tournament|the lists|ring|wrestling|wrestle for|bout|bouts|spar|sparring|practi[cs]e|lessons?|drill|training|for a purse|for the purse|the prize|exhibition|mock fight|blunted|wooden swords?|first blood|the pit|pit fight|chalk circle|the circle|feast|gathering|the title|games?)\b/,
  trap: /\b(pits?|traps?|snares?|poison|nets?|bait|nooses?|smoke (?:it|them) out|fire-rafts|from cover)\b/,
  child: /(?<![!\w])C\.(?:child|teen)\(/,
};

// what a foe is worth: the crowd tiers of GD.CROWD (1 levy or tough, 2 regular, 3 veteran, 4 elite, 5 master)
FL.TIERW = [
  [5, /\b(legend(?:ary)? (?:blade|sword|fighter)|master(?:s)? (?:swordsm[ae]n|blades?|of the sword|duelists?|fighters?)|blademasters?|sword-?saints?)\b/],
  [4, /\b(knights?|elite|champions?|order (?:brothers?|knights?)|master-at-arms|paladins?|templars?|the best (?:blade|sword|fighter)|bear guard|quickened)\b/],
  [3, /\b(veterans?|assassins?|hired knife|hired knives|cutthroats?|sergeants?|bodyguards?|duelists?|swordsm[ae]n|killers?|executioners?|sellswords?|mercenar(?:y|ies)|reavers?|berserk\w*|huscarls?|housecarls?|retainers?|giants?)\b/],
  [2, /\b(soldiers?|guards?|guardsm[ae]n|watchm[ae]n|the watch|men-at-arms|man-at-arms|spearm[ae]n|pikem[ae]n|deserters?|raiders?|pirates?|brigands?|outlaws?|squires?|riders?|horsem[ae]n|archers?|crossbowm[ae]n|marauders?|warriors?|orcs?|bandits?|smugglers?|slavers?|highwaym[ae]n|poachers?|marines|lances)\b/],
  [1, /\b(robbers?|footpads?|drunks?|drunkards?|toughs?|thugs?|bullies|bully|thie(?:f|ves)|pickpockets?|mob|rioters?|peasants?|farmers?|boys?|lads?|youths?|urchins?|apprentices?|sailors?|dockhands?|dockers?|miners?|louts?|ruffians?|gang|villagers?|militia|beggars?|zealots?|fanatics?|townsm[ae]n|crowd|mocker|runts?|herders?|monk)\b/],
];
const NUMW = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, pair: 2, both: 2, several: 4, few: 3, handful: 4, score: 20 };
const FOES = 'men|of them|robbers|bandits|brigands|raiders|outlaws|thugs|toughs|soldiers|guards|riders|deserters|pirates|attackers|boys|lads|brothers|knights|veterans|spearmen|cutthroats|killers|footpads|drunks|sailors|orcs|archers|horsemen|reavers|marauders|warriors|cousins|in-laws|mockers|pursuers';
const BEASTS_PL = 'wolves|hounds|dogs|hyenas|boars';
const FOE_PL = new RegExp(`(?:\\b(\\d{1,2})|\\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|few|handful|pair|dozen|score)\\b|\\$\\{ctx\\.n\\}|\\{n\\})(?: (?:of )?(?:[\\w-]+ ){0,2})(${FOES}|${BEASTS_PL})\\b`);

// ---- the bestiary's scale ----------------------------------------------------------------------------------------
// GD.TIER_INFO: a titan is "over a tonne"; a great beast is a hunting party's work. A creature's size line gives its mass.
FL.massKg = function (c) {
  const s = String(c && c.size || '').replace(/(\d),(\d)/g, '$1$2');
  let m = s.match(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*tonnes?/i);
  if (m) return 1000 * (+(m[2] || m[1]));
  m = s.match(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*kg/i);
  if (m) return +(m[2] || m[1]);
  return null;
};
FL.massTier = kg => kg == null ? null : kg >= 1000 ? 'titan' : kg >= 200 ? 'great' : 'animal';
// common words for beasts, matched in lower case only (so "the Bear Guard" is a regiment, not a bear), and the creature
// whose duel numbers stand in for them
FL.GENERIC = [
  [/\b(?:pack of wolves|wolves|wolf|she-wolf)\b/, 'CRE-21', /wolves|pack/], [/\b(?:war ?dogs?|hounds?|dogs|mad dog|curs?|mastiffs?)\b/, 'CRE-56', /hounds|dogs|curs/],
  [/\b(?:boars?|wild pigs?|tusker)\b/, 'CRE-35', /boars/], [/\bhyenas?\b/, 'CRE-35', /hyenas/],
  [/\b(?:(?:a|the|an old|old|she-|great|brown|black|white|young|wounded|hungry|dancing|baited|chained|mad) bears?|bears? (?:cub|cubs|growls|rears|charges|attacks|comes|stands|is)|the bear\b(?! guard| hall))/, 'CRE-25'],
  [/\b(?:lions?|lioness|tigers?|leopards?|panthers?|big cats?)\b/, 'CRE-49'], [/\b(?:(?:a|the|mad|black|yak|wild|old) bulls?|bull (?:elephant|rhino)|aurochs|bison|bull)\b/, 'CRE-20'],
  [/\b(?:rhinos?|rhinoceros)\b/, 'CRE-34'], [/\b(?:elephants?)\b/, 'CRE-50'],
  [/\b(?:crocodiles?|crocs?)\b/, 'CRE-44'], [/\b(?:snakes?|vipers?|adders?)\b/, 'CRE-38'], [/\b(?:pythons?|anacondas?|coils)\b/, 'CRE-47'],
  [/\b(?:apes?)\b/, 'CRE-31'], [/\b(?:wyverns?|drakes?)\b/, 'CRE-03'], [/\b(?:dragons?)\b/, 'CRE-01'], [/\b(?:wyrms?)\b/, 'CRE-26'],
  [/\b(?:man-?eater|great wolf)\b/, 'CRE-21'],
];
FL.creatures = function () {
  if (FL._cre) return FL._cre;
  const L = (typeof LORE !== 'undefined' && LORE.creatures) || [];
  FL._cre = L.map(c => ({ id: c.id, key: c.name.toLowerCase().replace(/^the /, '').replace(/[^a-z' -]/g, '').trim(), cat: c.cat || '' }))
    .filter(c => c.key.length >= 5 && !/misunderstanding|hoax/i.test(c.cat)).sort((a, b) => b.key.length - a.key.length);
  return FL._cre;
};
FL.tierOfBeast = id => (A.beastTier ? A.beastTier(id) : (GD.BEAST_TIER || {})[id]) || 'animal';
// which beast a text means: a named creature, then a common word (lower case, so proper names do not count)
FL.beastIn = function (text) {
  const t = text.toLowerCase();
  for (const c of FL.creatures()) if (t.includes(c.key)) return { id: c.id, named: true, plural: false };
  for (const [rx, id, pl] of FL.GENERIC) { const m = text.match(rx); if (m) return { id, named: false, plural: !!(pl && pl.test(m[0])) }; }
  return null;
};

// ---- what a branch costs -----------------------------------------------------------------------------------------
// death, a maiming wound, or a hurt of 20 or more: read from plain fx, or from the source of an fx function
FL.cost = function (fx) {
  const o = { die: false, wound: null, hurt: 0, duel: false, beastFx: null, group: false };
  if (!fx) return o;
  if (typeof fx === 'function') {
    const s = fnSrc(fx);
    if (/pcDeath|\bdie\s*:|killedPC/.test(s)) o.die = true;
    const w = s.match(/addWound\([^,]+,\s*["']([a-z_]+)["']|wound\s*:\s*["']([a-z_]+)["']/);
    if (w) o.wound = w[1] || w[2];
    for (const m of s.matchAll(/hurt\([^,()]+,\s*(\d+)|health\s*-=\s*(\d+)|health\s*:\s*-(\d+)|health-(\d+)/g)) o.hurt = Math.max(o.hurt, +(m[1] || m[2] || m[3] || m[4]));
    if (/startDuel(?:Front)?\(|\bbout\(|\bduel\s*:/.test(s)) { if (/beastId|\bbeast\s*:/.test(s)) o.beastFx = 'fn'; else o.duel = true; }
    if (/groupFightPC\(/.test(s)) o.group = true;
    return o;
  }
  if (fx.die) o.die = true;
  if (fx.wound) o.wound = fx.wound;
  if (typeof fx.health === 'number' && fx.health < 0) o.hurt = -fx.health;
  if (fx.duel) o.duel = true;
  if (fx.beast) o.beastFx = fx.beast;
  return o;
};
FL.MAIM = ['lost_eye', 'lost_fingers', 'lost_hand', 'limp', 'bad_knee', 'back', 'scar_chest', 'scar_face', 'scar_arm', 'broken_ribs', 'deep_cut', 'arrow_wound', 'concussion', 'bite', 'ear', 'broken_nose', 'burn', 'frostbite'];
FL.deadly = o => !!(o && (o.die || (o.wound && FL.MAIM.includes(o.wound)) || o.hurt >= 20));

// ---- the tag ---------------------------------------------------------------------------------------------------------
// FL.tag(e, i) reads choice i of event e: is it a fight, at what scale, against what, decided how, at what cost
FL.tag = function (e, i) {
  const c = (e.choices || [])[i];
  if (!c) return null;
  const labelRaw = FL.words(c.t), label = labelRaw.toLowerCase();
  const sceneRaw = (FL.words(e.title) + ' ' + FL.words(e.text) + ' ' + FL.words(e.more)).replace(/\s+/g, ' '), scene = sceneRaw.toLowerCase();
  const resRaw = [c.win && c.win.r, c.lose && c.lose.r, c.r, c.win && c.win.fx, c.lose && c.lose.fx, c.fx].map(FL.words).join(' '), res = resRaw.toLowerCase();
  const ck = c.check || null, s1 = ck && ck.s, s2 = ck && ck.s2;
  const cWin = FL.cost(c.win && c.win.fx), cLose = FL.cost(c.lose && c.lose.fx), cAny = FL.cost(c.fx);
  const duel = cWin.duel || cLose.duel || cAny.duel, beastFx = cWin.beastFx || cLose.beastFx || cAny.beastFx || null, groupFn = cAny.group;
  const combatSkill = !!(ck && (FL.COMBAT.includes(s1) || FL.COMBAT.includes(s2)));
  const ranged = !!(ck && FL.RANGED.includes(s1));
  const acts = RX.act.test(label), other = RX.other.test(label);
  const inScene = RX.scene.test(scene) || RX.scene.test(label), blows = RX.blow.test(res);
  const child = RX.child.test(String(e.cond || ''));
  let fight = false, why = '';
  if (ck && ck.fight) { fight = true; why = 'worth'; }
  else if (c.group || groupFn) { fight = true; why = 'group'; }
  else if (duel || beastFx) { fight = true; why = duel ? 'duel' : 'beast'; }
  else if (other && !(acts && combatSkill)) { why = 'not a fight'; }
  else if (combatSkill && (acts || inScene || blows)) { fight = true; why = 'combat skill'; }
  else if (acts && (inScene || blows)) { fight = true; why = 'fight action'; }
  // a beast encounter is any choice in a scene with a beast, fought or not
  const beastWhere = FL.beastIn(labelRaw + ' ' + FL.words(c.lose && c.lose.r) + ' ' + FL.words(c.lose && c.lose.fx)) || FL.beastIn(sceneRaw);
  const beastCtx = /\{(?:beast|abeast|game|prey)\}|\$\{[^}]*beast[^}]*\}/i.test(String(e.text) + ' ' + labelRaw) || /ctx\.beast/.test(String(e.text));
  const beast = beastFx && typeof beastFx === 'object' && beastFx.id ? { id: beastFx.id, named: true } : beastWhere;
  const sport = RX.sport.test(scene + ' ' + label) && !/\b(to the death|real steel|sharp steel|strike to kill)\b/.test(label + ' ' + scene);
  // the scale
  const pl = (label + ' ' + scene).match(FOE_PL), armyCue = RX.army.test(label) || (RX.army.test(scene) && !RX.sport.test(label));
  const allyCue = RX.allies.test(label) || (RX.allies.test(scene) && !RX.alone.test(label)), partyCue = RX.party.test(scene + ' ' + label);
  const personFoe = /\{(?:them|themhim|theyhe|themfull)\}/.test(label) || /\b(him|her|man|woman|thief|stranger|knight|rider|robber|drunk)\b/.test(label);
  let scale = 'one', n = 1, tier = null, allies = 0;
  const isBeast = !!beast && (beastFx || !personFoe || FL.beastIn(labelRaw)) && !(armyCue && !FL.beastIn(labelRaw));
  if (isBeast) {
    scale = 'beast';
    if (beast.plural || (pl && new RegExp(BEASTS_PL).test(pl[3] || ''))) n = pl && (pl[1] || NUMW[pl[2]]) ? Math.max(2, +(pl[1] || NUMW[pl[2]])) : 3;
    if ((allyCue || partyCue) && !RX.alone.test(label)) allies = partyCue ? 8 : 2;
  } else if (armyCue) { scale = 'army'; n = 3; allies = 2; }
  else if (pl && !new RegExp(BEASTS_PL).test(pl[3] || '')) { scale = 'party'; n = pl[1] ? +pl[1] : pl[2] ? NUMW[pl[2]] : 4; }
  else if (/\b(they|them|their|the pack|the gang|all of them)\b/.test(label) && /\b(men|gang|band|mob|crowd|robbers|bandits|raiders|brigands|outlaws|toughs|thugs|soldiers|guards|riders|deserters|pirates|caravan)\b/.test(scene + ' ' + label)) { scale = 'party'; n = 3; }
  if (scale === 'party') {
    if (allyCue && !RX.alone.test(label)) allies = 2;
    if (n >= 6 && !RX.alone.test(label)) { scale = 'army'; n = 3; allies = 2; }   // a crowd fight: you hold your own corner of it
  }
  for (const [t, rx] of FL.TIERW) if (rx.test(label) || rx.test(scene)) { tier = t; break; }
  const pid = /\{(?:them|themhim|theyhe|themfull)\}/.test(label) && !/\b(beside|with|behind|for|teach|ask|defend|stand second)\b/.test(label);
  const btier = scale === 'beast' && beast.id ? FL.tierOfBeast(beast.id) : null;
  const decided = why === 'worth' ? 'worth' : (c.group || groupFn) ? 'group' : duel ? 'duel' : beastFx ? 'beast-duel' : ck ? (ranged ? 'ranged check' : 'plain check') : 'no roll';
  const deadly = FL.deadly(cLose) || FL.deadly(cAny) || (!!ck && FL.deadly(cWin));
  const trap = RX.trap.test(label);
  // a free kill: no roll, and the result kills or drives off the beast or the men
  const freeKill = fight && decided === 'no roll' && !trap && /\b(you (?:kill|slay|cut down|drive (?:it|them) off|beat (?:it|them) off|fight (?:it|them) off|see (?:it|them) off)|no more bull|it dies|they die|falls dead|lies dead|dead by noon)\b/.test(res);
  return { fight, why, encounter: !!(beast || inScene), scale, n, tier, allies, beast: beast ? beast.id : null, beastCtx, btier, pid, decided, deadly, sport, ranged, child, trap,
    freeKill, skill: s1 || null, s2: s2 || null, d: ck ? ck.d : null, label: labelRaw.slice(0, 80), combatSkill };
};

// ---- clashes with the ladder ---------------------------------------------------------------------------------------
// plainDeadly: a fight that can kill or maim, decided by a plain check (fighting worth never enters)
// soloGreat: one person alone against a great beast or titan, won by a plain check or by no roll at all
// freeKill: no roll, and the result kills or drives off a beast or several men
// scaleMismatch: a worth spec that disagrees with the scale the text describes
FL.clashes = function (e, i, t) {
  t = t || FL.tag(e, i);
  const out = [];
  if (!t || !t.fight || t.child) return out;
  if (t.decided === 'plain check' && t.deadly) out.push('plainDeadly');
  if (t.scale === 'beast' && (t.btier === 'great' || t.btier === 'titan') && !t.allies && !t.trap && ['plain check', 'no roll'].includes(t.decided)) out.push('soloGreat');
  if (t.freeKill && (t.scale !== 'one' || t.btier)) out.push('freeKill');
  const c = e.choices[i], f = c.check && c.check.fight;
  if (f) {
    const want = FL.spec(e, i, Object.assign({}, t, { decided: 'plain check' }));
    if (want && (want.scale !== f.scale || (want.beast || null) !== (f.beast || null) || (want.allies || 0) !== (f.allies || 0))) out.push('scaleMismatch');
  }
  return [...new Set(out)];
};

// the resolver spec for a tagged fight: who stands on each side. Plain data, so the audit can print it.
FL.spec = function (e, i, t) {
  t = t || FL.tag(e, i);
  if (!t || !t.fight) return null;
  const c = e.choices[i], ck = c.check || {};
  const weapon = FL.WEAPON_OF[ck.s] || FL.WEAPON_OF[ck.s2] || (/\b(fists?|wrestle|bare-?handed|punch|arm-wrestle|brawl)\b/.test(t.label.toLowerCase()) ? 'fists' : null);
  const mounted = ['lance', 'mounted', 'riding'].includes(ck.s) || ['lance', 'mounted'].includes(ck.s2);
  // a skill the ladder does not measure (command, stealth, intimidation...) still counts, as an edge of a few points
  const edgeK = [ck.s, ck.s2].find(k => k && !FL.COMBAT.includes(k) && !FL.BODY.includes(k) && !FL.RANGED.includes(k) && !(GD.STATS || []).includes(k));
  const s = { scale: t.scale, n: t.n };
  if (t.scale === 'beast') { s.beast = t.beast; if (t.beastCtx) s.beastCtx = true; if (t.allies) s.allies = t.allies; }
  else {
    s.tier = t.tier || (ck.d == null ? 2 : ck.d <= 40 ? 1 : ck.d <= 52 ? 2 : ck.d <= 60 ? 3 : 4);
    if (t.allies) { s.allies = t.allies; s.allyTier = 2; }
    if (t.pid && t.scale === 'one') s.pid = true;
  }
  if (/\$\{ctx\.n\}|\{n\}/.test(FL.words(e.text) + ' ' + t.label) && t.scale === 'party') s.nCtx = true;
  if (weapon) s.weapon = weapon;
  if (mounted) s.mounted = true;
  if (edgeK) s.edge = edgeK;
  return s;
};

// creature tags against their own size line and the engine's HP rule
FL.bestiaryClashes = function () {
  const out = [], rank = { animal: 0, great: 1, titan: 2, legend: 3 };
  for (const c of ((typeof LORE !== 'undefined' && LORE.creatures) || [])) {
    if (/misunderstanding|hoax/i.test((c.cat || '') + ' ' + (c.truth || ''))) continue;
    const tag = FL.tierOfBeast(c.id), kg = FL.massKg(c), mt = FL.massTier(kg), B = A.BEASTS && A.BEASTS[c.id];
    const hpTier = B ? (B.hp >= 330 ? 'titan' : B.hp >= 170 ? 'great' : 'animal') : null;
    if (hpTier && rank[hpTier] > rank[tag]) out.push({ id: c.id, name: c.name, tag, want: hpTier, why: `HP ${B.hp}: the engine's own rule makes it ${hpTier}` });
    else if (mt === 'titan' && rank[tag] < 2) out.push({ id: c.id, name: c.name, tag, want: 'titan', why: `${kg} kg: titans are "over a tonne"` });
  }
  return out;
};

// the whole audit: counts, and the choices behind each count
FL.audit = function (opts) {
  opts = opts || {};
  const R = { events: 0, choices: 0, fights: 0, encounters: 0, byWhy: {}, byScale: {}, byDecided: {}, deadlyFights: 0, sportFights: 0, rangedFights: 0, childScuffles: 0,
    clashes: { plainDeadly: 0, soloGreat: 0, freeKill: 0, scaleMismatch: 0, bestiary: 0 }, list: {}, converted: 0, convertedDeadly: 0, convertedBy: {}, worthDeadly: 0 };
  for (const id in A.EV) {
    const e = A.EV[id]; R.events++;
    (e.choices || []).forEach((c, i) => {
      R.choices++;
      const t = FL.tag(e, i);
      if (!t) return;
      if (t.encounter) R.encounters++;
      if (!t.fight) return;
      R.fights++;
      if (t.child) R.childScuffles++;
      R.byWhy[t.why] = (R.byWhy[t.why] || 0) + 1;
      const sk = t.scale === 'beast' ? 'beast:' + (t.btier || '?') + (t.allies ? '+party' : '') : t.scale;
      R.byScale[sk] = (R.byScale[sk] || 0) + 1;
      R.byDecided[t.decided] = (R.byDecided[t.decided] || 0) + 1;
      if (t.deadly) R.deadlyFights++;
      if (t.sport) R.sportFights++;
      if (t.ranged) R.rangedFights++;
      if (c.check && c.check.fight) { R.converted++; if (t.deadly) R.convertedDeadly++; const k = c.check.fight.scale; R.convertedBy[k] = (R.convertedBy[k] || 0) + 1; }
      if (t.deadly && ['worth', 'group', 'duel', 'beast-duel'].includes(t.decided)) R.worthDeadly++;
      for (const k of FL.clashes(e, i, t)) { R.clashes[k]++; if (opts.list !== false) (R.list[k] = R.list[k] || []).push({ id, i, label: t.label, skill: t.skill, s2: t.s2, scale: t.scale, n: t.n, tier: t.tier, beast: t.beast, btier: t.btier, allies: t.allies }); }
    });
  }
  const B = FL.bestiaryClashes();
  R.clashes.bestiary = B.length; R.list.bestiary = B;
  R.clashTotal = Object.values(R.clashes).reduce((a, b) => a + b, 0);
  return R;
};
