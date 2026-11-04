// 9994-share: "Keep this" on a scene's result, the death screen and the Book makes a 1080 x 1350 PNG that downloads as
// the release's save export does (UI.download, a Blob URL), offers the world seed to copy, and changes nothing.
const pngSize = buf => ({ png: buf.slice(1, 4).toString() === 'PNG', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), kb: Math.round(buf.length / 1024) });
async function grab(pg, path) {
  await pg.waitForSelector('#modal [data-a="shSave"]', { timeout: 20000 });
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#modal [data-a="shSave"]')]);
  const fs = await import('node:fs');
  const p = await dl.path();
  const buf = fs.readFileSync(p);
  if (path) { try { fs.mkdirSync(path.replace(/\/[^/]+$/, ''), { recursive: true }); fs.writeFileSync(path, buf); } catch (e) {} }
  return Object.assign(pngSize(buf), { name: dl.suggestedFilename() });
}
export default {
  async shScene(pg) {
    const a = await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'F', startAge: 17 });
      T.play(1);
      A.S.queue.unshift({ type: 'event', ev: 'ix_pup', ctx: {} });
      UI.render(); UI.renderModal();
      return true;
    });
    await pg.click('#modal button[data-a="evChoose"]');
    const keep = await pg.evaluate(() => { const b = document.querySelector('#modal .sh-keep'); return !!b; });
    const h0 = await pg.evaluate(() => [T.hash(A.S), A.rngState]);
    await pg.click('#modal .sh-keep');
    const f = await grab(pg, '/tmp/ardan/grow/I/test-card-scene.png');
    const seed = await pg.evaluate(() => ({ v: (document.getElementById('shSeed') || {}).value, s: String(A.S.seed) }));
    await pg.click('#modal .sh-acts [data-a="closeOv"]');
    const after = await pg.evaluate(h0 => ({ same: T.hash(A.S) === h0[0] && A.rngState === h0[1], result: !!document.querySelector('#modal .sc-result, #modal .result') }), h0);
    const ok = a && keep && f.png && f.w === 1080 && f.h === 1350 && f.kb > 50 && /\.png$/.test(f.name) && seed.v === seed.s && after.same && after.result;
    return { ok, detail: `Keep this on the result ${keep}; ${f.name} ${f.w}x${f.h} ${f.kb} KB; seed ${seed.v}; state unchanged ${after.same}; back on the result ${after.result}` };
  },

  async shSubject(pg) {
    // a scene about someone: the face is theirs and so is the name beside it; yours goes in the line under the text;
    // the overlay's buttons are a plain row, Save the gold primary, Back a ghost with no key badge
    await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 25 });
      T.play(1); A.S.queue = [];
      const pc = A.pc(), id = Object.keys(pc.rel).find(i => { const t = A.P(i); return t && t.alive && t.app && A.isAdult(t); });
      A.S.queue.unshift({ type: 'event', ev: 'cf_friend_1', ctx: { pid: id } });
      UI.render(); UI.renderModal();
    });
    await pg.click('#modal button[data-a="evChoose"]');
    const d = await pg.evaluate(() => { const x = UI.SHARE.KINDS.scene(), q = A.S.queue[0], t = A.P(q.ctx.pid), pc = A.pc(); return { tag: x.tag, epi: x.epitaph, them: t.given, me: pc.given, stats: (x.stats || []).length }; });
    await pg.click('#modal .sh-keep');
    await pg.waitForSelector('#modal [data-a="shSave"]', { timeout: 20000 });
    const b = await pg.evaluate(() => { const s = document.querySelector('#modal [data-a="shSave"]'), k = document.querySelector('#modal .sh-acts [data-a="closeOv"]'); return { primary: s.classList.contains('primary'), choices: !!s.closest('.choices'), ghost: k.classList.contains('ghost'), badge: getComputedStyle(k, '::before').content }; });
    const ok = d.tag.startsWith(d.them + ',') && d.epi.includes(d.me) && d.stats === 4 && b.primary && !b.choices && b.ghost && (b.badge === 'none' || b.badge === 'normal' || b.badge === '""');
    return { ok, detail: `tag "${d.tag}" (subject ${d.them}), line "${d.epi}", ${d.stats} numbers; Save primary ${b.primary}, in .choices ${b.choices}, Back ghost ${b.ghost}, badge ${b.badge}` };
  },

  async shLife(pg) {
    await pg.evaluate(() => {
      T.enter({ seed: 777, race: 'elf', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      T.play(1);
      A.S.queue = []; A.pcDeath('a fever'); UI.A.showDeath ? UI.A.showDeath() : (UI.render(), UI.renderModal());
    });
    const keep = await pg.evaluate(() => !!document.querySelector('#modal .obit .sh-keep[data-v="life"]'));
    await pg.click('#modal .sh-keep[data-v="life"]');
    const f = await grab(pg, '/tmp/ardan/grow/I/test-card-life.png');
    await pg.click('#modal .sh-acts [data-a="closeOv"]');
    const back = await pg.evaluate(() => !!document.querySelector('#modal .obit'));
    const ok = keep && f.png && f.w === 1080 && f.h === 1350 && back;
    return { ok, detail: `Keep this life on the death screen ${keep}; ${f.name} ${f.w}x${f.h} ${f.kb} KB; back on the death screen ${back}` };
  },

  async shBook(pg) {
    await pg.evaluate(() => {
      T.enter({ seed: 778, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 16 });
      T.play(3);
      UI.tab = 'book'; UI.render();
    });
    const keep = await pg.evaluate(() => !!document.querySelector('#tabbody .sh-keep[data-v="book"]'));
    await pg.click('#tabbody .sh-keep[data-v="book"]');
    const f = await grab(pg, '/tmp/ardan/grow/I/test-card-book.png');
    const ok = keep && f.png && f.w === 1080 && f.h === 1350;
    return { ok, detail: `Keep this page on the Book ${keep}; ${f.name} ${f.w}x${f.h} ${f.kb} KB` };
  },
};
