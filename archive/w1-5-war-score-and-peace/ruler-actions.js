// Retired by W1-5 (D-091, D-095), as they stood at 84b7f92: the ruler's 'Offer peace' (a roll against the score), the
// council's counsel of peace (settled by the score), the advisor's goals read from the score.

// ---- src/core/release/core/11-armies-divisions-and-council-b.js lines 157-185
      return A.diplDo("war", arg);
    case "peace": {
      const w = A.S.wars.find(x => x.id === arg);
      if (!w)
        return {
          ok: false,
        };
      const side = A.warSide(w, r.id),
        myScore = side === "att" ? w.score : -w.score;
      if ((side === "att" ? w.leadA : w.leadD) !== r.id)
        return {
          ok: false,
          msg: "Only the war leader can make peace.",
        };
      const er = A.realm(side === "att" ? w.leadD : w.leadA);
      mark();
      return myScore > 20 || (er && er.exhaustion > 50) || A.chance(0.25 + myScore / 150)
        ? (myScore >= 25
            ? A.settleWar(w, side)
            : myScore <= -40
              ? A.settleWar(w, side === "att" ? "def" : "att")
              : A.settleWar(w, "white"),
          {
            ok: true,
          })
        : (A.log(`${er ? er.short : "The enemy"} refuse your terms.`, "bad"),
          {
            ok: true,
          });

// ---- src/core/release/core/17-careers-and-event-engine-a.js lines 976-984
    const w = A.S.wars.find(
      x => (x.att.includes(r.id) && x.def.includes(t.id)) || (x.def.includes(r.id) && x.att.includes(t.id)),
    );
    if (w) {
      const side = A.warSide(w, r.id),
        my = side === "att" ? w.score : -w.score;
      A.settleWar(w, my >= 25 ? side : my <= -40 ? (side === "att" ? "def" : "att") : "white");
      A.log("On your counsel the crown makes peace.", "peace");
    }

// ---- src/core/release/core/15-specialisms-and-promotion.js lines 1298-1310
    for (const w of A.atWar(r.id))
      if (w.leadA === r.id || w.leadD === r.id) {
        const sc = A.warSide(w, r.id) === "att" ? w.score : -w.score;
        if (sc >= 25) {
          add(80, "Dictate the peace", `You are winning ${w.name} (+${sc}).`, "war", ["tab", "war"], "good");
          break;
        }
        if (sc <= -40) {
          add(82, "Sue for peace", `You are losing ${w.name} (${sc}).`, "war", ["tab", "war"], "bad");
          break;
        }
      }
    if ((r.infamy || 0) >= 35)
