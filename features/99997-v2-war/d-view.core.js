// 99997-v2-war, part 4: the battle screen at your rank. Drawing reads the scene and draws nothing (W.oddsOf and
// A.V2.war.facing are pure); the choices are data-a actions.
(function () {
  const W = A.V2W, VW = A.V2 && A.V2.war;
  if (!W || !VW || typeof UI === 'undefined' || !UI.queueModal) return;
  const esc = s => UI.esc(s);
  const scale = tilt => (A.V2S && A.V2S.scaleSvg ? A.V2S.scaleSvg(tilt) : '');
  const RANK_NAME = { soldier: 'a soldier in the line', sergeant: 'a sergeant with your section', captain: 'a captain with your company', commander: 'in command' };
  const TIER = { triumph: 'a triumph', success: 'it goes your way', 'narrow success': 'it goes your way, barely', 'narrow failure': 'it nearly works', failure: 'it goes wrong', disaster: 'a disaster', mixed: 'neither here nor there' };

  W.sideLine = function (b, side) {
    const a = b.camp.armies[side], men = VW.armyMen(a), rank = b.rank;
    return `${esc(a.name)}: ${esc(W.estimate(men, rank))} men`;
  };
  W.view = function (b) {
    const pc = A.pc(), camp = b.camp, ph = camp.battle.phase;
    let h = `<div class="panel mbox v2w-battle" data-rank="${esc(b.rank)}"><h2>${esc(b.title)}</h2>`;
    h += `<div class="small muted">You fight as ${esc(RANK_NAME[b.rank] || b.rank)}${b.div ? ' of the ' + esc(b.div) : ''}, ${esc(VW.TERRAIN[camp.battle.terrain].at)}.</div>`;
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
    const who = b.rank === 'captain' ? (camp.armies[1].commander.name ? `their general, ${camp.armies[1].commander.name}` : 'their general')
      : `${foe ? W.estimate(foe.count, b.rank) + ' of the ' + foe.name : 'their line'}, ${W.quality(foe ? foe.worth : 1)}`;
    h += `<div class="mtext"><b>${esc(VW.PHASES[ph])}.</b> ${b.rank === 'captain' ? 'You match wits with' : 'Across from you'}: ${esc(who)}.</div>`;
    if (b.rank === 'captain') {
      h += `<div class="row v2w-tac"><span class="tiny muted">Your company:</span>${W.TACS.map(k => `<button class="small ${b.tac === k ? 'primary' : ''}" data-a="v2wTac" data-v="${esc(k)}">${esc(VW.TACTICS[k].name)}</button>`).join('')}</div>`;
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
    v2wClose() { W.close(); UI.refresh(); },
  });
})();
