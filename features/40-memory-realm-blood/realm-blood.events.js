// Memory callbacks for the "realm-blood" chunk (features/40-memory-realm-blood).
//
// The release has 29 flags in this chunk that an event SETS and nothing ever READS: the iron ring of
// Oathfather's Day, the half-orc's land license, the iron bar on the Iron Road, the Founding petition, the
// Greyhaven diving test, the fled debt of Ostra, the count of the years, the Palella wheel, the Rememberers,
// the Oil Shore, the Still Hall, the Old Toll, the heat tally and the walled dragon of Emberdeep, the rhino
// spear, the Dusk School, Ash Night, six bloodline tests (Falcone, Doravelli, Harrow, Montaro, Longwind,
// the Quickened, the Lightfoot), the military-family proving and papers, and a grandparent's last story.
//
// Rules kept here (see README.md):
//   - every cond reads its flag with C.flag(p, "x") AND times it with A.S.year - p.flags.x >= N (N 2..20);
//   - every event keeps the setter's world: the realm (or faith) for local customs, the blood for bloodlines,
//     the military family for the family events, and an age-fit stage gate;
//   - every event has at least one branch that leaves a lasting mark (trait, flag, relation, wound, deed,
//     debt, prison, job, a sworn tie, the loss of the original token);
//   - flags set here start with mrb_ and are read again by a second event years later (the two-step arcs).
//     The choice that opens an arc also books the reckoning with A.schedule, in case the dice are slow; the
//     booked copy re-checks the cond when it falls due and drops itself if the player has already seen it.
(() => {
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // years since a flag was set (0 when it is missing, so text never shows NaN)
  const yrs = (p, f) => { const y = p && p.flags ? p.flags[f] : null; return typeof y === "number" ? Math.max(0, A.S.year - y) : 0; };
  const count = (n, unit) => { n = Math.max(1, Math.round(n) || 1); return (NUM[n] || String(n)) + " " + unit + (n === 1 ? "" : "s"); };
  const ago = (p, f) => count(yrs(p, f), "year");
  const say = (...parts) => parts.filter(Boolean).join(" ");
  const more = (p, ctx, fx) => A.applyFx(p, fx, ctx) || "";

  // A lore figure from LORE.cast, brought into the world once (A.S.castMap keeps each one unique).
  const cast = (p, ctx, cid) => {
    let q = null;
    try { q = A.personFromCast(cid); } catch (e) { q = null; }
    if (!q || !q.alive || q.id === p.id) return null;
    ctx.pid = q.id;
    return q;
  };
  // Is a lore figure alive, without creating them?
  const castAlive = cid => {
    const id = A.S.castMap && A.S.castMap[cid];
    if (id) { const q = A.P(id); return !!(q && q.alive); }
    const c = LORE.cast && LORE.cast[cid];
    return !!c && !c.died;
  };
  // Someone new, made to fit the story. o.age is in human years and is scaled to the race; o.realm picks the
  // culture (a Varennan captain in Sabra gets a Varennan name).
  const make = (p, ctx, o = {}) => {
    const race = o.race || p.race, from = o.realm || p.realm, sex = o.sex || (A.chance(0.5) ? "M" : "F"), st = o.status || "peasant";
    const same = race === p.race && from === p.realm;
    const cult = same ? p.cult : A.cultureFor(race, from), faith = same ? p.faith : A.faithFor(race, from);
    const hAge = o.age != null ? o.age : Math.min(70, A.age(p) * 16 / GD.RACES[p.race].adult);
    const age = Math.max(1, Math.round(hAge * GD.RACES[race].adult / 16));
    const q = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm: p.realm, cult, faith, born: A.S.year - age, status: st, home: p.home });
    if (o.sur) { q.sur = o.sur; q.surMode = "house"; }
    else { const fn = A.familyName({ cult, realm: from, status: st, home: p.home, sex }); if (fn) { q.sur = fn.sur; q.surMode = fn.mode; } }
    q.occ = o.occ || (A.isAdult(q) ? A.pick(A.OCC[st] || A.OCC.peasant) : "");
    if (ctx) ctx.pid = q.id;
    return q;
  };
  // Make someone and tie them to the player at once; returns the engine-style note "(Name is your enemy now)".
  const bond = (p, o, type, op) => {
    const q = make(p, null, o);
    const back = type === "student" ? "mentor" : type === "mentor" ? "student" : type;
    A.link(p, q, type, op, back);
    return `(${q.given} ${type === "enemy" ? "is your enemy now" : type === "rival" ? "is your rival now" : "becomes your " + type})`;
  };
  // An arc that needs the same person years later marks the relation; the second step finds it again.
  const mark = (p, q, tag) => { if (q && p.rel[q.id]) p.rel[q.id].mrb = tag; };
  const marked = (p, ctx, tag) => {
    const x = A.relsOf(p).find(r => r.r && r.r.mrb === tag && r.p.alive && r.p.id !== p.id);
    if (x && ctx) ctx.pid = x.p.id;
    return x ? x.p : null;
  };
  const kill = (ctx, cause) => { const q = ctx && ctx.pid ? A.P(ctx.pid) : null; if (q && q.alive) A.kill(q, cause, true); };
  // Story-cycle insurance for the arcs (see the header). fresh() keeps a booked copy from firing twice.
  const later = (ev, years) => A.schedule({ type: "event", ev }, Math.round((years + A.rf(0, 2)) * 365));
  const fresh = (p, id) => !(p.flags.ev && p.flags.ev[id] != null);
  const addDebt = (p, n) => { p.debt = Math.max(0, Math.round((p.debt || 0) + n)); };
  // Children of the player
  const kids = p => A.relsOf(p, ["child"]).map(x => x.p).filter(k => k.alive);
  const grownKid = p => kids(p).filter(k => A.isAdult(k)).sort((a, b) => a.born - b.born)[0] || null;
  const kidAged = (p, lo, hi) => kids(p).filter(k => A.age(k) >= lo && A.age(k) <= hi).sort((a, b) => b.born - a.born)[0] || null;
  // Bloodlines: the tag of a person's line, shown or hidden (C.blood only sees a shown or always-on line).
  const line = (p, tag) => !!(p && p.blood && GD.BLOOD[p.blood.id] && GD.BLOOD[p.blood.id].tag === tag);
  const shows = (p, tag) => line(p, tag) && !!p.blood.show;
  const he = q => (q && q.sex === "F" ? "she" : "he"), his = q => (q && q.sex === "F" ? "her" : "his");
  // The military family (the same tokens the release's family events use)
  const prepF = (p, ctx) => {
    const f = A.family(p), m = f && f.military ? f.military : null;
    ctx.fsur = f && f.sur ? f.sur : (p.sur || "child of this house");
    let u = m && m.unit ? String(m.unit).split(",")[0].trim() : "the family company";
    if (/^a /i.test(u)) u = "the " + u.slice(2);
    if (!/^the /i.test(u)) u = "the " + u;
    ctx.funit = u;
    ctx.seat = f && f.seat ? f.seat : A.provName(p.home);
    ctx.since = f && f.since ? String(f.since) : "the founding fight";
    const hp = f && f.headPid ? A.P(f.headPid) : null;
    ctx.head = hp && hp.alive && hp.id !== p.id ? A.fullName(hp) : "the head of the family";
    ctx.Head = cap(ctx.head);
  };
  // Join the family's company (or any company the realm keeps); returns the result text.
  const enlistFam = (p, ctx, ok, no) => {
    if (p.mil) return ok;
    let r = null;
    try { r = A.enlist(p, false); } catch (e) { r = null; }
    if (!p.mil) return say(no, r && r.msg ? r.msg : "");
    if (ctx.funit) p.mil.unit = ctx.funit;
    return ok;
  };
  // Ostra: forty suns at twelve in the hundred, compounded since the night you fled
  const oweOstra = p => Math.round(40 * Math.pow(1.12, Math.min(40, yrs(p, "rl_os_fled"))));
  // The rhino: did the beast fight after the flag end in a kill? (the engine writes "Killed <beast>" deeds)
  const rhinoKilled = p => (p.deeds || []).some(d => /rhino/i.test(d.t || "") && Math.abs((d.y || 0) - (p.flags.rl_tk_faced || 0)) <= 1);
  // A grandparent (prefer the dead one: the setter is "the last story")
  const grandOf = (p, ctx) => {
    const gs = A.relsOf(p, ["grandparent"]).map(x => x.p);
    const g = gs.find(q => !q.alive) || gs[0] || null;
    ctx.gp = g ? g.given : "your grandmother";
    ctx.gpHe = g ? he(g) : "she";
    ctx.gpHis = g ? his(g) : "her";
    return g;
  };

  A.defEvents([
    // ================================================================== Aldmark (POL-01)

    // rl_ald_sworn: swore plainly on the iron ring in the timber hall on Oathfather's Day; an iron ring on the thumb
    {
      id: "mrb_ald_witness",
      title: "A witness on the iron",
      cond: (p, C) => C.realm(p, "POL-01") && C.adult(p) && C.flag(p, "rl_ald_sworn") && A.S.year - p.flags.rl_ald_sworn >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", occ: "a carter" }); },
      text: p => `${cap(ago(p, "rl_ald_sworn"))} ago you laid your palm on the iron ring in ${A.provName(p.home)}'s timber hall, and {themFull} swore beside you. Now he stands before the Oath Moot. He swore on iron to pay a lord for a horse, then sold the horse. He asks you to swear on the iron that he paid. A sworn householder's word carries weight. If his case fails, the Fairrush takes him.`,
      choices: [
        { t: "Swear on the iron that he paid", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "The Moot believes the iron ring on your thumb. {them} walks out free and grips your arm at the door, hard, like a man pulled out of water.",
            fx: (p, ctx) => { later("mrb_ald_witness_due", 4); const s = more(p, ctx, { them: { type: "friend", op: 15 }, honor: -4, owed: 2, flag: "mrb_ald_falsewit" }); mark(p, A.P(ctx.pid), "ald_witness"); return s; } },
          lose: { r: "The hall-priest has the lord's tally, and the tally says unpaid. Your oath is false before the whole Moot. They take your ring. {them} goes to the river, and you go to the cells for a season.",
            fx: (p, ctx) => { kill(ctx, "drowned in the Fairrush for a broken oath"); return more(p, ctx, { unflag: "rl_ald_sworn", honor: -10, prison: 1, why: "a false oath at the Oath Moot" }); } } },
        { t: "Tell the Moot the truth",
          r: "You tell it plainly: no silver, a sold horse. {them} does not look at you. The guards walk him down to the black water below the Oath Hall. His brother spits at your door that night.",
          fx: (p, ctx) => { kill(ctx, "drowned in the Fairrush for a broken oath"); return more(p, ctx, { honor: 3, favor: 3, newRel: { type: "enemy", op: -35 } }); } },
        { t: "Stay away from the Moot",
          r: "You plead a sick cow and pay the two-sun fine. Without your word the Moot is merciful by its lights: it takes his land, not his life. {them} blames you for that, not the Moot.",
          fx: { coin: -2, favor: -2, them: { type: "enemy", op: -30 } } },
      ],
    },
    // arc: mrb_ald_falsewit -> the man you swore for breaks a second oath
    {
      id: "mrb_ald_witness_due",
      title: "The second horse",
      cond: (p, C) => C.realm(p, "POL-01") && C.adult(p) && C.flag(p, "mrb_ald_falsewit") && A.S.year - p.flags.mrb_ald_falsewit >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_ald_witness_due") || !marked(p, ctx, "ald_witness")) ctx.skip = 1; },
      text: p => `${cap(ago(p, "mrb_ald_falsewit"))} ago you swore on the iron that {themFull} paid for a lord's horse. Now he has done it again: a second horse, a second oath, a second sale. This time the hall-priest is careful. He has found the lord's tally from that first year. Your mark is in it, beside the word paid.`,
      choices: [
        { t: "Confess the false oath to the hall-priest",
          r: "The priest draws the iron ring off your thumb himself. You pay the lord a horse's price. He lets you keep your life, which the law does not oblige him to do. {them} goes to the river alone.",
          fx: (p, ctx) => { kill(ctx, "drowned in the Fairrush for a broken oath"); return more(p, ctx, { unflag: "rl_ald_sworn", coin: -30, honor: 4, untrait: "deceitful", favor: -3 }); } },
        { t: "Swear again that he paid", check: { s: "deception", s2: "wil", d: 58 },
          win: { r: "The tally is old and the ink is brown. The priest lets it lie, and {them} walks free a second time. Two lies bind you to him now, and he knows it.",
            fx: { honor: -6, trait: "deceitful", them: { op: 10 } } },
          lose: { r: "Two false oaths are a habit, not a slip. The Moot gives {them} to the river and you to the cells, and the iron ring goes back into the hall-priest's box.",
            fx: (p, ctx) => { kill(ctx, "drowned in the Fairrush for a broken oath"); return more(p, ctx, { unflag: "rl_ald_sworn", honor: -12, prison: 2, why: "two false oaths at the Oath Moot" }); } } },
        { t: "Stand up at the Moot and name him first",
          r: "You speak before the priest can ask. {them} hears you out with his head down. The Moot fines you ten suns for the old lie and thanks you for the new truth. The river takes him at dusk.",
          fx: (p, ctx) => { kill(ctx, "drowned in the Fairrush for a broken oath"); return more(p, ctx, { coin: -10, honor: 1, favor: 3, newRel: { type: "enemy", op: -30 } }); } },
      ],
    },
    {
      id: "mrb_ald_ring_heir",
      title: "The iron ring, worn thin",
      cond: (p, C) => C.realm(p, "POL-01") && C.old(p) && C.hasKids(p) && C.flag(p, "rl_ald_sworn") && A.S.year - p.flags.rl_ald_sworn >= 15 && !!grownKid(p),
      w: 2, once: true,
      setup: (p, ctx) => { const k = grownKid(p); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: p => `The plain iron ring from that Oathfather's Day has worn a groove in your thumb over ${ago(p, "rl_ald_sworn")}. This New Year {them} must lay a palm on the iron in the timber hall and swear to the new lord, who has fenced the common pasture. {theyHe} asks how you swore, that first time. You remember the cold of the iron, and the warm words.`,
      choices: [
        { t: "Tell {themHim} to swear plainly, as you did",
          r: "{them} swears plainly. The priest slips an iron ring onto {theirHis} thumb, and the two of you walk home through the snow with matching hands.",
          fx: { them: { op: 12 }, honor: 1, piety: 1 } },
        { t: "Give {themHim} your own ring to swear on",
          r: "The hall-priest frowns at an old ring on a young thumb, then allows it. Iron is iron. Your own thumb looks naked for a month, then less so.",
          fx: { them: { op: 22 }, piety: 2, unflag: "rl_ald_sworn", deed: "Gave the iron ring of the hall to a grown child" } },
        { t: "Tell {themHim} about the pasture, and to refuse",
          r: "{them} refuses before the whole hall, and the reeve writes the name down in his slow hand. At Michaelmas the new lord's men count your sheep twice.",
          fx: { them: { op: 15 }, favor: -6, wil: 1, coin: -10 } },
      ],
    },

    // rl_ald_lic: bought a lord's license from Lord Harrow's clerk for 25 suns (knife yes, land no)
    {
      id: "mrb_ald_lic_land",
      title: "A field in another man's name",
      cond: (p, C) => C.realm(p, "POL-01") && C.race(p, "halforc", "orc") && C.adult(p) && C.flag(p, "rl_ald_lic") && A.S.year - p.flags.rl_ald_lic >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-01", sex: "M", occ: "a freeholder of the Copperham road" }); },
      text: "The license you bought from Lord Harrow's clerk for 25 suns has gone soft as cloth inside your shirt. It lets you carry a knife. It does not let you own the field you plough on the Copperham road. {themFull}, a human freeholder, offers to buy the field in his own name with your silver, and let you work it as yours. The License Law has no word for that.",
      choices: [
        { t: "Count your silver into his hand (60 suns)", req: p => p.coin >= 60,
          r: "Sixty suns across his table. He makes his mark on the deed, and the field is his on parchment and yours in the furrow.",
          fx: (p, ctx) => { later("mrb_ald_lic_heir", 5); const s = more(p, ctx, { coin: -60, them: { type: "friend", op: 20 }, flag: "mrb_ald_strawdeed" }); mark(p, A.P(ctx.pid), "ald_straw"); return s; } },
        { t: "Petition Lord Harrow's clerk for a land license (40 suns)", req: p => p.coin >= 40, check: { s: "persuasion", s2: "int", d: 56 },
          win: { r: p => `A month, 40 suns, and a second line under your name in the clerk's book: to hold land. You may be the first ${p.race === "orc" ? "orc" : "half-orc"} on the march to read those words.`,
            fx: { coin: -40, honor: 2, deed: "Licensed to hold land in the Southern March" } },
          lose: { r: "The clerk keeps the 40 suns as a reading fee. The answer, he says, is in the License Law of 1053. He reads it to you, slowly.",
            fx: { coin: -40, wil: 1 } } },
        { t: "Let him buy it on credit, against your harvests", req: p => p.coin < 60,
          r: "He takes your mark on a debt-tally for sixty suns, to be paid out of your harvests. The field is his on parchment and yours in the furrow, and you owe him for it.",
          fx: (p, ctx) => { later("mrb_ald_lic_heir", 5); addDebt(p, 60); const s = more(p, ctx, { them: { type: "friend", op: 15 }, flag: "mrb_ald_strawdeed" }); mark(p, A.P(ctx.pid), "ald_straw"); return s; } },
        { t: "Keep renting, and keep your silver",
          r: "You plough another man's field another year. The rent goes up at Michaelmas, as it does for everyone, and a little more for you.",
          fx: { happy: -2, wil: 0.5 } },
      ],
    },
    // arc: mrb_ald_strawdeed -> the field held in another's name is seized for his debts
    {
      id: "mrb_ald_lic_heir",
      title: "Whose field",
      cond: (p, C) => C.realm(p, "POL-01") && C.adult(p) && C.flag(p, "mrb_ald_strawdeed") && A.S.year - p.flags.mrb_ald_strawdeed >= 4,
      w: 3, once: true,
      setup: (p, ctx) => {
        if (!fresh(p, "mrb_ald_lic_heir")) { ctx.skip = 1; return; }
        if (!marked(p, ctx, "ald_straw")) { make(p, ctx, { race: "human", realm: "POL-01", sex: "F", occ: "a freeholder's widow" }); ctx.widow = 1; }
      },
      text: (p, ctx) => ctx.widow
        ? `The freeholder who held your field in his name is dead of a winter fever. His widow, {themFull}, owes a Copperham wool-buyer, and the buyer's men are seizing everything in her late husband's name. That includes the field you bought with your silver and have ploughed for ${ago(p, "mrb_ald_strawdeed")}. Under the License Law you cannot stand in court as its owner.`
        : `{themFull} owes a Copperham wool-buyer more than he can pay, and the buyer's men are seizing everything in his name. That includes the field you bought with your silver and have ploughed for ${ago(p, "mrb_ald_strawdeed")}. On parchment it is his. Under the License Law of 1053 you cannot even stand in court as its owner.`,
      choices: [
        { t: "Pay off the wool-buyer (50 suns)", req: p => p.coin >= 50,
          r: "You pay a debt that is not yours, to keep a field that is not yours. The buyer's men leave. {them} swears on the iron to repay you by Lady Day.",
          fx: { coin: -50, owed: 2, them: { op: 15 } } },
        { t: "Take it before the hundred court", check: { s: "persuasion", s2: "int", d: 58 },
          win: { r: "The court will not hear you on land, but it hears {them} admit whose silver bought the field. The judge writes you a lease for life. It is almost a deed.",
            fx: { honor: 3, fame: 2, deed: "Won a life lease at the hundred court" } },
          lose: { r: "The court will not hear you at all. The field goes to the wool-buyer. At the door the spearmen ask to see your license, and laugh at it.",
            fx: { happy: -8, wil: 2, them: { op: -15 }, unflag: "mrb_ald_strawdeed" } } },
        { t: "Walk off the field and hire on as a drover",
          r: "You hand the plough to the buyer's man and take the march road behind someone else's cattle. The license still lets you carry a knife.",
          fx: { happy: -5, wil: 1, job: "herd", unflag: "mrb_ald_strawdeed" } },
      ],
    },

    // ================================================================== Irondeep (POL-10)

    // rl_id_thief: took a third of an iron bar the carters buried in the snow beside the Iron Road
    {
      id: "mrb_id_tally",
      title: "One bar short",
      cond: (p, C) => C.realm(p, "POL-10") && C.adult(p) && C.flag(p, "rl_id_thief") && A.S.year - p.flags.rl_id_thief >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { ctx.ulla = cast(p, ctx, "CHR-0084") ? 1 : 0; if (!ctx.ulla) make(p, ctx, { race: "dwarf", sex: "F", age: 50, occ: "a tally-clerk of the Iron Road" }); },
      text: (p, ctx) => `The dwarven tally-clerks of the Iron Road count every bar, and they never stop counting. ${ctx.ulla ? "Trade-Warden {themFull}" : "{themFull}, a tally-clerk with a ledger chained to her belt,"} has found the winter, ${ago(p, "rl_id_thief")} ago, when the carts reached Eagleburg one bar short. One of the two carters sits in the cells. He has named you as the one who took a third of the buried bar.`,
      choices: [
        { t: "Repay the bar threefold (36 suns)", req: p => p.coin >= 36,
          r: "{them} enters the payment in the same column as the theft. \"Paid,\" she says. In Irondeep that word is carved too, under the other one.",
          fx: { coin: -36, honor: 3, them: { op: 10 }, unflag: "rl_id_thief" } },
        { t: "Call the carter a liar", check: { s: "deception", s2: "wil", d: 52 },
          win: { r: "Your word against a thief in chains. The Factors of the Iron Road believe you, and the carter is flogged for both of you.",
            fx: (p, ctx) => say(more(p, ctx, { honor: -5, skill: { deception: 2 } }), bond(p, { race: "human", sex: "M", occ: "a carter of the Iron Road" }, "enemy", -45)) },
          lose: { r: "{them} lays the carter's tally beside the clerks' own. The Law-Carvers fine you in metal and cut your name into the tally of shame.",
            fx: { punish: "theft", honor: -4 } } },
        { t: "Offer to be her eyes on the Iron Road", check: { s: "persuasion", s2: "ins", d: 46 },
          win: { r: "\"A thief who counts,\" {them} says. \"Useful.\" Your debt goes into her ledger instead of the Carvers'. You will pay it in names.",
            fx: (p, ctx) => { later("mrb_id_eyes_road", 3); return more(p, ctx, { oweThem: 2, skill: { intrigue: 2 }, flag: "mrb_id_eyes" }); } },
          lose: { r: "She does not bargain with thieves. You repay the bar threefold and lose a winter's carting besides.",
            fx: { coin: -36, happy: -4, them: { op: -10 } } } },
      ],
    },
    // arc: mrb_id_eyes -> the debt in names falls due
    {
      id: "mrb_id_eyes_road",
      title: "The other carter",
      cond: (p, C) => C.realm(p, "POL-10") && C.adult(p) && C.flag(p, "mrb_id_eyes") && A.S.year - p.flags.mrb_id_eyes >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_id_eyes_road")) { ctx.skip = 1; return; } make(p, ctx, { race: "human", sex: "M", occ: "a carter of the Iron Road" }); },
      text: "Snow on the Iron Road again, and a bar missing from a cart again. You know whose hands: {themFull}, the second carter from that night, the one who buried the bar and gave you your third. He has three children in Eagleburg now. The Trade-Warden's ledger holds your debt, to be paid in names. This is a name.",
      choices: [
        { t: "Give his name to the Trade-Warden",
          r: "{them} loses his contract, and in Irondeep that is for 300 years. Your line in the ledger is struck through with one neat stroke.",
          fx: { unflag: "mrb_id_eyes", coin: 8, honor: -3, them: { type: "enemy", op: -50 } } },
        { t: "Warn him off the road",
          r: "He goes white, then thanks you, and is gone by morning with his children on a cart. The debt stays in the ledger. The Trade-Warden will ask why the road went quiet.",
          fx: { honor: 2, them: { type: "friend", op: 30 } } },
        { t: "Make him put the bar back", check: { s: "intimidation", s2: "str", d: 50 },
          win: { r: "You find him at the cairn with a shovel. The bar goes back on the cart before dawn, the tally comes out right, and he hates you for it.",
            fx: { skill: { intimidation: 2 }, honor: 1, them: { type: "rival", op: -15 } } },
          lose: { r: "He swings the shovel first. You wake in the snow with a broken nose. The bar is gone, and so is he.",
            fx: { wound: "broken_nose", health: -8, cause: "a carter's shovel" } } },
      ],
    },

    // rl_id_petition: made your mark in the wax of the thane's petition at the Founding
    {
      id: "mrb_id_wax",
      title: "Wax becomes stone",
      cond: (p, C) => C.realm(p, "POL-10") && C.adult(p) && C.flag(p, "rl_id_petition") && A.S.year - p.flags.rl_id_petition >= 3,
      w: 2, once: true,
      setup: (p, ctx) => {
        const early = p.flags.rl_id_petition <= 1110; // the release's own early() test for this scene
        ctx.what = early ? "Thane Korrin's petition to declare his mother, Queen Brynja, unfit" : "a thane's petition against the Council of Masters";
        ctx.korrin = early && cast(p, ctx, "CHR-0088") ? 1 : 0;
        if (!ctx.korrin) make(p, ctx, { race: "dwarf", sex: "M", age: 50, occ: "a thane's man" });
      },
      text: (p, ctx) => `Your mark went into the wax ${ago(p, "rl_id_petition")} ago, at the Founding, on ${ctx.what}. In Irondeep wax becomes stone. The Law-Carvers will hear the petition in the great hall, and ${ctx.korrin ? "{themFull}" : "the thane"} wants every mark-maker standing below the dais when the carved law is read. Those who stand are cut into the stone record. Those who stay home are remembered another way.`,
      choices: [
        { t: "Stand in the hall with the thane's men",
          r: "You stand. The Law-Carver's chisel rings once for every name, and one ring is yours. Across the hall {them} gives you a nod, which costs nothing.",
          fx: (p, ctx) => { later("mrb_id_stone", 4); return more(p, ctx, { favor: -6, them: { op: 20 }, skill: { intrigue: 1 }, flag: "mrb_id_stood" }); } },
        { t: "Ask the Law-Carver to strike your mark", check: { s: "learning", s2: "int", d: 52 },
          win: { r: "You cite the clause on marks made in haste. The Carver smiles, very slightly, and scrapes your name from the wax before it can be cut.",
            fx: { unflag: "rl_id_petition", honor: 2, favor: 3, skill: { learning: 2 } } },
          lose: { r: "\"Wax becomes stone,\" says the Carver. \"You knew it when you pressed.\" Your mark stays, and now the thane's people know you tried to take it back.",
            fx: { them: { type: "enemy", op: -25 }, wil: 1 } } },
        { t: "Stay home with the door barred",
          r: "The hall fills without you. That night two of the thane's men stand outside your door for an hour, saying nothing at all, and then go.",
          fx: { them: { type: "enemy", op: -25 }, wil: 1, favor: 2 } },
      ],
    },
    // arc: mrb_id_stood -> the names in the stone are called to account
    {
      id: "mrb_id_stone",
      title: "Names in the stone",
      cond: (p, C) => C.realm(p, "POL-10") && C.adult(p) && C.flag(p, "mrb_id_stood") && A.S.year - p.flags.mrb_id_stood >= 4,
      w: 3, once: true,
      setup: (p, ctx) => {
        if (!fresh(p, "mrb_id_stone")) { ctx.skip = 1; return; }
        const r = A.realm("POL-10"), ru = r ? A.P(r.ruler) : null;
        ctx.won = ru && ru.castId === "CHR-0088" ? 1 : 0;
        make(p, ctx, { race: "dwarf", sex: "M", age: 60, occ: "the thane's steward" });
      },
      text: (p, ctx) => ctx.won
        ? "Thane Korrin rules Irondeep now, and the stone record of the Founding holds your name among those who stood for him. His steward, {themFull}, brings a gift: a place in the counting-halls. With it comes a second oath to carve, binding your heirs to the thane's line for as long as the stone stands."
        : "The stone record of the Founding holds your name among those who stood in the hall for the thane. The petition failed. The Council of Masters is clearing its halls of petitioners, one contract at a time. {themFull}, the thane's steward, offers you work in the thane's own hold, if you carve an oath binding your heirs to his line.",
      choices: [
        { t: "Carve the oath, for you and your heirs",
          r: "The chisel rings again. Your children are the thane's now, as you are. The work is steady and the halls are warm.",
          fx: (p, ctx) => say(more(p, ctx, { them: { type: "lord", op: 20 }, coin: 30, honor: -1 }), more(p, ctx, { sworn: 1 })) },
        { t: "Refuse. One oath in wax was enough",
          r: "The steward writes your refusal in a neat hand. Within a season your contracts in the hold go dark one by one, like lamps along a gallery.",
          fx: { coinPct: -0.2, wil: 1.5, honor: 2, them: { op: -20 } } },
        { t: "Go before the Law-Carvers and recant", check: { s: "diplomacy", s2: "wil", d: 55 },
          win: { r: "The Carvers allow a recantation, cut under your name in smaller letters. Both sides read it. Neither forgives it, and neither can use it.",
            fx: { favor: 4, honor: -2, deed: "Recanted before the Law-Carvers of Irondeep" } },
          lose: { r: "The Carvers will not cut a recantation for a petition already judged. You have shamed yourself before the hall for nothing, and the thane's people saw.",
            fx: { happy: -6, honor: -4, them: { type: "enemy", op: -30 } } } },
      ],
    },

    // ================================================================== Greyhaven (POL-14)

    // rl_gh_diver: as a child, touched the harbor floor at the Diving School and had your name marked
    {
      id: "mrb_gh_chain",
      title: "Down and back",
      cond: (p, C) => C.realm(p, "POL-14") && C.adult(p) && C.flag(p, "rl_gh_diver") && A.S.year - p.flags.rl_gh_diver >= 6,
      w: 2, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0094")) make(p, ctx, { sex: "F", age: 45, occ: "diver-master of the Diving School" }); },
      text: "As a child you held your breath until you saw stars, touched the harbor floor, and the diver-master marked your name. {themFull} has come for that name now. A cog sank across the harbor chain in last night's gale. The chain cannot be raised, and the herring fleet is waiting outside. Someone must go down in black water and cut her cable by feel before the tide turns.",
      choices: [
        { t: "Go down with a knife in your teeth", check: { s: "sea", s2: "sta", d: 52 },
          win: { r: "Down and back, four times. On the fourth the cable parts under your knife. The chain rises, the fleet comes in, and {them} writes your name in the Tide Divers' book.",
            fx: (p, ctx) => { later("mrb_gh_wreck", 4); return more(p, ctx, { skill: { sea: 3 }, fame: 2, them: { op: 15 }, deed: "Cut a sunken cog from the Greyhaven chain", flag: "mrb_gh_tide" }); } },
          lose: { r: "On the third dive something bursts in your left ear. You cut the cable on the fifth, and come up hearing the harbor through wool.",
            fx: (p, ctx) => { later("mrb_gh_wreck", 4); return more(p, ctx, { wound: "ear", health: -6, cause: "a burst ear on the harbor floor", skill: { sea: 2 }, flag: "mrb_gh_tide" }); } } },
        { t: "Send the young diver who is begging to go",
          r: "The girl goes down three times and comes up blue. On the fourth she cuts it. {them} does not speak to you for a month, and then only about tides.",
          fx: { them: { op: -15 }, honor: -2 } },
        { t: "Refuse. You left the water years ago",
          r: "{them} wipes your name off the Diving School's board with her thumb. Others raise the chain at noon, with a drowned diver laid out in the boat.",
          fx: { unflag: "rl_gh_diver", honor: -3, wil: 1, them: { op: -20 } } },
      ],
    },
    // arc: mrb_gh_tide -> the name in the Tide Divers' book draws a salvage offer
    {
      id: "mrb_gh_wreck",
      title: "The strongbox off Cold Bay",
      cond: (p, C) => C.realm(p, "POL-14") && C.adult(p) && C.flag(p, "mrb_gh_tide") && A.S.year - p.flags.mrb_gh_tide >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_gh_wreck")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 45, occ: "a salvage captain" }); },
      text: "Your name is in the Tide Divers' book for the cog you cut from the harbor chain, and {themFull}, a salvage captain, has read it. A Varennan wine ship went down off Cold Bay with a strongbox in her stern cabin. By the king's wreck-right it belongs to the crown. He offers you a third of whatever is inside, and a quiet boat on a moonless night.",
      choices: [
        { t: "Dive for the strongbox at night", check: { s: "sea", s2: "stealth", d: 55 },
          win: { r: "Black water, a drowned cabin, a box that will not come. Then it comes. The captain pays your third in Varennan silver, and neither of you mentions the crown.",
            fx: { coin: 120, honor: -5, skill: { sea: 2 }, secret: 1, them: { type: "friend", op: 20 } } },
          lose: { r: "The harbor watch sees your lamp on the water. You get a season in the cells for robbing a wreck, and the captain is somehow already at sea.",
            fx: { prison: 1, why: "robbing a wreck under the king's right", honor: -6, them: { type: "enemy", op: -30 } } } },
        { t: "Tell the diver-master",
          r: "The Tide Divers raise the box for the crown within the week. {them} loses his boat and his license, and curses you across the harbor whenever the tide brings him near.",
          fx: { favor: 3, honor: 2, them: { type: "enemy", op: -40 } } },
        { t: "Turn him down, and keep his secret",
          r: "He finds another diver within the week. The box comes up, someone is richer, and it is neither you nor the crown. He buys you a drink for your silence.",
          fx: { honor: 1, them: { op: 10 } } },
      ],
    },

    // ================================================================== Ostra (POL-16): no realm gate, because you fled it

    // rl_os_fled: fled over the river rather than pay forty suns at the great reckoning
    {
      id: "mrb_os_reader",
      title: "Your name in the churches",
      cond: (p, C) => C.adult(p) && C.flag(p, "rl_os_fled") && A.S.year - p.flags.rl_os_fled >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { realm: "POL-16", sex: "M", age: 40, occ: "a bank agent of Ostra" }); ctx.owe = oweOstra(p); },
      text: (p, ctx) => `${cap(ago(p, "rl_os_fled"))} ago you went over the river by night rather than pay forty suns at Ostra's great reckoning. Every New Year since, your name has been read aloud in Ostra's churches. Today a man in a black banker's cap finds you at {home}, wax tablet in hand. Forty suns at twelve in the hundred, compounded, is ${ctx.owe} suns. He is very polite about it.`,
      choices: [
        { t: "Pay all {owe} suns", req: p => p.coin >= oweOstra(p),
          r: "He scratches your name from the tablet and gives you a sealed quittance. Next New Year the reader will pass over you. In Ostra that is a kind of resurrection.",
          fx: (p, ctx) => more(p, ctx, { coin: -oweOstra(p), honor: 4, unflag: "rl_os_fled" }) },
        { t: "Sign a new bill at the lawful rate",
          r: "You sign. A fled debt is a crime; a signed one is only a debt, which in Ostra is the ordinary condition of a man. It grows quietly in a ledger you will never see.",
          fx: (p, ctx) => { later("mrb_os_bill_due", 4); addDebt(p, oweOstra(p)); return more(p, ctx, { honor: 1, flag: "mrb_os_bill" }); } },
        { t: "Pay the reader of names to forget you (15 suns)", req: p => p.coin >= 15, check: { s: "intrigue", s2: "persuasion", d: 50 },
          win: { r: "Fifteen suns, through the agent, to the reader. Next New Year your name is not read. The debt is still on the tablet, but a debt kept quiet is a different animal.",
            fx: { coin: -15, honor: -3, secret: 1 } },
          lose: { r: "The agent laughs. The reader is already paid by someone richer to forget someone else. Next New Year your name is read twice.",
            fx: { coin: -15, honor: -4, happy: -4, them: { type: "enemy", op: -20 } } } },
        { t: "Run again, before he calls the watch", check: { s: "stealth", s2: "spd", d: 48 },
          win: { r: "Out the back and over the fields before he has finished his sentence. Next New Year your name is read in Ostra again, with a new note beside it.",
            fx: { honor: -5, happy: -3, them: { type: "enemy", op: -25 } } },
          lose: { r: "He has two men at the back door. Ostra's banks hunt debtors better than the watch hunts murderers, and the Debtors' Tower has room.",
            fx: { punish: "debt", them: { op: -10 } } } },
      ],
    },
    // arc: mrb_os_bill -> the signed bill comes round at the next great reckoning
    {
      id: "mrb_os_bill_due",
      title: "The great reckoning, again",
      cond: (p, C) => C.adult(p) && C.flag(p, "mrb_os_bill") && A.S.year - p.flags.mrb_os_bill >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_os_bill_due")) { ctx.skip = 1; return; } make(p, ctx, { realm: "POL-16", sex: "M", age: 35, occ: "a bank agent of Ostra" }); },
      text: p => `New Year's Day, the great reckoning. The bill you signed ${ago(p, "mrb_os_bill")} ago at twelve in the hundred has come round. A bank agent in the same black cap stands at your door with the same kind of tablet. ${p.debt > 0 ? `Your debts stand at ${p.debt} suns.` : "Your debts are paid, he admits, but a quittance carries a fee."} Ostra forgets nothing, not even a debtor who has turned honest.`,
      choices: [
        { t: "Pay what you can, and ask for the quittance",
          fx: p => {
            const pay = Math.min(p.coin, p.debt || 0);
            p.coin = Math.max(0, p.coin - pay - (p.debt ? 0 : 5));
            addDebt(p, -pay);
            if (!p.debt) { delete p.flags.rl_os_fled; return "He seals the quittance. Your name leaves the church lists for good, and your children may borrow in Ostra again."; }
            return `He takes ${pay} suns and writes the rest on a new line. You will see the black cap again next New Year.`;
          } },
        { t: "Offer to collect for the bank",
          r: "The agent looks you over. A debtor who knows how debtors run is worth something to a bank. Half your debt is forgiven against a year of carrying a tablet in a black cap.",
          fx: (p, ctx) => { addDebt(p, -Math.round((p.debt || 0) / 2)); return more(p, ctx, { skill: { trade: 2, intimidation: 2 }, honor: -2, them: { type: "friend", op: 15 } }); } },
        { t: "Run again, by the same ford", check: { s: "stealth", s2: "spd", d: 50 },
          win: { r: "Over the river again by the ford you know. Next New Year your name is read twice: once for the loan, once for the bill.",
            fx: { honor: -6, happy: -3, them: { type: "enemy", op: -20 } } },
          lose: { r: "They have learned your ford. The Debtors' Tower has a window on the harbor, and you will come to know it well.",
            fx: { punish: "debt" } } },
      ],
    },
    {
      id: "mrb_os_child_loan",
      title: "The debtor's children",
      cond: (p, C) => C.adult(p) && C.hasKids(p) && C.flag(p, "rl_os_fled") && A.S.year - p.flags.rl_os_fled >= 6 && A.S.year - p.flags.rl_os_fled < 20 && !!grownKid(p),
      w: 2, once: true,
      setup: (p, ctx) => { const k = grownKid(p); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.owe = oweOstra(p); ctx.left = count(20 - yrs(p, "rl_os_fled"), "year"); },
      text: "{them} has a chance at a stall in Ostra's cloth market, and needs sixty suns to take it. The banks will not lend. {theirHis} name is your name, and your name is read in the churches every New Year for the forty suns you fled from. The ban on a fled debtor's children runs twenty years. It has {left} still to run.",
      choices: [
        { t: "Pay the old debt with all its interest ({owe} suns)", req: p => p.coin >= oweOstra(p),
          r: "You pay forty suns grown to {owe}. The reader strikes your name, and the Exchange lends to {them} within the week, at the ordinary rate, which is to say a high one.",
          fx: (p, ctx) => more(p, ctx, { coin: -oweOstra(p), unflag: "rl_os_fled", honor: 3, them: { op: 25 } }) },
        { t: "Lend {themHim} the sixty yourself", req: p => p.coin >= 60,
          r: "You count it out on the kitchen table. {them} takes it with both hands and writes you a bill, very properly, as an Ostran should.",
          fx: { coin: -60, owed: 2, them: { op: 20 } } },
        { t: "Tell {themHim} to borrow under a cousin's name",
          r: "{them} borrows under a cousin's name. It works, this year. A false name in the Exchange's books is a debt of its own, with its own interest.",
          fx: { honor: -3, secret: 1, them: { op: 5 } } },
        { t: "Tell {themHim} the whole story of that night",
          r: "{them} hears all of it: the black cap, the tablet, the ford in the dark. {theyHe} does not take the stall, and does not quite forgive you either.",
          fx: { them: { op: -12 }, wil: 1, happy: -3 } },
      ],
    },

    // ================================================================== The Holy See (POL-02) and the Temple faith (REL-01)

    // rl_needle_doubt: counted the years (under the Needle, or with a Temple copyist) and found the Reckoning six short
    {
      id: "mrb_needle_pupil",
      title: "Six years short",
      cond: (p, C) => (C.realm(p, "POL-02") || C.faith(p, "REL-01")) && C.adult(p) && C.flag(p, "rl_needle_doubt") && A.S.year - p.flags.rl_needle_doubt >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 22, occ: "a copyist of the Temple" }); },
      text: "You counted the years once, and the reigns did not add up: the Common Reckoning is six years short. You told no one. Tonight {themFull}, a young copyist of the Temple, finds you alone in the library with a sheet of numbers of his own. He has counted too. His hands shake. \"Am I mad?\" he asks. The last Needle Heretic was walled up under the Shadow Needle, away from the sun.",
      choices: [
        { t: "Check his sums, and tell him the truth",
          r: "You go through his numbers by one candle. He is right, and now he knows that you know it. He calls you master, very quietly, and takes the sheet home.",
          fx: (p, ctx) => { later("mrb_needle_taken", 3); const s = more(p, ctx, { them: { type: "student", op: 30 }, skill: { learning: 2 }, piety: -2, flag: "mrb_needle_pupil" }); mark(p, A.P(ctx.pid), "needle_pupil"); return s; } },
        { t: "Tell him he is mad, and to burn it",
          r: "He burns the sheet in front of you. He does not believe you, and you watch him not believe you all the way to the door.",
          fx: { them: { op: -10 }, wil: 1, honor: -1 } },
        { t: "Report him to a Luminary before he reports you",
          r: "A Knight of the Sun thanks you for your faith. The copyist is led down the steps beside the Shadow Needle. You take a different street home for a year.",
          fx: { piety: 3, honor: -8, favor: 3, trait: "cynical", them: { type: "enemy", op: -60 } } },
      ],
    },
    // arc: mrb_needle_pupil -> the pupil is taken
    {
      id: "mrb_needle_taken",
      title: "Down the steps",
      cond: (p, C) => (C.realm(p, "POL-02") || C.faith(p, "REL-01")) && C.adult(p) && C.flag(p, "mrb_needle_pupil") && A.S.year - p.flags.mrb_needle_pupil >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_needle_taken") || !marked(p, ctx, "needle_pupil")) ctx.skip = 1; },
      text: "Knights of the Sun have taken {themFull}, the copyist you taught to count the years. He is held in a cell beside the Shadow Needle while the Luminaries decide whether he will be walled up in the dark. He knows your name. So far, the cellar guards say, he has not spoken it.",
      choices: [
        { t: "Go to the Luminary and confess first",
          r: "You confess to counting, and to teaching him. The Luminaries are merciful to a heretic with a confessing master: he goes to a cloister on the coast instead of the wall. You carry the penance.",
          fx: { piety: 3, favor: -6, honor: 4, them: { op: 30 }, deed: "Confessed the count of the years to a Luminary" } },
        { t: "Bribe a cellar guard to pass him bread (10 suns)", req: p => p.coin >= 10, check: { s: "intrigue", s2: "diplomacy", d: 48 },
          win: { r: "The guard takes the coin and the loaf. Under the bread is one word: nothing. He says nothing. They wall him up on the feast of the Sun, and your name stays outside with you.",
            fx: { coin: -10, honor: 2, secret: 1, them: { op: 20 } } },
          lose: { r: "The guard takes the coin, then takes you to a Luminary. You are questioned for three days about your own faith, and held for a year after.",
            fx: { coin: -10, piety: -3, prison: 1, why: "questioning over the Needle Heresy" } } },
        { t: "Burn your own sheets, and wait",
          r: "Every number you ever wrote goes into the stove. You sleep badly for a year. He is walled up in the spring, and he does not speak your name.",
          fx: { unflag: "rl_needle_doubt", happy: -5, wil: 1.5, trait: "paranoid" } },
      ],
    },
    {
      id: "mrb_needle_will",
      title: "What to leave behind",
      cond: (p, C) => (C.realm(p, "POL-02") || C.faith(p, "REL-01")) && C.old(p) && C.flag(p, "rl_needle_doubt") && A.S.year - p.flags.rl_needle_doubt >= 10,
      w: 2, once: true,
      text: "You are old, and the count of the years is still in your head: the reigns, the eclipses, the dates in the chronicles, six years short. You never wrote it down again. When you die it dies with you, unless you set it down somewhere. In the Holy See a heretic's family is watched for three generations. Two families on your street learned that the hard way.",
      choices: [
        { t: "Write it out and brick it into the chimney",
          r: "Two nights of careful copying, then a loose brick and fresh mortar. Some day a mason will find it, or a fire will. You will not be there either way.",
          fx: { deed: "Bricked the true count of the years into a chimney", secret: 1, int: 0.5 } },
        { t: "Confess it to a priest and ask for absolution",
          r: "The priest absolves you, then asks where you learned to count like that. From a book, you say, which is true, and you do not say which book.",
          fx: { piety: 5, untrait: "cynical", favor: 1 } },
        { t: "Let it die with you",
          r: "You keep the numbers and lose them, a few at a time, the way the old lose everything. By spring you cannot remember the sixth year.",
          fx: { unflag: "rl_needle_doubt", happy: 2 } },
      ],
    },

    // ================================================================== Varenna (POL-03)

    // rl_va_wheel_sold: showed your aunt's Palella spinning wheel to a foreigner for 100 suns
    {
      id: "mrb_va_cloth",
      title: "Thread from the north",
      cond: (p, C) => C.realm(p, "POL-03") && C.adult(p) && C.flag(p, "rl_va_wheel_sold") && A.S.year - p.flags.rl_va_wheel_sold >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0155")) make(p, ctx, { sex: "F", age: 45, occ: "a mistress of the Weavers' Guild" }); },
      text: p => `Ashmere thread is in the Palella market: fine, even and cheap. It was spun on a wheel. {themFull} of the Weavers' Guild has bought a skein and is asking every family in the valley that keeps a wheel. Your aunt keeps one. ${cap(ago(p, "rl_va_wheel_sold"))} ago you turned it for a foreigner by one candle, for 100 suns. The guild's men are at her door this morning.`,
      choices: [
        { t: "Go to the guild and confess",
          r: "{them} hears you out in a cold room. Teaching the wheel is hanging work. The guild settles for two years in the cells and your name struck from every loom in the valley.",
          fx: { prison: 2, why: "teaching the Palella wheel to a foreigner", honor: 3, unflag: "rl_va_wheel_sold", them: { type: "enemy", op: -30 } } },
        { t: "Let your aunt answer for her own wheel",
          r: "The guild takes your aunt to Varenna for questioning. She comes home in a month, grey and silent, and the wheel never comes home at all. She has guessed, and she keeps the guess.",
          fx: (p, ctx) => { later("mrb_va_aunt_will", 5); return more(p, ctx, { honor: -8, happy: -6, flag: "mrb_va_aunt" }); } },
        { t: "Point the guild at a bargeman who drank with him", check: { s: "deception", s2: "intrigue", d: 50 },
          win: { r: "The guild's men find nothing on the bargeman, and keep looking at him. They have stopped looking at your aunt's door.",
            fx: (p, ctx) => say(more(p, ctx, { honor: -6, skill: { deception: 2 } }), bond(p, { sex: "M", occ: "a Palella bargeman" }, "enemy", -40)) },
          lose: { r: "{them} has heard three stories this week, and yours is the worst of them. The guild takes you in for questioning instead.",
            fx: { prison: 1, why: "lying to the Weavers' Guild", honor: -6 } } },
      ],
    },
    // arc: mrb_va_aunt -> the aunt who took the blame is dying
    {
      id: "mrb_va_aunt_will",
      title: "The aunt's wheel",
      cond: (p, C) => C.realm(p, "POL-03") && C.adult(p) && C.flag(p, "mrb_va_aunt") && A.S.year - p.flags.mrb_va_aunt >= 5,
      w: 3, once: true,
      setup: (p, ctx) => {
        if (!fresh(p, "mrb_va_aunt_will")) { ctx.skip = 1; return; }
        const q = make(p, ctx, { sex: "F", age: Math.min(80, A.age(p) * 16 / GD.RACES[p.race].adult + 28), occ: "a spinner of Palella" });
        A.link(p, q, "acquaint", 20, "acquaint");
      },
      text: "Your aunt {them} is dying in the room where her wheel stood until the guild took it. She sends the others out. \"I know who showed it,\" she says. \"I have always known.\" She wants a promise: after the burial you will go to the guild and buy the wheel back for her granddaughter. The guild does not sell wheels back.",
      choices: [
        { t: "Promise, and mean it",
          r: "She dies holding your hand. It takes two winters and most of your silver at the guildhouse. In the end they sell it back, for a sum that is also a confession.",
          fx: (p, ctx) => { kill(ctx, "old age"); return more(p, ctx, { coinPct: -0.4, honor: 5, unflag: "mrb_va_aunt", deed: "Bought back a Palella wheel from the Weavers' Guild" }); } },
        { t: "Tell her the guild will never sell it",
          r: "She turns her face to the wall. She dies two days later without forgiving you, which is her right, and leaves the granddaughter nothing to wait for.",
          fx: (p, ctx) => { kill(ctx, "old age"); return more(p, ctx, { honor: 2, happy: -6, wil: 1.5, trait: "honest" }); } },
        { t: "Promise, to give her an easy death",
          r: "She dies easy. You never go to the guild. The granddaughter grows up asking where the old wheel went, and you tell her the guild, which is true.",
          fx: (p, ctx) => { kill(ctx, "old age"); return more(p, ctx, { honor: -3, happy: 2 }); } },
      ],
    },
    {
      id: "mrb_va_north",
      title: "An offer from the north",
      cond: (p, C) => C.realm(p, "POL-03") && C.adult(p) && C.flag(p, "rl_va_wheel_sold") && A.S.year - p.flags.rl_va_wheel_sold >= 6,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { realm: "POL-05", race: "human", sex: "M", age: 45, occ: "a wool merchant from the north" }); },
      text: "The foreigner who paid you 100 suns to watch your aunt's wheel turn is back, thinner and richer: {themFull}. The wheels he built from that night spin badly; a drawing in the head was not enough. He wants a Palella hand to come north for one summer and set them right. Two hundred suns. The guild hangs spinners who leave the valley. Some come back.",
      choices: [
        { t: "Go north with him for the summer", check: { s: "stealth", s2: "craft", d: 50 },
          win: { r: "You cross the border under the fleeces in a wool cart and spend a summer setting flyers and treadles right. You come home in autumn with 200 suns sewn into your coat.",
            fx: { coin: 200, honor: -8, secret: 1, deed: "Set Palella wheels for a foreign mill", them: { type: "friend", op: 30 } } },
          lose: { r: "The guild's men stop the wool cart at the border and pull back the fleeces one by one until they find you.",
            fx: { prison: 2, why: "carrying the Palella wheel north", honor: -10 } } },
        { t: "Sell him drawings, and stay home", check: { s: "craft", s2: "int", d: 52 },
          win: { r: "You draw the flyer and the treadle from memory, one sheet a night, and burn the candle ends. He pays 80 suns and leaves before the ink is dry.",
            fx: { coin: 80, honor: -5, secret: 1 } },
          lose: { r: "Your drawings are wrong in two places, and he knows wheels better now. He wants his money back, and argues with a knife.",
            fx: { health: -8, wound: "deep_cut", cause: "a wool merchant's knife", them: { type: "enemy", op: -40 } } } },
        { t: "Hand him to the Weavers' Guild",
          r: "The guild's men take him at dawn. He tells them everything, your name first. The guild weighs a traitor who delivers a buyer, hangs him, and fines you 80 suns.",
          fx: (p, ctx) => { kill(ctx, "hanged at Palella for buying the wheel"); return more(p, ctx, { coin: -80, favor: 2, honor: 2, unflag: "rl_va_wheel_sold" }); } },
      ],
    },

    // ================================================================== Zanara and Abara (POL-20, POL-22)

    // rl_rememberer: chosen by a Rememberer as a child for saying (or singing) forty names back
    {
      id: "mrb_zn_line",
      title: "Forty names, and one more",
      cond: (p, C) => C.realm(p, "POL-20", "POL-22") && C.adult(p) && C.flag(p, "rl_rememberer") && A.S.year - p.flags.rl_rememberer >= 10,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 55, occ: "a headman's brother" }); },
      text: "A Rememberer chose you as a child because you could hold forty names in order. Now you hold the long lines yourself. The headman of your compound is dead, and his brother {themFull} wants his own son to have the cattle. The line runs through the dead man's sister, not through {them}. He brings you two oxen and asks you to sing it with one name moved.",
      choices: [
        { t: "Sing the line as it was given",
          r: "You sing it true, father to son, sister to son. The cattle go to the sister's boy. {them} drives his oxen home and stops greeting you at the well.",
          fx: { honor: 4, fame: 1, skill: { music: 1 }, them: { type: "enemy", op: -30 } } },
        { t: "Move the one name",
          r: "One name, sung a breath later than it should be. The elders nod along. The brother's son takes the cattle, and you take two oxen and a voice that sits wrong in your throat.",
          fx: (p, ctx) => { later("mrb_zn_false_heard", 5); return more(p, ctx, { coin: 50, honor: -6, trait: "deceitful", them: { op: 25 }, flag: "mrb_zn_false" }); } },
        { t: "Name the bribe before the elders", check: { s: "persuasion", s2: "wil", d: 48 },
          win: { r: "Before the whole compound you name the oxen, then sing the line. The elders fine {them} an ox. The Rememberers hear of it within the month.",
            fx: { honor: 5, fame: 2, deed: "Named a bribe before the elders", them: { type: "enemy", op: -40 } } },
          lose: { r: "{them} has fed the elders already. They tell you to sing what you are asked or step aside, and another voice sings it.",
            fx: { honor: 1, happy: -4, them: { op: -20 } } } },
      ],
    },
    // arc: mrb_zn_false -> the moved name is heard at a funeral
    {
      id: "mrb_zn_false_heard",
      title: "A name out of place",
      cond: (p, C) => C.realm(p, "POL-20", "POL-22") && C.adult(p) && C.flag(p, "mrb_zn_false") && A.S.year - p.flags.mrb_zn_false >= 5,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_zn_false_heard")) { ctx.skip = 1; return; } make(p, ctx, { age: 70, occ: "a Rememberer" }); },
      text: "At a funeral {themFull}, the old Rememberer who chose you as a child, hears a boy sing the line you sang for the headman's brother. The name you moved is out of place. The old Rememberer stops the boy mid-line, before all the mourners, and turns to find you in the crowd.",
      choices: [
        { t: "Stand and sing the true line",
          r: "You sing it right, before everyone. The cattle cannot be ungiven, but the line is mended. You are a Rememberer still, and a liar on record.",
          fx: { honor: 3, untrait: "deceitful", unflag: "mrb_zn_false", them: { op: 10 } } },
        { t: "Say the boy learned it wrong", check: { s: "deception", s2: "wil", d: 54 },
          win: { r: "The boy is sent away to learn it again, from you. He will learn it your way, and so will the ones he teaches.",
            fx: { honor: -4, skill: { deception: 2 }, them: { op: -10 } } },
          lose: { r: "The old one sings the line from memory, all of it, with your moved name back in its place. The songs are taken from you at the next new moon.",
            fx: { unflag: "rl_rememberer", honor: -8, happy: -6, them: { type: "enemy", op: -40 } } } },
        { t: "Go to the old one alone that night",
          r: "{them} listens to all of it and asks only how many oxen. Then: you will teach the true line to three children, and never sing at a funeral again.",
          fx: { them: { type: "mentor", op: 5 }, skill: { learning: 1 }, deed: "Bound to teach the true line to three children" } },
      ],
    },
    {
      id: "mrb_zn_old_songs",
      title: "Who holds the names",
      cond: (p, C) => C.realm(p, "POL-20", "POL-22") && C.old(p) && C.flag(p, "rl_rememberer") && A.S.year - p.flags.rl_rememberer >= 20,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 9, occ: "a herd-boy of the compound" }); },
      text: "Your voice is going. The long songs you have held since a Rememberer chose you will die with you unless a child takes them. Your grandchild wants them badly, and loses the line at the twentieth name, as you nearly did. {themFull}, a herd-boy of the compound, said all forty back to you yesterday without a breath. The family will not thank you for choosing him.",
      choices: [
        { t: "Teach the herd-boy",
          r: "Every evening at the cattle gate, line by line. Your family is cold about it for a year. The boy's voice is like a drum, and he will outlive all of you.",
          fx: { them: { type: "student", op: 40 }, happy: 3, rel: { who: "child", op: -10 } } },
        { t: "Teach your grandchild, however long it takes",
          r: "Two years of evenings. The child loses the line at the twentieth name, then at the thirtieth, and then one evening not at all.",
          fx: { deed: "Taught the long songs to a grandchild", wil: 1, happy: 4 } },
        { t: "Teach them both, side by side", check: { s: "music", s2: "wil", d: 50 },
          win: { r: "Two voices, one line. The Rememberers take them both, and say so at the market, and your family forgives the herd-boy his good memory.",
            fx: { fame: 2, happy: 4, them: { type: "student", op: 30 } } },
          lose: { r: "Two pupils are one too many for an old throat. By the rains you can barely speak above a whisper, and the boy finishes the songs alone.",
            fx: { health: -10, cause: "a voice worn out with teaching", them: { type: "student", op: 20 } } } },
      ],
    },

    // ================================================================== Sabra (POL-24)

    // rl_sb_oil: held the Emir's token at the boiling-sheds of Zariya (or learned what the "lamp oil" is for)
    {
      id: "mrb_sb_buyer",
      title: "What lamp oil is for",
      cond: (p, C) => C.realm(p, "POL-24") && C.adult(p) && C.flag(p, "rl_sb_oil") && A.S.year - p.flags.rl_sb_oil >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { realm: "POL-03", race: "human", sex: "M", age: 40, occ: "a Varennan ship captain" }); },
      text: "You know what is really boiled in the sheds at Zariya. {themFull}, a Varennan captain on the Sabra quay, knows that you know. He offers 300 suns for one evening of talk: the jars, the seals, the smell, the order things go into the vat. Strangers found near the Oil Shore simply disappear. So do the people who talk to them.",
      choices: [
        { t: "Talk, for 300 suns",
          r: "You talk until the lamp gutters. He writes nothing down, which frightens you more than if he had. He pays in Varennan gold and sails on the morning tide.",
          fx: (p, ctx) => { later("mrb_sb_ship", 4); return more(p, ctx, { coin: 300, honor: -8, secret: 1, flag: "mrb_sb_sold" }); } },
        { t: "Report him to the Oil Shore Watch",
          r: "The Watch takes him off his own deck at dawn, and he is not seen again. A Watch captain writes your name in a book of the loyal. His mate learns who you are.",
          fx: (p, ctx) => { kill(ctx, "taken by the Oil Shore Watch"); return say(more(p, ctx, { favor: 4, honor: -2 }), bond(p, { realm: "POL-03", race: "human", sex: "M", occ: "a Varennan mate" }, "enemy", -40)); } },
        { t: "Sell him a recipe for real lamp oil", check: { s: "deception", s2: "int", d: 52 },
          win: { r: "Olive dregs, pitch, a pinch of salt. He pays 100 suns for lamp oil, which is exactly what he asked for, and sails before he tries it.",
            fx: { coin: 100, skill: { deception: 2 }, them: { type: "enemy", op: -40 } } },
          lose: { r: "He sniffs your jar, laughs, then stops laughing. His men drop you off the quay with a stone tied to your feet. The knot is bad, and you live.",
            fx: { health: -15, wound: "broken_ribs", cause: "a Varennan crew and a stone" } } },
      ],
    },
    // arc: mrb_sb_sold -> a galley burns with fire that was not Sabra's
    {
      id: "mrb_sb_ship",
      title: "Fire on the water",
      cond: (p, C) => C.realm(p, "POL-24") && C.adult(p) && C.flag(p, "mrb_sb_sold") && A.S.year - p.flags.mrb_sb_sold >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_sb_ship")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 45, occ: "a captain of the Oil Shore Watch" }); },
      text: "A Sabran war galley burned off the Pearl Banks last month, burned on open water with a fire that water would not put out. It was not Sabra's fire. The Oil Shore Watch is asking who talked. {themFull}, a captain of the Watch, comes to your door with your name and the name of a Varennan ship.",
      choices: [
        { t: "Confess, and beg the Emir's mercy",
          r: "Mercy in Sabra is a branding iron. They burn the Emir's mark into your palm and let you live, so that every hand you shake will know.",
          fx: { wound: "brand", health: -8, honor: 2, cause: "the Emir's brand", unflag: "rl_sb_oil" } },
        { t: "Deny all of it", check: { s: "deception", s2: "wil", d: 58 },
          win: { r: "He has a name and a ship, and no third thing. He leaves. The Watch sits outside your door for a year, and you learn all their faces.",
            fx: { honor: -4, wil: 1, them: { type: "enemy", op: -30 } } },
          lose: { r: "The Varennan's mate is in the Watch's cells, and the mate has a good memory. You get three years in the cells at Zariya, close to the smoke.",
            fx: { prison: 3, why: "selling the Emir's fire", honor: -8 } } },
        { t: "Hide in the salt flats until it blows over", check: { s: "survival", s2: "sta", d: 50 },
          win: { r: "A season in the salt flats with a goatherd who asks no questions. The Watch finds a better name. You come back thinner, with a different beard.",
            fx: { health: -8, wil: 1.5, happy: -4, skill: { survival: 3 } } },
          lose: { r: "The Watch knows the salt flats better than you do. They find you on the eighth day, half mad with thirst.",
            fx: { prison: 2, why: "selling the Emir's fire", health: -10 } } },
      ],
    },
    {
      id: "mrb_sb_runaway",
      title: "A face from the sheds",
      cond: (p, C) => C.realm(p, "POL-24") && C.adult(p) && C.flag(p, "rl_sb_oil") && A.S.year - p.flags.rl_sb_oil >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "F", age: 30, occ: "a runaway boiler from Zariya" }); },
      text: "A woman with burn-scarred forearms stops you in the fish market: {themFull}. She worked the boiling-sheds at Zariya, and she knows you from the season you held the Emir's token. She ran from the sheds two winters ago. The Oil Shore Watch pays 50 suns for a runaway, and hangs anyone who hides one. She needs a roof for one month, until a boat.",
      choices: [
        { t: "Hide her in your storeroom",
          r: "A month of carrying bread after dark. Then a Varennan boat, and she is gone, one burnt hand raised from the stern. You keep the storeroom bolted for a year.",
          fx: (p, ctx) => { later("mrb_sb_hid_found", 3); return more(p, ctx, { honor: 5, them: { type: "friend", op: 40 }, flag: "mrb_sb_hid" }); } },
        { t: "Turn her in for the 50 suns",
          r: "The Watch takes her from the fish market without a word. You get 50 suns and her face, and only one of them can be spent.",
          fx: { coin: 50, honor: -10, happy: -4, them: { type: "enemy", op: -60 } } },
        { t: "Give her silver and a diver's name at Azara", req: p => p.coin >= 10,
          r: "Ten suns and a name. She goes before dark. You never learn whether she reached Azara, which is the price of not asking.",
          fx: { coin: -10, honor: 2, them: { op: 20 } } },
      ],
    },
    // arc: mrb_sb_hid -> the Watch finds the straw
    {
      id: "mrb_sb_hid_found",
      title: "The bolted storeroom",
      cond: (p, C) => C.realm(p, "POL-24") && C.adult(p) && C.flag(p, "mrb_sb_hid") && A.S.year - p.flags.mrb_sb_hid >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_sb_hid_found")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 40, occ: "a man of the Oil Shore Watch" }); },
      text: "The Oil Shore Watch has caught a Varennan smuggler with three runaway boilers below his deck, and one of them talked. {themFull} of the Watch stands in your storeroom, looking at the straw where the woman from Zariya slept for a month. \"Bread after dark,\" he says. \"The neighbors noticed.\"",
      choices: [
        { t: "Pay him to forget the straw (60 suns)", req: p => p.coin >= 60,
          r: "Sixty suns, and he forgets. He will remember again next year at the same price, and the year after that.",
          fx: { coin: -60, happy: -3, them: { type: "rival", op: -10 } } },
        { t: "Admit it, and name no one else",
          r: "They brand your hand and take a year's goods. The neighbors who noticed get nothing. In the fish market you are something now, though no one says what aloud.",
          fx: { wound: "brand", coinPct: -0.3, honor: 6, fame: 2, cause: "the Watch's brand" } },
        { t: "Say the neighbor hid her", check: { s: "deception", s2: "int", d: 55 },
          win: { r: "The Watch takes the neighbor. He did not do it, and he knows who did. His wife spits at your door every morning for a year.",
            fx: (p, ctx) => say(more(p, ctx, { honor: -12 }), bond(p, { sex: "F", occ: "your neighbor's wife" }, "enemy", -50)) },
          lose: { r: "The neighbor has the boat-master's receipt for that month. You get the brand, and the name of a liar besides.",
            fx: { wound: "brand", honor: -10, cause: "the Watch's brand" } } },
      ],
    },

    // ================================================================== Drevna (POL-26)

    // rl_dv_listener: took what you heard through the wall to the Still Hall, and were asked to learn to listen
    {
      id: "mrb_dv_listen_again",
      title: "Learning to listen",
      cond: (p, C) => C.realm(p, "POL-26") && C.adult(p) && C.flag(p, "rl_dv_listener") && A.S.year - p.flags.rl_dv_listener >= 3,
      w: 2, once: true,
      setup: (p, ctx) => {
        const f = A.relsOf(p, ["friend", "bestfriend"]).find(x => x.p.alive);
        ctx.mark = f ? f.p.given : "the cooper next door";
        make(p, ctx, { sex: "M", age: 45, occ: "a quiet man of the Still Hall" });
      },
      text: "The quiet man from the Still Hall who paid you 12 suns for what you heard through the wall is back: {themFull}. He once asked whether you had thought of learning to listen properly. Now he has a wall in mind, the one between you and {mark}. \"Rye, perhaps. Or nothing,\" he says. \"Listen for a month. The Hall pays by the month.\"",
      choices: [
        { t: "Put your ear to the wall",
          r: "A month of evenings with your ear to the plaster. You learn that {mark} owes money, loves someone, and curses the crown's tolls. You report two of the three.",
          fx: (p, ctx) => { later("mrb_dv_guard", 4); return more(p, ctx, { coin: 20, honor: -4, skill: { intrigue: 2, stealth: 1 }, them: { op: 15 }, flag: "mrb_dv_ear" }); } },
        { t: "Refuse, and warn {mark}",
          r: "{mark} packs half a house by morning. The quiet man sends no word at all, which is how the Still Hall tells you it has noticed.",
          fx: { honor: 3, them: { type: "enemy", op: -30 } } },
        { t: "Take the pay and report nothing", check: { s: "deception", s2: "intrigue", d: 50 },
          win: { r: "A month of empty reports, neatly written. The pay is good, and the quiet man seems satisfied. You begin to wonder why.",
            fx: { coin: 20, honor: -1, skill: { deception: 2 } } },
          lose: { r: "The Hall had a second ear on the same wall. You are fined for listening at walls, and twice that for lying about it.",
            fx: { coin: -20, honor: -4, them: { type: "enemy", op: -30 } } } },
      ],
    },
    // arc: mrb_dv_ear -> the Still Hall offers a place
    {
      id: "mrb_dv_guard",
      title: "Wax in their ears",
      cond: (p, C) => C.realm(p, "POL-26") && C.adult(p) && C.flag(p, "mrb_dv_ear") && A.S.year - p.flags.mrb_dv_ear >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_dv_guard")) { ctx.skip = 1; return; } if (!cast(p, ctx, "CHR-0371")) make(p, ctx, { sex: "M", age: 53, occ: "Master of the Still Hall" }); },
      text: p => `{themFull}, Master of the Still Hall, sends for you. He has read ${ago(p, "mrb_dv_ear")} of your reports from the wall, and they are good. He offers a place among the Hall's own listeners: the hand-signs of the Listener's Guard, a wage from the crown, and an end to neighbors. "Listeners do not keep friends," he says, in a near whisper. "They keep walls."`,
      choices: [
        { t: "Take the place",
          r: "You learn the hand-signs in a winter. Your old street hears you work for the crown now, and goes quiet when you pass.",
          fx: { job: "spy", honor: -2, skill: { intrigue: 3 }, them: { type: "mentor", op: 20 } } },
        { t: "Refuse, and stop listening",
          r: "He nods once. The Hall has no use for an ear that closes. Within a year your old reports are someone else's evidence, and your name is under some of them.",
          fx: { unflag: "mrb_dv_ear", wil: 1, honor: 2, them: { op: -20 } } },
        { t: "Ask for your reports back first", check: { s: "persuasion", s2: "int", d: 58 },
          win: { r: "He hands you the sheets with your name on them. He has kept copies, as you knew he would. Burning them is a pleasure anyway.",
            fx: { honor: 2, unflag: "mrb_dv_ear", them: { op: 10 } } },
          lose: { r: "\"The Hall keeps everything,\" he says. \"This conversation as well.\"",
            fx: { wil: 1, them: { op: -10 } } } },
      ],
    },

    // ================================================================== Stonehold (POL-28)

    // rl_st_oldtoll: drilled with the Old Toll's pikes in the lower halls; your name went on a sergeant's slate
    {
      id: "mrb_st_march",
      title: "The Old Toll marches",
      cond: (p, C) => C.realm(p, "POL-28") && C.adult(p) && !C.old(p) && C.flag(p, "rl_st_oldtoll") && A.S.year - p.flags.rl_st_oldtoll >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { ctx.lead = castAlive("CHR-0413") ? "Kettil Ironbrow's Old Toll" : "The Old Toll"; make(p, ctx, { race: "dwarf", sex: "M", age: 60, occ: "a sergeant of the Old Toll" }); },
      text: "The sergeant who wrote your name on a slate in the lower halls has come back with the slate: {themFull}. The snow is off the passes. {lead} marches on the Nagora Gate, which Ranpur took in 1085, and every name on the slate brings a pike. The Gate Wardens will not march. The crown has said nothing at all.",
      choices: [
        { t: "Take your pike and march", check: { s: "spear", s2: "str", d: 50 },
          win: { r: "Three days in pike blocks below the Gate. Ranpur's crossbows are good, and you are lucky. The Old Toll does not take the Gate, but every hall talks of how close it came.",
            fx: (p, ctx) => { later("mrb_st_wardens", 3); return more(p, ctx, { fame: 2, skill: { spear: 3 }, deed: "Marched with the Old Toll on the Nagora Gate", flag: "mrb_st_marched" }); } },
          lose: { r: "A crossbow bolt finds your shoulder in the second rush. You carry your pike home on the other shoulder.",
            fx: (p, ctx) => { later("mrb_st_wardens", 3); return more(p, ctx, { wound: "arrow_wound", health: -12, cause: "a Ranpur crossbow at the Nagora Gate", flag: "mrb_st_marched" }); } } },
        { t: "Rub your name off the slate",
          r: "The sergeant watches you do it with your own sleeve. By the next day the lower halls know, and old dwarves turn their backs when you come in to drink.",
          fx: { unflag: "rl_st_oldtoll", honor: -6, happy: -3, them: { op: -30 } } },
        { t: "Take the slate to the Gate Wardens",
          r: "The Wardens pay 30 suns for the slate and take three sergeants before dawn. The Old Toll marches anyway, short a slate. You are a name on another list now.",
          fx: { coin: 30, favor: 3, honor: -8, them: { type: "enemy", op: -50 } } },
      ],
    },
    // arc: mrb_st_marched -> the crown fines the marchers
    {
      id: "mrb_st_wardens",
      title: "The price of a pike",
      cond: (p, C) => C.realm(p, "POL-28") && C.adult(p) && C.flag(p, "mrb_st_marched") && A.S.year - p.flags.mrb_st_marched >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_st_wardens")) { ctx.skip = 1; return; } make(p, ctx, { race: "dwarf", sex: "F", age: 50, occ: "a Gate Warden" }); },
      text: "The crown wants the Old Toll quiet. {themFull} of the Gate Wardens goes hall to hall with the old slates. Every marcher on them must pay a fine of 40 suns, or swear before the Eldest Carver never again to bear a pike for the Old Toll. Your name is on a slate in the sergeant's hand, and so is the day you marched.",
      choices: [
        { t: "Pay the 40 suns", req: p => p.coin >= 40,
          r: "The Warden takes the silver and makes a mark. Your oath stays your own, and the Old Toll hears that you kept it free.",
          fx: { coin: -40, wil: 1, honor: 1, them: { op: -5 } } },
        { t: "Swear before the Eldest Carver",
          r: "The Carver cuts your oath into the stone beside four hundred others. The Old Toll calls it the Wall of Shame. You call it a roof over your children.",
          fx: { unflag: "rl_st_oldtoll", honor: -2, happy: 2, deed: "Swore off the Old Toll before the Eldest Carver" } },
        { t: "Refuse both",
          r: "The Wardens take your tools in place of the fine. A month later the Old Toll sends you a new pike, and a sergeant's slate of your own.",
          fx: { coinPct: -0.25, honor: 3, skill: { command: 2 }, them: { type: "enemy", op: -25 } } },
      ],
    },

    // ================================================================== Emberdeep (POL-29)

    // rl_em_truetally: copied the true heat reading onto a slate and hid it in your vault
    {
      id: "mrb_em_scald",
      title: "The slate in the vault",
      cond: (p, C) => C.realm(p, "POL-29") && C.adult(p) && C.flag(p, "rl_em_truetally") && A.S.year - p.flags.rl_em_truetally >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "dwarf", sex: "M", age: 70, occ: "a heat-surveyor of the deep galleries" }); },
      text: p => `A spring broke through in the deepest gallery last week and scalded four miners. The Eldest Carver says they were careless. In your vault is a slate with the true heat reading from ${ago(p, "rl_em_truetally")} ago, scratched while {themFull} wrote a cooler number in the book. The Smith-Father's breath grows hotter every year. The slate says so. The book says otherwise.`,
      choices: [
        { t: "Carry the slate to the Forge-Queen's council", check: { s: "diplomacy", s2: "wil", d: 55 },
          win: { r: "The council reads the slate, then the book, then {them}. A new tally is ordered, with you holding the wax rod. The priests of the Smith-Father's Breath call you faithless at the door.",
            fx: (p, ctx) => { later("mrb_em_exodus", 4); return more(p, ctx, { honor: 6, fame: 3, them: { type: "enemy", op: -40 }, flag: "mrb_em_spoke" }); } },
          lose: { r: "The council asks who scratched the slate. A copy is only a copy. You are sent to the coldest gallery in the hold, and the slate stays with the council.",
            fx: (p, ctx) => { later("mrb_em_exodus", 4); return more(p, ctx, { happy: -6, honor: 2, them: { type: "enemy", op: -30 }, flag: "mrb_em_spoke" }); } } },
        { t: "Pass it among the miners' families",
          r: "The slate goes hand to hand through the lower galleries. Within a month half the deep crews ask for shallow work, and {them} is asking who started it.",
          fx: { honor: 3, secret: 1, skill: { intrigue: 2 }, them: { op: -20 } } },
        { t: "Leave it in the vault. Not yet",
          r: "Four miners, scalded. You pass the infirmary every morning on the way down, and every morning the slate stays where it is.",
          fx: { happy: -6, wil: 1 } },
      ],
    },
    // arc: mrb_em_spoke -> the smith families leave, and the priests come
    {
      id: "mrb_em_exodus",
      title: "Faithless",
      cond: (p, C) => C.realm(p, "POL-29") && C.adult(p) && C.flag(p, "mrb_em_spoke") && A.S.year - p.flags.mrb_em_spoke >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_em_exodus")) { ctx.skip = 1; return; } make(p, ctx, { race: "dwarf", sex: "M", age: 80, occ: "a priest of the Smith-Father's Breath" }); },
      text: "Since you laid the true heat before the council, three smith families have left Emberdeep for Stonehold. The priests of the Smith-Father's Breath say you started it, and they are right. {themFull} stands at your forge door with a question cut on a tablet: will you swear before the First Forge that the springs are the Smith-Father's breath, and no danger?",
      choices: [
        { t: "Swear it, and keep your forge",
          r: "You swear with your hand on the First Forge's anvil. The priest is satisfied. The springs go on warming, and your slate lies somewhere in the council's chest.",
          fx: { honor: -6, piety: 4, trait: "cynical", them: { op: 20 } } },
        { t: "Refuse, and keep working",
          r: "The priest cuts your refusal into the tablet. Orders at your forge fall by a third, and the ones that stay come from people who also read slates.",
          fx: { honor: 4, piety: -4, coinPct: -0.2, them: { type: "enemy", op: -40 } } },
        { t: "Send a copy of the tally to Stonehold's Carvers",
          r: "Stonehold reads it aloud in every hall as proof that Emberdeep's holy forges are failing. Your own hold will not forgive that, and the Forge-Queen hears your name.",
          fx: { fame: 3, honor: 1, favor: -8, them: { type: "enemy", op: -50 } } },
      ],
    },

    // rl_em_dragon: learned that a young Great Ash Dragon was shot down and walled into the east gallery
    {
      id: "mrb_em_gallery",
      title: "A sky-king that did not come home",
      cond: (p, C) => C.realm(p, "POL-29") && C.adult(p) && C.flag(p, "rl_em_dragon") && A.S.year - p.flags.rl_em_dragon >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { realm: "POL-27", race: "human", sex: "M", age: 35, occ: "a pilgrim of the Red Stair" }); },
      text: "A pilgrim of the Red Stair has crossed the High Wastes to Kardeep, asking after a young Great Ash Dragon. The herders saw it fly west one November and never fly home. {themFull} has gold, and a question for anyone who stands the Dragon Watch. You know about the east gallery walled up that same November, and what lies behind the new stone.",
      choices: [
        { t: "Tell him what lies behind the wall",
          r: "He weeps, then thanks you, then goes home to tell the Red Stair that Emberdeep killed a sky-king. His gold is heavy and smells of butter lamps.",
          fx: (p, ctx) => { later("mrb_em_curse", 3); return more(p, ctx, { coin: 60, favor: -4, them: { type: "friend", op: 30 }, flag: "mrb_em_told" }); } },
        { t: "Say you know nothing",
          r: "\"What gallery?\" you say, the way everyone says it. He thanks you and goes on down the watch, asking. Someone else will take his gold.",
          fx: { honor: -1, wil: 0.5 } },
        { t: "Take him to the wall at night", check: { s: "stealth", s2: "ins", d: 52 },
          win: { r: "He lays his palm on the new stone and sings to it in a tongue you do not know. He leaves no gold, only a red thread tied round your wrist.",
            fx: (p, ctx) => { later("mrb_em_curse", 3); return more(p, ctx, { piety: 3, deed: "Led a Red Stair pilgrim to the dragon's wall", them: { type: "friend", op: 40 }, flag: "mrb_em_told" }); } },
          lose: { r: "The Dragon Watch finds you at the wall with a stranger. The old sergeant breaks your nose himself, quietly, as a kindness, and puts you on night shifts.",
            fx: { wound: "broken_nose", health: -8, favor: -4, cause: "the Dragon Watch sergeant" } } },
      ],
    },
    // arc: mrb_em_told -> the Red Stair curses the hold, and the Watch finds who talked
    {
      id: "mrb_em_curse",
      title: "Cursed, they say",
      cond: (p, C) => C.realm(p, "POL-29") && C.adult(p) && C.flag(p, "mrb_em_told") && A.S.year - p.flags.mrb_em_told >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_em_curse")) { ctx.skip = 1; return; } make(p, ctx, { race: "dwarf", sex: "M", age: 75, occ: "sergeant of the Dragon Watch" }); },
      text: "The Red Stair has declared Kardeep cursed for the killing of a sky-king. Herders will not sell it wool or butter, and pilgrims spit at its gate. The old sergeant of the Dragon Watch has worked out who talked. {themFull} finds you at the foot of the watch stair, alone, with his gloves off.",
      choices: [
        { t: "Own it. The Red Stair had a right to know",
          r: "He hits you once, hard, then sits down on the stair beside you. \"They did,\" he says. \"That was the trouble.\" Your name is off the watch rolls by morning.",
          fx: { wound: "broken_nose", health: -6, honor: 3, favor: -4, them: { op: 10 }, cause: "the sergeant's fist" } },
        { t: "Blame the drunk watchman who told you",
          r: "The drunk is put out of the hold in his shirt. He was a drunk. He was also the only one who ever told you the truth about anything.",
          fx: (p, ctx) => say(more(p, ctx, { honor: -8, them: { op: 10 } }), bond(p, { race: "dwarf", sex: "M", occ: "a watchman put out of the hold" }, "enemy", -50)) },
        { t: "Carry gifts to the Red Stair and beg pardon", check: { s: "diplomacy", s2: "faith", d: 55 },
          win: { r: "Forty days on the High Wastes with a mule of iron goods. The Red Stair lifts the curse from the Watch, if not from the hold. It is a start.",
            fx: { deed: "Carried a hold's apology to the Red Stair", fame: 3, piety: 3, health: -6, them: { op: 15 } } },
          lose: { r: "The pilgrims take the iron and keep the curse. You come home with three black toes and nothing else.",
            fx: { wound: "frostbite", health: -10, cause: "the High Wastes", them: { op: -10 } } } },
      ],
    },

    // ================================================================== The Tusk Clans (POL-34)

    // rl_tk_faced: took the heavy spear and walked out onto the grass to face the woolly rhino
    {
      id: "mrb_tk_council",
      title: "The new voice",
      cond: (p, C) => C.realm(p, "POL-34") && C.adult(p) && C.flag(p, "rl_tk_faced") && A.S.year - p.flags.rl_tk_faced >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { ctx.killed = rhinoKilled(p) ? 1 : 0; },
      text: (p, ctx) => `${ctx.killed ? "You killed the woolly rhino at the steppe edge with the heavy spear" : "You took the heavy spear and walked out to face the woolly rhino at the steppe edge"}, and so you may speak at clan council. Tonight is your first. The question is rye: Drevna has held back the rye it owes the Tusk Clans two harvests running. The war-leaders want to ride. The old women want to wait. Every face turns to see where the new voice goes.`,
      choices: [
        { t: "Speak for riding on Drevna",
          r: "Your voice is young and loud, and the war-leaders like the sound of it. The clan rides in autumn. Some come back with rye, and some across their saddles.",
          fx: (p, ctx) => { later("mrb_tk_reckon", 3); return more(p, ctx, { fame: 2, skill: { command: 2 }, flag: "mrb_tk_war" }); } },
        { t: "Speak for waiting one more harvest",
          r: "The old women nod, and the war-leaders spit into the fire. The clan waits. The rye comes late and short, and the winter camp tightens its belts.",
          fx: (p, ctx) => { later("mrb_tk_reckon", 3); return more(p, ctx, { honor: 2, skill: { diplomacy: 2 }, flag: "mrb_tk_wait" }); } },
        { t: "Say nothing at your first council",
          r: "You sit with the spear across your knees and listen. The old ones approve. The young ones decide you are afraid of something, and one of them says so to your face.",
          fx: (p, ctx) => say(more(p, ctx, { wil: 1 }), bond(p, { sex: "M", age: 18, occ: "a young spear of the clan" }, "rival", -25)) },
      ],
    },
    // arc: mrb_tk_war / mrb_tk_wait -> the council asks what the new voice bought
    {
      id: "mrb_tk_reckon",
      title: "What your voice bought",
      cond: (p, C) => C.realm(p, "POL-34") && C.adult(p) && (C.flag(p, "mrb_tk_war") || C.flag(p, "mrb_tk_wait")) && A.S.year - (p.flags.mrb_tk_war || p.flags.mrb_tk_wait) >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        if (!fresh(p, "mrb_tk_reckon")) { ctx.skip = 1; return; }
        ctx.war = p.flags.mrb_tk_war ? 1 : 0;
        make(p, ctx, ctx.war ? { sex: "F", age: 50, occ: "a widow of the clan" } : { sex: "M", age: 40, occ: "a war-leader of the clan" });
      },
      text: (p, ctx) => ctx.war
        ? `${cap(ago(p, "mrb_tk_war"))} since you spoke at your first council for riding on Drevna. The son of {themFull} rode, and did not come back. She stands up at council tonight and asks the young voice that sent him what it will say now.`
        : `${cap(ago(p, "mrb_tk_wait"))} since you spoke at your first council for waiting. The rye still comes late and short, and the children in the winter camp are thin. {themFull}, a war-leader, stands up at council tonight and asks the careful voice what it will say now.`,
      choices: [
        { t: "Answer with your own herd",
          r: (p, ctx) => ctx.war ? "You give a horse to her tent for every winter her son will not see. Your herd is thinner after, and your voice carries further." : "You give your own rye-share and two cows to the winter camp. Your herd is thinner after, and your voice carries further.",
          fx: { coinPct: -0.3, honor: 4, them: { op: 30 } } },
        { t: "Stand by what you said", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "You say it again, plainly, and why. The council is quiet, then grudging. A voice that does not bend is worth something on the steppe.",
            fx: { fame: 2, skill: { persuasion: 2 }, them: { op: -10 } } },
          lose: { r: "The council turns its back on you for a year. You may still speak, and the council need not listen.",
            fx: { happy: -6, them: { type: "enemy", op: -30 } } } },
        { t: "Offer to lead the next ride yourself", check: { s: "command", s2: "str", d: 55 },
          win: { r: "You lead twelve riders to Drevna's border granary and back with rye on every saddle. The council remembers the rye, and forgets the rest.",
            fx: { fame: 3, skill: { command: 3 }, deed: "Led a rye raid on Drevna's border granary", them: { op: 15 } } },
          lose: { r: "Drevna's border guard has crossbows now. You come home with a bolt wound and four riders fewer.",
            fx: { wound: "arrow_wound", health: -14, honor: -2, cause: "a Drevnan crossbow", them: { op: -15 } } } },
      ],
    },
    {
      id: "mrb_tk_young_spear",
      title: "Another spring, another bull",
      cond: (p, C) => C.realm(p, "POL-34") && C.adult(p) && C.flag(p, "rl_tk_faced") && A.S.year - p.flags.rl_tk_faced >= 8,
      w: 2, once: true,
      setup: (p, ctx) => { ctx.lodge = castAlive("CHR-0334") ? "Grel Rhinospear" : "the Master of the Lodge"; make(p, ctx, { age: 15, occ: "a cousin's child of your clan" }); },
      text: "Spring again. The Rhino Spear Lodge has found a bull grazing alone at the steppe edge, as it did the year you took the heavy spear and walked out onto the grass. This year it is {themFull}, a cousin's child, barely grown. {theyHe} asks you to walk out at {theirHis} side. The law says one spear. It says nothing about a second one standing close.",
      choices: [
        { t: "Walk out beside {themHim}, your spear grounded", check: { s: "spear", s2: "ins", d: 52 },
          win: { r: "The bull charges whichever one moves first. Neither of you moves. {them} plants the spear, and the clan on the ridge roars.",
            fx: { fame: 2, them: { type: "student", op: 40 }, deed: "Stood beside a young spear against the rhino" } },
          lose: { r: "The bull swings wide and takes you instead. {them} kills it while you lie in the grass with your ribs broken.",
            fx: { wound: "broken_ribs", health: -20, cause: "a woolly rhino's horn", them: { type: "student", op: 50 } } } },
        { t: "Make {themHim} train at the Lodge a season first",
          r: "A season with {lodge}: where the hide is thin, how to set the butt of the spear. Next spring {them} walks out alone, and walks back.",
          fx: { skill: { spear: 1 }, them: { type: "student", op: 30 } } },
        { t: "Tell {themHim} to refuse, as some do",
          r: "{them} hears you out, then goes to the Lodge without you. You hear the roar from the ridge at noon, and do not learn which kind of roar until evening.",
          fx: { happy: -3, them: { op: -20 } } },
      ],
    },

    // ================================================================== Eldergrove (POL-07)

    // rl_eg_dusk: went to the wood at moonless dark and shot by starlight for the Dusk School
    {
      id: "mrb_eg_strand",
      title: "Make no sound",
      cond: (p, C) => C.realm(p, "POL-07") && (C.adult(p) || C.teen(p)) && !C.old(p) && C.flag(p, "rl_eg_dusk") && A.S.year - p.flags.rl_eg_dusk >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", sex: "F", age: 40, occ: "a grey-veiled Mistwalker" }); },
      text: "The grey-veiled Mistwalker who first took you into the wood at moonless dark stands at your door: {themFull}. The Night Rangers of the Veil will burn a strand camp of yew-runners on the Nimthil shore tonight. Half-elf boat families, mostly. Some of them have sold you fish. \"Bring your bow,\" she says. \"Make no sound.\"",
      choices: [
        { t: "Go, and shoot by starlight", check: { s: "bow", s2: "stealth", d: 52 },
          win: { r: "The camp burns. You shoot what you are told to shoot. On the way home the Mistwalker touches your shoulder, once. The Dusk School has all of you now.",
            fx: { honor: -4, skill: { bow: 3, stealth: 2 }, deed: "Burned a strand camp with the Night Rangers", them: { type: "mentor", op: 30 } } },
          lose: { r: "A boat-woman sees your face in the firelight and screams your name. The Rangers finish the work and leave you to explain it on the quay.",
            fx: (p, ctx) => say(more(p, ctx, { honor: -6, them: { op: -10 } }), bond(p, { race: "halfelf", sex: "F", occ: "a yew-runner of the Nimthil strand" }, "enemy", -50)) } },
        { t: "Run ahead and warn the camp", check: { s: "stealth", s2: "spd", d: 55 },
          win: { r: "You reach the strand an hour before the Rangers. They find cold fires and empty boats. The Mistwalker says nothing on the walk home, and walks a little behind you.",
            fx: (p, ctx) => { later("mrb_eg_veil", 4); const s = more(p, ctx, { honor: 5, them: { op: -15 }, flag: "mrb_eg_warned" }); mark(p, A.P(ctx.pid), "eg_mist"); return s; } },
          lose: { r: "You are quick, but they are the Dusk School. A hand closes on your collar at the treeline, and the camp burns while you watch.",
            fx: { unflag: "rl_eg_dusk", health: -5, them: { type: "enemy", op: -40 } } } },
        { t: "Refuse. Fish-sellers are not targets",
          r: "\"Then you are not a pupil,\" she says, and is gone before you finish. The camp burns without you. You smell it on the quay for a week.",
          fx: { unflag: "rl_eg_dusk", honor: 2, them: { op: -25 } } },
      ],
    },
    // arc: mrb_eg_warned -> the Mistwalker works out who warned the camp
    {
      id: "mrb_eg_veil",
      title: "The empty camp",
      cond: (p, C) => C.realm(p, "POL-07") && (C.adult(p) || C.teen(p)) && C.flag(p, "mrb_eg_warned") && A.S.year - p.flags.mrb_eg_warned >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_eg_veil") || !marked(p, ctx, "eg_mist")) ctx.skip = 1; },
      text: p => `${cap(ago(p, "mrb_eg_warned"))} since the Rangers found the Nimthil strand camp empty, and {themFull} has worked out why. She does not come to your door. She is in your room when you wake, sitting on the chest with her veil down. "A pupil who warns the prey," she says. "What is the word for that, in your tongue?"`,
      choices: [
        { t: "\"A pupil with a conscience\"", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "She thinks about it until the candle is out. \"The Veil has need of those too,\" she says. \"Rarely.\" You are still a pupil, on different terms.",
            fx: { trait: "honorable", wil: 1.5, them: { op: 20 } } },
          lose: { r: "\"A traitor,\" she answers herself, and leaves by the window. The Dusk School is closed to you from that night.",
            fx: { unflag: "rl_eg_dusk", them: { type: "enemy", op: -40 } } } },
        { t: "Lie: the yew-runners kept a lookout", check: { s: "deception", s2: "stealth", d: 58 },
          win: { r: "She weighs the lie, finds it the right shape, and lets it stand. That is a lesson too: the Dusk School teaches lying as well as archery.",
            fx: { honor: -3, skill: { deception: 2 }, them: { op: 5 } } },
          lose: { r: "Her knife is at your jaw before you finish. She leaves a thin line there to remember her by, and the window open.",
            fx: { wound: "scar_face", health: -4, cause: "a Mistwalker's knife", them: { type: "enemy", op: -40 } } } },
        { t: "Offer to row with the strand folk instead",
          r: "You trade a bow in the wood for an oar on the water. The Veil lets you go. It does not forget where you went.",
          fx: (p, ctx) => say(more(p, ctx, { unflag: "rl_eg_dusk", skill: { sea: 2 }, them: { type: "enemy", op: -30 } }), bond(p, { race: "halfelf", sex: "M", occ: "a yew-runner of the Nimthil strand" }, "friend", 35)) },
      ],
    },

    // ================================================================== Ashmere (POL-05) and the Ashen (REL-15)

    // rl_ashen: went to the hidden Ashen rite on Ash Night and kept the secret
    {
      id: "mrb_ash_hunters",
      title: "Ash on the eyelids",
      cond: (p, C) => (C.realm(p, "POL-05") || C.faith(p, "REL-15")) && C.adult(p) && C.flag(p, "rl_ashen") && A.S.year - p.flags.rl_ashen >= 2,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "F", age: 40, occ: "a weaver's widow" }); },
      text: "Temple hunters came down the lane at dawn and took {themFull}, the woman with ash-grey eyelids who led you to the hidden rite on Ash Night. She is held at the Temple. They say she has named no one yet. They say everyone names someone by the third day.",
      choices: [
        { t: "Warn the others from the barn", check: { s: "stealth", s2: "ins", d: 48 },
          win: { r: "House to house before noon, a word and a look at each door. By the third day the barn is swept and the bowl is buried. If she names anyone, the hunters find no one at home.",
            fx: { honor: 4, piety: -1, skill: { stealth: 2 }, them: { op: 20 } } },
          lose: { r: "A hunter is watching the third door you knock on. Now they have your name, and she never had to give it.",
            fx: { prison: 1, why: "keeping company with the Ashen", honor: -2 } } },
        { t: "Go to the Temple first with your own account",
          r: "You tell the hunters you went once, from curiosity, and saw nothing that mattered. They write it down and set you a penance. Your name is on their list now, in your own words.",
          fx: { piety: 3, honor: -3, favor: 1, untrait: "curious", them: { type: "enemy", op: -30 } } },
        { t: "Wait, with your lamp burning",
          r: "On the third day the hunters come down the lane again, past your door, to someone else's. You never learn whether she named you and they chose to wait.",
          fx: { happy: -5, wil: 1, trait: "paranoid" } },
      ],
    },
    {
      id: "mrb_ash_bowl",
      title: "Carry the bowl",
      cond: (p, C) => (C.realm(p, "POL-05") || C.faith(p, "REL-15")) && C.adult(p) && C.flag(p, "rl_ashen") && A.S.year - p.flags.rl_ashen >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { age: 60, occ: "an elder of the Ashen" }); },
      text: "Ash Night again, and lamps burn in every window against what walks. This year the Ashen ask more of you. {themFull}, an elder with grey eyelids, wants you to carry the bowl of ash and blood at the rite. You would hear the mountain's name spoken aloud, and say it back. Mount Cinder has smoked since midsummer. The elder says that is why.",
      choices: [
        { t: "Carry the bowl",
          r: "The bowl is warm and heavier than it looks. You hear the name, and say it back, and the whole barn breathes out at once. You are not a guest any more.",
          fx: (p, ctx) => { later("mrb_ash_cinder", 3); return more(p, ctx, { piety: -4, trait: "zealous", them: { type: "friend", op: 30 }, flag: "mrb_ash_bearer" }); } },
        { t: "Go, but stand at the back as before",
          r: "You stand in the dark by the door and watch another carry it. The elder notes where you stand, and does not ask again.",
          fx: { piety: -1, them: { op: -10 } } },
        { t: "Stop going, and tell them so",
          r: "\"The mountain does not forget its guests,\" the elder says, not unkindly. You light two lamps that night instead of one.",
          fx: { unflag: "rl_ashen", piety: 2, wil: 1, them: { op: -20 } } },
      ],
    },
    // arc: mrb_ash_bearer -> the mountain throws ash and the Temple wants a name
    {
      id: "mrb_ash_cinder",
      title: "The bowl-bearer",
      cond: (p, C) => (C.realm(p, "POL-05") || C.faith(p, "REL-15")) && C.adult(p) && C.flag(p, "mrb_ash_bearer") && A.S.year - p.flags.mrb_ash_bearer >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_ash_cinder")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 40, occ: "a hunter of the Temple" }); },
      text: "Mount Cinder threw ash over three villages in the spring, and the Temple wants someone to blame. {themFull}, a Temple hunter, has a list of the Ashen. Your name is near the top: the bowl-bearer. He has come alone, which is not usual. He will burn the list for a price, or for a name above yours.",
      choices: [
        { t: "Pay him to burn it (80 suns)", req: p => p.coin >= 80,
          r: "Eighty suns, and he burns a list at your hearth. There is probably another list. There is probably another hunter.",
          fx: { coin: -80, secret: 1, them: { type: "rival", op: -10 } } },
        { t: "Give him the elder's name",
          r: "The elder is taken at Michaelmas and does not come back. The Ashen find out who gave the name; they always find out.",
          fx: (p, ctx) => say(more(p, ctx, { honor: -12, favor: 2, unflag: "mrb_ash_bearer" }), bond(p, { age: 35, occ: "one of the Ashen" }, "enemy", -60)) },
        { t: "Refuse, and wait for them to come",
          r: "They come in a week. You are fined a year's earnings and made to stand at the Temple door on Ash Night with a lamp, for every neighbor to see.",
          fx: { coinPct: -0.4, happy: -6, fame: 2, deed: "Stood penance at the Temple door on Ash Night", them: { type: "enemy", op: -30 } } },
      ],
    },

    // ================================================================== Bloodlines (no realm gate: the blood travels)

    // bd_greenglass: Falcon eyes; bought green glass shades for 8 suns
    {
      id: "mrb_bd_glass",
      title: "Noon on the tower",
      cond: (p, C) => C.adult(p) && C.blood(p, "falcon") && C.flag(p, "bd_greenglass") && A.S.year - p.flags.bd_greenglass >= 2,
      w: 2, once: true,
      text: p => `Noon, the sun straight overhead. The green glass shades you bought for 8 suns sit on your nose, and the world through them is dim and kind. Riders on the far ridge, three kilometers off. ${A.C.soldier(p) ? "Your captain" : "The village elders"} must know whose banner it is. Through green glass it is a smudge. Without the glass you could count their lances, and pay for it until dusk.`,
      choices: [
        { t: "Take off the glass and read the banner", check: { s: "ins", s2: "wil", d: 50 },
          win: { r: "Forty lances, a baggage train, a broken wheel on the banner: a free company. You report it, then go blind with pain on the tower stair. They thank you all evening; you hear it in the dark.",
            fx: (p, ctx) => { later("mrb_bd_glare", 4); return more(p, ctx, { favor: 5, merit: 2, fame: 2, health: -4, cause: "staring into the noon sun", flag: "mrb_bd_farread" }); } },
          lose: { r: "The sun drives a nail through each eye. You read nothing, and see nothing at all until dusk, and very little the next noon.",
            fx: { health: -10, happy: -4, wil: 1, cause: "staring into the noon sun" } } },
        { t: "Keep the glass on and report the smudge",
          r: "\"Riders. Forty, perhaps. Dust.\" It is true, and less than you could have said. Scouts go out the slow way, and come back the slow way.",
          fx: { favor: -1, wil: 0.5 } },
      ],
    },
    // arc: mrb_bd_farread -> the price of reading banners at noon
    {
      id: "mrb_bd_glare",
      title: "Grey at the edges",
      cond: (p, C) => C.adult(p) && C.blood(p, "falcon") && C.flag(p, "mrb_bd_farread") && A.S.year - p.flags.mrb_bd_farread >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_glare")) ctx.skip = 1; },
      text: "Since the noon you took off the green glass and read the free company's banner, you are sent for whenever riders show on the ridge. Now the edges of the world have gone grey, like smoke in the corner of a room. A physician holds a candle to each eye in turn. A year more of noon, he says, will cost you one of them.",
      choices: [
        { t: "Keep reading banners at noon", check: { s: "sta", s2: "wil", d: 52 },
          win: { r: "A year more, and both eyes hold, just. You are paid in a horse and a lord's thanks, and you buy darker glass with the thanks.",
            fx: { favor: 6, coin: 40, merit: 3 } },
          lose: { r: "At the spring muster the left eye goes dark at noon and does not come back. The right one reads banners for both.",
            fx: { wound: "lost_eye", health: -5, cause: "the Falcon eyes at noon" } } },
        { t: "Wear the green glass at every hour",
          r: "The world is green and dim and always kind. Someone else is sent up the tower stair. You find you can read again by candle, slowly.",
          fx: { favor: -3, happy: 2, unflag: "mrb_bd_farread" } },
        { t: "Train a young lookout in your place",
          r: "A tanner's girl with sharp eyes and no Falcone blood. She learns where to look, which is half of it. The other half she will learn alone.",
          fx: (p, ctx) => say(more(p, ctx, { wil: 1 }), bond(p, { sex: "F", age: 14, occ: "a tanner's daughter" }, "student", 30)) },
      ],
    },

    // bd_doravelli_named: tasted the wolfsbane at seven; named in the book of the Cup
    {
      id: "mrb_bd_cup_bribe",
      title: "One cup, one silence",
      cond: (p, C) => C.adult(p) && C.blood(p, "taster") && C.flag(p, "bd_doravelli_named") && A.S.year - p.flags.bd_doravelli_named >= 10,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 45, occ: "a grain factor" }); },
      text: "The book of the Cup has held your name since you were seven and tasted the wolfsbane. You taste for the Grain Staple now: every cargo, every cup at a factor's table. Tonight {themFull} slides a purse across the cloth. Five hundred suns. Tomorrow at the council supper one cup will be bitter, and you will notice nothing.",
      choices: [
        { t: "Push the purse back, and tell the Staple",
          r: "The Staple's guards take {them} before the sweet course. House Doravelli sends you a silver tasting spoon on a chain, the kind its own tasters wear.",
          fx: { honor: 6, fame: 2, deed: "Refused a poisoner's purse at the Staple", them: { type: "enemy", op: -60 } } },
        { t: "Take the purse, and let the cup pass",
          r: "You taste the cup at supper and say nothing. A councillor of the Staple dies in the night of what the physicians call a weak heart. You have 500 suns.",
          fx: (p, ctx) => { later("mrb_bd_cup_known", 3); return more(p, ctx, { coin: 500, honor: -20, trait: "deceitful", them: { op: 20 }, flag: "mrb_bd_cup_passed" }); } },
        { t: "Take the purse, then spill the cup", check: { s: "deception", s2: "spd", d: 55 },
          win: { r: "A clumsy elbow. The cup goes over the cloth, and a fresh one comes from a clean jug. You keep the purse, and {them} watches you over the rest of the supper.",
            fx: { coin: 500, honor: -4, secret: 1, them: { type: "enemy", op: -40 } } },
          lose: { r: "Too clumsy by half. {them} sees what you did, and the councillor sees you see it. By morning both of them are your enemies.",
            fx: (p, ctx) => say(more(p, ctx, { honor: -2, them: { type: "enemy", op: -50 } }), bond(p, { sex: "M", age: 55, occ: "a councillor of the Staple" }, "enemy", -40)) } },
      ],
    },
    // arc: mrb_bd_cup_passed -> the house of the Cup comes to ask
    {
      id: "mrb_bd_cup_known",
      title: "The house's name",
      cond: (p, C) => C.adult(p) && C.blood(p, "taster") && C.flag(p, "mrb_bd_cup_passed") && A.S.year - p.flags.mrb_bd_cup_passed >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_cup_known")) { ctx.skip = 1; return; } if (!cast(p, ctx, "CHR-0185")) make(p, ctx, { sex: "M", age: 35, occ: "a taster of House Doravelli" }); },
      text: "{themFull} of House Doravelli comes to your door with a silver tasting spoon on his chain and the book of the Cup under his arm, your name in it at seven. \"A taster who lets poison pass carries the whole house's name,\" he says. He knows about the councillor's weak heart. He has not yet decided what he knows.",
      choices: [
        { t: "Confess, and ask what the house wants",
          r: "Your name struck from the book, and you gone from the Staple by Lent. The house will say you were never one of theirs. You keep your life, and lose your blood.",
          fx: { unflag: "bd_doravelli_named", honor: 3, them: { op: -20 } } },
        { t: "Deny it to his face", check: { s: "deception", s2: "wil", d: 60 },
          win: { r: "He listens, tastes the air, and goes. You have lied to a man who tastes lies for a living. He will be back.",
            fx: { honor: -4, them: { type: "enemy", op: -40 } } },
          lose: { r: "He names the purse, the sum and the factor. He has known for a year. The house hands you to the Staple's court.",
            fx: { prison: 3, why: "letting poison pass at the Staple", honor: -10 } } },
        { t: "Offer to taste for him, unpaid, for life",
          r: "He considers it the way he considers a wine. \"For the queen's table,\" he says, \"where no one can bribe you, because no one would dare.\" You belong to him now.",
          fx: (p, ctx) => say(more(p, ctx, { honor: 2, them: { type: "lord", op: 20 } }), more(p, ctx, { sworn: 1 })) },
      ],
    },
    {
      id: "mrb_bd_cup_child",
      title: "The Rule of the Cup, again",
      cond: (p, C) => C.adult(p) && C.blood(p, "taster") && C.hasKids(p) && C.flag(p, "bd_doravelli_named") && A.S.year - p.flags.bd_doravelli_named >= 12 && !!kidAged(p, 6, 9),
      w: 3, once: true,
      setup: (p, ctx) => { const k = kidAged(p, 6, 9); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.tastes = shows(k, "taster") ? 1 : 0; },
      text: "{them} is {themAge}. A steward of House Doravelli is at the door with a cup of water and a small stoppered bottle. You remember the taste: a cold iron gate in winter. Your mother held your hand very tightly. If {them} tastes it, {theyHe} goes to the Staple house to train. If not, {theyHe} stays yours.",
      choices: [
        { t: "Hold {theirHis} hand, and let them test",
          r: (p, ctx) => ctx.tastes
            ? "{them} makes a face and spits. The steward writes the name in the book of the Cup, under yours. At Michaelmas {theyHe} goes to the Staple house with a small bag, and does not cry."
            : "{them} drinks it all and says it tastes of water. The steward closes the book, kindly. You find you are holding the small hand too tightly.",
          fx: { honor: 2, them: { op: 10 } } },
        { t: "Water the cup when the steward looks away", check: { s: "deception", s2: "spd", d: 50 },
          win: { r: "Three drops of well water into one drop of wolfsbane. {them} tastes nothing, or says so. The steward closes the book. You will never know.",
            fx: { honor: -3, secret: 1, them: { op: 5 } } },
          lose: { r: "The steward sees. A fresh cup, a fresh drop, and a note in the book of the Cup beside your own name.",
            fx: { honor: -5, favor: -2, them: { op: 5 } } } },
        { t: "Refuse the steward at the door",
          r: "The Rule of the Cup has no clause for a refusal. The house sends a lawyer, then a letter, then nothing at all, which is worse than either.",
          fx: { unflag: "bd_doravelli_named", wil: 2, them: { op: 15 } } },
      ],
    },

    // bd_harrow_match: a hidden carrier of the bull-blood; agreed to wed a Harrowsett cousin
    {
      id: "mrb_bd_harrow_wed",
      title: "The cousin from Harrowsett",
      cond: (p, C) => C.adult(p) && !C.married(p) && C.carrier(p) && line(p, "bull") && C.flag(p, "bd_harrow_match") && A.S.year - p.flags.bd_harrow_match >= 2 && A.S.year - p.flags.bd_harrow_match <= 12,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-01", sex: p.sex === "M" ? "F" : "M", sur: "Harrow", occ: "a Harrow cousin from Harrowsett" }); },
      text: "You agreed to the Harrow match, and the elders took their time. Now the cousin has come from Harrowsett: {themFull}, broad in the shoulder, quiet, eating like two. The wedding would be at Copperham at Michaelmas. Your children might be full bulls, giants who die at fifty. That is the Harrow bargain, and you said yes to it.",
      choices: [
        { t: "Marry {themHim} at Michaelmas",
          r: "Copperham bells, a Harrow feast, and the family tree read aloud at the wedding supper. {them} turns out to be kind, which the elders never promised.",
          fx: (p, ctx) => { const q = A.P(ctx.pid); if (q && q.alive && !A.C.married(p)) A.marry(p, q); later("mrb_bd_harrow_heir", 6); return more(p, ctx, { honor: 3, flag: "mrb_bd_harrow_wed" }); } },
        { t: "Ask for a year to know {themHim}",
          r: "The elders grumble and allow it. You walk out with {them} after church on Sundays. {theyHe} is easier company than you feared.",
          fx: { happy: 2, them: { type: "friend", op: 30 } } },
        { t: "Break the match", check: { s: "diplomacy", s2: "wil", d: 52 },
          win: { r: "The elders are cold, but they find {them} another carrier by spring. Your name goes off the Harrow lists.",
            fx: { unflag: "bd_harrow_match", wil: 1.5, happy: 3, them: { op: -10 } } },
          lose: { r: "The elders write to your father. You are not welcome at Copperham this year, or the next.",
            fx: { unflag: "bd_harrow_match", honor: -3, rel: { who: "father", op: -15 }, them: { op: -20 } } } },
      ],
    },
    // arc: mrb_bd_harrow_wed -> the Harrow bargain, one generation down
    {
      id: "mrb_bd_harrow_heir",
      title: "A bull in the cradle",
      cond: (p, C) => C.adult(p) && C.hasKids(p) && C.flag(p, "mrb_bd_harrow_wed") && A.S.year - p.flags.mrb_bd_harrow_wed >= 5 && !!kidAged(p, 3, 12),
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_harrow_heir")) { ctx.skip = 1; return; } const k = kidAged(p, 3, 12); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.full = shows(k, "bull") ? 1 : 0; },
      text: (p, ctx) => ctx.full
        ? "{them} is {themAge} and lifts a laden cart wheel off the ground for a dare. A full bull: two Harrow carriers, one broken brake, just as the elders wanted. A Harrow captain writes from Copperham. The March Hawks will foster {themHim} and make a captain of {themHim}. Full bulls rarely see fifty."
        : "{them} is {themAge}: strong for {theirHis} age, and no more. Not a full bull. The elders at Harrowsett write to ask, politely, whether you would promise {themHim} to a Harrow cousin in time. The bargain goes on, one generation down.",
      choices: [
        { t: "Send {themHim} to Copperham", req: (p, C, ctx) => !!ctx.full,
          r: "{them} goes in a Harrow wagon, waving the whole length of the lane. Copperham makes captains. It does not make old men.",
          fx: { honor: 3, favor: 2, deed: "Sent a full bull to the March Hawks", them: { op: -10 } } },
        { t: "Keep {themHim} home, and feed {themHim}", req: (p, C, ctx) => !!ctx.full,
          r: "The bread bill triples. {them} carries the plough to the field on one shoulder. The Harrows stop writing.",
          fx: { coinPct: -0.2, them: { op: 25 } } },
        { t: "Promise {themHim} to a cousin, as you were", req: (p, C, ctx) => !ctx.full,
          r: "You write the promise in your best hand. {them} will learn of it later, as you did, at a family table.",
          fx: { honor: 2, deed: "Promised a child to the Harrow match", them: { op: -10 } } },
        { t: "Write back no. One Harrow bargain is enough", req: (p, C, ctx) => !ctx.full,
          r: "The elders write once more, then not again. {them} grows up strong, unpromised, and without an invitation to Copperham.",
          fx: { wil: 1, them: { op: 15 } } },
      ],
    },

    // bd_vitia: the laughing blood; raised at Vitia under the Montaro name after the nettle test
    {
      id: "mrb_bd_vitia",
      title: "Raised at Vitia",
      cond: (p, C) => C.adult(p) && C.blood(p, "laughing") && C.flag(p, "bd_vitia") && A.S.year - p.flags.bd_vitia >= 12,
      w: 2, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0169")) make(p, ctx, { race: "human", realm: "POL-03", sex: "F", age: 45, occ: "a captain of the Laughing Company" }); },
      text: "You were raised at Vitia under the Montaro name because a fistful of nettles could not make you cry. Now {themFull}, who drills the Laughing Company, is calling in Vitia fosterlings of fighting age. She inspects you herself, palm by palm, for wounds you have not noticed. She finds one.",
      choices: [
        { t: "Ride a season with the Laughing Company",
          r: "A season in the Laughing Company. You charge where others wait, and laugh while you do it, as Montaros are meant to. {them} searches you for wounds every night.",
          fx: (p, ctx) => { later("mrb_bd_fester", 2); return more(p, ctx, { fame: 3, honor: 2, skill: { melee: 3 }, them: { op: 10 }, flag: "mrb_bd_laughing" }); } },
        { t: "Let her lance the wound, and decline",
          r: "A splinter under a thumbnail, black and swollen for a week, and you never felt it. She lances it, says \"coward\" in a calm voice, and moves to the next.",
          fx: { health: 4, wil: 1, them: { op: -25 } } },
        { t: "Ask her to teach you to find your own wounds",
          r: "Every night, she says, strip and look. Every morning, again. You learn to read your own body like a ledger kept by a stranger.",
          fx: { skill: { medicine: 3 }, trait: "cautious", them: { type: "mentor", op: 20 } } },
      ],
    },
    // arc: mrb_bd_laughing -> a wound you never felt
    {
      id: "mrb_bd_fester",
      title: "The wound you did not feel",
      cond: (p, C) => C.adult(p) && C.blood(p, "laughing") && C.flag(p, "mrb_bd_laughing") && A.S.year - p.flags.mrb_bd_laughing >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_fester")) ctx.skip = 1; },
      text: "Three days after a skirmish you notice the smell before anything else. A crossbow bolt-head is in your thigh, under a scab you never felt forming. The laughing blood heals fast, and it heals over anything. The Laughing Company's surgeon prods the leg and says it may have to come off at the knee.",
      choices: [
        { t: "Let him cut out the bolt-head, and keep the leg", check: { s: "sta", s2: "wil", d: 52 },
          win: { r: "He digs for an hour while you watch and make conversation. The bolt-head comes out black. The leg stays, with a hole in it you could lose a coin in.",
            fx: { wound: "deep_cut", health: -12, cause: "a bolt-head you never felt", deed: "Chatted through a surgeon's digging" } },
          lose: { r: "The rot is past the knife. He takes the leg below the knee in the end, and you joke with him all through it. The others in the tent are sick.",
            fx: { wound: "limp", health: -25, cause: "a festered bolt wound" } } },
        { t: "Let him take the leg now",
          r: "Safer, he says, and he is right. You walk with a crutch by midsummer and feel nothing about it at all, which frightens your friends more than the leg did.",
          fx: { wound: "limp", health: -15, wil: 2, cause: "a surgeon's saw" } },
        { t: "Refuse the knife. Montaros heal", check: { s: "sta", s2: "wil", d: 60 },
          win: { r: "A fever for a week, then another. The leg heals around the iron, and you carry a bolt-head in your thigh to the end of your days.",
            fx: { health: -15, sta: 0.5, cause: "a fever from an old bolt", deed: "Carries a bolt-head in the thigh" } },
          lose: { r: "The fever takes a month and most of your strength. You keep the leg. It never bends right again.",
            fx: { wound: "limp", health: -30, cause: "a festered bolt wound" } } },
      ],
    },

    // bd_runners_camp: ran forty kilometers for the Runners' Camp; the mark of Orrak painted on your arm
    {
      id: "mrb_bd_runner_word",
      title: "Word to the Drum Stones",
      cond: (p, C) => C.adult(p) && C.carrier(p) && line(p, "longwind") && C.flag(p, "bd_runners_camp") && A.S.year - p.flags.bd_runners_camp >= 3,
      w: 2, once: true,
      text: "The mark of Orrak is still on your arm from the day you ran forty kilometers for the Runners' Camp. Tonight the keeper of the camp puts a knotted cord in your hand. Aldmark riders are over the Glenwash, and the clans at the Drum Stones must hear by dawn after next. The short way runs through the Gashmar Fords, where Tukar Longwind died bringing up the reserve.",
      choices: [
        { t: "Run the short way, through the fords", check: { s: "sta", s2: "stealth", d: 55 },
          win: { r: "You cross the fords at moonrise between two Aldmark patrols and run on into the morning. The Drum Stones beat for war while the riders are still watering their horses.",
            fx: (p, ctx) => { later("mrb_bd_post", 4); return more(p, ctx, { fame: 4, skill: { athletics: 3 }, deed: "Carried word through the Gashmar Fords", flag: "mrb_bd_ran" }); } },
          lose: { r: "A patrol sees you at the second ford. An arrow takes you high in the back, and you run the last forty kilometers with it still in.",
            fx: (p, ctx) => { later("mrb_bd_post", 4); return more(p, ctx, { wound: "arrow_wound", health: -15, fame: 2, cause: "an Aldmark arrow at the Gashmar Fords", flag: "mrb_bd_ran" }); } } },
        { t: "Run the long way round the fords",
          r: "Ninety kilometers more, and you reach the Drum Stones a day late, still running. The clans gather anyway. The keeper never mentions the day, which is worse than if he did.",
          fx: { honor: -1, sta: 0.5, skill: { athletics: 2 } } },
        { t: "Take two young runners, to learn the fords", check: { s: "command", s2: "sta", d: 52 },
          win: { r: "Three runners through the fords in the dark, single file, and three out. The young ones will run it alone next time, and teach it after that.",
            fx: (p, ctx) => { later("mrb_bd_post", 4); return say(more(p, ctx, { fame: 2, skill: { command: 2 }, flag: "mrb_bd_ran" }), bond(p, { sex: "M", age: 15, occ: "a young runner of the Longwind line" }, "student", 35)); } },
          lose: { r: "A patrol sees the third runner. You bring one of the two home. The camp cuts the other's name on a cairn.",
            fx: { honor: -3, happy: -8, wil: 1.5 } } },
      ],
    },
    // arc: mrb_bd_ran -> the relay of runner posts
    {
      id: "mrb_bd_post",
      title: "The twelfth post",
      cond: (p, C) => C.adult(p) && C.carrier(p) && line(p, "longwind") && C.flag(p, "mrb_bd_ran") && A.S.year - p.flags.mrb_bd_ran >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_post")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 20, occ: "a rider of the clans" }); },
      text: "The relay of runner posts from Gashmar to the Drum Stones is nearly built. The keeper of the Runners' Camp wants a carrier of the long wind for the twelfth post: a hut, a drum, dried meat, and fifty kilometers each way whenever the drum sounds. In the camps {themFull} and his kind still call the Longwind half-human. At the post, no one would call you anything for weeks.",
      choices: [
        { t: "Take the twelfth post",
          r: "A hut on a rise, a drum under a hide, and grass in every direction. The drum sounds four times that first winter. You answer it four times.",
          fx: { sta: 0.5, happy: 2, skill: { survival: 3 }, deed: "Kept the twelfth runner post" } },
        { t: "Stay with the clan, and answer the jeers", check: { s: "str", s2: "wil", d: 50 },
          win: { r: "At the summer gathering {them} calls you half-human once too often. You put him on his back in the wrestling ring, and he stops saying it near you.",
            fx: { fame: 2, them: { type: "rival", op: -20 } } },
          lose: { r: "{them} puts you on your back in the wrestling ring, in front of everyone. An orc can still be standing, the Longwind say. Not today.",
            fx: { happy: -6, them: { type: "rival", op: -30 } } } },
        { t: "Teach the young runners at the camp",
          r: "You run the cairn course every morning with children who are twelve and furious. Some will make forty kilometers. You know which ones by the third day.",
          fx: (p, ctx) => say(more(p, ctx, { happy: 3, skill: { command: 2 } }), bond(p, { sex: "F", age: 12, occ: "a child of the Longwind line" }, "student", 35)) },
      ],
    },

    // bd_quickened_school: caught the master's dropped rod; taught the deeper drills
    {
      id: "mrb_bd_quick_torch",
      title: "By torchlight",
      cond: (p, C) => (C.teen(p) || C.adult(p)) && C.blood(p, "quickened") && C.flag(p, "bd_quickened_school") && A.S.year - p.flags.bd_quickened_school >= 10,
      w: 2, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0256")) make(p, ctx, { race: "elf", sex: "F", age: 50, occ: "a swordmaster of the Queen's Quickened" }); },
      text: p => `${cap(ago(p, "bd_quickened_school"))} of the deeper drills since you caught the master's rod. {themFull}, head of the Queen's Quickened, will try you tonight for the guard at Ithrien's door. The bout is by torchlight, in a hall full of flicker. Flicker brings on the fits that killed Sethril himself. She knows that. She wants to see what you do about it.`,
      choices: [
        { t: "Fight by torchlight, eyes on her shoulder", check: { s: "sword", s2: "spd", d: 55 },
          win: { r: "You fight with your eyes half shut, reading her shoulder, not the light. Four passes. She lowers her blade first. \"The door,\" she says.",
            fx: (p, ctx) => { later("mrb_bd_quick_door", 5); return more(p, ctx, { fame: 3, skill: { sword: 3 }, deed: "Passed the Quickened trial by torchlight", them: { type: "mentor", op: 30 }, flag: "mrb_bd_quick_guard" }); } },
          lose: { r: "The torches swim, and then there is nothing. You wake on the floor with a bitten tongue, in a ring of very still faces.",
            fx: { wound: "concussion", health: -10, cause: "a fit in the torchlit hall", them: { op: -5 } } } },
        { t: "Ask for the bout at noon, and say why",
          r: "She looks at you without expression. \"An enemy chooses the light,\" she says. Then: \"Noon.\" You pass, and she marks you for day watches only.",
          fx: { skill: { sword: 2 }, trait: "cautious", them: { op: 10 } } },
        { t: "Withdraw from the trial",
          r: "The Quickened do not ask twice. You keep your fits to yourself, and your blade for duels in daylight.",
          fx: { wil: 1, them: { op: -15 } } },
      ],
    },
    // arc: mrb_bd_quick_guard -> fire at the queen's door
    {
      id: "mrb_bd_quick_door",
      title: "Fire in the hall",
      cond: (p, C) => (C.teen(p) || C.adult(p)) && C.blood(p, "quickened") && C.flag(p, "mrb_bd_quick_guard") && A.S.year - p.flags.mrb_bd_quick_guard >= 5,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_quick_door")) ctx.skip = 1; },
      text: p => `${cap(ago(p, "mrb_bd_quick_guard"))} at Ithrien's door. Tonight a brazier tips in the hall and the hangings catch, and the whole room becomes flicker: fire behind leaves of carved oak. Through it come two men with knives, one for the door and one for the window. You feel the fit coming like weather over the trees.`,
      choices: [
        { t: "Shut your eyes and fight by ear", check: { s: "sword", s2: "ins", d: 60 },
          win: { r: "You fight blind. One man down at the door, one gone through the window with your cut across his arm. The household calls it a wonder. You call it the drills.",
            fx: { fame: 6, skill: { sword: 3 }, deed: "Held the queen's door through a fire", epithet: "the Shut-Eyed" } },
          lose: { r: "The fit takes you mid-pass. The other guards hold the door over your body. You wake alive, which is not the same as having done well.",
            fx: { wound: "scar_face", health: -15, honor: -3, cause: "an assassin's knife during a fit" } } },
        { t: "Smother the brazier before you draw", check: { s: "spd", s2: "ins", d: 50 },
          win: { r: "Your cloak over the brazier, and the light is gone. Then it is only two men with knives against one of the Quickened, an old story with one ending.",
            fx: { fame: 4, honor: 2, skill: { sword: 2 } } },
          lose: { r: "The cloth catches. You beat it out on your own arm and fight on with the arm half cooked.",
            fx: { wound: "burn", health: -12, cause: "a burning cloak" } } },
        { t: "Call the others and hold the door, eyes down",
          r: "You fight at the door's edge looking at the floor, and the door holds. The window does not. One assassin escapes, and the guard captain writes that down.",
          fx: { honor: 1, wil: 1, favor: -2 } },
      ],
    },

    // bd_lightfoot_scout: walked the birch pole; joined the scout families of Rinael and Elwen
    {
      id: "mrb_bd_light_logger",
      title: "An axe past the Oak Line",
      cond: (p, C) => (C.young(p) || C.adult(p)) && C.ageAdj(p) >= 7 && C.carrier(p) && line(p, "lightfoot") && C.flag(p, "bd_lightfoot_scout") && A.S.year - p.flags.bd_lightfoot_scout >= 8,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-01", sex: "M", age: 35, occ: "a logger from Aldmark" }); },
      text: "You have run the branch paths with the scout families of Rinael and Elwen since the day you walked the birch pole. This morning, from twelve meters up an oak, you see a human on the wrong side of the Oak Line: {themFull}, with two oxen and a cart, cutting ship oak for Aldmark. The scout captain decides whether a logger lives. Only you have seen him.",
      choices: [
        { t: "Run back to the scout captain",
          r: "The captain hears you out and takes three scouts and a bow. You do not go back to watch. The cart comes back across the Line at dusk without a driver.",
          fx: (p, ctx) => { kill(ctx, "shot by the scouts of the Oak Line"); return more(p, ctx, { honor: -2, skill: { stealth: 2 }, deed: "Reported a logger past the Oak Line" }); } },
        { t: "Drop down and warn him off",
          r: "He nearly dies of fright when you land beside him without a sound. He takes his oxen, and his life, back over the Line. He looks back twice.",
          fx: (p, ctx) => { later("mrb_bd_light_fall", 5); const s = more(p, ctx, { honor: 2, them: { type: "acquaint", op: 30 }, flag: "mrb_bd_light_spared" }); mark(p, A.P(ctx.pid), "light_logger"); return s; } },
        { t: "Cut his traces and scatter the oxen", check: { s: "stealth", s2: "spd", d: 48 },
          win: { r: "The oxen go crashing off into the Evenwood, and he goes after them, cursing, back toward the Line. The scouts find a felled oak and no one to ask about it.",
            fx: { skill: { stealth: 2 }, them: { op: -20 } } },
          lose: { r: "He sees you and swings the axe. It misses, mostly. Your forearm cracks against the trunk like a dry stick.",
            fx: { wound: "scar_arm", health: -12, cause: "a logger's axe at the Oak Line" } } },
      ],
    },
    // arc: mrb_bd_light_spared -> the logger you let go finds you after a fall
    {
      id: "mrb_bd_light_fall",
      title: "The man you let go",
      cond: (p, C) => (C.young(p) || C.adult(p)) && C.carrier(p) && line(p, "lightfoot") && C.flag(p, "mrb_bd_light_spared") && A.S.year - p.flags.mrb_bd_light_spared >= 5,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_bd_light_fall") || !marked(p, ctx, "light_logger")) ctx.skip = 1; },
      text: p => `A branch you have run a thousand times gives under your foot near the Oak Line. ${shows(p, "lightfoot") ? "Lightfoot bones break like a bird's" : "It is a long fall"}: your shin goes, and you lie in the leaf floor unable to stand. The one who finds you at dusk is {themFull}, the logger you warned off ${ago(p, "mrb_bd_light_spared")} ago. He has a cart again, and twenty men, and a buyer in Kingsmere.`,
      choices: [
        { t: "Let him carry you home, and owe him",
          r: "He carries you to the Line on his own back. There he sets you down and names his price: one quiet season on the Calena side. You owe him that, and you both know it.",
          fx: { wound: "limp", health: -15, cause: "a fall near the Oak Line", oweThem: 2, them: { op: 30 } } },
        { t: "Make him swear off the Line first", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "He swears on his mother's grave. The scouts carry you home, and his carts stay on their own side of the Line, most of the time.",
            fx: { health: -15, cause: "a fall near the Oak Line", honor: 3, them: { type: "friend", op: 30 } } },
          lose: { r: "He laughs and leaves you there. The scouts find you at noon the next day, cold to the bone.",
            fx: { wound: "frostbite", health: -25, cause: "a night on the leaf floor", them: { type: "enemy", op: -30 } } } },
        { t: "Send him for the scouts, knowing what they will do",
          r: "He goes for help, to the people who would hang him. The scouts take you home, and him to the captain. You did not lie to him. You did not warn him either.",
          fx: (p, ctx) => { kill(ctx, "hanged by the scouts of the Oak Line"); return more(p, ctx, { health: -15, cause: "a fall near the Oak Line", honor: -6, trait: "cynical" }); } },
      ],
    },

    // ================================================================== The military families (C.famMil / gentry_mil)

    // rk_fm_promised: said at the family table you would serve; your uncle gave you his belt-knife
    {
      id: "mrb_fm_promise_due",
      title: "The place that waited",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && !C.soldier(p) && C.flag(p, "rk_fm_promised") && A.S.year - p.flags.rk_fm_promised >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { prepF(p, ctx); ctx.wait = ago(p, "rk_fm_promised"); },
      text: "At the family table you said you would serve, proudly, and your uncle gave you his own belt-knife. The place in {funit} has waited {wait}. The roll is open, and you have not come. A letter arrives from {seat} in your uncle's hand. One line: \"Every {fsur} serves.\" His knife is on your belt as you read it.",
      choices: [
        { t: "Ride to {seat} and take your place",
          fx: (p, ctx) => enlistFam(p, ctx, "You ride in with the knife at your belt. Your uncle grips your arm at the gate and does not let go for a while.", "You ride to {seat}, but the rolls will not take you.") },
        { t: "Send the knife back with a letter",
          r: "Your letter is short and polite and true. A month later the knife comes back, with your letter wrapped round it, unopened.",
          fx: { wil: 2, rel: { who: "father", op: -15 }, unflag: "rk_fm_promised", flag: "rk_fm_free" } },
        { t: "Send silver for the company's horses (50 suns)", req: p => p.coin >= 50,
          r: "Fifty suns for remounts. Your uncle accepts it, and in his next letter calls you by your full name, which he has never done before.",
          fx: { coin: -50, honor: -1, rel: { who: "father", op: -5 } } },
      ],
    },
    // rk_fm_free: told the family you wanted something else, or refused the proving
    {
      id: "mrb_fm_free_called",
      title: "Even you",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && !C.soldier(p) && C.flag(p, "rk_fm_free") && A.S.year - p.flags.rk_fm_free >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { prepF(p, ctx); },
      text: "You told the family you wanted something else, and you got it. Now a cousin is dead in {funit}'s last fight, and the family is short an officer. {Head} writes from {seat}: one campaign, then you may go back to your own road. \"Every {fsur} serves,\" the letter ends. Under it, in a smaller hand: \"Even you.\"",
      choices: [
        { t: "Go, for one campaign",
          fx: (p, ctx) => enlistFam(p, ctx, "You ride to {seat} and take the dead cousin's place in the line. The family says nothing about the old refusal, out loud.", "You ride to {seat}, but the rolls will not take you.") },
        { t: "Refuse, as you did before",
          r: "Your refusal goes back in your own hand. At the next family dinner your name is read out in a particular tone, and your allowance from the house stops.",
          fx: { flag: "disowned", wil: 2, honor: 1, rel: { who: "father", op: -15 } } },
        { t: "Pay for a substitute (60 suns)", req: p => p.coin >= 60,
          r: "A hired spear rides in your place in the family colours. {Head} takes the silver and says nothing about it at the next dinner, at length.",
          fx: { coin: -60, honor: -2, deed: "Paid a substitute to ride for the family" } },
      ],
    },
    // rk_fm_proved: passed the proving; your father handed you the family badge at dawn
    {
      id: "mrb_fm_badge",
      title: "Asleep on the watch",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && C.flag(p, "rk_fm_proved") && A.S.year - p.flags.rk_fm_proved >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { prepF(p, ctx); const f = A.family(p); make(p, ctx, { sex: "M", age: 15, sur: f && f.sur ? f.sur : p.sur, occ: "your cousin" }); },
      text: "You passed the proving, and your father handed you the family badge at dawn. This year it was your cousin {them}'s turn. He marched the day and fought the bout well, and at midnight you found him asleep on the watch at the edge of the family's land. Only you found him. The household is waiting at breakfast to hear how his night went.",
      choices: [
        { t: "Tell the household the truth",
          r: "\"Next year,\" they tell him, as they nearly told you. {them} does not speak to you until the winter is out, and then only about horses.",
          fx: { honor: 3, them: { op: -25 } } },
        { t: "Say he stood all night",
          r: "The household cheers, and {them} gets his badge with the bread. He knows what you did. So do you, every time you see the badge on him.",
          fx: (p, ctx) => { later("mrb_fm_cousin_war", 4); const s = more(p, ctx, { honor: -4, them: { type: "friend", op: 30 }, flag: "mrb_fm_covered" }); mark(p, A.P(ctx.pid), "fm_cousin"); return s; } },
        { t: "Wake him, and stand the rest of the watch with him",
          r: "You stand together until dawn, and by then it is true enough that he stood the watch. He gets his badge. You get a cousin who would follow you anywhere.",
          fx: { honor: -1, sta: 0.5, them: { type: "friend", op: 40 } } },
      ],
    },
    // arc: mrb_fm_covered -> the cousin sleeps on a real watch
    {
      id: "mrb_fm_cousin_war",
      title: "A second watch",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && C.flag(p, "mrb_fm_covered") && A.S.year - p.flags.mrb_fm_covered >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_fm_cousin_war") || !marked(p, ctx, "fm_cousin")) { ctx.skip = 1; return; } prepF(p, ctx); },
      text: "{them}, the cousin you swore had stood his proving watch, has fallen asleep on watch again: with {funit}, on campaign, the enemy two kilometers off. The camp was raided, and two men are dead. His captain wants to know whether this has happened before. {them} has given your name as one who can speak for him.",
      choices: [
        { t: "Tell the captain about the proving",
          r: "You tell it. {them} is flogged before the company and broken to the ranks. The captain thanks you. Your family does not.",
          fx: { honor: 3, rel: { who: "father", op: -5 }, them: { type: "enemy", op: -50 } } },
        { t: "Speak for him again", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "You swear he had a fever and has never slept on watch in his life. He is flogged, not hanged. He owes you his neck now, twice over.",
            fx: { honor: -5, owed: 3, them: { op: 20 } } },
          lose: { r: "The captain does not believe you. He writes your name beside your cousin's in the company book, under the same word.",
            fx: { honor: -8, favor: -3, them: { op: 10 } } } },
        { t: "Refuse to speak at all",
          r: "Silence is an answer in a family like yours. {them} is broken to the ranks. The family decides you knew all along, and said nothing twice.",
          fx: { honor: -2, them: { op: -30 } } },
      ],
    },
    // rk_fm_secret: found the founder's letters (less courage, more luck, someone else held the line), burned or hid them
    {
      id: "mrb_fm_letters",
      title: "Who held the line",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && C.flag(p, "rk_fm_secret") && A.S.year - p.flags.rk_fm_secret >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { prepF(p, ctx); make(p, ctx, { sex: "M", age: 45, occ: "a carter" }); },
      text: "At the feast for the family's founding, a stranger stands up at the low end of the hall: {themFull}, a carter from near {seat}. He says his great-grandfather held the line in {since}, not yours. The hall laughs. You do not. You have read the founder's own letters, in the founder's own hand, and the carter is right.",
      choices: [
        { t: "Stand up and say he is right",
          r: "The laughter stops. {Head} has you walked out of the hall. In the morning half the family will not speak to you, and the other half asks what the letters said.",
          fx: (p, ctx) => { later("mrb_fm_song", 4); return more(p, ctx, { honor: 6, rel: { who: "father", op: -15 }, them: { type: "friend", op: 30 }, flag: "mrb_fm_owned" }); } },
        { t: "Laugh with the hall",
          r: "He walks out into the dark with the laughter on his back. His children will tell the story at their own table, the way he told it, and yours will never hear it.",
          fx: { honor: -4, them: { type: "enemy", op: -30 } } },
        { t: "Find him after the feast with silver (30 suns)", req: p => p.coin >= 30,
          r: "He takes the silver and the hint. The family song stays as it is. You have bought it a few more years, at a carter's price.",
          fx: { coin: -30, secret: 1, them: { op: 20 } } },
      ],
    },
    // arc: mrb_fm_owned -> the song changes, and the family needs a head
    {
      id: "mrb_fm_song",
      title: "A new verse",
      cond: (p, C) => (C.famMil(p) || C.famKind(p, "gentry_mil")) && C.adult(p) && !C.famHead(p) && C.flag(p, "mrb_fm_owned") && A.S.year - p.flags.mrb_fm_owned >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mrb_fm_song")) { ctx.skip = 1; return; } prepF(p, ctx); },
      text: p => `${cap(ago(p, "mrb_fm_owned"))} since you stood up at the founding feast and said the carter was right. The family song has a new verse now, one line near the end, sung quietly. {Head} is old and failing, and the family will need a new head. Half of them say the one who told the truth should be it. The other half say that is exactly why not.`,
      choices: [
        { t: "Put yourself forward as head", check: { s: "persuasion", s2: "diplomacy", d: 58 },
          win: { r: "The family votes by hands in the long hall at {seat}. Yours are the most hands, by two. {Head} gives you the house seal from the sickbed, and the letters with it.",
            fx: (p, ctx) => { const f = A.family(p); if (f) f.headPid = p.id; return more(p, ctx, { honor: 3, fame: 2, deed: "Chosen head of the family by a show of hands" }); } },
          lose: { r: "The family votes by hands in the long hall. You lose by four. The new head is polite to you, in the careful way of a winner.",
            fx: { happy: -5, wil: 1, honor: 1 } } },
        { t: "Back a cousin who will keep the verse",
          r: "You speak for your cousin and the verse together. The cousin wins, keeps the verse, and owes you for both.",
          fx: (p, ctx) => say(more(p, ctx, { honor: 2 }), bond(p, { sex: "F", age: 35, occ: "your cousin, head of the family" }, "friend", 30)) },
        { t: "Stay away from the sickbed",
          r: "You stay at your own hearth. The family settles it without you, and the new verse is quietly dropped from the song at the next feast.",
          fx: { honor: -2, happy: -2, unflag: "mrb_fm_owned" } },
      ],
    },

    // ================================================================== A grandparent's last story

    // bd_grand_story: listened to every word of the story a grandparent never told your parents
    {
      id: "mrb_bd_grand_ask",
      title: "What was said by the fire",
      cond: (p, C) => C.adult(p) && C.parentsAlive(p) && C.flag(p, "bd_grand_story") && A.S.year - p.flags.bd_grand_story >= 5,
      w: 2, once: true,
      setup: (p, ctx) => {
        const g = grandOf(p, ctx);
        ctx.gpDead = g && !g.alive ? 1 : 0;
        const ps = A.relsOf(p, ["father", "mother"]).map(x => x.p).filter(q => q.alive);
        const own = g ? ps.find(q => (g.children || []).includes(q.id)) : null;
        const par = own || ps[0];
        if (!par) { ctx.skip = 1; return; }
        ctx.pid = par.id; ctx.own = own ? 1 : 0; ctx.prole = par.sex === "F" ? "mother" : "father";
      },
      text: (p, ctx) => `${ctx.gpDead ? "{gp} is in the ground now" : "{gp} is very old now, and wanders"}. {them}, your {prole}, sits down by you at the hearth. "Years ago, by the fire, {gp} told you something {gpHe} never told me," {theyHe} says. ${ctx.own ? "\"I am {gpHis} own child. I think I have a right to it.\"" : "\"I was family to {gpHis} house for thirty years. I think I have a right to it.\""}`,
      choices: [
        { t: "Tell {themHim} every word",
          r: "You tell it as it was told, the fire and all. {them} is quiet, then laughs, then is not laughing. Some things a child should hear from a parent.",
          fx: { happy: -2, them: { op: 15 }, unflag: "bd_grand_story" } },
        { t: "Keep the promise of the fire",
          r: "\"It was told to me,\" you say, \"not to the family.\" {them} gets up and goes out. A door can be shut very gently and still be shut.",
          fx: { wil: 1, them: { op: -20 }, flag: "mrb_bd_story_kept" } },
        { t: "Tell {themHim} a kinder version", check: { s: "deception", s2: "persuasion", d: 45 },
          win: { r: "You tell a gentler story with the same bones. {them} is grateful for it. The true one stays with you, by the fire where it was told.",
            fx: { honor: -2, them: { op: 10 }, flag: "mrb_bd_story_kept" } },
          lose: { r: "{them} has heard pieces of the true story from someone else. Now {theyHe} knows you will lie to {themHim} as well.",
            fx: { honor: -2, them: { op: -25 } } } },
      ],
    },
    // arc: mrb_bd_story_kept -> old, by the fire yourself
    {
      id: "mrb_bd_story_passed",
      title: "Your turn by the fire",
      cond: (p, C) => C.old(p) && C.flag(p, "mrb_bd_story_kept") && A.S.year - p.flags.mrb_bd_story_kept >= 10,
      w: 3, once: true,
      setup: (p, ctx) => {
        grandOf(p, ctx);
        const gk = A.relsOf(p, ["grandchild"]).map(x => x.p).find(q => q.alive && !A.isAdult(q));
        if (gk) ctx.pid = gk.id;
        else make(p, ctx, { age: 10, occ: "a child of the family" });
      },
      text: "You are the old one by the fire now. {them} sits at your feet, the age you were when {gp} called you over and said: I am going to tell you something I never told your parents. You kept that story even when your own parent asked for it. It is still yours to give, or to bury.",
      choices: [
        { t: "Tell {themHim} every word, as it was told",
          r: "You tell it slowly, the way it was told to you, and watch it go into {them} the way it went into you. Somewhere, years from now, it will be told again.",
          fx: { happy: 5, them: { op: 30 }, deed: "Passed on a grandparent's last story" } },
        { t: "Tell {themHim} a story of your own instead",
          r: "You tell {them} a thing you have never told anyone. The old story goes into the ground with you; the new one goes on without you.",
          fx: { wil: 1, them: { op: 25 }, unflag: "mrb_bd_story_kept" } },
        { t: "Bury it. Some stories end",
          r: "You poke the fire and tell {them} about the weather when you were young. {theyHe} is bored, and you let {themHim} be.",
          fx: { happy: -1, unflag: "mrb_bd_story_kept" } },
      ],
    },
  ]);
})();
