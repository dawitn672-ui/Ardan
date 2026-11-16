// Deterministic replay: exact find/replace edits on the minified build. See README.md.
export default [
  {
    id: 'ENG-STYLE-RNG',
    blob: 'ardan-core',
    why: 'Looking at a fighter changed the world. A.fightWorth (a question) generated and saved NPC fighting styles with the ' +
      'main random stream, so rendering tier chips, odds or worth tooltips moved the dice and broke replays and problem reports. ' +
      'Now npcStyles rolls from a stream seeded by the world seed and the person, and fightWorth discards styles it only imagined; ' +
      'real styles are created by the duel code, at the same moment in every replay.',
    edits: [[
      'A.npcStyles=function(p){if(!p||p.styles||(p.styles={},!A.isAdult(p)||p.race==="beast"))return;const best=',
      'A.npcStyles=function(p){if(!p||p.styles||(p.styles={},!A.isAdult(p)||p.race==="beast"))return;const _rs=A.rngState;' +
        'let _h=2166136261;for(const ch of (A.S&&A.S.seed||0)+"|"+p.id+"|"+p.born)_h=Math.imul(_h^ch.charCodeAt(0),16777619);' +
        'A.rngState=_h>>>0||1;try{const best=',
    ], [
      'if(nat.length&&A.chance(ch)){const s=A.pick(nat);p.styles[s.id]={rank:rankFor(),xp:0}}}',
      'if(nat.length&&A.chance(ch)){const s=A.pick(nat);p.styles[s.id]={rank:rankFor(),xp:0}}}finally{A.rngState=_rs}}',
    ], [
      'A.fightWorth=function(p){if(!p||!p.st)return 0;const f=A.fighterFrom(p,{});',
      'A.fightWorth=function(p){if(!p||!p.st)return 0;const _ns=p.styles===void 0,f=A.fighterFrom(p,{});_ns&&delete p.styles;',
    ]],
  },
  {
    id: 'ENG-ROSTER-PURE',
    blob: 'ardan-core',
    why: 'Opening the People tab created people: A.roster (a list for the screen) hired missing colleagues with the main random ' +
      'stream. Colleagues are now hired by the engine at the start of each month (A.ensureMates), and the roster only lists.',
    edits: [[
      'A.roster=function(pc){',
      'A.ensureMates=function(pc){if(pc&&pc.alive&&pc.job){for(pc.job.mates=(pc.job.mates||[]).filter(id=>A.P(id)&&A.P(id).alive);pc.job.mates.length<2&&A.isAdult(pc);){const n=A.makeAcquaintance(pc,"acquaint");n.occ="works beside you as "+GD.CAREERS[pc.job.c].ranks[Math.max(0,Math.min(pc.job.r,GD.CAREERS[pc.job.c].ranks.length-1))][0].toLowerCase(),n.job={c:pc.job.c,r:pc.job.r,y:A.ri(1,8),perf:A.ri(30,80),rep:A.ri(20,60)},GD.CAREERS[pc.job.c].skill&&(n.skills[GD.CAREERS[pc.job.c].skill]=A.ri(15,55)),pc.job.mates.push(n.id)}}},A.roster=function(pc){',
    ], [
      'if(pc.job){for(pc.job.mates=(pc.job.mates||[]).filter(id=>A.P(id)&&A.P(id).alive);pc.job.mates.length<2&&A.isAdult(pc);){const n=A.makeAcquaintance(pc,"acquaint");n.occ="works beside you as "+GD.CAREERS[pc.job.c].ranks[Math.max(0,Math.min(pc.job.r,GD.CAREERS[pc.job.c].ranks.length-1))][0].toLowerCase(),n.job={c:pc.job.c,r:pc.job.r,y:A.ri(1,8),perf:A.ri(30,80),rep:A.ri(20,60)},GD.CAREERS[pc.job.c].skill&&(n.skills[GD.CAREERS[pc.job.c].skill]=A.ri(15,55)),pc.job.mates.push(n.id)}for(const id of pc.job.mates)add(A.P(id),"a colleague","Beside you")}',
      'if(pc.job){for(const id of pc.job.mates||[])add(A.P(id),"a colleague","Beside you")}',
    ], [
      'console.error("onMonth",e)}A.monthEvents(pc)},A.monthEvents=',
      'console.error("onMonth",e)}A.ensureMates(pc),A.monthEvents(pc)},A.monthEvents=',
    ]],
  },
  {
    id: 'ENG-GEAR-ROLL',
    blob: 'ardan-core',
    why: 'A.gearAvailable rolled A.ri(0,1)<2, which is always true, so drawing the Holdings tab burned random numbers for nothing.',
    edits: [['p.owner))&&A.ri(0,1)<2&&!pc.flags.dwarfFriend', 'p.owner))&&!pc.flags.dwarfFriend']],
  },
  {
    id: 'SAVE-JOURNAL-BASE',
    blob: 'ardan-core',
    why: 'A journal with no recorded game start (restarted, imported or legacy) kept its old base fingerprint across a save and ' +
      'reload, while the report sent the just-loaded state as the base, so such reports could never replay ("the save to start ' +
      'from is not the one this journal began at"). Such a journal now restarts from the loaded state; its old entries could not ' +
      'be replayed anyway.',
    edits: [[
      'A.J=J&&J.v===1&&Array.isArray(J.e)?J:{v:1,o:null,base:A.fingerprint(A.jBase),e:[]}',
      'A.J=J&&J.v===1&&Array.isArray(J.e)&&(J.o||J.base===A.fingerprint(A.jBase))?J:{v:1,o:null,base:A.fingerprint(A.jBase),e:[]}',
    ]],
  },
];
