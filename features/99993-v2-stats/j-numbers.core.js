// v2 stats, part 8 (owner's complaint 11, playtest 1 #7, playtest 2 old 7): the 0-100 numbers g-bands did not reach.
//
// - 35-moods' four needs: words (A.MOODS.word, "rested", "alone too often"), in 35's card, 91-look's box and the
//   need/needs/mood popovers; a popover says where a need settles and what pulls it, in words.
// - Training: the mentor picker's "Melee (14)" and the council's "(52)" say the tier; the season's training log says
//   how much each skill grew ("Survival & hunting, a good deal"), not "+2.4"; the profile's "best 59 at 19", a wound's
//   "worth 42 to 41 (speed -7)" and "−7 speed, Athletics & climbing −10", the perks' "40, 65 and 85" and the decisions'
//   "A proficiency at 50" and "Learning 55" are tiers and words; a staff candidate's "fit 66" is the tier of that fit.
// - The War Room's division stat grid (attack, defence, breakthrough, hit points, width, supply, armour, piercing,
//   organization) compares the division with yours ("far above yours"), and says what its armour and piercing do to your
//   men; speed stays in km. The order of battle's "mo 64", "xp 18" and "morale 64 (steady)" are the words.
// - Infamy, under World > Diplomacy (Coalitions and Most feared): words that follow the rules (40 starts a coalition,
//   more than 58 lets one march, more than 20 makes small realms bow).
// The game's rules are unchanged. Rendering only: nothing here reads A.rand or writes A.S.
const VS = A.V2S;
const esc = s => UI.esc(String(s == null ? '' : s));
const M = A.MOODS;
const tierName = v => VS.tierOf(+v || 0).name;

// ---- needs ----------------------------------------------------------------------------------------------------------
if (M && M.word) {
  const NAME = { rest: 'Rest', company: 'Company', purpose: 'Purpose', comfort: 'Comfort' };
  // 91-look's box of the four needs: the value's place takes the word
  const LOOK = UI.LOOK;
  if (LOOK && typeof LOOK.needsBox === 'function') {
    const box0 = LOOK.needsBox;
    LOOK.needsBox = function (pc) {
      const box = box0.apply(this, arguments);
      try {
        if (box && pc) {
          const n = M.needs(pc);
          for (const row of box.querySelectorAll('.lk-need')) {
            const v = row.querySelector('.val'), tt = row.querySelector('[data-tt="need"][data-v]'), k = (v && v.getAttribute('data-v')) || (tt && tt.getAttribute('data-v'));
            if (v && k in n) { v.textContent = M.word(k, n[k]); v.classList.add('v2-needw'); }
          }
        }
      } catch (e) { console.error('v2 needs box', e); }
      return box;
    };
  }
  // the popovers (59-tooltips' need, needs, mood): words, the same rules
  const pull = d => (Math.abs(d) >= 20 ? 'a great deal' : Math.abs(d) >= 10 ? 'a good deal' : 'a little');
  const tip = UI.TIPS = UI.TIPS || {};
  const ttL = (key, arg, label) => (UI.tt ? UI.tt(key, arg, label) : esc(label));
  if (tip.need) {
    tip.need = function (k) {
      const p = A.pc(); if (!p || !M.NEEDS.includes(k)) return '';
      const n = M.needs(p)[k], T = M.targets(p)[k], parts = UI.TT && UI.TT.needParts ? UI.TT.needParts(p, k) : null;
      const way = Math.abs(T - n) < 4 ? 'and holding there' : T > n ? `and rising toward ${M.word(k, T)}` : `and falling toward ${M.word(k, T)}`;
      let h = `<div class="tip-h">${esc(NAME[k])} <b>${esc(M.word(k, n))}</b></div>` +
        `<div class="tip-d">${esc(way)}. Each month a need moves a quarter of the way toward where your life puts it; what you do pushes it up or down.</div>`;
      if (parts) h += parts.filter(x => x[1]).map(([l, v], i) => `<div class="tip-row tt-sub"><span>${l}</span><b>${i === 0 ? esc(M.word(k, v)) : `${v > 0 ? 'raises' : 'lowers'} it ${pull(v)}`}</b></div>`).join('');
      else h += `<div class="tip-d">Your ${ttL('coin', '', 'coin')} against what feels like enough at your rank, plus your ${ttL('health', '', 'health')}, your freedom, and prison.</div>`;
      h += `<div class="tip-row tt-sum"><span>Settles at</span><b>${esc(M.word(k, T))}</b></div>`;
      if (n < M.LOW) h += `<div class="tip-f">This low, it sets a ${ttL('mood', k, 'mood')}.</div>`;
      return h;
    };
  }
  if (tip.needs) {
    tip.needs = function () {
      const p = A.pc(); if (!p) return '';
      const n = M.needs(p);
      return '<div class="tip-h">Needs</div>' + M.NEEDS.map(k => `<div class="tip-row"><span>${ttL('need', k, NAME[k])}</span><b>${esc(M.word(k, n[k]))}</b></div>`).join('') +
        `<div class="tip-f">Together they move ${ttL('happy', '', 'happiness')} every month: well met, up; neglected, down.</div>`;
    };
  }
  if (tip.mood) {
    const mood0 = tip.mood;
    tip.mood = function (k) {
      const h = mood0.apply(this, arguments);
      try {
        if (typeof h !== 'string') return h;
        return h.replace(/Every need at 65 or more\./, `Every need ${esc(M.word('rest', 65))}, ${esc(M.word('company', 65))}, ${esc(M.word('purpose', 65))} and ${esc(M.word('comfort', 65))} or better.`)
          .replace(/is below \d+\./, `is down to ${esc(M.word(k, M.LOW - 1))}.`);
      } catch (e) { return h; }
    };
  }
  // 91-look's activity popover: "Meets rest +30, company +12" as how much
  if (tip.act) {
    const act0 = tip.act;
    tip.act = function () {
      const h = act0.apply(this, arguments);
      try {
        return typeof h === 'string' ? h.replace(/(<span>Meets<\/span><b>)([^<]*)(<\/b>)/, (all, a, list, b) =>
          a + list.split(', ').map(x => { const m = /^(\w+) ([+−-])(\d+)$/.exec(x.trim()); return m ? `${m[1]} ${m[2] === '+' ? 'up' : 'down'} ${pull(+m[3])}` : x; }).join(', ') + b) : h;
      } catch (e) { return h; }
    };
  }
}

// ---- infamy ---------------------------------------------------------------------------------------------------------
// the bands follow the rules: 40 or more and the neighbours band together, over 58 a coalition may march, over 20 small
// realms seek its protection
VS.INFAMY = [[80, 'dreaded by every court'], [58.5, 'so feared a coalition may march'], [40, 'feared: its neighbours band together'], [21, 'distrusted'], [10, 'watched'], [-1e9, 'unremarkable']];
VS.infamyWord = v => { for (const [t, w] of VS.INFAMY) if (+v >= t) return w; return VS.INFAMY[VS.INFAMY.length - 1][1]; };
// the short word (a bar, a list, a line): g-bands' band, the same thresholds
VS.infamyShort = v => VS.band('infamy', +v || 0);
// the rule in words, for the lines that gave it as "At 40 ... above 60 ..."
VS.INFAMY_RULE = 'once a realm is feared, its neighbours start a coalition; once it is hated, the coalition may march';
// how much it moves ("infamy +6" in a war's cost)
const infAmount = a => (a < 3 ? 'a little' : a < 8 ? 'somewhat' : a < 20 ? 'a good deal' : 'a great deal');
// the realm tab's bar (and any bar labelled Infamy): the word in the value's place
{
  const bar1 = UI.barRow;
  UI.barRow = function (label, v, max, cls, pot, valTxt) {
    try {
      const l = String(label || '');
      if (typeof v === 'number' && valTxt == null && (/^Infamy$/.test(l) || /data-tt="infamy"[^>]*>Infamy</.test(l))) return bar1.call(this, label, v, max, cls, pot, VS.infamyShort(v));
    } catch (e) {}
    return bar1.apply(this, arguments);
  };
}
// a number whose tooltip key is infamy (59-tooltips wires the realm's bar and its label)
if (VS.keyWords) VS.keyWords.infamy = t => (/^\d{1,3}(\.\d+)?$/.test(t) ? VS.infamyShort(+t) : null);
// the infamy popover (59-tooltips' glossary): "Infamy <b>47</b>" and the rule's thresholds
if (UI.TIPS && typeof UI.TIPS.infamy === 'function') {
  const inf0 = UI.TIPS.infamy;
  UI.TIPS.infamy = function (id) {
    const h = inf0.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      const r = A.realm(id) || A.realm((A.pc() || {}).ruler) || null;
      return h.replace(/(<div class="tip-h">Infamy )<b>[\d.]+<\/b>/, (all, a) => `${a}<b>${esc(VS.infamyShort(r ? r.infamy || 0 : 0))}</b>`)
        .replace(/At 40 neighbors start a coalition; above 60 they march together\./, () => esc(VS.INFAMY_RULE.charAt(0).toUpperCase() + VS.INFAMY_RULE.slice(1)) + '.');
    } catch (e) { return h; }
  };
}
if (typeof UI.worldTabPolitics === 'function') {
  const pol0 = UI.worldTabPolitics;
  UI.worldTabPolitics = function () {
    const h = pol0.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      return h.replace(/\(infamy (\d+)\)/g, (all, v) => `(${esc(VS.infamyWord(+v))})`);
    } catch (e) { return h; }
  };
}
// Most feared: the bar stays, the number becomes the word (the realm's short name is the label)
{
  const bar0 = UI.barRow;
  UI.barRow = function (label, v, max, cls, pot, valTxt) {
    try {
      if (VS.inFeared && typeof v === 'number' && valTxt == null && Object.values(A.S.realms || {}).some(r => r && r.infamy === v && UI.esc(r.short) === label)) return bar0.call(this, label, v, max, cls, pot, VS.infamyShort(v));
      if (label === 'Organization' && typeof v === 'number' && max > 0) return bar0.call(this, label, Math.min(v, max), max, cls, pot, VS.orgWord(v / max));
    } catch (e) {}
    return bar0.apply(this, arguments);
  };
}
// the Most feared rows are drawn inside worldTabPolitics after the "Most feared" heading: mark that stretch
if (typeof UI.worldTabPolitics === 'function') {
  const pol2 = UI.worldTabPolitics;
  UI.worldTabPolitics = function () {
    // barRow is only called for Most feared inside this view (the realm rows use their own markup)
    VS.inFeared = true;
    try { return pol2.apply(this, arguments); } finally { VS.inFeared = false; }
  };
}

// a war's price in the declaration ("infamy +4 · stability 2 · legitimacy -3"; the release prints a gain with no sign,
// and g-bands read "stability 2" as the band of 2): how each moves, in words
if (typeof UI.warDeclModal === 'function') {
  const wd0 = UI.warDeclModal;
  UI.warDeclModal = function () {
    const h = wd0.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      return h.replace(/(<div>Price<\/div><div>)([^<]*)(<\/div>)/, (all, a, list, b) => a + list.split(' · ').map(x => {
        const m = /^(infamy|stability|legitimacy) ([+−-]?)(\d{1,3})$/.exec(x.trim());
        return m ? `${m[1]} ${m[2] === '-' || m[2] === '−' ? 'down' : 'up'} ${infAmount(+m[3])}` : x;
      }).join(' · ') + b);
    } catch (e) { return h; }
  };
}
// 59-tooltips' treasury popover: "Income at <stability> 50, with the treasurer" (the baseline the income is told at)
if (UI.TIPS && typeof UI.TIPS.realmGold === 'function') {
  const rg0 = UI.TIPS.realmGold;
  UI.TIPS.realmGold = function () {
    const h = rg0.apply(this, arguments);
    try { return typeof h === 'string' ? h.replace(/Income at (<span [^>]*data-tt="realmStab"[^>]*>stability<\/span>) (\d{1,3})\b/g, (all, sp, v) => `Income while ${sp} is ${esc(VS.band('stability', +v))}`) : h; } catch (e) { return h; }
  };
}

// ---- the War Room: the division's numbers as comparisons -------------------------------------------------------------
VS.orgWord = f => (f >= 0.95 ? 'in full order' : f >= 0.7 ? 'in good order' : f >= 0.4 ? 'shaken' : f >= 0.15 ? 'breaking' : 'broken');
VS.cmpWord = (r, ref) => (!(r > 0) ? 'none' : r >= 1.6 ? `far above ${ref}` : r >= 1.2 ? `above ${ref}` : r > 0.84 ? `like ${ref}` : r > 0.6 ? `below ${ref}` : `far below ${ref}`);
const moWord = mo => (mo >= 75 ? 'eager' : mo >= 60 ? 'steady' : mo >= 45 ? 'sullen' : mo >= 30 ? 'shaken' : 'near breaking');
VS.divRef = function (d) {
  // yours: the commander's own divisions (not this one); with none, every division in the field ("most")
  let myR = null; try { myR = UI.wrMyR ? UI.wrMyR(A.pc()) : A.pc().realm; } catch (e) {}
  const all = (A.allDivs ? A.allDivs() : []).filter(x => x && x.id !== d.id);
  let set = all.filter(x => x.r === myR), ref = myR === d.r ? 'your others' : 'yours';
  if (!set.length) { set = all; ref = 'most'; }
  if (!set.length) return null;
  const acc = { soft: 0, hard: 0, def: 0, brk: 0, hp: 0, w: 0, sup: 0, arm: 0, prc: 0 };
  for (const x of set) {
    const c = A.divCombat(x), s = c.s || {};
    acc.soft += c.soft; acc.hard += c.hard; acc.def += c.def; acc.brk += c.brk; acc.hp += c.hp;
    acc.w += +s.w || 0; acc.sup += A.divSupUse(x) || 0; acc.arm += +s.arm || 0; acc.prc += +s.prc || 0;
  }
  for (const k in acc) acc[k] /= set.length;
  acc.ref = ref; acc.mine = myR === d.r;
  return acc;
};
if (typeof UI.wrStatGrid === 'function') {
  const grid0 = UI.wrStatGrid;
  UI.wrStatGrid = function (d) {
    try {
      const R = VS.divRef(d);
      if (!R) return grid0.apply(this, arguments);
      const c = A.divCombat(d), s = c.s || {}, L = A.xpLevel(d.exp), mo = A.divMaxOrg(d);
      const cell = (k, v, tip) => `<div title="${esc(tip)}"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
      const cmp = (a, b) => VS.cmpWord(b > 0 ? a / b : a > 0 ? 9 : 1, R.ref);
      // armour against piercing (the rule: less piercing than the other side's armour, half the attacks)
      const arm = R.mine ? cmp(+s.arm || 0, R.arm) : ((+s.arm || 0) > R.prc ? 'too heavy for your blows' : 'your blows bite');
      const prc = R.mine ? cmp(+s.prc || 0, R.prc) : ((+s.prc || 0) >= R.arm ? 'goes through your armour' : 'glances off your armour');
      return `<div class="wr-stats v2-wr-stats">${cell('Soft atk', cmp(c.soft, R.soft), 'Attacks per day against men')}${cell('Hard atk', cmp(c.hard, R.hard), 'Attacks per day against armor and beasts')}` +
        `${cell('Defense', cmp(c.def, R.def), 'Attacks it can block when defending')}${cell('Breakthr.', cmp(c.brk, R.brk), 'Attacks it can block when attacking')}` +
        `${cell('Org', VS.orgWord((d.org || 0) / Math.max(1, mo)), 'Organization: how long it keeps fighting')}${cell('HP', cmp(c.hp, R.hp), 'How much damage it can take')}` +
        `${cell('Width', cmp(+s.w || 0, R.w), 'Combat width used: how much of the front it takes')}${cell('Supply', cmp(A.divSupUse(d) || 0, R.sup), 'Supply used per day')}` +
        `${cell('Speed', A.divSpeed(d).toFixed(0) + ' km', 'Kilometres a day on open ground')}${cell('Armor', arm, 'Enemies with less piercing do half their attacks')}` +
        `${cell('Piercing', prc, "Beat the enemy's armor or lose half your attacks")}${cell('Exp.', L[1], `${L[1]}: experience adds to attack and defense`)}</div>`;
    } catch (e) { console.error('v2 war room grid', e); }
    return grid0.apply(this, arguments);
  };
}
if (typeof UI.wrDivPanel === 'function') {
  const div0 = UI.wrDivPanel;
  UI.wrDivPanel = function () {
    const h = div0.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      // 9997-companies' order of battle: "mo 64", "xp 18", "morale 64 (steady)"
      return h.replace(/(data-tt="coMo" data-v="[^"]*">)mo (\d+)(<\/span>)/g, (all, a, v, b) => a + esc(moWord(+v)) + b)
        .replace(/(data-tt="coXp" data-v="[^"]*">)xp (\d+)(<\/span>)/g, (all, a, v, b) => a + esc(A.xpLevel(+v)[1].toLowerCase()) + b)
        .replace(/(aria-label=")morale (\d+)(")/g, (all, a, v, b) => a + 'morale ' + esc(moWord(+v)) + b)
        .replace(/morale (\d+) \(([a-z ]+)\)/g, (all, v, w) => `morale ${w}`);
    } catch (e) { return h; }
  };
}

// 59-tooltips' popover on a cell of an enemy's grid gave the exact figure and its parts ("Soft attack 139.9"): what a
// scout sees is the comparison, and what the figure does
if (UI.TIPS && typeof UI.TIPS.divStat === 'function') {
  const ds0 = UI.TIPS.divStat;
  const NAMES = { soft: ['Soft attack', 'Attacks a day against men.'], hard: ['Hard attack', 'Attacks a day against armor and beasts.'], def: ['Defense', 'Attacks it can turn aside when it is attacked.'],
    brk: ['Breakthrough', 'Attacks it can turn aside when it attacks.'], hp: ['Hit points', 'How much damage it can take: the men, at their strength.'], w: ['Width', 'How much of a front it fills.'],
    sup: ['Supply', 'What it eats a day.'], arm: ['Armor', 'An enemy with less piercing does half its attacks.'], prc: ['Piercing', "Beat the enemy's armor or lose half your attacks."],
    org: ['Organization', 'How long it keeps fighting.'], exp: ['Experience', 'Experience adds to attack and defense.'], spd: ['Speed', 'Kilometres a day on open ground.'] };
  UI.TIPS.divStat = function (arg) {
    try {
      const [id, k] = String(arg).split('|'), d = A.divById ? A.divById(id) : null;
      let myR = null; try { myR = UI.wrMyR(A.pc()); } catch (e) {}
      if (d && NAMES[k] && myR && A.hostile(myR, d.r)) {
        const box = document.createElement('div'); box.innerHTML = UI.wrStatGrid(d);
        const cell = box.querySelectorAll('.wr-stats > div')[['soft', 'hard', 'def', 'brk', 'org', 'hp', 'w', 'sup', 'spd', 'arm', 'prc', 'exp'].indexOf(k)];
        const word = cell ? (cell.querySelector('b') || {}).textContent : '';
        return `<div class="tip-h">${esc(NAMES[k][0])} <b>${esc(word)}</b> <span class="muted">${esc(d.name)}</span></div><div class="tip-d">${esc(NAMES[k][1])} What your outriders can tell, against your own divisions.</div>`;
      }
    } catch (e) { console.error('v2 war room popover', e); }
    return ds0.apply(this, arguments);
  };
}
// the map list's bars: "Organization 81/81 · Strength 98%" in the title
if (typeof UI.wrBarsBasic === 'function') {
  const bars0 = UI.wrBarsBasic;
  UI.wrBarsBasic = function (d) {
    const h = bars0.apply(this, arguments);
    try { return typeof h === 'string' ? h.replace(/Organization (\d+)\/(\d+)/, (all, a, b) => esc(VS.orgWord(+a / Math.max(1, +b)))) : h; } catch (e) { return h; }
  };
}
// 9997-companies' popovers in the order of battle: the morale and experience as words
for (const [k, re, fn] of [
  ['coXp', /<b>Experience (\d+)<\/b><div class="tiny">Of 100\. /, (all, v) => `<b>Experience: ${esc(A.xpLevel(+v)[1].toLowerCase())}</b><div class="tiny">`],
  ['coDivMo', /<b>Morale (\d+)<\/b>/, (all, v) => `<b>Morale: ${esc(moWord(+v))}</b>`],
  ['coMo', /Morale (\d+) \(([a-z ]+)\); it settles towards (\d+):/, (all, v, w, t) => `Morale ${w}; it settles towards ${esc(moWord(+t))}:`],
]) {
  const f0 = UI.TIPS && UI.TIPS[k];
  if (typeof f0 === 'function') UI.TIPS[k] = function () { const h = f0.apply(this, arguments); try { return typeof h === 'string' ? h.replace(re, fn) : h; } catch (e) { return h; } };
}

// ---- training, skills, the profile: tiers and words -------------------------------------------------------------------
const STATN = () => Object.values(GD.STAT_NAMES || {});
const skillKey = name => { for (const k in GD.SKILLS || {}) if (GD.SKILLS[k] === name) return k; return null; };
const statKey = name => { for (const k in GD.STAT_NAMES || {}) if (GD.STAT_NAMES[k] === name) return k; return null; };
// a stat's change by its name: "speed -7" -> "a little slower"
const STAT_DIR = { strength: ['stronger', 'weaker'], speed: ['faster', 'slower'], stamina: ['more stamina', 'less stamina'], 'combat instincts': ['quicker to react', 'slower to react'],
  instincts: ['quicker to react', 'slower to react'], intelligence: ['sharper', 'duller'], wits: ['sharper', 'duller'], willpower: ['firmer of will', 'weaker of will'], will: ['firmer of will', 'weaker of will'] };
const how = d => (Math.abs(d) <= 3 ? 'a little ' : Math.abs(d) >= 10 ? 'much ' : '');
const statDelta = (name, sign, n) => { const w = STAT_DIR[String(name).toLowerCase()]; if (!w) return null; const up = sign === '+'; return how(n) + (up ? w[0] : w[1]); };
const gain = v => (v < 0.8 ? 'a little' : v < 2 ? 'some' : v < 4 ? 'a good deal' : 'a great deal');
VS.NUMRULES2 = [
  // 996-coming-up's digest: "You got better at Survival & hunting +2.4, Farming & herding +1.0." (the season's own line,
  // "... of it from doing", is i-numbers' rule, which reads the whole sentence: leave it to that one)
  [/got better at ([^.]*?\+\d[^.]*?(?:\.\d[^.]*?)*)\.( ?)([a-z]?)/g, (all, list, sp, c, off, str) => (/ of it from doing/.test(str) ? all :
    'got better at ' + list.replace(/([A-Z][A-Za-z&:' ]*?) \+(\d+(?:\.\d+)?)/g, (m, n, v) => `${n} (${gain(+v)})`) + '.' + sp + c.toUpperCase())],
  // 49-body-mind's age line: "Strength: best 59 at 19 · holds until about 42"
  [/\b([A-Z][A-Za-z ]{2,20}): best (\d{1,3}) at (\d{1,3})\b/g, (all, n, v, a) => (statKey(n) || STAT_DIR[n.toLowerCase()] ? `${n}: at its best at ${a}` : all)],
  // 48-fight-ladder's wound costs: "worth 42 to 41", "Elite 66 to Veteran 58", "(speed -7, stamina -3)"
  [/\bworth (\d{1,3}) to (\d{1,3})\b/g, (all, a, b) => (+a - +b >= 6 ? 'worth a good deal less' : +a > +b ? 'worth a little less' : 'worth no less')],
  [/\b(Untrained|Brawler|Trained|Veteran|Elite|Master|Champion|Legend|Hero) (\d{1,3}) to (Untrained|Brawler|Trained|Veteran|Elite|Master|Champion|Legend|Hero) (\d{1,3})\b/g, (all, a, x, b) => `from ${a} to ${b}`],
  [/\b(strength|speed|stamina|combat instincts|instincts|intelligence|wits|willpower|will) ([+−-])(\d{1,2})\b/gi, (all, n, s, v) => statDelta(n, s, +v) || all],
  // 49-body-mind's wounds: "−7 speed, −3 stamina, Athletics & climbing −10"
  [/([+−-])(\d{1,2}) (strength|speed|stamina|combat instincts|instincts|intelligence|wits|willpower|will)\b/gi, (all, s, v, n) => statDelta(n, s, +v) || all],
  // (a skill's cost, "Athletics & climbing −10", is i-numbers' rule: "Athletics & climbing down a good deal")
  // the proficiencies page: "Perks unlock at 40, 65 and 85"
  [/Perks unlock at (\d{1,3}), (\d{1,3}) and (\d{1,3})/g, (all, a, b, c) => `Perks unlock at ${tierName(a)}, ${tierName(b)} and ${tierName(c)}`],
  // the decisions: "A proficiency at 50 (best: Bows & throwing 67)", "Learning 55, or a diploma"
  [/A proficiency at (\d{1,3}) \(best: ([^)]+?) (\d{1,3})\)/g, (all, a, n, b) => `A proficiency at ${tierName(a)} (best: ${n}, ${tierName(b)})`],
  [/\bLearning (\d{1,3})(, or a diploma)/g, (all, a, rest) => `Letters & learning at ${tierName(a)}${rest}`],
  // a staff candidate (Arms): "— fit 66 · Elite" and "fit for the post: 66"
  [/ — fit (\d{1,3}) · /g, (all, v) => ` — fit: ${tierName(v)} · `],
  // a door's skill: "Needs Crossbow 30 (you have 2)"
  [/\bNeeds ([A-Z][A-Za-z&:' ]{2,30}?) (\d{1,3}) \(you have (\d{1,3})\)/g, (all, n, a, b) => (skillKey(n) ? `Needs ${n} at ${tierName(a)} (you are ${tierName(b)})` : all)],
  // fighting worth on the 0-100 scale (an ambition's step, a fight's popover): the tier
  [/\bFighting worth (\d{1,3})(?: of (\d{1,3}))?(?![\d+])/g, (all, v, top) => (A.tierOf ? `Fighting worth: ${A.tierOf(+v).n}${top ? `, with ${A.tierOf(+top).n} at the top` : ''}` : all)],
  // 49-body-mind's yard: "health worn, come back at 50", "rest to 50 first"
  [/\bcome back at (\d{1,3})\b/g, (all, v) => `come back when you are ${VS.band('health', +v)} or better`],
  [/\brest to (\d{1,3}) first\b/g, (all, v) => `rest until you are ${VS.band('health', +v)} or better first`],
  // 97-life-fixes' door: "your chance is under 2 in 100"
  [/\byour chance is under \d+ in 100\b/g, () => 'your chance is next to none'],
  // infamy as a number anywhere it is swept (every spelling the game and its features use):
  // - the rule's thresholds: "At 40 neighbors start a coalition; above 60 it may march." (the realm tab, the popover),
  //   "at 40 coalitions form; above 60 they march." (pl_coalition_letter), "Keep infamy below 60 or they will march
  //   together." (the realm tab's coalition warning)
  [/\b([Aa])t 40 (?:neighbors start a coalition|coalitions form); above 60 (?:they march together|it may march|they march)\./g, (all, a) =>
    (a === 'A' ? VS.INFAMY_RULE.charAt(0).toUpperCase() + VS.INFAMY_RULE.slice(1) : VS.INFAMY_RULE) + '.'],
  [/\bKeep infamy below 60 or they will march together\./g, () => 'Do not let them come to hate you, or they will march together.'],
  // - "Your infamy is 47" (pl_coalition_letter)
  [/\b([Yy])our infamy is (\d{1,3})\b/g, (all, y, v) => `${y}our realm is ${VS.infamyShort(+v)} abroad`],
  // - "(infamy 47)" (the ruler's coalition letter, the Coalitions list) and the map legend's "(infamy 60+)"
  [/\(infamy (\d{1,3})\+?\)/g, (all, v) => `(${VS.infamyWord(+v)})`],
  // - "Their infamy (47)", "Aldmark's infamy (61)" (a realm's reasons, the AI's reasons for a coalition)
  [/\b([Ii]nfamy) \((\d{1,3})\)/g, (all, w, v) => `${w} (${VS.infamyShort(+v)})`],
  // - a change: "infamy +6" (a war's cost)
  [/\b([Ii]nfamy) ([+−-])(\d{1,3})\b(?!\.\d)/g, (all, w, sg, v) => `${w} ${sg === '+' ? 'up' : 'down'} ${infAmount(+v)}`],
  // a realm's other 0-100 measures as they change: "stability -5", "legitimacy -3" (a war's cost; g-bands' rule read the
  // sign as a separator and gave the band of 5, "near collapse")
  [/\b(stability|legitimacy|authority|war weariness)\s?([+−-])(\d{1,3})\b(?![.,]\d|\s*(?:suns?|years?|%))/gi, (all, w, sg, v) => `${w} ${sg === '+' ? 'up' : 'down'} ${infAmount(+v)}`],
  // - "Infamy 47: your neighbors talk of a coalition" (the advisor's hint and its title), "· infamy 47" (a realm's card)
  [/\b([Ii]nfamy):? (\d{1,3})(?![\d+%]|\.\d)(:?)/g, (all, w, v, c) => `${w}: ${VS.infamyShort(+v)}${c ? ';' : ''}`],
  // the realm's other thresholds and costs, as the realm tab and its popovers say them (59-tooltips' glossary):
  // stability "below 18 a rising becomes likely", "An empty treasury costs 6 stability", legitimacy's yearly pull
  // "(legitimacy − 50) ÷ 25 a year"
  [/\bbelow 18 a rising becomes likely/g, () => `once it is ${VS.band('stability', 17)} a rising becomes likely`],
  [/\bcosts (\d{1,2}) stability\b/g, (all, v) => `costs ${+v < 3 ? 'a little' : +v < 8 ? 'some' : 'a good deal'} of its stability`],
  [/: \(legitimacy − 50\) ÷ 25 a year/g, () => ': up a little each year while legitimacy is more than middling, down while it is less'],
  // a faction's demand (the rules: 40% of the power and 60 discontent), after the percentage became words:
  // "A faction with about two in five+ power and 60+ discontent", "At about two in five and 60 discontent",
  // "At 60, with about two in five of the power, ... sets it back to 0"
  [/\b(about two in five|40%)\+ power and 60\+ discontent\b/g, () => `about two in five of the power, once it is ${VS.band2 ? VS.band2('discontent', 60) : 'angry'},`],
  [/\bAt (about two in five|40%) and 60 discontent\b/g, () => `At about two in five of the power, once it is ${VS.band2 ? VS.band2('discontent', 60) : 'angry'},`],
  [/\bAt 60, with (about two in five|40%) of the power, (.*?) sets it back to 0\b/g, (all, a, mid) => `Once it is ${VS.band2 ? VS.band2('discontent', 60) : 'angry'}, with about two in five of the power, ${mid} quiets it again`],
  // 56-realm-inside's court reasons: "A faction stirs (discontent 44)", "The lords are sullen (mean loyalty 38)"
  [/\((discontent|mean loyalty) (\d{1,3})\)/g, (all, k, v) => `(${k === 'discontent' ? 'discontent' : 'loyalty'}: ${VS.band2 ? VS.band2(k === 'discontent' ? 'discontent' : 'loyalty', +v) : VS.band('stability', +v)})`],
  // a realm's opinion of another in the treaty reasons and an envoy's letter: "Opinion -4 (−2)", "(Relations +12.)"
  [/(?<=[(·]\s?)\b(Opinion|Relations) ([+−-]?\d{1,3})(?=\s*$|\s*\(|\.\))/g, (all, k, v) => (VS.band2 ? `${k}: ${VS.band2('opinion', +String(v).replace('−', '-'))}` : all)],
  // 59-tooltips' treasury popover: "Income at stability 50, with the treasurer"
  [/\bIncome at stability (\d{1,3})\b/g, (all, v) => `Income while the realm is ${VS.band('stability', +v)}`],
  // a superior's letter in the Path's asks: "Opinion 50+: a letter from them"
  [/\bOpinion (\d{1,3})\+:/g, (all, v) => (VS.band2 ? `When they think you ${VS.band2('opinion', +v)} or better:` : all)],
  // an embassy's gifts: the toast "Opinion +12" and the log's "Their opinion of you rises (+12)." (a change)
  [/^(\s*)Opinion \+(\d{1,3})(\s*)$/, (all, a, v, b) => `${a}Their opinion of you rises ${infAmount(+v)}${b}`],
  [/\b(opinion of you (?:rises|falls)) \([+−-](\d{1,3})\)/g, (all, w, v) => `${w} ${infAmount(+v)}`],
  // a realm's sparkline: "Stability since 1105: 46 to 61"
  [/\b(Stability|Legitimacy|Health|Happiness|Honou?r|Piety) since (\d{4}): (\d{1,3}) to (\d{1,3})\b/g, (all, k, y, a, b) => `${k} since ${y}: ${VS.band(k, +a)} to ${VS.band(k, +b)}`],
];
const deNum0 = VS.deNum;
VS.deNum = function (t, node) {
  if (typeof t !== 'string' || !/\d/.test(t)) return deNum0.apply(this, arguments);
  const par = node && node.parentNode;
  // a picker of skills or people with the skill in brackets: "Melee (14)" (a mentor), "Gerd of Asch (52)" (the council)
  if (par && par.nodeName === 'OPTION') {
    const m = /^(.+?) \((\d{1,3})\)$/.exec(t.trim()), sel = par.parentNode && par.parentNode.closest ? par.parentNode.closest('select') : null, c = sel && sel.getAttribute('data-c');
    if (m && (skillKey(m[1]) || c === 'rAppoint')) return `${m[1]} — ${tierName(m[2])}`;
  }
  // "fit for the post: <b>66</b>" (the number alone in its element)
  if (par && /^\s*\d{1,3}\s*$/.test(t) && par.previousSibling && /fit for the post:\s*$/.test(par.previousSibling.textContent || '')) return tierName(t.trim());
  let s = t;
  for (const [re, fn] of VS.NUMRULES2) s = s.replace(re, fn);
  return deNum0.call(this, s, node);
};
// a title that carries one of these numbers (hover text is read too): the same words, at each draw
VS.sweepTitles = function (root) {
  if (!root || !root.querySelectorAll) return;
  for (const el of root.querySelectorAll('[title]')) {
    const v = el.getAttribute('title');
    if (!v || !/\d/.test(v) || v.indexOf('%') >= 0) continue;
    let t = v; for (const [re, fn] of VS.NUMRULES2) t = t.replace(re, fn);
    if (t !== v) el.setAttribute('title', t);
  }
};
{
  const sw0 = VS.sweep;
  VS.sweep = function (root) {
    const r = sw0.apply(this, arguments);
    try { VS.sweepTitles(root && root.nodeType === 1 ? root : null); } catch (e) {}
    return r;
  };
}
// the council: "Marshal ... — Command 52" for the holder
if (typeof UI.realmTabBasic === 'function') {
  const rt0 = UI.realmTabBasic;
  UI.realmTabBasic = function () {
    const h = rt0.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      return h.replace(/( — )([^<]{2,40}?) (\d{1,3})(<span class="right">)/g, (all, a, n, v, b) => (skillKey(n) ? `${a}${n}: ${esc(tierName(v))}${b}` : all));
    } catch (e) { return h; }
  };
}
// the needs' words take more room than a number: let 91-look's box fit them
VS.css2 = '.lk-need .val.v2-needw{min-width:0;white-space:nowrap;font-size:.92em}.v2-wr-stats b{font-size:.85em;line-height:1.15;white-space:normal}';
{
  const st0 = VS.style;
  VS.style = function () {
    if (st0) st0.apply(this, arguments);
    if (typeof document === 'undefined' || document.getElementById('v2s-style2')) return;
    const s = document.createElement('style'); s.id = 'v2s-style2'; s.textContent = VS.css2; document.head.appendChild(s);
  };
}
