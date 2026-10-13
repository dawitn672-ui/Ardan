// Small hooks that route the engine's AI decisions through the persona model in persona.core.js.
// Each edit swaps one constant (A.AGGRO, a fixed probability or threshold) for a persona-weighted value, or wraps
// an existing call so the decision gets logged with its reasons. Dice are rolled where the engine rolled them.
export default [
  {
    id: 'AIP-WAR-CHECK',
    blob: 'ardan-core',
    why: 'A.aiWarCheck: the opinion bar (-25), the strength edge wanted (.7), the no-cause penalty (.6) and A.AGGRO now come from the ruler persona; a declared war is logged with its top 3 reasons.',
    edits: [
      ['if(rel>-25||A.hostile(r.id,o.id))continue;const P=A.warPreview(r.id,o.id);let p=.11/12*(A.AGGRO[r.id]||1)*A.clamp(P.ratio-.7,0,2.5)*(1+(-rel-25)/60);if(p*=cb?cb==="justified"||cb==="reconquest"?2.2:1.5:.6,',
        'if(rel>A.aiWarBar(r.id)||A.hostile(r.id,o.id))continue;const P=A.warPreview(r.id,o.id);let p=.11/12*A.aiWarW(r.id)*A.clamp(P.ratio-A.aiNerve(r.id),0,2.5)*(1+(-rel-25)/60);if(p*=cb?cb==="justified"||cb==="reconquest"?2.2:1.5:A.aiNoCause(r.id),'],
      ['A.chance(p)){A.declareWar(r.id,o.id);return}', 'A.chance(p)){A.aiNoteWar(r.id,o.id,P,rel,cb,A.declareWar(r.id,o.id));return}'],
    ],
  },
  {
    id: 'AIP-DIPLO-AI',
    blob: 'ardan-core',
    why: 'A.diploAI: keeping or breaking alliances (honor), betraying an ally (war and honor), seeking alliances (sociability), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, submitting as a tributary (pride and caution) and forging claims (war and patience) use the ruler persona; each act is logged with reasons.',
    edits: [
      ['(A.interest(r.id,al)<8&&A.chance(.35)||A.threatsTo(r.id).includes(al)&&A.chance(.5))&&(A.cancelTr("ally",r.id,al)', 'A.aiBreakAlly(r.id,al)&&(A.cancelTr("ally",r.id,al)'],
      ['if((A.AGGRO[r.id]||1)>=1.15&&!A.atWar(r.id).length&&r.stability>35){', 'if(A.aiWarW(r.id)>=1.15&&!A.atWar(r.id).length&&r.stability>35){'],
      ['if(t&&A.chance(.06)){A.declareWar(r.id,t.id,{cb:A.cbOn(r.id,t.id)||"betrayal"});continue}', 'if(t&&A.chance(A.aiBetrayP(r.id))){A.aiNoteBetray(r.id,t.id,A.declareWar(r.id,t.id,{cb:A.cbOn(r.id,t.id)||"betrayal"}));continue}'],
      ['best&&bv>=48&&A.chance(.35)', 'best&&bv>=A.aiAllyBar(r.id)&&A.chance(.35)'],
      ['{aim:"ally"}):A.sign("ally",r.id,best.id))', '{aim:"ally"}):A.aiSign("ally",r.id,best.id))'],
      ['t&&(t.playerRun?ask(r,"defpact",{foe:thr[0]}):A.sign("def",r.id,t.id))', 't&&(t.playerRun?ask(r,"defpact",{foe:thr[0]}):A.aiSign("def",r.id,t.id))'],
      ['t&&A.sign("guar",r.id,t.id)}', 't&&A.aiSign("guar",r.id,t.id)}'],
      ['if(r.treasury>r.income*.4&&A.chance(.25)){', 'if(r.treasury>r.income*.4&&A.chance(A.aiGiveP(r.id))){'],
      ['t&&A.sign("sub",r.id,t.id,{amt:', 't&&A.aiSign("sub",r.id,t.id,{amt:'],
      ['A.chance(.035)){A.sign("emb",r.id,rv)', 'A.chance(.035*A.aiSpite(r.id))){A.aiSign("emb",r.id,rv)'],
      ['A.chance(.06)&&(o.playerRun?ask(r,"trade"):A.sign("trade",r.id,oid))', 'A.chance(.06*A.aiTradeW(r.id))&&(o.playerRun?ask(r,"trade"):A.aiSign("trade",r.id,oid))'],
      ['A.chance(.05)&&(o.playerRun?ask(r,"nap"):A.sign("nap",r.id,oid))', 'A.chance(.05*A.aiNapW(r.id))&&(o.playerRun?ask(r,"nap"):A.aiSign("nap",r.id,oid))'],
      ['.length<2&&A.chance(.08)){', '.length<2&&A.chance(.08*A.aiSpite(r.id))){'],
      ['t&&(A.sign("rival",r.id,t.id),', 't&&(A.aiSign("rival",r.id,t.id),'],
      ['if(!r.overlord&&!A.atWar(r.id).length&&A.chance(.04)){', 'if(!r.overlord&&!A.atWar(r.id).length&&A.chance(.04*A.aiYield(r.id))){'],
      ['((A.AGGRO[o.id]||1)>1.1||o.infamy>20)', '(A.aiWarW(o.id)>1.1||o.infamy>20)'],
      ['strong.length&&A.sign("trib",r.id,A.pick(strong).id)', 'strong.length&&A.aiSign("trib",r.id,A.pick(strong).id)'],
      ['if((A.AGGRO[r.id]||1)>=.9&&!r.justify&&!A.atWar(r.id).length&&A.chance(.3*(A.AGGRO[r.id]||1))){', 'if(A.aiWarW(r.id)>=.9&&!r.justify&&!A.atWar(r.id).length&&A.chance(.3*A.aiWarW(r.id)*A.aiPlan(r.id))){'],
      ['t&&A.justifyStart(r.id,t.id,!0)}', 't&&A.aiJustify(r.id,t.id)}'],
    ],
  },
  {
    id: 'AIP-INTEREST',
    blob: 'ardan-core',
    why: 'A.interest and A.interestParts (the "what they want from you" list and every offer\'s odds) add the ruler\'s character from A.aiInterestParts, and judge "too hungry" by the ruler persona instead of A.AGGRO; A.threatsTo does the same, and cautious rulers see threats sooner.',
    edits: [
      ['A.neighbors(a).includes(b)&&ratio>2.5&&(A.AGGRO[b]||1)>1.1&&(v-=15),v}', 'A.neighbors(a).includes(b)&&ratio>2.5&&A.aiWarW(b)>1.1&&(v-=15),v+A.aiInterestSum(a,b)}'],
      ['A.neighbors(a).includes(b)&&ratio>2.5&&(A.AGGRO[b]||1)>1.1&&out.push(["You are too strong and too hungry",-15]),out}', 'A.neighbors(a).includes(b)&&ratio>2.5&&A.aiWarW(b)>1.1&&out.push(["You are too strong and too hungry",-15]),A.aiInterestParts(a,b,out),out}'],
      ['hostileMind=A.relBetween(rid,id)<-10||(A.AGGRO[id]||1)>1.1||', 'hostileMind=A.relBetween(rid,id)<-10||A.aiWarW(id)>1.1||'],
      ['ratio>1.25&&hostileMind', 'ratio>A.aiFearAt(rid)&&hostileMind'],
    ],
  },
  {
    id: 'AIP-CALL-TO-ARMS',
    blob: 'ardan-core',
    why: 'callToArmsNow and A.warPreview: honorable rulers answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often; each answer is logged with reasons.',
    edits: [
      ['(a.marriages&&a.marriages[def]?.1:0),.05,.95);', '(a.marriages&&a.marriages[def]?.1:0)+A.aiCallAdj(al),.05,.95);'],
      ['A.chance(p)?join("def",al,', 'A.aiAnswerCall(al,def,att,p)?join("def",al,'],
      ['A.relBetween(al,att)>50&&A.relBetween(al,def)<0&&A.chance(.35)&&join("att",al,', 'A.relBetween(al,att)>50&&A.relBetween(al,def)<0&&A.aiJoinAttack(al,att,def)&&join("att",al,'],
      ['(A.relBetween(id,a)>40?.25:0),.05,.95),why="ally")', '(A.relBetween(id,a)>40?.25:0)+A.aiCallAdj(id),.05,.95),why="ally")'],
      ['const q=A.relBetween(id,a)>50&&A.relBetween(id,b)<0?35:10;', 'const q=A.relBetween(id,a)>50&&A.relBetween(id,b)<0?Math.round(100*A.aiJoinP(id)):10;'],
    ],
  },
  {
    id: 'AIP-PEACE',
    blob: 'ardan-core',
    why: 'A.checkPeace: the loser gives in sooner if cautious, later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers (A.aiWhite). A.peaceTerms adds the enemy ruler\'s temper to their willingness. Every settlement is logged.',
    edits: [
      ['capOcc(ld,w.att)&&w.score>40&&A.chance(.3)||ld.exhaustion>85&&w.score>20&&A.chance(.2)', 'capOcc(ld,w.att)&&w.score>40&&A.chance(.3*A.aiYield(w.leadD))||ld.exhaustion>85&&w.score>20&&A.chance(.2*A.aiYield(w.leadD))'],
      ['capOcc(la,w.def)&&w.score<-40&&A.chance(.3)||la.exhaustion>85&&w.score<-20&&A.chance(.2)', 'capOcc(la,w.def)&&w.score<-40&&A.chance(.3*A.aiYield(w.leadA))||la.exhaustion>85&&w.score<-20&&A.chance(.2*A.aiYield(w.leadA))'],
      ['(years>=4&&A.chance(.03)||years>=2&&Math.abs(w.score)<15&&A.chance(.02)||la.exhaustion>75&&ld.exhaustion>75&&A.chance(.15))', '(years>=4&&A.chance(.03*A.aiWhite(w))||years>=2&&Math.abs(w.score)<15&&A.chance(.02*A.aiWhite(w))||la.exhaustion>75&&ld.exhaustion>75&&A.chance(.15*A.aiWhite(w)))'],
      ['res&&(w.manualPeace||A.settleWar(w,res))}', 'res&&(w.manualPeace||(A.aiNotePeace(w,res),A.settleWar(w,res)))}'],
      ['+(A.atWar(eid).length>1?10:0);return{w,side,my,them,eid,e,r,sc,terms:out,will}', '+(A.atWar(eid).length>1?10:0)+A.aiPeaceWill(eid);return{w,side,my,them,eid,e,r,sc,terms:out,will}'],
    ],
  },
  {
    id: 'AIP-TRIBUTE',
    blob: 'ardan-core',
    why: 'Tribute and greed: a tributary defies its overlord by pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player (A.aiGreedW); the player\'s own tribute demand is weighed by the target ruler\'s pride and caution, and their wrath decides whether a refusal means war.',
    edits: [
      ['(A.realmPower(ov)/Math.max(1,A.realmPower(r))<1.6&&A.chance(.25)||A.relBetween(r.id,ov.id)<-60&&A.chance(.12)||ov.exhaustion>70&&A.chance(.2))&&(r.overlord=null,', 'A.aiDefy(r.id,ov.id)&&(r.overlord=null,'],
      ['A.chance(.5)&&!ov.playerRun&&!A.atWar(ov.id).some(w=>A.warSide(w,r.id))&&A.startWar(ov.id,r.id,null,"tribute")', '!ov.playerRun&&!A.atWar(ov.id).some(w=>A.warSide(w,r.id))&&A.aiPunish(ov.id,r.id)&&A.startWar(ov.id,r.id,null,"tribute")'],
      ['A.realm(winL).overlord!==loseL&&A.chance(.5)&&(lr.overlord=winL,', 'A.realm(winL).overlord!==loseL&&A.aiExact(winL,loseL)&&(lr.overlord=winL,'],
      ['rel<10&&(A.AGGRO[o.id]||1)>=1&&!r.overlord', 'rel<10&&A.aiGreedW(o.id)>=1&&!r.overlord'],
      ['A.clamp(.05+(ratio-2)/4+A.relBetween(t.id,r.id)/300,.02,.9)', 'A.clamp(.05+(ratio-2)/4+A.relBetween(t.id,r.id)/300+A.aiSubmitAdj(t.id),.02,.9)'],
      ['A.chance(.25)&&A.declareWar(t.id,r.id,{cb:"insult"})', 'A.chance(A.clamp(.25*A.aiSpite(t.id),.05,.7))&&A.declareWar(t.id,r.id,{cb:"insult"})'],
    ],
  },
  {
    id: 'AIP-DRIFT',
    blob: 'ardan-core',
    why: 'A.politicsYear: yearly relation drift comes from A.aiPullSum, which holds the same seven terms as before plus the ruler\'s character, so the diplomacy card can show exactly what pulls opinion each year.',
    edits: [
      ['let d=0;r.allies.includes(o.id)&&(d+=1),A.hasTrade(r.id,o.id)&&(d+=1),r.faith&&o.faith&&r.faith===o.faith&&(d+=.4),A.claimsOn(r.id,o.id).length&&(d-=1.5),A.claimsOn(o.id,r.id).length&&(d-=1),o.infamy>25&&A.neighbors(r.id).includes(o.id)&&(d-=o.infamy/30),r.overlord===o.id&&(d-=.8),', 'let d=A.aiPullSum(r.id,o.id);'],
    ],
  },
  {
    id: 'AIP-DIPL-UI',
    blob: 'ardan-core',
    why: 'UI.diplCard: the fictional "Slowly pulling them" list (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the ruler\'s traits and what they do; every offer shows its top 3 reasons. The peace screen explains their willingness.',
    edits: [
      ['stand=A.realmStanding(o.id,r.id)', 'stand=A.aiPullParts(o.id,r.id,!0)'],
      ['Slowly pulling them: ', 'Pulling them each year: '],
      ['<details class="dipl-why">', '${UI.aiTemper(o,r)}<details class="dipl-why">'],
      ['<div class="tiny muted">${UI.esc(dis||x.desc)}</div></div>', '<div class="tiny muted">${UI.esc(dis||x.desc)}</div>${x.chance!=null&&!dis?UI.aiOfferWhy(x,r,o):""}</div>'],
      ['Their willingness: <b>${Math.round(T.will)}</b></div>', 'Their willingness: <b>${Math.round(T.will)}</b>${UI.aiWillWhy(T)}</div>'],
    ],
  },
];
