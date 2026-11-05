// 99997-v2-war: the fight you are asked into waits for your answer.
export default [
  {
    id: 'V2W-HOLD-FIRST-DAY',
    blob: 'ardan-core',
    why: 'A.fightDay asks the player to take part (A.wsPCFightStart) on a fight\'s first day and then fights that day at once, so most ' +
      'small fights were over before the answer: "Take your place in the line" went straight to "After X" with nothing to play (playtest 2, ' +
      'new 6; 13 of 24 asks in a probe). When the ask was made, the fight now skips its first day\'s fighting (F.v2hold, set by ' +
      'b-battle.core.js after the ask): the player\'s scene is the first day, and the map fights it from the next tick, which counts as ' +
      'its first day again (F.days back to 0; F.v2asked keeps the ask from being made twice). In the source: return after the ask ' +
      'when the player was asked, and fight from the next tick.',
    edits: [
      ['F.days===1&&A.wsPCFightStart&&A.wsPCFightStart(F,att,def);const T=A.tacDay(', 'F.days===1&&!F.v2asked&&A.wsPCFightStart&&A.wsPCFightStart(F,att,def);if(F.v2hold){delete F.v2hold;F.days=0;F.v2asked=1;return}const T=A.tacDay('],
    ],
  },
  {
    id: 'V2W-RANK-WORDS',
    blob: 'ardan-core',
    why: 'Rank words that contradict (playtest 2, new 16). The chain of command said "Commander · leads 3,200" (GD.MIL\'s number) under ' +
      '"2nd Aldmark Line 7,530 · Commander … you": the release makes a Commander his division\'s commander (d.cmd), so he leads all of ' +
      'it; A.V2W.leads gives the division\'s men then, else the rank\'s number. The arm-of-service card said "You are a sergeant now" to ' +
      'anyone who reached rank 2 without an arm, a noble who enlisted as a Squad Captain included; it now names the rank he holds. In ' +
      'the source: read the division\'s men for its commander, and the rank title in the card.',
    edits: [
      ['GD.MIL[m.rank].title+" · leads "+A.fmt(GD.MIL[m.rank].leads)', 'GD.MIL[m.rank].title+" · leads "+A.fmt(A.V2W&&A.V2W.leads?A.V2W.leads(pc):GD.MIL[m.rank].leads)'],
      ['text:ch.tier==="arm"?"You are a sergeant now, and', 'text:ch.tier==="arm"?"You are "+(t=>(/^[AEIOU]/.test(t)?"an ":"a ")+t.toLowerCase())(GD.MIL[pc.mil.rank].title)+" now, and'],
    ],
  },
];
