// 99997-v2-war, part 4: the battle screen at your rank. Drawing reads the scene and draws nothing (W.oddsOf and
// A.V2.war.facing are pure); the choices are data-a actions.
(function () {
  const W = A.V2W, VW = A.V2 && A.V2.war;
  if (!W || !VW || typeof UI === 'undefined' || !UI.queueModal) return;
  const esc = s => UI.esc(s);
  W.cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const scale = tilt => (A.V2S && A.V2S.scaleSvg ? A.V2S.scaleSvg(tilt) : '');
  const RANK_NAME = { soldier: 'a soldier in the line', sergeant: 'a sergeant with your section', captain: 'a captain with your company', commander: 'in command' };
  const TIER = { triumph: 'a triumph', success: 'it goes your way', 'narrow success': 'it goes your way, barely', 'narrow failure': 'it nearly works', failure: 'it goes wrong', disaster: 'a disaster', mixed: 'neither here nor there' };

  // one rank word: the army's own title (a Commander leads his men as a captain does), then what he leads
  const TAIL = { soldier: 'in the line', sergeant: 'with your section', captain: 'with your men', commander: 'in command' };
  // and the men you order are named as what you lead (b.unit: your company, your battalion, your division)
  W.rankWords = function (pc, rank, b) {
    const t = pc && pc.mil && GD.MIL && GD.MIL[pc.mil.rank] ? GD.MIL[pc.mil.rank].title : null;
    if (!t) return RANK_NAME[rank] || rank;
    const tail = rank === 'captain' && b && b.unit ? 'with ' + b.unit : TAIL[rank] || '';
    return `${/^[AEIOU]/.test(t) ? 'an' : 'a'} ${t} ${tail}`.trim();
  };
  W.sideLine = function (b, side) {
    const a = b.camp.armies[side], men = VW.armyMen(a), rank = b.rank;
    return `${esc(a.name)}: ${esc(W.estimate(men, rank))} men`;
  };
  W.view = function (b) {
    const pc = A.pc(), camp = b.camp, ph = camp.battle.phase;
    let h = `<div class="panel mbox v2w-battle" data-rank="${esc(b.rank)}"><h2>${esc(b.title)}</h2>`;
    h += `<div class="small muted">You fight as ${esc(W.rankWords(pc, b.rank, b))}${b.div ? ' of the ' + esc(b.div) : ''}, ${esc(VW.TERRAIN[camp.battle.terrain].at)}.</div>`;
    h += `<div class="small v2w-sides">${W.sideLine(b, 0)} · ${W.sideLine(b, 1)}</div>`;
    for (const p of b.phases) {
      h += `<div class="small v2w-ph"><b>${esc(p.ph)}.</b> ${esc(p.t)}: ${esc(TIER[p.tier] || p.tier)}${p.why === 'blunder' ? ', a blunder' : p.why === 'surge' ? ', something in you will not give' : ''}.`;
      h += `${p.kills ? ` You put down ${p.kills}.` : ''}${p.wound ? ` A wound to the ${esc(p.wound)}.` : ''}${p.banner ? ' You take their standard.' : ''}`;
      h += ` Your side loses ${esc(W.estimate(p.lossA, b.rank))}, theirs ${esc(W.estimate(p.lossB, b.rank))}.</div>`;
    }
    if (b.done) {
      const r = b.aar;
      h += `<div class="mtext v2w-aar"><b>${esc(r.headline)}</b><div class="group-h">What decided it</div><ol class="small">${r.causes.map(c => `<li>${esc(c.label)}</li>`).join('')}</ol></div>`;
      h += `<div class="choices"><button class="primary" data-a="v2wClose">Leave the field</button></div></div>`;
      return h;
    }
    const foe = VW.facing(camp);
    const gen = camp.armies[1].commander.name ? `their general, ${camp.armies[1].commander.name}` : 'their general';
    const who = `${foe ? W.estimate(foe.count, b.rank) + ' of the ' + foe.name : 'their line'}, ${W.quality(foe ? foe.worth : 1)}${b.rank === 'captain' ? ', under ' + gen : ''}`;
    h += `<div class="mtext"><b>${esc(VW.PHASES[ph])}.</b> Across from you: ${esc(who)}.</div>`;
    if (b.rank === 'captain') {
      h += `<div class="row v2w-tac"><span class="tiny muted">${esc(W.cap(b.unit || 'your company'))}:</span>${W.TACS.map(k => `<button class="small ${b.tac === k ? 'primary' : ''}" data-a="v2wTac" data-v="${esc(k)}">${esc(VW.TACTICS[k].name)}</button>`).join('')}</div>`;
    }
    h += `<div class="choices">${W.choices(b).map((c, i) => {
      const o = W.oddsOf(b, c, pc);
      return `<button data-a="v2wChoose" data-v="${i}">${esc(c.name)} <span class="v2-odds" title="${esc(o.line)}">${scale(o.tilt)}<span class="v2-ow">${esc(o.words)}</span></span></button>`;
    }).join('')}</div></div>`;
    return h;
  };
  const qm = UI.queueModal;
  UI.queueModal = function (q) {
    if (q && q.type === 'v2battle') { try { return W.view(q.b); } catch (e) { console.error('v2 war view', e); return `<div class="panel mbox"><h2>Battle</h2><div class="choices"><button data-a="qSkip">Close</button></div></div>`; } }
    return qm.apply(this, arguments);
  };
  Object.assign(UI.A, {
    v2wChoose(v) { W.choose(+v); UI.renderModal ? UI.renderModal() : UI.refresh(); },
    v2wTac(v) { W.setTac(v); UI.renderModal ? UI.renderModal() : UI.refresh(); },
    // the battle stopped the clock: leaving the field ends the step (it never resumes into an empty queue)
    v2wClose() { W.close(); try { const ST = UI.stepper; if (ST && ST.run && !(A.S.queue || []).length && UI.stepStop) UI.stepStop(); } catch (e) { console.error('v2 war close', e); } UI.refresh(); },
  });
})();
