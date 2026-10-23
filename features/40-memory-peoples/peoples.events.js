// Memory callbacks for the elder peoples (chunk "peoples").
//
// The release's peoples packs (pp_elf_*, pp_dw_*, pp_orc_*, pp_gi_*, pp_he_*, pp_ho_*) set 36 flags that no event
// ever read: the torchlight secret of the Quickened, the Starlight Range, the young ash cut at night, the rules of the
// Quickened line, the Mistwood road, the yew stand above Lirith, the elf who walked south; the Debtors' Wall, the
// Living Wall, the door of 1084, the boy in the carters' camp, the Emberhand rune, the stonebairn, the human guild,
// the turned stone, the missing verse, the long gallery east, Korrin's petition, the bar with two names; the hyenas,
// the first wave, Tarn Halfblood, the Redhand's bay, the southern silver, Thardush; the Ragvik cog, Bergthor's voice,
// the Drevnan harpoon, the stone through a whaler's hull, King Hraldr on the ice; the hazel garden, Thalion's roll,
// the ship-share; the red cord, the filed tusks and the road east.
//
// Every event reads one of those flags (or, for the second step of an arc, a flag an earlier event here set), names
// the old moment concretely, waits years for it (A.S.year - p.flags.x >= N), keeps the setter's race and realm, and
// puts a new decision on the table with at least one branch that leaves a lasting mark. README.md lists the flags,
// the callbacks and the arcs; test.mjs (mpeMemory) checks all of it against the built page.
(() => {
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // Years since a flag was set (0 when it is missing, so no text can show NaN), and that span in words.
  const yrs = (p, f) => { const y = p && p.flags ? p.flags[f] : null; return typeof y === "number" ? Math.max(0, A.S.year - y) : 0; };
  const span = n => { n = Math.max(1, Math.round(n) || 1); return (NUM[n] || String(n)) + (n === 1 ? " year" : " years"); };
  const ago = (p, f) => span(yrs(p, f));
  const Ago = (p, f) => cap(ago(p, f));
  // Age on the human scale (16 = grown), whatever the race.
  const hAge = q => A.age(q) * 16 / GD.RACES[q.race].adult;

  // Lore figures (LORE.cast). One who has not appeared yet is created once; A.S.castMap keeps each one unique.
  const known = cid => { const id = A.S.castMap && A.S.castMap[cid]; return id ? A.P(id) : null; };
  const fine = cid => { const q = known(cid); return !q || !!q.alive; }; // used in conds: false once the figure is dead
  const castP = cid => { let q = known(cid); if (!q) { try { q = A.personFromCast(cid); } catch (e) { q = null; } } return q; };
  const fig = (p, ctx, cid) => {
    const q = castP(cid);
    if (!q || !q.alive || q.id === p.id) { ctx.skip = 1; return null; }
    ctx.pid = q.id;
    return q;
  };
  // Does this lore figure sit the realm's throne right now?
  const rules = (realm, cid) => { const r = A.realm(realm), ru = r && A.P(r.ruler); return !!(ru && ru.alive && ru.castId === cid); };

  // Someone the engine already linked to the player (a relation of one of these types).
  const kin = (p, ctx, types, ok) => {
    const x = A.relsOf(p, types).find(r => r.p.alive && r.p.id !== p.id && (!ok || ok(r.p, r.r)));
    if (x && ctx) ctx.pid = x.p.id;
    return x ? x.p : null;
  };
  // A living child of the player between two ages (human scale).
  const kidOf = (p, lo, hi) => (p.children || []).map(id => A.P(id)).find(q => q && q.alive && hAge(q) >= lo && hAge(q) < hi) || null;
  // Someone new, made to fit the story. o.age is on the human scale and is scaled to the race.
  const make = (p, ctx, o = {}) => {
    const race = o.race || p.race, realm = o.realm || p.realm, sex = o.sex || (A.chance(0.5) ? "M" : "F"), st = o.status || "peasant";
    const same = race === p.race && realm === p.realm;
    const cult = same ? p.cult : A.cultureFor(race, realm), faith = same ? p.faith : A.faithFor(race, realm);
    const age = Math.max(1, Math.round((o.age != null ? o.age : hAge(p)) * GD.RACES[race].adult / 16));
    const R = A.realm(realm), home = realm === p.realm || !R || R.capitalProv == null ? p.home : R.capitalProv;
    let given = o.given;
    if (!given) { try { given = A.givenName(cult, sex); } catch (e) { given = ""; } }
    const q = A.newPerson({ given: given || "Tam", sex, race, realm, cult, faith, born: A.S.year - age, status: st, home });
    if (o.sur != null) q.sur = o.sur;
    else { try { const fn = A.familyName({ cult, realm, status: st, home, sex }); if (fn) { q.sur = fn.sur; q.surMode = fn.mode; } } catch (e) { /* no family name */ } }
    q.occ = o.occ || (A.isAdult(q) ? A.pick(A.OCC[st] || A.OCC.peasant) : "");
    q.npcTemp = true; // dropped by A.gcPeople unless a choice links them to the player
    if (ctx) ctx.pid = q.id;
    return q;
  };

  // Effects inside a function branch; effects on a lore figure who is not ctx.pid (with the engine-style note).
  const eff = (p, ctx, o) => A.applyFx(p, o, ctx) || "";
  const NOTE = { enemy: "is your enemy now", rival: "is your rival now" };
  const castFx = (p, cid, o) => {
    const q = castP(cid);
    if (!q || !q.alive || q.id === p.id) return "";
    const out = A.applyFx(p, o, { pid: q.id }) || "";
    const t = o.them && o.them.type;
    const note = t ? `(${A.fullName(q)} ${NOTE[t] || "becomes your " + String(A.REL_LABEL[t] || t).toLowerCase()}.)` : "";
    return [out, note].filter(Boolean).join(" ");
  };
  // A debt to a moneylender: the engine charges 12% a year and takes half the purse until it is paid.
  const addDebt = (p, n) => { p.debt = Math.max(0, Math.round((p.debt || 0) + n)); return `(You owe ${n} suns.)`; };
  const join = (...xs) => xs.filter(Boolean).join(" ");

  A.defEvents([
    // ================================================================== Elves (Sylvaran POL-06, Eldergrove POL-07)

    // pp_elf_torch: at the Leaf Fall bouts an old blade told you how Sethril the Unwounded really died in 877
    {
      id: "mpe_elf_torch_bout",
      title: "Torches in the court",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && !C.old(p) && C.flag(p, "pp_elf_torch") && A.S.year - p.flags.pp_elf_torch >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", sex: "M", age: 22, sur: "of the Quickened", occ: "a blade of the Quickened" }); },
      text: p => `The queen's steward wants a show for the Ashmere envoys: a bout in the court at Evenglade, after dark, by torchlight. ${Ago(p, "pp_elf_torch")} ago an old blade told you how Sethril the Unwounded died in 877: a torchlit court, a fit, a stone stair. The steward has matched {them}, the young Quickened blade who pointed his sword at you at Leaf Fall. The torches are already in their brackets.`,
      choices: [
        { t: "Find {them} before dusk and tell him why",
          r: "He listens with his jaw set, then asks how you know, and you tell him that too. At dusk he limps into the court on an ankle that was sound at noon, and withdraws.",
          fx: { them: { type: "friend", op: 30 }, skill: { intrigue: 1 }, flag: "mpe_elf_torch_told" } },
        { t: "Tell the steward why the sword schools ban torches", check: { s: "diplomacy", s2: "int", d: 50 },
          win: { r: "The steward goes pale and moves the bout into the lamplit hall. By morning the Quickened know that someone outside their House has read the Keepers' death record.",
            fx: { honor: 3, favor: 3, flag: "mpe_elf_torch_told" } },
          lose: { r: "He thinks you want the bout for yourself. The torches are lit. In the second pass {them} drops his guard and goes down shaking on the flags. He lives. The whole court saw you warn the steward.",
            fx: { happy: -6, wil: 1, them: { op: 15 }, flag: "mpe_elf_torch_told" } } },
        { t: "Offer to fight in his place, by torchlight", req: (p, C) => !C.blood(p, "quickened"), check: { s: "sword", s2: "ins", d: 56 },
          win: { r: "The envoys get their show. You take two touches of three in the flicker, and the Ashmere men cheer the wrong blade. {them} watches from the rail, whole.",
            fx: { fame: 3, skill: { sword: 3 }, them: { type: "friend", op: 20 }, deed: "Fought the torchlit bout at Evenglade in a Quickened blade's place" } },
          lose: { r: "The flicker hides his point and yours alike. A blunt blade opens your brow to the bone. The envoys call it a fine show.",
            fx: { wound: "scar_face", health: -8, them: { op: 15 }, cause: "a torchlit bout at Evenglade" } } },
        { t: "Keep your counsel and watch from the rail",
          r: "The torches are lit. {them} wins the first pass, then stops in the middle of the second, blade high, eyes empty. The Keepers carry him out. You knew.",
          fx: { happy: -8, honor: -3, trait: "cynical" } },
      ],
    },
    // arc: mpe_elf_torch_told -> the Swordmaster of the Moot wants the secret kept
    {
      id: "mpe_elf_torch_veyla",
      title: "The Swordmaster of the Moot",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "mpe_elf_torch_told") && A.S.year - p.flags.mpe_elf_torch_told >= 2 && fine("CHR-0256"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0256"); },
      text: "{themFull}, Swordmaster of the Moot, sends for you to the School of the Quickened at Evenglade. She meets you in a hall lit by shuttered lamps. \"You know what the Keepers wrote in 877,\" she says. \"Eleven of my hundred and twenty carry the blood. If the Moot learns what flicker does to them, they will never guard the queen's door again.\"",
      choices: [
        { t: "Swear silence on her needle-blade",
          r: "You lay your hand on the blade. That winter she teaches you the Before-Thought Cut, three mornings a week, and never once says why.",
          fx: { them: { type: "mentor", back: "student", op: 25 }, sworn: true, skill: { sword: 4 }, apt: { sword: 1.2 } } },
        { t: "Say the queen's door is guarded by blades a torch can fell", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "She is quiet through a whole lamp's sputter. Then she says she will tell the queen herself, at Leaf Fall, and take the carriers off the door. You have cost her something, and saved the queen something.",
            fx: { honor: 4, them: { op: -10 }, deed: "Moved the Swordmaster of the Moot to tell the queen about the Quickened" } },
          lose: { r: "She does not argue. She walks you to the door. Within the month no sword school in Evenglade will cross blades with you.",
            fx: { honor: 2, them: { type: "enemy", op: -35 } } } },
        { t: "Ask for a place among the Queen's Quickened as your price", check: { s: "sword", s2: "spd", d: 58 },
          win: { r: "She tests you by lamplight, three passes, and you touch her once. \"Silence and a sword,\" she says. \"Both, then.\" You stand the queen's door from spring.",
            fx: { fame: 3, honor: -2, them: { op: 5 }, skill: { sword: 3 }, deed: "Taken into the Queen's Quickened" } },
          lose: { r: "Three passes, and you never see her blade. \"Silence is not a sword,\" she says, and lets you go. She remembers the price you asked.",
            fx: { them: { op: -20 }, wil: 1 } } },
      ],
    },

    // pp_elf_silent: you hit the disc three times in the dark on the Starlight Range, and Aelar the Silent chose you
    {
      id: "mpe_elf_silent_yew",
      title: "A moonless night above Lirith",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "pp_elf_silent") && A.S.year - p.flags.pp_elf_silent >= 2 && fine("CHR-0255"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0255"); },
      text: p => `${Ago(p, "pp_elf_silent")} ago you put three arrows into a pale disc on the Starlight Range, and {them} touched your shoulder once. Tonight there is no moon. Yew-cutters with Ashmere coin are in the stand above Lirith; you can hear the saws. {them} stands beside you with his dark Lirith bow unstrung. He will not shoot at what he cannot see. He signs: your choice.`,
      choices: [
        { t: "Shoot at the sound of the saws", check: { s: "bow", s2: "ins", d: 56 },
          win: { r: "Two arrows into the dark. A saw stops, then the other. At dawn the rangers find blood on the yew chips and the Ashmere men gone. {them} studies your quiver and signs nothing at all.",
            fx: { skill: { bow: 3 }, fame: 2, them: { op: -10 }, flag: "mpe_elf_silent_sound", deed: "Shot yew-thieves by sound above Lirith" } },
          lose: { r: "Your arrow finds something that cries out in Sylvari: an Edge Warden, come up the slope after the same saws. The warden lives, with your arrow through the thigh.",
            fx: { honor: -8, happy: -10, wil: 1, newRel: { type: "enemy", op: -40 } } } },
        { t: "Hold, by his rule, and mark where the saws are",
          r: "You lie in the bracken and count the strokes. At first light the stand is six trees shorter, and you can walk the rangers to every stump. {them} makes the Silent's sign for yes.",
          fx: { them: { op: 20 }, trait: "patient", skill: { tracking: 2 } } },
        { t: "Go down among them with a knife", check: { s: "stealth", s2: "dagger", d: 54 },
          win: { r: "You cut two bowstrings and a saw-rope in the dark and are gone before they strike a light. They leave at dawn with no yew.",
            fx: { skill: { stealth: 3 }, honor: 2, them: { op: 10 } } },
          lose: { r: "A lamp flares. Three Ashmere men, a sawyer's mallet, and a long night. You crawl home before dawn.",
            fx: { wound: "broken_nose", health: -10, cause: "yew-thieves above Lirith" } } },
      ],
    },
    // arc: mpe_elf_silent_sound -> the rangers want the Silent taught to shoot by sound
    {
      id: "mpe_elf_silent_teach",
      title: "By sound",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "mpe_elf_silent_sound") && A.S.year - p.flags.mpe_elf_silent_sound >= 3 && fine("CHR-0257"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0257"); },
      text: "{themFull}, Ranger-Captain of Sylvaran, climbs to your door with two Edge Wardens behind him. He has heard how you shot the yew-cutters by sound above Lirith. He wants the Silent able to do it before the next moonless season on the Oak Line. Aelar the Silent will not teach what he will not do. {them} wants you to teach it instead, on the Range, in Aelar's sight.",
      choices: [
        { t: "Teach it on the Range, in Aelar's sight",
          r: "Forty archers learn to loose at a cough in the dark. Aelar comes one night, watches, and leaves without a sign. He does not come again.",
          fx: (p, ctx) => join(eff(p, ctx, { skill: { bow: 2, command: 2 }, fame: 3, favor: 5, them: { op: 20 }, deed: "Taught the Silent to shoot by sound" }), castFx(p, "CHR-0255", { them: { op: -30 } })) },
        { t: "Refuse: it is Aelar's Range, not yours",
          r: "{them} hears you out and goes back down the hill. The Silent stay as they are: the best archers in the world, on nights with stars.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 3, them: { op: -15 } }), castFx(p, "CHR-0255", { them: { op: 15 } })) },
        { t: "Ask Aelar's leave first, in the sign-speech", check: { s: "diplomacy", s2: "ins", d: 52 },
          win: { r: "Aelar reads your hands twice. Then he signs back: teach the ones who ask. Twelve ask. He stands at the back of the Range every night you teach.",
            fx: (p, ctx) => join(eff(p, ctx, { skill: { bow: 2, command: 1 }, fame: 2, them: { op: 10 }, deed: "Taught twelve of the Silent by Aelar's leave" }), castFx(p, "CHR-0255", { them: { type: "mentor", back: "student", op: 20 } })) },
          lose: { r: "Aelar turns his back on your hands. That is an answer too, and {them} takes it as one.",
            fx: (p, ctx) => join(eff(p, ctx, { wil: 1, them: { op: -5 } }), castFx(p, "CHR-0255", { them: { op: -10 } })) } },
      ],
    },

    // pp_elf_exiled: you cut a young ash at night for a fourth room, and the Keeper exiled you for a hundred years
    {
      id: "mpe_elf_exile_kin",
      title: "At the Keepers' line",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf") && C.adult(p) && (C.hasKids(p) || C.married(p)) && C.flag(p, "pp_elf_exiled") && A.S.year - p.flags.pp_elf_exiled >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { ctx.isKid = kin(p, ctx, ["child"]) ? 1 : 0; if (!ctx.isKid && !kin(p, ctx, ["spouse"])) ctx.skip = 1; },
      text: (p, ctx) => `${Ago(p, "pp_elf_exiled")} into your hundred years of exile, {them} comes to the Keepers' line to see you. You cut a young ash at night for a fourth room, and the Keeper of {home} read the stump like a letter. ${ctx.isKid ? "{theyHe} sleeps in that room now, and it is already too small." : "The grove-house has its fourth room, and you are not in it."} {them} stands one step inside the forest. You stand one step out.`,
      choices: [
        { t: "Step across the line and hold {themHim}", check: { s: "stealth", s2: "ins", d: 50 },
          win: { r: "No Keeper is near. For the length of a breath the hundred years do not count. Then you step back out.",
            fx: { happy: 8, them: { op: 15 } } },
          lose: { r: "A Keeper's boy sees it from a walkway. The Keepers add ten years to your hundred, and {them} is told to stop coming to the line.",
            fx: { happy: -10, piety: -4, wil: 1, them: { op: 10 }, deed: "Had ten years added to an exile for one step over the Keepers' line" } } },
        { t: "Ask {themHim} to come out and live past the line",
          r: "{them} thinks about it for a season and comes, with one bag and the Keepers' disapproval. Your house past the line has a second voice in it.",
          fx: { them: { op: 20 }, happy: 6, piety: -2 } },
        { t: "Ask the Keepers how an exile earns back years",
          r: "The Keeper of {home} has the answer ready: the firebreak around Evenglade, forty kilometres of it, cut by hand. Each season you cut earns back a year. {them} goes home alone.",
          fx: { flag: "mpe_elf_firebreak", piety: 2, wil: 1, them: { op: -5 } } },
      ],
    },
    // pp_elf_exiled, later: your grown child needs a room of their own, and the Keeper is still listening to the trees
    {
      id: "mpe_elf_exile_room",
      title: "The same trouble",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf") && C.adult(p) && C.hasKids(p) && C.flag(p, "pp_elf_exiled") && A.S.year - p.flags.pp_elf_exiled >= 12,
      w: 2, once: true,
      setup: (p, ctx) => { if (!kin(p, ctx, ["child"], q => A.isAdult(q))) ctx.skip = 1; },
      text: p => `${Ago(p, "pp_elf_exiled")} after the Keeper read your stump, {them} comes to the line with your old trouble. {theyHe} needs a room for a child of {theirHis} own, and the Keeper of {home} is still listening to the trees. {them} asks you, of all people, what to do.`,
      choices: [
        { t: "Tell {themHim} to wait, as you did not",
          r: "{them} waits. In the eighth year the mark comes, on an old beech. The child has outgrown the need by then, as children do.",
          fx: { them: { op: -5 }, wil: 1, trait: "patient" } },
        { t: "Cut the tree yourself. You are exiled already", check: { s: "stealth", s2: "craft", d: 54 },
          win: { r: "You cross the line on a moonless night and fell a young ash for the second time in your life. {them} tells the Keepers the planks are deadfall. They do not ask twice.",
            fx: { them: { op: 30 }, owed: 1, piety: -6, trait: "deceitful" } },
          lose: { r: "The Keeper reads the second stump like a second letter. Your hundred years become two hundred. {them} gets the planks, and the room.",
            fx: { piety: -8, honor: -6, wil: 2, them: { op: 25 }, deed: "Was exiled twice for the same young ash" } } },
        { t: "Build it from deadfall, passed across the line", check: { s: "craft", s2: "sta", d: 44 },
          win: { r: "Two winters of fallen limbs hauled to the line and handed across. The room is sound, and no tree has to forgive anyone.",
            fx: { skill: { craft: 3 }, them: { op: 20 }, piety: 2 } },
          lose: { r: "The deadfall warps, and the floor sags. {them} keeps the room anyway.",
            fx: { skill: { craft: 2 }, them: { op: 10 } } } },
      ],
    },
    // arc: mpe_elf_firebreak -> fire comes to the firebreak you have been cutting to earn back your years
    {
      id: "mpe_elf_firebreak_fire",
      title: "Fire at the break",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf") && C.adult(p) && C.flag(p, "mpe_elf_firebreak") && A.S.year - p.flags.mpe_elf_firebreak >= 3,
      w: 3, once: true,
      text: p => `A dry autumn. For ${ago(p, "mpe_elf_firebreak")} you have cut the firebreak around Evenglade, a season at a time, to earn back the years of your exile. Tonight fire is coming through the Lirith pines toward your stretch of it, and the Keepers' horns are calling every hand to the break. Your old grove-house is on the wrong side, two valleys over.`,
      choices: [
        { t: "Hold your stretch of the break", check: { s: "sta", s2: "wil", d: 50 },
          win: { r: "You beat sparks out of the bracken until your hands blister. Your stretch holds. The Keepers write your name in their record again, on a better page, and lift what is left of your exile.",
            fx: { piety: 6, honor: 5, fame: 2, unflag: "pp_elf_exiled", deed: "Held the Evenglade firebreak, and was let back into the forest" } },
          lose: { r: "Smoke takes you to your knees. Rangers drag you back over the break while the fire eats a hundred paces of it.",
            fx: { wound: "lungs", health: -15, piety: 3, cause: "smoke at the Evenglade firebreak" } } },
        { t: "Run for the grove-house and your kin", check: { s: "athletics", s2: "survival", d: 52 },
          win: { r: "You reach the three oaks ahead of the fire and bring your kin out by the stream path. The break holds without you, barely. The Keepers write that down too.",
            fx: { happy: 6, piety: -3, honor: 2, trait: "brave" } },
          lose: { r: "You are cut off at the second valley and spend the night in a stream with the forest burning over you. The grove-house stands. You never reach it.",
            fx: { wound: "burn", health: -12, cause: "a forest fire above Lirith" } } },
        { t: "Set a back-fire without a Keeper's mark", check: { s: "survival", s2: "int", d: 55 },
          win: { r: "Your back-fire eats the road the big fire wanted. The Keepers cannot decide whether to thank you or exile you again. They do a little of both.",
            fx: { piety: -3, fame: 3, honor: 2, deed: "Turned the Lirith fire with an unmarked back-fire" } },
          lose: { r: "The wind turns your back-fire into the stand behind you. Forty trees are written against your name.",
            fx: { piety: -10, honor: -8, wil: 1 } } },
      ],
    },

    // pp_elf_qrules: your aunt taught you the rules of the Quickened line (no night patrols, no torchlit halls)
    {
      id: "mpe_elf_qrules_watch",
      title: "The night roll",
      cond: (p, C) => C.race(p, "elf", "halfelf") && C.adult(p) && C.blood(p, "quickened") && C.flag(p, "pp_elf_qrules") && A.S.year - p.flags.pp_elf_qrules >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { age: 40, occ: "captain of the night watch" }); },
      text: p => `Your aunt gave you the rules of the Quickened line ${ago(p, "pp_elf_qrules")} ago: no night patrols, no torchlit halls, no lightning on high places. Now {themFull}, {themOcc}, has put your name on the night roll for {home}: lanterns, high walkways, and the storm season coming. You need a reason to refuse. The only true one belongs to your blood.`,
      choices: [
        { t: "Refuse, and give no reason",
          r: "{them} writes \"unwilling\" beside your name in a clear hand. The word follows you about {home} for years.",
          fx: { honor: -4, wil: 1, them: { type: "rival", op: -20 } } },
        { t: "Tell {themHim} the rules of the line",
          r: "{them} strikes your name and keeps the reason, mostly. By spring two other carriers have come to you, white with anger, asking who told.",
          fx: { them: { op: 15 }, honor: 1, newRel: { type: "rival", op: -20 } } },
        { t: "Take the roll and trust your eyes", check: { s: "wil", s2: "ins", d: 52 },
          win: { r: "A whole season of lanterns and no fit. You learn to walk the walkways with your eyes half shut, which is a skill of its own.",
            fx: { wil: 2, skill: { stealth: 2 }, them: { op: 10 } } },
          lose: { r: "In the first storm a lantern swings in the wind, white, black, white. You wake on the planks with a cut scalp and {them} kneeling over you, asking questions.",
            fx: { wound: "concussion", health: -10, cause: "a Quickened fit on the night watch", them: { op: 5 } } } },
      ],
    },
    // pp_elf_qrules, years on: your own child catches falling acorns
    {
      id: "mpe_elf_qrules_child",
      title: "Acorns",
      cond: (p, C) => C.race(p, "elf", "halfelf") && C.adult(p) && C.hasKids(p) && C.blood(p, "quickened") && C.flag(p, "pp_elf_qrules") && A.S.year - p.flags.pp_elf_qrules >= 12 && !!kidOf(p, 4, 15),
      w: 2, once: true,
      setup: (p, ctx) => { const k = kidOf(p, 4, 15); if (k) ctx.pid = k.id; else ctx.skip = 1; },
      text: p => `{them} catches a falling acorn before it reaches the ground, then another, laughing. You know what the Keepers' dropped rod would say. ${Ago(p, "pp_elf_qrules")} ago your aunt gave you the rules of the line. The School at Evenglade takes carriers young and makes duelists of them. It also keeps them off night patrol and away from torches, and never says why.`,
      choices: [
        { t: "Teach {themHim} the rules, and nothing more",
          r: "No night patrols, no torchlit halls, no lightning on high places. {them} learns them like a counting rhyme and asks why only once.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.addTrait(k, "cautious"); return eff(p, ctx, { them: { op: 15 }, wil: 0.5 }); } },
        { t: "Take {themHim} to the School of the Quickened",
          r: "The Keepers drop the rod, and {them} catches it a hair after it leaves their fingers. The School takes {themHim} on the spot. You will see {themHim} on feast days.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.trainSkill(k, "sword", 6); return eff(p, ctx, { fame: 2, happy: -3, them: { op: 10 }, deed: "Gave a child to the School of the Quickened" }); } },
        { t: "Say nothing, and let {themHim} be a child",
          r: "{them} finds the rules out alone, in a thunderstorm on a high walkway, years later. {theyHe} lives, with a scar and a question about why you never said.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.addWound(k, "scar_face"); return eff(p, ctx, { them: { op: -20 }, happy: -4 }); } },
      ],
    },

    // pp_elf_taeron: Taeron Windward told you he shot a man who had not drawn, on the Mistwood road in 1067
    {
      id: "mpe_elf_taeron_hands",
      title: "Empty hands",
      cond: (p, C) => C.realm(p, "POL-07") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "pp_elf_taeron") && A.S.year - p.flags.pp_elf_taeron >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", sex: "F", given: "Lisael", sur: "Mistsail", age: 34, occ: "a rider of the Mistwood road" }); },
      text: p => `${Ago(p, "pp_elf_taeron")} ago, on the practice-deck at Nimthil, Taeron Windward told you he once shot a man on the Mistwood road who had not drawn. Now a rider of that road finds you on the quay: {themFull}, of the house that keeps the rangers' day watch. "I rode beside him on the ninth of April 1067," she says. "I saw the Temple agent's hands. They were empty." She has written it down, and signed it.`,
      choices: [
        { t: "Carry her paper to Taeron himself",
          r: "Taeron reads it twice on the practice-deck and folds it into his sealskin cloak. \"Now I am sure,\" he says. He shoots badly for the rest of the day.",
          fx: { them: { op: 15 }, honor: 2, flag: "mpe_elf_taeron_sure" } },
        { t: "Take it to the archive at Silverbough",
          r: "The archivist seals it under the Veiled Queen's mark without reading it. Within the month a Temple knight in Silverbough is asking for your name.",
          fx: { honor: 4, favor: -4, them: { op: 10 }, flag: "mpe_elf_taeron_archive" } },
        { t: "Sell the paper to the Temple's man", check: { s: "deception", s2: "trade", d: 48 },
          win: { r: "The Temple's man pays sixty suns and asks nothing about where it came from. {them} will work it out.",
            fx: { coin: 60, honor: -8, them: { type: "enemy", op: -40 } } },
          lose: { r: "The Temple's man pays twenty and has you followed home.",
            fx: { coin: 20, honor: -8, them: { type: "enemy", op: -40 } } } },
        { t: "Burn it. Leave an old archer his doubt",
          r: "The paper goes up in the brazier on the quay. {them} watches it burn, says something short in Sylvari, and rides back to the Mistwood.",
          fx: { them: { op: -25 }, trait: "kind" } },
      ],
    },
    // arc: mpe_elf_taeron_sure / mpe_elf_taeron_archive -> Taeron means to confess, or Taeron is dead
    {
      id: "mpe_elf_taeron_reckoning",
      title: "The Mistwood road, again",
      cond: (p, C) => C.realm(p, "POL-07") && C.race(p, "elf", "halfelf") && C.adult(p) && (C.flag(p, "mpe_elf_taeron_sure") || C.flag(p, "mpe_elf_taeron_archive")) && A.S.year - (p.flags.mpe_elf_taeron_sure || p.flags.mpe_elf_taeron_archive) >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { const q = castP("CHR-0287"); ctx.alive = q && q.alive && q.id !== p.id ? 1 : 0; if (ctx.alive) ctx.pid = q.id; },
      text: (p, ctx) => ctx.alive
        ? "Taeron Windward means to stand up in the ship-house at Nimthil and say it aloud: on the Mistwood road in 1067 he shot an unarmed man on the Queen's word. His draw has fallen to thirty-two kilos and his hands shake on the string. He wants one witness beside him who knows the whole of it. You do."
        : "Taeron Windward is dead, at four hundred and some years, on the practice-deck at Nimthil. He left you his yew bow and a folded paper. The paper is Lisael Mistsail's account of the Mistwood road, with a line under the word \"empty\". The bow is the best on the coast.",
      choices: [
        { t: "Stand beside him in the ship-house", req: (p, C, ctx) => !!ctx.alive,
          r: "He says it plainly, and you say what Lisael saw. The ship-house is silent, then loud. The Veiled Queen's people stop greeting you on the quay.",
          fx: { honor: 6, favor: -10, them: { op: 25 }, deed: "Stood witness for Taeron Windward at Nimthil" } },
        { t: "Warn the Veiled Queen's people first", req: (p, C, ctx) => !!ctx.alive,
          r: "The ship-house is closed for repairs on the day he chose. Taeron learns why within the week, and the Queen's steward learns your name.",
          fx: { favor: 10, honor: -6, them: { type: "enemy", op: -40 } } },
        { t: "Take the bow, and keep the paper", req: (p, C, ctx) => !ctx.alive,
          r: "The bow takes a stronger draw than you have. By midsummer you have one. The paper stays in your sea-chest, folded small.",
          fx: { gear: { ranged: "elfbow" }, skill: { bow: 3 }, wil: 1 } },
        { t: "Lay the paper before the ship-house at Nimthil", req: (p, C, ctx) => !ctx.alive,
          r: "You read it aloud where Taeron would have stood. The ship-house argues for a month about a dead man's guilt and a living queen's. You are not thanked by either side.",
          fx: { honor: 5, favor: -8, fame: 2, deed: "Read Lisael Mistsail's account in the ship-house at Nimthil" } },
      ],
    },

    // pp_elf_yewcut: a Fenali middleman pays you twenty suns a season to forget the yew stand above Lirith
    {
      id: "mpe_elf_yew_rangers",
      title: "Rangers at the fire",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "pp_elf_yewcut") && A.S.year - p.flags.pp_elf_yewcut >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", age: 36, occ: "an Edge Warden" }); },
      text: p => `Twenty suns a season still come from the middleman in Fenali, ${ago(p, "pp_elf_yewcut")} after you agreed to forget the yew stand above Lirith. Today {themFull}, {themOcc}, sits at your fire. The rangers are hunting the exile Sariel Thornwise, who cuts the false Keeper's marks. \"You walk that stand,\" {theyHe} says. \"You have seen something.\"`,
      choices: [
        { t: "Lead the rangers to the river landing",
          r: "At dawn the rangers take a Fenali barge with a false bottom and twelve staves in it. The middleman's silver stops coming. Someone in Fenali starts counting what that barge cost.",
          fx: { honor: 5, favor: 4, them: { op: 25 }, flag: "mpe_elf_yew_informed" } },
        { t: "Send them up the wrong valley", check: { s: "deception", s2: "survival", d: 50 },
          win: { r: "{them} thanks you and takes the rangers into the wrong valley for a week. The silver keeps coming. So do the stumps.",
            fx: { coin: 20, honor: -3, piety: -3, skill: { deception: 2 } } },
          lose: { r: "{them} walks the valley, finds nothing, and walks back to your fire with a new question.",
            fx: { honor: -3, them: { type: "rival", op: -25 } } } },
        { t: "Warn Sariel Thornwise instead",
          r: "You find her fire in the thornbrake. She pays you thirty suns for an hour's warning and is gone south by dark. You are her friend now, which is a dangerous thing to be.",
          fx: (p, ctx) => join(eff(p, ctx, { coin: 30, honor: -5, piety: -3 }), castFx(p, "CHR-0265", { them: { type: "friend", op: 30 } })) },
      ],
    },
    // arc: mpe_elf_yew_informed -> the barge's owners want it paid for
    {
      id: "mpe_elf_yew_knife",
      title: "Fenali knives",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "mpe_elf_yew_informed") && A.S.year - p.flags.mpe_elf_yew_informed >= 2,
      w: 3, once: true,
      text: p => `The barge the rangers took ${ago(p, "mpe_elf_yew_informed")} ago was worth more than twelve staves to someone in Fenali. Two men come to your door at dusk, Ashmere boots under elven cloaks. They want two hundred suns for the barge. Otherwise, they say, you can stop walking the stands, or stop walking.`,
      choices: [
        { t: "Fight them at your own door",
          r: "They came to talk. You did not.",
          fx: { duel: { tier: 2, title: "a Fenali smuggler's blade", opts: { kind: "brawl", place: "your own doorstep", lethal: false, toYield: true, title: "Fenali knives" } }, deed: "Fought the Fenali smugglers at your own door" } },
        { t: "Pay what you have, and give your word for the rest",
          r: "They take half your purse and your word for the rest, and they write the word down.",
          fx: (p, ctx) => join(eff(p, ctx, { coinPct: -0.5, honor: -2 }), addDebt(p, 80)) },
        { t: "Slip out to the ranger post and sleep there", check: { s: "stealth", s2: "int", d: 48 },
          win: { r: "You are at the ranger post by dark. The men at your door find rangers instead of you, and the Edge Wardens add two names to their list.",
            fx: { favor: 3, honor: 2, skill: { stealth: 2 } } },
          lose: { r: "They catch you on the walkway. A knife between the ribs, and a promise to come back.",
            fx: { wound: "deep_cut", health: -12, cause: "a Fenali smuggler's knife" } } },
      ],
    },
    // pp_elf_yewcut, years on: the stand is half stumps, and the middleman wants one last cut before the Keepers count
    {
      id: "mpe_elf_yew_last",
      title: "One last cut",
      cond: (p, C) => C.realm(p, "POL-06") && C.race(p, "elf", "halfelf") && C.adult(p) && C.flag(p, "pp_elf_yewcut") && A.S.year - p.flags.pp_elf_yewcut >= 6 && !C.flag(p, "mpe_elf_yew_informed"),
      w: 2, once: true,
      text: p => `${Ago(p, "pp_elf_yewcut")} of Fenali silver for forgetting a yew stand. The stand above Lirith is half stumps now, and the Keepers mean to count them at Leaf Fall. If they do, they will close every yew stand in the Evenwood to every bowyer in Lirith. The middleman wants one last cut before the count: fifty staves, and three seasons' silver at once.`,
      choices: [
        { t: "Take the last cut and the silver",
          r: "Fifty staves go down the river under sacking. At Leaf Fall the Keepers count, go quiet, and close the stands. The Lirith bowyers will be a long time forgiving whoever did it.",
          fx: { coin: 60, piety: -6, honor: -4, trait: "greedy" } },
        { t: "Tell the middleman's runner no, and let the silver stop",
          r: "The silver stops. At Leaf Fall the Keepers count fewer stumps than they feared, and leave the stands open with new faces watching them.",
          fx: { honor: 3, coin: -5, untrait: "deceitful", trait: "honest" } },
        { t: "Confess to the Keepers before they count", check: { s: "persuasion", s2: "faith", d: 54 },
          win: { r: "The Keepers hear you out among the stumps. Your penance is fifty yews, planted and tended for a hundred years. You will be old when they are bows.",
            fx: { piety: 6, honor: 4, coinPct: -0.3, deed: "Confessed the Lirith yew to the Keepers, and planted fifty" } },
          lose: { r: "The Keepers hear you out among the stumps and send you out of the Evenwood for twenty years.",
            fx: { piety: 2, honor: -8, happy: -12, deed: "Was sent out of the Evenwood for the Lirith yew" } } },
      ],
    },

    // pp_elf_wandered: you walked south with a bow and a cloak to see the human world
    {
      id: "mpe_elf_wander_friend",
      title: "A friend from the human years",
      cond: (p, C) => C.realm(p, "POL-06", "POL-07") && C.race(p, "elf") && C.adult(p) && C.flag(p, "pp_elf_wandered") && A.S.year - p.flags.pp_elf_wandered >= 12,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-01", age: 66, occ: "a carter of Kingsmere" }); },
      text: p => `You walked south ${ago(p, "pp_elf_wandered")} ago with a bow, a cloak and no Northfolk at all. {themFull} taught you the Northfolk, and how to haggle, and how to drink ale. Now {theyHe} comes to the forest edge on a hired mule, grey and bent, old in the human way. A whole human life has gone by while you went out and came back. {theyHe} has brought a grandchild.`,
      choices: [
        { t: "Take the grandchild into your grove-house",
          r: "The child is nine, loud and quick, and the Keepers frown at the noise. {them} rides home lighter. You will outlive the child as well, and you take the child anyway.",
          fx: (p, ctx) => {
            const f = A.P(ctx.pid), k = make(p, null, { race: "human", realm: "POL-01", age: 9, sur: f ? f.sur : undefined });
            k.realm = p.realm; k.home = p.home;
            A.link(p, k, "student", 40, "mentor");
            return join(eff(p, ctx, { them: { op: 30 }, piety: -2, happy: 4, flag: "mpe_elf_ward" }), `(${k.given} lives in your grove-house now.)`);
          } },
        { t: "Ride south with {themHim} for one more season",
          r: "One more season of loud, quick, filthy cities, at a mule's pace now. In Kingsmere {them} thanks you for coming, as if you had come a long way. You had.",
          fx: { happy: 4, wil: 1, skill: { persuasion: 2, trade: 2 }, them: { type: "bestfriend", op: 30 } } },
        { t: "Give {themHim} honey and an hour, and no more",
          r: "You walk {themHim} back to the mule. {theyHe} says you have not changed at all. It is meant kindly, and it is not true.",
          fx: { them: { op: -10 }, wil: 1, trait: "stoic" } },
      ],
    },
    // arc: mpe_elf_ward -> the human ward is grown and wants to stay in the forest
    {
      id: "mpe_elf_ward_grown",
      title: "The ward",
      cond: (p, C) => C.realm(p, "POL-06", "POL-07") && C.race(p, "elf") && C.adult(p) && C.hasRel(p, "student") && C.flag(p, "mpe_elf_ward") && A.S.year - p.flags.mpe_elf_ward >= 8,
      w: 3, once: true,
      setup: (p, ctx) => { if (!kin(p, ctx, ["student"], q => q.race === "human")) ctx.skip = 1; },
      text: p => `The human child you took in ${ago(p, "mpe_elf_ward")} ago is grown: {themFull}, with a human's hurry and an elf's patience for trees. {theyHe} wants to stay in the forest for good. The Keepers say a human may live under the oaks by leave, but may not hold a grove-house, plant a tree or sit in the Moot. {them} asks you what to do.`,
      choices: [
        { t: "Petition the Moot to let {themHim} hold your grove-house", check: { s: "persuasion", s2: "learning", d: 58 },
          win: { r: "Nine years later the Moot grants it, \"in light of the work\", the words it once gave a half-elf gardener. {them} is the first human to hold a grove-house in the Evenwood.",
            fx: { fame: 3, honor: 3, them: { op: 30 }, deed: "Won a grove-house in the Evenwood for a human ward" } },
          lose: { r: "Nine years later the Moot declines to consider it. {them} has grey in {theirHis} hair by then, and still lives under your roof by leave.",
            fx: { them: { op: 10 }, wil: 2, happy: -5 } } },
        { t: "Send {themHim} south, where {theyHe} can own land",
          r: "{them} goes south to Aldmark with a letter and your second bow. The letters come back every spring, in a hand you taught.",
          fx: { them: { op: 5 }, happy: -6, wil: 1, skill: { learning: 1 } } },
        { t: "Have the Keepers write {themHim} into your line",
          r: "The Keepers write {them} into your line in green ink, which they keep for doubtful cases. It is not a grove-house. It is a name the Moot will one day have to say aloud.",
          fx: { them: { op: 25 }, piety: -3, honor: 2, deed: "Had a human ward written into an elven line" } },
      ],
    },
    // ================================================================== Dwarves (Irondeep POL-10, Stonehold POL-28, Emberdeep POL-29)

    // pp_dw_wall: your name was carved low on the Hold Bank's Debtors' Wall; heirs inherit the debt for 300 years
    {
      id: "mpe_dw_wall_heir",
      title: "A name low on the Wall",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_wall") && A.S.year - p.flags.pp_dw_wall >= 3,
      w: 3, once: true,
      setup: (p, ctx) => {
        const k = kin(p, ctx, ["child"], q => hAge(q) >= 10);
        if (k) { ctx.who = k.sex === "M" ? "your son" : "your daughter"; return; }
        const q = make(p, ctx, { age: 15, sur: p.sur, occ: "a forge apprentice" });
        A.link(p, q, "nephew", 30, "uncle");
        ctx.who = "your sister's child";
      },
      text: (p, ctx) => `Your name has been cut low on the Debtors' Wall of the Hold Bank for ${ago(p, "pp_dw_wall")}, near the floor of the First Hall. Every forge-master in every hold reads that Wall. Today one of them sends {them}, ${ctx.who}, home from the forge door. A Wall name passes to heirs for three hundred years, and the master will not take a debt into his forge.`,
      choices: [
        { t: "Put the debt on a new contract with Goldvein",
          r: "The clerk in the black coat chisels a small mark beside your name: under contract. The forge-master takes {them} the next morning. The Bank takes one in ten a year, and is very patient.",
          fx: (p, ctx) => join(eff(p, ctx, { them: { op: 20 }, honor: 2, happy: -4 }), addDebt(p, 180)) },
        { t: "Have the Law-Carver cut {themHim} out of your line",
          r: "The Carver cuts it in stone: {them} is no heir of yours. The forge door opens. {them} does not come to your table again.",
          fx: { them: { op: -40 }, wil: 1, honor: 1 } },
        { t: "Take {themHim} down to a human smithy in the valley",
          r: "A human smith takes {them} for two suns a month and does not read dwarf walls. {them} learns fast, and learns human hurry with it.",
          fx: { them: { op: 10 }, coin: -10, honor: -1 } },
      ],
    },
    // pp_dw_wall: Orrin Goldvein himself offers to strike your name, for a service
    {
      id: "mpe_dw_wall_goldvein",
      title: "The banker's offer",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_wall") && A.S.year - p.flags.pp_dw_wall >= 5 && fine("CHR-0412"),
      w: 2, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0412"); },
      text: p => `{themFull} of the Hold Bank does not visit debtors. Today he visits you, gold rings braided into his grey beard, a gold key at his belt. "Your name has been on the Wall ${ago(p, "pp_dw_wall")}," he says. "I can have it struck tomorrow. A tally-clerk called Ragnhild Tallystone asks questions about my mines. Learn what she knows, and tell me."`,
      choices: [
        { t: "Take his offer and watch Ragnhild",
          r: "A clerk chisels your name through the next morning. You spend the winter drinking with Ragnhild Tallystone and writing down what she says.",
          fx: { unflag: "pp_dw_wall", honor: -4, happy: 8, them: { op: 20 }, skill: { intrigue: 2 }, flag: "mpe_dw_goldvein_man" } },
        { t: "Carry his offer to the Law-Carvers", check: { s: "learning", s2: "persuasion", d: 56 },
          win: { r: "A banker buying spies against his own clerk interests the Carvers very much. Goldvein's books are opened. Your name stays on the Wall, and his goes up beside it.",
            fx: { honor: 6, fame: 3, them: { type: "enemy", op: -50 }, deed: "Brought Orrin Goldvein's books before the Law-Carvers" } },
          lose: { r: "The Carvers want proof, and a debtor's word is not proof. Goldvein says nothing, then or ever. The interest on your contract goes up by half.",
            fx: (p, ctx) => join(eff(p, ctx, { honor: -2, them: { type: "enemy", op: -40 } }), addDebt(p, 60)) } },
        { t: "Refuse. You will clear it with coin or not at all",
          r: "He nods, as if you had confirmed a figure. \"Then not at all,\" he says, and goes.",
          fx: { wil: 1.5, them: { op: -10 }, trait: "stubborn" } },
      ],
    },
    // arc: mpe_dw_goldvein_man -> Ragnhild knew all along, and has a ledger of her own
    {
      id: "mpe_dw_ragnhild",
      title: "Two ledgers",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_goldvein_man") && A.S.year - p.flags.mpe_dw_goldvein_man >= 2 && fine("CHR-0421"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0421"); },
      text: "{themFull} lays two ledgers on your table. One proves Orrin Goldvein lent the Hold Bank's silver to his own mines, against the Deep Law. The other is in your hand: a winter of notes about her, for him. \"I knew by midwinter,\" she says. \"I let you write. Now choose which ledger the Carvers see.\"",
      choices: [
        { t: "Go to the Carvers with her, against Goldvein",
          r: "The Carvers read both ledgers. Goldvein's name goes up on his own Wall. Yours earns you a hard look and a pardon, for walking in beside the witness.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 6, fame: 2, them: { type: "friend", op: 30 }, deed: "Brought down Orrin Goldvein with Ragnhild Tallystone" }), castFx(p, "CHR-0412", { them: { type: "enemy", op: -50 } })) },
        { t: "Tell Goldvein where she keeps her ledger",
          r: "By spring her ledger is ash, and Ragnhild has gone south with nothing but her memory and your name in it. Goldvein sends you a cask of good ale.",
          fx: { coin: 60, honor: -10, them: { type: "enemy", op: -60 }, trait: "deceitful" } },
        { t: "Burn your own ledger and stay out of it",
          r: "Your notes go into the forge. She takes hers to the Carvers alone. Goldvein falls without you, and he does not forget that you watched him fall.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 2, them: { op: 10 } }), castFx(p, "CHR-0412", { them: { op: -25 } })) },
      ],
    },

    // pp_dw_warden: you held the Living Wall for a quarter of an hour and became a Gate Warden of Kelfast
    {
      id: "mpe_dw_warden_toll",
      title: "The Old Toll marches",
      cond: (p, C) => C.realm(p, "POL-28") && C.race(p, "dwarf") && C.adult(p) && !C.old(p) && C.flag(p, "pp_dw_warden") && A.S.year - p.flags.pp_dw_warden >= 2 && fine("CHR-0418"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0418"); },
      text: p => `${Ago(p, "pp_dw_warden")} ago you held the Living Wall for a quarter of an hour, and {them} made you a Gate Warden of Kelfast. Now Kettil Ironbrow's Old Toll is marching on the Nagora Gate with Torvald Rockcleaver's axemen, and they want Warden shields in the front rank. {them} has told them to their faces that the Wardens will not march. Kettil's men are at the barracks door, asking warden by warden.`,
      choices: [
        { t: "March with the Old Toll", check: { s: "shield", s2: "sta", d: 54 },
          win: { r: "Your shield is in the front rank at the Nagora Gate, and the Ranpuri bolts break on it. Kettil names you at his fire. {them} strikes your name from the Wardens' rolls.",
            fx: { fame: 4, honor: 2, unflag: "pp_dw_warden", them: { op: -25 }, deed: "Held the front rank at the Nagora Gate with the Old Toll" } },
          lose: { r: "A Ranpuri bolt finds the gap under your rim, and you come home on a cart. {them} strikes your name from the Wardens' rolls all the same.",
            fx: { wound: "arrow_wound", health: -14, unflag: "pp_dw_warden", them: { op: -25 }, cause: "a bolt at the Nagora Gate" } } },
        { t: "Stay at Kelfast with {them}",
          r: "Kettil's sergeant spits on the barracks step and calls you a door-shutter, the worst word a Stonehold dwarf knows. {them} hears it, and nods to you once.",
          fx: { them: { op: 25 }, honor: 1, trait: "loyal", newRel: { type: "rival", op: -25 } } },
        { t: "Ask the Wardens to vote it at the fire", check: { s: "persuasion", s2: "command", d: 52 },
          win: { r: "The Wardens vote, hall by hall, and stay. Kettil marches without them. The Crown Prince hears that one warden called the vote, and asks for your name.",
            fx: { favor: 6, honor: 3, skill: { command: 2 }, them: { op: 15 }, deed: "Kept the Gate Wardens home by a vote at the fire" } },
          lose: { r: "The vote splits eleven ways. Forty Wardens march anyway, and the hall blames whoever called the vote.",
            fx: { honor: -3, them: { op: -10 }, skill: { command: 1 } } } },
      ],
    },

    // pp_dw_door1084: Eyvind Graywall told you he gave the order to shut the door with forty on the wrong side
    {
      id: "mpe_dw_door_kettil",
      title: "The black iron band",
      cond: (p, C) => C.realm(p, "POL-28") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_door1084") && A.S.year - p.flags.pp_dw_door1084 >= 2 && fine("CHR-0413"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0413"); },
      text: p => `{themFull}, Toll-Warden of Zardeep, wears a band of black iron on one arm for a son who died at the Dwarf's Gate in 1084. He has learned that the Shield Elder of the Gate Wardens talks to you. He sits down across from you and asks one question: who shut the door with forty on the wrong side? ${Ago(p, "pp_dw_door1084")} ago, Eyvind Graywall told you.`,
      choices: [
        { t: "Tell him: Eyvind Graywall gave the order",
          r: "Kettil does not move for a long breath. Then he thanks you, very formally, and goes out. You hear later that he has taken the band off his arm and bound it to his axe.",
          fx: { them: { op: 30 }, honor: -2, flag: "mpe_dw_door_told" } },
        { t: "Tell him the door saved six hundred", check: { s: "persuasion", s2: "wil", d: 56 },
          win: { r: "\"Six hundred,\" he says. He counts something on his fingers, twice. He leaves without the name and, the next spring, without the band.",
            fx: { honor: 3, them: { op: 10 }, trait: "just" } },
          lose: { r: "\"Then someone counted,\" he says. \"Someone gave the order.\" He leaves, and you know he will ask the next dwarf, and the next.",
            fx: { them: { type: "rival", op: -20 } } } },
        { t: "Say you never asked the old warden anything", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "He believes you, or decides to. He finishes his ale and goes to find someone who did ask.",
            fx: { skill: { deception: 2 }, honor: -1 } },
          lose: { r: "He sees it in your face. He does not say so. He simply never sits across from you again.",
            fx: { them: { type: "enemy", op: -30 } } } },
      ],
    },
    // arc: mpe_dw_door_told -> Kettil calls Eyvind out under the Deep Law
    {
      id: "mpe_dw_door_axe",
      title: "Axe against shield",
      cond: (p, C) => C.realm(p, "POL-28") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_door_told") && A.S.year - p.flags.mpe_dw_door_told >= 2 && fine("CHR-0418"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0418"); },
      text: "Kettil Ironbrow has called out {themFull} under the Deep Law for the door of 1084: axe against shield, in the First Hall, before the Carvers. {them} is lame and close on two hundred years old. He sends for you. \"You told him,\" he says. \"I would have told him myself, in time. Now stand second for me, or stand second for him.\"",
      choices: [
        { t: "Stand second for {them}", check: { s: "shield", s2: "wil", d: 55 },
          win: { r: "Kettil's axe breaks on Eyvind's rim, and on yours when you step in under the law. The Carvers call it ended. Kettil unbinds the band from his axe, at last.",
            fx: { honor: 6, fame: 3, them: { op: 30 }, deed: "Stood second for Eyvind Graywall in the First Hall" } },
          lose: { r: "The axe comes over the rim. You step in, as a second may, and take it on the shoulder. {them} lives. Kettil is satisfied with that.",
            fx: { wound: "scar_chest", health: -15, honor: 4, them: { op: 30 }, cause: "Kettil Ironbrow's axe" } } },
        { t: "Stand second for Kettil, the father",
          r: "Eyvind holds the axe off for a quarter of an hour, then lowers his shield and does nothing. The Carvers stop it there. Kettil takes your arm on the way out. Eyvind does not look your way.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: -2, them: { type: "enemy", op: -40 } }), castFx(p, "CHR-0413", { them: { type: "friend", op: 25 } })) },
        { t: "Ask the Law-Carvers to forbid it", check: { s: "learning", s2: "persuasion", d: 52 },
          win: { r: "You find a judgment from 702: an order given to save a hold is not a killing. The challenge is struck. Kettil curses you across the First Hall.",
            fx: (p, ctx) => join(eff(p, ctx, { honor: 3, them: { op: 15 }, skill: { learning: 3 } }), castFx(p, "CHR-0413", { them: { type: "enemy", op: -40 } })) },
          lose: { r: "The Carvers let the challenge stand. You watch from the gallery while two old dwarves do the Deep Law's work.",
            fx: { happy: -6, them: { op: -10 } } } },
      ],
    },

    // pp_dw_tofi: in the dark gallery you asked Harrek Stonejaw who the boy in the carters' camp is
    {
      id: "mpe_dw_tofi_carver",
      title: "One exact question",
      cond: (p, C) => C.realm(p, "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_tofi") && A.S.year - p.flags.pp_dw_tofi >= 2 && fine("CHR-0082"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0082"); ctx.carver = fine("CHR-0087") ? "Law-Carver Orsa Flintmark" : "The Eldest Law-Carver"; },
      text: (p, ctx) => `${ctx.carver} calls you to her chamber and sets her chisel to a fresh stone. She asks one exact question at a time. The third is this: what did you ask the Gate-Warden, {themFull}, in the dark gallery ${ago(p, "pp_dw_tofi")} ago, that made him cancel the test? You asked about the boy in the carters' camp. She will cut whatever you say.`,
      choices: [
        { t: "Tell her about the boy",
          r: "She cuts it in four lines and thanks you. Within the month {them} has lost the Deep Gate, and his clan's name is in question. He does not speak to you again.",
          fx: { honor: 2, favor: 3, them: { type: "enemy", op: -60 } } },
        { t: "Lie in front of the stone", check: { s: "deception", s2: "wil", d: 58 },
          win: { r: "\"I asked about his jaw,\" you say. She cuts that. {them} hears of it before dark and sends you a shield-boss of Stonejaw iron, with no message.",
            fx: { them: { op: 35 }, owed: 1, honor: -3, skill: { deception: 2 } } },
          lose: { r: "Her cloudy eyes stay on your face. She cuts what you said, and a second word beside it. Lying to a Carver is a crime in Irondeep.",
            fx: { honor: -8, prison: 1, why: "lying to a Law-Carver" } } },
        { t: "Refuse: what passes in the dark gallery stays there",
          r: "She cuts \"refused\" and the date, and sets the stone on a shelf with others like it. {them} hears, and grips your arm when you pass in the gallery.",
          fx: { them: { op: 25 }, favor: -5, wil: 1.5 } },
      ],
    },
    // pp_dw_tofi, later: Harrek's granddaughter is about to ask the Carvers who taught Tofi the shield
    {
      id: "mpe_dw_tofi_ylva",
      title: "A shield in the carters' camp",
      cond: (p, C) => C.realm(p, "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_tofi") && A.S.year - p.flags.pp_dw_tofi >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "dwarf", sex: "F", given: "Ylva", sur: "Stonejaw", age: 22, occ: "a warden of the Deep Gate" }); },
      text: p => `{themFull}, a young warden of the Deep Gate, has a friend in the carters' camp: a broad, short stonebairn called Tofi. Tofi fights with a shield in the Gallery's own style, and someone taught him. {them} means to ask the Law-Carvers who. She asks you first, as an older hand. She is the Gate-Warden's granddaughter. ${Ago(p, "pp_dw_tofi")} ago, the Gate-Warden went white when you asked about that boy.`,
      choices: [
        { t: "Tell her whose son Tofi is",
          r: "She goes white, the same white as her grandfather. Then she laughs, once. Her friend is her grandfather's son, barred from the hold her family guards.",
          fx: { them: { type: "friend", op: 30 }, secret: 1, flag: "mpe_dw_tofi_kin" } },
        { t: "Tell her to let it lie", check: { s: "persuasion", s2: "ins", d: 50 },
          win: { r: "She lets it lie, for her friend's sake rather than yours. Tofi keeps his shield, and Harrek his secret.",
            fx: { them: { op: 15 }, skill: { persuasion: 2 } } },
          lose: { r: "She goes to the Carvers. The question climbs the Deep Gate line until it reaches her grandfather.",
            fx: { them: { op: -10 }, happy: -4 } } },
        { t: "Go to the Gate-Warden before she does",
          r: "Harrek hears you out in the shield store with the door shut. He thanks you the way a dwarf thanks a creditor. That night he goes down to the carters' camp himself.",
          fx: (p, ctx) => join(eff(p, ctx, { them: { op: -5 } }), castFx(p, "CHR-0082", { them: { op: 25 }, owed: 1 })) },
      ],
    },
    // arc: mpe_dw_tofi_kin -> Ylva wants to bring Tofi inside the Deep Gate on Founding night
    {
      id: "mpe_dw_tofi_founding",
      title: "Founding night",
      cond: (p, C) => C.realm(p, "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_tofi_kin") && A.S.year - p.flags.mpe_dw_tofi_kin >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!kin(p, ctx, ["friend", "bestfriend"], q => q.given === "Ylva" && q.race === "dwarf")) make(p, ctx, { race: "dwarf", sex: "F", given: "Ylva", sur: "Stonejaw", age: 24, occ: "a warden of the Deep Gate" }); },
      text: "On Founding night the gates open for the carters, and {themFull} means to bring Tofi inside the Deep Gate for the first time in his life, to stand under the cave bear's skull. She wants you on the gate with her. If a Carver sees a stonebairn in the hold, it ends two careers, and perhaps a third: her grandfather's.",
      choices: [
        { t: "Keep the gate with her", check: { s: "stealth", s2: "ins", d: 52 },
          win: { r: "Tofi stands under Hauk Stonejaw's bear skull for as long as a song takes, then walks back out. Harrek, on the far stair, sees all of it and says nothing.",
            fx: { them: { op: 25 }, deed: "Kept the Deep Gate open for a stonebairn on Founding night" } },
          lose: { r: "A Carver's clerk counts heads at the gate. By morning a name is cut on a stone, and it is yours, not Ylva's.",
            fx: { honor: -6, favor: -6, them: { op: 20 } } } },
        { t: "Refuse, and keep the gate by the law",
          r: "{them} brings Tofi to the gate anyway, sees you there, and turns him back. She does not ask you for anything again.",
          fx: { honor: 2, them: { op: -25 } } },
        { t: "Tell Harrek, and let him choose",
          r: "Harrek takes the gate watch himself that night and sends the young wardens to the feast. You never learn what he let through.",
          fx: (p, ctx) => join(eff(p, ctx, { them: { op: -10 } }), castFx(p, "CHR-0082", { them: { op: 20 } })) },
      ],
    },

    // pp_dw_rune: drunk and late, Torvald Rockcleaver showed you a Chanari blade with an Emberhand rune on the tang
    {
      id: "mpe_dw_rune_thora",
      title: "The Eldest Carver's question",
      cond: (p, C) => C.realm(p, "POL-28", "POL-29") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_rune") && A.S.year - p.flags.pp_dw_rune >= 2 && fine("CHR-0414"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0414"); },
      text: p => `Eldest Carver {themFull} has called Emberdeep's Carvers to the First Hall to prove who taught Chanari its steel. She needs proof, and she has heard that Torvald Rockcleaver keeps some. ${Ago(p, "pp_dw_rune")} ago, drunk and late, Torvald showed you a Chanari blade with an Emberhand rune on the tang. {them} asks where he keeps it.${p.realm === "POL-29" ? " The Emberhands are your own hold's smiths." : ""}`,
      choices: [
        { t: "Tell her where the blade hangs",
          r: "Her clerks take it from Torvald's hall the same day. Torvald learns who sent them before nightfall.",
          fx: (p, ctx) => join(eff(p, ctx, { them: { op: 25 }, honor: p.realm === "POL-29" ? -6 : 4, flag: "mpe_dw_rune_told" }), castFx(p, "CHR-0419", { them: { type: "enemy", op: -50 } })) },
        { t: "Warn Sigrun Emberhand first",
          r: "Sigrun Emberhand hears you out with her hand flat on her apron. She pays you forty suns and says nothing about the blade. A week later Torvald's hall is burgled.",
          fx: (p, ctx) => join(eff(p, ctx, { coin: 40, honor: -4, them: { op: -20 }, flag: "mpe_dw_rune_warned" }), castFx(p, "CHR-0425", { them: { op: 30 }, owed: 1 })) },
        { t: "Say Torvald says a great deal when drunk",
          r: "{them} writes that down too. She has written down a great deal in two hundred and thirty years.",
          fx: { them: { op: -5 }, skill: { deception: 1 }, trait: "cautious" } },
      ],
    },
    // arc: mpe_dw_rune_told / mpe_dw_rune_warned -> Aud Emberhand means to cross the passes and confess
    {
      id: "mpe_dw_rune_aud",
      title: "The old smith's confession",
      cond: (p, C) => C.realm(p, "POL-28", "POL-29") && C.race(p, "dwarf") && C.adult(p) && (C.flag(p, "mpe_dw_rune_told") || C.flag(p, "mpe_dw_rune_warned")) && A.S.year - (p.flags.mpe_dw_rune_told || p.flags.mpe_dw_rune_warned) >= 2 && fine("CHR-0434"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0434"); ctx.told = p.flags.mpe_dw_rune_told ? 1 : 0; },
      text: (p, ctx) => `{themFull} is two hundred years old, with burned hands and failing eyes. She means to cross the passes to Stonehold in June and confess the Chanari Compact before she dies: she taught Chanari crucible steel. ${ctx.told ? "She asks you, who brought Torvald's blade to light, to carry her over the passes." : "Her daughter Sigrun asks you, who warned her once, to stop her on the road."}`,
      choices: [
        { t: "Carry her over the passes", check: { s: "sta", s2: "survival", d: 52 },
          win: { r: "Eleven days on the ice road with an old woman on your back. In the First Hall she confesses in a clear voice, and the Carvers cut every word. Then she sleeps for two days.",
            fx: (p, ctx) => join(eff(p, ctx, { honor: 6, fame: 3, them: { op: 40 }, deed: "Carried Aud Emberhand over the passes to confess" }), castFx(p, "CHR-0425", { them: { type: "enemy", op: -40 } })) },
          lose: { r: "Snow closes the high pass on the sixth day. You bring her back down alive and furious.",
            fx: { wound: "frostbite", health: -10, them: { op: 20 }, cause: "the high pass in June" } } },
        { t: "Turn her back on the road with a lie about snow",
          r: "You meet her at the first pass with a mule and a story about drifts. She believes the snow. She goes home, and the Compact stays buried with her.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: -5, coin: 30, them: { op: -30 } }), castFx(p, "CHR-0425", { them: { op: 20 } })) },
        { t: "Let her go alone, as she chooses",
          r: "She goes slowly, with a hired mule. In July you hear what she said in the First Hall. So does every dwarf in two holds.",
          fx: { wil: 1, them: { op: -10 }, trait: "cautious" } },
      ],
    },

    // pp_dw_bairn: you teach a stonebairn youth the forge in secret, two evenings a week, in a human smithy
    {
      id: "mpe_dw_bairn_mark",
      title: "Whose mark",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && !C.realm(p, "POL-28", "POL-29") && C.flag(p, "pp_dw_bairn") && A.S.year - p.flags.pp_dw_bairn >= 3,
      w: 3, once: true,
      text: p => `${Ago(p, "pp_dw_bairn")} ago you began teaching a stonebairn youth the forge, two evenings a week, under a human's roof. Now a human armorer brings a mail shirt to your door and asks whose mark is on it. It is the youth's first masterwork. The mark is your clan's, cut a little crooked. Teaching an outsider breaks the Judgment of 904.`,
      choices: [
        { t: "Say the shirt is yours",
          r: "The armorer pays forty suns for your name on it. The youth hears where the shirt went, and under whose name, and stops coming on the second evening of the week.",
          fx: { coin: 40, fame: 1, honor: -3, happy: -4, trait: "deceitful" } },
        { t: "Tell the youth to cut a mark of their own",
          r: "The new mark is a hammer over a cart-wheel. By spring the armorer has ordered three more shirts, and the Law-Carvers have heard of a stonebairn who works like a dwarf.",
          fx: { honor: 3, happy: 4, skill: { craft: 2 }, flag: "mpe_dw_bairn_ownmark" } },
        { t: "Grind the mark off and sell it plain",
          r: "Plain mail sells for half. The youth watches you grind and says nothing, and works harder after.",
          fx: { coin: 15, skill: { craft: 1 }, wil: 1, trait: "cautious" } },
      ],
    },
    // arc: mpe_dw_bairn_ownmark -> the Law-Carvers summon the teacher
    {
      id: "mpe_dw_bairn_carvers",
      title: "The Judgment of 904",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && !C.realm(p, "POL-28", "POL-29") && C.flag(p, "mpe_dw_bairn_ownmark") && A.S.year - p.flags.mpe_dw_bairn_ownmark >= 2,
      w: 3, once: true,
      text: "A Law-Carver's runner finds you with a summons cut in slate. A stonebairn smith with a hammer-and-wheel mark sells mail that only dwarf hands should know how to make, and the stonebairn names no teacher. The Carvers do not need the name. They have counted the evenings you spent in a human smithy.",
      choices: [
        { t: "Confess, and plead the clause of 700", check: { s: "learning", s2: "persuasion", d: 58 },
          win: { r: "You read them the clause of 700: a hold may hire those of no hold. A smith, you argue, is a hire. They argue for a day. The stonebairn gets a contract at the outer gate.",
            fx: { honor: 4, fame: 3, skill: { learning: 3 }, deed: "Won a stonebairn a smith's contract under the clause of 700" } },
          lose: { r: "The Carvers hear the clause of 700 and cut your name on a list of oath-breakers. You may not teach in any hold for thirty years.",
            fx: { honor: -10, fame: 1, happy: -8, trait: "stubborn" } } },
        { t: "Deny it before the stone", check: { s: "deception", s2: "wil", d: 60 },
          win: { r: "You deny it in a level voice. The Carvers cannot cut what they cannot prove. The stonebairn hears what you said, and why.",
            fx: { honor: -4, skill: { deception: 2 } } },
          lose: { r: "Your voice cracks on the word \"never\". The Carvers cut the word and the crack. The fine is a hundred suns.",
            fx: (p, ctx) => join(eff(p, ctx, { honor: -10 }), addDebt(p, 100)) } },
        { t: "Leave the hold and work beside the youth",
          r: "You pack your tools into two crates and go down to the human town where the youth already sells. One forge, two marks, under a human's roof.",
          fx: { happy: 2, honor: -2, wil: 1.5, deed: "Left the hold to keep a forge with a stonebairn" } },
      ],
    },

    // pp_dw_guildhuman: you became the first dwarf on the human smiths' guild rolls of your town
    {
      id: "mpe_dw_guild_brothers",
      title: "Two more dwarves",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && !C.realm(p, "POL-10", "POL-28", "POL-29") && C.flag(p, "pp_dw_guildhuman") && A.S.year - p.flags.pp_dw_guildhuman >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", age: 50, occ: "warden of the smiths' guild" }); },
      text: p => `${Ago(p, "pp_dw_guildhuman")} on the human smiths' guild rolls of {home}, the only dwarf on them. Now two more dwarves of the smith quarter have paid their forty suns and shown master-pieces, and they name you as precedent. {themFull}, the guild warden, wants your vote at the guild hall. One dwarf, the masters say, is a curiosity. Three is a quarter.`,
      choices: [
        { t: "Vouch for both of them", check: { s: "persuasion", s2: "craft", d: 52 },
          win: { r: "Two more dwarf names go on the rolls. The human masters stop calling the quarter a curiosity and start calling it a rival.",
            fx: { honor: 4, fame: 2, them: { op: -10 }, deed: "Brought the dwarves of the smith quarter onto the guild rolls" } },
          lose: { r: "The masters vote them down, then vote you off for good measure. Your forty suns are not returned.",
            fx: { unflag: "pp_dw_guildhuman", coin: -20, honor: 2, them: { op: -20 } } } },
        { t: "Vote them down with the human masters",
          r: "The two dwarves carry their master-pieces home. In the smith quarter your shutters are broken twice that winter, and not by humans.",
          fx: { honor: -5, them: { op: 20 }, newRel: { type: "enemy", op: -30 } } },
        { t: "Offer them work under your own guild mark",
          r: "Two dwarves at your anvils, under a mark the guild already allowed. The masters cannot object to it, so they object to the price of iron instead.",
          fx: { coin: -15, honor: 2, skill: { stewardship: 2 }, trait: "generous" } },
      ],
    },
    // pp_dw_guildhuman, later: the holds say a guild oath to humans is an oath outside the stone
    {
      id: "mpe_dw_guild_hold",
      title: "Two oaths",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && !C.realm(p, "POL-10", "POL-28", "POL-29") && C.flag(p, "pp_dw_guildhuman") && A.S.year - p.flags.pp_dw_guildhuman >= 9,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "dwarf", realm: "POL-28", sex: "M", age: 24, occ: "a runner of the Law-Carvers" }); },
      text: p => `{themFull}, a runner of the Law-Carvers, comes down from the holds with a slate under his arm. By the Deep Law, a dwarf who swears a guild oath to humans has sworn outside the stone. Your clan will strike you from its rolls at the Kindling unless you strike your name from the human guild first. You paid the guild its forty suns ${ago(p, "pp_dw_guildhuman")} ago.`,
      choices: [
        { t: "Strike your name from the human guild",
          r: "The guild warden takes your name off with one line. After that you sell at the guild price, like any outsider. Your clan keeps you.",
          fx: { unflag: "pp_dw_guildhuman", happy: -4, honor: 2, coin: -10 } },
        { t: "Let the clan strike you instead",
          r: "At the Kindling your name is read out in the hold and not answered. You are a smith of {home} now, and nothing else.",
          fx: { happy: -8, wil: 2, trait: "stubborn", them: { op: -15 }, deed: "Was struck from the clan rolls for a human guild oath" } },
        { t: "Argue that a guild oath is a contract, not an oath", check: { s: "learning", s2: "persuasion", d: 56 },
          win: { r: "You send back a slate with three precedents cut on it. The Carvers argue for a season and let it stand: a contract. Two hundred dwarves in human towns owe you a drink.",
            fx: { fame: 3, honor: 3, skill: { learning: 3 }, them: { op: 10 }, deed: "Won dwarves the right to keep human guild contracts" } },
          lose: { r: "The Carvers read your slate and strike you anyway, for arguing.",
            fx: { happy: -8, honor: -2, wil: 1, them: { op: -10 } } } },
      ],
    },

    // pp_dw_stone: you turned the stone that faces the wall and read a name, a date, and the word "Hunger"
    {
      id: "mpe_dw_stone_hunger",
      title: "Hunger",
      cond: (p, C) => C.realm(p, "POL-28", "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_stone") && A.S.year - p.flags.pp_dw_stone >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-01", sex: "M", age: 45, occ: "a grain-factor of Aldmark" }); },
      text: p => `A hard winter in the hold. The bread is short and the ale is gone. {themFull}, {themOcc}, has sixty wagons of rye at the outer gate, and wants one thing for them: the wire-draw for mail. ${Ago(p, "pp_dw_stone")} ago you turned a stone in the ancestor vault and read a name, a date, and one word. The word was "Hunger".`,
      choices: [
        { t: "Trade the wire-draw for the rye",
          r: "Sixty wagons come through the gate, and your clan eats. Somewhere a Law-Carver is already choosing a second stone for your clan's shelf.",
          fx: { coin: 30, honor: -8, happy: 2, skill: { trade: 2 }, flag: "mpe_dw_stone_sold" } },
        { t: "Refuse. The hold will tighten its belts",
          r: "The factor takes his rye down the valley. The winter is long. You give your own bread to the children of your clan and lose a stone's weight by spring.",
          fx: { honor: 4, piety: 3, health: -8, trait: "stoic" } },
        { t: "Sell him a draw-plate cut one hair wrong", check: { s: "deception", s2: "craft", d: 54 },
          win: { r: "His mail will split at the third ring, a year from now, somewhere far away. The rye comes in. Your name stays where it is.",
            fx: { coin: 20, honor: -4, skill: { deception: 2 }, trait: "deceitful" } },
          lose: { r: "His smith tests the plate in front of you and laughs. The rye goes down the valley, and your name goes into the factor's book.",
            fx: { honor: -6, them: { type: "enemy", op: -30 } } } },
      ],
    },
    // arc: mpe_dw_stone_sold -> the Carvers trace the rye, and bring a blank stone
    {
      id: "mpe_dw_stone_second",
      title: "A second stone",
      cond: (p, C) => C.realm(p, "POL-28", "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_stone_sold") && A.S.year - p.flags.mpe_dw_stone_sold >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const cid = p.realm === "POL-10" ? "CHR-0087" : "CHR-0414", q = fine(cid) ? castP(cid) : null;
        if (q && q.alive && q.id !== p.id) ctx.pid = q.id;
        else make(p, ctx, { race: "dwarf", sex: "F", age: 70, occ: "a Law-Carver" });
      },
      text: "{themFull}, Law-Carver, sets a blank stone on your table. Mail drawn by the old wire-draw is for sale in Aldmark, and the Carvers have traced the rye. The stone is for the name of whoever sold the secret. It will stand facing the wall in the ancestor vault, beside the old one that bears your clan's mark.",
      choices: [
        { t: "Give your own name",
          r: "She cuts it while you watch, and turns it to the wall. Your clan ate that winter. It remembers both stones.",
          fx: { honor: -6, piety: 4, wil: 2, them: { op: 10 }, deed: "Had your name turned to the wall for the rye of a hungry winter" } },
        { t: "Say the secret leaked from a human smithy", check: { s: "deception", s2: "int", d: 58 },
          win: { r: "{them} cuts nothing. The stone goes back on her shelf, blank, for the next one.",
            fx: { honor: -4, skill: { deception: 2 }, them: { op: -5 } } },
          lose: { r: "She asks one exact question, then another. On the fourth your story comes apart. She cuts two words: your name, and \"liar\".",
            fx: { honor: -14, happy: -6, them: { type: "enemy", op: -40 } } } },
        { t: "Bring the clan to stand before the stone with you", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "Forty of your clan file into the Carver's chamber, every one of them fed by that rye. She looks along the line and cuts the clan mark alone, with no name.",
            fx: { honor: 2, piety: 2, them: { op: -10 }, deed: "Brought the clan before the Carver for the rye" } },
          lose: { r: "Eleven come. The Carver cuts your name, and notes the eleven.",
            fx: { honor: -6, happy: -4, them: { op: -5 } } } },
      ],
    },

    // pp_dw_verse: you learned what the missing verse of Dagna's Day says: the dead of Stonehold, and the killing of 398
    {
      id: "mpe_dw_verse_sung",
      title: "Into the breath",
      cond: (p, C) => C.realm(p, "POL-29") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_verse") && A.S.year - p.flags.pp_dw_verse >= 3 && fine("CHR-0428"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0428"); },
      text: p => `Dagna's Day again, and this year an envoy of Stonehold, of Thrand's line, stands in the founding hall for the first time in seven hundred years. At the silent breath he will be listening. {themFull}, Forge-Princess, wants the old wrongs confessed before they are found out. She knows you learned the missing verse ${ago(p, "pp_dw_verse")} ago. "Sing it," she says. "Into the breath."`,
      choices: [
        { t: "Sing the verse into the silence",
          r: "Your voice is the only sound in the mountain: Thrand's name, the word \"struck\", the year 398. The envoy bows his head. Half the hall will not meet your eye on the way out.",
          fx: { fame: 4, honor: 4, favor: -8, them: { op: 30 }, flag: "mpe_dw_verse_sung", deed: "Sang the missing verse on Dagna's Day" } },
        { t: "Hold the breath with the whole hold",
          r: "One breath, held by a whole mountain and one envoy. {them} does not speak to you on the way out.",
          fx: { piety: 2, favor: 2, them: { op: -20 } } },
        { t: "Tell the envoy the verse alone, afterwards", check: { s: "diplomacy", s2: "learning", d: 52 },
          win: { r: "In a side gallery you say it once, very low, as it was said to you. The envoy writes nothing down. He thanks you as one house thanks another.",
            fx: { skill: { diplomacy: 2 }, honor: 2, them: { op: 10 }, flag: "mpe_dw_verse_sung" } },
          lose: { r: "He hears it as an insult: a killing whispered in a corridor. He leaves before the feast.",
            fx: { honor: -2, them: { op: -10 } } } },
      ],
    },
    // arc: mpe_dw_verse_sung -> Thrand's line can claim the blood-price, and needs a witness from Emberdeep
    {
      id: "mpe_dw_verse_blood",
      title: "Thrand's price",
      cond: (p, C) => C.realm(p, "POL-29") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_verse_sung") && A.S.year - p.flags.mpe_dw_verse_sung >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "dwarf", realm: "POL-28", sex: "M", sur: "Bardun", age: 40, occ: "a Bardun of Thrand's line" }); },
      text: "{themFull}, of Thrand's line, comes back over the passes. Because the verse was spoken aloud in Emberdeep, his line can claim the blood-price for Thrand under the Deep Law, unpaid since 398. He needs a witness of Emberdeep who heard it said and will say so in the First Hall. You said it.",
      choices: [
        { t: "Stand witness in the First Hall",
          r: "You say it again, in Stonehold, before the Carvers. The claim stands. Emberdeep will pay in iron for twenty years, and knows whose voice began it.",
          fx: { honor: 4, favor: -12, them: { type: "friend", op: 30 }, deed: "Witnessed for Thrand's line in the First Hall of Stonehold" } },
        { t: "Refuse: a verse is not testimony",
          r: "\"You sang it to a mountain,\" he says, \"and you will not say it to a judge.\" He goes back over the passes with nothing.",
          fx: { favor: 6, honor: -2, them: { type: "enemy", op: -30 } } },
        { t: "Offer a verse in place of a price", check: { s: "diplomacy", s2: "music", d: 56 },
          win: { r: "Stonehold adds a breath for Dagna's dead to its own chant, and Emberdeep sings Thrand's name aloud each year. The Carvers take a year to agree. Both holds sing it.",
            fx: { fame: 4, honor: 4, them: { op: 20 }, skill: { music: 2 }, deed: "Made the peace of the two breaths" } },
          lose: { r: "He laughs, not kindly. A blood-price is a blood-price.",
            fx: { them: { op: -10 }, skill: { music: 1 } } } },
      ],
    },

    // pp_dw_escape: sworn to silence, you dug in the Forge-Queen's long gallery east toward Balmund
    {
      id: "mpe_dw_escape_steam",
      title: "Steam in the lower galleries",
      cond: (p, C) => C.realm(p, "POL-29") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_escape") && A.S.year - p.flags.pp_dw_escape >= 2,
      w: 3, once: true,
      text: p => `A steam burst in the lower galleries kills nine and scalds forty. The Smith-Father's breath is hotter every year. A crowd of smiths stands at the mouth of the long gallery east, where the Hammer Guard waits with its red badges. They want to know where it goes. ${Ago(p, "pp_dw_escape")} ago you dug in that gallery yourself, sworn to silence, and you know it runs east, far past any seam, toward Balmund.`,
      choices: [
        { t: "Tell the crowd where the gallery goes",
          r: "Four words: a road to Balmund. The crowd breaks for the clan halls to pack. By morning the Queen's calm is gone, and the Hammer Guard has your name.",
          fx: { honor: 3, fame: 2, favor: -15, realmStab: -4, flag: "mpe_dw_escape_told" } },
        { t: "Stand with the Hammer Guard at the gallery mouth",
          r: "You hold the line with your shield and say nothing about Balmund. The crowd calls you the Queen's dog. The Guard's captain pins a red badge on you.",
          fx: { favor: 10, honor: -3, newRel: { type: "rival", op: -25 }, deed: "Held the gallery mouth with the Hammer Guard" } },
        { t: "Take your own clan through the gallery tonight", check: { s: "stealth", s2: "stewardship", d: 52 },
          win: { r: "Forty of your clan walk east all night by lamplight, their tools in crates. At dawn you come out above the barley terraces of Balmund. The hold will know by noon.",
            fx: { happy: 4, honor: -2, skill: { stewardship: 3 }, flag: "mpe_dw_escape_clan", deed: "Led your clan out by the long gallery east" } },
          lose: { r: "A Hammer Guard picket waits at the second bend. Your clan goes home. You go to a cell.",
            fx: { prison: 1, why: "breaking into the Forge-Queen's gallery", favor: -10 } } },
      ],
    },
    // arc: mpe_dw_escape_told / mpe_dw_escape_clan -> at Balmund there is not room for everyone
    {
      id: "mpe_dw_escape_balmund",
      title: "The far end of the gallery",
      cond: (p, C) => C.realm(p, "POL-29") && C.race(p, "dwarf") && C.adult(p) && (C.flag(p, "mpe_dw_escape_told") || C.flag(p, "mpe_dw_escape_clan")) && A.S.year - (p.flags.mpe_dw_escape_told || p.flags.mpe_dw_escape_clan) >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "dwarf", sex: "M", age: 50, occ: "steward of the Balmund Terraces" }); },
      text: p => `${p.flags.mpe_dw_escape_clan ? "Your clan has lived" : "Half the hold has crowded"} above the barley terraces of Balmund for ${ago(p, p.flags.mpe_dw_escape_clan ? "mpe_dw_escape_clan" : "mpe_dw_escape_told")} now. The terraces feed a third of Emberdeep, and they cannot feed more. {themFull}, steward of the Terraces, has a list of who may stay past winter. He asks you, who started the walk east, whose names go first.`,
      choices: [
        { t: "Your own clan's names first",
          r: "Your clan stays past winter. A clan of the burned galleries goes back down the long gallery to the heat. They will remember the list, and who wrote on it.",
          fx: { happy: 4, honor: -4, them: { op: 5 }, newRel: { type: "enemy", op: -35 } } },
        { t: "The scalded smiths' families first",
          r: "The scalded go first, then the old, then the rest. Your own clan's name is eleventh. Your cousins do not thank you.",
          fx: { honor: 5, happy: -4, them: { op: 10 }, deed: "Put the scalded smiths first on the Balmund list" } },
        { t: "Say the terraces can feed more, if cut wider", check: { s: "stewardship", s2: "husbandry", d: 55 },
          win: { r: "Two seasons of cutting new terraces into the mountain, with every idle pick in Balmund. The list grows by two hundred names.",
            fx: { fame: 3, honor: 3, skill: { stewardship: 3 }, them: { op: 20 }, deed: "Cut new terraces at Balmund" } },
          lose: { r: "The new terraces slide in the first thaw. The list is the same length, and you are blamed for the mud.",
            fx: { honor: -2, them: { op: -15 } } } },
      ],
    },
    // pp_dw_escape, later: the Ranpuri temple-bank wants to value the gallery as a pledge
    {
      id: "mpe_dw_escape_lotus",
      title: "Forty thousand lotus",
      cond: (p, C) => C.realm(p, "POL-29") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_escape") && A.S.year - p.flags.pp_dw_escape >= 5,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-30", sex: "M", age: 45, occ: "a factor of the Ranpuri temple-bank" }); },
      text: p => `{themFull}, a factor of the Ranpuri temple-bank, has come up the Hazdeep road with two clerks and a knotted measuring cord. The Forge-Queen borrowed forty thousand lotus to dig her long gallery east, he says, and the interest is due. He means to walk the gallery and value it as a pledge. ${Ago(p, "pp_dw_escape")} ago you dug in it, sworn to silence. He has heard that too.`,
      choices: [
        { t: "Guide him through the gallery for his silver",
          r: "He walks it with his knotted cord, counting paces. Ranpur now knows the length of Emberdeep's back door, which Stonehold would pay a great deal to know.",
          fx: { coin: 60, honor: -8, them: { op: 15 }, trait: "greedy" } },
        { t: "Refuse him at the gate",
          r: "\"The interest is due either way,\" he says, and goes to find a hungrier guide.",
          fx: { favor: 4, them: { op: -20 } } },
        { t: "Guide him through the wrong galleries", check: { s: "deception", s2: "survival", d: 52 },
          win: { r: "Three days in the dark, and his cord measures a dead seam twice. He values the pledge at half. The Forge-Queen never learns who saved her a fortune.",
            fx: { honor: 2, skill: { deception: 3 }, them: { op: -10 }, deed: "Walked a Ranpuri factor through the wrong galleries" } },
          lose: { r: "On the third day he finds a fresh cart-rut and follows it east himself, smiling at you over his shoulder.",
            fx: { favor: -6, them: { type: "enemy", op: -30 } } } },
      ],
    },

    // pp_dw_korrin: you signed Thane Korrin's petition to set Queen Brynja aside; in Irondeep wax becomes stone
    {
      id: "mpe_dw_korrin_stone",
      title: "Wax becomes stone",
      cond: (p, C) => C.realm(p, "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_korrin") && A.S.year - p.flags.pp_dw_korrin >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        ctx.k = rules("POL-10", "CHR-0088") ? 1 : 0;
        const r = A.realm("POL-10"), ru = r && A.P(r.ruler);
        if (ru && ru.alive && ru.id !== p.id) ctx.pid = ru.id; else ctx.skip = 1;
      },
      text: (p, ctx) => ctx.k
        ? `Korrin Deepeye holds the Deep Halls now, and he has not forgotten who signed. His first order: the Aldmark garrison leaves the lower fort of the Iron Road, and the grain bargain with it. He calls the signers of his petition to hold the gate while four hundred humans march out. ${Ago(p, "pp_dw_korrin")} ago your mark went in the wax.`
        : `The Law-Carvers would not set the queen aside. In Irondeep wax becomes stone, and every name on Thane Korrin's petition is now cut into a slab in the throne's antechamber. {ruler} is calling the signers in, one at a time. ${Ago(p, "pp_dw_korrin")} after your mark went in the wax, it is your turn.`,
      choices: [
        { t: "Kneel, and ask to have your name struck", req: (p, C, ctx) => !ctx.k,
          r: "A Carver chisels a line through your name while you kneel. It is still legible. Korrin's people read it the same week.",
          fx: (p, ctx) => join(eff(p, ctx, { favor: 10, honor: -5, unflag: "pp_dw_korrin" }), castFx(p, "CHR-0088", { them: { op: -25 } })) },
        { t: "Stand by your mark", req: (p, C, ctx) => !ctx.k,
          r: "You say it plainly: the forts should stay in dwarven hands. {them} lets you finish, then lets you go. Your name stays on the slab, uncut.",
          fx: { favor: -15, honor: 4, wil: 1, flag: "mpe_dw_korrin_firm" } },
        { t: "Hold the Iron Road gate while the garrison marches out", req: (p, C, ctx) => !!ctx.k, check: { s: "shield", s2: "intimidation", d: 50 },
          win: { r: "Four hundred humans file out under forty dwarf shields. One Aldmark sergeant spits at your feet and thinks better of anything more. The fort is dwarven again by dusk.",
            fx: { favor: 8, fame: 2, honor: 2, deed: "Held the Iron Road gate as the Aldmark garrison marched out" } },
          lose: { r: "A shove becomes a scuffle at the gate. You take a pike-butt across the face, and the garrison takes its time leaving.",
            fx: { wound: "broken_nose", health: -8, favor: 3, cause: "a scuffle at the Iron Road gate" } } },
        { t: "Ask the new king to keep the grain bargain", req: (p, C, ctx) => !!ctx.k,
          r: "He hears you out with his veil down. The grain stops anyway. That winter your name is cut on a second slab, in a different room.",
          fx: { favor: -12, honor: 3, them: { op: -20 }, trait: "honest" } },
      ],
    },
    // arc: mpe_dw_korrin_firm -> Korrin stops writing petitions and comes for the lower fort by force
    {
      id: "mpe_dw_korrin_fort",
      title: "The lower fort",
      cond: (p, C) => C.realm(p, "POL-10") && C.race(p, "dwarf") && C.adult(p) && C.flag(p, "mpe_dw_korrin_firm") && A.S.year - p.flags.mpe_dw_korrin_firm >= 3 && fine("CHR-0088") && !rules("POL-10", "CHR-0088"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0088"); },
      text: "Thane {themFull} has stopped writing petitions. His men come to you at night, because your name is still uncut on the slab in the throne's antechamber. They mean to take the lower fort of the Iron Road back from the Aldmark garrison by force before the Founding. They need wardens who are already marked.",
      choices: [
        { t: "Take a spear and go with them", check: { s: "spear", s2: "stealth", d: 55 },
          win: { r: "The fort is dwarven by dawn, with one human dead and forty sent down the road in their shirts. Irondeep's word to Aldmark is broken, and your spear did part of it.",
            fx: { fame: 4, honor: 1, favor: -20, them: { op: 30 }, deed: "Took back the lower fort of the Iron Road with Korrin's men" } },
          lose: { r: "The garrison was warned. You are taken at the ditch and handed to the queen's Carvers for judgment.",
            fx: { prison: 3, why: "an armed attempt on the lower fort", them: { op: 15 } } } },
        { t: "Refuse, and burn the message",
          r: "You burn it in the forge. Korrin's men go without you. Whatever happens at the fort, your name is on one slab only.",
          fx: { wil: 1, them: { op: -20 } } },
        { t: "Warn the Gate-Warden",
          r: "Harrek Stonejaw meets them on the Iron Road with forty shields, and no blood is spilled. Korrin is sent to the far hold, and he knows exactly why.",
          fx: (p, ctx) => join(eff(p, ctx, { favor: 12, honor: -4, them: { type: "enemy", op: -60 } }), castFx(p, "CHR-0082", { them: { op: 15 } })) },
      ],
    },

    // pp_dw_partner: you poured the metal with a partner, two names in one bar, without reading the forty clauses
    {
      id: "mpe_dw_partner_clause",
      title: "Clause thirty-one",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_partner") && A.S.year - p.flags.pp_dw_partner >= 8,
      w: 3, once: true,
      setup: (p, ctx) => {
        if (kin(p, ctx, ["friend", "bestfriend"], q => q.race === "dwarf" && /mail-maker|gem-cutter|Iron Road|dark beer/.test(q.occ || ""))) return;
        const q = make(p, ctx, { race: "dwarf", occ: A.pick(["a mail-maker", "a gem-cutter", "a trader of the Iron Road", "a brewer of dark beer"]) });
        A.link(p, q, "friend", 35, "friend");
      },
      text: p => `For ${ago(p, "pp_dw_partner")} the bar has hung over your door with two names fused in it, yours and {themFull}'s. Today, looking for a clause about ore prices, you read the contract through for the first time. Clause thirty-one: if you die, your workshop goes to {them}. Not to your kin. To {them}. {theyHe} has never mentioned it.`,
      choices: [
        { t: "Ask {themHim} to strike it out", check: { s: "persuasion", s2: "learning", d: 48 },
          win: { r: "{them} laughs, a little too loud, and strikes it through with your own chisel. \"Every contract has one,\" {theyHe} says. Perhaps every contract does.",
            fx: { them: { op: 5 }, skill: { learning: 2 }, wil: 1 } },
          lose: { r: "{them} will not strike it. \"Forty clauses,\" {theyHe} says. \"You poured the metal.\" You still share a bar. You no longer share a table.",
            fx: { them: { op: -30 }, trait: "paranoid" } } },
        { t: "Add a clause thirty-two: the same for {themHim}",
          r: "The Law-Carver cuts it beside the first. Now each of you inherits the other, and each of you takes a sudden, real interest in the other's health.",
          fx: { them: { op: 15 }, sworn: true, skill: { trade: 1 } } },
        { t: "Break the bar before the Law-Carvers",
          r: "The Carver splits the bar with a cold chisel, one name on each half. The partnership's coin is shared out by weight. {them} takes {theirHis} half and does not look back.",
          fx: { them: { type: "rival", op: -35 }, coinPct: -0.25 } },
        { t: "Say nothing, and plan to outlive {themHim}",
          r: "You say nothing. You eat well, sleep well and watch the stairs.",
          fx: { trait: "paranoid", health: 2, wil: 1 } },
      ],
    },
    // pp_dw_partner: the partner has borrowed against the bar, and the Hold Bank wants both names
    {
      id: "mpe_dw_partner_debt",
      title: "Two names, one debt",
      cond: (p, C) => C.race(p, "dwarf") && C.adult(p) && C.flag(p, "pp_dw_partner") && A.S.year - p.flags.pp_dw_partner >= 3,
      w: 2, once: true,
      setup: (p, ctx) => {
        if (kin(p, ctx, ["friend", "bestfriend"], q => q.race === "dwarf" && /mail-maker|gem-cutter|Iron Road|dark beer/.test(q.occ || ""))) return;
        const q = make(p, ctx, { race: "dwarf", occ: A.pick(["a mail-maker", "a gem-cutter", "a trader of the Iron Road", "a brewer of dark beer"]) });
        A.link(p, q, "friend", 35, "friend");
      },
      text: "A Hold Bank clerk in a black coat is at your door with a carved note. {themFull} has borrowed a hundred and twenty suns against the partnership, for {theirHis} side of the trade. The bar over your door has two names on it, and so does the debt. {them} is away on the Iron Road until spring. The Bank does not wait for spring.",
      choices: [
        { t: "Pay it, and take it out of {theirHis} share",
          r: "You pay what you can and sign for the rest. When {them} comes home you hand {themHim} the receipt and a new ledger. {theyHe} reads both twice and says nothing.",
          fx: (p, ctx) => { const pay = Math.min(p.coin, 120); p.coin -= pay; return join(eff(p, ctx, { them: { op: -15 }, skill: { stewardship: 2 } }), pay < 120 ? addDebt(p, 120 - pay) : ""); } },
        { t: "Let the Bank carve both names on the Wall",
          r: "Your two names go up on the Debtors' Wall together, low, near the floor of the First Hall. {them} comes home in spring to find them there.",
          fx: { flag: "pp_dw_wall", honor: -10, them: { op: -20 } } },
        { t: "Ride after {themHim} on the Iron Road", check: { s: "riding", s2: "survival", d: 46 },
          win: { r: "You catch {themHim} at the third fort with the goods still unsold. You sell them together at the fort and pay the Bank from the cart.",
            fx: { them: { op: 15 }, coin: 10, skill: { trade: 2 } } },
          lose: { r: "You lose a week on the road and {themHim} entirely. The Bank takes half your purse while you are gone.",
            fx: { coinPct: -0.5, them: { op: -10 } } } },
      ],
    },
    // ================================================================== Orcs (the Horde POL-11, the Tusk Clans POL-34, orcs abroad)

    // pp_orc_hyena: going out for a deed-name, you hunted the hyenas that take the foals, and came home without one
    {
      id: "mpe_orc_hyena_dusk",
      title: "Laughter at the foal pens",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_hyena") && A.S.year - p.flags.pp_orc_hyena >= 2,
      w: 3, once: true,
      text: p => `${Ago(p, "pp_orc_hyena")} ago you went out to the foal pens at dusk after the hyenas, and came home without a name. They are back. Two foals are gone, and the herders say the pack is bigger. Last winter a cousin of the clan died on the grass beyond the pens and was never brought in. The clan-mothers say hyenas carry the souls of the unburied.`,
      choices: [
        { t: "Bring the cousin in and bury him first",
          r: "You ride out at noon, when hyenas sleep, with a spade and a sledge. The cousin goes into the ground with the proper words. That night the pack takes a third foal, and the clan-mothers nod as if it were a good sign.",
          fx: { piety: 5, coin: -15, honor: 2, trait: "zealous" } },
        { t: "Hunt the pack at dusk, to the last one", check: { s: "spear", s2: "ins", d: 52 },
          win: { r: "Seven hyenas by the second dusk, the big female last. The clan-mother ties a red cord in your horse's mane and says a name to the fire.",
            fx: { epithet: "Hyenabane", fame: 3, skill: { spear: 3 }, deed: "Killed the hyena pack at the foal pens" } },
          lose: { r: "The big female takes you by the calf and drags. A herder's spear saves the leg, and the pack goes on laughing out on the grass.",
            fx: { wound: "bite", health: -12, wil: 1.5, cause: "a hyena at the foal pens" } } },
        { t: "Poison a carcass, as the farmers do",
          r: "It works: nine dead hyenas by morning, and two of the clan's dogs. The clan-mothers do not speak to you at the fire for a month.",
          fx: { honor: -5, coin: 10, trait: "cynical" } },
      ],
    },

    // pp_orc_firstwave: at the relay drill the war-captain picked you for the first wave
    {
      id: "mpe_orc_wave_fourth",
      title: "The fourth wave",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && !C.old(p) && C.flag(p, "pp_orc_firstwave") && A.S.year - p.flags.pp_orc_firstwave >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "orc", sex: "M", age: 34, occ: "war-captain of the first wave" }); },
      text: p => `The first wave, in earnest this time, against a line of human pikes on a river bank. Three waves have struck and fallen back to the rest line, and the horses are blowing white. {themFull} has kept you in the first wave since the relay drill ${ago(p, "pp_orc_firstwave")} ago. Now {theyHe} calls a fourth wave on blown horses. The drum is already beating.`,
      choices: [
        { t: "Ride the fourth wave", check: { s: "mounted", s2: "sta", d: 56 },
          win: { r: "The pikes give at the fourth charge, where they held at the third. {them} says your name to the drum, and the drum says it back.",
            fx: { fame: 4, skill: { mounted: 3 }, them: { op: 15 }, flag: "mpe_orc_wave_leader", deed: "Broke a pike line in the fourth wave" } },
          lose: { r: "Your mare falls under you in the mouth of the pikes and does not get up. You walk back to the rest line, cut twice.",
            fx: { wound: "deep_cut", health: -14, gear: { mount: null }, cause: "human pikes on a river bank" } } },
        { t: "Shout for the rest line instead",
          r: "Half the wave hears you and holds. The fourth wave goes in thin and comes back thinner. {them} gives your place in the first wave to someone who did not shout.",
          fx: { unflag: "pp_orc_firstwave", honor: -2, them: { op: -25 }, trait: "cautious" } },
        { t: "Take your riders round the flank", check: { s: "tactics", s2: "riding", d: 54 },
          win: { r: "Twenty riders round the reeds onto the pikes' left. The line folds from the end. {them} calls it luck in front of the clan, and in private asks you how.",
            fx: { fame: 2, skill: { tactics: 3 }, them: { op: 10 }, flag: "mpe_orc_wave_leader" } },
          lose: { r: "The reeds are a marsh. You come back muddy to the girth, after the fighting.",
            fx: { happy: -4, them: { op: -15 } } } },
      ],
    },
    // arc: mpe_orc_wave_leader -> you lead a wave, and a young rider begs for the first
    {
      id: "mpe_orc_wave_young",
      title: "A rider like you were",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "mpe_orc_wave_leader") && A.S.year - p.flags.mpe_orc_wave_leader >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "orc", age: 16, occ: "a rider of the rest line" }); },
      text: "You lead a wave of your own now. {themFull} rides in it, barely grown and fearless, and begs a place in the first wave before the summer fighting. {theyHe} rides as you did at the relay drill: every wave at full fury, nothing kept back. {theirHis} mother finds you at the horse lines and asks you, quietly, to say no.",
      choices: [
        { t: "Give {themHim} the first wave", check: { s: "command", s2: "ins", d: 50 },
          win: { r: "{them} rides every wave and comes back whole, with a name. {theirHis} mother does not thank you, and does not need to.",
            fx: { fame: 1, them: { type: "comrade", op: 30 } } },
          lose: { r: "{them} comes back across a horse's withers, alive, with a leg that will never take a stirrup again. {theirHis} mother stops speaking your name.",
            fx: { happy: -8, honor: -2, them: { op: -10 }, newRel: { type: "enemy", op: -30 } } } },
        { t: "Say no, and put {themHim} in the rest line",
          r: "{them} sulks for a summer. In the autumn {theyHe} thanks you once, without saying for what.",
          fx: { honor: 2, them: { op: -10 }, trait: "patient" } },
        { t: "Ride beside {themHim} in the first wave", check: { s: "mounted", s2: "str", d: 55 },
          win: { r: "Stirrup to stirrup through four waves. When {theyHe} falters you are there; when you falter, so is {theyHe}.",
            fx: { fame: 2, them: { type: "comrade", op: 35 }, deed: "Rode the first wave beside a rider half your age" } },
          lose: { r: "You take the lance meant for {themHim} under the ribs. {them} brings you back to the rest line across {theirHis} own saddle.",
            fx: { wound: "broken_ribs", health: -15, them: { type: "comrade", op: 40 }, cause: "a lance in the first wave" } } },
      ],
    },
    // pp_orc_firstwave, long after: orcs burn fast, and the drum-master wants you in the first wave once more
    {
      id: "mpe_orc_wave_last",
      title: "Thirty breaths",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_firstwave") && A.S.year - p.flags.pp_orc_firstwave >= 12,
      w: 2, once: true,
      text: p => `${Ago(p, "pp_orc_firstwave")} in the first wave. Orcs burn fast, and your chest whistles after two minutes now; thirty breaths in the rest line are not enough any more. The drum-master wants you in the first wave once more, for the charge before the war-chief at the Great Ride. Every young rider in the clan will be watching who rides it.`,
      choices: [
        { t: "Ride the first wave once more", check: { s: "sta", s2: "wil", d: 58 },
          win: { r: "Two minutes in, thirty breaths out, and again. You finish on a blowing horse with the whole Ride shouting. Then you sit down in the grass for an hour.",
            fx: { fame: 4, honor: 2, deed: "Rode the first wave at the Great Ride in your last year of it" } },
          lose: { r: "Halfway through the second wave your chest closes like a fist. You come off the horse at a walk, coughing blood into the grass.",
            fx: { wound: "lungs", health: -15, wil: 2, cause: "the first wave at the Great Ride" } } },
        { t: "Ask for the rest line, and teach it",
          r: "You take the rest line and teach pacing to riders who think it is cowardice. Some of them live long enough to change their minds.",
          fx: { unflag: "pp_orc_firstwave", skill: { command: 3, riding: 1 }, trait: "patient" } },
        { t: "Beat the drum for the waves instead",
          r: "The drum-master gives you a drum and a place on the rise. Two minutes in, thirty breaths out: you know it in your chest better than anyone.",
          fx: { skill: { music: 3, command: 1 }, piety: 2, deed: "Beat the waves at the Great Ride" } },
      ],
    },

    // pp_orc_tarnmet: you rode to the Gashmar guest camp to see Tarn Halfblood, and came home with an opinion
    {
      id: "mpe_orc_tarn_gordush",
      title: "Across the Gordush",
      cond: (p, C) => C.realm(p, "POL-11") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_tarnmet") && A.S.year - p.flags.pp_orc_tarnmet >= 2 && fine("CHR-0301"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0301"); },
      text: p => `${Ago(p, "pp_orc_tarnmet")} ago you rode to the Gashmar guest camp and found {themFull} younger than the songs and tireder. He remembers your clan's grass. Now his rider is at your fire: Tarn means to cross the Gordush at new moon and burn the License Law tally-houses in the Harrow villages. The war-chief's guest-law forbids it. Tarn wants riders who came to see him before the songs did.`,
      choices: [
        { t: "Ride across the Gordush with Tarn", check: { s: "mounted", s2: "stealth", d: 52 },
          win: { r: "Three tally-houses burn at new moon, and the license rolls with them. You are back across the river by dawn. Aldmark puts a price on Tarn's riders, unnamed.",
            fx: { fame: 3, honor: 1, skill: { mounted: 2 }, them: { type: "comrade", op: 30 }, flag: "mpe_orc_tarn_rode" } },
          lose: { r: "An Aldmark patrol is waiting at the ford. You swim back with a bolt in your shoulder and Tarn's hand on your collar.",
            fx: { wound: "arrow_wound", health: -12, them: { type: "comrade", op: 20 }, flag: "mpe_orc_tarn_rode", cause: "an Aldmark patrol at the Gordush" } } },
        { t: "Tell the Hearth Guard he means to break the guest-law",
          r: "Hearth Guard riders are at the Gashmar camp by dark. Tarn stays a guest of the fire, under guard. He learns within the week who sent them.",
          fx: { favor: 8, honor: -4, them: { type: "enemy", op: -40 } } },
        { t: "Send your best horse, and stay home",
          r: "You send the bay with your clan's mark on its hip. It comes back from the Gordush without its rider, but it comes back.",
          fx: { coin: -20, them: { op: 15 }, trait: "cautious" } },
      ],
    },
    // arc: mpe_orc_tarn_rode -> the blood fury took Tarn on the raid, and he wants someone sworn to stop him
    {
      id: "mpe_orc_tarn_fury",
      title: "The blood fury",
      cond: (p, C) => C.realm(p, "POL-11") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "mpe_orc_tarn_rode") && A.S.year - p.flags.mpe_orc_tarn_rode >= 2 && fine("CHR-0301"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0301"); },
      text: "{themFull} comes to your fire alone, which he never does. On the last raid the blood fury took him, as it took his father, and he cut down one of his own riders before it passed. \"You rode with me,\" he says. \"If it takes me again, someone must stop me. With a blade, if it comes to that. Swear it.\"",
      choices: [
        { t: "Swear it on your knife",
          r: "You swear on your knife, in front of the fire. He sleeps that night, he tells you later, for the first time since the raid.",
          fx: { them: { op: 25 }, sworn: true, honor: 2 } },
        { t: "Refuse, and leave his band",
          r: "\"Then go,\" he says, without anger, which is worse. You ride home. The songs about Tarn go on without your name in them.",
          fx: { them: { op: -30 }, wil: 1 } },
        { t: "Take it to Harkun the Drum-Master",
          r: "Harkun listens with his palm on his thigh, tapping. Then he sends for Tarn. You never hear what the drums decide, but Tarn rides no raids that year.",
          fx: (p, ctx) => join(eff(p, ctx, { piety: 3, them: { op: -20 } }), castFx(p, "CHR-0299", { them: { op: 20 } })) },
      ],
    },

    // pp_orc_redhand: you took Skarn Redhand's Magak bay and promised your voice
    {
      id: "mpe_orc_redhand_voice",
      title: "The rider with the red hand",
      cond: (p, C) => C.realm(p, "POL-11") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_redhand") && A.S.year - p.flags.pp_orc_redhand >= 2 && fine("CHR-0295"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0295"); ctx.holds = rules("POL-11", "CHR-0295") ? 1 : 0; },
      text: (p, ctx) => ctx.holds
        ? `{themFull} holds the war-chief's staff now. ${Ago(p, "pp_orc_redhand")} ago you took his Magak bay and promised your voice. His rider is back at your fire with a different request: the staff needs a horse-master for the Magak herds, and Skarn remembers who was counted early.`
        : `The Drum Council meets at {capital} to judge {ruler}'s summer war, and the clans are counting voices. The rider with the red hand on his shield is back at your fire, ${ago(p, "pp_orc_redhand")} after he left you a Magak bay. "Now," he says. "Speak for the Redhand."`,
      choices: [
        { t: "Speak for the Redhand, as promised", req: (p, C, ctx) => !ctx.holds,
          r: "You say it at the council fire, plainly, with the bay tethered where everyone can see it. The war-chief's men count your voice. So does Skarn.",
          fx: { honor: 2, favor: -10, them: { op: 25 }, flag: "mpe_orc_redhand_spoke" } },
        { t: "Speak for the war-chief instead", req: (p, C, ctx) => !ctx.holds,
          r: "Skarn's rider takes the Magak bay from your lines that night without asking. The council goes the war-chief's way, and one of the voices is yours.",
          fx: { honor: -6, favor: 8, gear: { mount: null }, them: { type: "enemy", op: -40 } } },
        { t: "Take the horse-master's place", req: (p, C, ctx) => !!ctx.holds,
          r: "Six thousand head and the best bloodlines on the grass are yours to keep. They call you the Redhand's horse-master, and not every fire says it kindly.",
          fx: { job: "horsemaster", favor: 10, them: { op: 15 }, skill: { husbandry: 3 }, deed: "Made horse-master of the Magak herds" } },
        { t: "Give back the bay and keep your voice",
          r: "You lead the bay to the rider's horse and hand him the rope. He takes it without a word. Your voice is your own again, and worth less to everyone.",
          fx: { honor: 1, wil: 1, gear: { mount: null }, them: { op: -15 } } },
      ],
    },
    // arc: mpe_orc_redhand_spoke -> Skarn means to hold the staff the night the war-chief dies
    {
      id: "mpe_orc_redhand_night",
      title: "The remount herds",
      cond: (p, C) => C.realm(p, "POL-11") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "mpe_orc_redhand_spoke") && A.S.year - p.flags.mpe_orc_redhand_spoke >= 2 && fine("CHR-0295") && !rules("POL-11", "CHR-0295"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0295"); },
      text: "Skarn's rider says the war-chief's lips grey after every hard ride now. When he falls, {themFull} means to hold the staff before the Drum Council can sit. He needs the remount herds at {capital} in his riders' hands that night, and you know the herd-guards. You spoke for the Redhand once. Now he wants more than a voice.",
      choices: [
        { t: "Take the remount herds for Skarn", check: { s: "riding", s2: "intrigue", d: 54 },
          win: { r: "The herd-guards are your cousins' sons. By morning six hundred remounts are in Redhand lines, and whoever wants the staff will have to walk to it.",
            fx: { honor: -2, favor: -15, them: { op: 30 }, deed: "Held the remount herds at the capital for Skarn Redhand" } },
          lose: { r: "The herd-guards are Hearth Guard tonight, not your cousins' sons. You get away with a cut arm and your name in Grask Firstwave's mouth.",
            fx: { wound: "scar_arm", health: -8, favor: -15, them: { op: 10 }, cause: "Hearth Guard spears at the remount herds" } } },
        { t: "Refuse him to his rider's face",
          r: "\"A voice is a voice,\" you say, \"and a herd is a war.\" The rider rides off. The Magak count you out from that day.",
          fx: { honor: 3, them: { type: "enemy", op: -30 } } },
        { t: "Tell Grask Firstwave what Skarn intends",
          r: "Grask hears it in the war-chief's tent with the flap tied. The remount herds get new guards that night. Skarn learns why, eventually.",
          fx: (p, ctx) => join(eff(p, ctx, { favor: 12, honor: -5, them: { type: "enemy", op: -50 } }), castFx(p, "CHR-0308", { them: { type: "friend", op: 25 } })) },
      ],
    },

    // pp_orc_merc: you rode a season for a human prince at forty suns a month and came home with silver
    {
      id: "mpe_orc_merc_cousins",
      title: "Cousins on the other side",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && !C.old(p) && C.flag(p, "pp_orc_merc") && A.S.year - p.flags.pp_orc_merc >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", sex: "M", age: 40, occ: "a recruiter for southern princes" }); },
      text: p => `{themFull}, the recruiter with the mule of silver, is back, ${ago(p, "pp_orc_merc")} after your season of other people's war. This time the pay is sixty suns a month. The other side, he admits, has hired orc riders too: clan-cousins of yours, at forty. "Two minutes of you against two minutes of them," he says. "Whoever wins, it will be a short fight."`,
      choices: [
        { t: "Sign on at sixty", check: { s: "mounted", s2: "ins", d: 54 },
          win: { r: "You meet your cousins' wave head-on in a barley field. Both sides pull up at the last stride, and both ride home with princes' silver. Your prince calls it a victory.",
            fx: { coin: 120, fame: 2, honor: -2, deed: "Rode against clan-cousins for a southern prince, and pulled up" } },
          lose: { r: "Your cousins do not pull up. Neither do you. You come home with silver, a cut, and one cousin fewer.",
            fx: { coin: 90, wound: "scar_arm", honor: -4, happy: -10, newRel: { type: "enemy", op: -40 } } } },
        { t: "Refuse: orcs do not ride against orcs for humans",
          r: "He shrugs and rides on to the next camp. Some of your age-mates go with him. You watch them go.",
          fx: { honor: 3, wil: 1, them: { op: -20 } } },
        { t: "Sign on, and send word to the cousins", check: { s: "intrigue", s2: "riding", d: 50 },
          win: { r: "Both waves charge, both pull up, and both princes pay. The recruiter works it out a month later and puts your name on a list of riders never to hire.",
            fx: { coin: 60, honor: 2, skill: { intrigue: 2 }, them: { type: "enemy", op: -30 } } },
          lose: { r: "Your message reaches the wrong cousin, who sells it to the other prince.",
            fx: { honor: -4, them: { op: -10 }, newRel: { type: "rival", op: -20 } } } },
      ],
    },
    // pp_orc_merc, later: the prince never paid the dead riders' last month
    {
      id: "mpe_orc_merc_widows",
      title: "The dead riders' silver",
      cond: (p, C) => C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_merc") && A.S.year - p.flags.pp_orc_merc >= 4,
      w: 2, once: true,
      text: p => `${Ago(p, "pp_orc_merc")} ago you came home from a southern war with a purse of silver. Not all your age-mates came home, and the prince never paid the dead riders' last month. Now the clan-mothers of three of them are at your fire. You know the road, you know the human tongue, and you came back. They want their silver.`,
      choices: [
        { t: "Ride south and collect it", check: { s: "intimidation", s2: "persuasion", d: 56 },
          win: { r: "The prince's steward pays it out in a courtyard full of guards, to be rid of you. You bring back a hundred and twenty suns and keep none of it.",
            fx: { honor: 6, fame: 2, deed: "Collected the dead riders' silver from a southern prince" } },
          lose: { r: "The steward has you thrown out of the courtyard, then out of the town, with a month in a lock-up in between.",
            fx: { prison: 1, why: "making a nuisance of yourself at a prince's gate", honor: 3 } } },
        { t: "Pay them from your own purse",
          r: "Sixty suns, counted onto a hide in front of the fire. The clan-mothers take it without thanks. The thanks come later, in the way they say your name.",
          fx: { coin: -60, honor: 5, trait: "generous" } },
        { t: "Tell them the silver was the dead riders' risk",
          r: "The clan-mothers leave your fire. Your herds are counted slower at the spring muster, and your kin are not asked to the summer games.",
          fx: { honor: -6, happy: -4, trait: "greedy" } },
      ],
    },

    // pp_orc_thardush: Hrok Whitehorn put you in his second wave at Thardush, waiting for the rye
    {
      id: "mpe_orc_thardush_oath",
      title: "The War-Mother's question",
      cond: (p, C) => C.realm(p, "POL-34") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "pp_orc_thardush") && A.S.year - p.flags.pp_orc_thardush >= 2 && fine("CHR-0333"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0333"); },
      text: p => `${Ago(p, "pp_orc_thardush")} ago you rode in {themFull}'s second wave at Thardush. The rye never came, and the Whitehorns went past the cairns. Now Drevna accuses the League of burning the Sevmir farms, and the War-Mother wants every Whitehorn rider to swear before her spear that they never crossed. {them} is asking each rider to swear. He is asking you.`,
      choices: [
        { t: "Swear for Hrok before the War-Mother",
          r: "You swear with your hand on the red rhino-horn. The War-Mother keeps her eyes on the horizon while you do it. Hrok sends you a Whitehorn saddle.",
          fx: { honor: -8, piety: -3, them: { type: "friend", op: 30 }, flag: "mpe_orc_thardush_oath" } },
        { t: "Tell the War-Mother what you saw",
          r: "You tell her: roofs burning east of Sevmir, and the second wave watering horses at the farm wells. She thanks you. Hrok's riders do not.",
          fx: { honor: 5, favor: 10, them: { type: "enemy", op: -50 }, newRel: { type: "enemy", op: -30 } } },
        { t: "Ride off before your turn to swear",
          r: "You are gone before the spear reaches your end of the line. Both sides notice the gap where you stood.",
          fx: { honor: -2, wil: 1, them: { op: -15 }, trait: "cautious" } },
      ],
    },
    // arc: mpe_orc_thardush_oath -> a Drevnan ferrywoman brings the witness to the League council
    {
      id: "mpe_orc_thardush_ferry",
      title: "The farm-boy's finger",
      cond: (p, C) => C.realm(p, "POL-34") && C.race(p, "orc", "halforc") && C.adult(p) && C.flag(p, "mpe_orc_thardush_oath") && A.S.year - p.flags.mpe_orc_thardush_oath >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const q = fine("CHR-0384") ? castP("CHR-0384") : null;
        if (q && q.alive && q.id !== p.id) ctx.pid = q.id;
        else make(p, ctx, { race: "halforc", realm: "POL-26", sex: "F", age: 30, occ: "a Drevnan ferrywoman" });
      },
      text: "{themFull}, a Drevnan ferrywoman, crosses to the League council at Grakmar with a witness she has hidden for years: a Sevmir farm-boy, grown now, who saw the Whitehorns at the farm wells. The council has him walk the line of riders who swore. His finger stops on you.",
      choices: [
        { t: "Hold to your oath", check: { s: "deception", s2: "wil", d: 58 },
          win: { r: "You say it again, flat: you never crossed. The farm-boy wavers. The council lets it lie, and you will see that finger in your sleep.",
            fx: { honor: -4, skill: { deception: 2 }, them: { op: -20 } } },
          lose: { r: "Your oath breaks in front of the War-Mother. She takes your horse and your place in the League's muster for five years.",
            fx: { honor: -12, favor: -15, gear: { mount: null }, them: { op: -10 }, deed: "Was struck from the League muster for a false oath" } } },
        { t: "Confess before the council",
          r: "You say it: you crossed, you saw, you swore falsely. The council fines the Whitehorns two thousand bushels. Hrok's riders put your name to their fires.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 4, favor: -4, them: { op: 20 } }), castFx(p, "CHR-0333", { them: { type: "enemy", op: -50 } })) },
        { t: "Ride for the Horde's fires before the council sits",
          r: "You are across the Gordush by nightfall and a guest of the Horde's fires for a season. When you come back, the council has judged without you.",
          fx: { honor: -6, happy: -8, deed: "Fled the League council at Grakmar" } },
      ],
    },

    // ================================================================== Giants (Frostholm POL-09, Hrimfell POL-23)

    // pp_gi_ragvik: you saw an Aldmark cog load tin at Ragvik cove by night, against the Tin Compact
    {
      id: "mpe_gi_ragvik_thing",
      title: "Ragvik at the Thing",
      cond: (p, C) => C.realm(p, "POL-09") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_ragvik") && A.S.year - p.flags.pp_gi_ragvik >= 2 && (rules("POL-09", "CHR-0075") || rules("POL-09", "CHR-0073")),
      w: 3, once: true,
      setup: (p, ctx) => { ctx.berg = rules("POL-09", "CHR-0073") ? 1 : 0; fig(p, ctx, ctx.berg ? "CHR-0073" : "CHR-0075"); },
      text: (p, ctx) => ctx.berg
        ? `{themFull} holds the chieftainship now. He damned Skarvi at the Thing for letting an Aldmark cog load tin at Ragvik. This summer his own cogs load tin for Kingsmere at Haugberg, by daylight, and he calls it a new compact. ${Ago(p, "pp_gi_ragvik")} ago you learned what loaded at Ragvik cove by night. You know the difference is the hour.`
        : `The Thing meets on the shore below Skarfell Hall, and {themFull} still holds the chieftainship. ${Ago(p, "pp_gi_ragvik")} ago you learned what happened at Ragvik cove: an Aldmark cog loading tin by night, against the Tin Compact. Bergthor of Haugberg's people are looking for a witness. Skarvi's people are looking for anyone who might be one.`,
      choices: [
        { t: "Stand up at the Thing and tell it", req: (p, C, ctx) => !ctx.berg,
          r: "You tell it slowly, as giants do, so every hall hears: the cove, the hour, the cog. Skarvi's face does not change. His son Arni's does.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 5, fame: 3, favor: -12, them: { type: "enemy", op: -40 } }), castFx(p, "CHR-0073", { them: { op: 25 } })) },
        { t: "Sell Skarvi your silence", req: (p, C, ctx) => !ctx.berg,
          r: "Arni brings the silver himself, in a sealskin bag. \"For the wool,\" he says. There was no wool.",
          fx: { coin: 40, honor: -6, them: { op: 20 }, flag: "mpe_gi_tin_bought" } },
        { t: "Say it at the Thing: same tin, different hour", req: (p, C, ctx) => !!ctx.berg, check: { s: "persuasion", s2: "wil", d: 54 },
          win: { r: "The small halls laugh first, then the big ones. Bergthor laughs last and loudest, and the new compact grows a clause about grain for every hall.",
            fx: { honor: 4, fame: 3, them: { op: -20 }, deed: "Made Bergthor's new compact feed every hall" } },
          lose: { r: "Bergthor booms over you, mocking the small halls in every second sentence. The big halls carry him. Your hall's tin is weighed last for three summers.",
            fx: { coin: -20, them: { type: "enemy", op: -30 } } } },
        { t: "Ask Bergthor for a share of the Kingsmere trade", req: (p, C, ctx) => !!ctx.berg,
          r: "He booms with laughter and gives you a tenth of the next cog. You are one of the big halls' giants now, in every second sentence.",
          fx: { coin: 40, honor: -3, them: { op: 15 }, flag: "mpe_gi_tin_bought" } },
      ],
    },
    // pp_gi_ragvik, later: Skarvi's son Arni knows you did not forget
    {
      id: "mpe_gi_ragvik_arni",
      title: "Skarvi's son",
      cond: (p, C) => C.realm(p, "POL-09") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_ragvik") && A.S.year - p.flags.pp_gi_ragvik >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "giant", sex: "M", given: "Arni", sur: "of Skarfell", age: 24, occ: "son of Skarvi the Younger" }); },
      text: p => `{themFull} rides up to your hall on a Northreach pony that sags under him. He is the one who told the Lindholm watch to forget the cog at Ragvik. He knows you did not forget, ${ago(p, "pp_gi_ragvik")} on. He has a proposal: a share of every cog that loads at Ragvik, for as long as you keep the cove out of the Thing.`,
      choices: [
        { t: "Take the share",
          r: "Silver every autumn, in a sealskin bag, with no message. Your hall eats better. You stop going to Ragvik, even for seals.",
          fx: { coin: 40, honor: -5, them: { op: 25 }, flag: "mpe_gi_tin_bought" } },
        { t: "Refuse him at your door",
          r: "He thanks you for the ale and rides down to the shore without looking back. The next Thing, your hall is seated nearer the wind.",
          fx: { honor: 3, them: { type: "enemy", op: -30 } } },
        { t: "Take the share, and tell Bergthor anyway", check: { s: "deception", s2: "intrigue", d: 56 },
          win: { r: "Arni's silver and Bergthor's gratitude, both in one autumn. You are careful never to stand between them at the Thing.",
            fx: (p, ctx) => join(eff(p, ctx, { coin: 40, honor: -4, skill: { intrigue: 2 }, flag: "mpe_gi_tin_bought" }), castFx(p, "CHR-0073", { them: { op: 20 } })) },
          lose: { r: "Bergthor's runner talks at Skarfell, as runners do. Arni sends the silver back with a seal's skull in the bag.",
            fx: { coin: 40, honor: -6, them: { type: "enemy", op: -50 } } } },
      ],
    },
    // arc: mpe_gi_tin_bought -> Northreach learns which halls took Kingsmere silver
    {
      id: "mpe_gi_tin_factor",
      title: "The Northreach scale",
      cond: (p, C) => C.realm(p, "POL-09") && C.race(p, "giant") && C.adult(p) && C.flag(p, "mpe_gi_tin_bought") && A.S.year - p.flags.mpe_gi_tin_bought >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-08", sex: "M", age: 50, occ: "the Northreach tin factor" }); },
      text: "{themFull}, the Northreach factor with the new scale and the old smile, comes up from the tin fair to your hall in person. Northreach has learned which halls took Kingsmere silver for tin. He will buy no more from yours, at any price, unless you give him something better than tin: names.",
      choices: [
        { t: "Give him the names",
          r: "Four halls and a chieftain's son, written in his book in a neat hand. Your tin is weighed first at the next fair. The halls you named are weighed not at all.",
          fx: { coin: 30, honor: -8, them: { op: 20 }, newRel: { type: "enemy", op: -35 } } },
        { t: "Refuse, and sell to Kingsmere alone",
          r: "One buyer, one price, one long sea road. Your hall learns what Kingsmere pays when it knows there is no one else.",
          fx: { coin: -20, honor: 1, trait: "stubborn", them: { op: -20 } } },
        { t: "Weigh his scale against your hall's beam, before witnesses", check: { s: "trade", s2: "int", d: 50 },
          win: { r: "His scale is light, as it was the first summer. In front of three halls he cannot afford to be choosy. He buys your tin by the beam's weight.",
            fx: { coin: 30, fame: 2, skill: { trade: 3 }, them: { op: -10 }, deed: "Caught the Northreach factor's light scale before three halls" } },
          lose: { r: "His scale is true this time. He smiles the old smile and closes his book.",
            fx: { coin: -10, happy: -3, them: { op: -15 } } } },
      ],
    },

    // pp_gi_bergthor: you promised your voice to Bergthor of Haugberg for the Thing of 1106
    {
      id: "mpe_gi_bergthor_voice",
      title: "The voice you promised",
      cond: (p, C) => C.realm(p, "POL-09") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_bergthor") && A.S.year - p.flags.pp_gi_bergthor >= 2 && fine("CHR-0073"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0073"); ctx.won = rules("POL-09", "CHR-0073") ? 1 : 0; },
      text: (p, ctx) => ctx.won
        ? `{themFull} holds the chieftainship, and he remembers the halls that promised early. ${Ago(p, "pp_gi_bergthor")} after your promise, his runner is back with a seal-fur robe and a request: Bergthor wants a giant he can trust to take the first Haugberg cog of tin across Whale Sound to Kingsmere, and bring back the grain.`
        : `{themFull} did not win the chieftainship, and the small Skarfells remember which halls promised him their voice ${ago(p, "pp_gi_bergthor")} ago. Your hall's tin is weighed last at the summer fair now. Bergthor's runner comes anyway, with mammoth wool, asking you to stand with him again.`,
      choices: [
        { t: "Take the cog across Whale Sound", req: (p, C, ctx) => !!ctx.won, check: { s: "sea", s2: "sta", d: 52 },
          win: { r: "Six days on a human cog built for smaller crews. The grain comes back dry, and Bergthor booms your name at the next Thing.",
            fx: { coin: 40, fame: 3, skill: { sea: 3 }, them: { op: 20 }, deed: "Took the first Haugberg tin cog to Kingsmere" } },
          lose: { r: "A squall off the capes, and a hold of wet grain. Bergthor blames the cog, then the crew, then you.",
            fx: { coin: 10, skill: { sea: 2 }, them: { op: -20 } } } },
        { t: "Ask for a seat at his hearth instead", req: (p, C, ctx) => !!ctx.won,
          r: "He gives you a place three seats from his own, which among giants is a speech. You hear every plan before the Thing does.",
          fx: { favor: 8, them: { type: "friend", op: 15 }, skill: { diplomacy: 2 } } },
        { t: "Stand with Bergthor again", req: (p, C, ctx) => !ctx.won,
          r: "You take the wool. Skarvi's people take note. Your hall's tin is weighed last again, and lighter.",
          fx: { favor: -10, honor: 2, coin: -10, them: { type: "friend", op: 25 } } },
        { t: "Make your peace with Skarvi", req: (p, C, ctx) => !ctx.won,
          r: "You go to Skarfell with walrus ivory and say plainly you were wrong. Skarvi teases you for an hour before he accepts, which is how you know he has.",
          fx: { favor: 10, honor: -2, them: { op: -25 } } },
      ],
    },

    // pp_gi_harpoonborne: you helped Solvei carry the Drevnan harpoon head to the Thing
    {
      id: "mpe_gi_harpoon_receipt",
      title: "The Northreach receipt",
      cond: (p, C) => C.realm(p, "POL-09", "POL-23") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_harpoonborne") && A.S.year - p.flags.pp_gi_harpoonborne >= 2 && fine("CHR-0079"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0079"); },
      text: p => `The raids began after the first frost, as everyone said they would, and the whaling grounds have been a war for ${ago(p, "pp_gi_harpoonborne")}. Now a Drevnan envoy stands before the Thing with a Northreach factor's receipt: the harpoon iron was sold to Northreach whalers, not thrown by Drevnans. If he is right, the war began on a mistake. You carried that iron to the Thing beside {themFull}.`,
      choices: [
        { t: "Say at the Thing that you believe the receipt",
          r: "You say it slowly, so the halls can follow: you carried the iron, and you may have carried a mistake. The Walking Halls walk out. The truce talks begin the next day.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: 5, fame: 2, them: { op: -20 } }), castFx(p, "CHR-0119", { them: { type: "enemy", op: -30 } })) },
        { t: "Call the receipt a forgery",
          r: "A Northreach receipt is easy to buy, you say, and the halls agree, because the war is already paid for. Solvei grips your arm on the way out.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: -3, them: { type: "friend", op: 20 } }), castFx(p, "CHR-0119", { them: { op: 20 } })) },
        { t: "Ask Solvei, before the halls, what she saw", check: { s: "diplomacy", s2: "ins", d: 50 },
          win: { r: "Solvei says it plainly: Drevnan iron, a Drevnan maker's mark, and she does not know whose hand threw it. The halls hear two honest giants, and decide to talk.",
            fx: { honor: 3, them: { op: 15 }, skill: { diplomacy: 2 }, deed: "Made the Thing hear both sides of the harpoon iron" } },
          lose: { r: "Solvei will not be questioned in front of the halls, and by you least of all.",
            fx: { happy: -3, them: { op: -25 } } } },
      ],
    },

    // pp_gi_dobinstone: you sank a Drevnan whaling boat inside the Truce of Dobin's line with a thrown stone
    {
      id: "mpe_gi_dobin_widow",
      title: "A whaler's widow",
      cond: (p, C) => C.realm(p, "POL-23") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_dobinstone") && A.S.year - p.flags.pp_gi_dobinstone >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-26", sex: "F", age: 34, occ: "a whaler's widow of Dobin" }); },
      text: p => `A Drevnan trading cog puts in below your hall, and a woman walks up the shore alone: {themFull}. Her husband was in the whaling boat your stone went through ${ago(p, "pp_gi_dobinstone")} ago, past the line of the Truce of Dobin. He did not swim as well as the others. She wants his blood-price, or she will lay the matter before the truce wardens at Dobin.`,
      choices: [
        { t: "Pay the blood-price in walrus ivory",
          r: "Ivory for a drowned man. She counts it twice, asks for the boat's worth as well, and you pay that too. She goes home on the cog with her back straight.",
          fx: { coin: -60, honor: 6, piety: 2, them: { op: 20 } } },
        { t: "Tell her the boat was inside your grounds",
          r: "She hears it out and says it back to you word for word, so she will have it right at Dobin. Torvald of Torholm hears of it and sends you ale.",
          fx: (p, ctx) => join(eff(p, ctx, { honor: -3, them: { type: "enemy", op: -40 } }), castFx(p, "CHR-0119", { them: { op: 10 } })) },
        { t: "Offer her a place in your hall's hunt", check: { s: "persuasion", s2: "ins", d: 54 },
          win: { r: "She hunts with your hall for a season, then two. She throws a harpoon better than her husband did. She never says she has forgiven you. She stays.",
            fx: { honor: 3, them: { type: "friend", op: 30 }, deed: "Took a drowned whaler's widow into your hall's hunt" } },
          lose: { r: "She looks at your hall, and at the giant who drowned her husband, and gets back on the cog.",
            fx: { them: { op: -10 } } } },
      ],
    },
    // pp_gi_dobinstone, later: Torvald of Torholm wants the stone-thrower in front of the raid on Dobin
    {
      id: "mpe_gi_dobin_walking",
      title: "The Walking Halls",
      cond: (p, C) => C.realm(p, "POL-23") && C.race(p, "giant") && C.adult(p) && !C.old(p) && C.flag(p, "pp_gi_dobinstone") && A.S.year - p.flags.pp_gi_dobinstone >= 3 && fine("CHR-0119"),
      w: 2, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0119"); },
      text: p => `{themFull}, who leads the Walking Halls, sent you a whale tooth ${ago(p, "pp_gi_dobinstone")} ago for a stone through a Drevnan hull. Now he wants the giant who threw it in front of the raid on Dobin after first frost. He walks the shore with you to ask. You notice he keeps his left knee stiff, and stops often to admire the sea.`,
      choices: [
        { t: "Walk with the Walking Halls to Dobin", check: { s: "throwing", s2: "str", d: 54 },
          win: { r: "Stones from the cliffs, then at the harbor chain, then at the whale-sheds. Dobin burns at its edges. Torvald gives you a second whale tooth, a big one.",
            fx: { fame: 4, honor: -2, them: { op: 25 }, deed: "Threw first in the raid on Dobin" } },
          lose: { r: "A Drevnan crossbow at the harbor chain. You walk home with the bolt still in your thigh.",
            fx: { wound: "arrow_wound", health: -14, them: { op: 15 }, cause: "a crossbow at Dobin" } } },
        { t: "Refuse: the truce feeds the halls",
          r: "Torvald laughs at kings on sledges and giants who count fish. You are in his mouth from then on, in both jokes.",
          fx: { honor: 3, them: { type: "rival", op: -25 } } },
        { t: "Ask him about his knee", check: { s: "intrigue", s2: "ins", d: 50 },
          win: { r: "He stops walking. \"Ask me that again,\" he says, \"and I will forget we spoke.\" He never asks you to Dobin. Walrus ivory comes to your hall every winter.",
            fx: { secret: 1, coin: 20, skill: { intrigue: 2 }, them: { op: -10 } } },
          lose: { r: "He laughs too loudly and walks faster, to prove a point. You hear the knee click at every step.",
            fx: { them: { type: "enemy", op: -30 } } } },
      ],
    },

    // pp_gi_hraldr: you carried the dying King Hraldr to shore and heard everything he said about the next king
    {
      id: "mpe_gi_hraldr_words",
      title: "What the king said",
      cond: (p, C) => C.realm(p, "POL-23") && C.race(p, "giant") && C.adult(p) && C.flag(p, "pp_gi_hraldr") && A.S.year - p.flags.pp_gi_hraldr >= 2 && rules("POL-23", "CHR-0122") && fine("CHR-0121"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0121"); },
      text: p => `King Hraldr still goes down to the shore on his sledge, slower each month, and the Thing will soon choose who follows him. {themFull}, his son, finds you on the ice. He knows you carried his father ${ago(p, "pp_gi_hraldr")} ago and heard him talk the whole way. "What did he say about the next king?" Hraldr said: a giant who can walk. Even over his own son.`,
      choices: [
        { t: "Tell {them} the truth, here, alone",
          r: "Ulfar leans on his whale-rib staff and says nothing for a long while. \"My knees,\" he says at last, as if you had asked. He goes back up the shore slower than he came.",
          fx: { honor: 4, them: { op: 10 }, wil: 1 } },
        { t: "Tell him his father named him",
          r: "Ulfar's face opens like a door. He embraces you, carefully, as a giant must. At the Thing he will say his father named him, and give your name as the witness.",
          fx: { honor: -8, them: { type: "friend", op: 30 }, flag: "mpe_gi_hraldr_lied" } },
        { t: "Say the king's words aloud at the Thing",
          r: "You say it slowly, so every hall hears: a giant who can walk, even over his own son. Ulfar's whale-rib staff cracks on the stones. The Walking Halls cheer.",
          fx: { honor: 5, fame: 3, them: { type: "enemy", op: -40 }, deed: "Spoke King Hraldr's last words about the crown at the Thing" } },
      ],
    },
    // arc: mpe_gi_hraldr_lied -> Ulfar's knees go as his father's did, and he wants the giant who carried his father
    {
      id: "mpe_gi_hraldr_sledge",
      title: "A sledge for the son",
      cond: (p, C) => C.realm(p, "POL-23") && C.race(p, "giant") && C.adult(p) && C.flag(p, "mpe_gi_hraldr_lied") && A.S.year - p.flags.mpe_gi_hraldr_lied >= 4 && fine("CHR-0121"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0121"); },
      text: p => `{themFull}'s knees have gone, as his father's did, and he is not yet forty-five. He goes down to the shore on a sledge now, dragged by human hunters. ${Ago(p, "mpe_gi_hraldr_lied")} ago you told him his father named him. He sends for you: he wants the giant who carried his father to pull his sledge.`,
      choices: [
        { t: "Pull his sledge to the shore",
          r: "He talks the whole way, as his father did, about the halls and the whaling grounds. Not once about who should be king. You remember every word anyway.",
          fx: { them: { op: 20 }, str: 0.3, deed: "Pulled Ulfar's sledge as you once carried his father" } },
        { t: "Tell him the truth now, on the ice",
          r: "He hears it from the sledge, and has the hunters turn it around. The next day his steward returns every gift you were ever given at Jotunhall.",
          fx: { honor: 6, them: { type: "enemy", op: -50 }, wil: 1 } },
        { t: "Send a human hunter in your place",
          r: "The hunter pulls well enough. Ulfar asks after you once, then stops asking.",
          fx: { coin: -10, them: { op: -20 } } },
      ],
    },
    // ================================================================== Half-elves

    // pp_he_westward: barred from owning your mother's hazel garden, you walked west to Eldergrove, where you are a citizen
    {
      id: "mpe_he_hazels",
      title: "The hazels",
      cond: (p, C) => C.realm(p, "POL-06", "POL-07") && C.race(p, "halfelf") && C.adult(p) && C.flag(p, "pp_he_westward") && A.S.year - p.flags.pp_he_westward >= 6,
      w: 3, once: true,
      text: p => `${Ago(p, "pp_he_westward")} ago you walked west to the sea-elves and left your mother's hazel gardens to your elven cousin. A bark-letter comes down from the Evenwood with a Keeper's knot. Your cousin has let the garden go to bramble, and by the old law an untended garden goes back to the forest at the next Leaf Fall. Kin may tend it to stop that. Kin may not own it.`,
      choices: [
        { t: "Walk back east and tend it",
          r: "You leave the coast with a pruning knife and a season's bread. The hazels remember the cuts you made forty years ago. Your cousin is relieved, frankly.",
          fx: { happy: 6, honor: 2, skill: { husbandry: 3 }, deed: "Went back east to tend your mother's hazels" } },
        { t: "Let the forest have it",
          r: "You write back one line: let it go to the trees. The hazels will outlive you anyway. You find you mind more than you thought you would.",
          fx: { happy: -6, wil: 1.5, trait: "stoic" } },
        { t: "Pay a forest tender, and never see it again",
          r: "Twenty-five suns a year to a Lirith widow with good shears. She sends a basket of hazelnuts every autumn, which is more than your cousin ever did.",
          fx: { coin: -25, happy: 2, newRel: { type: "friend", op: 20 } } },
      ],
    },

    // pp_he_thalion: you put your mark on the roll of half-elves sent to the Moot for Thalion Halfleaf
    {
      id: "mpe_he_thalion_butts",
      title: "At the butts",
      cond: (p, C) => C.realm(p, "POL-06", "POL-07", "POL-05", "POL-01") && C.race(p, "halfelf") && C.adult(p) && C.flag(p, "pp_he_thalion") && A.S.year - p.flags.pp_he_thalion >= 2 && fine("CHR-0283") && !rules("POL-06", "CHR-0283"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0283"); },
      text: p => `You put your mark on the roll for {themFull} ${ago(p, "pp_he_thalion")} ago, with thousands of other half-elves. Now he stands beside you at the archery butts: a slim half-elf with his father's green-stone ring, who looks thirty and is not. He thanks you for the mark. Then he asks you to take it back. "The Moot will set two kingdoms at each other over me," he says. "I would rather shoot."`,
      choices: [
        { t: "Withdraw your mark, for his sake",
          r: "You send word to the roll-keepers. A hundred others do the same within the month. Thalion shoots better that summer, people say.",
          fx: { them: { type: "friend", op: 30 }, honor: -1, happy: -2 } },
        { t: "Refuse: the mark was for every half-elf",
          r: "\"Then it is not about me,\" he says, and seems relieved by it. He puts three arrows in the gold and leaves you the fourth.",
          fx: { them: { op: 10 }, wil: 1.5, trait: "stubborn", flag: "mpe_he_roll_kept" } },
        { t: "Ask him to stand at Leaf Fall anyway", check: { s: "persuasion", s2: "ins", d: 58 },
          win: { r: "He is quiet through four arrows. \"Once,\" he says. \"I will stand once, so they have to refuse me to my face.\"",
            fx: { them: { op: 15 }, skill: { persuasion: 3 }, flag: "mpe_he_roll_kept", deed: "Persuaded Thalion Halfleaf to stand at Leaf Fall" } },
          lose: { r: "\"You want a banner,\" he says, \"and I am a bowman.\" He picks up his arrows and goes.",
            fx: { them: { op: -15 } } } },
      ],
    },
    // arc: mpe_he_roll_kept -> the roll is copied, and used against the names on it
    {
      id: "mpe_he_roll_named",
      title: "The roll, copied",
      cond: (p, C) => C.realm(p, "POL-06", "POL-07", "POL-05", "POL-01") && C.race(p, "halfelf") && C.adult(p) && C.flag(p, "mpe_he_roll_kept") && A.S.year - p.flags.mpe_he_roll_kept >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", realm: "POL-07", age: 40, occ: "a lawyer of Silverbough" }); },
      text: p => `The roll of half-elf marks did not stay with the Moot. A Keeper copied it, name by name, and for ${ago(p, "mpe_he_roll_kept")} Sylvaran has refused yew licences and grove-leases to every half-elf on the copy. Your name is on it. {themFull}, a sea-elf lawyer of Silverbough, is gathering the refused for a case before both crowns.`,
      choices: [
        { t: "Join the lawyer's case", check: { s: "learning", s2: "persuasion", d: 56 },
          win: { r: "A year of letters between two crowns, and the Veiled Queen raises it with Sylvaran's envoy herself. The licences come back. The copy is not burned.",
            fx: { fame: 3, honor: 3, them: { op: 20 }, deed: "Stood in the half-elves' case before two crowns" } },
          lose: { r: "The case is heard and dismissed, politely, in both kingdoms. {them} sends you the bill.",
            fx: { coin: -15, wil: 1.5, them: { op: 5 } } } },
        { t: "Ask the Keepers to strike your name",
          r: "They strike it with a single line. The line can be seen. Everyone who reads the copy will know which names were struck, and which were not.",
          fx: { honor: -3, happy: -2, unflag: "pp_he_thalion" } },
        { t: "Keep out of the Evenwood and say nothing",
          r: "You buy your yew from the coast, at coast prices, and keep your name where it is. It is cheaper than a lawyer, and costs more.",
          fx: { coin: -10, happy: -4, trait: "stoic" } },
      ],
    },

    // pp_he_share: you bought a ship-share in Eldergrove in front of a haughty Sylvaran trader
    {
      id: "mpe_he_share_ship",
      title: "The ship-house vote",
      cond: (p, C) => C.realm(p, "POL-07") && C.race(p, "halfelf") && C.adult(p) && C.flag(p, "pp_he_share") && A.S.year - p.flags.pp_he_share >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "elf", age: 40, occ: "shipmaster of the ship-house" }); },
      text: p => `${Ago(p, "pp_he_share")} ago you bought a ship-share at {home} in front of a haughty Sylvaran trader. Now {themFull}, shipmaster, calls the shareholders into the ship-house. Aldmark wants to buy the ship outright for its Cold Bay fleet, at twice her worth. The Sea-Archers want her as a deck. The shares vote, and the vote is close enough that yours counts.`,
      choices: [
        { t: "Vote to sell her to Aldmark",
          r: "She sails north under Aldmark colors, and your purse is heavy. Elandor the Steady's archers spit on the quay where you walk.",
          fx: (p, ctx) => join(eff(p, ctx, { coin: 70, honor: -3, them: { op: 10 }, unflag: "pp_he_share" }), castFx(p, "CHR-0275", { them: { op: -25 } })) },
        { t: "Vote to give her to the Sea-Archers",
          r: "The archers fit her with a fighting deck. Your share is worth nothing now, and the Sea-Archers' Yard knows your name.",
          fx: (p, ctx) => join(eff(p, ctx, { favor: 6, honor: 5, deed: "Voted your ship to the Sea-Archers' deck" }), castFx(p, "CHR-0275", { them: { type: "friend", op: 25 } })) },
        { t: "Sell your share to the Sylvaran trader",
          r: "The same trader, inland-pale and haughty, pays forty-five suns to vote in an Eldergrove ship-house. He votes for Aldmark. You laugh about it for a week.",
          fx: { coin: 45, unflag: "pp_he_share", trait: "witty" } },
      ],
    },

    // ================================================================== Half-orcs

    // pp_ho_seen: you rode for Uzka Twoblood's Seekers of the Rider, and they left a red cord on your saddle
    {
      id: "mpe_ho_cord_ride",
      title: "The red cord",
      cond: (p, C) => C.realm(p, "POL-34", "POL-12", "POL-11", "POL-26") && C.race(p, "halforc") && C.adult(p) && C.flag(p, "pp_ho_seen") && A.S.year - p.flags.pp_ho_seen >= 2 && fine("CHR-0339"),
      w: 3, once: true,
      setup: (p, ctx) => { fig(p, ctx, "CHR-0339"); },
      text: p => `The red cord the Seekers left on your saddle ${ago(p, "pp_ho_seen")} ago has faded to pink. {themFull} comes to your fire herself: tall, head shaved, a white cloth tied on her arm. Tarn Halfblood has not come east, and the drums have chosen no one. "Then we bring them a rider," she says. She wants you at the Tusk Great Ride on the twenty-first of June, under the cord, to be seen.`,
      choices: [
        { t: "Ride at the Great Ride under the cord",
          r: "Ten thousand riders and a hundred drums, and every eye on a half-orc with a pink cord on the saddle. The War-Mother will not look. Bolg the Drummer watches every stride.",
          fx: { fame: 5, favor: -10, them: { op: 30 }, flag: "mpe_ho_rider" } },
        { t: "Burn the cord in front of her",
          r: "The old cord catches slowly. Uzka watches it burn, then you. \"Then you are a doubter,\" she says. To her that is the same as an enemy.",
          fx: { wil: 1, trait: "humble", them: { type: "enemy", op: -40 } } },
        { t: "Ask again what they do with a false rider", check: { s: "intrigue", s2: "ins", d: 50 },
          win: { r: "\"Follow, or kill,\" she says, \"depending on what the rider wants, and what the drums say.\" You keep the cord and stay home. She does not insist, this year.",
            fx: { skill: { intrigue: 2 }, them: { op: -5 }, trait: "cautious" } },
          lose: { r: "She smiles. \"Why would there be a false rider?\" she says, and waits for you to answer.",
            fx: { them: { op: 5 }, wil: 0.5 } } },
      ],
    },
    // arc: mpe_ho_rider -> after the Great Ride, three hundred riders come to your fire
    {
      id: "mpe_ho_rider_fire",
      title: "Three hundred at your fire",
      cond: (p, C) => C.realm(p, "POL-34", "POL-12", "POL-11", "POL-26") && C.race(p, "halforc") && C.adult(p) && C.flag(p, "mpe_ho_rider") && A.S.year - p.flags.mpe_ho_rider >= 2,
      w: 3, once: true,
      text: p => `For ${ago(p, "mpe_ho_rider")} since the Great Ride, half-orcs have been riding to your fire: three hundred now, from four realms. They want you to lead them across the Gordush against Aldmark's License Law. Bolg the Drummer says the drums found no rider at the Great Ride. The Seekers say Bolg is wrong. If you are not the rider, the Seekers will decide what you are.`,
      choices: [
        { t: "Lead them across the Gordush", check: { s: "command", s2: "mounted", d: 58 },
          win: { r: "Three hundred riders cross at new moon and burn the license rolls in four villages. Aldmark writes your name on a proclamation. Half-orcs across the grass learn to say it.",
            fx: { fame: 6, honor: 2, favor: -15, deed: "Led three hundred half-orc riders across the Gordush" } },
          lose: { r: "An Aldmark column is waiting at the second ford. Half your riders get back across. You get back with a lance wound and a great many widows to visit.",
            fx: { wound: "scar_chest", health: -15, honor: -4, happy: -10, cause: "an Aldmark column at the Gordush" } } },
        { t: "Send them home: you are not the rider",
          r: "The riders go, muttering. One of the Seekers stays behind and asks to see if the drums were right about you, with a blade.",
          fx: { trait: "humble", duel: { tier: 2, title: "a Seeker of the Rider", opts: { kind: "duel", place: "the trampled ground by your fire", lethal: false, toYield: true, title: "False rider" } } } },
        { t: "Lead them east to the Khanate instead",
          r: "You take them east, out of everyone's prophecy. The Nine Winds khan hires three hundred half-orc riders gladly and asks no questions about cords.",
          fx: { coin: 40, honor: 1, lang: "Wind Rider", deed: "Led three hundred half-orc riders east to the Nine Winds" } },
      ],
    },
    // pp_ho_seen, later: a herder brings a sick child to the rider with the red cord
    {
      id: "mpe_ho_cord_child",
      title: "A hand on the child",
      cond: (p, C) => C.realm(p, "POL-34", "POL-12", "POL-11", "POL-26") && C.race(p, "halforc") && C.adult(p) && C.flag(p, "pp_ho_seen") && A.S.year - p.flags.pp_ho_seen >= 6,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "halforc", sex: "F", age: 26, occ: "a herder of the grass" }); },
      text: p => `{themFull}, a half-orc herder, has ridden two days to your fire with a feverish child in a sling. She has heard of the red cord the Seekers left on your saddle ${ago(p, "pp_ho_seen")} ago. The Seekers say the rider of two peoples will heal the grass. She does not ask whether you are the rider. She asks you to put your hand on the child.`,
      choices: [
        { t: "Put your hand on the child, and nurse it", check: { s: "medicine", s2: "ins", d: 50 },
          win: { r: "Willow bark, cold water and a night awake. The fever breaks at dawn. By the next new moon a dozen sick children are at your fire, and you know only a little about fevers.",
            fx: { piety: 3, fame: 3, skill: { medicine: 2 }, them: { type: "friend", op: 40 }, deed: "Broke a child's fever by the red cord's fire" } },
          lose: { r: "The child dies before dawn, under your hand. The mother thanks you for trying. The Seekers say it was a sign, and cannot agree of what.",
            fx: { happy: -10, wil: 2, them: { op: 10 } } } },
        { t: "Tell her you are not the rider",
          r: "She rides on to the healers at the War-Mother's camp. You never learn whether the child lived.",
          fx: { honor: 3, them: { op: -10 }, trait: "honest" } },
        { t: "Give her your horse for the healers' road", req: p => !!(p.gear && p.gear.mount),
          r: "Your best horse gets her to the healers at {capital} in a day instead of two. She sends the horse back with a boy, and a cheese.",
          fx: { honor: 4, them: { op: 25 }, trait: "generous" } },
      ],
    },

    // pp_ho_filed: you had a barber-surgeon file your tusks down so that people would stop staring
    {
      id: "mpe_ho_filed_child",
      title: "The barber's file, again",
      cond: (p, C) => C.race(p, "halforc") && C.adult(p) && C.hasKids(p) && !C.realm(p, "POL-11", "POL-34") && C.flag(p, "pp_ho_filed") && A.S.year - p.flags.pp_ho_filed >= 8 && !!kidOf(p, 8, 16),
      w: 3, once: true,
      setup: (p, ctx) => { const k = kidOf(p, 8, 16); if (k) ctx.pid = k.id; else ctx.skip = 1; },
      text: p => `{them} comes home from the market with a split lip. Some children called {themHim} tusk-face. {theyHe} has your jaw, and the tusks are coming in. The same barber-surgeon who filed yours ${ago(p, "pp_ho_filed")} ago has offered, kindly enough, to file {theirHis} too. {them} looks at your mouth and asks why your teeth are flat.`,
      choices: [
        { t: "Have {theirHis} tusks filed",
          r: "Half an hour and two suns. {them} does not cry until the walk home. The children at the market find someone else.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) k.looks = A.clamp(k.looks + 4, 1, 100); return eff(p, ctx, { coin: -2, them: { op: -15 } }); } },
        { t: "Tell {themHim} why you had yours filed",
          r: "You tell {themHim} all of it: the staring, the half hour, your tongue on the stumps ever since. {them} listens, and decides to keep {theirHis} teeth.",
          fx: { them: { op: 25 }, wil: 1, deed: "Told your child the truth about the barber's file" } },
        { t: "Have them capped in copper, as the Hearth Guard do", req: p => p.coin >= 6,
          r: "Two copper caps that shine when {theyHe} laughs. The market children stare for a different reason. {them} likes it, and so, to your surprise, do you.",
          fx: { coin: -6, happy: 3, them: { op: 20 }, trait: "proud" } },
      ],
    },
    // pp_ho_filed: an orc of the Horde names what you did in the horse market
    {
      id: "mpe_ho_filed_word",
      title: "Filed-tooth",
      cond: (p, C) => C.race(p, "halforc") && C.adult(p) && !C.realm(p, "POL-11", "POL-34") && C.flag(p, "pp_ho_filed") && A.S.year - p.flags.pp_ho_filed >= 4,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "orc", realm: "POL-11", sex: "M", age: 26, occ: "a horse-trader of the Horde" }); },
      text: p => `{themFull}, a horse-trader of the Horde, sits his horse in the {home} horse lines and studies your mouth. Then he says a word in the orc tongue that the town does not understand and you do: filed-tooth. It means a half-blood who filed down for the humans. You did, ${ago(p, "pp_ho_filed")} ago. He says it loud enough for every orc at the lines.`,
      choices: [
        { t: "Pull him off his horse", check: { s: "unarmed", s2: "str", d: 52 },
          win: { r: "He is heavier, and you are angrier. He gets up with a bloody mouth and, to your surprise, a laugh. \"Not so small,\" he says, and buys you a drink.",
            fx: { fame: 1, skill: { unarmed: 2 }, them: { type: "friend", op: 20 } } },
          lose: { r: "He is heavier, and orc-fast. You wake in the straw of the horse lines with a broken nose and the word still in your ears.",
            fx: { wound: "broken_nose", health: -8, them: { type: "enemy", op: -20 }, cause: "a Horde horse-trader's fists" } } },
        { t: "Answer him in the orc tongue", check: { s: "persuasion", s2: "wil", d: 48 },
          win: { r: "You tell him about the barber, the staring, the two suns. He hears you out. \"In the Horde you would be a rider,\" he says. \"Here you are a mouth.\" He means it kindly.",
            fx: { wil: 1, them: { op: 15 }, trait: "calm" } },
          lose: { r: "Your orc tongue is a child's. The horse lines laugh at your grammar, then at your teeth.",
            fx: { happy: -6, them: { op: -10 } } } },
        { t: "Walk away",
          r: "You walk away. The word walks with you as far as your door, and some nights further.",
          fx: { wil: 1.5, happy: -3 } },
      ],
    },

    // pp_ho_east: you went east with a Nine Winds horse-trader, where nobody looked twice at your tusks
    {
      id: "mpe_ho_east_rider",
      title: "A rider from the Nine Winds",
      cond: (p, C) => C.race(p, "halforc") && C.adult(p) && !C.realm(p, "POL-11", "POL-34", "POL-12") && C.flag(p, "pp_ho_east") && A.S.year - p.flags.pp_ho_east >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", realm: "POL-12", sex: "M", age: 22, occ: "a horse-trader of the Nine Winds" }); },
      text: p => `You rode east with a Nine Winds horse-trader ${ago(p, "pp_ho_east")} ago and learned to ride properly in a country that looked at your horse, not your tusks. Then you came back west. Now {themFull}, the trader's grandson, rides into {home} with three steppe horses and an offer: the Khan's yam wants riders who speak the western tongues. In the Khanate, people still look at the horse.`,
      choices: [
        { t: "Ride east with him for a season on the yam",
          r: "A season on the Salt Wind stages: a hundred miles a day, a silver tablet on a cord, and keepers who know your name by the third week. You come back west browner and slower to sit still.",
          fx: { coin: 40, skill: { riding: 3 }, them: { type: "friend", op: 25 }, deed: "Rode a season on the Nine Winds yam" } },
        { t: "Buy his three horses and stay", req: p => p.coin >= 40,
          r: "Three steppe horses, ugly and tireless, in a stable in {home}. Riding them, you remember a country where people look at the horse.",
          fx: { coin: -40, gear: { mount: "horse" }, skill: { riding: 2 }, them: { op: 10 } } },
        { t: "Tell him you belong here now",
          r: "He shrugs, the way his grandfather did, and sells the horses to a lord's steward. Your life here is harder than the yam, and it is yours.",
          fx: { wil: 1.5, them: { op: -5 }, trait: "stubborn" } },
      ],
    },
    // pp_ho_east, later: your Wind Rider tongue is wanted at a lord's table
    {
      id: "mpe_ho_east_tongue",
      title: "Between two tongues",
      cond: (p, C) => C.race(p, "halforc") && C.adult(p) && !C.realm(p, "POL-11", "POL-34", "POL-12") && C.flag(p, "pp_ho_east") && A.S.year - p.flags.pp_ho_east >= 6,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { race: "human", age: 45, occ: "a steward" }); },
      text: p => `A Nine Winds embassy has come to {home} to sell horse-archers for the lord's war, and the lord's interpreter is sick. You learned the Wind Rider tongue on the steppe ${ago(p, "pp_ho_east")} ago. {themFull}, the steward, offers twenty suns for a day standing between them. By mid-morning you understand that the horse-archers are wanted against the orc clans.`,
      choices: [
        { t: "Translate it faithfully, every word",
          r: "Every word, both ways. The lord buys six hundred horse-archers. The orcs of the border will meet them in spring, and you helped the bargain along.",
          fx: { coin: 20, honor: 2, happy: -4, skill: { diplomacy: 2 }, trait: "honest" } },
        { t: "Shade the price until the bargain fails", check: { s: "deception", s2: "int", d: 54 },
          win: { r: "A word here, a number there. By evening each side thinks the other insulting. The embassy rides home with its archers unsold.",
            fx: { coin: 20, honor: -3, skill: { deception: 3 }, deed: "Broke a horse-archer bargain in translation" } },
          lose: { r: "The Nine Winds envoy speaks some of the western tongue after all. He tells the lord what you did with his numbers.",
            fx: { honor: -6, them: { op: -20 }, prison: 1, why: "false interpreting before a lord" } } },
        { t: "Put down the cup and walk out at noon",
          r: "The steward finds a merchant who speaks some Wind Rider, badly. The bargain takes a week longer, and is made.",
          fx: { wil: 1, them: { type: "rival", op: -15 } } },
      ],
    },
  ]);
})();
