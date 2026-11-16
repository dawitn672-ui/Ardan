// v2 stats: faith is taken up, never handed out (V2_SPEC complaint 7). Offered to a player outside the clergy who has
// not taken it up; likelier once their deeds have pulled them toward it (A.V2S.pull).
A.defEvents([
  {
    id: "v2s_seek_faith",
    title: "A preacher in the square",
    cond: (p, C) => C.age(p) >= 13 && !C.prison(p) && !A.V2S.hasFaith(p) && (A.V2S.pull(p) >= 4 || C.age(p) >= 30),
    w: 0.6, cool: 9,
    text: "A wandering preacher stands on the well steps at {home} and speaks of {faith}. He is barefoot and hoarse. A few people stop to listen. Most carry their baskets past him.",
    choices: [
      {
        t: "Listen, and take the faith to heart",
        r: "You stay until he is done, and you go to the shrine that evening. The prayers come back to you, and this time you mean them.",
        fx: (p) => { A.V2S.takeFaith(p); p.happy = Math.min(100, (p.happy || 0) + 2); return ""; },
      },
      {
        t: "Walk on with the others",
        r: "Your business is with this world. By the time you reach the market you have forgotten his face.",
        fx: (p) => { if (p.v2) p.v2.pull = 0; return ""; },
      },
    ],
  },
]);
