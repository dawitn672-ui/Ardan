// Play one life for N years through the real UI: node life.js <cfg> <years> [--shots]
// The cfg module (cfg/<name>.js) gives: create (opts for the creation screen), persona (choice likes/fears),
// acts(snapshot) -> activity keys to try this month, and between(page, ctx) for the big moves a player makes.
const fs = require('fs');
const path = require('path');
const D = require('./drive.js');

const name = process.argv[2], years = +process.argv[3] || 1;
const cfg = require(path.resolve(__dirname, '../cfg/' + name + '.js'));
const dir = path.resolve(__dirname, '../' + name); fs.mkdirSync(dir, { recursive: true });
const stateFile = dir + '/state.json';
const logf = fs.createWriteStream(dir + '/log.jsonl', { flags: 'a' });
const log = o => logf.write(JSON.stringify(o) + '\n');
const monthsf = fs.createWriteStream(dir + '/months.jsonl', { flags: 'a' });

function policy(md, s) {
  const P = cfg.persona;
  const ch = md.ch.filter(c => !c.dis);
  let best = ch[0] ? ch[0].i : 0, bs = -1e9;
  for (const c of ch) {
    const t = c.t.toLowerCase();
    let sc = 0;
    if (/could kill you|gallows|hanged|hang you|your life|executed|death/.test(t)) sc -= P.fearDeath || 6;
    if (/a wound|hurt|prison|deep cell|a trial|flogg/.test(t)) sc -= P.fearHurt || 2;
    for (const [re, w] of P.likes || []) if (re.test(t)) sc += w;
    for (const [re, w] of P.likesTitle || []) if (re.test((md.title + ' ' + md.text).toLowerCase())) sc += 0; // reserved
    sc += ((D.hash(md.title + '|' + s.date + '|' + c.i + '|' + (P.salt || '')) % 1000) / 1000) * (P.noise || 3);
    if (sc > bs) { bs = sc; best = c.i; }
  }
  return best;
}

// a duel the way a player fights one: read the instincts line and answer it; yield a sport bout when badly hurt
function duelPick(md) {
  const acts = md.acts.filter(a => !a.dis);
  // a battle scene at your rank: weigh the odds words against how bold the order is, as the persona would
  const bat = acts.filter(a => a.a === 'v2wChoose');
  if (bat.length) {
    const ODDS = [['heavily in your favour', 3], ['in your favour', 2], ['evenly matched', 1], ['against you', 0], ['long odds', -1], ['hopeless', -2]];
    const bold = (cfg.persona.bold != null ? cfg.persona.bold : 0.6);
    let best = bat[0], bs = -1e9;
    for (const a of bat) {
      const t = a.t.toLowerCase();
      const o = (ODDS.find(([w]) => t.includes(w)) || [0, 0.5])[1];
      const b = /plug|counter|push|banner|standard|lead the charge|reserve now|charge/.test(t) ? 1 : /rear|back|hide|hold the reserve/.test(t) ? -1 : 0;
      const sc = o + bold * b + ((D.hash(md.text.slice(-60) + a.v) % 100) / 100) * 0.8;
      if (sc > bs) { bs = sc; best = a; }
    }
    return best;
  }
  const has = v => acts.find(a => a.a === 'duel' && a.v === v);
  if (!has('strike')) return null;
  const t = md.text;
  const mine = (t.match(/Blood(unhurt|bloodied|hurt|badly hurt|failing)/) || [])[1] || '';
  if (/not to the death/.test(t) && /failing|badly hurt/.test(mine) && has('yield')) return has('yield');
  const hint = (t.match(/Your instincts[^:]*:[^\n]*?—([^\n]*?)(?:1Strike|$)/) || [])[1] || '';
  if (/feint|trick/.test(hint)) return has('press') || has('strike');
  if (/all-out|straight attack|cut is coming|lunge|charge/.test(hint)) return has('guard') || has('strike');
  if (/shield comes up|guard|turtle|waits/.test(hint)) return has('feint') || has('grapple') || has('strike');
  if (/backs off|tired|winded/.test(hint)) return has('press') || has('strike');
  const r = D.hash(t.slice(-80)) % 4;
  return [has('strike'), has('feint'), has('guard'), has('strike')][r] || has('strike');
}

(async () => {
  const { b, page, errs } = await D.open(1366);
  const shot = async (tag, w) => {
    const vp = page.viewportSize();
    if (w && w !== vp.width) { await page.setViewportSize({ width: w, height: w < 600 ? 900 : 900 }); await page.waitForTimeout(400); }
    const f = `${name}-${tag}${w && w < 600 ? '-420' : ''}.png`;
    await page.screenshot({ path: path.resolve(__dirname, '../shots/' + f) }).catch(() => {});
    if (w && w !== vp.width) { await page.setViewportSize(vp); await page.waitForTimeout(300); }
    return f;
  };
  fs.mkdirSync(path.resolve(__dirname, '../shots'), { recursive: true });
  if (fs.existsSync(stateFile)) await D.load(page, stateFile);
  else { await D.createLife(page, cfg.create); log({ k: 'created', create: cfg.create }); await shot('00-born'); }
  const ctx = { name, dir, log, shot, page, D, policy, cfg };
  const startYear = await page.evaluate(() => A.S.year);
  const endYear = startYear + years;
  let n = 0;
  while (true) {
    const s0 = await D.st(page);
    if (!s0.alive) { log({ k: 'dead-before' }); break; }
    if (s0.year >= endYear) break;
    if (cfg.between) { try { await cfg.between(page, ctx, s0); } catch (e) { log({ k: 'betweenErr', e: String(e).slice(0, 300) }); } }
    // spend initiative as the persona would
    if (cfg.acts) {
      const snap = await page.evaluate(() => { const pc = A.pc(); return { ini: pc.ini != null ? pc.ini : (A.ini ? A.ini(pc) : null), age: A.age(pc), coin: pc.coin, job: pc.job && pc.job.k, mil: !!pc.mil }; });
      const want = cfg.acts(snap, s0) || [];
      for (const k of want) {
        const r = await D.act(page, k, policy, log);
        if (r && r.dead) break;
      }
    }
    const r = await D.month(page, policy, log, { overlay: cfg.overlay, otherModal: cfg.otherModal || duelPick });
    n++;
    const s1 = await D.st(page);
    const perf = await page.evaluate(() => ({ people: Object.keys(A.S.people).length, alive: Object.values(A.S.people).filter(p => p.alive).length, log: (A.S.log || []).length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }));
    monthsf.write(JSON.stringify(Object.assign({ n, date: s1.date, age: s1.age }, r, perf)) + '\n');
    if (r.dead || !s1.alive) { log({ k: 'died', date: s1.date, age: s1.age }); await shot('zz-dead'); break; }
    if (r.stuck) { log({ k: 'STUCK' }); await shot('stuck-' + n); break; }
    if (n % 24 === 0) { try { await D.save(page, stateFile); } catch (e) { log({ k: 'saveErr', e: String(e).slice(0, 200) }); } }
    if (cfg.after) { try { await cfg.after(page, ctx, s1, n); } catch (e) { log({ k: 'afterErr', e: String(e).slice(0, 300) }); } }
  }
  const len = await D.save(page, stateFile);
  log({ k: 'saved', len, errs: errs.slice(0, 20) });
  if (errs.length) fs.appendFileSync(dir + '/errors.log', errs.join('\n') + '\n');
  console.log('done', name, 'months', n, 'state', len, 'errors', errs.length);
  await b.close();
})();
