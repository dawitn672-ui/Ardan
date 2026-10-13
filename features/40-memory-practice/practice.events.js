// Memory callbacks for the practice pack (chunk "practice").
//
// The release's practice events (pf_: the price of a stumble, the night school, the steel crossbow, the keeper of
// songs, the dice-house...) set 29 flags that no event ever reads. Each event here reads one of them years later,
// recalls the original moment by its place, its people and the thing that was done, and poses a new decision with
// a lasting cost. Twelve of them set an mpf_ flag that a second event reads years after that (2-step arcs).
// README.md has the flag -> event table. Every cond reads its flag with C.flag(p, "x") and times it with
// A.S.year - p.flags.x, so the bench's memory index sees the link.
(function () {
  const C = A.C;

  // ---------- helpers
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const word = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));
  const yrs = (p, ctx, f) => { ctx.yrs = word(A.S.year - p.flags[f]); };   // flags hold the year they were set
  const T = ctx => (ctx && ctx.pid ? A.P(ctx.pid) : null);
  const live = (p, types) => A.relsOf(p, types).filter(x => x.p && x.p.alive);
  // the person a setter linked with newRel: a relation of these types made the same year the flag was set
  const linked = (p, f, types) => { const l = live(p, types).filter(x => x.r.since === p.flags[f] && A.isAdult(x.p)); return l.length ? l[0].p : null; };
  // a person this pack made earlier, found again by the role it gave them
  const byRole = (p, role) => { const x = live(p).find(r => r.p.flags && r.p.flags.mpf_role === role); return x ? x.p : null; };
  const apply = (p, ctx, o) => A.applyFx(p, o, ctx) || "";
  const join = (...a) => a.filter(s => typeof s === "string" && s).join(" ");
  const kill = (ctx, cause) => { const t = T(ctx); if (t && t.alive) A.kill(t, cause); };
  const moveHome = p => {
    const opts = A.S.prov.filter(x => x.owner === p.realm && x.id !== p.home);
    if (!opts.length) return "";
    const to = A.pick(opts); p.home = to.id;
    return `You settle in ${to.name}.`;
  };

  // The release names its people with a bare given name that lives only in the event's ctx, so the one place a name
  // survives is the life log, in the result text of the year the flag was set. Read it back from there, so the
  // bout-master, the steward or the dying keeper comes back under the name the player actually saw.
  const LOGGED = {
    bm: /it looks real\. (.{2,40}?) pays\./,                                   // pf_sword_stumble
    agent: /(?:Forty suns\. (.{2,40}?) says there may be more work|one for (.{2,40}?), one for yourself)/,   // pf_stealth_letter
    mst: /without touching\. (.{2,40}?) hires you for the season/,              // pf_sea_pilot
    stew: /quarter day\. (.{2,40}?) smiles at you in public/,                    // pf_intr_steward
    host: /who wanted (.{2,40}?) dead/,                                          // pf_intr_cup
    keeper: /When (.{2,40}?) dies, the songs do not/,                            // pf_music_old_songs
    eng: /your engine that did it\. (.{2,40}?) pays you well/,                   // pf_siege_engineer
    pr: /(?:can read a little\. (.{2,40}?) preaches about pride|scripture with them first\. (.{2,40}?) agrees)/,   // pf_learn_teach
    mer: /^(.{2,40}?) offers you a share in his business/,                       // pf_trade_scales
  };
  const logLines = (p, f) => {
    const y = p.flags[f];
    if (typeof y !== "number") return [];
    return (A.S.log || []).filter(e => e.year === y && e.pc === A.S.pc).flatMap(e => (e.lines || []).map(l => String((l && l[0]) || "")));
  };
  const logged = (p, f, key) => {
    const re = LOGGED[key];
    for (const line of re ? logLines(p, f) : []) {
      const m = re.exec(line), n = m && (m[1] || m[2]);
      if (n && !/[{}()<>"]/.test(n) && n.split(" ").length <= 3) return n;
    }
    return null;
  };
  // which of a setter's paths set the flag, where two paths set the same one
  const loggedHas = (p, f, re) => logLines(p, f).some(l => re.test(l));
  const PATH = {
    priceNamed: /Ears, later\. Not throats/,                  // pf_dagger_still_hall: you asked what they wanted, and were told
    skimmed: /keep a tenth of the difference/,                // pf_stew_steward_post: you skimmed a tenth
    coTaught: /scripture with them first/,                    // pf_learn_teach: the priest taught beside you
    crooked: /Loaded dice for the strangers/,                 // pf_gamb_house: you opened a crooked house
  };
  const sexOfName = (p, n) => { const c = LORE.cultures[p.cult] || LORE.cultures["CUL-02"] || {}; return (c.f || []).includes(n) && !(c.m || []).includes(n) ? "F" : "M"; };

  // an adult of a chosen race, sex, age and station, living where the player lives
  const mk = (p, o = {}) => {
    const race = o.race || p.race, R2 = GD.RACES[race] || GD.RACES.human, sex = o.sex || (A.chance(0.5) ? "M" : "F");
    const realm = o.realm || p.realm, same = race === p.race && realm === p.realm;
    const cult = same ? p.cult : A.cultureFor(race, realm) || p.cult;
    const faith = same ? p.faith : A.faithFor(race, realm) || p.faith;
    const adj = Math.max(17, o.ageAdj != null ? o.ageAdj : C.ageAdj(p) + A.ri(-4, 6));
    const status = o.status || (["royal", "noble"].includes(p.status) ? "gentry" : ["slave", "serf"].includes(p.status) ? "peasant" : p.status);
    const x = A.newPerson({ given: o.given || A.givenName(cult, sex), sex, race, realm: p.realm, cult, faith,
      born: A.S.year - Math.max(R2.adult + 1, Math.round(adj * R2.adult / 16)), status, home: p.home });
    const fn = A.familyName({ cult, realm, status, home: p.home, sex });
    x.sur = fn.sur; x.surMode = fn.mode;
    x.occ = o.occ || A.pick(A.OCC[status] || A.OCC.peasant);
    if (o.role) x.flags.mpf_role = o.role;
    return x;
  };
  // the person a role points at: found again, or made for the occasion
  const cast = (p, ctx, role, o) => { const t = byRole(p, role) || mk(p, Object.assign({ role }, o)); ctx.pid = t.id; return t; };

  // the setters' own local colour, computed the way they computed it
  const boutKind = p => {   // which bout was thrown: the sword pass or the wrestling hold
    const ev = p.flags.ev || {}, y = p.flags.pf_threw_bout;
    if (ev.pf_unarmed_paid_to_lose === y && ev.pf_sword_stumble !== y) return "hold";
    if (ev.pf_sword_stumble === y) return "pass";
    return C.prof(p, "unarmed", 50) && !C.prof(p, "sword", 45) ? "hold" : "pass";
  };
  const crewName = p => p.realm === "POL-21" ? "the climbing thieves of Kesh" : p.realm === "POL-16" ? "the pickpockets of the Exchange"
    : p.realm === "POL-17" ? "one of the rag gangs of Qadira" : "the crew that owns the fish market";
  const scalePlace = p => p.realm === "POL-21" ? "the Pepper Hall" : p.realm === "POL-32" ? "the scales of Amberport" : p.realm === "POL-16" ? "the Exchange" : "the cloth hall";
  const listeners = p => p.realm === "POL-26" ? "the queen's listeners, who answer to Nadia Lark" : p.realm === "POL-15" ? "the Tower of Far Eyes in Morhaven" : "the ruler's listeners";
  const songLore = p => ["POL-20", "POL-22"].includes(p.realm) ? "every royal line back forty generations"
    : ["POL-09", "POL-23"].includes(p.realm) || p.race === "giant" ? "a lineage-chant a whole day long"
    : ["POL-11", "POL-12", "POL-34"].includes(p.realm) ? "the long songs of Ulagan"
    : p.realm === "POL-17" ? "all of Hazir the Blind" : "the old oath-lays";
  const heirOf = p => {
    const kids = (p.children || []).map(A.P).filter(c => c && c.alive && A.isAdult(c));
    if (kids.length) return kids[0];
    const f = live(p, ["bestfriend", "friend", "student"]).filter(x => A.isAdult(x.p));
    return f.length ? f[0].p : null;
  };

  A.defEvents([
    // ===================== pf_threw_bout: you slipped in the third pass (sword) or fell on the second hold (wrestling) for a purse
    {
      id: "mpf_bout_rematch",
      title: "The same draw",
      cond: (p, C) => C.adult(p) && !C.old(p) && C.flag(p, "pf_threw_bout") && A.S.year - p.flags.pf_threw_bout >= 3 && (C.prof(p, "sword", 40) || C.prof(p, "unarmed", 45)),
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_threw_bout"); ctx.kind = boutKind(p);
        const bm = logged(p, "pf_threw_bout", "bm"); ctx.bmx = bm ? `the bout-master ${bm}` : "a bout-master";
        const t = mk(p, { ageAdj: C.ageAdj(p) - A.ri(2, 6), occ: ctx.kind === "hold" ? "a wrestler the drums call unthrown" : "the darling of the feast-day bouts" });
        ctx.pid = t.id;
      },
      text: (p, ctx) => ctx.kind === "hold"
        ? "Tomorrow's final puts you against {them} on the wrestling ground. {yrs} years ago a rich family paid you to fall on the second hold, and {them}, their boy, took the final. {theyHe} is grown and heavy now, and the drums say {theyHe} has never been thrown. No one has offered money this time. The old men who saw your fall have taken the front row."
        : "Feast-day bouts again, and the draw puts you against {them}. {yrs} years ago {bmx} paid you to slip in the third pass, and {them} won on your fall. {theyHe} has lived on that win since: pupils, a patron, a name. No one has offered money this time. The old betting men remember the third pass, and they are watching your feet.",
      choices: [
        { t: "Beat {themHim} cleanly, and let them do the sums", req: (p, C, ctx) => ctx.kind !== "hold", check: { s: "sword", s2: "ins", d: 55 },
          win: { r: "Two passes, and {them} is on the sand. The cheering stops halfway, while the old men count backward: you could always have beaten {themHim}. The bout-masters strike your name from their lists.",
            fx: { fame: 3, honor: -2, deed: "Beat the feast-day darling, years after selling the first bout", them: { type: "rival", op: -35 } } },
          lose: { r: "You lose, honestly this time, and it costs more than the purse ever paid. The betting men decide the first fall was real after all.",
            fx: { health: -6, fame: -2, wil: 1, them: { type: "rival", op: -5 }, cause: "a feast-day bout" } } },
        { t: "Throw {themHim} cleanly, and let them do the sums", req: (p, C, ctx) => ctx.kind === "hold", check: { s: "unarmed", s2: "str", d: 55 },
          win: { r: "You throw {themHim} on the first hold, so hard the drums stop. Then the old men in the front row start counting backward. The families who pay for falls cross you off their lists.",
            fx: { fame: 3, honor: -2, deed: "Threw the unthrown wrestler, years after selling the first fall", them: { type: "rival", op: -35 } } },
          lose: { r: "You lose, honestly this time, and it costs more than the purse ever paid. The old men decide the first fall was real after all.",
            fx: { health: -6, fame: -2, wil: 1, them: { type: "rival", op: -5 }, cause: "a wrestling final" } } },
        { t: "Go down again, the same way",
          r: "You go down in the same place, the same way. No one pays you this time. {them} hauls you up and raises your hand to the crowd, and the old men in the front row laugh.",
          fx: { honor: -3, fame: -2, happy: -4, them: { type: "friend", op: 20 } } },
        { t: "Tell {themHim} the truth before the bout",
          r: "{them} hears you out in the tent, white to the lips, and then tells the judges. Your name is struck from the bouts. {them} fights the final against a stranger, and wins it properly.",
          fx: { honor: 6, fame: -3, trait: "honest", them: { type: "acquaint", op: 10 } } },
      ],
    },
    {
      id: "mpf_bout_pupil",
      title: "The same purse",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_threw_bout") && A.S.year - p.flags.pf_threw_bout >= 5,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_threw_bout");
        ctx.how = boutKind(p) === "hold" ? "fall on the second hold" : "slip in the third pass";
        ctx.pid = mk(p, { ageAdj: 18 + A.ri(0, 3), occ: "a young fighter", role: "fighter" }).id;
      },
      text: "{them}, a young fighter who trains in your yard, comes to you with a purse in {theirHis} fist. A man has offered it for a {how}. {theyHe} wants to know whether it can be done, and lived with afterward. You did it {yrs} years ago. You know the answer to both questions.",
      choices: [
        { t: "Tell {themHim} what your own purse cost",
          r: "You tell {themHim} about the coins you still feel when you lift a weapon. {theyHe} gives the purse back and fights honestly, and loses, and comes to train the next morning anyway.",
          fx: { honor: 3, them: { type: "student", op: 30 } } },
        { t: "Take the purse, and arrange it properly",
          r: "You find the man, double his price and take a fifth. The fall goes off clean; even you cannot see the seam. The man says he has other fighters, and other feast days.",
          fx: { coin: 25, honor: -6, trait: "greedy", flag: "mpf_bout_fixer", them: { type: "acquaint", op: 10 } } },
        { t: "Take the man to the judges", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The judges bar the man from the bouts and fine him. {them} fights clean and wins. Some of the old men ask, quietly, where you learned to smell a purse.",
            fx: { honor: 4, fame: 1, them: { type: "student", op: 25 }, newRel: { type: "enemy", op: -30 } } },
          lose: { r: "The man has paid the judges longer than {them} has been fighting. He names your own slip, years back, and the judges remember it.",
            fx: { honor: -2, fame: -2, them: { op: -10 } } } },
      ],
    },
    {
      id: "mpf_bout_ring",
      title: "A ledger of falls",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_bout_fixer") && A.S.year - p.flags.mpf_bout_fixer >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_bout_fixer"); ctx.pid = mk(p, { occ: "chief judge of the bouts", status: p.status === "peasant" ? "artisan" : undefined }).id; },
      text: "{yrs} years of arranged falls have made you a name among the betting men, and a line in a ledger kept in a back room. The bouts have a new chief judge, {them}, who cannot be bought. {theyHe} has a copy of the ledger. Your name is in it twice: once for the bout you sold, and once for the bouts you arranged.",
      choices: [
        { t: "Steal the judge's copy", check: { s: "stealth", s2: "int", d: 55 },
          win: { r: "The copy is under {them}'s mattress, which is where honest people keep things. It burns in your hearth. The ledger in the back room is still there, and the betting men know what you did.",
            fx: { honor: -4, trait: "paranoid", them: { type: "enemy", op: -20 } } },
          lose: { r: "{them} wakes. You go out of the window with a cut arm and nothing else. By noon the judge has your name, and a reason.",
            fx: { wound: "scar_arm", health: -8, cause: "a window", them: { type: "enemy", op: -40 }, prison: 1, why: "fixing bouts" } } },
        { t: "Turn on the betting men, and keep your neck",
          r: "You give {them} every name in the ledger but yours. Three betting men are barred and one is flogged. They know exactly who talked, and they have long memories and short knives.",
          fx: { honor: -3, them: { type: "acquaint", op: 15 }, newRel: { type: "enemy", op: -50 } } },
        { t: "Confess, and take the judges' sentence",
          r: "A year barred from the bouts, and a fine that takes most of what the falls paid. {them} shakes your hand at the end of it. The betting men do not.",
          fx: { coinPct: -0.5, honor: 6, fame: -3, trait: "honest", unflag: "mpf_bout_fixer", them: { type: "friend", op: 20 } } },
      ],
    },

    // ===================== pf_quiet_school: a season with the night-watchers; the price was "Ears, later. Not throats."
    {
      id: "mpf_quiet_sign",
      title: "Ears, later",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_quiet_school") && A.S.year - p.flags.pf_quiet_school >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_quiet_school");
        const m = linked(p, "pf_quiet_school", ["mentor"]);
        const t = m || mk(p, { occ: "a night-watcher" });
        t.flags.mpf_role = "quiet"; ctx.pid = t.id;
        ctx.who = m ? `${m.given}, who taught you the knife,` : `a stranger who calls ${t.sex === "F" ? "herself" : "himself"} ${t.given}`;
      },
      text: (p, ctx) => `In the crowd at the well, {who} brushes your sleeve and makes a sign with two fingers: listen. You have not seen it since your season of silence with the night-watchers, {yrs} years ago. ${loggedHas(p, "pf_quiet_school", PATH.priceNamed)
        ? "The price was named then. Ears, later. Not throats. Later is now"
        : "No one named a price then. This is the price"}: a month of ears on the house across the lane from yours.`,
      choices: [
        { t: "Answer the sign, and listen for a month", check: { s: "stealth", s2: "ins", d: 48 },
          win: { r: "A month behind a shutter: who comes, who goes, who leaves by the back. {them} takes it all without a word, and pays in clipped silver.",
            fx: { coin: 20, skill: { stealth: 2, intrigue: 1 }, flag: "mpf_quiet_ears", them: { op: 10 } } },
          lose: { r: "The house has a dog, and the dog has a voice. The man of the house sees your face at the shutter. {them} is not pleased, but the work is done.",
            fx: { flag: "mpf_quiet_ears", them: { op: -5 }, newRel: { type: "enemy", op: -30 } } } },
        { t: "Make the sign for no",
          r: "{them} is gone into the crowd. A week later there is a knife-cut on your door frame, at eye height. The night-watchers keep their accounts in their own way.",
          fx: { trait: "paranoid", them: { type: "enemy", op: -30 } } },
        { t: "Pretend you never learned the sign", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "You give {themHim} a fool's blank smile. {them} decides the season was wasted on you, and leaves you be.",
            fx: { skill: { deception: 1 }, them: { op: -15 } } },
          lose: { r: "{them} is not fooled. 'You learned it,' {theyHe} says softly, 'and you will remember it.'",
            fx: { happy: -3, them: { type: "enemy", op: -25 } } } },
      ],
    },
    {
      id: "mpf_quiet_throat",
      title: "Not throats",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_quiet_ears") && A.S.year - p.flags.mpf_quiet_ears >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "mpf_quiet_ears"); cast(p, ctx, "quiet", { occ: "a night-watcher" });
        ctx.told = loggedHas(p, "pf_quiet_school", PATH.priceNamed) ? "You were told ears, not throats," : "We asked you for ears, not throats,";
      },
      text: "{them} does not make a sign this time. The man whose house you watched for a month, {yrs} years ago, has learned who listened, and has started asking questions with his money. The night-watchers want the questions stopped. '{told}' {them} says. 'The rule has changed. You have the knife. We taught you where it goes.'",
      choices: [
        { t: "Do it, the way they taught you", check: { s: "dagger", s2: "stealth", d: 55 },
          win: { r: "It is done between one watch-call and the next. {them} pays nothing. The night-watchers owe you now, and they keep that account as carefully as the other.",
            fx: { honor: -12, trait: "cruel", deed: "Silenced a man for the night-watchers", them: { op: 15 }, owed: 1 } },
          lose: { r: "He keeps a dog, and the dog is awake. You get away with its teeth in your calf and nothing done. The man leaves {home} the next day.",
            fx: { wound: "bite", health: -10, cause: "a watchdog", them: { op: -20 } } } },
        { t: "Warn him, and leave the school for good",
          r: "He is gone by morning with his money and his questions. You are gone from the night-watchers the same night. {them} leaves your door frame uncut, which frightens you more.",
          fx: { honor: 5, trait: "paranoid", unflag: "mpf_quiet_ears", them: { type: "enemy", op: -50 } } },
        { t: "Say no, and say nothing",
          r: "{them} nods as if it is all the same. Three weeks later the man is pulled out of the river. Your hands are clean. You were asked, though, and you said nothing.",
          fx: { happy: -5, wil: 1, them: { op: -20 } } },
      ],
    },

    // ===================== pf_hired_knife: fifteen suns across the table, and you did the job
    {
      id: "mpf_knife_client",
      title: "The man who paid fifteen",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_hired_knife") && A.S.year - p.flags.pf_hired_knife >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_hired_knife"); ctx.pid = mk(p, { sex: "M", occ: "a debtor in the town cells" }).id; },
      text: "{yrs} years ago a man bought you a cup and slid fifteen suns across the table, and you did the job. The man is {them}, and he is in the town cells now over an unpaid bond. A turnkey brings his message. Get him out within the week, or he tells the magistrate where the fifteen suns went.",
      choices: [
        { t: "Pay his bond, and own him after", req: p => p.coin >= 60,
          r: "Sixty suns, and {them} walks out blinking into the daylight. He owes you his neck now, and he knows that you know it.",
          fx: { coin: -60, them: { type: "acquaint", op: 10 }, owed: 2 } },
        { t: "Bring him a loaf, with something baked in", check: { s: "stealth", s2: "intrigue", d: 55 },
          win: { r: "{them} eats the loaf to the crust. By morning the turnkey reports a fever, and by evening a burial. No one asks where the bread came from.",
            fx: (p, ctx) => { kill(ctx, "a fever in the cells"); return apply(p, ctx, { honor: -10, trait: "cruel" }); } },
          lose: { r: "The turnkey breaks the loaf open to look for files, and the dog that eats the crumbs dies. You are taken at the gate.",
            fx: { honor: -10, prison: 2, why: "poisoning a prisoner" } } },
        { t: "Leave {home} before he talks",
          r: "You are gone before the week is out, with what you can carry. In the new town you sleep with a knife under the bolster.",
          fx: (p, ctx) => join(apply(p, ctx, { coinPct: -0.3, trait: "paranoid" }), moveHome(p)) },
      ],
    },
    {
      id: "mpf_knife_son",
      title: "His father's jaw",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_hired_knife") && A.S.year - p.flags.pf_hired_knife >= 10,
      w: 2, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_hired_knife"); ctx.pid = mk(p, { sex: "M", ageAdj: 19 + A.ri(0, 5), occ: "a hired hand" }).id; },
      text: "Fifteen suns, {yrs} years ago, for a man who owed money and would not pay. {them} has come to work beside you this season, a quiet lad with his dead father's jaw. Tonight, by the fire, he says he still means to find the knife who did it. He asks whether you ever heard a name.",
      choices: [
        { t: "Tell him the truth", check: { s: "persuasion", s2: "wil", d: 56 },
          win: { r: "He says nothing until the fire is embers. Then he says his father was a hard man to owe, and goes to his blanket. In the morning he is still there, working.",
            fx: { honor: 6, trait: "honest", them: { type: "friend", op: 15 } } },
          lose: { r: "He comes over the fire at you with a skinning knife. You put him down, but not before he opens your face. He is gone by dawn, and he knows your name.",
            fx: { wound: "scar_face", health: -14, cause: "a son's knife", them: { type: "enemy", op: -80 } } } },
        { t: "Give him a dead man's name",
          r: "You name a knife-man hanged years back. {them} spits in the fire and thanks you, and from then on he treats you like an uncle.",
          fx: { honor: -6, happy: -5, trait: "deceitful", them: { type: "friend", op: 30 } } },
        { t: "Quietly stake him a stall of his own", req: p => p.coin >= 50,
          r: "You pay for a stall in his name and call it a loan you never collect. He thinks you are kind. You let him think it.",
          fx: { coin: -50, honor: 2, them: { type: "friend", op: 25 }, owed: 1 } },
      ],
    },

    // ===================== pf_rim_trick: the point laid inside the rim along the grain, on the forty-first day
    {
      id: "mpf_rim_ashby",
      title: "Inside the rim, again",
      cond: (p, C) => C.adult(p) && !C.old(p) && C.flag(p, "pf_rim_trick") && A.S.year - p.flags.pf_rim_trick >= 2 && C.prof(p, "lance", 50),
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_rim_trick"); ctx.pid = mk(p, { status: "gentry", ageAdj: 19 + A.ri(0, 4), occ: "a young knight of Kingsmere" }).id; },
      text: "Two shields have split in the lists this week, and only you know why: the point laid just inside the rim, along the grain, as on your forty-first day at the quintain. Tomorrow you ride against {them}, a young knight of Kingsmere who carries a linden shield and rides the way Roland Ashby taught. The quintain was only sawdust.",
      choices: [
        { t: "Lay the point inside the rim", check: { s: "lance", s2: "str", d: 58 },
          win: { r: "The shield splits along the grain, and the point goes on into the shoulder behind it. {them} is carried off and will not couch a lance again. The heralds give you a name for it.",
            fx: { fame: 4, honor: -2, epithet: "Rim-Breaker", deed: "Broke a Kingsmere shield at the rim", them: { type: "enemy", op: -50 } } },
          lose: { r: "You lay it a finger too deep. The point skids off the boss, and you go over your horse's tail into the sand.",
            fx: { health: -12, wound: "concussion", fame: -1, cause: "a fall in the lists" } } },
        { t: "Ride a plain course at the boss", check: { s: "lance", s2: "sta", d: 54 },
          win: { r: "Lances break on both shields, cleanly, three courses running. The crowd likes it better than blood. {them} rides over afterward to clasp your arm.",
            fx: { fame: 2, honor: 4, them: { type: "friend", op: 25 } } },
          lose: { r: "{them} unhorses you on the third course, fairly. You are sore for a week.",
            fx: { health: -6, fame: -1, cause: "a fall in the lists", them: { op: 10 } } } },
        { t: "Show {themHim} the trick at dawn",
          r: "At the quintain at first light you show {themHim} the grain and the rim. Then you ride against a knight who knows exactly where to hold {theirHis} shield. You lose, and gain a friend who owes you.",
          fx: { honor: 5, fame: -1, skill: { lance: 1 }, them: { type: "friend", op: 35 }, owed: 1 } },
      ],
    },

    // ===================== pf_backward_shot: the arrow back over the horse's tail
    {
      id: "mpf_shot_road",
      title: "Riders behind you",
      cond: (p, C) => C.adult(p) && !C.old(p) && C.flag(p, "pf_backward_shot") && A.S.year - p.flags.pf_backward_shot >= 2 && C.mounted(p),
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "pf_backward_shot"),
      text: "Three riders come out of the birches on the {home} road and fall in behind you. They do not hurry to pass. Your horse is faster than theirs, but not by much, and the ford is a mile off. {yrs} years ago you learned to turn in the saddle and loose back over the tail. The target was straw.",
      choices: [
        { t: "Turn and shoot the lead horse", check: { s: "bow", s2: "mounted", d: 55 },
          win: { r: "The lead horse goes down, and the other two pull up around it. You ride on to the ford. By market day {home} tells it as three riders, then five.",
            fx: { fame: 2, skill: { bow: 1, mounted: 1 }, deed: "Shot back over the tail and broke a robbers' chase" } },
          lose: { r: "The arrow goes wide, and they take you at the ford: the horse, the purse, and a kick in the ribs for the trouble.",
            fx: { coinPct: -0.4, gear: { mount: null }, health: -8, wound: "broken_ribs", cause: "road robbers" } } },
        { t: "Shoot the lead rider", check: { s: "bow", s2: "mounted", d: 60 },
          win: { r: "He goes over his horse's tail, and the others turn back. He wore a good cloak for a robber. His brother, who has a better one, will want a name.",
            fx: { fame: 2, honor: -2, newRel: { type: "enemy", op: -50 } } },
          lose: { r: "He is quicker. His bolt takes you in the shoulder, and you reach the ford slumped over the mane.",
            fx: { wound: "arrow_wound", health: -14, cause: "a robber's bolt" } } },
        { t: "Trust the horse, and ride for the ford", check: { s: "riding", s2: "sta", d: 50 },
          win: { r: "Belly to the mane, you take the ford at a gallop. They do not follow you into the water.",
            fx: { skill: { riding: 2 } } },
          lose: { r: "Your horse stumbles in the shallows. They take your purse and leave you the horse, out of something like pity.",
            fx: { coinPct: -0.5, happy: -4 } } },
      ],
    },
    {
      id: "mpf_shot_kharsa",
      title: "Kharsa Arrow Field",
      cond: (p, C) => C.adult(p) && !C.old(p) && C.realm(p, "POL-12") && C.flag(p, "pf_backward_shot") && A.S.year - p.flags.pf_backward_shot >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_backward_shot"); ctx.pid = mk(p, { sex: "M", status: "gentry", ageAdj: 20 + A.ri(0, 6), occ: "a khan's son" }).id; },
      text: "At Kharsa Arrow Field the riders shoot Toghan Swift-Arrow's course: twenty-seven targets, nine of them behind you. His count has stood since 431. You have had the backward shot for {yrs} years. {them}, a khan's son, has put a bay mare and a hundred suns on his own rider, and has asked, politely, that you not embarrass him.",
      choices: [
        { t: "Ride the whole course to win", check: { s: "bow", s2: "mounted", d: 64 },
          win: { r: "Twenty-six of twenty-seven, five of them backward. The field roars your name, and {them} leaves before the roaring stops. The old men say Toghan's count is safe, but not by much.",
            fx: { fame: 5, epithet: "Arrow-Back", deed: "Shot twenty-six of twenty-seven at Kharsa Arrow Field", them: { type: "rival", op: -40 } } },
          lose: { r: "You lose a stirrup on the ninth backward shot and come off at a gallop. {them}'s rider wins, and the khan's son sends a doctor, which is a kind of insult.",
            fx: { health: -10, wound: "bad_knee", fame: -1, cause: "a fall at Kharsa Arrow Field", them: { op: 10 } } } },
        { t: "Miss the ninth target by a hand",
          r: "You miss by a hand's breadth, and {them}'s rider wins by one. That night a bay mare is led to your tent with a silver bridle. The khan's son owes you, and knows it.",
          fx: { honor: -2, gear: { mount: "horse" }, them: { type: "friend", op: 30 }, owed: 1 } },
        { t: "Ride for Toghan's count alone, and refuse the wager",
          r: "You tell the judges to strike your name from the wagering and ride for the count. Twenty-two. {them} wins his bet and cannot quite thank you for it.",
          fx: { fame: 2, honor: 3, skill: { bow: 1 }, them: { op: 5 } } },
      ],
    },

    // ===================== pf_smuggler_contact: you tested twenty crates of arsenal crossbows bound for the Reef
    {
      id: "mpf_crates_bolt",
      title: "Arsenal bolts",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_smuggler_contact") && A.S.year - p.flags.pf_smuggler_contact >= 2 && (C.coast(p) || C.town(p)),
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_smuggler_contact"); ctx.pid = mk(p, { sex: "M", occ: "a smuggler", role: "smuggler" }).id; },
      text: "Corsairs burned a fishing village down the coast last month. The bolts they left in the doors are arsenal-yard bolts, the kind you tested in {them}'s warehouse {yrs} years ago: sixteen good bows, four with cracked prods, sold down the river to the Reef. The harbour-master is asking who handled that cargo. {them} is still in {home}.",
      choices: [
        { t: "Name {them} to the harbour-master", check: { s: "intrigue", s2: "wil", d: 48 },
          win: { r: "{them} is taken on the quay with a crate under his arm. The harbour-master pays you fifteen suns and does not ask how you knew the cargo.",
            fx: { coin: 15, honor: 3, them: { type: "enemy", op: -40 } } },
          lose: { r: "The harbour-master asks how you know the cargo so well, and writes your name down first. {them} is gone on the next tide.",
            fx: { honor: -2, fame: -1, coinPct: -0.15, them: { type: "enemy", op: -30 } } } },
        { t: "Warn {them}, and let him owe you",
          r: "{them} is gone on the next tide. A month later a cask of Reef wine arrives with no note. You are in his books now, on the right page.",
          fx: { honor: -3, them: { type: "acquaint", op: 25 }, owed: 1, flag: "mpf_smug_owes" } },
        { t: "Send the village what you were paid", req: p => p.coin >= 10,
          r: "Ten suns, sent with a carter, for the families. It is the price of an afternoon. It does not feel like enough.",
          fx: { coin: -10, honor: 2, piety: 2 } },
      ],
    },
    {
      id: "mpf_smug_cargo",
      title: "A debt with teeth",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_smug_owes") && A.S.year - p.flags.mpf_smug_owes >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_smug_owes"); cast(p, ctx, "smuggler", { sex: "M", occ: "a smuggler" }); },
      text: "{them}, whom you warned off the quay {yrs} years ago before the harbour-master could take him, is back with a sea-chest and a debt to pay. He offers what he has. A crate of your goods down the river, no tolls, no questions. Or the name of the Reef captain who bought the bolts. He cannot give both and stay welcome.",
      choices: [
        { t: "Send a crate of your own downriver", check: { s: "trade", s2: "deception", d: 50 },
          win: { r: "The crate goes down with the bacon and comes back as silver, sixty suns' worth. {them} calls the debt paid, and drinks to it.",
            fx: { coin: 60, honor: -2, them: { type: "friend", op: 15 } } },
          lose: { r: "The toll-men open the crate at the weir. {them} swears he never saw it before. Your name is on the label.",
            fx: { punish: "smuggling", them: { type: "enemy", op: -20 } } } },
        { t: "Take the captain's name to the harbour-master",
          r: "{them} gives it, and then gives you a long sour look. The harbour-master pays twenty suns. {them} will not be coming back to {home}.",
          fx: { coin: 20, honor: 3, favor: 3, them: { type: "enemy", op: -30 } } },
        { t: "Keep the debt owing",
          r: "{them} shrugs and goes back to his boat. In his trade and yours, a debt owed is worth more than a debt paid.",
          fx: { them: { op: 5 }, owed: 1 } },
      ],
    },

    // ===================== pf_hold_steel: ninety suns for a porter's steel crossbow from Emberdeep
    {
      id: "mpf_steel_reckoners",
      title: "The hold wants its steel",
      cond: (p, C) => C.adult(p) && !C.race(p, "dwarf") && C.flag(p, "pf_hold_steel") && A.S.year - p.flags.pf_hold_steel >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_hold_steel"); ctx.pid = mk(p, { race: "dwarf", realm: "POL-29", occ: "a law-carver of Emberdeep" }).id; },
      text: "Two dwarves in grey hoods are waiting at your door. The porter who sold you a steel crossbow from Emberdeep, {yrs} years ago, for ninety suns, has stood before the Law-Carvers and named you. {them} speaks for the hold. The bow comes home, or its weight in silver does. The porter's sentence, {theyHe} adds, depends on your answer.",
      choices: [
        { t: "Give the bow back, and speak for the porter", req: p => !!(p.gear && p.gear.ranged === "xbow"),
          r: "You hand it over, lever and all. {them} hears you out on the porter's behalf, and promises your words will be carved beside his name. From the Law-Carvers, that is a great deal.",
          fx: { gear: { ranged: null }, honor: 4, them: { type: "friend", op: 25 } } },
        { t: "Pay its weight in silver", req: p => p.coin >= 120,
          r: "A hundred and twenty suns go onto the dwarves' scale. You keep the bow. The porter keeps his hand, and sends word that he will not forget it.",
          fx: { coin: -120, deed: "Paid a hold's price in silver for a porter's hand", them: { op: 10 } } },
        { t: "Refuse. You paid for it.", check: { s: "intimidation", s2: "wil", d: 56 },
          win: { r: "They go without a word. Later you hear what the Law-Carvers do to a porter whose buyer keeps the steel. The dwarf traders of {home} stop selling to you.",
            fx: { honor: -4, them: { type: "enemy", op: -40 } } },
          lose: { r: "{them} takes the bow anyway, and two of your fingers with it, very precisely. The porter, they say, gets off lightly.",
            fx: { gear: { ranged: null }, wound: "lost_fingers", health: -10, cause: "a dwarf's axe", them: { type: "enemy", op: -40 } } } },
      ],
    },
    {
      id: "mpf_steel_war",
      title: "Through the shield",
      cond: (p, C) => C.adult(p) && (C.soldier(p) || C.atWar(p)) && C.flag(p, "pf_hold_steel") && A.S.year - p.flags.pf_hold_steel >= 2 && C.gear(p, "ranged", "xbow"),
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_hold_steel"); ctx.pid = mk(p, { status: "gentry", realm: A.enemyRealmOf(p.realm) || p.realm, occ: "a knight of the other side" }).id; },
      text: "The steel crossbow from Emberdeep, spanned with a lever, has been with you {yrs} years. Today it is spanned, and through the smoke a knight in good plate is rallying {theirHis} line behind a shield. Your bolt would go through the shield, the plate and {themHim}. Taken alive, {theyHe} is worth a ransom. Dead, {theyHe} is worth the field.",
      choices: [
        { t: "Shoot through the shield", check: { s: "xbow", s2: "ins", d: 50 },
          win: { r: "The bolt goes through linden, steel and knight. The line behind {themHim} breaks. Your captain asks where you got that bow, and does not ask twice.",
            fx: (p, ctx) => { kill(ctx, "a steel bolt"); return apply(p, ctx, { fame: 3, merit: 30, deed: "Shot a knight through shield and plate with Emberdeep steel" }); } },
          lose: { r: "Your bolt takes the shield and stops in it, quivering. {them} sees exactly where it came from, and comes.",
            fx: { health: -12, wound: "deep_cut", cause: "a knight's sword", them: { type: "enemy", op: -30 } } } },
        { t: "Shoot the horse, and take {themHim} for ransom", check: { s: "xbow", s2: "spd", d: 55 },
          win: { r: "The horse goes down, and {them} with it, pinned. You sit on {theirHis} shield until the fighting moves on. Your share of the ransom is forty suns, and the prisoner is civil.",
            fx: { coin: 40, fame: 1, them: { type: "acquaint", op: 10 }, owed: 1 } },
          lose: { r: "The horse goes down and {them} rolls free, sword up. Your share of the day is a cut, and nothing else.",
            fx: { wound: "scar_arm", health: -8, cause: "a knight's sword" } } },
        { t: "Lower the bow",
          r: "You lower it. {them} rallies the line, and your side pays for it until dusk. Your sergeant saw the bow come down.",
          fx: { merit: -20, honor: 1, happy: -3 } },
      ],
    },

    // ===================== pf_spy_work: a soft voice in good gloves paid forty suns for a copied letter
    {
      id: "mpf_gloves_plant",
      title: "The same good gloves",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_spy_work") && A.S.year - p.flags.pf_spy_work >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_spy_work");
        const n = logged(p, "pf_spy_work", "agent");
        const t = mk(p, { given: n || undefined, sex: n ? sexOfName(p, n) : undefined, occ: "an agent in good gloves", role: "gloves" });
        ctx.pid = t.id; ctx.mark = A.givenName(p.cult, "M"); t.flags.mpf_mark = ctx.mark;
      },
      text: "{yrs} years ago {them}, a soft voice in good gloves, paid you forty suns to copy a letter from a locked chest. The gloves are on the table again. This time {theyHe} wants the job run the other way: a letter goes into a chest, in a hand not its owner's. The owner, a guild-master called {mark}, will hang for what it says. Eighty suns.",
      choices: [
        { t: "Plant the letter", check: { s: "stealth", s2: "deception", d: 52 },
          win: { r: "Shutter, lock, chest, the letter under the guild-master's own linen, and out before the bell. {them} counts eighty suns onto the table and says nothing at all.",
            fx: { coin: 80, honor: -10, skill: { stealth: 2 }, trait: "deceitful", flag: "mpf_gloves_planted", them: { type: "acquaint", op: 15 } } },
          lose: { r: "The lock has been changed. A servant sees your face over a candle, and you leave by the window into a rain-barrel.",
            fx: { health: -6, honor: -4, cause: "a window", them: { op: -10 } } } },
        { t: "Take the letter to {mark} instead",
          r: "{mark} reads it, turns the colour of tallow, and pays you twenty suns. By morning the good gloves know who failed them.",
          fx: { coin: 20, honor: 4, them: { type: "enemy", op: -40 } } },
        { t: "Refuse, and forget the face",
          r: "{them} draws the gloves back across the table. 'Other hands,' {theyHe} says, pleasantly.",
          fx: { honor: 1, them: { op: -5 } } },
      ],
    },
    {
      id: "mpf_gloves_trial",
      title: "The guild-master's trial",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_gloves_planted") && A.S.year - p.flags.mpf_gloves_planted >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "mpf_gloves_planted");
        const t = cast(p, ctx, "gloves", { occ: "an agent in good gloves" });
        ctx.mark = t.flags.mpf_mark || A.givenName(p.cult, "M");
      },
      text: "{mark}, the guild-master whose chest took your letter {yrs} years ago, stands trial for treason, and the letter is the whole case. His daughter has found a clerk who swears the hand is false, and the clerk saw someone at a shutter that night. The magistrate wants witnesses. {them}, in good gloves, wants you out of {home} within the week.",
      choices: [
        { t: "Tell the magistrate everything",
          r: "{mark} walks free. You do not: two years for false letters, and {them} will know the day you come out.",
          fx: { prison: 2, why: "false letters", honor: 10, trait: "honest", them: { type: "enemy", op: -60 } } },
        { t: "Leave {home}, as the gloves suggest",
          r: "You are gone in two days, with thirty suns from {them}. {mark} hangs the week after. You hear it from a carter, two towns away.",
          fx: (p, ctx) => join(apply(p, ctx, { coin: 30, honor: -8, happy: -6, them: { op: 10 } }), moveHome(p)) },
        { t: "Find the clerk before the magistrate does", check: { s: "intrigue", s2: "stealth", d: 55 },
          win: { r: "You find the clerk first, and thirty suns find his memory failing. {mark} hangs. You were never at any shutter.",
            fx: { coin: -30, honor: -12, trait: "cruel", them: { op: 15 } } },
          lose: { r: "The clerk has friends. He points you out on the court steps, and the magistrate has a second treason to hear.",
            fx: { prison: 2, why: "false letters", honor: -6 } } },
      ],
    },

    // ===================== pf_knows_secret: you copied the letter twice, and kept one
    {
      id: "mpf_letter_copy",
      title: "The second copy",
      cond: (p, C) => C.adult(p) && C.literate(p) && C.flag(p, "pf_knows_secret") && A.S.year - p.flags.pf_knows_secret >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_knows_secret"); ctx.agent = logged(p, "pf_knows_secret", "agent") || "a soft voice in good gloves"; ctx.pid = mk(p, { sex: "M", status: "merchant", occ: "a man standing for the guild council" }).id; },
      text: "Under a loose board you still keep the second copy, the one you made for yourself by candlelight {yrs} years ago while the first went to {agent}. The letter's owner is {them}. He has done well since. He stands for the guild council this spring, and last week he turned your neighbour's widow out of her house.",
      choices: [
        { t: "Sell the copy to his rivals", check: { s: "intrigue", s2: "trade", d: 50 },
          win: { r: "His rivals pay a hundred suns and read it aloud in the guildhall. {them} loses the council and most of his friends. He knows whose copy it was.",
            fx: { coin: 100, honor: -3, unflag: "pf_knows_secret", them: { type: "enemy", op: -50 } } },
          lose: { r: "His rivals take the copy and pay you twenty, which is all you can make them pay. Then they sell it back to {them} for more.",
            fx: { coin: 20, unflag: "pf_knows_secret", them: { type: "enemy", op: -40 } } } },
        { t: "Show {themHim}, and ask only for the widow's house",
          r: "{them} reads your copy, folds it, and agrees. The widow has her house back by the week's end. {them} smiles at you in the street now, the way a dog smiles.",
          fx: { honor: 5, happy: 3, them: { type: "enemy", op: -30 } } },
        { t: "Burn it at last",
          r: "The copy goes into the fire, and the board goes back down over nothing. You sleep well. The widow does not.",
          fx: { wil: 1, honor: 1, unflag: "pf_knows_secret" } },
      ],
    },

    // ===================== pf_crew: a fifth of the money-changer's strongroom, through the roof
    {
      id: "mpf_crew_gallows",
      title: "Offer withdrawn",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_crew") && A.S.year - p.flags.pf_crew >= 2 && (C.town(p) || C.coast(p)),
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_crew"); ctx.crew = crewName(p);
        ctx.pid = (linked(p, "pf_crew", ["friend", "bestfriend"]) || mk(p, { occ: "a roof-thief" })).id;
      },
      text: "{them}, who was on the money-changer's roof with you {yrs} years ago, has been taken on another job. {crew} sends word: {theyHe} has not talked yet. A fifth of a strongroom bought a great deal, but it does not buy silence in the cells. The hanging is set for market day.",
      choices: [
        { t: "Go over the roofs and get {themHim} out", check: { s: "stealth", s2: "athletics", d: 58 },
          win: { r: "Tiles, a file, a rope you knotted yourself. {them} is out of the cell window and over the river before the bell, and swears on {theirHis} mother's bones to repay it.",
            fx: { fame: 1, them: { type: "bestfriend", op: 40 }, sworn: true, owed: 2 } },
          lose: { r: "The turnkey keeps a dog and a bell. You get away with the dog's teeth in your leg. {them} hangs on market day, still silent.",
            fx: (p, ctx) => { kill(ctx, "the rope"); return apply(p, ctx, { wound: "bite", health: -10, happy: -6, cause: "a turnkey's dog" }); } } },
        { t: "Pay the hangman for a quick drop", req: p => p.coin >= 20,
          r: "{them} hangs on market day and dies quickly, which is the most twenty suns can buy. {theyHe} names no one. You stand at the back of the crowd.",
          fx: (p, ctx) => { kill(ctx, "the rope"); return apply(p, ctx, { coin: -20, honor: 1, happy: -4 }); } },
        { t: "Stay away",
          r: "On market day {them} goes off the ladder, still silent. {crew} hears that you did nothing. The offer, it seems, no longer stands.",
          fx: (p, ctx) => { kill(ctx, "the rope"); return apply(p, ctx, { happy: -6, newRel: { type: "enemy", op: -40 } }); } },
      ],
    },

    // ===================== pf_pilot: you brought a fat cog over the moving bars by lead line and the colour of the water
    {
      id: "mpf_pilot_storm",
      title: "The bar has moved",
      cond: (p, C) => C.adult(p) && C.coast(p) && C.flag(p, "pf_pilot") && A.S.year - p.flags.pf_pilot >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_pilot"); const m = logged(p, "pf_pilot", "mst"); ctx.cog = m ? `${m}'s fat cog` : "a fat cog"; },
      text: "A winter gale has shifted the bars at the river mouth, where {yrs} years ago you brought {cog} in by lead line and the colour of the water. Tonight a grain ship stands off in the dark, burning a light for a pilot. {home} is short of bread. The other pilots are in their beds, and they say the channel is gone.",
      choices: [
        { t: "Take her in tonight", check: { s: "sea", s2: "ins", d: 62 },
          win: { r: "By the sound of the surf and the feel of the lead you find a channel no one has charted. She touches once, softly, and floats on the flood. The bread is ashore by morning.",
            fx: { fame: 4, coin: 60, epithet: "Shoal-Reader", deed: "Brought a grain ship over the moving bar by night" } },
          lose: { r: "She strikes on the new bar and heels over. You get the crew into the boat, all but two. The grain is lost, and the story follows you.",
            fx: { fame: -4, happy: -10, health: -10, wound: "frostbite", cause: "a winter wreck" } } },
        { t: "Sound the new bars at daylight, and chart them",
          r: "She rides out the night at anchor. At dawn you sound the mouth from a rowing boat and draw what you find. She comes in at noon, and your chart is the only one there is.",
          fx: { coin: 30, skill: { sea: 2, learning: 1 }, flag: "mpf_pilot_chart" } },
        { t: "Let the other pilots be right",
          r: "She drags her anchors before dawn and goes up on the beach. The crew walks ashore. The grain does not.",
          fx: { happy: -4, fame: -1 } },
      ],
    },
    {
      id: "mpf_pilot_chart_buyer",
      title: "Two offers for a chart",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_pilot_chart") && A.S.year - p.flags.mpf_pilot_chart >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_pilot_chart"); ctx.pid = mk(p, { occ: "master of the pilots' guild" }).id; },
      text: "The chart you drew of the moving bars {yrs} years ago has made you the one pilot in {home} who never touches sand. Two people want it now. The harbour council would nail a copy up on the quay, free to every master, and {them}, master of the pilots' guild, would never forgive you. A quiet foreigner offers three hundred suns, and asks nothing about guilds.",
      choices: [
        { t: "Nail it up on the quay",
          r: "The council nails it up, and the next winter no ship is lost at the mouth. The guild meets without you, and {them} crosses the quay rather than pass you.",
          fx: { honor: 6, fame: 3, deed: "Gave the harbour the first true chart of the river mouth", them: { type: "enemy", op: -40 } } },
        { t: "Sell it to the quiet foreigner",
          r: "Three hundred suns, in a purse heavier than it looks. The foreigner sails on the morning tide. After that you find yourself watching the sea for strange sails.",
          fx: { coin: 300, honor: -8, trait: "greedy" } },
        { t: "Burn it, and keep the channel in your head",
          r: "You burn the chart. Every master who wants to come in safely comes to you now, and pays. {them} buys you a cup at the guild feast.",
          fx: { coin: 40, skill: { sea: 1 }, them: { type: "friend", op: 20 } } },
      ],
    },
    {
      id: "mpf_pilot_cog",
      title: "The north channel",
      cond: (p, C) => C.adult(p) && C.coast(p) && C.flag(p, "pf_pilot") && A.S.year - p.flags.pf_pilot >= 4,
      w: 2, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_pilot"); const m = logged(p, "pf_pilot", "mst"); ctx.cog = m ? `${m}'s fat cog` : "the fat cog";
        ctx.pid = (linked(p, "pf_pilot", ["friend", "bestfriend"]) || mk(p, { occ: "a ship's master" })).id;
      },
      text: "{them} crewed {cog} the season you first brought her through the shoals, {yrs} years ago. Now {theyHe} is master of {theirHis} own ship, deep-laden, and wants to come in at night by the old north channel. The customs boat lies at the main one. {theyHe} will not say what is in the hold. {theyHe} offers you a tenth of it.",
      choices: [
        { t: "Bring {themHim} in by the north channel", check: { s: "sea", s2: "logistics", d: 55 },
          win: { r: "You bring her in dark, without a light, and she is unloaded by dawn. Your tenth is wine, Reef silver and a crate you do not open: sixty suns' worth.",
            fx: { coin: 60, honor: -3, them: { type: "bestfriend", op: 25 } } },
          lose: { r: "The customs boat is lying at the north channel too. {them} loses the cargo, and you lose more than a pilot's fee.",
            fx: { punish: "smuggling", them: { op: -15 } } } },
        { t: "Bring {themHim} in by the main channel",
          r: "You take her in past the customs boat in daylight. The hold is wine and Reef silver, and the tax takes a third. {them} pays you a pilot's fee and nothing more.",
          fx: { coin: 20, honor: 2, them: { type: "acquaint", op: -20 } } },
        { t: "Tell the customs-master which channel",
          r: "The customs boat is waiting at the north channel. You are paid a fifth of the seizure. {them} goes to the cells, and knows who sent the boat.",
          fx: { coin: 40, honor: -4, favor: 2, them: { type: "enemy", op: -60 } } },
      ],
    },

    // ===================== pf_court_door: you taught a wool merchant's daughter manners, and walked into court behind her
    {
      id: "mpf_court_goose",
      title: "The goose story",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_court_door") && A.S.year - p.flags.pf_court_door >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_court_door"); ctx.pid = mk(p, { sex: "F", status: "gentry", occ: "a knight's wife, born to wool" }).id; },
      text: "{yrs} years ago you taught {them}, a wool merchant's daughter, to stop eating with her knife, and walked into court behind her. She is a knight's wife now, and you are known in rooms you could never have entered alone. A countess has offered you a place in her household. The price is a story: the one about the goose-laugh, told at supper.",
      choices: [
        { t: "Tell the story, and take the place",
          r: "The countess laughs until she weeps, and repeats it to the whole court. {them} hears it within the week. You have a room in a great house now, and one fewer friend at court.",
          fx: { fame: 2, trait: "ambitious", deed: "Took a place in a countess's household", them: { type: "enemy", op: -45 } } },
        { t: "Refuse, and warn {them}",
          r: "{them} goes white, then thanks you. The countess finds another teller, and does not ask you to supper again. {them} owes you, and she pays her debts.",
          fx: { honor: 4, them: { type: "friend", op: 35 }, owed: 1 } },
        { t: "Tell it, but make yourself the goose", check: { s: "etiquette", s2: "persuasion", d: 55 },
          win: { r: "You tell it about yourself: a country nobody at a duke's table, chewing with your mouth open. The countess laughs anyway, and gives you the place.",
            fx: { fame: 2, honor: 2, deed: "Took a place in a countess's household", them: { type: "friend", op: 15 } } },
          lose: { r: "The countess wanted blood, not modesty. She smiles thinly and changes the subject for good.",
            fx: { happy: -4, them: { op: 5 } } } },
      ],
    },

    // ===================== pf_blackmailer: the steward pays a purse every quarter day
    {
      id: "mpf_purse_quarter",
      title: "A light purse",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_blackmailer") && A.S.year - p.flags.pf_blackmailer >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_blackmailer"); ctx.pid = mk(p, { given: logged(p, "pf_blackmailer", "stew") || undefined, sex: "M", occ: "steward of the manor", role: "stew" }).id; },
      text: "Every quarter day for {yrs} years, {them}, steward of the manor, has brought you a purse and a smile, and kept the second set of books. This quarter the purse is light. The harvest failed, {theyHe} says, and the second book will not stretch. {theyHe} asks for a year's grace. {theirHis} hands are steady. {theirHis} eyes go twice to the door.",
      choices: [
        { t: "Give {themHim} the year's grace",
          r: "{them} bows and goes. The next quarter day the purse is full again, and nothing is said. {theyHe} has had a year to think, and so have you.",
          fx: { them: { op: 10 }, owed: 1 } },
        { t: "Double the price", check: { s: "intimidation", s2: "intrigue", d: 50 },
          win: { r: "{them} hears you out, goes grey, and pays. Twice the purse, every quarter day. {theyHe} no longer smiles at you in public.",
            fx: { coin: 40, honor: -5, trait: "greedy", flag: "mpf_purse_doubled", them: { type: "enemy", op: -40 } } },
          lose: { r: "{them} lays the light purse on the table and walks out. The next quarter day there is no purse at all, and the bailiff nods to you oddly.",
            fx: { coin: 10, unflag: "pf_blackmailer", them: { type: "enemy", op: -40 } } } },
        { t: "Burn your notes in front of {themHim}",
          r: "{them} watches the notes curl, and weeps, which you did not expect. Thirty suns a quarter go up the chimney with them.",
          fx: { honor: 5, unflag: "pf_blackmailer", them: { type: "friend", op: 30 } } },
      ],
    },
    {
      id: "mpf_purse_last",
      title: "The last purse",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_purse_doubled") && A.S.year - p.flags.mpf_purse_doubled >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_purse_doubled"); cast(p, ctx, "stew", { sex: "M", occ: "steward of the manor" }); },
      text: "The purse comes on quarter day as always, heavy since you doubled it {yrs} years ago. Under the coin is a folded page in the lord's own hand: a summons. {them} has confessed the second book to the lord, all of it, and named you as the one paid to keep it quiet. The lord wants to know why you never told him.",
      choices: [
        { t: "Tell the lord you were gathering proof", check: { s: "persuasion", s2: "intrigue", d: 58 },
          win: { r: "The lord half believes you, which is enough. {them} is turned out with nothing. You keep your neck, and pay back half of what the purses held.",
            fx: { coinPct: -0.25, favor: 2, honor: -2, them: { type: "enemy", op: -60 } } },
          lose: { r: "The lord believes {them}, who has at least confessed. A year in the manor's cellar, for extortion.",
            fx: { prison: 1, why: "extortion", favor: -6, honor: -5 } } },
        { t: "Pay back every purse",
          r: "It takes most of what you have. The lord takes it, says nothing, and has you watched. {them}, to your surprise, keeps the stewardship.",
          fx: { coinPct: -0.6, honor: 3, untrait: "greedy", unflag: "mpf_purse_doubled", them: { op: 10 } } },
        { t: "Run before the summons is read",
          r: "You go by the back lane with this quarter's purse. At the manor court your name is read out three times, then written in the book of those who did not come.",
          fx: (p, ctx) => join(apply(p, ctx, { coin: 30, honor: -6, flag: "outlaw" }), moveHome(p)) },
      ],
    },

    // ===================== pf_steward_secret: the steward's two sets of books, kept in your pocket for later
    {
      id: "mpf_secret_later",
      title: "Later",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_steward_secret") && A.S.year - p.flags.pf_steward_secret >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_steward_secret"); ctx.pid = mk(p, { ageAdj: 18 + A.ri(1, 4), occ: "a manor clerk" }).id; },
      text: "{yrs} years ago you learned that the steward of the manor kept two sets of books, and you kept that in your pocket for later. Later has come. A young clerk, {them}, has been charged with the steward's thefts, and hangs at the quarter sessions unless someone speaks. The true book is still in its box under the steward's bed.",
      choices: [
        { t: "Fetch the box from under the bed", check: { s: "stealth", s2: "intrigue", d: 52 },
          win: { r: "You lay the second book on the lord's table. The steward goes to the rope that was meant for {them}. The lord remembers who was useful.",
            fx: { favor: 6, honor: 5, fame: 1, them: { type: "friend", op: 40 }, owed: 1 } },
          lose: { r: "The box is gone, and the steward is waiting in the dark. You leave with a broken nose, and he knows your name.",
            fx: { wound: "broken_nose", health: -8, cause: "a steward's cudgel", newRel: { type: "enemy", op: -40 } } } },
        { t: "Sell your silence to the steward",
          r: "The steward pays fifty suns without haggling. {them} hangs at the sessions, protesting to the end. You do not go to watch.",
          fx: (p, ctx) => { kill(ctx, "the rope"); return apply(p, ctx, { coin: 50, honor: -8, trait: "deceitful", unflag: "pf_steward_secret" }); } },
        { t: "Keep it in your pocket a while longer",
          r: "{them} hangs at the sessions. You still have your secret, and it weighs more than it did.",
          fx: (p, ctx) => { kill(ctx, "the rope"); return apply(p, ctx, { happy: -6, wil: 1 }); } },
      ],
    },

    // ===================== pf_knows_poisoner: the cook and the hooded man behind the stables
    {
      id: "mpf_poisoner_face",
      title: "The face behind the stables",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_knows_poisoner") && A.S.year - p.flags.pf_knows_poisoner >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_knows_poisoner"); const h = logged(p, "pf_knows_poisoner", "host"); ctx.feast = h ? `${h}'s feast` : "a feast"; ctx.pid = mk(p, { sex: "M", status: "gentry", occ: "a magistrate", role: "poisoner" }).id; },
      text: "{yrs} years ago, behind the stables after {feast}, you watched a cook with shaking hands meet a man in a hooded cloak, and you saw his face. The face has a name now, {them}, and a chain of office. He sits as magistrate in {home}. Tomorrow he tries a kitchen girl of sixteen for poisoning a merchant. She will hang.",
      choices: [
        { t: "Speak at the hearing", check: { s: "persuasion", s2: "wil", d: 58 },
          win: { r: "You describe a stable yard and a hooded cloak, to the day. The court goes quiet. {them} adjourns, the girl walks, and within a month the magistrate retires for his health.",
            fx: { honor: 6, fame: 3, deed: "Named a poisoner in open court", them: { type: "enemy", op: -60 } } },
          lose: { r: "It is your word against the magistrate's, in his own court. The girl hangs. {them} learns your name, and your door.",
            fx: { honor: 2, happy: -6, them: { type: "enemy", op: -60 } } } },
        { t: "Let him know, privately, that you know",
          r: "A note, unsigned, one line about a stable yard. The next day a purse arrives, and the girl's sentence becomes a whipping. You are paid, and you are on his list.",
          fx: { coin: 40, honor: -3, flag: "mpf_poisoner_paid", them: { type: "enemy", op: -30 } } },
        { t: "Keep your head down",
          r: "The girl hangs at the week's end. {them} dines out on the case all winter.",
          fx: { happy: -5 } },
      ],
    },
    {
      id: "mpf_poisoner_cup",
      title: "Steady hands",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_poisoner_paid") && A.S.year - p.flags.mpf_poisoner_paid >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_poisoner_paid"); cast(p, ctx, "poisoner", { sex: "M", status: "gentry", occ: "a magistrate" }); },
      text: "{them} has asked you to a feast and seated you near the top of the table, an honour you did not ask for. You watch the taster, as you once watched another taster pause over another cup. This one does not pause. The boy who fills your cup has steady hands, which is worse. {them} raises {theirHis} cup to your health.",
      choices: [
        { t: "Knock your own cup over, clumsily", check: { s: "intrigue", s2: "spd", d: 50 },
          win: { r: "Wine across the cloth, apologies all round. Later a hound laps at the stain under the table and is dead by midnight. You leave before the sweet course.",
            fx: { trait: "paranoid", them: { type: "enemy", op: -80 } } },
          lose: { r: "You knock over your neighbour's cup instead, and drink from your own to cover it. A month of fever, and a cough that does not leave.",
            fx: { health: -30, wound: "lungs", cause: "poisoned wine", them: { op: -10 } } } },
        { t: "Drink, and trust the purse you took", check: { s: "sta", s2: "wil", d: 55 },
          win: { r: "It is only wine. {them} wanted to watch you wonder whether it was, and you did, all the way down.",
            fx: { trait: "paranoid", happy: -3 } },
          lose: { r: "It is not only wine. You are carried home before the sweet course and do not leave your bed for a month.",
            fx: { health: -35, wound: "lungs", cause: "poisoned wine" } } },
        { t: "Raise your cup and name the stable yard", check: { s: "persuasion", s2: "wil", d: 60 },
          win: { r: "The table goes silent. {them} laughs, too late. Thirty guests heard a stable yard and a hooded cloak, and by spring {theyHe} is a former magistrate.",
            fx: { honor: 6, fame: 4, deed: "Named a poisoner at his own table", them: { type: "enemy", op: -80 } } },
          lose: { r: "No one hears it as you meant it. {them}'s men walk you out to the yard and explain it to you there.",
            fx: { health: -18, wound: "scar_face", cause: "a magistrate's men", them: { type: "enemy", op: -60 } } } },
      ],
    },

    // ===================== pf_informer: a sun a month for ears in your town
    {
      id: "mpf_listener_name",
      title: "One name",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_informer") && A.S.year - p.flags.pf_informer >= 2 && C.hasRel(p, "friend", "bestfriend"),
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_informer"); ctx.whose = listeners(p);
        const f = live(p, ["friend", "bestfriend"]).filter(x => A.isAdult(x.p));
        if (!f.length) { ctx.skip = true; return; }
        ctx.pid = f[0].p.id;
      },
      text: "For {yrs} years you have taken a sun a month from {whose} to tell them who meets whom in {home}. Tonight the agent wants one name only: {them}. Who {theyHe} drinks with. What {theyHe} says about the crown after the third cup. The agent has most of it already. What the agent wants from you is a witness.",
      choices: [
        { t: "Be the witness",
          r: "{them} is taken at dawn and spends a year in the crown's cells. You are paid ten suns, the price of a good witness. {them} never learns who it was.",
          fx: { coin: 10, favor: 4, honor: -10, trait: "deceitful", them: { op: -15 } } },
        { t: "Swear {theyHe} is harmless", check: { s: "deception", s2: "intrigue", d: 55 },
          win: { r: "The agent writes 'harmless', then crosses it out and writes 'watched'. {them} keeps {theirHis} freedom. So, for now, do you.",
            fx: { flag: "pf_watched", them: { op: 5 } } },
          lose: { r: "The agent smiles. Your pay stops at the end of the month, and now the listeners watch two names in {home}.",
            fx: { favor: -4, flag: "pf_watched", unflag: "pf_informer" } } },
        { t: "Warn {them} to leave {home}",
          r: "{them} is gone by morning, with a bundle and your purse. The listeners stop paying you, and pay someone else in {home} to watch you.",
          fx: { honor: 5, coin: -10, flag: "pf_watched", unflag: "pf_informer", them: { op: 25 }, owed: 1 } },
      ],
    },
    {
      id: "mpf_listener_ledger",
      title: "Page forty",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_informer") && A.S.year - p.flags.pf_informer >= 8,
      w: 2, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_informer"); ctx.pid = mk(p, { occ: "a neighbour two doors down" }).id; },
      text: "The listeners have had a bad year: a new master, a purge, and their old ledgers sold by the bale to a scrivener who copies pages for anyone who pays. Your name is on page forty: a sun a month, {yrs} years, and every name you gave. {them}, who lives two doors down, has bought a copy. {theyHe} cannot read, but {theirHis} son can.",
      choices: [
        { t: "Buy up every copy of page forty", req: p => p.coin >= 40,
          r: "Forty suns, and the scrivener swears there are no more copies. {them}'s son has read his already. {them} still nods to you, but never comes inside.",
          fx: { coin: -40, happy: -3, them: { type: "acquaint", op: -20 } } },
        { t: "Stand up at the temple and own it", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "You stand up after the reading and say it plainly: the sun a month, the names, the reasons. Some leave. Most stay. {them} shakes your hand at the door.",
            fx: { honor: 6, fame: 2, trait: "honest", unflag: "pf_informer", them: { type: "friend", op: 20 } } },
          lose: { r: "You stand up, and your voice fails halfway through the names. By evening someone has painted an ear on your door.",
            fx: { honor: 2, fame: -3, happy: -8, unflag: "pf_informer", them: { type: "enemy", op: -30 } } } },
        { t: "Leave {home} before the copies spread",
          r: "You sell the house to the first offer and go. In the new town your name is on no page, for now.",
          fx: (p, ctx) => join(apply(p, ctx, { coinPct: -0.2, happy: -4, unflag: "pf_informer" }), moveHome(p)) },
      ],
    },

    // ===================== pf_watched: the listeners caught you shading, and watch you closely since
    {
      id: "mpf_watched_shadow",
      title: "The net-mender",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_watched") && A.S.year - p.flags.pf_watched >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_watched");
        const ev = p.flags.ev || {};
        ctx.why = ev.mpf_listener_name === p.flags.pf_watched && ev.pf_intr_listener !== p.flags.pf_watched
          ? "Since you lied to the listeners for a friend" : "Since the listeners caught you shading your reports";
        ctx.pid = mk(p, { occ: "a net-mender who never finishes a net" }).id;
      },
      text: "{why}, {yrs} years ago, there has always been someone near your door. This year it is {them}, who mends nets by the well and never finishes one. Your letters arrive opened and badly resealed. Tonight it is raining, {them} is soaked through, and {theyHe} looks as tired of this as you are.",
      choices: [
        { t: "Buy {themHim} a hot meal, and an arrangement", check: { s: "persuasion", s2: "deception", d: 50 },
          win: { r: "Over the stew {them} agrees to write that you are dull. It costs a sun a month, the same sun the listeners once paid you. {theyHe} even finishes a net.",
            fx: { coin: -12, unflag: "pf_watched", them: { type: "friend", op: 30 } } },
          lose: { r: "{them} eats the stew, thanks you, and reports the offer word for word. Your letters stop arriving at all.",
            fx: { favor: -4, trait: "paranoid", them: { type: "enemy", op: -20 } } } },
        { t: "Let {themHim} overhear what you want overheard", check: { s: "deception", s2: "intrigue", d: 55 },
          win: { r: "You let slip, loudly, a few true things about a corn-factor who once cheated you. A month later the corn-factor is answering questions in {capital}.",
            fx: { honor: -5, trait: "deceitful", newRel: { type: "enemy", op: -30 } } },
          lose: { r: "{them} reports it as a clumsy attempt to use the crown's ears. The crown's ears do not like being used.",
            fx: { favor: -6, them: { type: "enemy", op: -20 } } } },
        { t: "Move somewhere quieter",
          r: "You sell what will not travel and go. In the new place a woman mends nets by the well. She is probably only mending nets.",
          fx: (p, ctx) => join(apply(p, ctx, { happy: -3, coinPct: -0.1, trait: "paranoid" }), moveHome(p)) },
      ],
    },

    // ===================== pf_sold_secret: the dying clerk's letters, sold for three hundred suns and burned in front of you
    {
      id: "mpf_sold_scholar",
      title: "The clerk's inventory",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_sold_secret") && A.S.year - p.flags.pf_sold_secret >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_sold_secret");
        const h = linked(p, "pf_sold_secret", ["enemy", "rival"]);
        ctx.hm = h ? h.given : "the house's man"; ctx.hid = h ? h.id : "";
        ctx.pid = mk(p, { occ: "a scholar of old letters" }).id;
      },
      text: "{them}, a scholar, has come a long way to ask about a dying clerk and a box of old letters. {theyHe} has the clerk's inventory: one bundle, sold, buyer unknown. You sold it {yrs} years ago for three hundred suns, and watched {hm} burn every page. Without you the scholar can prove nothing. The house cannot afford to let {themHim} try.",
      choices: [
        { t: "Tell {themHim} what the letters said",
          r: "You give {themHim} every line you remember, and {theyHe} writes it all down. The history will carry your name beside the truth. So will the house's book of debts.",
          fx: (p, ctx) => {
            const h = ctx.hid ? A.P(ctx.hid) : null;
            if (h && h.alive && p.rel[h.id]) { A.addOp(p, h, -40); p.rel[h.id].type = "enemy"; }
            return apply(p, ctx, Object.assign({ honor: 5, fame: 3, deed: "Gave the scholars the truth about a great house's letters", them: { type: "friend", op: 30 } },
              h && h.alive ? {} : { newRel: { type: "enemy", op: -40 } }));
          } },
        { t: "Sell {themHim} to the house",
          r: "The house pays twenty suns for the scholar's road and lodging. You do not ask what happens on the road. {them} does not reach the next town.",
          fx: (p, ctx) => { kill(ctx, "an accident on the road"); return apply(p, ctx, { coin: 20, honor: -12, trait: "cruel" }); } },
        { t: "Say you never heard of the clerk",
          r: "{them} thanks you and goes on asking elsewhere. A month later {theyHe} gives up and goes home. The house sends you a cask of wine, unasked.",
          fx: { honor: -2, them: { op: -5 } } },
      ],
    },

    // ===================== pf_holds_secret: the letters sewn into the lining of an old chest, a weapon for a bad day
    {
      id: "mpf_chest_damp",
      title: "The lining of the chest",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_holds_secret") && A.S.year - p.flags.pf_holds_secret >= 3,
      w: 3, once: true,
      setup: (p, ctx) => yrs(p, ctx, "pf_holds_secret"),
      text: "The roof leaked all winter onto the old chest where, {yrs} years ago, you sewed a dying clerk's letters into the lining. You unpick the seam with cold fingers. The ink has run at the edges. The names have not. A weapon for a bad day, you told yourself, and there have been bad days since. You never drew it.",
      choices: [
        { t: "Dry them, and sew them in again",
          r: "You dry the letters by the fire one at a time, and sew them into a dry chest in a dry loft. They are safe for another winter, and so is the house that fears them.",
          fx: { skill: { intrigue: 1 }, flag: "mpf_chest_kept" } },
        { t: "Take them to the scholars in {capital}",
          r: "The scholars read the letters aloud to each other, then copy them. The truth is out by midsummer, and so is your name. The house that paid to bury it forgives neither.",
          fx: { fame: 4, honor: 4, deed: "Brought a great house's buried letters to the scholars", unflag: "pf_holds_secret", newRel: { type: "enemy", op: -40 } } },
        { t: "Sell them back to the house", check: { s: "intrigue", s2: "trade", d: 52 },
          win: { r: "The house pays two hundred suns and burns the letters in front of you, as you knew it would. You are a little richer, and a great deal safer.",
            fx: { coin: 200, honor: -3, unflag: "pf_holds_secret" } },
          lose: { r: "They agree to meet in a warehouse. They bring a cudgel instead of a purse, and leave with the letters.",
            fx: { health: -15, wound: "concussion", cause: "a great house's cudgel", unflag: "pf_holds_secret" } } },
      ],
    },
    {
      id: "mpf_chest_will",
      title: "Who gets the chest",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_chest_kept") && A.S.year - p.flags.mpf_chest_kept >= 5 && (C.old(p) || C.ageAdj(p) >= 45),
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_chest_kept"); ctx.pid = (heirOf(p) || mk(p, { ageAdj: 22, occ: "a young neighbour" })).id; },
      text: "Your knees complain on the loft stair. The old chest is still there, the dying clerk's letters in its lining, dry these {yrs} years. You will not carry them much longer. Whoever gets the chest gets the letters, and the danger, and the choice. {them} would open it within a week. A priest would burn it unread.",
      choices: [
        { t: "Leave it to {them}, with a letter of warning",
          r: "You write it plainly: what the letters prove, who paid to bury them, and what that house does to people who keep them. {them} reads the warning twice, and puts the chest under {theirHis} bed.",
          fx: { deed: "Left a great house's secret to an heir", them: { op: 15 } } },
        { t: "Burn it yourself, tonight",
          r: "The lining catches slowly and then all at once. You sit up with the ashes until they are cold. In the morning the loft is only a loft.",
          fx: { wil: 1, honor: 2, happy: 3, unflag: "mpf_chest_kept" } },
        { t: "Will it to the scholars after your death", req: p => p.coin >= 10,
          r: "A notary takes ten suns and your sealed instructions. When you are gone the chest goes to the scholars in {capital}, and the house can do nothing to you then.",
          fx: { coin: -10, fame: 2, deed: "Willed a great house's letters to the scholars" } },
      ],
    },

    // ===================== pf_song_keeper: a winter of evenings at a dying keeper's bed
    {
      id: "mpf_song_lineage",
      title: "The verse that goes missing",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_song_keeper") && A.S.year - p.flags.pf_song_keeper >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_song_keeper"); ctx.lore = songLore(p); const k = logged(p, "pf_song_keeper", "keeper"); ctx.bed = k ? `${k}'s deathbed` : "a dying keeper's bed"; ctx.pid = mk(p, { status: "gentry", occ: "a new landholder", role: "patron" }).id; },
      text: "You sat a winter of evenings at {bed}, and you carry {lore} now. {them}, who has bought a great deal of land lately, wants {theirHis} line sung at a feast. The line is in the old songs, as it happens. It ends with a grandfather hanged for horse-theft. {them} would like that verse to go missing. Forty suns.",
      choices: [
        { t: "Sing it whole, gallows and all",
          r: "The hall goes quiet at the last verse, then roars. {them} pays nothing and forgets nothing. The old singers hear of it, and send you their students.",
          fx: { fame: 3, honor: 4, skill: { music: 1 }, them: { type: "enemy", op: -40 } } },
        { t: "Drop the verse, and take the forty",
          r: "You sing it without the gallows. It sounds better that way, which is the trouble with it. Within a year other singers have it from you that way.",
          fx: { coin: 40, honor: -5, flag: "mpf_song_lie", them: { type: "friend", op: 20 } } },
        { t: "Make the grandfather a horse-trader", check: { s: "music", s2: "deception", d: 55 },
          win: { r: "You sing him as a horse-trader who never lost a horse. The old ones in the hall catch it and grin into their cups. {them} pays twenty, pleased, and misses the joke.",
            fx: { coin: 20, fame: 1, skill: { music: 2 }, them: { op: 15 } } },
          lose: { r: "The new verse limps, and the hall hears it limp. {them} is shamed, and the old ones are offended, which takes some doing.",
            fx: { fame: -1, them: { type: "rival", op: -20 } } } },
      ],
    },
    {
      id: "mpf_song_lie_grown",
      title: "History, now",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_song_lie") && A.S.year - p.flags.mpf_song_lie >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_song_lie"); cast(p, ctx, "patron", { status: "gentry", occ: "a new landholder" }); },
      text: "At a wedding a child sings {them}'s line the way you sang it {yrs} years ago, without the hanged grandfather. The child sings it well. The child's teacher had it from someone who had it from you, and now it is history. The dying keeper told you songs are history. {them} sits in the front row, mouthing the words.",
      choices: [
        { t: "Sing the missing verse, there and then",
          r: "The wedding goes still, and {them} goes white. The verse is back in the world, and so is the story of why it left. Half the hall thinks less of {them}, and half of you.",
          fx: { honor: 4, fame: 1, trait: "honest", them: { type: "enemy", op: -50 } } },
        { t: "Teach the child the missing verse, quietly",
          r: "After the feast you take the child aside and sing the verse twice. The child will carry both versions now, and choose.",
          fx: { honor: 2, skill: { music: 1 }, newRel: { type: "student", op: 25 } } },
        { t: "Let it stand. It is a better song now.",
          r: "You clap with the others. The grandfather stays unhanged, and the song goes on without him into the next generation.",
          fx: { happy: -3, honor: -2, them: { op: 10 } } },
      ],
    },
    {
      id: "mpf_song_last",
      title: "The last who knows it",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_song_keeper") && A.S.year - p.flags.pf_song_keeper >= 10 && (C.old(p) || C.ageAdj(p) >= 45),
      w: 2, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_song_keeper"); ctx.lore = songLore(p); ctx.keeper = logged(p, "pf_song_keeper", "keeper") || "the dying keeper"; ctx.pid = mk(p, { ageAdj: 18 + A.ri(0, 3), occ: "a young singer" }).id; },
      text: "{keeper} sent for you because there was no one else to teach. It has been {yrs} years. Now you are the one who carries {lore}, and there is still no one else. {them}, a young singer with a good ear and no patience, wants to learn. A winter of evenings would do it. {theyHe} would rather take a month.",
      choices: [
        { t: "Teach {themHim} the slow way, all winter",
          r: "A winter of evenings, the way you learned it. {them} complains for a month and then stops complaining. By spring {theyHe} has it whole, and sings it back to you wrong only once.",
          fx: { skill: { music: 1 }, deed: "Passed the old songs on whole", them: { type: "student", op: 40 } } },
        { t: "Write it all down instead", req: p => p.literate,
          r: "You write until your fingers ache. The songs are safe on paper now, though {keeper} called a song on paper a bird in a box. {them} learns from the book, badly.",
          fx: { skill: { learning: 2 }, deed: "Wrote down the old songs", them: { type: "student", op: 15 } } },
        { t: "Wait for a better pupil",
          r: "{them} goes off to learn drinking songs, which pay better. You wait. Better pupils are rare, and you are not getting younger.",
          fx: { happy: -3, them: { op: -15 } } },
      ],
    },

    // ===================== pf_engineer: a season with a siege engineer; his notes, and the wall that fell
    {
      id: "mpf_engine_notes",
      title: "Notes in oilcloth",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_engineer") && A.S.year - p.flags.pf_engineer >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_engineer");
        const n = logged(p, "pf_engineer", "eng"), m = linked(p, "pf_engineer", ["mentor"]);
        ctx.eng = n ? `${n}'s` : m ? `${m.given}'s` : "the engineer's";
      },
      text: "You still keep {eng} notes from the siege, wrapped in oilcloth: counterweights, rope-lays, the angle of a mine under a wall. Two offers came this month. The cathedral chapter in {capital} needs a crane to lift its new bells. A captain needs an engine that throws two hundredweight of stone over a town wall, at a hundred suns a month.",
      choices: [
        { t: "Build the captain's engine", check: { s: "siegecraft", s2: "int", d: 52 },
          win: { r: "The engine throws true on the third day. By the tenth the gate-tower is rubble, and the captain pays you a hundred suns and asks if you have a brother.",
            fx: { coin: 100, fame: 2, skill: { siegecraft: 3 }, deed: "Built a stone-thrower that broke a gate-tower" } },
          lose: { r: "A rope parts at full draw. The arm comes round, and you lose two fingers getting out of its way.",
            fx: { coin: 20, wound: "lost_fingers", health: -10, cause: "a stone-thrower's arm" } } },
        { t: "Build the bell crane", check: { s: "craft", s2: "siegecraft", d: 48 },
          win: { r: "The bells go up on Midsummer Day without a crack, while half of {capital} watches. The chapter cuts your name into the bell-frame.",
            fx: { coin: 30, fame: 3, honor: 3, piety: 2, deed: "Raised the cathedral bells" } },
          lose: { r: "The jib groans and the chapter loses its nerve. They hire someone else, and the bells go up crooked.",
            fx: { coin: 5, fame: -1 } } },
        { t: "Sell the notes to an engine yard",
          r: "The engine yard pays eighty suns without looking up from the pages. You know what they will build with them, and against whom.",
          fx: { coin: 80, honor: -2 } },
      ],
    },
    {
      id: "mpf_engine_breach",
      title: "Fire the props",
      cond: (p, C) => C.adult(p) && C.atWar(p) && C.flag(p, "pf_engineer") && A.S.year - p.flags.pf_engineer >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_engineer");
        const n = logged(p, "pf_engineer", "eng");
        const t = n ? byRole(p, "engineer") || mk(p, { given: n, sex: "M", occ: "a siege engineer", role: "engineer" })
          : linked(p, "pf_engineer", ["mentor"]) || mk(p, { sex: "M", occ: "a siege engineer" });
        ctx.pid = t.id;
      },
      text: "The war has reached a walled town, and {them}, the engineer who took you to a siege {yrs} years ago, sends for you. The mine runs to the foot of the wall. The wall is old, and townsfolk are sheltering in the houses built against it. {them} wants the props fired tonight. You know exactly how much of the wall will come down.",
      choices: [
        { t: "Fire the props tonight", check: { s: "siegecraft", s2: "wil", d: 50 },
          win: { r: "The wall comes down in the dark, with the houses against it. By morning the town has surrendered. You are paid and praised, and you do not sleep well.",
            fx: { coin: 60, fame: 3, merit: 20, deed: "Brought down a town wall with a mine", them: { op: 15 } } },
          lose: { r: "The mine comes down early, with you in it. They dig you out by the boots, with two ribs stove in.",
            fx: { health: -22, wound: "broken_ribs", cause: "a mine collapse" } } },
        { t: "Warn the town by arrow, then fire them",
          r: "At dusk an arrow goes over the wall with a message. The houses empty before midnight. {them} learns who sent it, and does not send for you again.",
          fx: { honor: 6, happy: 2, coin: 30, them: { type: "enemy", op: -40 } } },
        { t: "Refuse, and leave the siege",
          r: "{them} fires the props without you, and the wall comes down. You hear it from five miles off.",
          fx: { happy: -3, them: { op: -25 } } },
      ],
    },

    // ===================== pf_mill: the mill on the stream, eighty suns, the miller's toll
    {
      id: "mpf_mill_weir",
      title: "The sluice",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_mill") && A.S.year - p.flags.pf_mill >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_mill"); ctx.pid = mk(p, { occ: "a farmer below the weir", role: "downstream" }).id; },
      text: "The mill you built on the stream {yrs} years ago grinds for every farm within a league, and the toll is yours. In a dry summer it also holds back the water. {them}, who farms below the weir, has watched {theirHis} barley wilt for a month. Today {theyHe} comes up the bank with three sons and a pick, and asks you, civilly, to open the sluice.",
      choices: [
        { t: "Open the sluice, and grind less",
          r: "The wheel stands idle for a week, and {them}'s barley drinks. Your toll is short by a fifth this year. In the autumn {them} brings you a sack of the barley, unasked.",
          fx: { coin: -15, honor: 3, flag: "mpf_mill_shared", them: { type: "friend", op: 30 } } },
        { t: "Keep the water. The mill feeds more mouths.", check: { s: "intimidation", s2: "stewardship", d: 50 },
          win: { r: "{them} looks at the wheel, and at your men, and goes back down the bank with the pick. The barley fails. Next spring {theyHe} sells you the farm, cheap.",
            fx: { coin: -30, honor: -4, asset: "farm", them: { type: "enemy", op: -50 } } },
          lose: { r: "In the night the sons break the weir with the pick. The mill is dry for a month while it is mended.",
            fx: { coin: -40, them: { type: "enemy", op: -40 } } } },
        { t: "Take it to the manor court", check: { s: "stewardship", s2: "persuasion", d: 52 },
          win: { r: "The court rules the water shared by days: three to the mill, four to the barley. Neither of you is pleased, which the steward says is the mark of a good ruling.",
            fx: { coin: -5, skill: { stewardship: 1 }, flag: "mpf_mill_shared", them: { op: 5 } } },
          lose: { r: "The court finds for {them} and makes you pay the costs. The sluice opens by order, and the toll is short anyway.",
            fx: { coin: -30, them: { op: -10 } } } },
      ],
    },
    {
      id: "mpf_mill_famine",
      title: "The hungry year",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_mill_shared") && A.S.year - p.flags.mpf_mill_shared >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_mill_shared"); cast(p, ctx, "downstream", { occ: "a farmer below the weir" }); },
      text: "A wet spring and a blighted harvest: grain is short in {home} and dear in every market. {them}, whose barley drank from your sluice {yrs} years ago, sends word up the stream. The valley will bring what little it has to your mill, but cannot pay the toll this year. The bakers in town can, and are offering double.",
      choices: [
        { t: "Grind for the valley, toll-free",
          r: "The wheel turns day and night for the valley, and you make nothing this year. In the spring the valley's men rebuild your weir in stone, and will not take coin for it.",
          fx: { coin: -20, honor: 6, fame: 2, deed: "Ground the valley's grain toll-free in the hungry year", them: { op: 20 } } },
        { t: "Grind for the bakers, at double",
          r: "Eighty suns from the bakers. The valley grinds its grain by hand, and remembers. {them} does not come up the bank again.",
          fx: { coin: 80, honor: -5, trait: "greedy", them: { type: "enemy", op: -40 } } },
        { t: "Grind for both, and take the toll in promises", check: { s: "stewardship", s2: "persuasion", d: 50 },
          win: { r: "Mornings for the bakers, nights for the valley, and the valley's toll paid in labour next spring. You sleep four hours a night until the thaw.",
            fx: { coin: 30, skill: { stewardship: 2 }, them: { op: 15 }, owed: 1 } },
          lose: { r: "The bakers will not wait their turn, and take their grain elsewhere. The valley grumbles that you favoured them anyway.",
            fx: { coin: -10, them: { op: -10 } } } },
      ],
    },

    // ===================== pf_steward: steward of the manor, a house, a horse and forty suns a year
    {
      id: "mpf_steward_heir",
      title: "The heir's debts",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_steward") && A.S.year - p.flags.pf_steward >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_steward"); ctx.skim = loggedHas(p, "pf_steward", PATH.skimmed) ? 1 : 0;
        ctx.pid = mk(p, { status: "gentry", ageAdj: 22 + A.ri(0, 6), occ: "heir to the manor" }).id;
      },
      text: (p, ctx) => "The old lord is buried. You have kept his manor's accounts since the day you took his keys, {yrs} years ago: a house, a horse, forty suns a year. His heir, {them}, has come home from {capital} with debts. {theyHe} wants the rents up by a third, the commons fenced and the widow's grazing sold. You know which tenants that would break." +
        (ctx.skim ? " {theyHe} has had the old books read, too, and found your tenth." : ""),
      choices: [
        { t: "Raise the rents as ordered",
          r: "The rents go up by a third on quarter day. Three families are gone by midsummer. {them} is delighted with you, and says so at dinner, in front of the tenants' sons who serve it.",
          fx: { coin: 30, honor: -6, them: { type: "acquaint", op: 30 } } },
        { t: "Show {themHim} a better way to pay", check: { s: "stewardship", s2: "persuasion", d: 56 },
          win: { r: "Drain the low meadow, lease the mill-rights, sell the timber: you lay it out on one sheet. {them} reads it twice and leaves the rents alone. The debts are paid in four years.",
            fx: { fame: 2, skill: { stewardship: 3 }, deed: "Saved a manor from its heir's debts", them: { type: "friend", op: 30 } } },
          lose: { r: "{them} hears 'no' in every line of it, and gives the keys to a cousin who will say yes.",
            fx: { happy: -6, unflag: "pf_steward", them: { type: "enemy", op: -30 } } } },
        { t: "Hand back the keys rather than do it",
          r: "You lay the keys on the table and walk out of the house you have lived in for {yrs} years. The tenants send a cheese, and a cart for your things.",
          fx: { honor: 6, happy: -3, unflag: "pf_steward", them: { op: -15 } } },
        { t: "Repay your tenth, if the rents stay where they are", req: (p, C, ctx) => !!ctx.skim,
          r: "You put the tenth on the table, every sun of it. {them} counts it twice, then leaves the rents where they are. You are poorer, and you sleep.",
          fx: { coinPct: -0.4, honor: 4, them: { type: "acquaint", op: 20 } } },
      ],
    },

    // ===================== pf_school: the village children, a board and chalk, against the priest's wishes
    {
      id: "mpf_school_pupil",
      title: "The quickest of them",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_school") && A.S.year - p.flags.pf_school >= 5,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_school"); const pr = logged(p, "pf_school", "pr"), who = pr ? `${pr}'s` : "the priest's"; ctx.prq = loggedHas(p, "pf_school", PATH.coTaught) ? `with ${who} blessing` : `over ${who} objections`; ctx.pid = mk(p, { sex: "F", ageAdj: 17 + A.ri(0, 2), status: "peasant", occ: "a farmer's daughter who reads", role: "pupil" }).id; },
      text: "{them} was the quickest of the children you taught with a board and chalk {yrs} years ago, {prq}. She is grown now and reads everything: the tithe roll, the manor charter, the will her uncle swore was lost. A scriptorium in {capital} would take her as a copyist for twenty suns. Her father wants her married by harvest.",
      choices: [
        { t: "Pay the twenty suns yourself", req: p => p.coin >= 20,
          r: "She walks to {capital} with your letter in her bodice and her father's curse on her back. He does not speak to you at harvest, or the harvest after.",
          fx: { coin: -20, flag: "mpf_school_sponsor", them: { type: "student", op: 40 } } },
        { t: "Talk her father round", check: { s: "persuasion", s2: "diplomacy", d: 55 },
          win: { r: "It takes three evenings and a jug. He agrees, if the scriptorium feeds her. She goes in the spring, and sends her first letter to you, not to him.",
            fx: { skill: { persuasion: 1 }, flag: "mpf_school_sponsor", them: { type: "student", op: 35 } } },
          lose: { r: "Her father hears you out, and marries her to a cooper at harvest. She reads him the bill for the wedding ale.",
            fx: { happy: -4, them: { op: -5 } } } },
        { t: "Tell her a farm needs readers too",
          r: "She marries at harvest and keeps the manor's tithe roll honest for thirty years. The steward hates her for it.",
          fx: { honor: 1, them: { type: "student", op: 10 } } },
      ],
    },
    {
      id: "mpf_school_return",
      title: "A scribe's coat",
      cond: (p, C) => C.adult(p) && C.flag(p, "mpf_school_sponsor") && A.S.year - p.flags.mpf_school_sponsor >= 5,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_school_sponsor"); const t = cast(p, ctx, "pupil", { sex: "F", ageAdj: 23, status: "peasant" }); t.occ = "a chancery copyist"; },
      text: "A woman in a scribe's dark coat climbs down from the carrier's cart: {them}, whom you sent to {capital} {yrs} years ago. She copies charters for the chancery now. She has brought you a book, and a warning. Her office holds a petition to enclose the commons of {home}, and one of the names on it, in a good forged hand, is yours.",
      choices: [
        { t: "Ask her to lose the petition",
          r: "She looks at you, then nods. The petition is lost, and a month later so is her place at the chancery. She comes home, and teaches the children with you.",
          fx: { honor: 2, deed: "Saved a village's commons with a lost petition", them: { type: "bestfriend", op: 30 } } },
        { t: "Fight it openly at the shire court", check: { s: "persuasion", s2: "learning", d: 55 },
          win: { r: "You stand up with her copy and your own true hand. The forgery is plain to anyone who reads, and the court can read. The commons stay open.",
            fx: { fame: 3, honor: 5, them: { op: 15 }, newRel: { type: "enemy", op: -40 } } },
          lose: { r: "The court prefers the petition's friends to its forgeries. The commons are fenced by autumn, and your name stays on the petition.",
            fx: { honor: 2, coin: -30, newRel: { type: "enemy", op: -40 } } } },
        { t: "Take the share they meant to buy you with",
          r: "The encloser's agent pays sixty suns for your silence and your name. {them} takes her book back, and the cart back to {capital}.",
          fx: { coin: 60, honor: -6, them: { type: "acquaint", op: -30 } } },
      ],
    },

    // ===================== pf_partner_crook: a share in a merchant's short-weight scale
    {
      id: "mpf_scale_wardens",
      title: "A true weight",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_partner_crook") && A.S.year - p.flags.pf_partner_crook >= 2 && (C.town(p) || C.coast(p)),
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_partner_crook"); ctx.place = scalePlace(p); ctx.pid = mk(p, { given: logged(p, "pf_partner_crook", "mer") || undefined, sex: "M", status: "merchant", occ: "a big merchant" }).id; },
      text: "{yrs} years ago you weighed a pound of {them}'s goods at home, found it an eighth short, and took a share of his business for your silence. The share has paid well. Now the wardens at {place} have a new chief with a true weight, and he is testing every scale. {them} wants you to swap his scale tonight. You have a key.",
      choices: [
        { t: "Swap the scale tonight", check: { s: "stealth", s2: "trade", d: 50 },
          win: { r: "The honest scale goes in at midnight, the crooked one into the river. The new chief finds nothing. {them} doubles your share, and you are in it to the neck now.",
            fx: { coin: 40, honor: -5, trait: "deceitful", them: { type: "friend", op: 20 } } },
          lose: { r: "The new chief is sitting in the dark beside the scale, waiting for whoever comes with a key.",
            fx: { punish: "theft", them: { op: -10 } } } },
        { t: "Turn witness before the wardens",
          r: "You bring the chief your pound and your share's accounts. {them} is fined, and his scale is broken in public. You keep your neck, and lose a share and a partner.",
          fx: { honor: 4, fame: 2, them: { type: "enemy", op: -50 } } },
        { t: "Sell your share back to him today",
          r: "{them} pays forty suns, glad of a smaller mouth. Two weeks later the wardens break his scale in public, and you watch from the back of the crowd.",
          fx: { coin: 40, honor: 1, them: { op: -10 } } },
      ],
    },

    // ===================== pf_dwarf_eye: you watched the dwarf smith through a crack in the wall
    {
      id: "mpf_dwarf_fold",
      title: "Who taught you this?",
      cond: (p, C) => C.adult(p) && !C.race(p, "dwarf") && C.flag(p, "pf_dwarf_eye") && A.S.year - p.flags.pf_dwarf_eye >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_dwarf_eye"); ctx.pid = mk(p, { race: "dwarf", realm: "POL-10", occ: "a smith of the First Hall" }).id; },
      text: "A dwarf in a travelling cloak picks a blade off your bench and turns it to the light: the fold, the colour of the temper, the quench. 'Who taught you this?' {them} asks. Under the Judgment of the First Hall, the smith who rented the forge beside yours {yrs} years ago could lose his hammer for it. All you did was watch through a crack.",
      choices: [
        { t: "Tell {themHim} you watched through a crack",
          r: "{them} is silent, then barks a short laugh. 'The Judgment forbids teaching. It says nothing about smiths who do not board their walls.' {theyHe} buys the blade.",
          fx: { coin: 15, honor: 3, them: { type: "friend", op: 20 } } },
        { t: "Say you worked it out yourself", check: { s: "deception", s2: "craft", d: 55 },
          win: { r: "{them} does not believe a word, and cannot prove one. {theyHe} puts the blade down very gently, and goes.",
            fx: { honor: -2, them: { op: -10 } } },
          lose: { r: "'Steel does not lie,' {them} says, 'and smiths should not.' By the week's end every dwarf in {home} knows your name.",
            fx: { honor: -3, them: { type: "enemy", op: -40 } } } },
        { t: "Swear on your hammer never to teach it",
          r: "{them} has you swear it at the anvil, the old way, with a hand on the hammer. The smith beside the crack, {theyHe} says, will not be troubled.",
          fx: { flag: "mpf_dwarf_oath", them: { type: "acquaint", op: 15 }, sworn: true } },
      ],
    },
    {
      id: "mpf_dwarf_apprentice",
      title: "The oath and the apprentice",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_dwarf_eye") && C.flag(p, "mpf_dwarf_oath") && A.S.year - p.flags.mpf_dwarf_oath >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "mpf_dwarf_oath"); ctx.pid = mk(p, { ageAdj: 17 + A.ri(0, 3), occ: "a smith's apprentice" }).id; },
      text: "Your apprentice, {them}, has hands like yours were and an eye that misses nothing. {theyHe} has seen that your best blades are folded differently, and begs to learn why. {yrs} years ago you swore on your hammer to a dwarf of the First Hall never to teach the fold. Without it {theyHe} will be a good smith. With it, the best in {home} after you.",
      choices: [
        { t: "Teach {themHim} the fold, and break your oath",
          r: "Over one winter you show {themHim} everything you took through the crack. By spring {theyHe} is better than you. Somewhere under a mountain, a name is cut into a tally of oath-breakers.",
          fx: { honor: -8, unflag: "mpf_dwarf_oath", them: { type: "student", op: 40 } } },
        { t: "Keep the oath",
          r: "You tell {themHim} it is a thing you cannot give. {theyHe} sulks for a season, then works out half of it alone, which is how you learned it too.",
          fx: { honor: 4, wil: 1, them: { type: "student", op: 5 } } },
        { t: "Leave a blade on the bench overnight", check: { s: "craft", s2: "int", d: 50 },
          win: { r: "You swore not to teach. You did not swear to lock up your blades. In the morning the blade is where you left it, and {them} has not slept.",
            fx: { honor: -2, them: { type: "student", op: 30 } } },
          lose: { r: "{them} studies it all night, gets it wrong, and burns {theirHis} hand on the quench. You did not teach {themHim}, which is some comfort.",
            fx: { happy: -3, them: { type: "student", op: 15 } } } },
      ],
    },

    // ===================== pf_dicehouse_man: you worked off your dice debt collecting other people's
    {
      id: "mpf_collector_door",
      title: "One more door",
      cond: (p, C) => C.adult(p) && C.flag(p, "pf_dicehouse_man") && A.S.year - p.flags.pf_dicehouse_man >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { yrs(p, ctx, "pf_dicehouse_man"); ctx.debtor = A.givenName(p.cult, "M"); ctx.pid = mk(p, { sex: "M", occ: "keeper of a dice-house" }).id; },
      text: "{them}, who runs the dice-house, still sends for you when a debt turns stubborn. You worked off your own that way {yrs} years ago, a season of knocking on other people's doors. Tonight the door is {debtor}'s, a cooper with four children and no luck at dice. {them} wants two fingers if the money is not there. It is not there.",
      choices: [
        { t: "Take the two fingers",
          r: "It is quickly done. The cooper does not cry out. The children do. {them} pays you ten suns and calls you reliable, which you are.",
          fx: { coin: 10, honor: -10, trait: "cruel", them: { op: 20 } } },
        { t: "Pay the cooper's debt yourself", req: p => p.coin >= 40,
          r: "{them} takes your forty suns and gives you the look you used to give other people. The cooper's wife sends bread every quarter day after.",
          fx: { coin: -40, honor: 5, trait: "generous", them: { op: -10 } } },
        { t: "Tell {them} you are done collecting", check: { s: "intimidation", s2: "wil", d: 55 },
          win: { r: "{them} weighs you, and decides you are more trouble than one collector is worth. There are other collectors. The cooper keeps his fingers for a week.",
            fx: { unflag: "pf_dicehouse_man", them: { type: "enemy", op: -20 } } },
          lose: { r: "{them}'s new collectors teach you what you used to teach. They take two fingers, and call it the price of leaving.",
            fx: { wound: "lost_fingers", health: -12, cause: "a dice-house hammer", unflag: "pf_dicehouse_man", them: { type: "enemy", op: -40 } } } },
      ],
    },

    // ===================== pf_corsair_favor: you lost to the corsair captain on purpose, and he owes you
    {
      id: "mpf_corsair_sails",
      title: "Galleys on the shingle",
      cond: (p, C) => C.adult(p) && C.coast(p) && !C.realm(p, "POL-33") && C.flag(p, "pf_corsair_favor") && A.S.year - p.flags.pf_corsair_favor >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_corsair_favor");
        const t = linked(p, "pf_corsair_favor", ["friend", "bestfriend"]) || mk(p, { occ: "a corsair captain" });
        t.flags.mpf_role = "capn"; ctx.pid = t.id;
      },
      text: "Three corsair galleys are drawn up on the shingle below {home}, and the bell has rung since dawn. Their captain is {them}, whom you let win at dice {yrs} years ago: the luck of a stranger, lost on purpose. {theyHe} owes you a favour and knows it. One favour. Your own street, or the town's silver, or something later.",
      choices: [
        { t: "Ask {themHim} to spare your street",
          r: "{them} chalks a cross on your door and posts a man at the corner. Your street is untouched. The rest of {home} burns, and remembers whose door was chalked.",
          fx: { honor: -6, them: { op: 10 }, newRel: { type: "enemy", op: -40 } } },
        { t: "Ask {themHim} to take the silver and spare the town", check: { s: "persuasion", s2: "gambling", d: 58 },
          win: { r: "{them} rolls dice for it, loses, and laughs. The galleys leave with the harbour's silver and burn nothing. The council never learns why.",
            fx: { honor: 4, fame: 3, deed: "Bargained a corsair captain out of burning a harbour town", them: { op: -10 } } },
          lose: { r: "'That is not one favour, that is a hundred,' {them} says, and burns the harbour anyway. Your street is spared, out of habit.",
            fx: { happy: -8, them: { op: -10 } } } },
        { t: "Keep the favour for yourself",
          r: "{them} shrugs, and the raid goes on. You sit in your cellar with the favour still owing, and listen to the town burn.",
          fx: { honor: -3, happy: -5, them: { op: 5 }, owed: 1 } },
      ],
    },
    {
      id: "mpf_corsair_reef",
      title: "The captain's luck",
      cond: (p, C) => C.adult(p) && (C.realm(p, "POL-33") || C.job(p, "pirate")) && C.flag(p, "pf_corsair_favor") && A.S.year - p.flags.pf_corsair_favor >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_corsair_favor");
        ctx.dice = p.realm === "POL-33" ? "In Blackreef every crew throws dice before a raid." : "Every corsair crew throws dice before a raid.";
        const t = byRole(p, "capn") || linked(p, "pf_corsair_favor", ["friend", "bestfriend"]) || mk(p, { occ: "a corsair captain", role: "capn" });
        ctx.pid = t.id;
      },
      text: "{dice} {them}, whom you let win {yrs} years ago, has not had such luck since, and has decided you are the reason. {theyHe} wants you aboard for the spring raid as {theirHis} luck: a full share, no oar, no fighting. A captain whose luck fails tends to look for someone to blame.",
      choices: [
        { t: "Sail as the captain's luck", check: { s: "gambling", s2: "ins", d: 52 },
          win: { r: "Three fat prizes and no losses. The crew touches your sleeve for luck before every boarding. Your share is eighty suns, and a name on the quay.",
            fx: { coin: 80, fame: 2, deed: "Sailed as a corsair captain's luck", them: { type: "friend", op: 20 } } },
          lose: { r: "The first prize is a warship in disguise. You go over the side and swim for it. The crew decides your luck was bad all along.",
            fx: { health: -15, wound: "scar_chest", cause: "a boarding gone wrong", them: { type: "enemy", op: -40 } } } },
        { t: "Tell {themHim} the truth about that throw",
          r: "{them} goes red, then laughs until {theyHe} chokes. The crew does not laugh. On the quay they call you the stranger who cheats to lose.",
          fx: { honor: 3, fame: -1, trait: "honest", them: { op: -15 } } },
        { t: "Call in the old favour: no voyage",
          r: "'One favour,' {them} says, and sails without you. The raid fails. On the quay they say your luck stayed home and sulked.",
          fx: { fame: -1, them: { op: -10 } } },
      ],
    },

    // ===================== pf_dicehouse: your own dice-house in town, a back room and the house's cut
    {
      id: "mpf_house_farm",
      title: "A farm on the table",
      cond: (p, C) => C.adult(p) && C.town(p) && C.flag(p, "pf_dicehouse") && A.S.year - p.flags.pf_dicehouse >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        yrs(p, ctx, "pf_dicehouse");
        ctx.dice = loggedHas(p, "pf_dicehouse", PATH.crooked) ? "The dice were your loaded pair, the ones kept for strangers." : "The dice were honest.";
        ctx.pid = mk(p, { sex: "M", ageAdj: 18 + A.ri(0, 3), status: "peasant", occ: "a farmer's son" }).id;
      },
      text: "Your dice-house in {home} has run {yrs} years now: a back room, and the house's cut. Last night a farmer's son, {them}, lost his purse, his horse and then, on a scrap of paper in his own hand, his father's farm. {dice} At dawn his mother is at your door with the deed, and a priest.",
      choices: [
        { t: "Keep the farm. A debt is a debt.",
          r: "The family is off the land by the next quarter day. You own a farm you have never walked, and the priest preaches about you by name.",
          fx: { asset: "farm", honor: -6, trait: "greedy", them: { type: "enemy", op: -50 } } },
        { t: "Tear up the paper in front of the priest",
          r: "The mother kisses your hand. The regulars say the house has gone soft, and two of the big players go elsewhere. {them} never touches dice again.",
          fx: { coin: -20, honor: 6, piety: 2, them: { type: "friend", op: 20 } } },
        { t: "Take a tenth of the harvests instead", check: { s: "stewardship", s2: "persuasion", d: 48 },
          win: { r: "A tenth of every harvest for ten years, written and witnessed by the priest. The family keeps its land, and most of its pride.",
            fx: { coin: 15, honor: 2, them: { op: -5 }, owed: 1 } },
          lose: { r: "The mother spits on the floor of your back room. At the next service the priest calls it usury from the pulpit.",
            fx: { honor: -2, fame: -1, them: { type: "enemy", op: -30 } } } },
      ],
    },
  ]);
})();
