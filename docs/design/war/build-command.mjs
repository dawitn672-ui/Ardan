// The two diagrams of docs/design/war.md part two (D12a-2), drawn by code. Diagrams only: nothing here is game code.
//   node docs/design/war/build-command.mjs      writes 5-command.svg and 6-reports.svg beside this file
// 5: who commands whom in a realm with no Marshal (the king's own host, the great lords' commands, the army they make,
//    and where the four kinds of dispute arise). 6: how news of one fight reaches each rank (who, when, how true).
// The palette is build.mjs's (the game's day print).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const INK = '#1b1730', SHADE = '#3a2f6b', PAPER = '#efe6d2', VERM = '#c23c27', GOLD = '#e8b04a', GOLD_D = '#8a5a10';
const CARD = '#fbf6ea', GREEN = '#2f5d43', GREEN_W = '#dfe9d2', RUST = '#9a4a22', RUST_W = '#f3e0c2', LAPIS = '#2f4a7a', LAPIS_W = '#dbe4f0';
const SERIF = `'Literata', Georgia, 'Times New Roman', serif`, CAPS = `'Cinzel', 'Trajan Pro', Georgia, serif`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// a line of text; o: size, bold, italic, caps, fill, anchor
const text = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${o.caps ? CAPS : SERIF}" font-size="${o.size || 12}"${o.bold ? ' font-weight="700"' : ''}${o.italic ? ' font-style="italic"' : ''}${o.caps ? ' letter-spacing=".6"' : ''} fill="${o.fill || INK}">${esc(t)}</text>`;
// a box with centred lines; the first line may be bold. o: fill, stroke, dash, sw, size, lh, bold, rx, color, italicRest
function box(x, y, w, h, lines, o = {}) {
  const size = o.size || 12, lh = o.lh || size + 3.5, n = lines.length, y0 = y + h / 2 - ((n - 1) * lh) / 2 + size * 0.36;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 4}" fill="${o.fill || CARD}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  lines.forEach((t, i) => { s += text(x + w / 2, y0 + i * lh, t, { size: i === 0 ? size : size - (o.drop ?? 1), bold: i === 0 && o.bold !== false, italic: i > 0 && o.italicRest, fill: o.color }); });
  return s;
}
const head = (x, y, dx, dy, c, k = 1) => `<path d="M0 0L-9 -4.2L-6.6 0L-9 4.2Z" fill="${c}" transform="translate(${x} ${y}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}) scale(${k})"/>`;
// a straight or elbowed arrow through points
function arrow(pts, c, o = {}) {
  const n = pts.length, [x1, y1] = pts[n - 1], [x0, y0] = pts[n - 2];
  return `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="${c}" stroke-width="${o.w || 1.8}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>` + head(x1, y1, x1 - x0, y1 - y0, c, o.k || 1);
}
// a curved arrow from a to b, bowing by `bow`
function curve(a, b, c, o = {}) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, bow = o.bow ?? 0;
  const cx = mx - (dy / L) * bow, cy = my + (dx / L) * bow;
  return `<path d="M${a[0]} ${a[1]}Q${cx} ${cy} ${b[0]} ${b[1]}" fill="none" stroke="${c}" stroke-width="${o.w || 1.8}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>` + head(b[0], b[1], b[0] - cx, b[1] - cy, c, o.k || 1);
}
const mark = (n, x, y) => `<g><circle cx="${x}" cy="${y}" r="11" fill="${VERM}" stroke="${PAPER}" stroke-width="1.6"/><text x="${x}" y="${y + 4.4}" text-anchor="middle" font-family="${SERIF}" font-size="13" font-weight="700" fill="#fff">${n}</text></g>`;
const swords = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" stroke="${VERM}" stroke-width="2.4" stroke-linecap="round"><path d="M-9 -9L9 9M9 -9L-9 9"/><path d="M-11 -4L-4 -11M11 -4L4 -11" stroke-width="1.8"/></g>`;
const open = (W, H, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>${esc(title)}</title><rect width="${W}" height="${H}" fill="${PAPER}"/><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1"/>`;

// ---- 5 · the command of a realm -------------------------------------------------------------------------------------
function command() {
  const W = 1240, H = 1010;
  let s = open(W, H, 'Who commands whom: the king\'s own host, the great lords\' commands, and the army they make');
  s += text(W / 2, 34, 'WHO COMMANDS WHOM', { caps: true, size: 19, bold: true });
  s += text(W / 2, 54, 'General is the highest rank. There is no Marshal. Every armed man belongs to one command, and every command to one person.', { size: 12.5, italic: true, fill: SHADE });

  // the king
  const kx = 470, ky = 74, kw = 300, kh = 58;
  s += box(kx, ky, kw, kh, ['THE KING', 'summons his great lords; commands in person,', 'or names one General for the campaign'], { fill: '#f6e3b4', stroke: GOLD_D, sw: 1.8, size: 14, drop: 3 });

  // three commands
  const top = 196, ph = 440;
  const P = [
    { x: 30, w: 372, name: 'THE CROWN\'S COMMAND', sub: 'the king\'s own host', fill: GREEN_W, ink: GREEN },
    { x: 434, w: 372, name: 'A DUKE\'S COMMAND', sub: 'his own army, under officers he names', fill: RUST_W, ink: RUST },
    { x: 838, w: 372, name: 'A COUNT\'S COMMAND', sub: 'a count who holds of the king, with no duke over him', fill: LAPIS_W, ink: LAPIS },
  ];
  for (const p of P) {
    s += `<rect x="${p.x}" y="${top}" width="${p.w}" height="${ph}" rx="6" fill="${p.fill}" stroke="${p.ink}" stroke-width="1.6"/>`;
    s += text(p.x + p.w / 2, top + 24, p.name, { caps: true, size: 14, bold: true, fill: p.ink });
    s += text(p.x + p.w / 2, top + 41, p.sub, { size: 11.5, italic: true, fill: SHADE });
  }
  // summons down (gold), oath and answer up (ink)
  const tie = (px, lx) => {
    s += arrow([[px - 12, ky + kh], [px - 12, 150], [lx - 12, 150], [lx - 12, top - 3]], GOLD_D, { w: 2.2 });
    s += arrow([[lx + 12, top - 1], [lx + 12, 164], [px + 12, 164], [px + 12, ky + kh + 3]], INK, { w: 1.6 });
  };
  tie(kx + 60, P[0].x + P[0].w / 2); tie(kx + kw / 2, P[1].x + P[1].w / 2); tie(kx + kw - 60, P[2].x + P[2].w / 2);
  s += text(326, 143, 'the summons, and orders', { size: 11.5, bold: true, fill: GOLD_D });
  s += text(326, 180, 'the oath, and each lord\'s answer', { size: 11.5, bold: true, fill: INK });
  s += text(1000, 126, 'Each lord answers for his own reasons: comes in full · comes with part ·', { size: 11.5, italic: true, fill: SHADE });
  s += text(1000, 142, 'comes late · sends a deputy · sends coin · refuses', { size: 11.5, italic: true, fill: SHADE });

  // crown's panel
  {
    const p = P[0], x = p.x + 16, w = p.w - 32; let y = top + 54;
    s += box(x, y, w, 58, ['The crown\'s Generals', 'commissioned by the king, made by merit', 'one to each host; the first is the senior General'], { stroke: p.ink, sw: 1.6, size: 13, drop: 2 });
    y += 74;
    const rows = [['Royal knights', 'sworn: the king\'s household'], ['The crown\'s regiments', 'enlisted: lances, bows, spears, scouts, engineers'], ['The crown lands\' roll', 'volunteers who drill, and march when mustered'], ['The elite orders', 'serve the crown; led by their Grand Masters'], ['Hired companies', 'while they are paid']];
    for (const [a, b] of rows) { s += box(x, y, w, 44, [a, b], { stroke: p.ink, size: 12.5, drop: 1.5, italicRest: true }); y += 52; }
    s += text(p.x + p.w / 2, y + 12, 'The road a soldier of no birth climbs.', { size: 11.5, italic: true, fill: p.ink });
  }
  // a ladder of vassals
  const ladder = (p, y, rows) => {
    const x = p.x + 16, w = p.w - 32;
    rows.forEach((r, i) => {
      const ind = i * 14, bw = w - ind;
      s += box(x + ind, y, bw, 44, [r[0], r[1]], { stroke: p.ink, size: 12.5, drop: 1.5, italicRest: true, fill: r[2] || CARD, sw: r[2] ? 1.6 : 1.2 });
      if (i < rows.length - 1) s += arrow([[x + ind + 7, y + 44], [x + ind + 7, y + 63], [x + ind + 13, y + 63]], p.ink, { w: 1.3, k: 0.8 });
      y += 52;
    });
    return y;
  };
  {
    const p = P[1];
    let y = ladder(p, top + 54, [
      ['The Duke: a General by right', 'about 30,000 at full call: two or three hosts', '#fff7e2'],
      ['His Generals, whom he names', 'his counts, his kin, a trusted captain: one a host'],
      ['A marquis on the border: a host', 'about 8,000; may fight for the march unsummoned'],
      ['His counts: wings or small hosts', 'about 4,000 each, under a commander or a General'],
      ['Viscounts: small wings', 'about 1,200, under a commander'],
      ['Barons: companies', 'about 300, the baron as captain'],
      ['Knights and bannerets: lances', '5 to 60 men, in a baron\'s company'],
    ]);
    s += text(p.x + p.w / 2, y + 12, 'Each man swears to his own lord, not to the king.', { size: 11.5, italic: true, fill: p.ink });
  }
  {
    const p = P[2];
    let y = ladder(p, top + 54, [
      ['The Count: General or commander', 'about 4,000: a small host, or two wings', '#f1f5fb'],
      ['His captains and commanders', 'named by him, sworn to him'],
      ['Viscounts: small wings', 'about 1,200'],
      ['Barons: companies', 'about 300'],
      ['Knights and bannerets: lances', '5 to 60 men'],
    ]);
    // the three kinds of men
    y += 10; const x = p.x + 16, w = p.w - 32;
    s += text(p.x + p.w / 2, y + 6, 'EVERY COMMAND IS THREE KINDS OF MEN', { caps: true, size: 10.5, bold: true, fill: p.ink });
    s += `<rect x="${x}" y="${y + 14}" width="${w * 0.18}" height="20" fill="${INK}"/><rect x="${x + w * 0.18}" y="${y + 14}" width="${w * 0.37}" height="20" fill="#7d8fb0"/><rect x="${x + w * 0.55}" y="${y + 14}" width="${w * 0.45}" height="20" fill="${CARD}" stroke="${INK}" stroke-dasharray="4 3"/>`;
    s += text(x + w * 0.09, y + 28, 'sworn', { size: 11, fill: '#fff', bold: true }) + text(x + w * 0.365, y + 28, 'enlisted, and the roll', { size: 11, fill: '#fff', bold: true }) + text(x + w * 0.775, y + 28, 'conscripts, when called', { size: 11 });
    s += text(p.x + p.w / 2, y + 50, 'Conscripts are raised by each lord in his own lands', { size: 11.5, italic: true, fill: p.ink });
    s += text(p.x + p.w / 2, y + 64, 'and march in his contingent, under his captains.', { size: 11.5, italic: true, fill: p.ink });
  }

  // the army on campaign
  const ay = 668, ah = 196;
  s += `<rect x="30" y="${ay}" width="${W - 60}" height="${ah}" rx="6" fill="${CARD}" stroke="${INK}" stroke-width="1.6"/>`;
  s += text(W / 2, ay + 24, 'THE ARMY ON CAMPAIGN', { caps: true, size: 14, bold: true });
  s += text(W / 2, ay + 41, 'A host is 3,000 to 12,000 men under one General, so a large army has several. A lord\'s contingent is kept whole, under his own captains.', { size: 11.5, italic: true, fill: SHADE });
  const hosts = [
    { x: 50, p: P[0], t: 'The crown\'s host', g: 'General Aldous Marr, commanding the campaign', g2: 'by the king\'s written word, for this campaign only', wings: [['Van', 'royal knights,', 'an order'], ['Main', 'crown regiments,', 'the roll'], ['Rear', 'Count Vennes\'s', 'men, whole']], star: true },
    { x: 438, p: P[1], t: 'The Duke of Harrow\'s first host', g: 'the Duke, a General by right', g2: 'his own men, under his own officers', wings: [['Van', 'his knights', ''], ['Main', 'two counts\'', 'wings'], ['Rear', 'conscript foot,', 'his barons']] },
    { x: 826, p: P[1], t: 'The Duke\'s second host', g: 'General Sir Odo Harrow, the Duke\'s brother', g2: 'named by the Duke', wings: [['Van', 'the march', 'horse'], ['Main', 'a count\'s', 'wing'], ['Rear', 'hired bows,', 'the train']] },
  ];
  for (const h of hosts) {
    const w = 364, y = ay + 54;
    s += `<rect x="${h.x}" y="${y}" width="${w}" height="128" rx="5" fill="${h.p.fill}" stroke="${h.p.ink}" stroke-width="${h.star ? 2.4 : 1.4}"/>`;
    s += text(h.x + w / 2, y + 18, h.t, { size: 13, bold: true, fill: h.p.ink });
    s += text(h.x + w / 2, y + 34, h.g, { size: 11.5, bold: true });
    s += text(h.x + w / 2, y + 48, h.g2, { size: 11, italic: true, fill: SHADE });
    h.wings.forEach((g, i) => { s += box(h.x + 12 + i * 115, y + 58, 110, 60, [g[0], g[1], g[2]].filter(Boolean), { stroke: h.p.ink, size: 12, drop: 1.5, italicRest: true }); });
  }
  s += text(W / 2, ay + ah + 20, 'If the king is there, he commands. If he names nobody, the Generals hold a council of war: each leads his own host, and a joint order takes a day longer.', { size: 12 });

  // where disputes arise
  s += mark(1, P[2].x + P[2].w / 2 + 36, 179);           // a refused summons
  s += swords(822, top + 248) + mark(2, 822, top + 222);   // a private war between a duke's count and the king's count
  s += mark(3, 426, ay + 100);                             // who commands
  s += mark(4, P[1].x + 8, top + 180);                     // the march lord's own war
  const ky2 = 908;
  s += `<rect x="30" y="${ky2}" width="${W - 60}" height="88" rx="6" fill="#f7e9e3" stroke="${VERM}" stroke-width="1.4"/>`;
  s += text(46, ky2 + 20, 'WHERE DISPUTES ARISE, EACH FROM A GRIEVANCE ON RECORD', { caps: true, size: 12, bold: true, fill: VERM, anchor: 'start' });
  const K = [
    [1, 'A refused summons.', 'A lord stays home for his own reasons; the king punishes as far as he dares.'],
    [2, 'A private war.', 'Two lords of one realm fight over a fief, a toll or a killing.'],
    [3, 'A quarrel in the army.', 'Who has the van; a duke who will not serve under a General of no birth.'],
    [4, 'A border lord\'s own war.', 'A march lord\'s raid that his king must disown, back, or leave as a border war.'],
  ];
  K.forEach((k, i) => {
    const x = 56 + (i % 2) * 590, y = ky2 + 42 + Math.floor(i / 2) * 26;
    s += mark(k[0], x, y - 4) + `<text x="${x + 18}" y="${y}" font-family="${SERIF}" font-size="12.5" fill="${INK}"><tspan font-weight="700">${esc(k[1])}</tspan><tspan dx="6" fill="${SHADE}">${esc(k[2])}</tspan></text>`;
  });
  return s + '</svg>';
}

// ---- 6 · how news of one fight reaches each rank --------------------------------------------------------------------
function reports() {
  const W = 1340, H = 968, LX = 196, top = 112, lh = 84;
  const cols = ['On the day', 'That night', 'Next day', 'Day 3', 'Day 6', 'Day 9', 'Day 14', 'Day 25'];
  const cw = (W - LX - 20) / cols.length, cx = i => LX + i * cw + cw / 2;
  const lanes = [
    ['The king', 'at Aldhaven, nine days\' ride away'],
    ['Another General', 'his host three days off; a rival'],
    ['The General', 'on a hill behind the centre'],
    ['A commander', 'on horseback behind his wing'],
    ['A captain', 'at his company\'s flank'],
    ['A sergeant', 'with his twelve'],
    ['A soldier', 'in the line'],
    ['At home', 'the soldier\'s village, far to the west'],
  ];
  const ly = i => top + i * lh + (i === 7 ? 14 : 0);
  let s = open(W, H, 'How news of one fight reaches each rank: who hears, when, from whom, and how true');
  s += text(W / 2, 34, 'HOW NEWS OF ONE FIGHT REACHES EACH RANK', { caps: true, size: 19, bold: true });
  s += text(W / 2, 55, 'The fight at the ford at Camia. The ford was lost, the right wing broke, and some two thousand fell. Here is who learns what, when, from whom, and how true.', { size: 12.5, italic: true, fill: SHADE });
  // grid
  lanes.forEach((l, i) => {
    const y = ly(i);
    s += `<rect x="20" y="${y}" width="${W - 40}" height="${lh - 6}" rx="4" fill="${i === 7 ? '#e9e2f0' : i % 2 ? '#f5eedd' : '#ebe1c8'}" stroke="${INK}" stroke-opacity=".25"/>`;
    s += text(32, y + 32, l[0], { size: 14, bold: true, anchor: 'start' }) + text(32, y + 50, l[1], { size: 10.5, italic: true, anchor: 'start', fill: SHADE });
  });
  cols.forEach((c, i) => { s += text(cx(i), top - 12, c, { caps: true, size: 12, bold: true }); if (i) s += `<path d="M${LX + i * cw} ${top - 4}V${ly(7) + lh - 6}" stroke="${INK}" stroke-opacity=".18" stroke-dasharray="2 5"/>`; });
  s += `<path d="M${LX} ${top - 4}V${ly(7) + lh - 6}" stroke="${INK}" stroke-opacity=".4"/>`;

  // cards: kind = seen | report | slant | rumour
  const STY = { seen: { stroke: INK, sw: 2, fill: '#fff' }, report: { stroke: INK, sw: 1.3, fill: CARD, dash: '6 3' }, slant: { stroke: GOLD_D, sw: 2.2, fill: '#fbeecb' }, rumour: { stroke: VERM, sw: 1.4, fill: '#f8e4dc', dash: '2 3' } };
  const cwid = cw - 12, chh = 62, pos = {};
  const card = (id, lane, col, kind, lines) => {
    const x = cx(col) - cwid / 2, y = ly(lane) + (lh - 6 - chh) / 2;
    pos[id] = { x, y, cx: cx(col), cy: y + chh / 2, t: y, b: y + chh, l: x, r: x + cwid };
    return box(x, y, cwid, chh, lines, { ...STY[kind], size: 11, drop: 0.6, bold: true, lh: 13.2 });
  };
  let c = '';
  // on the day: what each man saw
  c += card('k0', 0, 0, 'seen', ['Nothing.', 'He is hunting.']);
  c += card('g0', 2, 0, 'seen', ['Saw the field,', 'all but his right,', 'hidden by a wood']);
  c += card('c0', 3, 0, 'seen', ['Saw his own wing,', 'and the next', 'in part']);
  c += card('p0', 4, 0, 'seen', ['Saw his company', 'and the companies', 'either side']);
  c += card('s0', 5, 0, 'seen', ['Saw his twelve', 'and the standard', 'above the heads']);
  c += card('m0', 6, 0, 'seen', ['Saw the backs', 'in front of him,', 'dust, the water']);
  // that night
  c += card('g1', 2, 1, 'report', ['By galloper:', '"The right is', 'broken, my lord"']);
  c += card('c1', 3, 1, 'report', ['A friend on the staff,', 'quietly: "The right', 'is gone. Be ready"']);
  c += card('p1', 4, 1, 'slant', ['Sergeants\' counts:', '31 gone (one hid', 'two stragglers)']);
  c += card('s1', 5, 1, 'seen', ['Counts his section', 'and reports it', 'to the captain']);
  c += card('m1', 6, 1, 'rumour', ['Camp talk:', '"We won. Their', 'duke is dead"']);
  // next day
  c += card('g2', 2, 2, 'slant', ['Commanders\' accounts:', 'each one', 'excuses himself']);
  c += card('c2', 3, 2, 'report', ['Captains\' returns:', 'his wing lost', 'one man in five']);
  c += card('p2', 4, 2, 'report', ['At the commander\'s', 'table, if he is asked:', '"The ford is lost"']);
  c += card('m2', 6, 2, 'report', ['Roll-call: four', 'of his section', 'do not answer']);
  // day 3
  c += card('o3', 1, 3, 'slant', ['A courtesy note,', 'short and late:', '"We hold the field"']);
  // day 6
  c += card('k6', 0, 4, 'rumour', ['By the trade road:', '"A great victory', 'at Camia"']);
  c += card('h6', 7, 4, 'rumour', ['Pedlars: "A battle,', 'somewhere east.', 'Thousands dead"']);
  // day 9
  c += card('k9', 0, 5, 'slant', ['The General\'s dispatch:', '"A hard-won field,', 'the enemy checked"']);
  // day 14
  c += card('k14', 0, 6, 'report', ['The spymaster:', '"The ford is lost.', 'Two thousand fell"']);
  c += card('h14', 7, 6, 'slant', ['Proclamation at the', 'market cross:', '"Victory at Camia"']);
  // day 25
  c += card('k25', 0, 7, 'report', ['The roll of the dead,', 'name by name,', 'with the returns']);
  c += card('h25', 7, 7, 'report', ['A letter from his', 'captain: "Your son', 'fell at the ford"']);

  // flows (drawn under the cards)
  let a = '';
  const up = (from, to, col, o = {}) => { const A = pos[from], B = pos[to]; a += curve([A.cx + (o.dx || 0), A.t], [B.cx + (o.dx2 ?? o.dx ?? 0), B.b + 2], col, { bow: o.bow ?? 0, ...o }); };
  const side = (from, to, col, o = {}) => { const A = pos[from], B = pos[to]; a += curve([A.r, A.cy + (o.dy || 0)], [B.l - 2, B.cy + (o.dy2 ?? 0)], col, { bow: o.bow ?? 0, ...o }); };
  // orders ride down the first column
  for (const [f, t] of [['g0', 'c0'], ['c0', 'p0'], ['p0', 's0'], ['s0', 'm0']]) { const A = pos[f], B = pos[t]; a += arrow([[A.cx - 34, A.b], [B.cx - 34, B.t - 2]], GOLD_D, { w: 2.2 }); }
  // the day's sight becomes the night's and morning's reports
  up('s1', 'p1', GOLD_D, {});
  side('p1', 'c2', INK, { bow: 10, dash: '6 3' });
  up('c2', 'g2', GOLD_D, {});
  side('g1', 'g2', INK, { dash: '6 3' });
  side('c0', 'g1', INK, { bow: 12, dash: '6 3' });
  { const A = pos.c2, B = pos.p2; a += arrow([[A.cx + 30, A.b], [B.cx + 30, B.t - 2]], INK, { dash: '6 3' }); }
  { const A = pos.g1, B = pos.c1; a += arrow([[A.cx, A.b], [B.cx, B.t - 2]], INK, { dash: '6 3' }); }
  side('g2', 'o3', GOLD_D, { bow: 14, dy: -12 });
  { const A = pos.g2, B = pos.k9; a += `<path d="M${A.r} ${A.cy + 6}C${A.r + 150} ${A.cy + 6} ${B.cx - 60} ${B.b + 110} ${B.cx - 30} ${B.b + 4}" fill="none" stroke="${GOLD_D}" stroke-width="1.8"/>` + head(B.cx - 30, B.b + 2, 0.25, -1, GOLD_D); }
  side('k9', 'k14', INK, { dash: '6 3' });
  side('k14', 'k25', INK, { dash: '6 3' });
  // the king's version goes down to the market cross; the captain's letter goes home
  { const A = pos.k9, B = pos.h14; a += curve([A.r - 20, A.b], [B.cx, B.t - 2], GOLD_D, { bow: -40 }); }
  { const A = pos.p2, B = pos.h25; a += curve([A.r, A.cy + 14], [B.l + 20, B.t - 2], INK, { bow: -70, dash: '6 3' }); }
  s += a + c;
  s += text(cx(4) - 40, ly(5) - 8, 'the captain writes to the family', { size: 11, italic: true, fill: SHADE, anchor: 'start' });
  s += text(cx(6) - 18, ly(3) + 30, 'the crown tells the realm its own version', { size: 11, italic: true, fill: GOLD_D, anchor: 'start' });
  s += text(cx(3) + 76, ly(2) + 44, 'the General writes to the king', { size: 11, italic: true, fill: GOLD_D, anchor: 'start' });

  // legend
  const gy = ly(7) + lh + 12;
  s += `<rect x="20" y="${gy}" width="${W - 40}" height="150" rx="6" fill="${CARD}" stroke="${INK}" stroke-width="1.2"/>`;
  const L = [['seen', 'Seen with his own eyes', 'true, and narrow'], ['report', 'A report', 'what its sender knew'], ['slant', 'A slanted report', 'what its sender wants believed'], ['rumour', 'Rumour', 'many mouths; numbers swell']];
  s += arrow([[1080, gy + 20], [1080, gy + 46]], GOLD_D, { w: 2.2 }) + text(1094, gy + 29, 'Orders, and the crown\'s word', { size: 12.5, bold: true, anchor: 'start' }) + text(1094, gy + 44, 'going down: what to do, less of why', { size: 11, italic: true, anchor: 'start', fill: SHADE });
  L.forEach((l, i) => { const x = 40 + i * 258; s += box(x, gy + 16, 46, 30, [''], { ...STY[l[0]] }) + text(x + 56, gy + 29, l[1], { size: 12.5, bold: true, anchor: 'start' }) + text(x + 56, gy + 44, l[2], { size: 11, italic: true, anchor: 'start', fill: SHADE }); });
  const B = [
    ['WHEN IT ARRIVES', ['The length of the road, over the speed of whoever carries it:', 'a galloper relay about 100 km a day, a courier 50, a pedlar 25.', 'A cut road or a siege ring stops it. A rider can be taken.']],
    ['WHO IS TOLD FIRST', ['1  Those who need it: the sender\'s own superior, the chain.', '2  Those he is bound to: a friend on the staff, a patron.', '3  Those who matter: a duke hears before a captain.']],
    ['HOW TRUE IT IS', ['What the sender saw, bent by what he wants you to think,', 'bent again by every mouth it passed through.', 'A king men fear is told what he wants to hear.']],
  ];
  B.forEach((b, i) => { const x = 40 + i * 432; s += text(x, gy + 76, b[0], { caps: true, size: 11.5, bold: true, anchor: 'start', fill: SHADE }); b[1].forEach((t, j) => { s += text(x, gy + 94 + j * 16, t, { size: 11.5, anchor: 'start' }); }); });
  return s + '</svg>';
}

for (const [name, make] of [['5-command.svg', command], ['6-reports.svg', reports]]) {
  const svg = make(); fs.writeFileSync(path.join(here, name), svg);
  console.log(name.padEnd(16), (svg.length / 1024).toFixed(0).padStart(5), 'KB');
}
