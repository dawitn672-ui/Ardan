// Childhood memories: callbacks for 27 flags the release sets in childhood and youth but never reads again.
// Every event reads its setter's flag in cond (C.flag + years since), recalls the original moment concretely,
// and poses a new decision. Some choices set an mch_ flag that a second event reads years later (2-step arcs).
// See README.md for the flag -> event table.
(function () {
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const num = n => (n >= 0 && n <= 20 ? NUM[n] : String(n));
  const since = (p, f) => Math.max(0, A.S.year - (+p.flags[f] || A.S.year));
  const adj = k => A.age(k) * 16 / GD.RACES[k.race].adult;
  const alive = id => { const k = id && A.P(id); return k && k.alive ? k : null; };
  // someone the engine linked to you in the year the memory was made
  const linkedIn = (p, types, year, test) => {
    const hit = A.relsOf(p, types).find(x => x.p.alive && x.r.since === year && (!test || test(x.p)));
    return hit ? hit.p : null;
  };
  const kidsAged = (p, lo, hi, sex) => (p.children || []).map(id => A.P(id))
    .filter(k => k && k.alive && (!sex || k.sex === sex) && adj(k) >= lo && adj(k) < hi);
  // a new person who fits the scene; o: { sex, ageAdj, race, realm, status, occ }
  const mk = (p, o) => {
    o = o || {};
    const race = o.race && GD.RACES[o.race] ? o.race : p.race, R = GD.RACES[race], realm = o.realm || p.realm;
    const sex = o.sex || (A.chance(0.5) ? "M" : "F"), status = o.status || "peasant";
    const cult = race === p.race && realm === p.realm ? p.cult : A.cultureFor(race, realm);
    const age = Math.max(1, Math.round((o.ageAdj != null ? o.ageAdj : A.C.ageAdj(p)) * R.adult / 16));
    const k = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm, cult, faith: A.faithFor(race, realm), born: A.S.year - age, status, home: p.home });
    const fn = A.familyName({ cult, realm, status, home: p.home, sex });
    k.sur = fn.sur; k.surMode = fn.mode;
    k.occ = o.occ || (A.isAdult(k) ? A.pick(A.OCC[status] || A.OCC.peasant) : "a child of " + A.provName(p.home));
    return k;
  };
  const kin = (p, types) => A.relsOf(p, types).map(x => x.p).find(k => k.alive && A.isAdult(k));
  const freeNow = p => { delete p.flags.unfree; if (p.status === "slave" || p.status === "serf") p.status = "peasant"; A.ach("freed"); A.willGrow(p, 2, "freedom"); };
  const fx = (p, ctx, o) => A.applyFx(p, o, ctx) || "";

  A.defEvents([
    // ---------------------------------------------------------------- ch_vow_freedom (ch_slave_sold)
    {
      id: "mch_vow_cart", title: "The same cart", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_vow_freedom") && A.S.year - p.flags.ch_vow_freedom >= 5 && C.adult(p) && C.unfree(p) && p.status === "slave",
      text: "When you were small, a cart left the yard with someone you loved roped in the back, and you swore under your breath that you would be free. Today you are put on the driver's bench of a cart like it. Behind you sits a girl of nine with rope on her wrists, sold to the mines. The road runs beside the marsh for six miles.",
      choices: [
        { t: "Cut her rope at the marsh and run", check: { s: "survival", s2: "stealth", d: 50 },
          win: { r: "You leave the cart in the reeds with the mule still grazing. Three nights of black water, then a charcoal-burner's hut where no one asks names. She holds your sleeve the whole way.",
            fx: p => { freeNow(p); p.flags.outlaw = A.S.year; p.flags.mch_cart_girl = A.S.year; return "(You are free, and hunted.)"; } },
          lose: { r: "The dogs find you both before the second mile. She goes to the mines as planned. You are flogged in the yard where you made your vow, and the whip is hung on a nail by your door.",
            fx: { health: -14, cause: "a flogging", wil: 2, trait: "vengeful" } } },
        { t: "Deliver her, and keep the household's trust", r: "You hand the rope to the mine factor and take his mark on a tally. Back at the house you are given the storeroom key. It is a step toward the gate, of a kind.",
          fx: { coin: 12, honor: -6, happy: -6, trait: "cynical" } },
        { t: "Sew your hidden coins into her hem", r: "Every coin you saved toward your price goes into the hem of her shift. She will not be free. She may eat when others do not, and she knows your name.",
          fx: { coinPct: -1, honor: 5, happy: 2, trait: "generous" } },
      ],
    },
    {
      id: "mch_cart_woman", title: "A rope scar", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_cart_girl") && A.S.year - p.flags.mch_cart_girl >= 10 && C.adult(p),
      setup: (p, ctx) => { const k = mk(p, { sex: "F", ageAdj: 9 + since(p, "mch_cart_girl") * 16 / GD.RACES[p.race].adult, occ: "a ferry-keeper's wife" }); ctx.pid = k.id; },
      text: "A woman catches your bridle on the road out of {home} and pushes back her sleeve. There is an old rope scar on her wrist. She is the girl you cut loose at the marsh, the night you left the cart in the reeds. Her name is {them} now. She keeps a ferry with her husband, and the mine's factor has found her. He says she is still property.",
      choices: [
        { t: "Swear before the magistrate that she was born free", check: { s: "deception", s2: "persuasion", d: 50 },
          win: { r: "You lie well, under oath, with a hand on the book. The factor has a bill of sale but no witness. {them} walks out of the hall on her husband's arm.",
            fx: { them: { type: "friend", op: 40, back: "friend" }, owed: 1, piety: -3 } },
          lose: { r: "The factor's clerk turns over an old notice with your description on it. You are out the back of the hall before he finishes reading. {them} is taken the same day.",
            fx: { them: { type: "friend", op: 15, back: "friend" }, happy: -10, wil: 2, honor: -2 } } },
        { t: "Pay the factor what he asks", req: p => p.coin >= 60, r: "Sixty suns, counted onto a ferry thwart. The factor writes a quittance in a bad hand, and you make him read it out twice before {them} lets him go.",
          fx: { coin: -60, them: { type: "bestfriend", op: 50, back: "bestfriend" }, honor: 3 } },
        { t: "Tell her to take the ferry downriver tonight", r: "She looks at the ferry, the house, the husband in the doorway. Then she nods. By morning the ferry is gone, with the family in it.",
          fx: { them: { type: "friend", op: 15, back: "friend" }, happy: -3 } },
      ],
    },
    {
      id: "mch_vow_kept", title: "Carts on the road", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_vow_freedom") && A.S.year - p.flags.ch_vow_freedom >= 8 && C.adult(p) && !p.flags.unfree,
      text: "A slaver's cart stops in {home} to water its mules. Three children sit roped together on the straw. You were a child in a yard like theirs. You watched a cart like this take someone you loved, and you swore to be free. You are free now. The slaver wants sixty suns for the smallest.",
      choices: [
        { t: "Pay sixty suns for the smallest", req: p => p.coin >= 60,
          r: "You count it out on the tailboard. The child is a boy of six who will not let go of your belt. You have a freedman's paper to keep safe now, and a mouth to feed.",
          fx: p => { p.coin -= 60; const k = mk(p, { sex: "M", ageAdj: 6, occ: "a freed child in your keeping" }); A.link(p, k, "student", 40, "mentor"); p.honor = A.clamp(p.honor + 4, 0, 100); return `(${k.given} is in your keeping now.)`; } },
        { t: "Cut their ropes after dark", check: { s: "stealth", s2: "spd", d: 50 },
          win: { r: "At the second watch you slit three ropes and point at the woods. By dawn the slaver is shouting at the constable, and the constable is shrugging.",
            fx: { honor: 5, happy: 6, wil: 1, deed: "Cut the ropes on a slaver's cart" } },
          lose: { r: "The slaver sleeps lighter than you hoped. His cudgel breaks your nose, and the constable fines you for meddling with lawful goods.",
            fx: { wound: "broken_nose", health: -8, cause: "a beating", coin: -10, honor: 3 } } },
        { t: "Water your horse and ride on", r: "You did not make the world. You only got out of one corner of it. At the crossroads the cart turns north, and you turn south.",
          fx: { happy: -4, wil: 1 } },
      ],
    },

    // ---------------------------------------------------------------- ch_secret_reader (ch_slave_letters)
    {
      id: "mch_reader_will", title: "The will on the table", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_secret_reader") && A.S.year - p.flags.ch_secret_reader >= 4 && C.adult(p) && C.unfree(p),
      setup: (p, ctx) => { const k = mk(p, { sex: "F", ageAdj: 42, status: "merchant", occ: "the wife of the house" }); ctx.pid = k.id; },
      text: "You learned your letters through a door left ajar, scratching them in the dirt and rubbing them out at dawn. Now the master of the house lies sick upstairs, and his will lies open on the study table while you sweep. Your name is in it. You go to his nephew, with the mule and the two copper pots.",
      choices: [
        { t: "Scratch out a line and write your own", check: { s: "deception", s2: "learning", d: 55 },
          win: { r: `Your hand shakes, then steadies. "And {name} I set free on my death." The ink matches. When the priest reads it out, the nephew can only stare.`,
            fx: (p, ctx) => { freeNow(p); return "(You are free.) " + fx(p, ctx, { secret: 1 }); } },
          lose: { r: "The nephew walks in as you blot the ink. The will goes in the fire, and your hand goes on the block. They take two fingers, so that you will not write again.",
            fx: { wound: "lost_fingers", health: -10, cause: "a punishment", wil: 2, happy: -10 } } },
        { t: "Read it aloud to his wife", r: "She cannot read. When you finish she sits very still, then sends for a lawyer. She does not thank you. She does not forget either.",
          fx: { them: { type: "friend", op: 25, back: "friend" }, owed: 1, honor: 2 } },
        { t: "Learn it by heart and say nothing", r: "Every clause, every legacy, every debt. A slave who knows the will knows which heirs to smile at, and which to avoid on the stairs.",
          fx: { skill: { intrigue: 3 }, secret: 1, int: 0.3 } },
      ],
    },
    {
      id: "mch_reader_window", title: "A door left ajar", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_secret_reader") && A.S.year - p.flags.ch_secret_reader >= 8 && C.adult(p) && !p.flags.unfree,
      text: "The house beside yours keeps slaves. At dusk a thin boy sweeps its yard and stops at your window to watch you write. You learned the same way: through a door the tutor never quite shut, letters scratched in the dirt and rubbed out at dawn. Teaching a slave letters is against the law here. The fine is thirty suns.",
      choices: [
        { t: "Leave the shutter open, and write slowly", r: "Every evening you write the alphabet large, as if for yourself. By winter the boy is scratching words on the yard wall with a nail.",
          fx: { honor: 3, flag: "mch_taught_slave" } },
        { t: "Teach him properly, at night", check: { s: "stealth", s2: "learning", d: 45 },
          win: { r: "Two winters of candle-ends and a slate hidden in the woodpile. By spring he reads better than you did at his age.",
            fx: { honor: 5, trait: "kind", flag: "mch_taught_slave" } },
          lose: { r: "His owner finds the slate. You pay thirty suns at the magistrate's table, and the boy is sold to the coast before the month is out.",
            fx: { coin: -30, happy: -8, honor: 2, trait: "vengeful" } } },
        { t: "Close the shutter", r: "You remember what a beating costs. The boy stops coming after a week.", fx: { happy: -2, wil: 0.5 } },
      ],
    },
    {
      id: "mch_slave_letter", title: "A careful hand", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_taught_slave") && A.S.year - p.flags.mch_taught_slave >= 8 && C.adult(p) && C.literate(p),
      setup: (p, ctx) => { const k = mk(p, { sex: "M", ageAdj: 9 + since(p, "mch_taught_slave") * 16 / GD.RACES[p.race].adult, status: "artisan", occ: "a wool merchant's clerk" }); ctx.pid = k.id; },
      text: "A letter comes, folded small and sealed with candle wax. The hand is careful and a little too round. It is {them}, the boy who learned his letters at your window. A wool merchant who needed a clerk bought him free. Now he has found that the merchant's ledgers cheat the tax-farmer, and he asks what an honest man does.",
      choices: [
        { t: "Write back: keep the post, and keep quiet", r: "You write that a freedman with a clerk's post has more to lose than most. He does as you say. His letters come every midwinter after that, shorter each year.",
          fx: { them: { type: "friend", op: 10, back: "friend" }, wil: 0.5 } },
        { t: "Write back: copy the ledgers and bring them to you", check: { s: "persuasion", s2: "intrigue", d: 50 },
          win: { r: "You carry the copies to the tax-farmer yourself. The merchant pays a fine that would buy a ship, and {them} is taken on as a clerk of the revenue.",
            fx: { them: { type: "bestfriend", op: 40, back: "bestfriend" }, honor: 3, coin: 20 } },
          lose: { r: "The merchant has friends in the revenue. The copies vanish, {them} is turned out without a reference, and your name goes on a list somewhere.",
            fx: { them: { type: "friend", op: 20, back: "friend" }, honor: 2, happy: -5 } } },
        { t: "Burn the letter unanswered", r: "It burns slowly, being good paper. You learned to read through a door, and you know what a letter can cost the one who writes it.",
          fx: { happy: -3, them: { type: "acquaint", op: -10, back: "acquaint" } } },
      ],
    },

    // ---------------------------------------------------------------- ch_hates_lord (ch_serf_bailiff)
    {
      id: "mch_bailiff_ford", title: "The bailiff at the ford", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_hates_lord") && A.S.year - p.flags.ch_hates_lord >= 8 && C.adult(p) && C.poor(p),
      text: "The bailiff who took your family's beast is old now. His horse slips on the ford ice below the mill and throws him, and he lies in the shallows with a leg bent wrong. You remember his face from the yard, and your mother in the door with her arms folded. His saddlebag has burst. The rent tallies for the whole manor are floating beside him.",
      choices: [
        { t: "Pull him out", r: "He is heavy, then furious, then grateful. He does not know you. At the next rent day your family's arrears are quietly forgotten.",
          fx: { honor: 4, family: 4, trait: "forgiving", wil: 1 } },
        { t: "Push the tallies under the ice", check: { s: "stealth", s2: "spd", d: 40 },
          win: { r: "The notched sticks go under one by one. Without them no steward alive can say who owes what. The whole manor pays half rent that year.",
            fx: { flag: "mch_tallies_drowned", happy: 6, honor: -2, trait: "vengeful" } },
          lose: { r: "He sees you with the sticks in your arms, and this time he remembers your face. By spring your family's strips are given to a cousin of his.",
            fx: { family: -10, happy: -8, wil: 2, trait: "vengeful" } } },
        { t: "Walk on, and let the cold decide", r: "You hear him calling all the way up the hill. The miller finds him at dawn, alive, and the leg comes off at the knee. You feel less than you expected.",
          fx: { honor: -4, wil: 1.5, trait: "cruel" } },
      ],
    },
    {
      id: "mch_tally_reckoning", title: "Rents without tallies", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_tallies_drowned") && A.S.year - p.flags.mch_tallies_drowned >= 3 && C.adult(p),
      setup: (p, ctx) => { const k = mk(p, { sex: "M", ageAdj: A.C.ageAdj(p) + 8, status: p.status === "serf" ? "serf" : "peasant", occ: "a neighbor with six children and a dead cow" }); ctx.pid = k.id; },
      text: "A new steward has come to reckon the rents without tallies. He goes door to door with a clerk and pays a sun for every name. Three winters ago you pushed the old tallies under the ford ice, and the manor has kept your secret. Now {them}, who has six children and a dead cow, is watching the steward's purse.",
      choices: [
        { t: "Pay {them} more than the steward does", r: "Two suns and a ham. {them} takes them without meeting your eye. The steward leaves with a list that is mostly guesses.",
          fx: { coin: -12, them: { type: "acquaint", op: 10, back: "acquaint" }, wil: 0.5 } },
        { t: "Go to the steward first and confess", r: "You confess to the sticks, and only you. Three days in the stocks and a year's earnings in fines. The manor brings you bread in the stocks, every day.",
          fx: { coin: -20, health: -6, cause: "the stocks", honor: 6, fame: 2, deed: "Took the blame for the drowned rent tallies" } },
        { t: "Name {them} before {theyHe} names you", r: "The steward believes the man with fewer children. {them} loses his strips. Your neighbors stop speaking to you at the well.",
          fx: { honor: -10, trait: "deceitful", them: { type: "enemy", op: -50, back: "enemy" } } },
      ],
    },
    {
      id: "mch_lord_mill", title: "The mill on the manor", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_hates_lord") && A.S.year - p.flags.ch_hates_lord >= 12 && C.adult(p) && C.rich(p) && p.coin >= 250,
      setup: (p, ctx) => { ctx.lw = p.realm === "POL-27" ? "the abbot" : p.realm === "POL-11" || p.realm === "POL-34" ? "the clan-mothers" : "the lord"; },
      text: "A steward comes to you, cap in hand. He serves {lw} whose bailiff once rode into your family's yard and took the beast. The manor is short of coin. It wants two hundred suns against its mill, the mill every serf on the manor must pay to grind at. You remember the bailiff on his horse, and your mother in the door.",
      choices: [
        { t: "Lend it, with the mill as surety", r: "Your clerk writes the terms tight: two years, then the mill is yours. The steward signs without reading closely. He has never been poor.",
          fx: { coin: -200, flag: "mch_holds_mill" } },
        { t: "Lend it free, and tell him whose child you are", r: "He goes pale, then red. You let him carry the purse home and tell {lw} where it came from. Your old neighbors hear of it by the next market.",
          fx: { coin: -200, honor: 6, fame: 2, happy: 4 } },
        { t: "Refuse, and let the manor sink", r: "The steward bows himself out. Within two years the manor is sold to a wool merchant from the city, who raises every rent.",
          fx: { happy: 3, honor: -2 } },
      ],
    },
    {
      id: "mch_mill_toll", title: "The toll", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_holds_mill") && A.S.year - p.flags.mch_holds_mill >= 2 && C.adult(p),
      text: "The manor cannot pay. By the terms you wrote, the mill on the manor where you were born is yours: wheel, stones and toll. Every serf there must grind here and pay what you set. The miller stands in your hall with flour in his beard and asks what the toll will be.",
      choices: [
        { t: "One sack in twenty, the old rate", r: "The coin comes in steadily at every harvest. The serfs grind and pay, and look at you no differently than at the last owner.",
          fx: { coin: 60, deed: "Took the mill of the manor where they were born" } },
        { t: "One sack in forty, and say why", r: "Half the old toll. The serfs bring you a cheese at midsummer. The new lord of the manor calls you a troublemaker in three halls.",
          fx: { coin: 25, honor: 5, fame: 2, deed: "Halved the mill toll on the manor where they were born" } },
        { t: "Sell the mill back at twice the loan", r: "The steward signs this time with great care, and reads every line twice. The manor keeps its mill. You keep the profit.",
          fx: { coin: 400, honor: -2 } },
      ],
    },

    // ---------------------------------------------------------------- ch_page (ch_gent_page)
    {
      id: "mch_page_fellow", title: "A fellow page", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_page") && A.S.year - p.flags.ch_page >= 10 && C.adult(p),
      setup: (p, ctx) => {
        const k = linkedIn(p, ["friend", "bestfriend", "comrade", "rival", "acquaint"], p.flags.ch_page) || mk(p, { status: "gentry", occ: "a household knight" });
        ctx.pid = k.id;
      },
      text: "{them} served at table beside you in the household where you were sent as a page. You carved capons together, carried messages, bowed to bishops and fought with sticks in the stable yard. Now {theyHe} is accused of stealing a silver ewer from that same household, and the steward has written to ask what you know of {theirHis} character.",
      choices: [
        { t: "Swear to {theirHis} good name", check: { s: "persuasion", s2: "etiquette", d: 45 },
          win: { r: "Your oath and your manners carry the hall. {them} is cleared. {theyHe} never tells you whether {theyHe} took it, and you never ask.",
            fx: { them: { type: "bestfriend", op: 30, back: "bestfriend" }, owed: 1 } },
          lose: { r: "Your word is not enough. {them} loses the post and is branded. Your name is joined to a thief's in every hall you knew as a child.",
            fx: { them: { type: "friend", op: 20, back: "friend" }, honor: -5 } } },
        { t: "Say only what you saw, nothing more", r: "You write three careful lines. They help no one and hurt no one. {them} is dismissed, and stops writing to you.",
          fx: { honor: 2, them: { op: -15 } } },
        { t: "Do not answer", r: "The letter lies on your table until the matter is settled without you. {them} hears that you did not answer.",
          fx: { them: { op: -30 }, happy: -2 } },
      ],
    },
    {
      id: "mch_page_child", title: "Into service", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_page") && A.S.year - p.flags.ch_page >= 15 && C.adult(p) && C.hasKids(p) && (C.noble(p) || p.status === "gentry"),
      setup: (p, ctx) => { const k = kidsAged(p, 6.5, 11)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.ageW = num(A.age(k)); },
      text: "{them} is {ageW}, the age you were when you rode off to serve in another household and learn manners and arms. You remember the first night, the capons, the other children of good family. Two places are offered. One is in a great house. The other is with your oldest rival, who means it as a token of peace.",
      choices: [
        { t: "Send {themHim} to the great house", r: "{them} rides off without looking back, as you did. The letters home are full of hawks and a bishop's dog.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) { A.trainSkill(k, "etiquette", 4); A.trainSkill(k, "riding", 2); } return fx(p, ctx, { them: { op: -5 }, fame: 1 }); } },
        { t: "Send {themHim} to your rival, as a pledge of peace", r: "Your rival meets {them} at the gate in person. The quarrel between your houses goes quiet. {them} writes home less than you would like.",
          fx: { houseOp: 4, honor: 2, them: { op: -10 } } },
        { t: "Keep {themHim} at home another year", r: "{them} learns rents and drainage at your elbow, as you never did. Your peers think you soft.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.trainSkill(k, "stewardship", 3); return fx(p, ctx, { them: { op: 12 }, happy: 3 }); } },
      ],
    },

    // ---------------------------------------------------------------- ch_betrothed (ch_nob_betrothal)
    {
      id: "mch_betrothal_due", title: "The contract", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_betrothed") && A.S.year - p.flags.ch_betrothed >= 6 && C.adult(p) && !C.married(p) && !C.hasRel(p, "betrothed") && C.noble(p),
      setup: (p, ctx) => { const k = A.makeLoveInterest(p); k.status = "gentry"; k.occ = "heir to a border manor"; ctx.pid = k.id; },
      text: "Your betrothal was settled over supper when you were small: land, a border, an old feud mended. The child you were promised to died of a winter fever. The contract did not. The house now offers {themFull}, {themOcc}, and your family expects an answer before the border lords hear of it.",
      choices: [
        { t: "Honor the contract", r: "The seals are renewed on the next quarter day. {them} sends you a stiff, correct letter, and you send one back in the same style.",
          fx: { them: { type: "betrothed", op: 20, back: "betrothed" }, houseOp: 3, honor: 3 } },
        { t: "Break it, and pay the forfeit", r: "The forfeit is heavy and paid in silver. Your family says little at supper for a month. On the border, men start carrying spears to market again.",
          fx: { coinPct: -0.25, honor: -6, happy: 4, flag: "mch_broke_match" } },
        { t: "Ask to meet {themHim} first", check: { s: "etiquette", s2: "diplomacy", d: 40 },
          win: { r: "A walk in an orchard, two chaperones behind. {them} is dry and quick and does not pretend. You find you want the contract after all.",
            fx: { them: { type: "betrothed", op: 35, back: "betrothed" }, happy: 6 } },
          lose: { r: "The house takes the request as an insult. The meeting is cold. The contract stands, and {them} has decided not to like you.",
            fx: { them: { type: "betrothed", op: -10, back: "betrothed" }, honor: -2 } } },
      ],
    },
    {
      id: "mch_feud_wakes", title: "The border again", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_broke_match") && A.S.year - p.flags.mch_broke_match >= 3 && C.adult(p),
      text: "The feud your betrothal was meant to end has woken. Men of that house have burned a mill on your family's border and hanged the miller's boy from his own sluice gate. Your kin look at you over supper the way your parents once talked over you. You were the mending, and you broke it.",
      choices: [
        { t: "Ride out and burn one of theirs", r: "You burn a barn and a granary and bring back three of their horses. The border is loud with it all summer. The singers like you better than the priests do.",
          fx: { fame: 3, honor: -4, trait: "wrathful", houseOp: -3 } },
        { t: "Offer yourself to that house after all", r: "Their price is high, and their heir is not the one you were promised. You sign. The spears go back in the rafters.",
          fx: { newRel: { type: "betrothed", op: 10 }, happy: -6, honor: 4, houseOp: 4 } },
        { t: "Pay the blood-price for the miller's boy", r: "You pay it into the miller's hands, not the lord's. He takes it. It is not peace, but no one else hangs that year.",
          fx: { coinPct: -0.15, honor: 3, wil: 1 } },
      ],
    },

    // ---------------------------------------------------------------- ch_hostage (ch_roy_hostage)
    {
      id: "mch_ward_table", title: "The far end of the table", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_hostage") && A.S.year - p.flags.ch_hostage >= 8 && C.adult(p) && C.noble(p),
      setup: (p, ctx) => {
        const own = p.ruler || p.realm, rid = A.enemyRealmOf(own) || (A.realm(own) && A.realm(own).rivals || [])[0];
        if (!rid || !A.realm(rid) || rid === own) { ctx.skip = 1; return; }
        const rr = A.realm(rid).race, k = mk(p, { ageAdj: 9, status: "noble", realm: rid, race: GD.RACES[rr] ? rr : p.race, occ: "a pledge from " + A.realmShort(rid) });
        ctx.rid = rid; ctx.pid = k.id; ctx.ageW = num(A.age(k));
      },
      text: "A pledge arrives at court from {other}: {them}, {ageW} years old, with one servant and a box of clothes too fine for the road. {theyHe} sits at the far end of the table and does not eat. You sat at a table like that once, at a court where your life was the price of your family's word.",
      choices: [
        { t: "Sit beside {themHim} at supper", r: "You pass the salt and talk about horses. By midwinter {them} follows you round the stables. Pledges remember who sat with them.",
          fx: { them: { type: "friend", op: 35, back: "friend" }, happy: 3, realmRel: 3 } },
        { t: "Teach {themHim} how to survive it", r: "Smile at men who would kill you on an order. Sleep anyway. Learn the corridors. {them} listens with a face far too old for {theirHis} years.",
          fx: { them: { type: "student", op: 25, back: "mentor" }, wil: 1, skill: { intrigue: 1 } } },
        { t: "Keep your distance. Pledges die", r: "You know how it ends when a peace breaks. You keep the child at arm's length and tell yourself it is a kindness.",
          fx: { wil: 1, trait: "cautious", them: { type: "acquaint", op: -5, back: "acquaint" } } },
      ],
    },
    {
      id: "mch_pledge_own", title: "A pledge of your own", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_hostage") && A.S.year - p.flags.ch_hostage >= 10 && C.ruler(p) && C.hasKids(p),
      setup: (p, ctx) => {
        const r = A.realm(p.ruler), rid = r && (A.enemyRealmOf(r.id) || (r.rivals || [])[0]), k = kidsAged(p, 5, 15)[0];
        if (!rid || !A.realm(rid) || !k) { ctx.skip = 1; return; }
        ctx.rid = rid; ctx.pid = k.id; ctx.ageW = num(A.age(k));
      },
      text: "{other} will sign a peace if you send a pledge, and they name {them}, who is {ageW}. You were that pledge once. You remember the ride to a foreign court, the smiles of men who would kill you on an order, and the nights you slept anyway. Your council says the peace is worth it.",
      choices: [
        { t: "Send {themHim}", r: "You ride with {them} as far as the border stone and no further. {theyHe} does not cry until the carriage turns. You can see it from the hill.",
          fx: (p, ctx) => { p.flags.mch_sent_pledge = A.S.year; p.flags.mch_pledge_who = ctx.pid; return fx(p, ctx, { realmRel: 15, stability: 3, them: { op: -10 } }); } },
        { t: "Send a cousin's child in {theirHis} place", r: "{other} accepts the cousin with poor grace. The cousin's mother will not look at you in chapel.",
          fx: { realmRel: 6, houseOp: -3, honor: -3 } },
        { t: "Refuse. No child of yours goes", r: "The envoy leaves before the feast. {them} hears why, and comes to find you in the evening without being sent.",
          fx: { realmRel: -10, them: { op: 15 }, stability: -2 } },
      ],
    },
    {
      id: "mch_pledge_home", title: "Home from the foreign court", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_sent_pledge") && A.S.year - p.flags.mch_sent_pledge >= 3,
      setup: (p, ctx) => { const k = alive(p.flags.mch_pledge_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "mch_sent_pledge")); },
      text: "{them} comes home after {yrsW} years as a pledge. {theyHe} bows like a courtier, eats with {theirHis} eyes on the door, and calls you by your title. You came home like that once. {theyHe} has also come home knowing which of their lords hate their ruler, and which of their walls are cracked.",
      choices: [
        { t: "Give {themHim} time, and a horse of {theirHis} own", r: "You ask nothing. In the second month {them} rides out alone and comes back laughing. In the third, {theyHe} calls you by name.",
          fx: { them: { op: 20 }, happy: 4 } },
        { t: "Have {themHim} tell your marshal what {theyHe} saw", r: "{them} talks for two days and your clerks fill a book. It is good knowledge. {theyHe} does not look at you while giving it.",
          fx: (p, ctx) => { const r = A.realm(p.ruler), e = r && A.enemyRealmOf(r.id); if (e) ctx.rid = e; return fx(p, ctx, { them: { op: -10 }, armyXp: 5, claim: 1 }); } },
        { t: "Ask {themHim} to forgive you", r: "{theyHe} says there is nothing to forgive, in the voice you once used to say the same. It takes a year to become true.",
          fx: { them: { op: 25 }, wil: 1, honor: 2 } },
      ],
    },

    // ---------------------------------------------------------------- ch_poison_enemy (ch_roy_poison)
    {
      id: "mch_poison_cook", title: "The cook's confession", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_poison_enemy") && A.S.year - p.flags.ch_poison_enemy >= 8 && C.adult(p) && C.noble(p),
      setup: (p, ctx) => { const k = kin(p, ["uncle", "cousin", "inlaw", "councillor"]) || mk(p, { status: "noble", ageAdj: A.C.ageAdj(p) + 20, occ: "a lord of the council" }); ctx.pid = k.id; },
      text: "An old kitchen woman is dying, and she asks for you by name. When you were a child your taster fell retching at table, and every trail you followed went cold. She says she carried that dish up herself. She says she knows who paid for it: {themFull}, who still kisses your cheek at feasts.",
      choices: [
        { t: "Accuse {themHim} before the court", check: { s: "intrigue", s2: "persuasion", d: 55 },
          win: { r: "The cook's word, a steward's ledger and a goldsmith who talks. {them} leaves court in a closed carriage. Your old taster's family is sent a purse.",
            fx: { them: { type: "enemy", op: -60, back: "enemy" }, fame: 3, deed: "Unmasked the poisoner of their childhood" } },
          lose: { r: "A dying cook against a lord of the blood. {them} laughs it off in public, and now {theyHe} knows that you know.",
            fx: { them: { type: "enemy", op: -40, back: "enemy" }, honor: -2, trait: "paranoid" } } },
        { t: "Say nothing, and keep the name", r: "You thank her and close her eyes. At the next feast {them} kisses your cheek, and you kiss back.",
          fx: (p, ctx) => { p.flags.mch_poisoner_named = A.S.year; p.flags.mch_poisoner_who = ctx.pid; return fx(p, ctx, { secret: 1, skill: { intrigue: 2 } }); } },
        { t: "Double your tasters, and watch {themHim}", r: "Two tasters now, and a boy who sleeps across your door. {them} notices, smiles at it, and sends you a cake at midwinter.",
          fx: { trait: "paranoid", skill: { intrigue: 3 }, coin: -20 } },
      ],
    },
    {
      id: "mch_poison_lever", title: "Alone in the chapel", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_poisoner_named") && A.S.year - p.flags.mch_poisoner_named >= 4 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_poisoner_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "mch_poisoner_named")); },
      text: "{themFull} has risen: a council seat, a hall full of clients, a hand in every appointment. For {yrsW} years you have kept a dying cook's words about a poisoned dish and a taster on the floor. Tonight {theyHe} is alone in the chapel, praying, with {theirHis} guards outside the door.",
      choices: [
        { t: "Tell {themHim} what you know, and name your price", r: `{theyHe} hears you out without turning round. When you finish, {theyHe} says, "What do you want?" The answer takes the rest of the night.`,
          fx: { owed: 2, them: { type: "enemy", op: -30, back: "enemy" }, honor: -4, skill: { intrigue: 2 } } },
        { t: "Forgive {themHim}, out loud, here", r: "{theyHe} goes very still at your first words. By the last {theyHe} is weeping. Shame or relief, you cannot tell. You walk out lighter.",
          fx: { trait: "forgiving", piety: 5, them: { op: 30 }, happy: 4 } },
        { t: "Take the cook's account to the throne", req: p => !p.ruler, check: { s: "persuasion", s2: "intrigue", d: 55 },
          win: { r: "The account is old, but the goldsmith is still alive. {them} loses the council seat and goes home to {theirHis} estates under guard.",
            fx: { them: { type: "enemy", op: -60, back: "enemy" }, rulerOp: 10, fame: 2 } },
          lose: { r: "{them} has the ruler's ear and you have a dead cook. You are thanked for your concern and not invited to council again.",
            fx: { them: { type: "enemy", op: -50, back: "enemy" }, rulerOp: -10 } } },
      ],
    },

    // ---------------------------------------------------------------- ch_first_love (ch_teen_crush)
    {
      id: "mch_first_gift", title: "The thing you gave", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_first_love") && A.S.year - p.flags.ch_first_love >= 8 && C.adult(p) && !C.old(p),
      setup: (p, ctx) => {
        const want = p.flags.likes || (p.sex === "M" ? "F" : "M");
        const k = linkedIn(p, ["friend", "bestfriend", "lover", "acquaint", "rival", "ex"], p.flags.ch_first_love, x => x.sex === want);
        if (!k || k.id === p.spouse) { ctx.skip = 1; return; }
        ctx.pid = k.id;
      },
      text: "{them} is back in {home} for a burial. You were barely grown when you took the long way round to pass {theirHis} door, and gave {themHim} a small gift, and {theyHe} smiled and kept it. At the graveside {theyHe} opens a hand to show you. {theyHe} has it still.",
      choices: [
        { t: "Walk {themHim} home the long way", r: "You talk until the lamps are lit, about the dead and then about the living. You arrange to meet again at the next market.",
          fx: (p, ctx) => { p.flags.mch_old_flame = A.S.year; p.flags.mch_flame_who = ctx.pid; return fx(p, ctx, { them: { type: "lover", op: 25, back: "lover" }, happy: 8, honor: A.C.married(p) ? -4 : 0 }); } },
        { t: "Tell {themHim} it was a good gift, and go", r: "{theyHe} closes the hand and nods. You both have lives now. It is a clean ache, and you are proud of it on the ride home.",
          fx: { them: { op: 10 }, wil: 1, happy: -1 } },
        { t: "Pretend you do not remember it", r: "{theyHe} sees through it and lets you keep the lie. {theyHe} leaves {home} the next morning without saying goodbye.",
          fx: { them: { op: -15 }, wil: 1.5, trait: "stoic" } },
      ],
    },
    {
      id: "mch_old_flame", title: "The long way home", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_old_flame") && A.S.year - p.flags.mch_old_flame >= 2 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_flame_who); if (!k || k.id === p.spouse) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: (p) => A.C.married(p)
        ? "Two years of market days, and the long way home after, past the door where you once left a small gift. Today {them} asks you to choose. {spouse} has started asking where the afternoons go."
        : "Two years of market days, and the long way home after, past the door where you once left a small gift. Today {them} asks you to choose: marry, or end it. {theirHis} family has found someone steadier.",
      choices: [
        { t: "Choose {themHim}, whatever it costs",
          r: (p) => A.C.married(p) ? "You stop hiding it. Your house goes cold and loud by turns. {them} is waiting at the crossroads every market day." : "{them} says yes before you finish asking. The families argue for a month and then begin to haggle.",
          fx: (p, ctx) => fx(p, ctx, A.C.married(p) ? { them: { type: "lover", op: 25 }, honor: -8, rel: { who: "spouse", op: -40 }, happy: 6 } : { them: { type: "betrothed", op: 30, back: "betrothed" }, happy: 10 }) },
        { t: "End it, kindly", r: "There is nothing to give back. {them} keeps the small gift. You hear later that {theyHe} has it still.",
          fx: { them: { type: "friend", op: -20, back: "friend" }, happy: -6, wil: 1.5 } },
        { t: "Keep it secret a while longer", r: "Another season of market days. {them} stops asking, which is worse.",
          fx: { secret: 1, happy: 3, honor: -2, them: { op: -5 } } },
      ],
    },
    {
      id: "mch_first_love_child", title: "Two coppers", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_first_love") && A.S.year - p.flags.ch_first_love >= 15 && C.adult(p) && C.hasKids(p),
      setup: (p, ctx) => { const k = kidsAged(p, 12.5, 16)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} has started taking the long way round to pass a certain door. You know the look. At about that age you did the same, and gave a small gift, and it was kept. Your stomach still remembers. Today {them} asks you for two coppers and will not say what for.",
      choices: [
        { t: "Give {themHim} the coppers, and one piece of advice", r: "You tell {themHim} to choose something that lasts. {them} buys a ribbon anyway. It goes well, as far as you are told.",
          fx: { them: { op: 15 }, coin: -1, happy: 2 } },
        { t: "Tell {themHim} your own story", r: "{them} groans at first, then listens. You did not know you still remembered the smell of that afternoon.",
          fx: { them: { op: 20 }, happy: 4, wil: 0.5 } },
        { t: "Refuse. That family is trouble", r: "{them} takes the long way round anyway. Now you are in the story too, as the obstacle.",
          fx: { them: { op: -20 }, wil: 1 } },
      ],
    },

    // ---------------------------------------------------------------- ch_kept_toy (ch_ill_playmate)
    {
      id: "mch_toy_chest", title: "At the bottom of the chest", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_kept_toy") && A.S.year - p.flags.ch_kept_toy >= 10 && C.adult(p),
      setup: (p, ctx) => { const k = mk(p, { sex: "F", ageAdj: Math.min(A.C.ageAdj(p) + 26, 70), occ: "an old neighbor from your childhood lane" }); ctx.pid = k.id; },
      text: "At the bottom of a chest you find the toy you picked up in the lane the day after your playmate died. You had raced each other the day before. Then there was a small grave. The child's mother, {them}, still lives at the end of that lane, bent over a stick now. She never knew you kept it.",
      choices: [
        { t: "Take it to her", r: "She holds it against her cheek and does not speak for a while. Then she asks you to stay for supper. You come every feast day after.",
          fx: { them: { type: "friend", op: 35, back: "friend" }, happy: 3, honor: 2, piety: 2 } },
        { t: "Give it to your own child", req: (p, C) => C.hasKids(p), r: "Your child takes it without ceremony and carries it everywhere. You hear the old name from the lane given to the toy.",
          fx: { flag: "mch_toy_passed", happy: 3 } },
        { t: "Bury it in the small grave", r: "You dig with your hands at dusk, where the turf is shortest. It is the first time you have said the name aloud in years.",
          fx: { piety: 3, wil: 1, happy: 4 } },
      ],
    },
    {
      id: "mch_toy_lost", title: "In the ditches", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_toy_passed") && A.S.year - p.flags.mch_toy_passed >= 3 && C.adult(p) && C.hasKids(p),
      setup: (p, ctx) => { const k = kidsAged(p, 3, 14)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} has lost the toy you gave {themHim}, the one from the lane that belonged to a playmate who died before you were grown. {theyHe} has searched the ditches all day and will not come in to supper. {theyHe} knows it was not only a toy, but not why.",
      choices: [
        { t: "Search with {themHim} by lantern", check: { s: "ins", s2: "tracking", d: 40 },
          win: { r: "You find it in the nettles by the stile, past midnight. {them} falls asleep on your shoulder on the way home, holding it.", fx: { them: { op: 20 }, happy: 5 } },
          lose: { r: "You search until the lantern gutters. It is gone. {them} cries, and you find you are crying too, for both of them.", fx: { them: { op: 15 }, happy: -4, wil: 1 } } },
        { t: "Tell {themHim} whose it was", r: "You tell {themHim} about the race in the lane and the small grave. {them} listens with great care, then asks to be taken to see it.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.addTrait(k, "kind"); return fx(p, ctx, { them: { op: 12 }, piety: 2 }); } },
        { t: "Tell {themHim} it was only a toy", r: "{them} stops searching and comes in. Later you go out alone with a lantern and look for an hour.",
          fx: { them: { op: -8 }, wil: 1 } },
      ],
    },

    // ---------------------------------------------------------------- ch_short_friend (ch_elf_human_friend)
    {
      id: "mch_elf_wedding", title: "A human wedding", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_short_friend") && A.S.year - p.flags.ch_short_friend >= 12 && C.race(p, "elf"),
      text: "Your friend from the farm beyond the Oak Line is getting married. When you met at the edge of the trees you looked the same age. Now your friend has rough hands and a sweetheart from the next valley, and you still look like a child. The invitation came with a farm boy who called you little one. The elders say this is how elves learn to grieve.",
      choices: [
        { t: "Go, and dance at the wedding", r: "The humans stare, then forget to. You dance with the bride's grandmother, who is younger than you. Your friend cries at the gate when you leave.",
          fx: { happy: 6, wil: 1, flag: "mch_elf_wedding", trait: "gregarious" } },
        { t: "Send a bow you made yourself", r: "A yew bow, waxed and strung, carried by the farm boy. Word comes back that it hangs over the hearth and has never been fired.",
          fx: { skill: { craft: 2, bow: 1 }, flag: "mch_elf_wedding", happy: 2 } },
        { t: "Stay under the trees, as the elders say", r: "You sit on a branch above the Oak Line and listen to the music across the fields until dawn. You do not go down.",
          fx: { trait: "patient", happy: -5, wil: 1.5 } },
      ],
    },
    {
      id: "mch_elf_friend_child", title: "Your friend's face", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_elf_wedding") && A.S.year - p.flags.mch_elf_wedding >= 8 && C.race(p, "elf"),
      setup: (p, ctx) => { const k = mk(p, { race: "human", ageAdj: 8, occ: "a farm child from beyond the Oak Line" }); ctx.pid = k.id; },
      text: "A human child of eight comes to the edge of the Oak Line and calls out. {theyHe} has your friend's face exactly, the face you met at these trees when you were both small. \"You came to the wedding,\" {theyHe} says. \"You are the elf in the stories. Show me the forest.\" Behind you an elder clears her throat.",
      choices: [
        { t: "Show {themHim} the forest", r: "All summer you teach {them} to walk without a sound and read deer sign. {theyHe} learns faster than any elf child, and goes home every evening.",
          fx: { them: { type: "friend", op: 35, back: "friend" }, happy: 6, skill: { survival: 1 } } },
        { t: "Send {themHim} home before dark", r: "You walk {them} back to the stile and watch {themHim} run across the fields. It is easier than the other thing.",
          fx: { wil: 1, them: { type: "acquaint", op: 5, back: "acquaint" } } },
        { t: "Tell {themHim} what happens to friends of elves", r: "You tell {themHim} the truth: you will still be young at {theirHis} grave. {them} thinks it over and says that is fine, {theyHe} will visit yours first.",
          fx: { them: { type: "friend", op: 15, back: "friend" }, wil: 1.5, trait: "honest" } },
      ],
    },

    // ---------------------------------------------------------------- ch_own_tree (ch_halfelf_tree)
    {
      id: "mch_tree_pond", title: "Your crooked name", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_own_tree") && A.S.year - p.flags.ch_own_tree >= 8 && C.race(p, "halfelf") && (C.adult(p) || C.teen(p)),
      text: "The oak you planted where no one owned the ground is taller than you now. Your crooked name is still in its bark, stretched wide by the growing. This spring a reeve has staked the land for a new mill-pond. The tree stands where the water will be.",
      choices: [
        { t: "Dig it up and move it", check: { s: "husbandry", s2: "sta", d: 45 },
          win: { r: "Three days, a borrowed cart, a ball of roots wrapped in sacking. You plant it again on the slope above the new pond. It sulks for a year, then leafs.",
            fx: { flag: "mch_tree_kept", wil: 1, happy: 5 } },
          lose: { r: "The taproot snaps a yard down. You plant it anyway on the slope above the pond. By midsummer the leaves are brown.",
            fx: { happy: -8, wil: 2 } } },
        { t: "Ask the elves to name it a birth tree", check: { s: "diplomacy", s2: "faith", d: 55 },
          win: { r: "An elder walks out from the Oak Line at dusk and sings over it. No mill-pond will drown a named tree. It is the first one named for a half-elf in living memory.",
            fx: { flag: "mch_tree_kept", happy: 10, fame: 2, deed: "Had a birth tree named for a half-elf" } },
          lose: { r: `"A tree is named at birth," the elders say, "and you were born." The water comes up in autumn.`,
            fx: { happy: -6, trait: "wrathful" } } },
        { t: "Let the water have it", r: "You cut your name out of the bark with a knife and keep the piece. The rest goes under in autumn.",
          fx: { wil: 1.5, trait: "stoic" } },
      ],
    },
    {
      id: "mch_tree_acorn", title: "The first acorns", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_tree_kept") && A.S.year - p.flags.mch_tree_kept >= 6 && C.adult(p),
      text: "Your oak above the pond has acorns this year for the first time. Under it a half-elf child from the village is crying, because another child said today what you were told once: no tree in the forest, no grave inside the Oak Line. The child has not seen you yet.",
      choices: [
        { t: "Give the child the first acorn", r: "You press it into a muddy hand and show where to plant it. The child runs off to dig and forgets to say goodbye.",
          fx: { happy: 5, honor: 3, trait: "kind" } },
        { t: "Show the child your name in the bark", r: "The child traces the crooked letters, then asks whether you were sad. You say yes. That seems to help more than anything else would have.",
          fx: { happy: 3, wil: 1, piety: 1 } },
        { t: "Leave the child to it", r: "Some things have to be found alone. You found this one alone. You walk on, and do not feel good about it.",
          fx: { wil: 1, happy: -2 } },
      ],
    },

    // ---------------------------------------------------------------- ch_named (ch_dwarf_namecarving)
    {
      id: "mch_name_flaw", title: "The flaw in the stone", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_named") && A.S.year - p.flags.ch_named >= 10 && C.race(p, "dwarf") && C.adult(p) && p.deeds.some(d => /flaw noted/.test(d.t)),
      text: "In the hall of the Law-Carvers your full name stands in the stone, and beside it, smaller, the flaw they found in your masterwork at thirty. Apprentices read it aloud as they pass. Under the old law a flaw may be struck out once, if the same hands make the same work again before the same Eldest Carver. The Eldest is very old now.",
      choices: [
        { t: "Make the work again", check: { s: "craft", s2: "wil", d: 55 },
          win: { r: "The Eldest turns it in the lamplight, then hands the chisel to an apprentice. The flaw comes out of the stone in four strokes.",
            fx: { honor: 6, fame: 2, happy: 8, deed: "Had the flaw struck from the name-stone" } },
          lose: { r: "A second flaw, smaller than the first. It is noted beside the first one. The apprentices have something new to read aloud.",
            fx: { honor: -4, wil: 2, happy: -8, deed: "Had a second flaw noted at the name-stone" } } },
        { t: "Leave it. It is true", r: "You stop to read it yourself sometimes, the way you would touch an old scar. Younger dwarves notice that you do not mind.",
          fx: { wil: 2, trait: "humble", honor: 1 } },
        { t: "Pay a carver to smooth it at night", check: { s: "intrigue", s2: "deception", d: 50 },
          win: { r: "In the morning the stone is clean and the carver is richer. You find you look at the clean place more often than you ever looked at the flaw.",
            fx: { coin: -60, trait: "deceitful", happy: 3 } },
          lose: { r: "The carver is caught with the chisel in his hand, and names you. The Law-Carvers strike your whole name from the stone.",
            fx: { coin: -60, honor: -20, fame: -3, deed: "Had their name struck from the stone" } } },
      ],
    },
    {
      id: "mch_name_apprentice", title: "No master", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_named") && A.S.year - p.flags.ch_named >= 12 && C.race(p, "dwarf") && C.adult(p),
      setup: (p, ctx) => { const k = mk(p, { race: "dwarf", ageAdj: 10, status: p.status === "slave" ? "artisan" : p.status, occ: "an apprentice without a master" }); ctx.pid = k.id; },
      text: "A young dwarf, {them}, waits at your door with a bag of tools and no master. The old one died in a gas pocket last winter, and without a master no apprentice may stand before the Law-Carvers at thirty. You remember standing there yourself with your work in your hands, waiting for the Eldest to nod.",
      choices: [
        { t: "Take {themHim} as your apprentice", r: "{them} sleeps in your workshop loft and burns everything for a month. By midsummer {theyHe} can temper a blade without being told twice.",
          fx: { them: { type: "student", op: 30, back: "mentor" }, flag: "mch_dwarf_apprentice", skill: { craft: 1 } } },
        { t: "Find {themHim} a better master", r: "You walk {them} to the best workshop in the hold and vouch for {themHim}. {theyHe} thanks you properly, and you see little of {themHim} after.",
          fx: { them: { type: "acquaint", op: 15, back: "acquaint" }, skill: { diplomacy: 1 }, honor: 2 } },
        { t: "Send {themHim} away", r: "You have work of your own. {them} goes on to the next door, and the next.",
          fx: { them: { type: "acquaint", op: -20, back: "acquaint" } } },
      ],
    },
    {
      id: "mch_apprentice_carving", title: "Behind the apprentice", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_dwarf_apprentice") && A.S.year - p.flags.mch_dwarf_apprentice >= 11 && C.race(p, "dwarf"),
      setup: (p, ctx) => { const k = linkedIn(p, ["student", "friend", "bestfriend"], p.flags.mch_dwarf_apprentice, x => x.race === "dwarf"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} stands before the Law-Carvers with {theirHis} masterwork, and you stand behind {themHim}, as your own master once stood behind you. The Eldest turns the work in the lamplight. There is a flaw near the hilt. You can see it from here. So can {them}.",
      choices: [
        { t: "Speak: the flaw is your teaching, not {theirHis} hand", r: "The hall goes quiet. The Eldest notes the flaw beside your name, not {theirHis}. {them} does not speak to you for a day, then cannot stop.",
          fx: { them: { type: "bestfriend", op: 35, back: "bestfriend" }, honor: 4, fame: -1 } },
        { t: "Say nothing. The stone must be true", r: "The flaw is noted beside {theirHis} name. {them} carries it, as you carried yours, and you think {theyHe} will be better for it.",
          fx: { them: { op: -5 }, trait: "just", wil: 1 } },
        { t: "Point it out before the Eldest does", r: "The Eldest nods at you, not at {them}. Your honesty is noted. So is the look on {them}'s face.",
          fx: { them: { op: -25 }, honor: 5 } },
      ],
    },

    // ---------------------------------------------------------------- ch_seaboy (ch_greyhaven_sea)
    {
      id: "mch_seaboy_son", title: "Ten years old", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_seaboy") && A.S.year - p.flags.ch_seaboy >= 12 && C.adult(p) && C.hasKids(p) && C.realm(p, "POL-14"),
      setup: (p, ctx) => { const k = kidsAged(p, 9.5, 12.5, "M")[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} is ten. Greyhaven boys go to sea at ten, and a berth has been found on a herring boat. You went at ten yourself: the bread, the knife and the wool cap your mother packed, two days sick, then the rigging in a gale. {them} was sick on the ferry twice this summer.",
      choices: [
        { t: "Pack the bread, the knife and the cap", r: "He goes up the plank without looking back, as you did. The boat clears the harbor mouth on the ebb.",
          fx: (p, ctx) => { p.flags.mch_son_at_sea = A.S.year; p.flags.mch_son_sea_who = ctx.pid; return fx(p, ctx, { them: { op: 5 }, happy: -2 }); } },
        { t: "Keep him home. Let them call him landsman", r: "The neighbors call him a landsman, and you a soft one. He learns the plough. Every evening he watches the boats from the headland.",
          fx: { them: { op: 10 }, fame: -1, honor: -1 } },
        { t: "Sign on with him for his first season", r: "You take a berth on the same boat. He is sick for two days, then never again, and you pretend not to watch him on the yard.",
          fx: { them: { op: 25 }, skill: { sea: 2 }, coin: -10, happy: 5 } },
      ],
    },
    {
      id: "mch_son_returns", title: "The whaler's offer", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_son_at_sea") && A.S.year - p.flags.mch_son_at_sea >= 3,
      setup: (p, ctx) => { const k = alive(p.flags.mch_son_sea_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} comes ashore brown and broad, with tar under his nails and a sailor's roll to his walk. The skipper says he climbs like a cat. Now he wants to sign on a whaler out of the northern ports for three years. The whalers pay well. They lose one boat in five.",
      choices: [
        { t: "Let him go north", r: "He sails in spring. His letters, when they come, smell of oil and smoke. He is a man in them before he is one at home.",
          fx: { them: { op: 15 }, happy: -4, wil: 1 } },
        { t: "Forbid it", r: "He stays. He does not forgive you for two years. The whaler he would have shipped on comes home short a boat.",
          fx: { them: { op: -20 }, happy: 2 } },
        { t: "Buy a herring boat for him to skipper", req: p => p.coin >= 80, r: "A herring boat in your name, his to skipper. He grumbles about whales for a year, then stops.",
          fx: { coin: -80, them: { op: 20 }, asset: "fishboat" } },
      ],
    },

    // ---------------------------------------------------------------- ch_ring / ch_ring_failed (ch_tidewell_ring)
    {
      id: "mch_ring_lords", title: "The ring on its cord", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_ring") && A.S.year - p.flags.ch_ring >= 10 && C.adult(p) && !C.ruler(p) && C.realm(p, "POL-14"),
      setup: (p, ctx) => { const r = A.realm(p.realm), h = r && alive(r.heir); if (!h || h.id === p.id) { ctx.skip = 1; return; } ctx.pid = h.id; },
      text: "You still wear the Tidewell ring on its cord, the silver you brought up from black water at seven while the whole court watched from the jetty. {themFull}, the heir, came up empty at that age, and by the old law can never be crowned. The king is coughing blood. Tonight three lords come to your rooms to say the obvious thing out loud.",
      choices: [
        { t: "Hear them out, and promise nothing", r: "You listen to the end and promise nothing. In the morning all three send gifts, and {them} stops speaking to you in the hall.",
          fx: { secret: 1, skill: { intrigue: 2 }, honor: -3, them: { type: "rival", op: -30, back: "rival" } } },
        { t: "Send them away, and tell the king", r: "The king hears you out between coughs. He thanks you and has the three lords watched. Two of them never forgive you.",
          fx: { rulerOp: 15, honor: 5, them: { op: 15 } } },
        { t: "Give the ring back to the sea", r: "You row out at dawn and drop it where you found it. The court argues about it for a season. {them} sends you a cask of wine and a note in {theirHis} own hand.",
          fx: { honor: 4, fame: 3, wil: 2, deed: "Gave the Tidewell ring back to the sea", them: { type: "friend", op: 30, back: "friend" } } },
      ],
    },
    {
      id: "mch_ring_jetty", title: "The jetty again", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_ring_failed") && A.S.year - p.flags.ch_ring_failed >= 12 && C.adult(p) && C.hasKids(p) && (C.realm(p, "POL-14") || C.blood(p, "deeplung")),
      setup: (p, ctx) => { const k = kidsAged(p, 6.3, 8.8)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} is seven. Tomorrow {theyHe} dives for the Tidewell ring off the jetty where you came up empty, while the whole court watched and went silent. {them} has been practicing in the harbor with a stone tied to {theirHis} belt. {theirHis} lips are blue, and {theyHe} will not stop.",
      choices: [
        { t: "Teach {themHim} the trick of the breath", check: { s: "sea", s2: "sta", d: 45 },
          win: { r: "Slow breaths, then one deep, then down. Next morning {them} comes up with silver in {theirHis} fist, into a roar you never heard for yourself.",
            fx: { them: { op: 25 }, happy: 10, fame: 2, deed: "Taught a child to bring up the Tidewell ring" } },
          lose: { r: "{them} comes up empty and choking, as you did. You are first down the jetty steps with a blanket. {theyHe} remembers that, later.",
            fx: { them: { op: 20 }, happy: -6, wil: 1 } } },
        { t: "Tell {themHim} what failing costs, and what it does not", r: "You tell {themHim}: no crown, ever. And no crown is not nothing. {them} dives anyway, as you knew {theyHe} would.",
          fx: { them: { op: 15 }, wil: 1, trait: "honest" } },
        { t: "Keep {themHim} off the jetty", r: "You will not let {themHim} dive. It is the bravest thing anyone has seen, or the most cowardly. The court argues about it, as it argued about you.",
          fx: { them: { op: -10 }, trait: "stubborn", fame: 1 } },
      ],
    },
    {
      id: "mch_ring_unringed", title: "The naming", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_ring_failed") && A.S.year - p.flags.ch_ring_failed >= 10 && C.adult(p) && C.noble(p) && !C.ruler(p) && C.realm(p, "POL-14"),
      setup: (p, ctx) => { const k = mk(p, { status: "noble", ageAdj: Math.max(16, A.C.ageAdj(p) - 6), occ: "a cousin who wears the Tidewell ring" }); ctx.pid = k.id; },
      text: "Because you came up empty at seven, you can never be crowned. The jetty went silent before you were dry, and the court has been a little quiet around you since. Now your cousin {them}, who wears the ring, is to be named heir and wants you standing close at the naming. Some of your friends think you should stand in the way.",
      choices: [
        { t: "Stand at {theirHis} side", r: "You stand at the right hand in the chapel while the court watches your face for any flicker. There is none. Afterwards {them} grips your arm.",
          fx: { them: { type: "friend", op: 30, back: "friend" }, honor: 5, rulerOp: 5 } },
        { t: "Stand in the way", check: { s: "intrigue", s2: "persuasion", d: 60 },
          win: { r: "A missing witness, a delayed letter, a bishop with a cough. The naming is put off a year. {them} knows exactly whom to thank.",
            fx: { them: { type: "rival", op: -40, back: "rival" }, secret: 1, skill: { intrigue: 3 } } },
          lose: { r: "Your friends lose their nerve at the last moment. {them} is named heir, and your part in it is common talk by supper.",
            fx: { them: { type: "enemy", op: -50, back: "enemy" }, honor: -8, rulerOp: -10 } } },
        { t: "Leave court for the sea", r: "You take a berth on a cog under another name. Sailors do not ask about jetties. They find a name for you anyway.",
          fx: { skill: { sea: 3 }, happy: 4, epithet: "the Unringed" } },
      ],
    },

    // ---------------------------------------------------------------- ch_arsenic (ch_ranavir_arsenic)
    {
      id: "mch_arsenic_cup", title: "Metal and garlic", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_arsenic") && A.S.year - p.flags.ch_arsenic >= 10 && C.adult(p) && (C.realm(p, "POL-30") || C.blood(p, "unpoisoned")),
      setup: (p, ctx) => { const k = kin(p, ["cousin", "uncle", "sibling", "inlaw"]) || mk(p, { status: p.status === "royal" ? "noble" : p.status, occ: "a cousin with ambitions" }); ctx.pid = k.id; },
      text: "At a feast in {capital} your wine has a faint taste of metal and garlic. You know it. You have known it since the physician's spoon at five: a few grains of white in milk, a little more every month, your grandmother nodding. Across the table {them} is watching you over the rim of {theirHis} own cup.",
      choices: [
        { t: "Drink it down and smile at {themHim}", r: "Your stomach knots. You do not let it show. You raise the empty cup to {them}, who leaves before the sweets.",
          fx: (p, ctx) => fx(p, ctx, { health: A.hasBlood(p, "unpoisoned") ? -2 : -12, cause: "arsenic", fame: 3, them: { type: "rival", op: -20, back: "rival" } }) },
        { t: "Pass the cup to {them}, with a toast", check: { s: "intrigue", s2: "wil", d: 50 },
          win: { r: "{them} goes grey and will not drink, in front of everyone. By morning half of {capital} knows why.",
            fx: { them: { type: "enemy", op: -50, back: "enemy" }, fame: 2, deed: "Turned a poisoned cup back on its sender" } },
          lose: { r: "{them} drinks it, smiling. Either it was never poisoned, or {theyHe} had a physician's spoon at five as well.",
            fx: { them: { op: -10 }, happy: -3, trait: "paranoid" } } },
        { t: "Spill it quietly, and say nothing", r: "A sleeve, a tilt, a dark stain on the cloth. {them} sees it and looks away first. Neither of you mentions it again, which is its own kind of treaty.",
          fx: { secret: 1, skill: { intrigue: 2 }, wil: 1 } },
      ],
    },
    {
      id: "mch_arsenic_spoon", title: "The spoon of milk", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_arsenic") && A.S.year - p.flags.ch_arsenic >= 15 && C.adult(p) && C.hasKids(p) && (C.realm(p, "POL-30") || C.blood(p, "unpoisoned")),
      setup: (p, ctx) => { const k = kidsAged(p, 4.5, 7)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} is five. The physician has come with the spoon of milk and a few grains of white, as he came for you. You remember the cramps, and your grandmother's nod when you did not make a face. {them} is hiding behind your legs. Raja Vikram survived seven poisonings, your mother reminds you, and his line means to survive more.",
      choices: [
        { t: "Hold {themHim} while {theyHe} swallows", r: "{them} swallows, is sick, and swallows again the next day. Every month, a little more. By the first winter {theyHe} has stopped hiding behind you.",
          fx: { them: { op: -10 }, honor: 2, rel: { who: "mother", op: 5 } } },
        { t: "Send the physician away. The custom ends here", r: "Your mother calls it pride. The physician calls it murder. {them} goes back to playing in the courtyard.",
          fx: (p, ctx) => { p.flags.mch_broke_custom = A.S.year; p.flags.mch_custom_child = ctx.pid; return fx(p, ctx, { them: { op: 15 }, rel: { who: "mother", op: -15 }, honor: -2 }); } },
        { t: "Take the first spoon yourself, beside {themHim}", r: "You swallow a dose beside {them}, and the cramps come for you both. {theyHe} holds your hand through it, which is the wrong way round.",
          fx: { health: -5, cause: "arsenic", them: { op: 20 }, wil: 1 } },
      ],
    },
    {
      id: "mch_custom_reckoning", title: "Sugared almonds", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_broke_custom") && A.S.year - p.flags.mch_broke_custom >= 5,
      setup: (p, ctx) => { const k = alive(p.flags.mch_custom_child); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "mch_broke_custom")); },
      text: "A gift of sugared almonds reaches the nursery with no name on the ribbon. {them} eats three before the nurse sees the color of the fourth, and lives, barely, after a night of fever. The physician you sent away {yrsW} years ago, with his spoon of milk and grains of white, stands in the doorway and says nothing, loudly.",
      choices: [
        { t: "Bring back the spoon, starting tomorrow", r: "Late is better than never, the physician says, not believing it. {them} takes the milk without hiding. {theyHe} has learned what it is for.",
          fx: { them: { op: -5 }, honor: 2, rel: { who: "mother", op: 10 } } },
        { t: "Find who sent the almonds", check: { s: "intrigue", s2: "ins", d: 50 },
          win: { r: "A confectioner, a debt, a steward in a cousin's household. The steward is gone by the next new moon, and the cousin sends condolences.",
            fx: { skill: { intrigue: 3 }, fame: 2, trait: "vengeful" } },
          lose: { r: "The confectioner has left {capital}, and the trail ends at the river. You double the guard on the nursery and sleep there yourself.",
            fx: { skill: { intrigue: 1 }, trait: "paranoid", happy: -4 } } },
        { t: "Hold to your choice", r: "You will not poison your own child to save {themHim} from poison. The court thinks you mad. {them}, recovered, thinks you right.",
          fx: { them: { op: 20 }, wil: 2, honor: -2 } },
      ],
    },

    // ---------------------------------------------------------------- ch_fits_secret / ch_fits_known (ch_bl_quickened)
    {
      id: "mch_fits_torchlight", title: "A challenge at dusk", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_fits_secret") && A.S.year - p.flags.ch_fits_secret >= 5 && C.adult(p) && C.blood(p, "quickened"),
      setup: (p, ctx) => {
        const k = mk(p, { status: p.status === "slave" ? "peasant" : p.status, occ: "a hot-tempered young blade" }); ctx.pid = k.id;
        const f = A.relsOf(p, ["bestfriend", "friend"]).map(x => x.p).find(x => x.alive && A.isAdult(x));
        ctx.frid = f ? f.id : ""; ctx.fr = f ? f.given : "a friend";
      },
      text: "Since the feast where the torches guttered and you woke on the floor with your tongue bitten, you have kept away from flickering light. You said you tripped. Now {them} has challenged you to fight at dusk, by torchlight, in front of half of {home}. Refusing will cost you your name. Fighting may cost you the secret.",
      choices: [
        { t: "Fight, and keep your eyes off the torches", check: { s: "wil", s2: "ins", d: 55 },
          win: { r: "You fight with your eyes on {theirHis} feet and never look up. It is ugly and slow, and you win it. {them} limps off without knowing what you risked.",
            fx: { fame: 3, them: { type: "rival", op: -20, back: "rival" }, wil: 1 } },
          lose: { r: "A torch flares and the world jerks white. You wake on the cobbles with a ring of faces above you, as before. This time half of {home} saw it.",
            fx: (p, ctx) => { delete p.flags.ch_fits_secret; p.flags.ch_fits_known = A.S.year; return fx(p, ctx, { wound: "concussion", health: -10, cause: "a fit by torchlight", fame: -2, them: { type: "rival", op: -10, back: "rival" } }); } } },
        { t: "Name noon instead, and give no reason", r: "They call you a coward who fights only in good light. You fight at noon in a wet yard, and the story about the light outlives the fight.",
          fx: { honor: -3, them: { type: "rival", op: -15, back: "rival" }, wil: 1 } },
        { t: "Tell {fr} the truth, and send {fr} to talk it down", req: (p, C, ctx) => !!(ctx && ctx.frid),
          r: "{fr} listens, swears, and goes. Somehow the challenge becomes a dinner. {fr} never mentions the floor or the torches, then or after.",
          fx: (p, ctx) => { p.flags.mch_fits_told = A.S.year; p.flags.mch_fits_confidant = ctx.frid; const f = A.P(ctx.frid); if (f) A.addOp(p, f, 10); return fx(p, ctx, { them: { op: 5 } }); } },
      ],
    },
    {
      id: "mch_fits_confidant", title: "Yet", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_fits_told") && A.S.year - p.flags.mch_fits_told >= 4 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_fits_confidant); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} has kept your secret since the night of the torchlit challenge. Tonight {theyHe} comes to your door drunk and frightened. {theyHe} owes sixty suns to a moneylender who has heard there is something about you worth knowing. {theyHe} has not told. {theyHe} wants you to know that {theyHe} has not told, yet.",
      choices: [
        { t: "Pay the debt", req: p => p.coin >= 60, r: "You count it out on the table. {them} weeps, then sleeps on your floor. In the morning neither of you mentions the word yet.",
          fx: { coin: -60, them: { op: 15 }, owed: 1 } },
        { t: "Tell the secret yourself, before it is sold", r: "You tell it at the next feast, standing, in your own words. It costs you a week of stares. After that it is only a fact about you.",
          fx: (p, ctx) => { delete p.flags.ch_fits_secret; p.flags.ch_fits_known = A.S.year; return fx(p, ctx, { wil: 2, fame: -1, them: { op: -10 } }); } },
        { t: "Remind {themHim} what friends are for", r: "You say it quietly, with your hand on {theirHis} shoulder. {theyHe} understands. {theyHe} does not come to your door again.",
          fx: { them: { type: "rival", op: -35, back: "rival" }, skill: { intimidation: 2 } } },
      ],
    },
    {
      id: "mch_fits_night_raid", title: "Torches for the tents", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_fits_known") && A.S.year - p.flags.ch_fits_known >= 4 && C.adult(p) && C.soldier(p) && C.blood(p, "quickened"),
      text: "The captain orders a night raid on the enemy camp, with torches to fire the tents. Since the feast where the torches guttered and the world went white, you have kept one rule: daylight, steady lamplight, never torches. The captain does not know about the Quickened blood. The men around you are blacking their faces.",
      choices: [
        { t: "Tell the captain why you cannot go", r: "He hears you out with his jaw working, then puts you on the horse lines. The men who come back smell of smoke and do not talk to you.",
          fx: { merit: -8, honor: 1, wil: 0.5 } },
        { t: "Go, and keep to the dark edge", check: { s: "ins", s2: "spd", d: 50 },
          win: { r: "You work the edge of the raid where the light does not reach, cutting picket lines. Forty of their horses come back with you.",
            fx: { merit: 15, fame: 1 } },
          lose: { r: "A tent goes up beside you and the world jerks white. Your file drags you out by the belt. You wake in a baggage cart with a split scalp.",
            fx: { wound: "concussion", health: -14, cause: "a fit in a night raid", merit: -5 } } },
        { t: "Volunteer for the baggage guard", r: "The baggage guard is cold and safe. The sergeant writes something next to your name in the roll.",
          fx: { merit: -4, honor: -2 } },
      ],
    },
    {
      id: "mch_quickened_letter", title: "A letter from Evenglade", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_fits_known") && A.S.year - p.flags.ch_fits_known >= 6 && C.adult(p) && C.blood(p, "quickened") && !C.soldier(p),
      text: "A letter comes from Evenglade, from the School of the Quickened, where Sethril's line has trained carriers of the blood for six hundred years. Word of your fits has travelled. \"You fall in torchlight,\" the swordmaster writes. \"So did Sethril the Unwounded. Come for a season and learn to fight between the flickers.\" The fee is forty suns.",
      choices: [
        { t: "Go to Evenglade for a season", req: p => p.coin >= 40, r: "A season in lamplit halls where the light is moved on purpose, faster each week. By the end you can feel a flicker coming, like weather.",
          fx: { coin: -40, skill: { sword: 4 }, ins: 0.6, trait: "patient", deed: "Studied a season at the School of the Quickened" } },
        { t: "Ask them to write the teaching down", r: `They send three pages and a note: "This is the least of it." It is still more than you had.`,
          fx: { skill: { sword: 1 }, wil: 0.5 } },
        { t: "Burn the letter. You fight by daylight", r: "Your rule has kept you since childhood. The letter burns with a steady flame, which seems fitting.",
          fx: { wil: 1, trait: "stubborn" } },
      ],
    },

    // ---------------------------------------------------------------- ch_vitia (ch_bl_montaro)
    {
      id: "mch_vitia_fester", title: "A splinter you never felt", w: 3, once: true,
      cond: (p, C) => C.flag(p, "ch_vitia") && A.S.year - p.flags.ch_vitia >= 8 && C.adult(p) && C.blood(p, "laughing"),
      text: "You laughed at the nettles at five and were raised at Vitia under the Montaro name. Feeling nothing has its uses. This morning you find a splinter you never felt, deep in your calf, and the skin around it is black and hot. The Montaros have a rule for this: check your body every night. You have not.",
      choices: [
        { t: "Cut it out yourself", check: { s: "medicine", s2: "wil", d: 45 },
          win: { r: "You cut, drain and pack it with honey. It does not hurt, which is the whole trouble. From then on you check every night.",
            fx: { skill: { medicine: 2 }, trait: "diligent", health: -3, cause: "a festering wound" } },
          lose: { r: "You cut too shallow, then too deep. The fever comes anyway. When it breaks, you walk with a hitch in your stride.",
            fx: { wound: "limp", health: -15, cause: "a festering wound" } } },
        { t: "Pay a surgeon", r: "The surgeon prods it, frowns, and asks if it hurts. You say no. He charges you double for that.",
          fx: { coin: -20, health: -4, cause: "a festering wound" } },
        { t: "Leave it. It does not hurt", r: "It does not hurt for a week. Then the fever comes, the leg swells to the hip, and you lose a month to the bed.",
          fx: { health: -25, cause: "a festering wound", happy: -6, wil: 1 } },
      ],
    },
    {
      id: "mch_vitia_summons", title: "The Montaros send for their laughers", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_vitia") && A.S.year - p.flags.ch_vitia >= 10 && C.adult(p) && !C.old(p),
      text: "A rider in Montaro colors brings a summons. The Montaros of Vitia are going to war, and they want their laughers in the front rank, where a spear in the belly will not stop the line. They remember the child who laughed when the nettles came down at five. So do you. The grown-ups looked proud, and afraid.",
      choices: [
        { t: "Ride to Vitia", r: "A summer of skirmishes in the front rank. You take two wounds you do not feel until evening. The Montaros start calling you cousin.",
          fx: { fame: 3, skill: { spear: 3, melee: 2 }, wound: "scar_chest", health: -10, cause: "a spear in the front rank", honor: 3 } },
        { t: "Send coin instead of blood", r: "Forty suns and a letter. The Montaros take the coin and keep the letter, which is worse than sending it back.",
          fx: { coin: -40, honor: -2 } },
        { t: "Refuse. You are not their spear", r: `The rider looks you up and down. "You laughed at the nettles," he says, as if that settled who owned you. It did not.`,
          fx: { honor: -4, wil: 1.5, trait: "stubborn" } },
      ],
    },

    // ---------------------------------------------------------------- ch_veil (ch_bl_owl)
    {
      id: "mch_veil_court", title: "Covered faces", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_veil") && A.S.year - p.flags.ch_veil >= 8 && C.adult(p) && !C.ruler(p),
      text: "You have worn a veil of dark gauze by day since your mother sewed the first one, so that you can see at noon. Today you are called before {ruler} at midday, in a hall with tall windows. The herald tells you to put the veil off. Covered faces are for lepers and plotters, he says, not for the presence.",
      choices: [
        { t: "Take it off and bear the light", check: { s: "wil", s2: "sta", d: 50 },
          win: { r: "You stand with streaming eyes and answer every question. {ruler} notes the tears, and the steadiness.", fx: { rulerOp: 10, wil: 1.5 } },
          lose: { r: "The light is a white blade. You weep, then stumble, and the hall laughs before {ruler} raises a hand.", fx: { rulerOp: -5, happy: -8, fame: -1 } } },
        { t: "Keep it on, and explain your blood", check: { s: "diplomacy", s2: "etiquette", d: 45 },
          win: { r: "You explain the owl-eyes plainly. {ruler} is curious, then amused, and asks whether you see well at night. You do. That is remembered.", fx: { rulerOp: 8, fame: 1 } },
          lose: { r: "The herald has you shown out. You wait in the yard until dusk, when you could have read the petitions in the dark.", fx: { rulerOp: -8, honor: -2 } } },
        { t: "Leave rather than unveil", r: "You bow, keep the veil, and walk out. The story goes round the court in a week, in several versions.",
          fx: { honor: 2, rulerOp: -12, trait: "proud" } },
      ],
    },
    {
      id: "mch_veil_search", title: "Lanterns in the wood", w: 2, once: true,
      cond: (p, C) => C.flag(p, "ch_veil") && A.S.year - p.flags.ch_veil >= 6 && C.adult(p) && !C.old(p),
      text: "A child has gone missing in the wood above {home} at dusk. The searchers are lighting lanterns, which will show each of them about six paces. You have worn a veil by day since you were small, because the sun hurts you. At night you can see the mice moving in the grass. Someone in the crowd says so, loudly.",
      choices: [
        { t: "Lead the search, no lantern", check: { s: "tracking", s2: "ins", d: 40 },
          win: { r: "You find the child by midnight in a fox's earth, cold and furious. By morning they are calling you Owl in {home}, and not unkindly.",
            fx: { fame: 3, honor: 3, epithet: "Owl", skill: { tracking: 2 } } },
          lose: { r: "You find the trail and lose it again at the stream. The lanterns find the child at dawn, alive. People are kind about it, too kind.",
            fx: { happy: -4, skill: { tracking: 1 } } } },
        { t: "Go with the lanterns, like everyone else", r: "You walk in the yellow circle with the others and see nothing they cannot. The child is found at dawn. You sleep through noon.",
          fx: { wil: 0.5 } },
        { t: "Stay home. You do not want that name", r: "You shut the shutters and lie in the dark. In the morning the child is home, and people look at your door a little differently.",
          fx: { honor: -3, trait: "shy" } },
      ],
    },

    // ---------------------------------------------------------------- lf_secret_love (lf_love_status)
    {
      id: "mch_knock", title: "The old knock", w: 3, once: true,
      cond: (p, C) => C.flag(p, "lf_secret_love") && A.S.year - p.flags.lf_secret_love >= 4 && C.adult(p),
      setup: (p, ctx) => {
        const k = linkedIn(p, ["lover", "friend", "ex", "betrothed", "acquaint", "rival"], p.flags.lf_secret_love);
        if (!k || k.id === p.spouse) { ctx.skip = 1; return; }
        ctx.pid = k.id; ctx.yrsW = num(since(p, "lf_secret_love"));
      },
      text: "Near midnight someone knocks in the old code: two, then one, then two. Only one person alive knows it. {them} stands in the rain with a bundle under one arm. {yrsW} years ago you loved each other in stolen hours by the river, across a gap of rank everyone could see. {theyHe} married since. Tonight {theyHe} has left the marriage.",
      choices: [
        { t: "Open the door", r: "{them} comes in, drips on your floor, and does not let go of the bundle. Tomorrow there will be questions. Tonight there is a fire.",
          fx: (p, ctx) => { p.flags.mch_knock_opened = A.S.year; p.flags.mch_knock_who = ctx.pid; return fx(p, ctx, { them: { type: "lover", op: 30, back: "lover" }, happy: 8, honor: -3 }); } },
        { t: "Send {themHim} away through the door", r: "You say the sensible things through the wood. {them} listens to all of them and goes. You do not sleep.",
          fx: { them: { op: -20 }, wil: 1.5, happy: -6 } },
        { t: "Give {themHim} coin and a name in another town", r: "You press twenty suns and an address into a wet hand. {them} kisses your knuckles and is gone before the watch comes round.",
          fx: { coin: -20, them: { op: 15 }, owed: 1 } },
      ],
    },
    {
      id: "mch_knock_known", title: "A steward with a paper", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_knock_opened") && A.S.year - p.flags.mch_knock_opened >= 2,
      setup: (p, ctx) => { const k = alive(p.flags.mch_knock_who); if (!k || k.id === p.spouse) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} has lived under your roof since the night of the old knock, as a cousin from the country. Today a steward rides up with three men and a paper. The marriage {them} left is a lawful one. The paper says {them} goes back, or you answer for it before the magistrate.",
      choices: [
        { t: "Answer for it before the magistrate", check: { s: "persuasion", s2: "etiquette", d: 55 },
          win: { r: "The magistrate is old and has seen worse. He rules the marriage void for want of banns. {them} is free, and the district has its scandal for the winter.",
            fx: { them: { type: "betrothed", op: 30, back: "betrothed" }, honor: -4, happy: 10 } },
          lose: { r: "The marriage stands. {them} is taken back by the steward's men, and you are fined for harboring another's spouse.",
            fx: { coin: -40, honor: -6, them: { op: 10 }, happy: -12 } } },
        { t: "Ride off with {themHim} tonight", r: "Two horses, the back lane, the river road south. By dawn you are three villages away, with no house and each other.",
          fx: { them: { type: "lover", op: 25 }, happy: 6, coinPct: -0.3, honor: -5 } },
        { t: "Let the steward take {themHim}", r: "{them} goes without a word, which is the worst thing {theyHe} could have done. The bundle stays on your floor.",
          fx: { them: { type: "enemy", op: -50, back: "enemy" }, happy: -10, wil: 2 } },
      ],
    },

    // ---------------------------------------------------------------- lf_knows_ashen (lf_friend_ashen)
    {
      id: "mch_ashen_questions", title: "Questioners at your table", w: 3, once: true,
      cond: (p, C) => C.flag(p, "lf_knows_ashen") && A.S.year - p.flags.lf_knows_ashen >= 3 && C.adult(p),
      setup: (p, ctx) => {
        const y = p.flags.lf_knows_ashen, hit = A.relsOf(p, ["bestfriend"]).find(x => x.p.alive && (x.r.since === y || x.r.seen === y));
        if (!hit) { ctx.skip = 1; return; }
        ctx.pid = hit.p.id; ctx.yrsW = num(since(p, "lf_knows_ashen"));
      },
      text: "Two Temple questioners sit at your table with a ledger. Someone has reported grey ash on a cellar step. They ask about {them}. You know what is in that cellar: a black stone, a litany scratched on a board, an altar to the darkness the Temple calls the Devourer. You kept that secret {yrsW} years ago. Now they ask you to swear on the Light.",
      choices: [
        { t: "Swear that you know nothing", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "You swear it with a steady voice and a sick stomach. The questioners write a short line and leave. {them} hears of it that night.",
            fx: (p, ctx) => { p.flags.mch_ashen_perjury = A.S.year; p.flags.mch_ashen_who = ctx.pid; return fx(p, ctx, { them: { op: 25 }, piety: -6 }); } },
          lose: { r: "Your voice catches on the word Light. The questioners exchange a look. {them} is taken that week, and you are fined for a false oath.",
            fx: { them: { type: "enemy", op: -30, back: "enemy" }, coin: -30, piety: -4, honor: -4 } } },
        { t: "Tell them what you saw", r: "You tell them about the ash, the stone and the board. {them} goes to a Temple cell for life. The questioners thank you. Cellar steps are never quite the same.",
          fx: { them: { type: "enemy", op: -80, back: "enemy" }, piety: 6, honor: -4, happy: -10 } },
        { t: "Ask for a day, and warn {themHim}", r: "You ride out at dusk. {them} is gone by dawn with a cart and the black stone. The questioners come back for your answer and find an empty cellar.",
          fx: { them: { op: 20 }, piety: -2, honor: 2 } },
      ],
    },
    {
      id: "mch_ashen_repaid", title: "The Ashen keep debts", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_ashen_perjury") && A.S.year - p.flags.mch_ashen_perjury >= 4 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_ashen_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "mch_ashen_perjury")); },
      text: "{them} comes at night with a small cloth bag: grey ash, and a name scratched on a strip of lead. \"You lied under the Light for me {yrsW} years ago,\" {theyHe} says. \"The Ashen keep debts. Burn this at a crossroads, and whoever wrongs you will have a bad year.\"",
      choices: [
        { t: "Burn it at the crossroads", r: "The ash goes up blue. Nothing happens that you can see. You sleep worse after, and your rival has a very bad year.",
          fx: { piety: -8, secret: 1, rel: { who: "rival", op: -15 } } },
        { t: "Thank {themHim}, and give it back", r: `"I kept a secret, not a ledger," you say. {them} closes the bag and kisses your cheek.`,
          fx: { them: { type: "bestfriend", op: 15, back: "bestfriend" }, piety: 2, honor: 2 } },
        { t: "Take it to the Temple", r: "The priests take the bag with tongs and burn it in the courtyard. They take {them} the same afternoon. They do not ask why you waited.",
          fx: { them: { type: "enemy", op: -80, back: "enemy" }, piety: 8, honor: -8 } },
      ],
    },

    // ---------------------------------------------------------------- lf_pawned (lf_pawn_heirloom)
    {
      id: "mch_pawn_window", title: "In the window", w: 2, once: true,
      cond: (p, C) => C.flag(p, "lf_pawned") && A.S.year - p.flags.lf_pawned >= 2 && C.adult(p) && p.coin >= 40,
      text: "You pass the pawn-lender's in {home} and stop. The family piece you pawned when you were short is in the window now, on a square of faded velvet, with a price card in the lender's neat hand. It is three times what he gave you. A woman in a good cloak is looking at it too.",
      choices: [
        { t: "Buy it back now, at his price", r: "The lender wraps it in brown paper without comment. At home you put it back where it lived, and the shelf looks right again.",
          fx: { coin: -30, happy: 6, honor: 2 } },
        { t: "Haggle him down", check: { s: "trade", s2: "persuasion", d: 50 },
          win: { r: "He sighs, names a smaller sum, then a smaller one. You walk out with it under your arm.", fx: { coin: -15, happy: 6, skill: { trade: 1 } } },
          lose: { r: "While you argue, the woman in the good cloak pays his price. She does not look at you on her way out.", fx: { happy: -8, wil: 1 } } },
        { t: "Walk on. It is only a thing", r: "You walk on. It was only a thing, you tell yourself, all the way home and some way past it.",
          fx: { happy: -3, wil: 1 } },
      ],
    },
    {
      id: "mch_pawn_asked", title: "The empty place on the shelf", w: 2, once: true,
      cond: (p, C) => C.flag(p, "lf_pawned") && A.S.year - p.flags.lf_pawned >= 5 && C.adult(p) && C.parentsAlive(p),
      setup: (p, ctx) => { const k = A.relsOf(p, ["mother", "father"]).map(x => x.p).find(x => x.alive); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "lf_pawned")); },
      text: "{them} comes to visit and asks to see it: the family piece. You pawned it in {home} {yrsW} years ago, when you were short, badly. The lender held it a year and then put it in the window. {them} is already looking at the empty place on the shelf.",
      choices: [
        { t: "Tell {themHim} the truth", r: "{them} sits down heavily. Then {theyHe} asks how short you were, and for how long, and why you did not say. That is worse than anger.",
          fx: { them: { op: -5 }, honor: 3, wil: 1 } },
        { t: "Say it is out being mended", r: "{them} nods. On every visit after, {theyHe} asks whether it is mended yet.",
          fx: { them: { op: -2 }, trait: "deceitful", honor: -3 } },
        { t: "Say it was stolen", r: "{them} wants to go to the magistrate at once. It takes the whole afternoon to talk {themHim} out of it.",
          fx: { trait: "deceitful", honor: -5, them: { op: 5 }, happy: -3 } },
      ],
    },

    // ---------------------------------------------------------------- lf_gang (lf_teen_gang)
    {
      id: "mch_gang_crate", title: "A crate that smells of cloves", w: 3, once: true,
      cond: (p, C) => C.flag(p, "lf_gang") && A.S.year - p.flags.lf_gang >= 5 && C.adult(p),
      setup: (p, ctx) => {
        const hit = A.relsOf(p).find(x => x.p.alive && x.p.occ === "the leader of a gang of dock youths");
        const k = hit ? hit.p : linkedIn(p, ["friend", "bestfriend", "rival"], p.flags.lf_gang);
        if (!k) { ctx.skip = 1; return; }
        ctx.pid = k.id;
      },
      text: "{them}, who ran the dock lads when you ran the rooftops with them, keeps a warehouse now and a ledger no one audits. {theyHe} sends a boy to your door with a crate and a note: \"Hold this a month. Old times.\" The crate is heavy, nailed shut, and smells faintly of cloves.",
      choices: [
        { t: "Keep the crate in your cellar", r: "A month later a different boy collects it and leaves a purse on the step. Twenty suns. {them} remembers who holds things for {themHim}.",
          fx: (p, ctx) => { p.flags.mch_gang_crate = A.S.year; p.flags.mch_gang_who = ctx.pid; return fx(p, ctx, { coin: 20, them: { op: 15 }, honor: -2 }); } },
        { t: "Send it back unopened", r: "The boy wheels it back on a handcart. {them} says nothing about it for a year, and then says something to someone else.",
          fx: { them: { op: -15 }, honor: 1 } },
        { t: "Take it to the watch", r: "Inside are cloves, pepper and a silver chalice with a priory's mark. {them} spends a winter in the gaol. When {theyHe} comes out, {theyHe} knows your door.",
          fx: { them: { type: "enemy", op: -60, back: "enemy" }, honor: 3, rulerOp: 2 } },
      ],
    },
    {
      id: "mch_crate_reckoning", title: "A name in the ledger", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_gang_crate") && A.S.year - p.flags.mch_gang_crate >= 3 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_gang_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "A captain of the watch comes to your door with a ledger open at a page. {them} has been taken for receiving church plate, and {theirHis} books are very complete. Your name is on the page, three years back, beside the word cloves and a sum of twenty suns.",
      choices: [
        { t: "Say you never knew what was in it", check: { s: "deception", s2: "persuasion", d: 45 },
          win: { r: "It is even true, more or less. The captain writes innocent carrier beside your name and moves on to the next.", fx: { wil: 0.5 } },
          lose: { r: "The captain does not believe you. You pay a fine of sixty suns, and your name is read out in the market.", fx: { coin: -60, honor: -6, fame: -1 } } },
        { t: "Speak for {themHim} at the trial", r: "You tell the court about a youth on the rooftops who never once left a friend behind. It does not save {themHim} from the brand. {theyHe} remembers who spoke.",
          fx: { them: { type: "bestfriend", op: 40, back: "bestfriend" }, honor: -2, fame: -1 } },
        { t: "Name the others in the ledger", r: "You name six. The captain is pleased, and your name comes off his list. You will not be welcome on the docks again.",
          fx: { honor: -6, rulerOp: 4, them: { type: "enemy", op: -60, back: "enemy" }, trait: "cynical" } },
      ],
    },
    {
      id: "mch_gang_child", title: "Soot on the knees", w: 2, once: true,
      cond: (p, C) => C.flag(p, "lf_gang") && A.S.year - p.flags.lf_gang >= 15 && C.adult(p) && C.hasKids(p) && C.town(p),
      setup: (p, ctx) => { const k = kidsAged(p, 11, 17)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} comes home after midnight with soot on {theirHis} knees and three coppers {theyHe} did not earn. You know the look of the rooftops. You ran them yourself with the dock lads, lifting a purse now and then, never caught. You were lucky. Most of them were not.",
      choices: [
        { t: "Tell {themHim} what became of the others", r: "You name them: the one hanged, the one branded, the one who drowned under a pier. {them} listens. Whether {theyHe} stops, you cannot tell.",
          fx: { them: { op: 5 }, honor: 2 } },
        { t: "Thrash {themHim}, as your father would have", r: "{them} takes it without a sound and goes out the next night anyway, by the window.",
          fx: { them: { op: -25 }, trait: "wrathful" } },
        { t: "Teach {themHim} to do it properly", r: "Quiet feet, a light touch, never the same street twice. {them} is never caught. You are not sure that counts as raising a child.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.trainSkill(k, "stealth", 5); return fx(p, ctx, { them: { op: 20 }, honor: -4 }); } },
      ],
    },

    // ---------------------------------------------------------------- sc_masters_pupil (school_master_eye)
    {
      id: "mch_master_sends", title: "The master sends for you", w: 3, once: true,
      cond: (p, C) => C.flag(p, "sc_masters_pupil") && A.S.year - p.flags.sc_masters_pupil >= 8 && C.adult(p),
      setup: (p, ctx) => {
        const m = (p.school && alive(p.school.mpid)) || (A.relsOf(p, ["mentor"]).map(x => x.p).find(x => x.alive) || null);
        if (m) ctx.pid = m.id;
        ctx.mname = m ? m.given : (p.school && p.school.master) || "your old master";
        ctx.fight = !!(p.styles && Object.keys(p.styles).length);
      },
      text: (p, ctx) => ctx && ctx.fight
        ? "Years ago {mname} watched you drill without a word, then summoned you to the master's yard at dawn, alone. You worked as you never had. Now {mname} is old, the yard is half empty, and a letter asks you to come back for a season and take the dawn classes. It pays nothing."
        : "Years ago {mname} wrote \"See me\" under your work, and you sat in the master's room with two cups of wine and a book you had never heard of. Now {mname} is old, the school is failing, and a letter asks you to come back for a season to teach. It pays nothing.",
      choices: [
        { t: "Go back and teach for a season", r: "Dawn after dawn, as before, only now you walk the lines. By the end of the season the school is fuller, and your own work is sharper for it.",
          fx: (p, ctx) => { p.flags.mch_master_yard = A.S.year; return fx(p, ctx, { them: { op: 25 }, styleXp: 15, honor: 4, coin: -15, skill: { learning: 1 } }); } },
        { t: "Send money instead", r: "Fifty suns and a warm letter. {mname} writes back in a hand grown shaky, thanking you correctly.",
          fx: { coin: -50, them: { op: 5 } } },
        { t: "Do not answer", r: "Other pupils go. You hear later that the school closed in the spring, and that {mname} asked after you.",
          fx: { them: { op: -20 }, happy: -3 } },
      ],
    },
    {
      id: "mch_master_heir", title: "Heir to the school", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_master_yard") && A.S.year - p.flags.mch_master_yard >= 3 && C.adult(p),
      setup: (p, ctx) => {
        const m = (p.school && alive(p.school.mpid)) || A.relsOf(p, ["mentor"]).map(x => x.p).find(x => x.alive);
        ctx.mname = m ? m.given : (p.school && p.school.master) || "your old master";
        const k = mk(p, { status: p.status === "slave" ? "peasant" : p.status, occ: "a senior pupil of your old school" }); ctx.pid = k.id;
      },
      text: "Since your season of teaching, {mname} has named you heir to the school, over the heads of the senior pupils. One of them, {them}, disputes it in front of the whole school. {theyHe} says you came back for one season and left again, and {theyHe} offers to settle it the old way.",
      choices: [
        { t: "Settle it the old way, in the yard", r: "You strip to the shirt and walk into the yard where you once worked dawn after dawn.",
          fx: { them: { type: "rival", op: -20, back: "rival" }, duel: { foe: "them", opts: { kind: "duel", lethal: false, toYield: true, place: "the school yard", title: "For the school" } } } },
        { t: "Share it: you the dawn classes, {themHim} the dusk", r: "An odd arrangement, and it works better than either of you expected. The school is never empty now.",
          fx: { them: { type: "friend", op: 20, back: "friend" }, honor: 3, deed: "Kept their old master's school alive" } },
        { t: "Give the school to {themHim}", r: "You hand over the keys and the ledger. {them} seems almost disappointed not to fight.",
          fx: { them: { op: 15 }, wil: 1, happy: -3 } },
      ],
    },

    // ---------------------------------------------------------------- tourneyWin / tourneyMelee (pr_tourney_joust)
    {
      id: "mch_tourney_son", title: "The son of the knight", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tourneyWin") && A.S.year - p.flags.tourneyWin >= 6 && C.adult(p) && (C.noble(p) || C.ruler(p)),
      setup: (p, ctx) => { const k = mk(p, { sex: "M", ageAdj: 18, status: "gentry", occ: "the son of a knight you unhorsed" }); ctx.pid = k.id; },
      text: "At your tourney below {home} you unhorsed a knight on the third pass, square, and the meadow roared your name. He never rode well again. Now his son, {them}, kneels in your hall with one of two requests: a place in your household, or a pass with blunted lances to wipe out the shame.",
      choices: [
        { t: "Take {themHim} into your household", r: "He serves well and watches you closely. You are never quite sure what he is waiting to see.",
          fx: (p, ctx) => { p.flags.mch_took_squire = A.S.year; p.flags.mch_squire_who = ctx.pid; return fx(p, ctx, { them: { type: "servant", op: 20, back: "lord" } }); } },
        { t: "Give {themHim} the pass with blunted lances", check: { s: "lance", s2: "riding", d: 50 },
          win: { r: "He rides well and loses well. Afterwards he says the shame is gone, and seems to mean it.", fx: { them: { type: "friend", op: 25, back: "friend" }, fame: 2 } },
          lose: { r: "His point catches you high and the world turns over. The crowd roars his name this time. He offers you his hand.", fx: { health: -12, cause: "a fall in the lists", fame: -2, them: { type: "friend", op: 30, back: "friend" } } } },
        { t: "Send {themHim} away with a purse", r: "He takes the purse and leaves it on the gatepost. The story goes round the district faster than he does.",
          fx: { coin: -50, honor: -2, them: { type: "rival", op: -30, back: "rival" } } },
      ],
    },
    {
      id: "mch_squire_letter", title: "A letter under the bench", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mch_took_squire") && A.S.year - p.flags.mch_took_squire >= 4 && C.adult(p),
      setup: (p, ctx) => { const k = alive(p.flags.mch_squire_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrsW = num(since(p, "mch_took_squire")); },
      text: "{them}, son of the knight you unhorsed at your own tourney, has served in your household for {yrsW} years. Tonight a servant brings you a letter found under his bench. It is from your rival, promising him land if he unbars a postern gate. His answer is not with it.",
      choices: [
        { t: "Show {themHim} the letter, and ask", r: `He reads it and goes white, then red. "I burned the first one," he says. You decide to believe him, and you watch the postern yourself for a month.`,
          fx: { them: { op: 15 }, honor: 2 } },
        { t: "Dismiss {themHim} tonight", r: "He leaves at midnight without a word in his own defense. By spring he wears your rival's colors.",
          fx: { them: { type: "enemy", op: -50, back: "enemy" }, wil: 1 } },
        { t: "Say nothing, and watch the postern", r: "You put a man on the postern and wait. A week later {them} kills the man your rival sends. He never mentions the letter.",
          fx: { them: { type: "friend", op: 30, back: "friend" }, fame: 1 } },
      ],
    },
    {
      id: "mch_tourney_old", title: "Your old lance", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tourneyWin") && A.S.year - p.flags.tourneyWin >= 15 && C.old(p) && C.hasKids(p),
      setup: (p, ctx) => { const k = kidsAged(p, 16, 40)[0]; if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} means to ride in the joust at the coming tourney, as you once rode at yours below {home}: three passes, and on the third your lance took him square. Your hands shake on the reins now. {them} wants your old lance and your blessing, in that order.",
      choices: [
        { t: "Give {themHim} the lance and the blessing", r: "You watch from the stand with your fists clenched. {them} rides three passes and stays in the saddle for all of them. That is enough.",
          fx: { them: { op: 20 }, happy: 5 } },
        { t: "Teach {themHim} the third pass first", r: "A month in the meadow, you on a mounting block, shouting. {them} learns to drop the point late. You learn you can still shout.",
          fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.trainSkill(k, "lance", 6); return fx(p, ctx, { them: { op: 25 }, happy: 4 }); } },
        { t: "Forbid it", r: "{them} obeys, and resents it for a year, and will ride at some later tourney when you cannot stop it.",
          fx: { them: { op: -20 }, wil: 1 } },
      ],
    },
    {
      id: "mch_melee_custom", title: "The host's melee", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tourneyMelee") && A.S.year - p.flags.tourneyMelee >= 5 && C.adult(p) && (C.noble(p) || C.ruler(p)),
      text: "Since you walked into the melee at your own tourney in blunted steel, the young knights of {home} have talked of little else. Your steward proposes making it a custom: every midsummer, the host fights on foot in the press. Your physician has views on this. So does your heir.",
      choices: [
        { t: "Make it a custom, and fight every year", r: "The midsummer melee becomes the best-attended day of the year. You come out of it bruised every time, and once with cracked ribs.",
          fx: { fame: 4, houseOp: 3, wound: "broken_ribs", health: -8, cause: "the midsummer melee" } },
        { t: "Make it a custom for the young knights", r: "You preside and give the prize with your own hands. Men who would never have met you in a hall have taken a blow in your sight.",
          fx: { fame: 2, houseOp: 2, skill: { command: 1 } } },
        { t: "Once was enough", r: "Your steward bows. The young knights are disappointed. Your physician is not.", fx: { wil: 0.5, happy: 1 } },
      ],
    },
  ]);
})();
