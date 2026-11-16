// Ardan v2 demo shell. One screen, five places, one button. Cards arrive one at a time.
import { createGame, nextMonth, choose, sheet, PLANS, stepCampaign, fightPhase, CHOICES, beginCampaign } from '../game.js';
import { describe, stats, skillInfo, fightingWorth, MENTAL, GEAR } from '../body.js';
import { familyTree, relationLabel } from '../kin.js';
import { renderMap } from '../map/render.js';
import { riverPaths } from '../map/continent.js';
import { reasons, statusOf } from '../diplomacy.js';
import { TACTICS, TERRAIN, PHASES, armyMen, facing, playerOdds } from '../war.js';
import { lowerNoble, RANK_TITLE } from '../nobility.js';
import { oddsWords } from '../odds.js';
import { renown, renownWords } from '../renown.js';

const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};
const MONTHS = ['Deepwinter', 'Thaw', 'Seedtime', 'Rainmonth', 'Bloom', 'Highsun', 'Haymonth', 'Harvest', 'Reaping', 'Leaffall', 'Frostfall', 'Longnight'];

let G = null, tab = 'life', queue = [], feed = [], mapCache = null;

function boot() {
  const start = $('#start');
  start.hidden = false; $('#app').hidden = true;
  $('#begin').onclick = () => {
    const estate = $('#estate').value, sexSel = $('#sex').value, seed = $('#seed').value.trim() || 'ardan';
    $('#begin').disabled = true; $('#begin').textContent = 'Raising mountains…';
    setTimeout(() => {
      G = createGame({ seed, estate, sex: sexSel === 'any' ? null : sexSel, mapSize: [480, 330] });
      G.plan = 'play';
      feed = [{ when: stamp(), kind: 'life', text: G.chronicle[0].text }];
      start.hidden = true; $('#app').hidden = false; mapCache = null;
      render();
    }, 30);
  };
}
const pl = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const stamp = () => `${MONTHS[G.world.month - 1]} ${G.world.year}`;
const ageText = (a) => { if (a >= 1) return `${Math.floor(a)}`; const m = Math.max(0, Math.round(a * 12)); return m === 1 ? '1 month' : `${m} months`; };

// ---------- frame ----------
function render() {
  const me = G.me, W = G.world;
  $('#who').textContent = `${me.name} of House ${me.house}`;
  $('#when').textContent = `${stamp()} · age ${ageText(me.age)}`;
  $('#where').textContent = W.realms[me.realm].name;
  for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
  $('#tab-war').hidden = !G.campaign;
  const main = $('#main'); main.replaceChildren(({ life: viewLife, you: viewYou, family: viewFamily, world: viewWorld, war: viewWar })[tab]());
  const next = $('#next');
  next.hidden = !!G.campaign || queue.length > 0;
}

function goNext() {
  const r = nextMonth(G);
  queue = r.cards.slice();
  if (r.quiet) { feed.unshift({ when: stamp(), kind: 'quiet', text: r.quiet }); toast(r.quiet); }
  showCard();
}

function showCard() {
  const sheetEl = $('#card');
  if (!queue.length) { sheetEl.hidden = true; render(); return; }
  const c = queue[0];
  const body = h('div', { class: 'card-body' },
    h('p', { class: 'card-kind' }, { event: 'This month', news: c.certain ? 'News' : 'Rumour', life: 'Family', quiet: 'This month', notice: 'Note' }[c.kind] ?? 'This month'),
    h('p', { class: 'card-text' }, c.text),
    h('p', { class: 'card-count' }, queue.length > 1 ? `${queue.length - 1} more this month` : ''));
  const acts = h('div', { class: 'card-acts' });
  if (c.kind === 'event') {
    for (const ch of c.choices) {
      acts.append(h('button', { class: 'choice', onclick: () => resolve(c, ch.i) },
        h('span', { class: 'choice-label' }, ch.label),
        ch.odds ? h('span', { class: 'odds' }, scale(ch.tilt), h('span', {}, ch.odds)) : null,
        ch.oddsLine ? h('span', { class: 'odds-line' }, ch.oddsLine) : null));
    }
  } else acts.append(h('button', { class: 'primary', onclick: () => { feed.unshift({ when: stamp(), kind: c.kind, text: c.text }); queue.shift(); showCard(); } }, 'Continue'));
  sheetEl.replaceChildren(h('div', { class: 'card enter' }, body, acts));
  sheetEl.hidden = false;
  render();
  sheetEl.querySelector('button')?.focus();
}

function resolve(c, i) {
  const out = choose(G, c, i);
  const r = out.result;
  const tag = r ? (r.surged ? 'A surge of will' : r.blundered ? 'A blunder' : r.success ? (r.tier === 'triumph' ? 'Triumph' : 'Success') : 'Failure') : null;
  feed.unshift({ when: stamp(), kind: 'event', text: `${c.text} — ${c.choices[i].label}. ${out.text}`, tag });
  const sheetEl = $('#card');
  sheetEl.replaceChildren(h('div', { class: 'card' },
    h('div', { class: 'card-body' }, h('p', { class: 'card-kind' }, c.choices[i].label), tag ? h('p', { class: `verdict v-${r.success ? 'win' : 'loss'}` }, tag + (r.reasons?.length ? ` · ${r.reasons[0]}` : '')) : null, h('p', { class: 'card-text' }, out.text),
      r?.breakthrough ? h('p', { class: 'verdict v-win' }, 'Breakthrough: a limit of yours has risen for good.') : null),
    h('div', { class: 'card-acts' }, h('button', { class: 'primary', onclick: () => { queue.shift(); if (G.campaign) { tab = 'war'; } showCard(); } }, 'Continue'))));
  sheetEl.querySelector('button')?.focus();
}

function toast(text) {
  const t = $('#toast'); t.textContent = text; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2200);
}
// tipped balance: odds without numbers
function scale(tilt) {
  const deg = -(tilt ?? 0) * 18;
  return h('span', { class: 'scale', 'aria-hidden': 'true', style: `--tilt:${deg}deg` }, h('span', { class: 'beam' }));
}

// ---------- Life ----------
function viewLife() {
  const me = G.me, adult = me.age >= 14, plans = adult ? { ...PLANS.adult, ...(me.estate === 'commoner' ? { court: 'Go to market and make friends' } : {}) } : PLANS.child;
  if (!plans[G.plan]) G.plan = Object.keys(plans)[0];
  const planBox = me.age >= 2 ? h('section', { class: 'plan' }, h('h2', {}, 'Your days'),
    h('div', { class: 'seg', role: 'radiogroup' }, ...Object.entries(plans).map(([k, v]) => h('button', { role: 'radio', 'aria-checked': String(G.plan === k), onclick: () => { G.plan = k; render(); } }, v))),
    h('p', { class: 'hint' }, 'What you do each month is what you get better at.')) : h('p', { class: 'hint' }, 'You are too small to choose your days. You eat, sleep and grow.');
  const list = h('ol', { class: 'feed' }, ...feed.slice(0, 60).map((f) => h('li', { class: `f-${f.kind}` }, h('span', { class: 'f-when' }, f.when), f.tag ? h('span', { class: 'f-tag' }, f.tag) : null, h('p', {}, f.text))));
  return h('div', { class: 'view' }, planBox, h('h2', {}, 'Your life so far'), list);
}

// ---------- You ----------
function viewYou() {
  const me = G.me, d = describe(me), s = stats(me);
  const fw = fightingWorth(me, 'sword', me.gear ?? 'none');
  const row = (label, v) => h('div', { class: 'stat' }, h('span', { class: 'stat-l' }, label), h('span', { class: 'stat-v' }, v.value ?? v), v.words ? h('span', { class: 'stat-w' }, v.words + (v.rank ? ` · ${v.rank}` : '')) : null);
  const skills = Object.keys(me.body.skills).map((k) => [k, skillInfo(me, k)]).sort((a, b) => b[1].hours - a[1].hours);
  const rn = renown(me, G.world.year);
  return h('div', { class: 'view' },
    h('section', {}, h('h2', {}, 'Body'), h('p', { class: 'hint' }, `${d.height} tall, ${d.weight}. ${d.raceNote}.`),
      row('Strength', d.lift), row('Speed', d.sprint), row('Endurance', d.march), row('Reflexes', d.reaction), row('Toughness', d.toughness),
      me.body.wounds.length ? h('p', { class: 'warn' }, `Old wounds: ${me.body.wounds.map((w) => w.kind).join(', ')}`) : null,
      me.body.breakthroughs.length ? h('p', { class: 'good' }, `Breakthroughs: ${me.body.breakthroughs.map((b) => `${b.attr} at ${Math.floor(b.age)} (${b.note})`).join('; ')}`) : null),
    h('section', {}, h('h2', {}, 'In a fight'),
      me.age < 12 ? h('p', { class: 'big' }, 'A child. Not a fighter yet.') : h('p', { class: 'big' }, fw.worth < 0.95 ? 'Less dangerous than one ordinary levy' : `As dangerous as about ${fw.worth < 3 ? fw.worth.toFixed(1) : Math.round(fw.worth)} ordinary levies`),
      me.age >= 12 ? h('p', { class: 'hint' }, `Body: ${fw.parts.body < 0.8 ? 'below a grown man' : fw.parts.body < 1.3 ? 'like a grown man' : fw.parts.body < 2.5 ? 'a soldier\'s body' : 'far beyond most'}. Skill: ${skillInfo(me, 'sword').name.toLowerCase()} with a sword. Gear: ${GEAR[me.gear ?? 'none'].name}. For scale: a giant counts as about 20 levies, a sworn order knight as 15 to 25.`) : null),
    h('section', {}, h('h2', {}, 'Mind'), ...MENTAL.map((k) => h('div', { class: 'stat' }, h('span', { class: 'stat-l' }, k[0].toUpperCase() + k.slice(1)), h('span', { class: 'stat-v' }, d[k].words), h('span', { class: 'stat-w' }, d[k].rarity)))),
    h('section', {}, h('h2', {}, 'Skills'), skills.length ? skills.map(([k, i]) => h('div', { class: 'stat' }, h('span', { class: 'stat-l' }, k[0].toUpperCase() + k.slice(1)), h('span', { class: 'stat-v' }, i.name), h('span', { class: 'stat-w' }, `${i.hours} hours practised${i.nextName ? ` · ${i.toNext} more to ${i.nextName}` : ''}`))) : h('p', { class: 'hint' }, 'Nothing yet. Skills come from what you do.')),
    h('section', {}, h('h2', {}, 'Standing'), h('p', {}, `Renown: ${renownWords(rn)}.`), me.devout ? h('p', {}, `Faith: you keep the faith (${me.faith ?? 0} devotion).`) : h('p', { class: 'hint' }, 'Faith plays no part in your life unless you choose it.')));
}

// ---------- Family ----------
function chip(p, rel) {
  const age = G.world.year - p.birthYear;
  const tags = [...(p.titles ?? []).slice(0, 1).map((t) => t.split(' — ')[0] + ' of ' + (t.split(' — ')[1] ?? '').replace(/^(County|March|Duchy) of /, '')), p.office, p.heirTo ? `heir to ${p.heirTo}` : null].filter(Boolean);
  return h('div', { class: `kin${p.isPlayer ? ' me' : ''}${p.deathYear != null ? ' dead' : ''}` },
    h('span', { class: 'kin-rel' }, rel), h('span', { class: 'kin-name' }, p.name),
    h('span', { class: 'kin-meta' }, p.deathYear != null ? `died ${p.deathYear}` : `age ${Math.max(0, age)}`),
    ...tags.map((t) => h('span', { class: 'seal' }, t)));
}
function viewFamily() {
  const s = sheet(G), tree = familyTree(G.world.people, G.me);
  const genName = { '-2': 'Grandparents', '-1': 'Parents, uncles and aunts', 0: 'Your generation', 1: 'Children, nephews and nieces', 2: 'Grandchildren' };
  const house = G.world.houses.get(G.me.house);
  return h('div', { class: 'view' },
    h('section', {}, h('h2', {}, 'Inheritance'), h('p', { class: 'big' }, s.seat ? (s.place?.text ?? `Nobody living holds ${s.seat}.`) : 'Your family holds no title. What you inherit is your name and whatever you make of it.'),
      s.seat ? h('p', { class: 'hint' }, `${s.holder ? `${s.holder.name} holds ${s.seat}. ` : ''}House ${G.me.house} follows ${({ 'male-preference': 'male-preference primogeniture', absolute: 'absolute primogeniture', agnatic: 'agnatic primogeniture', seniority: 'seniority', elective: 'house election' })[house.law.law]}. ${house.law.fitness === 'unfit-passed-over' ? 'The house council may pass over an heir it judges unfit.' : 'The law is the law, fit or not.'}`) : null),
    h('section', {}, h('h2', {}, 'Kin who matter'), h('div', { class: 'kin-grid' }, ...s.kin.slice(0, 12).map((k) => chip(k.person, k.relation)))),
    h('section', {}, h('h2', {}, 'Family tree'), ...tree.map((row) => h('div', { class: 'gen' }, h('h3', {}, genName[row.gen] ?? ''), h('div', { class: 'kin-row' }, ...row.people.map((x) => chip(x.p, x.rel)))))));
}

// ---------- World ----------
function viewWorld() {
  const W = G.world, me = G.me;
  const wrap = h('div', { class: 'map-wrap' });
  drawMap(wrap);
  const rel = W.realms.filter((r) => r.id !== me.realm).map((r) => {
    const st = statusOf(W.diplomacy, me.realm, r.id), why = reasons(W.diplomacy, me.realm, r.id);
    const tw = why.filter((x) => x.toward), aw = why.filter((x) => !x.toward);
    return h('details', { class: 'realm' }, h('summary', {}, h('span', {}, r.name), h('span', { class: `pill p-${st.replace(/[^a-z]/g, '')}` }, st)),
      h('div', { class: 'why' }, tw.length ? h('p', {}, h('b', {}, 'Drawing together: '), tw.map((x) => x.text).join('; ') + '.') : null, aw.length ? h('p', {}, h('b', {}, 'Pulling apart: '), aw.map((x) => x.text).join('; ') + '.') : null, !why.length ? h('p', {}, 'No strong feelings either way.') : null));
  });
  const ords = W.orders.map((o) => h('div', { class: 'stat' }, h('span', { class: 'stat-l' }, o.name), h('span', { class: 'stat-v' }, `${o.members} sworn`), h('span', { class: 'stat-w' }, `${o.style}; fights like about ${Math.round(o.strengthInLevies / 100) * 100} levies. Patron: ${W.realms[o.patron].name}.`)));
  const realm = W.realms[me.realm], hs = realm.hierarchy;
  const great = hs.titles.filter((t) => t.rank === 'duke' || t.rank === 'marquis').map((t) => { const n = lowerNoble(W.seed, realm, t.id, t.rank, 0); return h('div', { class: 'stat' }, h('span', { class: 'stat-l' }, RANK_TITLE[t.rank][n.sex === 'female' ? 1 : 0]), h('span', { class: 'stat-v' }, `${n.given} of House ${n.house}`), h('span', { class: 'stat-w' }, `${t.name}, ${t.provinces.length} counties${t.rank === 'marquis' ? ', guarding the border' : ''}`)); });
  const sm = hs.summary;
  return h('div', { class: 'view' }, wrap,
    h('section', {}, h('h2', {}, `The nobility of ${realm.name}`), h('p', { class: 'hint' }, `${pl(sm.dukes, 'duke')}, ${pl(sm.marquises, 'marquis', 'marquises')}, ${pl(sm.counts, 'count')}, ${pl(sm.viscounts, 'viscount')}, ${pl(sm.barons, 'baron')} and about ${Math.round(sm.lords / 10) * 10} landed lords.`), ...great),
    h('section', {}, h('h2', {}, `${W.realms[me.realm].name} and its neighbours`), h('p', { class: 'hint' }, 'You learn of other realms only by news and rumour. Open a realm to see why relations stand as they do.'), ...rel),
    h('section', {}, h('h2', {}, 'The elite orders'), h('p', { class: 'hint' }, 'Only five in all the continent. Each is a few hundred strong and fights like an army.'), ...ords));
}

function drawMap(wrap) {
  const W = G.world, map = W.map;
  if (!mapCache) {
    const scale = 2;
    const img = renderMap(map, { scale, borders: true, realmOfProvince: (p) => (p < 0 ? -1 : W.realmOf[p]), borderColor: [244, 232, 200] });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
    // smooth vector rivers
    ctx.strokeStyle = 'rgba(58,98,122,0.9)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const p of riverPaths(map, 200)) {
      ctx.beginPath(); p.forEach(([x, y], i) => (i ? ctx.lineTo(x * scale, y * scale) : ctx.moveTo(x * scale, y * scale)));
      ctx.lineWidth = Math.min(2.6, 0.5 + Math.log(p[p.length - 1][2] / 200) * 0.5); ctx.stroke();
    }
    // realm names
    ctx.font = '700 24px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
    for (const r of W.realms) {
      const pr = r.provinces.map((id) => map.provinces.list[id]);
      const cx = pr.reduce((a, p) => a + p.x, 0) / pr.length * scale, cy = pr.reduce((a, p) => a + p.y, 0) / pr.length * scale;
      const name = r.name.replace(/^(Kingdom|Empire|Principality) of /, '').toUpperCase();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,24,40,0.6)'; ctx.strokeText(name, cx, cy);
      ctx.fillStyle = r.id === G.me.realm ? '#f0c062' : '#f4ecd8'; ctx.fillText(name, cx, cy);
    }
    mapCache = c;
  }
  const view = h('div', { class: 'map-view' });
  const canvas = mapCache; canvas.className = 'map-canvas';
  const clouds = h('div', { class: 'clouds', 'aria-hidden': 'true' });
  view.append(canvas, clouds);
  let z = 1, px = 0, py = 0, drag = null;
  const apply = () => { canvas.style.transform = `translate(${px}px,${py}px) scale(${z})`; };
  view.addEventListener('pointerdown', (e) => { drag = [e.clientX - px, e.clientY - py]; view.setPointerCapture(e.pointerId); });
  view.addEventListener('pointermove', (e) => { if (drag) { px = e.clientX - drag[0]; py = e.clientY - drag[1]; apply(); } });
  view.addEventListener('pointerup', () => { drag = null; });
  const zoom = (f) => { z = Math.min(4, Math.max(1, z * f)); if (z === 1) { px = 0; py = 0; } apply(); };
  wrap.append(view, h('div', { class: 'map-ctl' }, h('button', { onclick: () => zoom(1.4), 'aria-label': 'Zoom in' }, '+'), h('button', { onclick: () => zoom(1 / 1.4), 'aria-label': 'Zoom out' }, '−')),
    h('p', { class: 'hint' }, 'One continent, every land reachable on foot. Drag to look around.'));
  apply();
}

// ---------- War ----------
let warState = { standing: 'steady', armyTactic: 'advance', unitTactic: 'hold', last: null, report: null, marchLog: [] };
function viewWar() {
  const c = G.campaign;
  if (!c && warState.report) {
    const r = warState.report;
    return h('div', { class: 'view' }, h('section', {}, h('h2', {}, 'After the battle'), h('p', { class: 'big' }, r.headline), h('ul', {}, ...r.causes.map((x) => h('li', {}, x))),
      h('p', { class: 'hint' }, `Our dead and wounded: ${r.losses[0]}. Theirs: ${r.losses[1]}.`), h('ol', { class: 'feed' }, ...r.log.map((l) => h('li', {}, h('p', {}, l))))),
      h('button', { class: 'primary', onclick: () => { warState.report = null; tab = 'life'; render(); } }, 'Go home'));
  }
  if (!c) return h('div', { class: 'view' }, h('p', {}, 'You are not at war. What happens on other fields reaches you only as rumour.'));
  const [A, B] = c.armies;
  const head = h('section', {}, h('h2', {}, `Day ${c.day + 1} of the campaign`), h('p', {}, `You serve as a ${c.rank} in the ${A.name}. ${armyMen(A).toLocaleString()} men under arms.`),
    h('p', { class: 'hint' }, `Supplies: ${Math.round(A.supplyDays)} days. Sick: ${A.sick}. ${c.battle ? '' : `The enemy is about ${Math.max(0, c.distance)} km away.`}`));
  if (!c.battle) {
    const st = h('div', { class: 'seg', role: 'radiogroup' }, ...[['steady', 'Steady march'], ['forced', 'Forced march'], ['cautious', 'Scout carefully'], ['forage', 'Forage']].map(([k, v]) => h('button', { role: 'radio', 'aria-checked': String(warState.standing === k), onclick: () => { warState.standing = k; render(); } }, v)));
    return h('div', { class: 'view' }, head, h('section', {}, h('h2', {}, 'Standing orders'), st,
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => step(1) }, 'Next day'), h('button', { onclick: () => step(7) }, 'Next week'))),
      h('ol', { class: 'feed' }, ...warState.marchLog.slice(0, 20).map((l) => h('li', {}, h('span', { class: 'f-when' }, `Day ${l.day}`), h('p', {}, l.text)))));
  }
  const b = c.battle, T = TERRAIN[b.terrain];
  const choices = CHOICES[c.rank];
  const foe = facing(c);
  const est = (n) => (c.rank === 'soldier' || c.rank === 'sergeant' ? `about ${n > 1000 ? Math.round(n / 500) * 500 : Math.round(n / 50) * 50}` : String(n));
  const myUnit = A.units[c.rank === 'soldier' ? 0 : 1];
  const tactics = (cur, set) => h('div', { class: 'seg' }, ...Object.entries(TACTICS).map(([k, t]) => h('button', { role: 'radio', 'aria-checked': String(cur === k), onclick: () => { set(k); render(); } }, t.name)));
  const units = (army, mine) => h('div', { class: 'units' }, ...army.units.map((u) => h('div', { class: `unit${u.routed ? ' routed' : ''}${!mine && u === foe ? ' facing' : ''}` }, h('span', {}, u.name + (!mine && u === foe ? ' (across from you)' : '')), h('span', { class: 'bar' }, h('span', { style: `width:${Math.round(100 * u.count / u.start)}%` })), h('span', { class: 'stat-w' }, u.routed ? 'broken' : `${mine ? u.count : est(u.count)} men · ${u.morale > 0.7 ? 'steady' : u.morale > 0.45 ? 'shaken' : 'wavering'}${u.terror ? ' · an elite order' : ''}`))));
  return h('div', { class: 'view' }, h('section', {}, h('h2', {}, `Battle ${T.at}: ${PHASES[b.phase] ?? 'Aftermath'}`),
      h('p', { class: 'hint' }, `The front here holds about ${T.frontage} men a side; the rest wait their turn. ${T.defenderBonus ? 'The ground favours whoever holds it.' : ''}`)),
    h('section', { class: 'two' }, h('div', {}, h('h3', {}, A.name), units(A, true)), h('div', {}, h('h3', {}, B.name), units(B, false))),
    c.rank === 'commander' ? h('section', {}, h('h2', {}, 'Army orders'), tactics(warState.armyTactic, (k) => { warState.armyTactic = k; })) : null,
    c.rank === 'captain' ? h('section', {}, h('h2', {}, 'Your company'), tactics(warState.unitTactic, (k) => { warState.unitTactic = k; })) : null,
    h('section', {}, h('h2', {}, c.rank === 'soldier' ? 'Your place in the line' : c.rank === 'sergeant' ? 'Your squad' : 'Your own part'),
      h('div', { class: 'card-acts' }, ...choices.map((ch) => { const po = playerOdds(c, c.rank, c.person, ch); const o = oddsWords(po.capability, po.difficulty); return h('button', { class: 'choice', onclick: () => fight(ch.id) }, h('span', { class: 'choice-label' }, ch.name), h('span', { class: 'odds' }, scale(o.tilt), h('span', {}, o.words))); }))),
    warState.last ? h('section', {}, h('h2', {}, 'Last phase'), h('p', {}, warState.last)) : null,
    h('ol', { class: 'feed' }, ...b.log.slice().reverse().slice(0, 8).map((l) => h('li', {}, h('p', {}, l)))));
}
function step(n) { const log = stepCampaign(G, n, warState.standing); warState.marchLog.unshift(...log.reverse()); render(); }
function fight(choice) {
  const { res, report } = fightPhase(G, { armyTactic: warState.armyTactic, unitTactic: warState.unitTactic, choice });
  const p = res.player;
  if (p) warState.last = `${p.choice.name}: ${p.res.surged ? 'something rises in you — ' : p.res.blundered ? 'you blunder — ' : ''}${p.res.success ? (p.capturedBanner ? 'you tear down their standard!' : `you hold your own${p.kills ? ` and drop ${p.kills} of them` : ''}.`) : 'it goes badly.'}${p.wound ? ` You take a wound to the ${p.wound}.` : ''} Losses this phase: ours ${res.lossA}, theirs ${res.lossB}.`;
  if (report) { warState.report = report; warState.last = null; warState.marchLog = []; feed.unshift({ when: stamp(), kind: 'life', text: `${report.headline} ${report.causes.join('; ')}.` }); }
  render();
}

// test hook for automated playtests (harmless in play)
window.__ardanTest = { game: () => G, war: () => { beginCampaign(G, (G.me.realm + 1) % G.world.realms.length); tab = 'war'; render(); } };

window.addEventListener('DOMContentLoaded', () => {
  for (const b of document.querySelectorAll('.tabs button')) b.onclick = () => { tab = b.dataset.tab; render(); };
  $('#next').onclick = goNext;
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('#next').hidden && $('#card').hidden && document.activeElement === document.body) goNext(); });
  boot();
});
