A.LEVY = [
  ["Light levies", 0.75, 1, "Fewer men called up. The lords like you for it."],
  ["Customary levies", 1, 0, "What the old charters allow."],
  ["Heavy levies", 1.3, -2, "Every hall sends more spears. The lords grumble every year."],
];
  if (k === "levy") {
    const cur = r.laws.levy;
    return v === cur || v < 0 || v > 2
      ? {
          ok: false,
        }
      : ((r.levy = Math.round((r.levy * A.LEVY[v][1]) / A.LEVY[cur][1])),
        (r.laws.levy = v),
        (A.S.yearActs["law_" + k] = 1),
        A.log(`New levy law: ${A.LEVY[v][0]}. The muster rolls now count ${A.fmt(r.levy)}.`),
        {
          ok: true,
        });
