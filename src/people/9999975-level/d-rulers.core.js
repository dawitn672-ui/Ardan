// A ruler's level is his own (order 97: "kings: levels personal, most trained by routine; a warrior king may reach the
// elite, a political one not"; order 98, the owner's answer 3: "yes but there are countless other factors, but are
// mainly shown through the ones that don't do much themselves"; audit C-16; D-205). Numbers: data/level.json seed.rule.
//
// Until now a king who never served stood where his upbringing and his crown's posts put him (50-99), so every
// peaceful king read alike. Now each ruler but the player keeps a WAY OF RULE, chosen through A.WHY.decide each year and
// at the world's birth:
//   field    he leads his hosts and drills with his guard (a war-chief, a warrior king)
//   drill    he keeps the arms-practice of his upbringing
//   council  he rules from the council table (the elect, the priest-kings, the clever and the careful)
//   ease     he does little himself (the content, the indulgent, the sick and the very old)
// for reasons with sources: his traits and temper (A.WHY bends each kind), his age and health, his best skills, his
// realm at war and its kind (a horde's war-chief leads; a council's elect sits at the table), what the lore writes of
// him at the world's birth (the realm's primer: "won the Nagora Pass as prince", "bedridden", "signs whatever the
// banker reads him"), and the habit of the way he already keeps. LV.band reads the way (LV.ruleBand): his level moves
// from where it stood when the way began toward the way's end over the years, a field king's years at war counting
// double (his wars fought). So the kings who do little themselves sink to the level of ordinary grown folk, a
// political king stays under the first wall, and a warrior king after long wars stands among the realm's elite.
// The decision draws from a stream of its own (the seed, the ruler, the year): the main stream never moves for it.
// State (optional; old saves load and choose at the next year's turn): p.rway = { k, r (realm), y0 (the year the way
// began), y (the year last chosen), L0 (his level then), wy (years at war in the field), lr (what the lore wrote of
// him: 'field', 'council', 'ease'; read once, at the world's birth) }.
(function () {
  const LV = A.LV;
  if (!LV || !LV.D || !LV.D.seed || !LV.D.seed.rule) return;
  const RU = LV.D.seed.rule, WAYS = RU.ways, KEYS = Object.keys(WAYS);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const S_ = () => A.S;
  // his age as a man's (a race's "old" read as a man's fifty): an elf queen of 586 is not past the saddle
  const hAge = p => A.age(p) * 50 / (((GD.RACES && GD.RACES[p.race]) || {}).old || 50);

  // ---------------------------------------------------------------- the band his way gives (pure)
  LV.ruleBand = function (p) {
    const w = p && p.rway, W = w && WAYS[w.k], S = S_();
    if (!W || !S || !p.alive || p.ruler !== w.r) return null;
    const yrs = Math.max(0, S.year - (w.y0 || S.year)) * (W.years != null ? W.years : 1), war = w.k === 'field' || w.k === 'drill' ? (w.wy || 0) * (RU.warYear || 1) : 0;
    const e = clamp((yrs + war) / (RU.full || 20), 0, 1);
    const L0 = +w.L0 || 0, from = W.from != null ? Math.max(L0, W.from) : L0;
    const t = Math.round(from + (W.to - from) * e);
    return { lo: t, hi: Math.max(t, W.cap || t), k: w.k, e };
  };
  LV.ruleWay = p => (p && p.rway && LV.ruleBand(p) ? p.rway.k : null);

  // ---------------------------------------------------------------- what the lore writes of him (the world's birth)
  const LORE_RX = [
    ['field', /\b(won|winning|victor|led the|led his|campaign|conquer)/i],
    ['ease', /\b(bedridden|dying|ill since|poppy|blind|weak heart|coughs blood|collapsed|went numb|has not left|signs whatever|dosed)\b/i],
    ['council', /\b(elected|chosen by the council|council of|banker|doge|speaker|abbot|luminary|steward)\b/i],
  ];
  const loreOf = function (p, r) {
    const t = String((r && r.primer && r.primer.ruler) || '');
    if (!t || !p.given || t.indexOf(p.given) < 0) return [];
    return LORE_RX.filter(([, rx]) => rx.test(t)).map(([k]) => k);
  };

  // ---------------------------------------------------------------- the reasons
  const has = (p, t) => Array.isArray(p.traits) && p.traits.includes(t);
  const sk = (p, k) => (p.skills && +p.skills[k]) || 0;
  const atWar = rid => (A.S.wars || []).some(w => w && ((w.att || []).includes(rid) || (w.def || []).includes(rid)));
  const kindOf = r => String((r && (r.type || r.gov)) || '').toLowerCase();
  LV.ruleReasons = function (p, r) {
    const age = Math.round(hAge(p)), hp = p.health != null ? p.health : 100, kind = kindOf(r), lr = (p.rway && p.rway.lr) || [];
    const O = {}; for (const k of KEYS) O[k] = [{ kind: 'temper', weight: WAYS[k].w || 0, label: `a ruler who ${WAYS[k].label}`, source: { t: 'way', id: k }, pub: true }];
    const add = (k, kd, w, label, src, pub) => O[k].push({ kind: kd, weight: w, label, source: src || null, pub: pub !== false });
    // his nature
    if (has(p, 'brave')) add('field', 'ambition', 0.8, 'he is brave', { t: 'trait', id: 'brave' });
    if (has(p, 'wrathful')) add('field', 'grudge', 0.4, 'a temper that wants an enemy', { t: 'trait', id: 'wrathful' });
    if (has(p, 'ambitious')) add('field', 'ambition', 0.5, 'he wants a name of his own', { t: 'trait', id: 'ambitious' });
    if (has(p, 'impetuous')) add('field', 'want', 0.3, 'he cannot sit still', { t: 'trait', id: 'impetuous' });
    if (has(p, 'craven')) { add('field', 'fear', -1.5, 'he fears the press of battle', { t: 'trait', id: 'craven' }, false); add('council', 'fear', 0.6, 'the council table is safe', { t: 'trait', id: 'craven' }, false); }
    if (has(p, 'patient')) add('drill', 'duty', 0.4, 'a patient man keeps his habits', { t: 'trait', id: 'patient' });
    if (has(p, 'stubborn')) add('drill', 'duty', 0.3, 'he keeps to what he was taught', { t: 'trait', id: 'stubborn' });
    for (const t of ['robust', 'bigframe', 'tall']) if (has(p, t)) add('drill', 'merit', 0.35, 'a body made for arms', { t: 'trait', id: t });
    if (has(p, 'quickmind')) add('council', 'merit', 0.5, 'a quick mind for the council', { t: 'trait', id: 'quickmind' });
    if (has(p, 'curious')) add('council', 'want', 0.3, 'letters and reports interest him', { t: 'trait', id: 'curious' });
    if (has(p, 'calm')) add('council', 'reckoning', 0.3, 'a calm man weighs before he rides', { t: 'trait', id: 'calm' });
    if (has(p, 'deceitful')) add('council', 'merit', 0.3, 'he rules by what others do not know', { t: 'trait', id: 'deceitful' }, false);
    if (has(p, 'content')) add('ease', 'want', 0.8, 'he is content with what he has', { t: 'trait', id: 'content' });
    if (has(p, 'greedy')) add('ease', 'coin', 0.3, 'the treasury is for his table', { t: 'trait', id: 'greedy' }, false);
    if (has(p, 'gregarious')) add('ease', 'want', 0.3, 'feasts and company', { t: 'trait', id: 'gregarious' });
    if (has(p, 'sickly')) { add('ease', 'cost', 1.2, 'a sickly body', { t: 'trait', id: 'sickly' }); add('field', 'cost', -1, 'a sickly body', { t: 'trait', id: 'sickly' }); }
    // his years and his health
    if (age < 35) { add('field', 'want', 0.6, 'young, and the yard still calls him', { t: 'age', id: age }); add('drill', 'want', 0.3, 'young', { t: 'age', id: age }); }
    if (age >= 50) add('council', 'reckoning', 0.4, 'past fifty: the table suits him better than the saddle', { t: 'age', id: age });
    if (age >= 60) { add('field', 'cost', -1.5 - (age >= 70 ? 1.5 : 0), 'the saddle costs an old man more each year', { t: 'age', id: age }); add('ease', 'reckoning', 0.5 + (age >= 70 ? 0.7 : 0), 'old age', { t: 'age', id: age }); }
    if (hp < 50) { add('ease', 'cost', hp < 30 ? 2 : 1.2, 'his health keeps him to his rooms', { t: 'health', id: Math.round(hp) }); add('field', 'cost', -1.5, 'his health will not carry armour', { t: 'health', id: Math.round(hp) }); }
    // what he is good at
    const arms = Math.max(sk(p, 'sword'), sk(p, 'melee'), sk(p, 'spear'), sk(p, 'mounted')), cmd = sk(p, 'command');
    if (arms >= 55) add('field', 'merit', 0.4 + (arms - 55) / 40, 'he is good with his weapons', { t: 'skill', id: 'arms' });
    if (arms >= 40) add('drill', 'merit', 0.4, 'he was trained to arms and has kept some of it', { t: 'skill', id: 'arms' });
    if (cmd >= 55) add('field', 'merit', 0.5, 'he can command', { t: 'skill', id: 'command' });
    const pen = Math.max(sk(p, 'diplomacy'), sk(p, 'intrigue'), sk(p, 'stewardship'), sk(p, 'law'));
    if (pen >= 50) add('council', 'merit', 0.4 + (pen - 50) / 50, 'he is better with the pen than the sword', { t: 'skill', id: 'pen' });
    // his realm: at war, and the kind of crown it is (the post's routine)
    if (atWar(r.id)) { add('field', 'duty', 1.2, 'his realm is at war and its host wants its king', { t: 'war', r: r.id }); add('ease', 'duty', -0.8, 'a realm at war', { t: 'war', r: r.id }); }
    if (/horde|nomad|orc clan|pirate|clans/.test(kind)) add('field', 'duty', 1.5, 'a war-chief who does not lead is not one for long', { t: 'realm', r: r.id });
    if (/theocracy|republic|city|league|monastic/.test(kind)) add('council', 'duty', 1.5, 'his office is the council and the pen', { t: 'realm', r: r.id });
    // the lore's word of him (read at the world's birth)
    if (lr.includes('field')) add('field', 'merit', 1.6, 'he has won his wars at the head of his host', { t: 'lore', r: r.id });
    if (lr.includes('council')) add('council', 'duty', 1.0, 'he was chosen to sit at the table', { t: 'lore', r: r.id });
    if (lr.includes('ease')) { add('ease', 'cost', 2, 'he no longer rules in person', { t: 'lore', r: r.id }); add('field', 'cost', -2, 'he no longer rules in person', { t: 'lore', r: r.id }); }
    // the habit of the way he keeps
    const cur = LV.ruleWay(p);
    if (cur) add(cur, 'temper', RU.habit || 1, `the habit of ${Math.max(1, A.S.year - (p.rway.y0 || A.S.year))} years`, { t: 'habit', id: cur });
    return KEYS.map(k => ({ id: k, reasons: O[k] }));
  };

  // ---------------------------------------------------------------- the choice, each year and at the world's birth
  LV.ruleDecide = function (p, r, birth) {
    const S = S_(); if (!S || !p || !r || !A.WHY || !A.WHY.decide) return null;
    if (birth && !(p.rway && p.rway.lr)) {
      const lr = loreOf(p, r);
      p.rway = Object.assign(p.rway || {}, { lr });
    }
    const prev = LV.ruleWay(p);
    const rand = LV.stream(`${S.seed != null ? S.seed : 'ardan'}|rule|${p.id}|${S.year}`);
    // a change of way is kept in the record of decisions (the world's birth is not a change)
    const rec = A.WHY.decide(p, 'rule', LV.ruleReasons(p, r), { rand, band: RU.band, r: r.id, logIf: x => !birth && x.chose !== prev });
    if (!rec) return null;
    const lr = (p.rway && p.rway.lr) || [];
    if (rec.chose !== prev) {
      // a new way starts from where he stands now (the old way's level, or the band of his life before any). At the
      // world's birth a grown ruler has kept his way since he was grown: his years in it count (up to the full span)
      const L0 = LV.level(p), kept = birth ? clamp(Math.floor(hAge(p) - (RU.grownAt || 20)), 0, RU.full || 20) : 0;
      // (a ruler the lore says won his wars at the head of his host comes to the world with years of war behind him)
      const wy = birth && rec.chose === 'field' && lr.includes('field') ? RU.loreWars || 0 : 0;
      p.rway = { k: rec.chose, r: r.id, y0: S.year - kept, y: S.year, L0, wy, lr };
    } else p.rway.y = S.year;
    return rec;
  };
  LV.ruleYear = function (birth) {
    const S = S_(); if (!S || !S.realms) return 0;
    let n = 0;
    for (const id of Object.keys(S.realms).sort()) {
      const r = S.realms[id]; if (!r || r.alive === false || r.ruler == null) continue;
      const p = A.P(r.ruler);
      if (!p || !p.alive || !p.st || p.id === S.pc || p.ruler !== id) continue;
      // a year at war in the field counts toward his wars fought (before the year's choice, for the year just lived)
      if (!birth && p.rway && p.rway.k === 'field' && LV.ruleBand(p) && atWar(id)) p.rway.wy = (p.rway.wy || 0) + 1;
      if (LV.ruleDecide(p, r, birth)) n++;
    }
    return n;
  };
  A.on && A.on('worldInit', function () { try { LV.ruleYear(true); } catch (e) { console.error('[level] rulers at birth', e); } });
  (A.onYear = A.onYear || []).push(function () { try { LV.ruleYear(false); } catch (e) { console.error('[level] rulers year', e); } });
})();
