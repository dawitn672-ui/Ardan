// E4: war at a given rank, played through the UI. node e4-command.js <state> <rank> <weeks> <tag>
// Loads a soldier's save, starts a war with a neighbour if none, sets the rank the way a promotion does,
// then steps the clock (Next week on campaign, else Next month) answering every card and battle screen.
const D = require('./drive.js');
const fs = require('fs');
const [file, rankS, weeksS, tag] = process.argv.slice(2);
const rank = +rankS, weeks = +weeksS || 12;
const dir = '/tmp/ardan/critique/design/e4-' + tag; fs.mkdirSync(dir, { recursive: true });
const logf = fs.createWriteStream(dir + '/log.jsonl');
const log = o => logf.write(JSON.stringify(o) + '\n');
function policy(md) { const ch = md.ch.filter(c => !c.dis); return ch[D.hash(md.title + md.text.slice(-40)) % ch.length].i; }
let shots = 0;
(async () => {
  const { b, page, errs } = await D.open(1366);
  await D.load(page, file);
  const setup = await page.evaluate(rank => {
    const pc = A.pc(), m = pc.mil, me = m.realm, r = A.realm(me);
    if (!A.atWar(me).length) { const en = A.neighbors(me).find(x => A.realm(x) && A.realm(x).alive); A.startWar(me, en, null, 'conquest'); }
    m.rank = rank; if (rank === 9) { r.council = r.council || {}; r.council.marshal = pc.id; }
    A.wsAttachPC && A.wsAttachPC();
    UI.render();
    return { rank: m.rank, title: GD.MIL[m.rank].title, wars: A.atWar(me).map(w => w.name || w.id), army: m.army, role: A.cmdRole(pc).key };
  }, rank);
  log({ k: 'setup', setup });
  const otherModal = (md) => {
    const acts = md.acts.filter(a => !a.dis);
    // a battle at any rank: the first choice that is not holding back; otherwise go on
    const step = acts.find(a => a.a === 'bStep') || acts.find(a => a.a === 'bClose');
    if (step) return step;
    const q = acts.filter(a => a.a === 'qChoice');
    if (q.length) return q[0];
    const bat = acts.filter(a => /^(v2wChoose|bTac|wsTac|wlTac|bnTac|bReserve|tacPick)$/.test(a.a));
    if (bat.length) return bat[D.hash(md.text.slice(-50)) % bat.length];
    return null;
  };
  const onModal = async (n, md) => { if (shots < 14 && /battle|Battle|Attack|Siege|siege|war room|War/i.test(md.title + md.text.slice(0, 200))) { shots++; await page.screenshot({ path: `${dir}/m${String(shots).padStart(2, '0')}.png` }); } };
  for (let i = 0; i < weeks; i++) {
    const r = await D.month(page, policy, log, { otherModal, onModal, overlay: async (pg, s, ovd) => { if (shots < 14) { shots++; await pg.screenshot({ path: `${dir}/ov${String(shots).padStart(2, '0')}.png` }); } return false; } });
    log({ k: 'step', i, r });
    if (r.dead) break;
  }
  const end = await page.evaluate(() => { const pc = A.pc(); return { alive: pc.alive, rank: pc.mil && pc.mil.rank, battles: pc.mil && pc.mil.battles, date: A.dateStr() }; });
  log({ k: 'end', end, errs });
  console.log(JSON.stringify(setup), JSON.stringify(end), errs.length);
  await b.close();
})();
