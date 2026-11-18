// Retired by W1-6 (D-102): A.startWar's two ally rolls (src/core/release/core/03-engine-base.js) as they were at 67bca05.
// Dead code: the branch ran only for a war with allies when A.callToArms was missing, and A.callToArms is always on the
// page (12-nobility-and-politics.js); W1-3 found it (H-075). Allies answer through A.callToArms -> callToArmsNow
// (20-ai-personality's A.aiAnswerCall). Never built.
  if (!opts.noAllies) {
    for (const al of A.realm(def).allies)
      if (
        A.realm(al) &&
        A.realm(al).alive &&
        !w.att.includes(al) &&
        !w.def.includes(al) &&
        A.relBetween(al, def) > 35 &&
        A.chance(0.55)
      )
        w.def.push(al);
    for (const al of A.realm(att).allies)
      if (
        A.realm(al) &&
        A.realm(al).alive &&
        !w.att.includes(al) &&
        !w.def.includes(al) &&
        A.relBetween(al, att) > 50 &&
        A.chance(0.3)
      )
        w.att.push(al);
  }
