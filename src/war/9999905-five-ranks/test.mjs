// Tests for W1-1, "No Marshal, five ranks" (docs/design/war.md §9 and §16, D-064 points 1 to 3, D-066). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVE = path.join(ROOT, 'tests', 'saves', 'v2.1.0-alpha.9-marshal.ardan');
const req = createRequire(import.meta.url);
let acorn; try { acorn = req('acorn'); } catch { acorn = createRequire('/opt/node-tools/node_modules/x.js')('acorn'); }

export const limits = { w1NoMarshalWorld: 2400 };

// ---- the lint: every string the game can print, read from the source --------------------------------------------------
// A rank word of the old ladder: "Marshal" (any use with a capital), and the four retired grades in any case. The
// lower-case "marshal" is a rank too, except where it is the lists' official of a tourney ("the marshal of the lists",
// "the marshals" of a bout) or a key (a string with no space: an event id, a save's old field the migration reads).
const BANNED = [/\bMarshal(?!l)/, /\bhigh generals?\b/i, /\bfile-?leaders?\b/i, /\bsquad captains?\b/i, /\bsenior captains?\b/i];
const LOWER = /\bmarshal('s)?\b(?! of the lists)/;
const isKey = s => !/\s/.test(s);
function stringsOf(file) {
  const src = fs.readFileSync(file, 'utf8'), out = [];
  if (file.endsWith('.json')) {
    const walk = v => { if (typeof v === 'string') out.push(v); else if (v && typeof v === 'object') for (const k in v) walk(v[k]); };
    walk(JSON.parse(src));
    return out;
  }
  const mod = /\/engine\//.test(file);
  const text = mod ? src : `(function(){\n${src}\n})();`;
  for (const t of acorn.tokenizer(text, { ecmaVersion: 'latest', sourceType: mod ? 'module' : 'script', allowReturnOutsideFunction: true, allowHashBang: true }))
    if (t.type.label === 'string' || t.type.label === 'template') out.push(String(t.value));
  return out;
}
function files() {
  const out = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|\.git)$/.test(e.name)) walk(p); continue; }
      if (/test\.mjs$|\.md$|a-v2\.core\.js$/.test(e.name)) continue;
      if (/\.(js|json)$/.test(e.name)) out.push(p);
    }
  };
  walk(path.join(ROOT, 'src'));
  walk(path.join(ROOT, 'data'));
  return out;
}

export default {
  // no page, card or note prints a retired rank: a lint over every string of the source, the lore and the data
  async w1NoMarshalLint() {
    const bad = [];
    let n = 0, strings = 0;
    for (const f of files()) {
      n++;
      let list;
      try { list = stringsOf(f); } catch (e) { bad.push(`${path.relative(ROOT, f)}: unreadable (${String(e.message).slice(0, 80)})`); continue; }
      for (const s of list) {
        strings++;
        const hit = BANNED.find(rx => rx.test(s)) || (!isKey(s) && LOWER.test(s) ? LOWER : null);
        if (hit) bad.push(`${path.relative(ROOT, f)}: "${s.replace(/\s+/g, ' ').slice(Math.max(0, s.search(hit) - 30), s.search(hit) + 50)}"`);
      }
    }
    return { ok: !bad.length && n > 300, detail: `${n} files, ${strings} strings; ${bad.length} with a retired rank word${bad.length ? ': ' + bad.slice(0, 8).join(' | ') : ''}` };
  },

  // a 30-year world: no Marshal anywhere (no seat, no grade, no style, nothing in the save), every host under 12,000
  // with a General, the senior General at council, the one-holder audit clean, and nothing on the pages
  async w1NoMarshalWorld(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const RX = /\bMarshal|\bhigh general|\bfile-?leader|\bsquad captain|\bsenior captain/i;
      const out = { years: [], styles: [], page: [] };
      const look = () => {
        const P = A.POSTS, y = { y: A.S.year, seat: 0, keys: 0, grade: 0, hosts: 0, over: 0, noGen: 0, realms: 0, senior: 0, firsts: 0, audit: P.audit().length };
        for (const id in A.S.realms) {
          const r = A.S.realms[id]; if (!r || r.alive === false) continue;
          y.realms++;
          if (r.council && r.council.marshal) y.seat++;
          { const d = P.firstHost(r); if (d) { y.firsts++; if (P.seniorGeneral(r)) y.senior++; else (y.vacant = y.vacant || []).push(id + '|' + d.id); } }
        }
        for (const k in A.S.posts.h) if (/^seat:.*:marshal$/.test(k)) y.keys++;
        for (const id in A.S.people) {
          const p = A.S.people[id]; if (!p || !p.alive) continue;
          if ((p.milRank || 0) > 7 || (p.mil && p.mil.rank > 7)) y.grade++;
          for (const s of [p.occ, p.title, A.mainRole(p)]) if (typeof s === 'string' && RX.test(s) && out.styles.length < 5) out.styles.push(A.S.year + ' ' + p.id + ': ' + s);
        }
        for (const h of A.HOSTS.all()) if (h.host) { y.hosts++; if (h.men > A.HOSTS.MAX) y.over++; if (!h.general || !h.general.name) y.noGen++; }
        out.years.push(y);
      };
      look();
      for (let i = 0; i < 30; i++) {
        const st = T.play(1);
        if (st === 'dead') { const pc = A.pc(), k2 = Object.values(A.S.people).find(p => p.alive && pc && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30); if (k2) A.continueAs(k2.id); }
        look();
      }
      // the pages: every tab drawn once, read for a retired rank
      for (const tab of ['life', 'people', 'realm', 'war', 'map', 'journal']) {
        try { UI.tab = tab; UI.ov = null; UI.render(); const t = document.body.innerText; const m = t.match(RX); if (m) out.page.push(tab + ': ' + t.slice(Math.max(0, m.index - 40), m.index + 40)); } catch (e) { out.page.push(tab + ' threw ' + e.message); }
      }
      UI.tab = 'life'; UI.render();
      const save = A.serialize();
      out.saveSeat = /seat:[^"]*:marshal|"marshal":"/.test(save);
      out.strict = A.POSTS.audit({ strict: true });
      return out;
    });
    const Y = r.years, last = Y[Y.length - 1];
    const checks = {
      noSeat: Y.every(y => !y.seat && !y.keys) && !r.saveSeat,
      noGrade: Y.every(y => !y.grade),
      noStyle: !r.styles.length,
      hostsUnder12k: Y.every(y => !y.over),
      everyHostAGeneral: Y.every(y => !y.noGen) && Y.every(y => y.hosts > 0),
      // (CI 143: the crown names a first host's General at each month's end (P.fillGenerals), so a host formed or
      // changed at the turn of the year stands empty until the month is out, and a yearly look can catch several at once:
      // seed 7 had three realms at war re-form their first hosts at the turn of 1135, all named within the month. Read
      // month by month over the same 30 years, 8 vacancies in 188 looks, every one filled by the next. The fault is a
      // vacancy that outlasts a year of monthly namings, or many of them: none seen at two yearly looks running, and
      // at most 3% of the realm-years empty (measured: 4 of about 830). H-079.)
      seniorAtCouncil: Y.slice(1).every((y, i) => !(y.vacant || []).some(k => (Y[i].vacant || []).includes(k))) &&
        Y.slice(1).reduce((a, y) => a + (y.firsts - y.senior), 0) <= 0.03 * Y.slice(1).reduce((a, y) => a + y.firsts, 0) && last.senior > 0,
      oneHolder: Y.every(y => !y.audit) && !r.strict.length,
      pagesClean: !r.page.length,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | ${Y.length - 1} years to ${last.y}; hosts ${Math.min(...Y.map(y => y.hosts))}-${Math.max(...Y.map(y => y.hosts))}, over 12,000 ${Y.reduce((a, y) => a + y.over, 0)}, without a General ${Y.reduce((a, y) => a + y.noGen, 0)}; senior Generals at the end ${last.senior} of ${last.firsts} realms with a first host; first hosts empty at a yearly look ${Y.slice(1).reduce((a, y) => a + y.firsts - y.senior, 0)} of ${Y.slice(1).reduce((a, y) => a + y.firsts, 0)}` +
      `${r.styles.length ? ' | styles: ' + r.styles.join('; ') : ''}${r.page.length ? ' | pages: ' + r.page.join('; ') : ''}${r.strict.length ? ' | ' + r.strict.slice(0, 3).join('; ') : ''}` };
  },

  // Generals follow the size of what a realm fields: one General to each host (a division of 3,000 men or more), a
  // Commander to each column, and an army of two hosts or more is led by its commanding General by the king's word
  async w1GeneralsFollowHosts(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 11, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
      const foes = A.neighbors('POL-01').map(A.realm).filter(x => x && x.alive && !x.isRebel).sort((a, b) => (b.army || 0) - (a.army || 0));
      if (!A.atWar('POL-01').some(w => A.warSide(w, foes[0].id))) A.startWar('POL-01', foes[0].id);
      A.S.armies = A.S.armies || []; A.wsMobilize && A.wsMobilize('POL-01');
      A.advance(40);
      const out = { realms: [] };
      for (const id of Object.keys(A.S.realms)) {
        const list = A.HOSTS.of(id); if (!list.length) continue;
        const hosts = list.filter(x => x.host), cols = list.filter(x => !x.host);
        const gens = new Set(hosts.map(h => h.general && (h.general.pid || h.general.name)));
        out.realms.push({ id, men: list.reduce((a, x) => a + x.men, 0), hosts: hosts.length, cols: cols.length, gens: gens.size,
          titles: hosts.every(h => h.general && h.general.title === 'General') && cols.every(c => c.general && c.general.title === 'Commander'),
          max: Math.max(0, ...list.map(x => x.men)) });
      }
      out.armies = (A.S.armies || []).map(a => { const c = A.HOSTS.army(a); return { id: a.id, hosts: c.hosts, as: c.as, gen: !!a.gen, by: a.cmdBy || null }; });
      // the order of battle says the same
      const a = A.armiesOf('POL-01').find(x => A.HOSTS.armyHosts(x).length >= 2);
      out.oob = a ? A.oobRoot(a).leader.title : null;
      return out;
    });
    const checks = {
      oneGeneralAHost: r.realms.every(x => x.gens === x.hosts),
      words: r.realms.every(x => x.titles),
      under12k: r.realms.every(x => x.max <= 12e3),
      bySize: r.realms.length > 10 && r.realms.filter(x => x.men >= 3e4).every(x => x.hosts >= 3),
      // W1-3 (D-083): a council of war the king chose keeps a.gen (the General who keeps the army's books; A.wsDay fills
      // an empty one at once), so a council reads by a.cmdBy as well as by an empty a.gen
      armyCommand: r.armies.every(a => a.hosts < 2 || a.as === 'commission' || a.as === 'king' || (a.as === 'council of war' && (!a.gen || a.by === 'council'))),
      oobWords: r.oob === null || r.oob === 'Commanding General',
    };
    const ok = Object.values(checks).every(Boolean);
    const big = r.realms.slice().sort((a, b) => b.men - a.men).slice(0, 3);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | ${r.realms.length} realms; largest ${big.map(x => `${x.id} ${x.men} men: ${x.hosts} hosts, ${x.gens} Generals, ${x.cols} columns`).join('; ')}; armies ${r.armies.map(a => `${a.id} ${a.hosts} hosts (${a.as})`).join(', ')}; order of battle: ${r.oob}` };
  },

  // the senior General: the General of the crown's first host sits at council in the old seat's place, does its yearly
  // task, commands no army and no other General; a Captain may not have the place, a General may, and resigning
  // leaves nothing behind
  async w1SeniorGeneral(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 23, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
      const r = A.realm('POL-01'), P = A.POSTS, out = {};
      const ald = P.seniorGeneral(r), m = A.P(ald);
      out.lore = m ? { name: A.fullName(m, false), cast: m.castId, role: A.mainRole(m), council: r.council.general === m.id } : null;
      T.play(1);
      out.task = !!(r.pol && r.pol.task && r.pol.task.general);
      out.tasks = !!(A.POL && A.POL.TASKS && A.POL.TASKS.general && !A.POL.TASKS.marshal);
      const pc = A.pc();
      A.enlist(pc, false); pc.mil.rank = 4; pc.mil.rankSince = A.absDay(); A.wsAttachPC();
      out.captain = P.can(P.seatKey('POL-01', 'general'), pc.id, { by: 'court' });
      pc.mil.rank = 6; A.wsAttachPC();
      out.ownHost = (A.divById(pc.mil.div) || {}).cmd === pc.id && !P.isSeniorGeneral(pc.id);
      const before = P.seniorGeneral(r);
      const res = P.appoint(P.seatKey('POL-01', 'general'), pc.id, { why: 'ruler', by: r.ruler });
      A.wsAttachPC(); P.sync('month');
      out.appointed = res.ok;
      out.seated = { senior: P.isSeniorGeneral(pc.id), office: pc.office, council: r.council.general === pc.id, div: pc.mil.div === (P.firstHost(r) || {}).id, role: A.cmdRole(pc).key, title: A.cmdRole(pc).title, armies: A.cmdRole(pc).armies.size };
      out.before = before && before !== pc.id ? { holds: P.held(before).filter(k => P.cls(k) === 'FIELD'), grudge: !!(A.P(before).rel[pc.id] && A.P(before).rel[pc.id].op < 0) } : null;
      // a General's second step at war: he keeps the first host and takes no army
      const foes = A.neighbors('POL-01').map(A.realm).filter(x => x && x.alive && !x.isRebel);
      if (!A.atWar('POL-01').length) A.startWar('POL-01', foes[0].id);
      A.S.armies = A.S.armies || []; A.wsMobilize && A.wsMobilize('POL-01');
      pc.mil.rank = 7; A.wsAttachPC(); P.sync('month');
      out.atWar = { senior: P.isSeniorGeneral(pc.id), army: A.armiesOf('POL-01').some(a => a.gen === pc.id), superior: (A.superior(pc) || {}).id === r.ruler || !A.superior(pc) };
      out.strict = P.audit({ strict: true });
      out.resign = A.resign();
      P.sync('month');
      // the commission's posts (a shire office the noble life won meanwhile, 9996's office:, is not the army's: W1-3's
      // world, seed 23, gives him a magistracy in his first year)
      out.after = { posts: P.held(pc.id).filter(k => !/^(office|house|title):/.test(k)), council: r.council.general === pc.id, office: pc.office };
      out.strict2 = P.audit({ strict: true });
      return out;
    });
    const checks = {
      loreSenior: !!r.lore && r.lore.cast === 'CHR-0005' && /^Senior General of /.test(r.lore.role) && r.lore.council,
      yearlyTask: r.task && r.tasks,
      captainRefused: /General/.test(r.captain || ''),
      generalOwnHost: r.ownHost,
      generalSeated: r.appointed && r.seated.senior && r.seated.office === 'general' && r.seated.council && r.seated.div && r.seated.title === 'General' && !r.seated.armies,
      noArmyAtWar: r.atWar.senior && !r.atWar.army && r.atWar.superior,
      strictAudit: !r.strict.length && !r.strict2.length,
      resignLeavesNothing: r.resign && r.resign.ok && !r.after.posts.length && !r.after.council && !r.after.office,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | Aldmark at the start: ${r.lore ? r.lore.name + ' (' + r.lore.role + ')' : 'none'}; a Captain asking: "${r.captain}"; seated ${JSON.stringify(r.seated)}; at war ${JSON.stringify(r.atWar)}${r.strict.length || r.strict2.length ? ' | ' + r.strict.concat(r.strict2).slice(0, 3).join('; ') : ''}` };
  },

  // an old save with sitting Marshals (made from the last build that had the seat): the player, Marshal of Aldmark by
  // the ruler's own choice at grade 9, is a General holding the first host and the army's place at council; each lore
  // Marshal is his realm's senior General; no seat of a Marshal is left; the audit is clean, and a year plays on
  async w1OldSaveMarshal(pg) {
    if (!fs.existsSync(SAVE)) return { ok: true, skip: 'no sample save with a sitting Marshal' };
    const b64 = fs.readFileSync(SAVE).toString('base64');
    const r = await pg.evaluate(async (b64) => {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const d = await SAVES.decode(bytes);
      const old = {};
      for (const id in d.S.realms) { const x = d.S.realms[id]; if (x && x.council && x.council.marshal) old[id] = x.council.marshal; }
      const oldPc = d.S.people[d.S.pc].mil, oldRank = oldPc && oldPc.rank, oldAch = !!(d.S.ach && d.S.ach.marshal);
      const loaded = UI.enterSaveSafe(d);
      const P = A.POSTS, pc = A.pc(), out = { loaded, old, oldRank, oldAch };
      out.pc = { rank: pc.mil.rank, label: A.rankLabel(pc.mil.rank), office: pc.office, senior: P.isSeniorGeneral(pc.id), role: A.cmdRole(pc).title, ach: (!oldAch || !!A.S.ach.senior_general) && !A.S.ach.marshal };
      out.npc = Object.keys(old).filter(id => id !== pc.realm).map(id => { const r = A.realm(id), p = A.P(old[id]); return { id, alive: !!(p && p.alive && r && r.alive), senior: P.seniorGeneral(r) === old[id], role: p ? A.mainRole(p) : '' }; });
      out.keys = Object.keys(A.S.posts.h).filter(k => /:marshal$/.test(k)).length;
      out.council = Object.values(A.S.realms).filter(r => r.council && r.council.marshal).length;
      out.strict = P.audit({ strict: true });
      out.log = [].concat(...(A.S.log || []).slice(-3).map(e => (e.lines || []).map(l => String(l[0] || '')))).filter(t => /old seat/.test(t)).slice(0, 1);
      out.play = T.play(1);
      out.audit = P.audit();
      out.save = /seat:[^"]*:marshal|"marshal":"/.test(A.serialize());
      return out;
    }, b64);
    const checks = {
      loaded: r.loaded !== false,
      playerGeneral: r.oldRank === 9 && r.pc.rank === 7 && r.pc.office === 'general' && r.pc.senior && r.pc.role === 'General' && r.pc.ach && r.log.length === 1,
      loreMarshalsSenior: r.npc.length >= 3 && r.npc.filter(x => x.alive).every(x => x.senior && /^Senior General of /.test(x.role)),
      noSeatLeft: !r.keys && !r.council && !r.save,
      oneHolder: !r.strict.length && !r.audit.length,
      playsOn: r.play === 'ok' || r.play === 'dead',
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | player: grade ${r.oldRank} -> ${r.pc.label}, office ${r.pc.office}, senior ${r.pc.senior}; the lore's Marshals: ${r.npc.map(x => `${x.id} ${x.alive ? (x.senior ? 'senior General' : 'NOT senior: ' + x.role) : 'gone'}`).join(', ')}; log "${r.log.join(' / ').slice(0, 160)}"; a year on: ${r.play}${r.strict.length || r.audit.length ? ' | ' + r.strict.concat(r.audit).slice(0, 3).join('; ') : ''}` };
  },
};
