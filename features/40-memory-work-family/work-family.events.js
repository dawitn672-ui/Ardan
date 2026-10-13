// Memory callbacks for the work and family packs (chunk "work-family").
//
// The release sets 31 flags in its work (wk_), family (fm_), war-and-crime (wr_) and court (ct_) events that no
// event ever reads. Each event here reads one of them years later, recalls the original moment concretely, and
// poses a new decision. Eleven of them set a mwf_ flag that a second event reads years after that (2-step arcs).
// README.md has the flag -> event table. Every cond reads its flag with C.flag(p, "x") and times it with
// A.S.year - p.flags.x, so the bench's memory index sees the link.
(function () {
  const C = A.C;

  // ---------- helpers
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const word = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));
  const since = (p, f) => A.S.year - p.flags[f];                  // flags hold the year they were set
  const yrs = (p, ctx, f) => { ctx.yrs = word(since(p, f)); };
  const T = ctx => (ctx && ctx.pid ? A.P(ctx.pid) : null);
  const live = (p, types) => A.relsOf(p, types).filter(x => x.p && x.p.alive);
  const spouseOf = p => { const s = p && p.spouse ? A.P(p.spouse) : null; return s && s.alive ? s : null; };
  const hp = (p, v) => { p.happy = A.clamp(p.happy + v, 0, 100); };
  const hon = (p, v) => { p.honor = A.clamp(p.honor + v, 0, 100); };
  const apply = (p, ctx, o) => A.applyFx(p, o, ctx) || "";
  const join = (...a) => a.filter(s => typeof s === "string" && s).join(" ");
  const rung = p => (p.noble ? p.noble.rung : p.status === "royal" || p.status === "noble" ? 4 : p.status === "gentry" ? 1 : 0);
  const cost = (p, b) => Math.round(b * [1, 1, 1.5, 2.5, 6, 10, 18, 28, 45][Math.min(8, Math.max(0, rung(p)))]);
  const realmShort = p => { const r = A.realm(p.noble && p.noble.realm ? p.noble.realm : p.realm); return r ? r.short : "the realm"; };
  const loveSex = p => p.flags.likes || (p.sex === "M" ? "F" : "M");
  const byRole = (p, role) => { const x = A.relsOf(p).find(r => r.p.flags && r.p.flags.mwf_role === role); return x ? x.p : null; };
  const KIN = ["mother", "father", "sibling", "child", "spouse", "grandparent", "grandchild", "cousin", "uncle", "nephew", "inlaw"];
  // set how the player stands with t; kin keep their kinship and only the opinion moves
  const link = (p, t, type, op) => {
    if (!t) return;
    const r = p.rel[t.id];
    if (!r) { A.link(p, t, type, op, type); return; }
    A.addOp(p, t, op);
    if (!KIN.includes(r.type)) { r.type = type; if (t.rel[p.id] && !KIN.includes(t.rel[p.id].type)) t.rel[p.id].type = type; }
  };

  // a person of a chosen race, sex, age and station, living where the player lives
  const mk = (p, o = {}) => {
    const race = o.race || p.race, R2 = GD.RACES[race] || GD.RACES.human, sex = o.sex || (A.chance(0.5) ? "M" : "F");
    const cult = race === p.race ? p.cult : A.cultureFor(race, p.realm) || p.cult;
    const faith = race === p.race ? p.faith : A.faithFor(race, p.realm) || p.faith;
    const adj = o.ageAdj != null ? o.ageAdj : C.ageAdj(p) + A.ri(-4, 4);
    const status = o.status || (p.status === "royal" ? "noble" : p.status);
    const x = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm: p.realm, cult, faith,
      born: A.S.year - Math.max(1, Math.round(adj * R2.adult / 16)), status, home: p.home });
    const fn = A.familyName({ cult, realm: p.realm, status, home: p.home, sex });
    x.sur = fn.sur; x.surMode = fn.mode;
    x.occ = o.occ || (A.isAdult(x) ? A.pick(A.OCC[status] || A.OCC.peasant) : "a child of " + A.provName(p.home));
    if (o.role) x.flags.mwf_role = o.role;
    return x;
  };
  const gender = (ctx, x) => { const m = x && x.sex === "M"; ctx.bg = m ? "boy" : "girl"; ctx.sd = m ? "son" : "daughter"; ctx.hw = m ? "husband" : "wife"; };

  const wed = (p, t) => {
    if (!t || !t.alive || spouseOf(p) || spouseOf(t)) return "";
    A.marry(p, t);
    return `You and ${t.given} are married ${A.weddingRite(p)}.`;
  };
  const marryOff = (t, name) => {   // the person the player lost marries someone else
    if (!t || !t.alive || spouseOf(t)) return;
    const sx = t.sex === "M" ? "F" : "M";
    const s = A.newPerson({ given: name || A.givenName(t.cult, sx), sex: sx, race: t.race, realm: t.realm, cult: t.cult, faith: t.faith,
      born: t.born + A.ri(-5, 5), status: t.status, home: t.home });
    s.sur = t.sur; s.surMode = t.surMode;
    t.spouse = s.id; s.spouse = t.id;
    A.link(t, s, "spouse", 45, "spouse");
  };
  const noDivorce = p => ["REL-01", "REL-02"].includes(p.faith);
  const divorce = p => {
    const s = spouseOf(p); if (!s) return;
    p.spouse = null; s.spouse = null;
    if (p.rel[s.id]) p.rel[s.id].type = "ex";
    if (s.rel[p.id]) s.rel[p.id].type = "ex";
    A.addOp(p, s, -40);
    (p.exSpouses = p.exSpouses || []).push(s.id);
  };
  // leave the spouse for t: a divorce and a wedding where the faith allows it, a separation where it does not
  const leaveFor = (p, t) => {
    const s = spouseOf(p);
    if (s && noDivorce(p)) {
      A.addOp(p, s, -40);
      return `The priests will not unmake a marriage. You leave ${s.given}'s house anyway and live with ${t ? t.given : "your lover"}, married in everything but law.`;
    }
    divorce(p);
    return wed(p, t) || "The marriage is undone. The new one never quite happens.";
  };
  const addChild = (p, x, op) => {
    if (!x) return;
    x.sur = p.sur || x.sur;
    if (!p.children.includes(x.id)) p.children.push(x.id);
    A.link(p, x, "child", op, p.sex === "M" ? "father" : "mother");
    const s = spouseOf(p);
    if (s) { if (!s.children.includes(x.id)) s.children.push(x.id); A.link(s, x, "child", op - 10, s.sex === "M" ? "father" : "mother"); }
  };
  const setFree = p => {
    delete p.flags.unfree;
    if (p.status === "slave" || p.status === "serf") p.status = "peasant";
    A.ach("freed"); A.willGrow(p, 2.5, "freedom"); hp(p, 20);
    return "(You are free.)";
  };
  const runaway = p => {     // free on the road, a runaway in law: the release's outlaw events pick it up
    delete p.flags.unfree;
    if (p.status === "slave" || p.status === "serf") p.status = "peasant";
    if (p.job && p.job.c === "servant") p.job = null;
    p.flags.outlaw = A.S.year;
  };
  const moveHome = p => {
    const opts = A.S.prov.filter(x => x.owner === p.realm && x.id !== p.home);
    if (!opts.length) return "";
    const to = A.pick(opts); p.home = to.id;
    return `You settle in ${to.name}.`;
  };
  const kill = (ctx, cause) => { const t = T(ctx); if (t && t.alive) A.kill(t, cause); };
  // a rival or enemy who is a particular someone in the story (the colonel, the heir), not a random stranger
  const mkFoe = (p, type, op, occ, o = {}) => {
    const t = o.who || mk(p, { occ, sex: o.sex, status: o.status, ageAdj: C.ageAdj(p) + A.ri(-6, 10) });
    link(p, t, type, op);
    return `(${t.given}, ${occ}, is your ${type} now)`;
  };
  const heirOf = p => { const l = live(p, ["sibling"]).map(x => x.p).filter(x => A.isAdult(x)); return l.length ? l[0] : null; };

  // the people the original events linked
  const pilotOf = p => { const x = A.relsOf(p).find(r => r.p.occ === "an old pilot"); return x ? x.p : null; };
  const waitedLover = p => {   // the lover who asked on the bridge: unmarried, a lover since before the flag
    const l = live(p, ["lover"]).filter(x => !spouseOf(x.p) && (x.r.since == null || x.r.since <= p.flags.fm_asked_wait));
    return l.length ? l[0].p : null;
  };
  const lostLover = p => {     // the same person, now gone cold or an ex, still unmarried
    const l = live(p, ["lover", "ex"]).filter(x => !spouseOf(x.p) && x.r.since != null && x.r.since <= p.flags.fm_asked_wait && x.r.op < 40);
    return l.length ? l[0].p : null;
  };
  const marriedLover = p => { const l = live(p, ["lover"]).filter(x => spouseOf(x.p)); return l.length ? l[0].p : null; };
  const affairLover = p => {
    const l = live(p, ["lover"]);
    const exact = l.find(x => x.r.since === p.flags.fm_affair);
    return exact ? exact.p : l.length ? l[0].p : null;
  };
  const deadFriend = p => {
    const l = A.relsOf(p, ["friend", "bestfriend"]).filter(x => x.p && !x.p.alive);
    return (l.find(x => x.p.died === p.flags.fm_promise) || l[0] || {}).p || null;
  };
  const shrineChild = p => {
    const l = (p.children || []).map(A.P).filter(c => c && c.alive && c.born >= p.flags.tryChild);
    return l.length ? l[0] : null;
  };
  const lifeMate = (p, inSquad) => {   // the comrade who hauled you out of the ford: the closest one who was there then
    const ids = inSquad ? A.squad(p).map(x => x.id) : null;
    const l = live(p, ["comrade", "friend", "bestfriend"])
      .filter(x => (x.r.since == null || x.r.since <= p.flags.wr_lifedebt) && (!ids || ids.includes(x.p.id)) && A.isAdult(x.p))
      .sort((a, b) => b.r.op - a.r.op);
    return l.length ? l[0].p : null;
  };
  const factionFoe = p => {
    const l = live(p, ["rival", "enemy"]).filter(x => x.r.since === p.flags.ct_faction);
    return l.length ? l[0].p : null;
  };
  const rivalHouse = p => {
    const l = Object.values(A.S.houses || {}).filter(h => h.realm === p.realm && h.kind !== "royal" && !h.extinct && h.id !== p.house);
    return l.length ? A.pick(l) : null;
  };

  A.defEvents([
    // ===================== wk_favored: a house slave warned the mistress and won white bread
    {
      id: "mwf_favored_widow",
      title: "Room for one more",
      cond: (p, C) => C.adult(p) && C.unfree(p) && p.flags.unfree === "slave" && C.flag(p, "wk_favored") && A.S.year - p.flags.wk_favored >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { const t = mk(p, { sex: "F", ageAdj: C.ageAdj(p) + A.ri(3, 12), status: "merchant", occ: "a widow of good family", role: "mistress" }); ctx.pid = t.id; },
      text: "Since the night you warned your mistress, between the second jug and the third, your bread has been white. Now her husband is dead of a quinsy and his brother holds the keys. Tomorrow {them} goes back to her father's house with one chest and two maids. There is room in the cart for one more.",
      choices: [
        { t: "Ask her to write your freedom into her will", check: { s: "diplomacy", s2: "int", d: 48 },
          win: { r: "She calls the clerk before the cart is loaded. One line: at her death, you go free. She is {themAge} and in good health. You ride on the tailboard.", fx: { them: { type: "acquaint", op: 25 }, happy: 3, flag: "mwf_fav_will" } },
          lose: { r: "\"You were useful,\" she says. \"Not family.\" The cart leaves without you, and the brother's steward has noticed how soft your hands are.", fx: { them: { type: "acquaint", op: -10 }, happy: -6, wil: 1, unflag: "wk_favored" } } },
        { t: "Tell the brother what she hid from him",
          r: "He listens, pays nothing, and keeps you in the kitchen near the fire. {them} leaves at dawn knowing exactly who talked.",
          fx: { them: { type: "enemy", op: -40 }, honor: -6, happy: 2, trait: "deceitful" } },
        { t: "Let her go, and keep your head down",
          r: "The white bread goes with her. The brother does not know your name yet. In this house that is a kind of safety.",
          fx: { them: { type: "acquaint", op: 5 }, happy: -4, wil: 0.8 } },
      ],
    },
    {
      id: "mwf_favored_will",
      title: "One line in a will",
      cond: (p, C) => C.adult(p) && C.unfree(p) && C.flag(p, "mwf_fav_will") && A.S.year - p.flags.mwf_fav_will >= 4 && !!byRole(p, "mistress"),
      w: 3, once: true,
      setup: (p, ctx) => { const t = byRole(p, "mistress"); if (!t) { ctx.skip = 1; return; } ctx.pid = t.id; },
      text: "Word comes from her father's house: {them} is dead of a winter fever. Her will is read in the hall, and your name is in it, one line in the clerk's hand. The steward reads it twice. \"A woman's whim,\" he says. \"A slave belongs to the estate, not to her.\"",
      choices: [
        { t: "Take the will to the magistrate", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "The magistrate reads the line, then the date, then the seal. \"Free,\" he says, bored, and calls the next case.", fx: (p, ctx) => { kill(ctx, "a winter fever"); return setFree(p); } },
          lose: { r: "The magistrate reads the steward's purse more closely than the will. You are sent back with ten strokes for insolence.", fx: (p, ctx) => { kill(ctx, "a winter fever"); return apply(p, ctx, { health: -12, cause: "a flogging", wil: 1.5, happy: -8 }); } } },
        { t: "Take the steward's ten suns to forget it",
          r: "Ten suns go under the floor stone with the rest. The will goes into the steward's fire.",
          fx: (p, ctx) => { kill(ctx, "a winter fever"); return apply(p, ctx, { coin: 10, happy: -6, honor: -2 }); } },
        { t: "Walk out of the gate tonight, the will in your shirt",
          r: "You walk until the dogs stop barking. The will says free. The law says runaway. On the road, both are true.",
          fx: (p, ctx) => { kill(ctx, "a winter fever"); runaway(p); return apply(p, ctx, { wil: 2, happy: 6 }); } },
      ],
    },

    // ===================== wk_price75: the master named 75 suns before witnesses
    {
      id: "mwf_price_word",
      title: "Seventy-five, before witnesses",
      cond: (p, C) => C.adult(p) && C.unfree(p) && p.flags.unfree === "slave" && C.flag(p, "wk_price75") && A.S.year - p.flags.wk_price75 >= 2 && p.coin >= 75,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "wk_price75"),
      text: "{yrs} years ago your master let you haggle him down to 75 suns, in front of the cook and a carter. Now you have the 75, counted twice and knotted in a rag. You set it on his table. He does not touch it. \"Prices rise,\" he says. \"Bread, salt, slaves. A hundred and twenty.\"",
      choices: [
        { t: "Call the cook and the carter to say what they heard", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The carter says it plainly, loud enough for the neighbors. The cook nods. Your master sweeps the rag off the table without looking at you.", fx: p => { p.coin -= 75; return setFree(p); } },
          lose: { r: "The cook studies her hands. The carter remembers nothing. Your master keeps five suns of the rag \"for the trouble\".", fx: { coin: -5, happy: -8, wil: 1.5, trait: "cynical" } } },
        { t: "Pay the hundred and twenty", req: p => p.coin >= 120,
          r: "You count it out to the last copper. It is robbery, and it is also the gate.",
          fx: p => { p.coin -= 120; return setFree(p); } },
        { t: "Take the rag back. He is old; wait for his heir",
          r: "He coughs at night and climbs the stairs one at a time. You can wait. You have had the practice.",
          fx: { wil: 1, flag: "mwf_price_wait" } },
      ],
    },
    {
      id: "mwf_price_heir",
      title: "The son's ledger",
      cond: (p, C) => C.adult(p) && C.unfree(p) && C.flag(p, "mwf_price_wait") && A.S.year - p.flags.mwf_price_wait >= 3,
      w: 3, once: true,
      text: "Your old master is buried, and his son has the house and the ledger. He sends for you. On a page from years back, in his father's cramped hand: \"{name}. Seventy-five. Agreed before witnesses.\" The son taps it. \"My father kept his word on paper, if nowhere else. And I need a steward more than I need seventy-five suns.\"",
      choices: [
        { t: "Pay the seventy-five and go", req: p => p.coin >= 75,
          r: "He writes \"paid\" under his father's line and blots it. You walk out with the page folded in your shirt.",
          fx: p => { p.coin -= 75; return setFree(p); } },
        { t: "Serve him three years as steward, then go free",
          r: "Three more years, with keys this time and a room of your own. He writes the day of your freedom under his father's line.",
          fx: p => { A.schedule({ type: "event", ev: "mwf_price_free", ctx: {} }, 365 * 3); return apply(p, null, { skill: { stewardship: 4 }, happy: 4, flag: "mwf_price_steward" }); } },
        { t: "Demand it for nothing: years of work paid the price", check: { s: "persuasion", s2: "learning", d: 58 },
          win: { r: "He laughs, then stops laughing, then tears out the page and hands it to you. \"My father would hate this,\" he says. That seems to settle it.", fx: p => join(setFree(p), apply(p, null, { fame: 1 })) },
          lose: { r: "He is not his father's son in everything. By the next market you are sold south to the salt pans.", fx: { job: "labor", happy: -12, health: -8, cause: "the salt pans", wil: 2 } } },
      ],
    },
    {
      id: "mwf_price_free",
      trigger: true,
      title: "The day under the line",
      cond: (p, C) => C.unfree(p) && C.flag(p, "mwf_price_steward"),
      text: "Three years to the day. The son opens the ledger at his father's page, where his own hand wrote the date under the old line, and turns it round for you to read. \"Free,\" he says. \"Unless you want wages.\"",
      choices: [
        { t: "Take your page and go", r: "You go out of the gate with your page and a bundle. The road is dry.", fx: p => setFree(p) },
        { t: "Stay on as his steward, for wages",
          r: "Same keys, same room, and a purse on quarter day. It is strange how different the keys feel.",
          fx: p => join(setFree(p), apply(p, null, { job: "servant", coin: 10 })) },
      ],
    },

    // ===================== wk_good_horse: a sound dun colt from the Nine Winds horse fair
    {
      id: "mwf_dun_offer",
      title: "The dun is grown",
      cond: (p, C) => C.adult(p) && !p.flags.unfree && C.flag(p, "wk_good_horse") && A.S.year - p.flags.wk_good_horse >= 3,
      w: 3, once: true,
      text: "The dun colt you bought at the horse fair, \"steppe price, for a friend\", is a horse now: long stride, deep chest, hard black hooves. A lord's master of horse has watched him for three days. Today he sits on your fence and counts out two hundred suns, one stack at a time, without being asked.",
      choices: [
        { t: "Take the two hundred suns",
          r: "He leads the dun away on a silk halter. You do not watch them reach the road. Two hundred suns is a farm, or most of one.",
          fx: { coin: 200, happy: -3 } },
        { t: "Keep him, and put him to the mares",
          r: "You send the master of horse away with his stacks. The dun covers six mares in the spring. Now you wait for foals.",
          fx: { skill: { husbandry: 3 }, happy: 2, flag: "mwf_dun_stud" } },
        { t: "Race him at the summer fair first", check: { s: "riding", s2: "spd", d: 55 },
          win: { r: "The dun beats the Wind Riders' best by a length. Sixty suns, and the master of horse doubles his offer. You keep the horse for the mares.", fx: { coin: 60, fame: 3, skill: { riding: 3 }, flag: "mwf_dun_stud" } },
          lose: { r: "He stumbles at the turn and you go over his head. The dun walks sound again by autumn, but he will never race, and the buyer is gone.", fx: { health: -8, cause: "a fall at the races", happy: -6, skill: { riding: 1 } } } },
      ],
    },
    {
      id: "mwf_dun_get",
      title: "The dun's get",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_dun_stud") && A.S.year - p.flags.mwf_dun_stud >= 4,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "mwf_dun_stud"),
      text: "{yrs} springs of foals by the dun. They have his chest and his hard black hooves, and the dealers have started calling them \"{name}'s duns\". Now a remount officer of the crown rides in with a writ: twenty horses a year for the army, at a price the crown sets, which is to say low.",
      choices: [
        { t: "Sign the writ. The crown always pays, eventually",
          r: "Twenty duns a year go east with the remount column. The money is thin and certain. The officer shakes your hand like a man shutting a gate.",
          fx: { coin: 60, favor: 8, deed: "Bred remounts for the crown" } },
        { t: "Refuse, and sell at the fair to the highest bidder", check: { s: "trade", s2: "husbandry", d: 50 },
          win: { r: "Wind Riders, a Morhaven factor and a bishop's groom bid against each other. You clear 150 suns. The officer writes your name in a small book.", fx: { coin: 150, fame: 2, favor: -6 } },
          lose: { r: "The officer has a word with the fair warden. Your pens are fined and moved behind the tannery. Buyers do not linger downwind of a tannery.", fx: { coin: 20, favor: -6, happy: -4 } } },
        { t: "Keep the best colt back, and ride him yourself",
          r: "You keep a dun colt with one white sock and break him to the saddle yourself. You know horses now the way some people know scripture.",
          fx: { trait: "horsewise", skill: { riding: 4, husbandry: 2 }, happy: 4 } },
      ],
    },

    // ===================== wk_commons: marched with Mora Purplehand on the Exchange Hall (Sabena)
    {
      id: "mwf_commons_again",
      title: "The Commons march again",
      cond: (p, C) => C.adult(p) && C.realm(p, "POL-16") && !C.unfree(p) && C.flag(p, "wk_commons") && A.S.year - p.flags.wk_commons >= 2,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "wk_commons"),
      text: "{yrs} Junes since you shouted yourself hoarse on Ledger Street. The council promised cheaper bread. The bread is not cheaper. Mora Purplehand is marching the Commons on the Exchange Hall again, and her dyers come to your door with purple hands. She wants the ones who marched before in the front rank, where the Purple Company's staves fall first.",
      choices: [
        { t: "Take your place in the front rank", check: { s: "sta", s2: "wil", d: 52 },
          win: { r: "The staves come down and the front rank holds. Gerolt Marr calls his men off before the Exchange steps run red. Purplehand learns your name.", fx: { fame: 3, honor: 3, wil: 1, flag: "mwf_commons_front" } },
          lose: { r: "A stave breaks your nose on the Exchange steps. You wake in the cells with a dyer's head in your lap.", fx: { health: -12, cause: "a stave", wound: "broken_nose", prison: 1, why: "rioting at the Purple Fair" } } },
        { t: "Give the burial club coin, not your skull (10 suns)", req: p => p.coin >= 10,
          r: "The dyers' burial club bought coffins before it bought cudgels. Your ten suns buy a few of each.",
          fx: { coin: -10, honor: 1 } },
        { t: "Sell the march route to Gerolt Marr's men",
          r: "Twenty-five suns from a Purple Company sergeant. The march turns into a street already closed with carts. The dyers are asking who told.",
          fx: { coin: 25, honor: -12, trait: "deceitful" } },
      ],
    },
    {
      id: "mwf_commons_seat",
      title: "Wool among the silk",
      cond: (p, C) => C.adult(p) && C.realm(p, "POL-16") && C.flag(p, "mwf_commons_front") && A.S.year - p.flags.mwf_commons_front >= 3,
      w: 3, once: true,
      text: "To stop the marching, the Twelve give the Commons one seat on the Exchange bench. Mora Purplehand will not take it. \"A seat is a leash with a cushion,\" she says. She names you instead: you held the front rank when the staves came down. The other benches are silk. Yours would be wool.",
      choices: [
        { t: "Take the seat",
          r: "The Twelve talk over you for a year, then start counting your vote. The dockers buy you drinks. Some of the dyers no longer do.",
          fx: { fame: 4, honor: 2, skill: { diplomacy: 3 }, deed: "Sat for the Commons on the Exchange bench" } },
        { t: "Refuse it, standing beside Purplehand",
          r: "The seat goes to a guildmaster's nephew. Purplehand claps you on the back hard enough to bruise.",
          fx: { honor: 4, fame: 1, wil: 1 } },
        { t: "Take it, and let the Twelve buy your vote",
          r: "The Twelve pay in silver and in dinners. You vote as you are told on bread. Purplehand stops saying your name.",
          fx: { coin: 60, honor: -10, trait: "greedy", deed: "Sat for the Commons, and sold the seat" } },
      ],
    },

    // ===================== wk_wheel: built the Palella spinning wheel from a drunk journeyman's drawing
    {
      id: "mwf_wheel_spinners",
      title: "Six aprons at the door",
      cond: (p, C) => C.adult(p) && !C.realm(p, "POL-03") && C.flag(p, "wk_wheel") && A.S.year - p.flags.wk_wheel >= 2,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "wk_wheel"),
      text: "For {yrs} years the wheel you built from a drunk journeyman's drawing has hummed in your back room. Your thread is the finest in {home}, and the other spinners know why. This morning six of them come to your door together, aprons on, arms folded. \"Show us, or sell to us,\" says the eldest. \"Or we tell the guild where it came from.\"",
      choices: [
        { t: "Show them every peg and spindle",
          r: "By midsummer six wheels hum in {home}. Your thread is ordinary now, and your neighbors are a little less poor. They bring you eggs.",
          fx: { honor: 5, fame: 2, perf: -8, flag: "mwf_wheel_taught" } },
        { t: "Build them wheels, at your price",
          r: "Thirty suns of wheels by autumn. They pay, and they mutter about the price, and they spin.",
          fx: { coin: 30, honor: -2, flag: "mwf_wheel_taught" } },
        { t: "Shut the door. Let them tell the guild",
          r: "They tell. The weavers' guild fines you for a foreign engine, then quietly orders three. One of the six spits when you pass.",
          fx: p => join(apply(p, null, { coin: -10, perf: 6 }), mkFoe(p, "rival", -30, "a spinner of " + A.provName(p.home), { sex: "F" })) },
      ],
    },
    {
      id: "mwf_wheel_blue",
      title: "A man in Palella blue",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_wheel_taught") && A.S.year - p.flags.mwf_wheel_taught >= 3,
      w: 3, once: true,
      text: "Wheels hum in half the cottages of {home} now, and thread is cheap. A man in a Palella-blue coat has been asking at the fulling mill who built the first one. The Varennan guild pays for the names of those who steal its secret. It is said to pay better for their hands.",
      choices: [
        { t: "Blame the drunk journeyman, long gone", check: { s: "deception", s2: "int", d: 50 },
          win: { r: "You give him a name, a face and a far town. He writes it all down and rides off pleased.", fx: { skill: { deception: 3 } } },
          lose: { r: "He has already talked to the six spinners. His men catch you behind the fulling mill and take two fingers, neatly. They leave the rest.", fx: { wound: "lost_fingers", health: -10, cause: "the guild's knife", happy: -8 } } },
        { t: "Pay him to report that he found nothing (30 suns)", req: p => p.coin >= 30,
          r: "He counts it twice. \"There are no wheels in {home},\" he says, \"and I was never here.\"",
          fx: { coin: -30 } },
        { t: "Turn out the spinners and walk him to the border", check: { s: "intimidation", s2: "command", d: 48 },
          win: { r: "Forty spinners with distaffs walk him to the ford. He crosses it at a run. In {home} they give you a name for it.", fx: { fame: 3, honor: 2, epithet: "the Spinner" } },
          lose: { r: "He has six hired men. The spinners scatter. You get a cut across the scalp and a guild fine of twenty suns.", fx: { health: -12, wound: "deep_cut", cause: "a guild bully's club", coin: -20 } } },
      ],
    },

    // ===================== wk_lodestone: swore the pilot's oath and learned the floating needle
    {
      id: "mwf_needle_fog",
      title: "Fog off a lee shore",
      cond: (p, C) => C.adult(p) && C.job(p, "sailor") && C.flag(p, "wk_lodestone") && A.S.year - p.flags.wk_lodestone >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { const t = pilotOf(p); if (t) ctx.pid = t.id; ctx.pilot = t ? t.given : "an old pilot with no son"; },
      text: "You swore the pilot's oath to {pilot} and learned the floating needle. Pilots keep it from crews. Now the ship is blind in fog off a lee shore, the master is roaring for soundings, and the needle is in your shirt. Float it on deck and every hand aboard will see.",
      choices: [
        { t: "Float the needle in a bowl on deck",
          r: "North swings up out of the fog. The master brings her round and the rocks pass to leeward. By dawn every ship's boy aboard has seen the trick.",
          fx: { fame: 3, perf: 10, honor: -4, them: { op: -40 }, flag: "mwf_needle_shown" } },
        { t: "Read it alone below, and call the course", check: { s: "sea", s2: "ins", d: 55 },
          win: { r: "You come up with a course and no explanation. The master takes it because nothing else is on offer. The rocks pass. He watches you sideways all the way to port.", fx: { perf: 12, skill: { sea: 3 } } },
          lose: { r: "The needle swings in the rolling dark and you call it wrong. She touches the reef and tears her forefoot open. A beam takes you in the side.", fx: { perf: -15, health: -12, wound: "broken_ribs", cause: "a ship striking a reef" } } },
        { t: "Keep the oath. Trust the lead line",
          r: "You heave the lead with the rest. She scrapes off a bar at dawn with the cargo wet and the master hoarse, and you are the only one who knows it need not have happened.",
          fx: { perf: -6, honor: 3, wil: 1, them: { op: 8 } } },
      ],
    },
    {
      id: "mwf_needle_guild",
      title: "Oathbreaker",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_needle_shown") && A.S.year - p.flags.mwf_needle_shown >= 3,
      w: 3, once: true,
      text: "Since the fog, half the ship's boys in port float needles in bowls and grin about it. The pilots have met in their chapel by the harbor and named you oathbreaker. Their reeve brings the judgment: sixty suns and an apology on the quay, or no pilot on this coast will ship with you again.",
      choices: [
        { t: "Pay, and say the words on the quay", req: p => p.coin >= 60,
          r: "You say it with the whole harbor watching. The pilots shake your hand one by one, coldly, and let you back aboard.",
          fx: { coin: -60, honor: 4, happy: -4 } },
        { t: "Refuse. The needle saves more men than it costs pilots", check: { s: "persuasion", s2: "sea", d: 55 },
          win: { r: "You count the wrecks of the last ten years aloud in their chapel. Two old pilots nod. The fine is dropped. The grudge is not.", fx: { fame: 3, skill: { persuasion: 3 }, trait: "stubborn" } },
          lose: { r: "They hear you out and vote you off the water. No master in port will sign you on.", fx: (p, ctx) => { p.job = null; return join(apply(p, ctx, { fame: 2, trait: "stubborn", happy: -8 }), "(You lose your place at sea.)"); } } },
        { t: "Teach the needle openly, to anyone who asks",
          r: "You set a bowl and a straw on a barrel on the quay. Ship's boys come every evening. The pilots never forgive it.",
          fx: p => join(apply(p, null, { fame: 4, honor: 2, perf: -20 }), mkFoe(p, "enemy", -40, "reeve of the pilots", { sex: "M" })) },
      ],
    },
    {
      id: "mwf_needle_heir",
      title: "No son either",
      cond: (p, C) => C.adult(p) && C.ageAdj(p) >= 45 && C.flag(p, "wk_lodestone") && A.S.year - p.flags.wk_lodestone >= 10,
      w: 2, once: true,
      setup: (p, ctx) => {
        const t = pilotOf(p); ctx.pilot = t ? t.given : "the old pilot";
        const kids = (p.children || []).map(A.P).filter(c => c && c.alive && C.ageAdj(c) >= 12);
        if (kids.length) { ctx.kid = kids[0].given; ctx.kidid = kids[0].id; }
      },
      text: "{pilot} gave you the floating needle because there was no son to give it to. Your hands ache in the cold now, and the needle sits in its box. Pilots pass it on or take it into the water with them. There is a ship's boy on the quay who watches the stars the way you used to.",
      choices: [
        { t: "Teach {kid}, your own child", req: (p, C, ctx) => !!ctx.kidid,
          r: "Winter evenings, a bowl of water and a straw on the kitchen table. {kid} learns it faster than you did.",
          fx: (p, ctx) => { const c = A.P(ctx.kidid); if (c) A.addOp(p, c, 15); p.deeds.push({ y: A.S.year, t: `Passed the pilot's needle to ${ctx.kid}` }); return ""; } },
        { t: "Swear the ship's boy to the oath",
          r: "You make him swear it on the box, as you swore it. He is clumsy with the straw and hungry for the rest.",
          fx: p => { const b = mk(p, { sex: "M", ageAdj: A.ri(13, 16), status: "peasant", occ: "a ship's boy" }); A.link(p, b, "student", 40, "mentor"); return `(${b.given} is your student now)`; } },
        { t: "Sell it to a merchant house for 120 suns",
          r: "A factor with ink on his cuffs pays 120 suns and takes the box. The oath goes with it, broken.",
          fx: { coin: 120, honor: -8 } },
        { t: "Take it into the water with you",
          r: "You keep the box under your bunk. When you go, it goes. That was the oath, and you kept it.",
          fx: { honor: 4, wil: 1, deed: "Kept the pilot's oath" } },
      ],
    },

    // ===================== wk_redsail: voted with Ima Redsail at Share Day; Nell Brine remembers faces
    {
      id: "mwf_redsail_names",
      title: "Brine remembers faces",
      cond: (p, C) => C.adult(p) && C.job(p, "pirate") && C.flag(p, "wk_redsail") && A.S.year - p.flags.wk_redsail >= 2,
      w: 3, once: true,
      text: "At Share Day you shouted for Ima Redsail and open raiding, and Nell Brine marked your face across the cave. Redsail lost the vote. Now her crews quietly hold back Lucerna's fifth of the dragon toll, and Brine's sworn men want the captains' names. Yours is a face they already know. Names, they say, and the old vote is forgotten.",
      choices: [
        { t: "Give Brine's men three names",
          r: "Three captains are marooned on a bare rock with a jug of water each. Brine sends you a cask of Varennan wine. Redsail sends nothing, yet.",
          fx: p => join(apply(p, null, { coin: 20, honor: -8, perf: 8 }), mkFoe(p, "enemy", -50, "a Redsail captain")) },
        { t: "Refuse, and sign on with Redsail's own ship",
          r: "You carry your sea-chest up a red-sailed gangplank in daylight, so everyone sees. Raiding pays better than tolls. It also hangs more men.",
          fx: { fame: 2, coin: 15, skill: { sea: 2 }, trait: "reckless", perf: 5 } },
        { t: "Leave Blackreef on the next honest hull",
          r: "The master of a Morhaven cog takes you on without asking where you learned to reef in a blow. Honest pay, and less blood.",
          fx: { job: "sailor", honor: 3 } },
      ],
    },

    {
      id: "mwf_redsail_page",
      title: "A page of the share-book",
      cond: (p, C) => C.adult(p) && !C.job(p, "pirate") && C.flag(p, "wk_redsail") && A.S.year - p.flags.wk_redsail >= 4,
      w: 2, once: true,
      text: "You shouted for Ima Redsail at Share Day, and you have since left Blackreef behind. Blackreef has not left you. A page of its share-book, every Share Day vote in a purser's hand, sits in a strongbox in Greyhaven, and the Varennan admiralty is bidding for it. A clerk who has read the page offers to cut your line out of it.",
      choices: [
        { t: "Pay the clerk to cut your line (40 suns)", req: p => p.coin >= 40,
          r: "He brings you the strip of paper with your name on it, and you burn it in front of him. He has a good memory, he says, but a poor one for sale.",
          fx: { coin: -40, trait: "paranoid" } },
        { t: "Go to the admiralty first and turn evidence", check: { s: "persuasion", s2: "intrigue", d: 55 },
          win: { r: "A Varennan lawyer writes down every captain you can name. You walk out with a pardon and twenty suns. Blackreef will hear of it.", fx: p => join(apply(p, null, { coin: 20, honor: -8, deed: "Turned evidence against Blackreef" }), mkFoe(p, "enemy", -50, "a captain of the Brotherhood")) },
          lose: { r: "The admiralty is pleased to meet a pirate who walks in on his own feet. It keeps you.", fx: { prison: 2, why: "piracy", honor: -4 } } },
        { t: "Do nothing. Pages burn, and admirals die",
          r: "You go back to your work and sleep with your boots by the bed.",
          fx: { wil: 1, happy: -3 } },
      ],
    },

    // ===================== wk_knows_secret: a servant kept a household secret "like good linen"
    {
      id: "mwf_linen_lawyer",
      title: "The heirs at law",
      cond: (p, C) => C.adult(p) && C.flag(p, "wk_knows_secret") && A.S.year - p.flags.wk_knows_secret >= 3,
      w: 3, once: true,
      text: "Years ago you swept, carried, listened, and folded one fact away like good linen. The house you served is coming apart now: the old master is dead and his heirs are at law over the plate and the land. Their lawyer is buying servants' memories. Two suns for gossip. Thirty for anything that shames the other side.",
      choices: [
        { t: "Sell the lawyer what you kept",
          r: "He writes it down in a fast, ugly hand and pays thirty suns in a twist of cloth. In court, the other heir learns where it came from.",
          fx: p => join(apply(p, null, { coin: 30, honor: -6 }), mkFoe(p, "enemy", -40, "an heir of the house you served", { status: "merchant" })) },
        { t: "Keep it. Linen is for keeping",
          r: "You tell the lawyer you only swept floors. He believes you, which stings a little. The linen stays folded.",
          fx: { trait: "loyal", honor: 3, wil: 0.6 } },
        { t: "Trade it for a letter of good character", check: { s: "intrigue", s2: "int", d: 48 },
          win: { r: "The lawyer gets his fact. You get a sealed letter, signed by an heir, that opens kitchen doors in better houses.", fx: { letter: 25, honor: -2 } },
          lose: { r: "The lawyer takes your fact and forgets the letter. The steward of the house learns you talked.", fx: { honor: -4, perf: -10, happy: -4 } } },
      ],
    },

    // ===================== wk_washes: washed, boiled and dressed with honey and vinegar in the fever lanes
    {
      id: "mwf_wash_college",
      title: "A midwives' superstition",
      cond: (p, C) => C.adult(p) && C.job(p, "healer") && C.flag(p, "wk_washes") && A.S.year - p.flags.wk_washes >= 2,
      w: 3, once: true,
      text: "Since the fever in the tannery lanes, the poor send for you and not for the physicians. You wash, you boil, you dress wounds with honey and vinegar, and fewer of yours die. Now the physicians' college has written to the magistrate. Washing the sick is a midwives' superstition, they say, and you take bread from licensed men.",
      choices: [
        { t: "Write your method down and send it to the college", check: { s: "learning", s2: "medicine", d: 55 },
          win: { r: "Three pages: boil the water, wash the hands, wash the wound, honey and vinegar. Two young physicians start doing it in secret. The college pretends not to notice.", fx: { fame: 3, int: 1, skill: { medicine: 3 }, flag: "mwf_wash_taught" } },
          lose: { r: "They read it aloud at their dinner in a midwife's voice. The magistrate fines you for practicing above your station.", fx: { coin: -10, perf: -10, happy: -5 } } },
        { t: "Teach it to the midwives instead",
          r: "Every midwife in the lanes boils her water now. The college cannot fine them all, and hates you for it.",
          fx: p => join(apply(p, null, { honor: 4, fame: 2, flag: "mwf_wash_taught" }), mkFoe(p, "enemy", -35, "a physician of the college", { status: "merchant" })) },
        { t: "Pay the fine, and wash behind shut doors",
          r: "Five suns to the magistrate. You still boil the water, with the shutters closed and the honey in an unmarked jar.",
          fx: { coin: -5, perf: 4, happy: -3, wil: 0.6 } },
      ],
    },
    {
      id: "mwf_wash_order",
      title: "The boiling order",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_wash_taught") && A.S.year - p.flags.mwf_wash_taught >= 4,
      w: 3, once: true,
      text: "The fever comes back in a flood year, worse than before. This time the magistrate orders every house in the lanes to boil its water, and the order describes your method. Three days later the physicians' college sends for you. They offer a license, a gown and a stipend. They also want it known that the college discovered washing.",
      choices: [
        { t: "Take the license and the gown",
          r: "The gown is hot and the stipend is good. In the college's book the method belongs to a dead physician with a better name. You treat more people than ever.",
          fx: { coin: 40, promote: 1, skill: { medicine: 3 }, honor: -2 } },
        { t: "Refuse. The lanes know who taught them",
          r: "You stay in the lanes, unlicensed. Two children in one street are named after you.",
          fx: { fame: 4, honor: 4, epithet: "the Washer" } },
        { t: "Demand your name on the method", check: { s: "persuasion", s2: "wil", d: 58 },
          win: { r: "They argue for a week and give way. Your name goes on the page, small, under the college seal.", fx: { fame: 6, promote: 1, deed: "Gave the city the boiling cure" } },
          lose: { r: "The college withdraws its offer and complains to the bishop that you are proud. The bishop agrees with the college.", fx: { piety: -5, trait: "proud", happy: -4 } } },
      ],
    },

    // ===================== fm_asked_wait: the lover proposed on the bridge at dusk; you asked for a year
    {
      id: "mwf_wait_ribbon",
      title: "The year is long up",
      cond: (p, C) => C.adult(p) && !C.married(p) && C.flag(p, "fm_asked_wait") && A.S.year - p.flags.fm_asked_wait >= 2 && C.hasRel(p, "lover") && !!waitedLover(p),
      w: 3, once: true,
      setup: (p, ctx) => { const t = waitedLover(p); if (!t) { ctx.skip = 1; return; } ctx.pid = t.id; yrs(p, ctx, "fm_asked_wait"); },
      text: "{yrs} years since the bridge at dusk, when {them} asked you to marry {themHim} and you asked for one more year. {them} has not asked again. Tonight {theyHe} brings you a ribbon from the spring fair and says nothing about it, which says a good deal.",
      choices: [
        { t: "Take {themHim} to the bridge and ask, yourself",
          r: "Same stones, same hour. You ask. {them} laughs, then cries, then says yes.",
          fx: (p, ctx) => wed(p, T(ctx)) || "But the banns are never read. Something stands between you that neither of you will name." },
        { t: "Tell {themHim} the truth: you will never marry",
          r: "{them} ties the ribbon round your wrist and walks off across the bridge. By midsummer {theyHe} is walking out with someone else.",
          fx: { them: { type: "ex", op: -25 }, happy: -6, wil: 1 } },
        { t: "Say nothing. Let things go on as they are",
          r: "Nothing changes, except that {them} comes a little later each time and leaves a little earlier.",
          fx: { them: { op: -18 }, happy: -2 } },
      ],
    },
    {
      id: "mwf_wait_banns",
      title: "Banns for someone else",
      cond: (p, C) => C.adult(p) && !C.married(p) && C.flag(p, "fm_asked_wait") && A.S.year - p.flags.fm_asked_wait >= 4 && C.hasRel(p, "lover", "ex") && !!lostLover(p),
      w: 2, once: true,
      setup: (p, ctx) => {
        const t = lostLover(p); if (!t) { ctx.skip = 1; return; }
        ctx.pid = t.id; yrs(p, ctx, "fm_asked_wait");
        ctx.other = A.givenName(t.cult, t.sex === "M" ? "F" : "M");
      },
      text: "You asked {them} for one more year, on the bridge at dusk. {theyHe} gave you {yrs}. This morning the banns are cried at the well: {them} is to marry {other}, from across the river. The whole lane is asked to the feast. So are you.",
      choices: [
        { t: "Go to the feast, and dance once with {themHim}",
          r: "You dance badly and drink {theirHis} health. It is the decent thing, and it costs more than it looks.",
          fx: (p, ctx) => { marryOff(T(ctx), ctx.other); return apply(p, ctx, { them: { type: "friend", op: 10 }, honor: 3, happy: -6 }); } },
        { t: "Speak to {themHim} before the vows", check: { s: "persuasion", s2: "wil", d: 58 },
          win: { r: "Behind the brewhouse {them} hears you out, then goes to tell {other} it is off. The lane will talk for a year.", fx: (p, ctx) => join(wed(p, T(ctx)), apply(p, ctx, { honor: -3 })) },
          lose: { r: "{them} hears you out and goes to the vows anyway. Half the lane saw the two of you behind the brewhouse.", fx: (p, ctx) => { marryOff(T(ctx), ctx.other); return apply(p, ctx, { them: { type: "ex", op: -20 }, honor: -4, happy: -8 }); } } },
        { t: "Stay away and drink alone",
          r: "You hear the pipes from across the river until well after dark. In the morning there is a ribbon on your step.",
          fx: (p, ctx) => { marryOff(T(ctx), ctx.other); return apply(p, ctx, { them: { op: -10 }, happy: -8, wil: 0.6 }); } },
      ],
    },

    // ===================== fm_other_affair: kept a lover who had a spouse in another town
    {
      id: "mwf_affair_basket",
      title: "A basket of eggs",
      cond: (p, C) => C.adult(p) && C.flag(p, "fm_other_affair") && A.S.year - p.flags.fm_other_affair >= 2 && C.hasRel(p, "lover") && !!marriedLover(p),
      w: 3, once: true,
      setup: (p, ctx) => {
        const t = marriedLover(p); if (!t) { ctx.skip = 1; return; }
        const s = spouseOf(t); ctx.pid = t.id; ctx.sp = s.given; ctx.spid = s.id; ctx.spHe = A.he(s); ctx.spw = s.sex === "M" ? "husband" : "wife";
      },
      text: "You kept {them}'s secret, the {spw} in another town, and you kept {them}. That was years ago. This morning {sp} is at your door with a basket of eggs, polite as a priest. \"I think we should know each other,\" {spHe} says. \"We have so much in common.\"",
      choices: [
        { t: "Let {sp} in, and tell the truth",
          r: "You tell it plainly over the eggs. {sp} listens, nods and thanks you. That night you end it with {them}, about as well as these things end.",
          fx: (p, ctx) => { link(p, A.P(ctx.spid), "acquaint", 10); return apply(p, ctx, { them: { type: "ex", op: -30 }, honor: 4, happy: -6 }); } },
        { t: "Deny everything, warmly", check: { s: "deception", s2: "int", d: 50 },
          win: { r: "You are kind, puzzled and a little hurt. {sp} apologizes and leaves the eggs. You eat them, one a day, and taste each one.", fx: { honor: -4, trait: "deceitful", skill: { deception: 2 } } },
          lose: { r: "Under the eggs is one of your letters. The whole lane hears what {sp} thinks of you.", fx: (p, ctx) => { link(p, A.P(ctx.spid), "enemy", -50); return apply(p, ctx, { honor: -8, happy: -6 }); } } },
        { t: "Offer {sp} silver to look away (20 suns)", req: p => p.coin >= 20,
          r: "{sp} takes it without counting. \"I am not a fool,\" {spHe} says. \"Only poor.\" The affair goes on, and now it has a price.",
          fx: (p, ctx) => { link(p, A.P(ctx.spid), "acquaint", 0); return apply(p, ctx, { coin: -20, honor: -5, trait: "deceitful" }); } },
      ],
    },

    // ===================== clan: an orc husband went to live at his wife's clan fire
    {
      id: "mwf_clan_spring",
      title: "Two fires, one spring",
      cond: (p, C) => C.adult(p) && C.race(p, "orc", "halforc") && C.flag(p, "clan") && C.married(p) && A.S.year - ((p.flags.ev || {}).fm_orc_clan || A.S.year) >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        ctx.clan = typeof p.flags.clan === "string" ? p.flags.clan : "your wife's";
        ctx.yrs = word(A.S.year - ((p.flags.ev || {}).fm_orc_clan || A.S.year));
        const s = spouseOf(p); if (s) ctx.pid = s.id;
      },
      text: "{yrs} winters at {clan} fire, since the clan-mothers spoke and you went to live among your wife's people. Now {clan} and your birth clan quarrel over a spring that both call theirs. A boy brings you a knotted cord from your mother. Come home, it means, and stand with your blood.",
      choices: [
        { t: "Stand with {clan}, your wife's fire",
          r: "You stand at the spring with your wife's kin, spear grounded. Your brothers see you there. Your mother sends no more cords.",
          fx: { rel: { who: "mother", op: -20 }, them: { op: 15 }, honor: 2, deed: "Stood with his wife's clan at the spring" } },
        { t: "Go home and stand with your blood",
          r: "You walk back to your mother's fire with your spear. Your wife does not follow. The marriage holds, in name.",
          fx: { rel: { who: "mother", op: 20 }, them: { op: -30 }, happy: -4 } },
        { t: "Carry the cord to both fires, and talk", check: { s: "diplomacy", s2: "wil", d: 55 },
          win: { r: "Two days of talk at the spring. The clans share the water by the moon: waxing to one, waning to the other. The Mothers learn your name.", fx: { fame: 3, honor: 4, skill: { diplomacy: 3 }, epithet: "Spring-Talker" } },
          lose: { r: "Both fires decide you are the other's man. Your mother and your wife agree on that, and on little else.", fx: { rel: { who: "mother", op: -10 }, them: { op: -10 }, happy: -6 } } },
      ],
    },

    // ===================== fm_my_line: an elf chose their own line name for the children
    {
      id: "mwf_elf_last_line",
      title: "The last of a line",
      cond: (p, C) => C.race(p, "elf") && C.married(p) && C.hasKids(p) && C.flag(p, "fm_my_line") && A.S.year - p.flags.fm_my_line >= 10,
      w: 3, once: true,
      setup: (p, ctx) => { const s = spouseOf(p); if (!s) { ctx.skip = 1; return; } ctx.pid = s.id; },
      text: "When you chose your own line name for the children, {them} agreed with a long look. The look had a reason. {them}'s mother has died, and {them} is the last of that line. Under the birth trees the Keepers ask, gently, whether it ends with this generation.",
      choices: [
        { t: "Give your youngest {them}'s line name",
          r: "The Keepers paint it on the youngest's name-board. {them} touches the letters and says nothing for a day. Then thanks you.",
          fx: { them: { op: 20 }, happy: 2, deed: "Gave a child to a dying line" } },
        { t: "Keep your word: all of them carry your line",
          r: "The Keepers record it. {them}'s line ends with {themHim}. Elves forgive slowly. This will take a century or two.",
          fx: { them: { op: -25 }, honor: 2, trait: "stubborn" } },
        { t: "Let the youngest choose at fifty",
          r: "The Keepers leave a space on the name-board. Fifty years is a short wait for an elf, and a long one for a marriage.",
          fx: { them: { op: 6 }, int: 0.3, wil: 0.5 } },
      ],
    },

    // ===================== fm_thing_wait: a giant asked the Mothers at the Thing for a different hall
    {
      id: "mwf_thing_second",
      title: "The next Thing",
      cond: (p, C) => C.race(p, "giant") && C.adult(p) && !C.married(p) && C.flag(p, "fm_thing_wait") && A.S.year - p.flags.fm_thing_wait >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const t = mk(p, { sex: loveSex(p), race: "giant", ageAdj: C.ageAdj(p) + A.ri(-2, 3) }); ctx.pid = t.id;
        ctx.hall = /^of /.test(t.sur || "") ? t.sur.slice(3) : A.pick(["Helstad", "Torfell", "Valdhall", "Haugberg", "Ulfdal"]);
      },
      text: "At the last Thing you asked the Mothers for a different hall, and they promised to look again. They have looked. From the turf benches they name {them} of {hall}, {themOcc}. There are fewer giants at this Thing than at the last. The Mothers will not look a third time.",
      choices: [
        { t: "Accept {them} of {hall}",
          r: "The Lore-Chanters sing the two halls together.",
          fx: (p, ctx) => wed(p, T(ctx)) || "A quarrel between the halls breaks the match before the singing." },
        { t: "Refuse, and go to the whaling instead",
          r: "You stand up from the benches and walk down to the boats. The Mothers do not call after you. Your mother will not say your name at the hearth.",
          fx: { honor: -6, wil: 1.5, rel: { who: "mother", op: -15 }, skill: { sea: 3 }, them: { type: "acquaint", op: -10 } } },
        { t: "Offer to foster a child of an emptied hall",
          r: "There is a child whose parents went through the sea ice in the spring. You take the child home. The Mothers count it, grudgingly, as a match of sorts.",
          fx: p => { const c = mk(p, { race: "giant", ageAdj: A.ri(3, 8) }); addChild(p, c, 50); hon(p, 2); return `(${c.given} is your child now.)`; } },
      ],
    },

    // ===================== fm_affair: a married player gave in to temptation
    {
      id: "mwf_affair_doors",
      title: "Back doors",
      cond: (p, C) => C.adult(p) && C.married(p) && C.flag(p, "fm_affair") && A.S.year - p.flags.fm_affair >= 2 && C.hasRel(p, "lover") && !!affairLover(p),
      w: 3, once: true,
      setup: (p, ctx) => { const t = affairLover(p), s = spouseOf(p); if (!t || !s) { ctx.skip = 1; return; } ctx.pid = t.id; ctx.sp = s.given; yrs(p, ctx, "fm_affair"); },
      text: "{yrs} years since you gave in to {them} and told yourself it meant nothing. It has meant back doors, borrowed hours and a great many lies to {sp}. Tonight {them} is done with back doors. \"Leave {sp},\" {theyHe} says, \"or let me go. I am tired of being the hour you steal.\"",
      choices: [
        { t: "Leave {sp} for {them}",
          r: "You tell {sp} at the table, with the bread still between you. Then you go.",
          fx: (p, ctx) => join(leaveFor(p, T(ctx)), apply(p, ctx, { honor: -6, rel: { who: "child", op: -10, all: true } })) },
        { t: "Promise {themHim}: next spring",
          r: "{them} believes you, or decides to. You have bought a year with words, at the usual rate.",
          fx: { them: { op: -5 }, honor: -2, flag: "mwf_affair_promise" } },
        { t: "End it tonight",
          r: "{them} goes out by the back door for the last time and leaves it open. You lie awake beside {sp}, who asks if you are ill.",
          fx: { them: { type: "ex", op: -30 }, happy: -6, wil: 1.2, honor: 2 } },
      ],
    },
    {
      id: "mwf_affair_breadstall",
      title: "At the bread stall",
      cond: (p, C) => C.adult(p) && C.married(p) && C.flag(p, "mwf_affair_promise") && A.S.year - p.flags.mwf_affair_promise >= 2 && C.hasRel(p, "lover") && !!affairLover(p),
      w: 3, once: true,
      setup: (p, ctx) => { const t = affairLover(p), s = spouseOf(p); if (!t || !s) { ctx.skip = 1; return; } ctx.pid = t.id; ctx.sp = s.given; ctx.spHis = A.his(s); },
      text: "Spring came and went, twice. On market day {them} walks up to {sp} at the bread stall and says it all: the barns, the borrowed hours, your promise about next spring. Half the town hears. {sp} turns to look for you in the crowd, and finds you.",
      choices: [
        { t: "Go to {sp}, in front of everyone, and beg",
          r: "You kneel in the mud by the bread stall. {sp} lets you walk home a pace behind. {them} curses you down the length of the street.",
          fx: { rel: { who: "spouse", op: -25 }, them: { type: "enemy", op: -50 }, honor: -6, happy: -8, trait: "humble" } },
        { t: "Take {them}'s hand and walk away",
          r: "You walk out of the market with {them}, and out of your marriage. Behind you the bread stall is very quiet.",
          fx: (p, ctx) => join(leaveFor(p, T(ctx)), apply(p, ctx, { honor: -10, fame: 1 })) },
        { t: "Call {them} a liar, loudly", check: { s: "deception", s2: "wil", d: 55 },
          win: { r: "You are louder and better liked. The town decides {them} is mad with jealousy. {sp} decides nothing, out loud.", fx: { them: { type: "enemy", op: -60 }, honor: -8, trait: "deceitful", rel: { who: "spouse", op: -10 } } },
          lose: { r: "{them} has your letters, and reads one aloud at the bread stall. {sp} goes home to {spHis} own people and does not come back.", fx: (p, ctx) => { divorce(p); return apply(p, ctx, { them: { type: "enemy", op: -50 }, honor: -10, happy: -10 }); } } },
      ],
    },

    // ===================== tryChild: went on pilgrimage to pray for a child
    {
      id: "mwf_shrine_tithe",
      title: "The shrine's due",
      cond: (p, C) => C.adult(p) && C.flag(p, "tryChild") && A.S.year - p.flags.tryChild >= 2 && C.hasKids(p) && !!shrineChild(p),
      w: 3, once: true,
      setup: (p, ctx) => {
        const c = shrineChild(p); if (!c) { ctx.skip = 1; return; }
        ctx.kid = c.given; ctx.kidid = c.id; ctx.fee = Math.max(5, Math.round(p.coin * 0.1));
        const s = spouseOf(p); if (s) ctx.pid = s.id;
      },
      text: "{kid} came after the pilgrimage: the long road, the old shrine, the night of prayer side by side. Now a keeper of that shrine stands at your door in road dust. The shrine keeps a ledger of the children it sends, he says. Each owes a tithe: {fee} suns, or the child in the shrine's service at twelve.",
      choices: [
        { t: "Pay the tithe ({fee} suns)", req: (p, C, ctx) => p.coin >= (ctx.fee || 5),
          r: "He counts it, blesses the doorpost, and writes \"paid\" beside {kid}'s name. The road dust stays on your step for a week.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee || 5)); p.piety = A.clamp(p.piety + 3, 0, 100); return ""; } },
        { t: "Promise {kid} to the shrine at twelve",
          r: "He writes {kid}'s name in the ledger with a small cross beside it. At home there is a silence that lasts until the next new moon.",
          fx: (p, ctx) => { p.deeds.push({ y: A.S.year, t: `Vowed ${ctx.kid} to the shrine` }); return apply(p, ctx, { piety: 10, them: { op: -15 }, happy: -4 }); } },
        { t: "Send him off. The gods gave freely, or not at all",
          r: "He shakes the dust off his feet on your step, which is meant as a curse. {kid} sleeps through it.",
          fx: { piety: -8, trait: "cynical", wil: 0.5 } },
      ],
    },
    {
      id: "mwf_shrine_empty",
      title: "Still empty",
      cond: (p, C) => C.adult(p) && C.married(p) && !C.hasKids(p) && C.flag(p, "tryChild") && A.S.year - p.flags.tryChild >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { const s = spouseOf(p); if (!s) { ctx.skip = 1; return; } ctx.pid = s.id; yrs(p, ctx, "tryChild"); },
      text: "{yrs} years since the pilgrimage, the old shrine and the night of prayer side by side. The cradle is still in the loft. {them} has started walking to the village shrine alone at dawn, and comes back with wet hems and nothing to say.",
      choices: [
        { t: "Walk with {themHim} tomorrow, and every dawn after",
          r: "You go every dawn through a whole winter. No child comes. Something else does: you talk on the road the way you did when you were courting.",
          fx: { them: { op: 15 }, piety: 4, wil: 1, happy: 3 } },
        { t: "Take in a kinsman's child as your heir",
          r: "A cousin with too many mouths is glad to give one up.",
          fx: (p, ctx) => { const c = mk(p, { ageAdj: A.ri(3, 9) }); addChild(p, c, 45); hp(p, 6); return `${c.given}, ${A.age(c)}, comes to live with you and fills the loft cradle with ${A.his(c)} boots. (${c.given} is your child and heir now.)`; } },
        { t: "Ask the elders to unmake the marriage",
          r: "You say it in front of the elders, and {them} hears it there first.",
          fx: (p, ctx) => {
            if (noDivorce(p)) return apply(p, ctx, { them: { op: -40 }, honor: -4, happy: -6 }) || "The priests will not unmake a marriage. You go on living under one roof, as strangers.";
            divorce(p); hon(p, -4); hp(p, -6); return "The elders grant it. You are free to try again, and older.";
          } },
      ],
    },

    // ===================== fm_promise: promised a dying friend to look after the family
    {
      id: "mwf_promise_eldest",
      title: "The eldest",
      cond: (p, C) => C.adult(p) && C.flag(p, "fm_promise") && A.S.year - p.flags.fm_promise >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const f = deadFriend(p);
        ctx.friend = f ? f.given : "your friend"; ctx.cause = f && f.cause ? f.cause : "a fever"; ctx.wid = f && f.sex === "F" ? "widower" : "widow";
        const k = mk(p, { ageAdj: A.ri(12, 15), status: f ? f.status : p.status, role: "ward" });
        if (f && f.sur) { k.sur = f.sur; k.surMode = f.surMode; }
        ctx.pid = k.id; gender(ctx, k); yrs(p, ctx, "fm_promise");
      },
      text: "{friend} died of {cause}, and at the end you promised to look after the family. That was {yrs} years ago. Today {friend}'s eldest, {them}, stands in your yard with a bundle. The {wid} cannot feed four. {them} wants a trade, or a place, or anything but the road.",
      choices: [
        { t: "Take {them} in and teach {themHim} what you know",
          r: "{them} sleeps by your hearth and eats like two. In a month {theyHe} knows where everything is kept. In a year, how everything is done.",
          fx: { them: { type: "student", op: 40, back: "mentor" }, honor: 4, coin: -10, flag: "mwf_promise_ward" } },
        { t: "Give the family coin, once (20 suns)", req: p => p.coin >= 20,
          r: "You press twenty suns into {them}'s hand and send {themHim} home. It is not what you promised. It is what you can stand.",
          fx: { coin: -20, honor: 1, them: { type: "acquaint", op: 15 } } },
        { t: "Tell {themHim} there is nothing to give",
          r: "{them} nods, as if expecting it, and goes back down the road with the bundle. You do not visit {friend}'s grave that year.",
          fx: { honor: -8, happy: -5, them: { type: "acquaint", op: -30 } } },
      ],
    },
    {
      id: "mwf_promise_grown",
      title: "A household of one's own",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_promise_ward") && A.S.year - p.flags.mwf_promise_ward >= 5 && !!byRole(p, "ward"),
      w: 3, once: true,
      setup: (p, ctx) => { const t = byRole(p, "ward"); if (!t || !t.alive) { ctx.skip = 1; return; } ctx.pid = t.id; yrs(p, ctx, "mwf_promise_ward"); },
      text: "{them} turned up in your yard with a bundle {yrs} years ago. {theyHe} is grown now and good at the work, better than you were at that age. Today {theyHe} asks your blessing to marry and set up a household of {theirHis} own. {theyHe} has no portion and no land. {theyHe} has you.",
      choices: [
        { t: "Give {themHim} a portion, as you would your own (30 suns)", req: p => p.coin >= 30,
          r: "Thirty suns, a table and two good pots. {them} kisses your hands at the wedding. {theyHe} will not forget it.",
          fx: { coin: -30, them: { op: 30 }, owed: 1, honor: 3 } },
        { t: "Adopt {themHim} as your own child and heir",
          r: "You say it before the priest and two witnesses. {them} takes your name to the wedding.",
          fx: (p, ctx) => { addChild(p, T(ctx), 70); hp(p, 6); const t = T(ctx); return t ? `(${t.given} is your child and heir now.)` : ""; } },
        { t: "Refuse. You need {themHim} here",
          r: "{them} stays, and works, and does not mention it again. The wedding waits. So does something else between you.",
          fx: { them: { op: -30 }, perf: 6, happy: -2 } },
      ],
    },

    // ===================== wr_capt_enemy: called out the rule of twelve at the wagon wheel
    {
      id: "mwf_capt_ladder",
      title: "First ladder",
      cond: (p, C) => C.soldier(p) && C.atWar(p) && C.flag(p, "wr_capt_enemy") && A.S.year - p.flags.wr_capt_enemy >= 2,
      w: 3, once: true,
      text: "Since the wagon wheel, when you called out the rule of twelve and the drummer boy got twelve instead of twenty, the captain has smiled at you on parade. Now he has his own company, and yours is under it. Tonight he reads out the names for the first ladders against the wall. Yours is first. He smiles while he reads it.",
      choices: [
        { t: "Go up the first ladder", check: { s: "athletics", s2: "wil", d: 55 },
          win: { r: "You are over the parapet before the defenders turn round. The company follows. When the commander asks who was first, men say your name before the captain can.", fx: { merit: 15, fame: 3, wil: 1.5, deed: "First up the ladder" } },
          lose: { r: "A stone takes you on the fourth rung. You wake in the surgeons' tent with the captain's compliments.", fx: { health: -20, cause: "a stone from the wall", wound: "concussion", merit: 5 } } },
        { t: "Go to the senior captain who heard you that day", check: { s: "diplomacy", s2: "command", d: 55 },
          win: { r: "He remembers. The ladder list is read again with your name in the middle. The captain stops smiling, which is better and worse.", fx: { merit: 3, honor: 2 } },
          lose: { r: "He does not remember, or will not. You go up the ladder anyway, now known as someone who complains.", fx: { merit: -5, health: -10, cause: "a fall from a ladder" } } },
        { t: "Pay a grey veteran to take your rung (15 suns)", req: p => p.coin >= 15,
          r: "The veteran takes your fifteen suns and your rung. He comes back with a cut cheek and a story, and the company hears both.",
          fx: { coin: -15, honor: -6, rel: { who: "comrade", op: -6, all: true } } },
      ],
    },

    {
      id: "mwf_capt_drummer",
      title: "The drummer boy",
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, "wr_capt_enemy") && A.S.year - p.flags.wr_capt_enemy >= 6,
      w: 2, once: true,
      text: "A drum-major in a good coat stops you outside the church. It takes you a moment: the drummer boy from the wagon wheel, who got twelve strokes and not twenty because you said the rule out loud. The captain who called for twenty is a colonel now, on trial for flogging a recruit to death. The court wants witnesses to his habits.",
      choices: [
        { t: "Ride to the court and testify", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "You tell the court about the wagon wheel. Two others tell worse. The colonel is broken to the ranks, and the drum-major buys the wine.", fx: { fame: 2, honor: 5, deed: "Testified against a cruel colonel" } },
          lose: { r: "The court is three colonels. They thank you, and find for him. He watches you leave, and smiles the old smile.", fx: p => join(apply(p, null, { honor: 3, happy: -4 }), mkFoe(p, "enemy", -50, "the colonel who once called for twenty", { sex: "M", status: "gentry" })) } },
        { t: "Send a sworn letter instead",
          r: "The drum-major takes the letter and thanks you. A letter weighs less than a face in a courtroom, and you both know it.",
          fx: { honor: 1, happy: -1 } },
        { t: "Stay out of it. You have a life now",
          r: "The drum-major nods, as if he expected it, and goes off to find someone braver.",
          fx: { honor: -3, happy: -2 } },
      ],
    },

    // ===================== wr_merc_thoughts: passed over as "born behind a plough"; asked about Free Companies
    {
      id: "mwf_plough_sergeant",
      title: "A tanner's son for captain",
      cond: (p, C) => C.soldier(p) && !p.mil.merc && C.flag(p, "wr_merc_thoughts") && A.S.year - p.flags.wr_merc_thoughts >= 2,
      w: 3, once: true,
      text: "Since the clerk read the list of promotions and said \"born behind a plough\", you have asked around about the Free Companies. Now one asks back. A sergeant in a sheepskin finds you at the horse lines. His captain was a tanner's son. \"We pay for skill, not blood,\" he says. \"Bring your sword and your scars.\"",
      choices: [
        { t: "Take your discharge and join the Company",
          r: "You hand in the crown's badge at dawn.",
          fx: p => {
            const r = A.resign(); if (!r || !r.ok) return (r && r.msg) || "They will not let you go.";
            const e = A.enlist(p, true);
            return e && e.ok ? "You sign the Company's book. Here the only question is what you can do." : (e && e.msg) || "The Company has marched before you can catch it.";
          } },
        { t: "Stay, and make the knights eat their words",
          r: "You send the sergeant off with a drink and go back to the drill field. Next year's list will have your name, or you will know why.",
          fx: { wil: 2, merit: 6, trait: "ambitious" } },
        { t: "Report the recruiter to your commander",
          r: "The sergeant is whipped out of camp. Your commander nods at you. The ploughmen in your company do not.",
          fx: { merit: 10, honor: -5, rel: { who: "comrade", op: -8, all: true } } },
      ],
    },
    {
      id: "mwf_plough_inspection",
      title: "Still carrying a spear",
      cond: (p, C) => C.soldier(p) && p.mil.merc && C.flag(p, "wr_merc_thoughts") && A.S.year - p.flags.wr_merc_thoughts >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { ctx.pb = p.sex === "F" ? "plough-girl" : "plough-boy"; },
      text: "You left the crown's ranks because a clerk said you were born behind a plough. The Company asks only what you can do. Today the employer's knights ride down the line to inspect the hired men, and one of them knows you from the old officers' mess. \"The {pb},\" he says, loudly. \"Still carrying a spear?\"",
      choices: [
        { t: "Let it pass. His lord pays the contract",
          r: "You say nothing. The knight rides on, pleased. Your men watched you say nothing; with hired men it is hard to tell what they made of it.",
          fx: { wil: 1.5, happy: -3 } },
        { t: "Answer him in front of his own lances", check: { s: "intimidation", s2: "wil", d: 52 },
          win: { r: "\"Still alive,\" you say, \"which is more than your last three captains.\" His own lances laugh. He will not forget it.", fx: p => join(apply(p, null, { fame: 2, merit: 6 }), mkFoe(p, "enemy", -40, "a knight from the old officers' mess", { sex: "M", status: "gentry" })) },
          lose: { r: "He has you flogged for insolence under the contract's discipline clause. Your captain allows it. Hired men are cheaper than lawsuits.", fx: { health: -12, cause: "a flogging", wound: "back", wil: 1.5 } } },
        { t: "Raise the Company's price for this employer", check: { s: "trade", s2: "command", d: 50 },
          win: { r: "The renewed contract costs the employer a fifth more, with a line about the Company's honor. Your share is twenty suns.", fx: { coin: 20, merit: 4, skill: { trade: 2 } } },
          lose: { r: "The employer hires a cheaper company instead. Your captain blames you, accurately.", fx: { merit: -10, happy: -4 } } },
      ],
    },

    // ===================== wr_boy: took the camp boy under your wing
    {
      id: "mwf_camp_boy_purse",
      title: "The provost's rope",
      cond: (p, C) => C.soldier(p) && C.flag(p, "wr_boy") && A.S.year - p.flags.wr_boy >= 4,
      w: 3, once: true,
      text: "The camp boy you took under your wing, the one who slept under the baggage wagon, is sixteen or so now. You taught him to sharpen a blade. He taught himself to open a strongbox. The provost has him for the paymaster's purse, and hangs thieves of sixteen as readily as thieves of forty. The boy has asked for you.",
      choices: [
        { t: "Swear he was on an errand for you", check: { s: "deception", s2: "wil", d: 52 },
          win: { r: "The provost does not believe you, but cannot prove you a liar, and you have merit. The boy is released into your keeping with a split lip.", fx: { honor: -2, merit: -4, trait: "loyal" } },
          lose: { r: "The provost proves you a liar in a quarter of an hour. You both take twenty strokes. The boy does not cry out, because you do not.", fx: { health: -15, cause: "a flogging", wound: "back", merit: -8, honor: 2 } } },
        { t: "Pay back the purse yourself (20 suns)", req: p => p.coin >= 20,
          r: "Twenty suns to the paymaster and a word with the provost. The boy is beaten and let go. He will not meet your eye for a month.",
          fx: { coin: -20, honor: 3, happy: -2 } },
        { t: "Let the provost do his work",
          r: "He hangs at dawn from the baggage wagon he used to sleep under. You stand in the ranks and watch, because you are ordered to.",
          fx: { happy: -12, wil: 2, trait: "stoic" } },
      ],
    },
    {
      id: "mwf_camp_boy_naming",
      title: "A sergeant at the door",
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, "wr_boy") && A.S.year - p.flags.wr_boy >= 8,
      w: 2, once: true,
      text: "A man-at-arms with a sergeant's knot on his shoulder asks for you at the door. It takes you a moment: the camp boy, who slept under the baggage wagon until you shared your blanket. He has a wife and a week-old son. In his company's custom, whoever stands at a naming takes the child if the father falls. He asks you to stand.",
      choices: [
        { t: "Stand for the child, and take the oath",
          r: "You hold the boy over the water and swear it. The sergeant cries, which surprises you both. You hope never to be asked to keep it.",
          fx: { honor: 4, happy: 6, deed: "Stood at a soldier's son's naming, and swore the oath" } },
        { t: "Stand at the naming, but not for the oath",
          r: "You stand, you drink, you give a silver spoon. He thanks you, and you can see him counting what you did not say.",
          fx: { coin: -5, happy: 2 } },
        { t: "Send him away. You owe that camp nothing",
          r: "He goes without arguing. Soldiers are used to orders. You hear later that the oath went to his captain instead.",
          fx: { happy: -4, wil: 0.5 } },
      ],
    },

    // ===================== wr_mutineer: spoke for pledges, or joined the mutiny over pay
    {
      id: "mwf_mutiny_rolls",
      title: "A mark beside your name",
      cond: (p, C) => C.soldier(p) && C.flag(p, "wr_mutineer") && A.S.year - p.flags.wr_mutineer >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        ctx.what = p.mil && p.mil.merc ? "the season the company took the town gate and the council's silver as a pledge" : "the quarter the pay did not come and the men marched on the paymaster's tent";
      },
      text: "A new provost is going through the old rolls by candlelight, with a clerk who never blinks. They are reading back to {what}. Beside your name, in faded ink, is a small mark. The provost wants the ringleaders. A soldier who names them, he says, will find his own mark has worn away.",
      choices: [
        { t: "Own it: you spoke for it, and would again",
          r: "The provost writes it down. The clerk blinks once. You lose a year's merit and gain something you cannot spend.",
          fx: { merit: -10, honor: 4, fame: 1, trait: "honest" } },
        { t: "Give him another man's name",
          r: "You give him a name. By the end of the week the man is gone from the rolls, and your mark has worn away, as promised.",
          fx: { merit: 6, honor: -8, trait: "deceitful", rel: { who: "comrade", op: -6, all: true } } },
        { t: "Pay the clerk to scrape the mark off (15 suns)", req: p => p.coin >= 15,
          r: "The clerk takes the coin without blinking and scrapes the mark with a penknife. He now knows something about you. Clerks collect such things.",
          fx: { coin: -15, secret: 1 } },
      ],
    },

    // ===================== wr_lifedebt: swore a life-debt to the comrade who hauled you out of the ford
    {
      id: "mwf_lifedebt_oath",
      title: "A life for a lie",
      cond: (p, C) => C.adult(p) && C.flag(p, "wr_lifedebt") && A.S.year - p.flags.wr_lifedebt >= 2 && C.hasRel(p, "comrade", "friend", "bestfriend") && !!lifeMate(p),
      w: 3, once: true,
      setup: (p, ctx) => { const t = lifeMate(p); if (!t) { ctx.skip = 1; return; } ctx.pid = t.id; },
      text: "You swore a life-debt on your blade the day {them} hauled you out of the swollen ford by your collar. Today {them} calls it in. {theyHe} has knifed a sergeant's brother in a dice quarrel, and needs a witness who will swear {theyHe} was at your fire all night.",
      choices: [
        { t: "Swear the false oath for {themHim}",
          r: "You swear it before the provost without blinking. {them} walks free. The debt is paid, and you are the one who paid it with a lie.",
          fx: { them: { op: 25 }, sworn: true, honor: -8, unflag: "wr_lifedebt", deed: "Paid a life-debt with a false oath" } },
        { t: "Refuse. A life is not a lie",
          r: "{them} hangs on the word of three other men, cursing your name from the cart. The debt goes into the ground unpaid.",
          fx: (p, ctx) => { const r = apply(p, ctx, { honor: 4, happy: -10, wil: 1.5 }); kill(ctx, "hanged for murder"); return r; } },
        { t: "Get {themHim} out of the camp tonight", check: { s: "stealth", s2: "ins", d: 50 },
          win: { r: "Two horses, a gap in the pickets and a moonless hour. {them} is over the hills by dawn. You never see {themHim} again, and you are square.", fx: (p, ctx) => { const t = T(ctx); if (t && p.mil) p.mil.squad = p.mil.squad.filter(id => id !== t.id); return apply(p, ctx, { them: { op: 20 }, honor: -2, unflag: "wr_lifedebt" }); } },
          lose: { r: "The pickets were doubled. You both end up in irons.", fx: { prison: 1, why: "helping a murderer escape", them: { op: 10 } } } },
      ],
    },
    {
      id: "mwf_lifedebt_river",
      title: "Another ford",
      cond: (p, C) => C.soldier(p) && C.flag(p, "wr_lifedebt") && A.S.year - p.flags.wr_lifedebt >= 3 && !!lifeMate(p, true),
      w: 2, once: true,
      setup: (p, ctx) => { const t = lifeMate(p, true); if (!t) { ctx.skip = 1; return; } ctx.pid = t.id; },
      text: "Another river, another ford, brown with snowmelt. Halfway across, {them} goes under, kit and all, the way you did the day {theyHe} hauled you out by the collar. You still owe {themHim} a life. The current is faster than it was that day.",
      choices: [
        { t: "Go in after {themHim}", check: { s: "sta", s2: "str", d: 55 },
          win: { r: "You get a fist in {theirHis} collar and both of you fetch up on the gravel, retching. {them} laughs first. \"Square,\" {theyHe} says.", fx: { them: { op: 20 }, honor: 4, unflag: "wr_lifedebt", deed: "Paid a life-debt at a ford" } },
          lose: { r: "The river takes you both a hundred yards downstream. You come out on a gravel bar.", fx: (p, ctx) => join(A.comradeDies(p, T(ctx), "drowned at a ford"), apply(p, ctx, { health: -10, cause: "near-drowning", wil: 1.5 })) } },
        { t: "Run downstream and hold out your spear", check: { s: "ins", s2: "str", d: 45 },
          win: { r: "{them} grabs the spear-butt and you haul. Not as fine as going in, but {theyHe} is alive and spitting water.", fx: { them: { op: 10 }, honor: 1 } },
          lose: { r: "The spear-butt passes a hand's breadth from {theirHis} fingers.", fx: (p, ctx) => join(A.comradeDies(p, T(ctx), "drowned at a ford"), apply(p, ctx, { happy: -6 })) } },
        { t: "Hold your place in the line, as ordered",
          r: "The sergeant ordered the line held, and you hold it.",
          fx: (p, ctx) => join(A.comradeDies(p, T(ctx), "drowned at a ford"), apply(p, ctx, { honor: -6, wil: 1, trait: "stoic" })) },
      ],
    },

    // ===================== wr_traitor: sold the peddler what you knew about the bridge
    {
      id: "mwf_peddler_boots",
      title: "The peddler's new boots",
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, "wr_traitor") && A.S.year - p.flags.wr_traitor >= 2,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "wr_traitor"),
      text: "{yrs} years since you sold the peddler what you knew about the bridge at {home}, for fifteen suns. The bridge burned two weeks later. Now he is back, in good boots, with a pass sealed by someone important. He buys you a cup and mentions, lightly, that the garrison still wonders who drew the bridge for the enemy.",
      choices: [
        { t: "Pay him to forget your name (30 suns)", req: p => p.coin >= 30,
          r: "He pockets it and pats your arm. \"Forgotten,\" he says. You know how long forgetting lasts with such men.",
          fx: { coin: -30, flag: "mwf_traitor_paid" } },
        { t: "Go to the garrison first and confess", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "The garrison captain fines you twenty suns and gives you a week in the stocks. The peddler is gone by morning.", fx: { coin: -20, honor: 3, happy: -6, deed: "Confessed to the bridge" } },
          lose: { r: "The garrison captain listens, then sends for irons.", fx: { prison: 2, why: "treason in wartime", honor: -4 } } },
        { t: "Follow him out of town at dusk", check: { s: "stealth", s2: "dagger", d: 55 },
          win: { r: "He does not come back out of the woods. You burn his pass in your own hearth.", fx: { honor: -6, wil: 2, trait: "cruel" } },
          lose: { r: "He hears you in the bracken. His knife is quicker than yours. You crawl home, and he rides off.", fx: { health: -15, wound: "deep_cut", cause: "a knife in the woods", honor: -2 } } },
      ],
    },
    {
      id: "mwf_peddler_friend",
      title: "He brings a friend",
      cond: (p, C) => C.adult(p) && C.flag(p, "mwf_traitor_paid") && A.S.year - p.flags.mwf_traitor_paid >= 2,
      w: 3, once: true,
      text: "Thirty suns bought two years. The peddler is back in {home}, boots resoled, and this time he has a friend with a cudgel and no conversation. The price of forgetting is fifty now. \"Times are hard,\" he says. \"For all of us.\"",
      choices: [
        { t: "Pay the fifty", req: p => p.coin >= 50,
          r: "He counts it slowly in front of his friend. He will be back next year, with a bigger friend.",
          fx: { coin: -50, trait: "paranoid", happy: -4 } },
        { t: "Denounce him to the garrison as a spy", check: { s: "intrigue", s2: "persuasion", d: 55 },
          win: { r: "He hangs from the new bridge, the one that replaced the one he burned. His friend does not stay for it.", fx: { coin: 10, wil: 1, fame: 1, honor: -2 } },
          lose: { r: "He names you from the foot of the gallows. Both of you are in the castle cellar by dark.", fx: { prison: 3, why: "treason in wartime", honor: -8 } } },
        { t: "Refuse, and let him talk",
          r: "He talks. Your neighbors stop greeting you at the well, and the garrison fines you forty suns on the word of a spy.",
          fx: { coin: -40, honor: -10, wil: 1.5 } },
      ],
    },

    // ===================== wr_boss_enemy: sold the crew boss's job to its mark
    {
      id: "mwf_boss_cellars",
      title: "Asking in every cellar",
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, "wr_boss_enemy") && A.S.year - p.flags.wr_boss_enemy >= 2,
      w: 3, once: true,
      text: "Years ago a crew boss laid out a job on a table with crumbs for walls, and you sold the plan to the mark. He has been out of the city since. Now he is back, thinner, with two new men, asking in every cellar who sold him. Someone will tell him soon. Cellars are like that.",
      choices: [
        { t: "Find him first and pay him off (40 suns)", req: p => p.coin >= 40,
          r: "You find him at a dice table. He takes the forty, bites one, and says the matter is closed. His eyes say it is only shut.",
          fx: { coin: -40, trait: "paranoid" } },
        { t: "Tell the watch where he sleeps", check: { s: "intrigue", s2: "ins", d: 50 },
          win: { r: "The watch takes him at dawn and hangs him at the crossroads. The cellars know who told. They go quiet when you come in.", fx: p => join(apply(p, null, { coin: 10, honor: -4 }), mkFoe(p, "enemy", -40, "one of the crew boss's men", { sex: "M" })) },
          lose: { r: "He hears the watch is coming and leaves you something first. Two men are waiting in your stairwell.", fx: { health: -12, wound: "scar_face", cause: "a beating in a stairwell" } } },
        { t: "Leave the city on the morning cart",
          r: "You go with what fits in a sack and do not look back at the gate.",
          fx: p => join(moveHome(p), apply(p, null, { happy: -4, wil: 1 })) },
      ],
    },

    // ===================== wr_informer: became a "lamp" and sold the crew to the watch
    {
      id: "mwf_lamp_branded",
      title: "A brand on his hand",
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, "wr_informer") && A.S.year - p.flags.wr_informer >= 3,
      w: 3, once: true,
      text: "You sold the crew to the watch-captain for twenty suns, and the crew hanged. All but the youngest, who got the brand and the galleys. The galleys have let him go. He is back in the city with a thief's brand on his hand, saying your name in the cookshops, softly, like a man practicing.",
      choices: [
        { t: "Ask the watch-captain for protection",
          r: "He will protect you for a price: a name every season. You are his lamp now, and you will be until one of you is dead.",
          fx: { coin: 10, honor: -6, trait: "paranoid" } },
        { t: "Meet him, and tell him the truth", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "He hits you once, hard, and walks off. He wanted to hear someone say it.", fx: { health: -6, cause: "a punch", honor: 4, wil: 2 } },
          lose: { r: "He has a knife and three years of galley rage. You get your arm up in time, mostly.", fx: { health: -15, wound: "scar_arm", cause: "a galley-man's knife" } } },
        { t: "Leave the city before he finds you",
          r: "You leave by the river gate before dawn.",
          fx: p => join(moveHome(p), apply(p, null, { happy: -5 })) },
      ],
    },

    // ===================== wr_marches: an outlaw walked to the Free Marches to start again
    {
      id: "mwf_marches_reeve",
      title: "A staff for the moot",
      cond: (p, C) => C.adult(p) && C.flag(p, "wr_marches") && A.S.year - p.flags.wr_marches >= 3,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "wr_marches"),
      text: "{yrs} years since you walked out of your realm and into the Free Marches, where no one asks where you came from. You took a new name and kept it clean. Now the folk-moot wants you for village reeve: you can count, you can fight a little, and you have never cheated at the mill. A reeve's name gets written down. Written names travel.",
      choices: [
        { t: "Take the staff under your new name",
          r: "You swear on the moot-stone and take the staff. The mill tolls come out right for the first time in years.",
          fx: { fame: 2, honor: 4, skill: { stewardship: 3 }, deed: "Reeve of a village in the Free Marches" } },
        { t: "Take it under your true name, and stop hiding", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The moot hears your old name and your old crime, and votes for you anyway. Out here, that is the point.", fx: { fame: 4, honor: 8, wil: 2, deed: "Reeve of the Free Marches, under a true name" } },
          lose: { r: "The moot votes for you. A year later a bounty-man from your old realm asks for you by that name at the mill.", fx: { fame: 3, flag: "outlaw", happy: -4 } } },
        { t: "Refuse. Stay a ghost",
          r: "You say you are no reeve. They give the staff to the miller, who cheats at the mill.",
          fx: { wil: 1, happy: -3 } },
      ],
    },

    // ===================== ct_refused: refused the shield-money in a year without war
    {
      id: "mwf_writ_second",
      title: "The second writ",
      cond: (p, C) => C.adult(p) && !C.ruler(p) && (C.noble(p) || rung(p) >= 2) && C.flag(p, "ct_refused") && A.S.year - p.flags.ct_refused >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { ctx.fee = cost(p, 18); ctx.fee2 = ctx.fee * 2; yrs(p, ctx, "ct_refused"); },
      text: "{yrs} years ago you refused the shield-money: not a war year, you said. The crown has a long memory and a clerk with a fine hand. A second writ comes, sealed in black wax, with your refusal copied out above the new sum: {fee} suns. Refusing three times can cost a title. This is the second.",
      choices: [
        { t: "Pay it, with the old arrears ({fee2} suns)", req: (p, C, ctx) => p.coin >= (ctx.fee2 || 36),
          r: "Your steward counts it out of the strongbox with a face like a funeral. The chancery files your name under the willing, a little late.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee2 || 36)); return apply(p, ctx, { favor: 10 }); } },
        { t: "Refuse again, in your own hand",
          r: "No war, no shield-money, and your seal under it. The clerk carries it home as if it might bite.",
          fx: { favor: -20, honor: 3, flag: "mwf_refused_twice" } },
        { t: "Ride to court and plead the old custom", check: { s: "etiquette", s2: "diplomacy", d: 55 },
          win: { r: "The keeper of the rolls finds a precedent from your grandfather's time. The writ is withdrawn, for this year.", fx: { favor: -2, fame: 2, skill: { etiquette: 2 } } },
          lose: { r: "The court hears you out and adds a fine for wasting its time.", fx: (p, ctx) => { p.coin = Math.max(0, p.coin - Math.round((ctx.fee || 18) / 2)); return apply(p, ctx, { favor: -8 }); } } },
      ],
    },
    {
      id: "mwf_writ_third",
      title: "The third writ",
      cond: (p, C) => C.adult(p) && !C.ruler(p) && (C.noble(p) || rung(p) >= 2) && C.flag(p, "mwf_refused_twice") && A.S.year - p.flags.mwf_refused_twice >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { ctx.fee = cost(p, 30); },
      text: "The third writ does not come by a clerk. It comes with a royal serjeant and six riders who wait in your yard without dismounting. The sum is {fee} suns. Refuse a third time, the serjeant says, and he takes the keys of your best manor for the crown. Now. Today.",
      choices: [
        { t: "Pay, all of it, today", req: (p, C, ctx) => p.coin >= (ctx.fee || 30),
          r: "The serjeant counts it on your own table and writes a receipt, which goes into the strongbox where the money was.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee || 30)); return apply(p, ctx, { favor: 5, happy: -4 }); } },
        { t: "Hand him the keys",
          r: "You give up the keys in front of your household. Lords who hate the writs hear of it. Some of them write to you.",
          fx: { coinPct: -0.25, honor: 5, fame: 2, favor: -10, trait: "proud", deed: "Gave up a manor rather than pay the shield-money" } },
        { t: "Bar the gate against the crown's men", check: { s: "command", s2: "intimidation", d: 60 },
          win: { r: "The serjeant counts your crossbows and rides away. Every lord who hates the writs drinks your health. The crown writes your name in a different book.", fx: { fame: 5, favor: -30, factionDisc: 10 } },
          lose: { r: "Your own men will not draw on the crown's serjeant. You ride to the capital between two of his riders.", fx: { prison: 1, why: "defying the crown's writ", favor: -20 } } },
      ],
    },

    // ===================== ct_faction: joined a court party
    {
      id: "mwf_faction_vote",
      title: "The party's price",
      cond: (p, C) => C.adult(p) && !C.ruler(p) && (C.noble(p) || p.status === "gentry" || rung(p) >= 2) && C.flag(p, "ct_faction") && A.S.year - p.flags.ct_faction >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        ctx.rs = realmShort(p); yrs(p, ctx, "ct_faction");
        const v = A.genNoble(p.realm, "noble", null, A.ri(35, 60)); v.occ = "a lord of the council"; ctx.pid = v.id;
      },
      text: "{yrs} years since you chose a party at the court of {rs}. Now the party wants its price. Tomorrow the council votes on {themFull}, accused of selling grain to the enemy in a hard winter. You have eaten at {theirHis} table. The evidence is one letter, perhaps forged. Your party expects your voice.",
      choices: [
        { t: "Vote with your party",
          r: "The vote carries by two. {them} loses lands and office. Afterward {theyHe} passes you on the stairs without a word.",
          fx: { favor: 5, fame: 1, honor: -6, them: { type: "enemy", op: -50 } } },
        { t: "Speak against the charge",
          r: "You speak for a quarter of an hour and lose by three votes. Your party stops sending for you. {them} sends a cask of wine and a letter you keep.",
          fx: { honor: 6, favor: -8, unflag: "ct_faction", them: { type: "friend", op: 35 } } },
        { t: "Be ill tomorrow",
          r: "Both sides note the empty seat. Both are right about why.",
          fx: { honor: -2, happy: -2, them: { type: "acquaint", op: -10 } } },
      ],
    },
    {
      id: "mwf_faction_suit",
      title: "An old vote",
      cond: (p, C) => C.adult(p) && !C.ruler(p) && C.flag(p, "ct_faction") && A.S.year - p.flags.ct_faction >= 3 && C.hasRel(p, "rival", "enemy") && !!factionFoe(p),
      w: 2, once: true,
      setup: (p, ctx) => {
        const t = factionFoe(p); if (!t) { ctx.skip = 1; return; }
        ctx.pid = t.id; ctx.fee = cost(p, 15); ctx.rt = p.rel[t.id] && p.rel[t.id].type === "enemy" ? "enemy" : "rival";
      },
      text: "{them} became your {rt} the season you joined a court party and it lost the vote. Since then {theyHe} has risen. Now {theyHe} sits among the judges of your house's suit over a mill and a stretch of river. {theyHe} sends word that the suit could go either way. Everything at court has a price.",
      choices: [
        { t: "Pay {them}'s price ({fee} suns)", req: (p, C, ctx) => p.coin >= (ctx.fee || 15),
          r: "The suit goes your way. You have paid someone who hates you to hate you a little less.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee || 15)); return apply(p, ctx, { them: { op: 20 } }); } },
        { t: "Find something on {themHim} first", check: { s: "intrigue", s2: "ins", d: 55 },
          win: { r: "{them}'s steward drinks, and talks. The suit goes your way and costs nothing. {them} knows why.", fx: { owed: 1, skill: { intrigue: 3 }, them: { op: -10 } } },
          lose: { r: "{them} learns you were digging. The suit goes against you, and the mill with it.", fx: { coinPct: -0.1, them: { op: -20 }, happy: -4 } } },
        { t: "Go to {themHim} in person and make peace", check: { s: "diplomacy", s2: "etiquette", d: 50 },
          win: { r: "An hour, a jug of wine, and an apology for a vote neither of you remembers well. {them} shakes your hand. The suit is fairly heard.", fx: { them: { type: "acquaint", op: 35 }, honor: 2 } },
          lose: { r: "{them} keeps you waiting two hours in an anteroom and then sends a servant to say {theyHe} is out.", fx: { them: { op: -10 }, happy: -5 } } },
      ],
    },

    // ===================== ct_party: built a quiet party at court, or kept the names of three lords
    {
      id: "mwf_party_cell",
      title: "Names kept",
      cond: (p, C) => C.adult(p) && !C.ruler(p) && (C.noble(p) || p.status === "royal") && C.flag(p, "ct_party") && A.S.year - p.flags.ct_party >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const ev = p.flags.ev || {};
        const lords = ev.ct_claim_throne && (!ev.ct_sibling_throne || ev.ct_claim_throne >= ev.ct_sibling_throne);
        ctx.how = lords ? "the three great lords who came to your hall by night with their hoods up" : "the lords you gathered at court, quietly, who would follow you if the day came";
        const q = A.genNoble(p.realm, "noble", null, A.ri(35, 60), "M"); q.occ = "a great lord in debt"; ctx.pid = q.id;
        ctx.fee = cost(p, 25);
      },
      text: "You kept the names of {how}. One of them, {themFull}, is in the crown's prison for debt, and talking to his confessor. The confessor comes to you. Pay his debts, he says, or {them} will buy his own way out with the only coin he has left: your name.",
      choices: [
        { t: "Pay his debts in secret ({fee} suns)", req: (p, C, ctx) => p.coin >= (ctx.fee || 25),
          r: "The debts are paid by a merchant who has never heard of you. {them} walks out into the rain and sends no thanks.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee || 25)); return apply(p, ctx, { them: { type: "acquaint", op: 30 }, owed: 2 }); } },
        { t: "Go to the sovereign first and confess the meeting",
          r: "You kneel and tell it all. The sovereign thanks you coolly. {them} is moved to a deeper cell. The rest of your list burn their letters, and their friendship with you.",
          fx: { favor: 15, unflag: "ct_party", them: { type: "enemy", op: -60 } } },
        { t: "Let him talk, and deny everything", check: { s: "intrigue", s2: "deception", d: 55 },
          win: { r: "His word against yours, and he is a debtor in a cell. The crown chooses to believe you, this time.", fx: { favor: -5, skill: { intrigue: 2 }, them: { type: "enemy", op: -30 } } },
          lose: { r: "The crown believes him. You are not arrested, only watched, and kept from court for a year.", fx: { favor: -25, fame: -2, them: { type: "enemy", op: -30 } } } },
      ],
    },

    // ===================== disinherited: cut out of the inheritance, or walked out
    {
      id: "mwf_disinherit_stairs",
      title: "The same lawyer",
      cond: (p, C) => C.adult(p) && C.flag(p, "disinherited") && A.S.year - p.flags.disinherited >= 3 && C.parentsAlive(p),
      w: 3, once: true,
      setup: (p, ctx) => {
        const par = (p.parents || []).map(A.P).find(q => q && q.alive); if (!par) { ctx.skip = 1; return; }
        ctx.pid = par.id; yrs(p, ctx, "disinherited");
      },
      text: "{yrs} years since the solar, the shut door and the lawyer waiting in the next room. Now {themFull} has had a seizure and cannot climb stairs, and sends for you, not for the heir. The same lawyer is waiting in the next room. \"He can write it either way,\" {theyHe} says. \"Tell me why he should.\"",
      choices: [
        { t: "Ask, plainly, to be written back in", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The lawyer writes. Your name goes back on the page, above the heir's. The heir hears of it by supper.", fx: (p, ctx) => join(apply(p, ctx, { unflag: "disinherited", them: { op: 20 } }), mkFoe(p, "rival", -30, "the heir", { who: heirOf(p) })) },
          lose: { r: "{them} hears you out and sends the lawyer home. Nothing changes but the stairs.", fx: { them: { op: -10 }, happy: -4 } } },
        { t: "Refuse the land. Ask only for peace",
          r: "You sit by the bed and talk about horses. The lawyer goes home with nothing written, and something else is mended.",
          fx: { them: { op: 30 }, honor: 4, wil: 1, happy: 4 } },
        { t: "Tell {themHim} the heir is robbing the estate", check: { s: "intrigue", s2: "int", d: 55 },
          win: { r: "You have the steward's figures, more or less. The lawyer writes you back in and the heir out. It may even be true.", fx: (p, ctx) => join(apply(p, ctx, { unflag: "disinherited", honor: -6 }), mkFoe(p, "enemy", -50, "the heir", { who: heirOf(p) })) },
          lose: { r: "{them} knows the steward's figures better than you do. \"Still a liar,\" {theyHe} says. \"Good. I was afraid you had changed.\"", fx: { them: { op: -30 }, honor: -4 } } },
      ],
    },
    {
      id: "mwf_disinherit_heir",
      title: "A borrowed horse",
      cond: (p, C) => C.adult(p) && C.flag(p, "disinherited") && A.S.year - p.flags.disinherited >= 8 && p.coin >= 60,
      w: 2, once: true,
      setup: (p, ctx) => {
        const sib = live(p, ["sibling"]).map(x => x.p).filter(x => A.isAdult(x));
        const t = sib.length ? sib[0] : mk(p, { ageAdj: C.ageAdj(p) + A.ri(-6, 6), occ: "the heir of your old house" });
        ctx.pid = t.id; ctx.fee = Math.max(30, Math.min(Math.round(p.coin * 0.4), cost(p, 20)));
        ctx.fee2 = ctx.fee * 2; ctx.land = rung(p) >= 2 ? "manor" : "farm"; yrs(p, ctx, "disinherited");
      },
      text: "{yrs} years ago you were cut out of the inheritance. You made your own way. Today {them}, who got your share, rides into your yard on a borrowed horse. The land is mortgaged, the roof leaks, and the moneylenders want {fee} suns by quarter day. {theyHe} had nowhere else to go.",
      choices: [
        { t: "Lend the money, at interest", req: (p, C, ctx) => p.coin >= (ctx.fee || 30),
          r: "{them} signs your note in a shaking hand. The land is still {theirHis}. The debt is yours to call.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee || 30)); return apply(p, ctx, { them: { op: 10 }, owed: 2 }); } },
        { t: "Buy the land outright, at a hard price ({fee2} suns)", req: (p, C, ctx) => p.coin >= (ctx.fee2 || 60),
          r: "You buy back what was taken, at a price that makes {them} weep. The tenants doff their caps to you now.",
          fx: (p, ctx) => { p.coin = Math.max(0, p.coin - (ctx.fee2 || 60)); link(p, T(ctx), "rival", -30); return apply(p, ctx, { asset: ctx.land === "manor" ? "manor" : "farm", trait: "vengeful" }); } },
        { t: "Send {themHim} away empty-handed",
          r: "{them} rides off on the borrowed horse. By spring you hear the moneylenders have taken the roof.",
          fx: (p, ctx) => { link(p, T(ctx), "enemy", -40); return apply(p, ctx, { wil: 1, honor: -2 }); } },
      ],
    },

    // ===================== ct_charter: kept an old charter as a bargaining chip
    {
      id: "mwf_charter_price",
      title: "Paper is patient",
      cond: (p, C) => C.adult(p) && C.literate(p) && (C.noble(p) || rung(p) >= 2) && C.flag(p, "ct_charter") && A.S.year - p.flags.ct_charter >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        const h = rivalHouse(p);
        ctx.house = h ? h.name : "the house that holds it";
        const q = A.genNoble(p.realm, "noble", h ? h.id : null, A.ri(30, 55)); q.occ = "a steward of " + ctx.house; ctx.pid = q.id;
        ctx.fee = cost(p, 40); ctx.fee3 = Math.round(ctx.fee * 1.5);
      },
      text: "The charter still lies in its oilcloth: the cracked royal seal, the grant to your house forever. Paper is patient, you said. Now {house} holds what the charter names, and {house} has a daughter to marry and a lawsuit it cannot afford. Its steward, {themFull}, comes to your hall to ask, very politely, what the paper would cost.",
      choices: [
        { t: "Sell it for {fee} suns",
          r: "{them} pays in good coin and burns the charter in your own hearth, to be sure. Your steward watches the seal crack.",
          fx: (p, ctx) => { p.coin += ctx.fee || 40; return apply(p, ctx, { them: { type: "acquaint", op: 15 } }); } },
        { t: "Trade it for a debt their house owes yours",
          r: "{them} gives you the house's word, before witnesses, that it owes you two favors of your choosing. The charter goes into their strongbox unburned.",
          fx: { them: { type: "acquaint", op: 10 }, owed: 2, skill: { intrigue: 2 } } },
        { t: "Press the claim now, while they are weak", check: { s: "learning", s2: "diplomacy", d: 52 },
          win: { r: "The chancery finds the seal good. {house} pays a compensation it can ill afford, and remembers you in its prayers, unkindly.", fx: (p, ctx) => { p.coin += ctx.fee3 || 60; return apply(p, ctx, { fame: 3, them: { type: "enemy", op: -40 } }); } },
          lose: { r: "{house} produces a later charter with a better seal. You have made enemies for nothing.", fx: { favor: -5, them: { type: "enemy", op: -40 } } } },
      ],
    },
  ]);
})();
