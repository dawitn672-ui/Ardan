// The real people of the far realms in a far life: the ruler, the heir, the chancellor and the marshal the world
// holds (99-far-lands seats the far rulers under their lore names), and the realm's noble houses and their seats.
// Each scene puts the person in with ctx.pid (A.FV.ruler, heir, councillor) so {them} and the pronouns work, and
// drops itself when there is nobody fit. The words around them follow the land. Ids: fv_k_.
(() => {
  const F = A.FV;
  // a few words of each land, for the scenes below
  const WHERE = { R: "the paved road from the prefecture", F: "the summer camps", B: "the oasis road", H: "the valley road below the monasteries",
    M: "the temple road", A: "the river landing", T: "the forest road", N: "the shore camps", I: "the coast road", D: "the cattle road" };
  const where = p => { const pr = A.prov(p.home), r = pr && pr.region; return WHERE[r ? r[0] : ""] || "the road"; };
  A.defEvents([
    {
      id: "fv_k_progress",
      title: "The ruler passes",
      cond: (p, C) => C.farLand(p) && C.age(p) >= 5 && !C.ruler(p) && !C.noble(p),
      w: 3, cool: 12,
      setup: (p, ctx) => { F.ruler(p, ctx); ctx.road = where(p); },
      text: "{them}, {rtitle} of {realmShort}, is passing along {road} with guards, banners and a long tail of officials. Everyone has turned out. A child near you has dropped a basket of eggs into the road, right in front of the leading horse, and the guards are already shouting.",
      choices: [
        { t: "Run out and gather the eggs", check: { s: "athletics", s2: "spd", d: 45 },
          win: { r: "You are in and out before the horse stops. {them} sees it, and laughs, and a coin is thrown into the dust after you.", fx: { coin: 5, fame: 1, them: { op: 5 } } },
          lose: { r: "A guard's spear-butt catches you in the ribs. The procession goes on. The eggs do not.", fx: { wound: "broken_ribs", health: -4 } } },
        { t: "Pull the child back", r: "You pull the child out of the road by the collar. The procession passes over the eggs. The child's mother thanks you, crying.", fx: { honor: 2, newRel: { type: "friend", op: 10 } } },
        { t: "Keep your eyes down, as you were taught", r: "You see hooves, wheels and the hem of a fine robe. That is the {rtitle}, as far as you are concerned.", fx: { piety: 1 } },
      ],
    },
    {
      id: "fv_k_petition",
      title: "A petition to the throne",
      cond: (p, C) => C.farLand(p) && C.adult(p) && !C.ruler(p) && (C.poor(p) || C.job(p, "farm") || C.job(p, "smith")),
      w: 2, cool: 15,
      setup: (p, ctx) => { F.ruler(p, ctx); },
      text: "Once a year {them}, {rtitle} of {realmShort}, hears petitions from common people at the capital's gate, a few hundred of them, one sentence each. Your village has chosen you to speak, about a lord's steward who has taken the common grazing. You have one sentence. The steward will be standing behind the throne.",
      choices: [
        { t: "Say it plainly and name the steward", check: { s: "persuasion", s2: "wil", d: 55 },
          win: { r: "The {rtitle} looks past you at the steward for a moment. The grazing is given back before harvest.", fx: { fame: 3, honor: 3, them: { op: 10 }, newRel: { type: "enemy", op: -25 } } },
          lose: { r: "Your sentence comes out tangled. The {rtitle} nods and the next petitioner is called. The steward smiles.", fx: { happy: -4, newRel: { type: "enemy", op: -20 } } } },
        { t: "Ask only for the grazing back", r: "No names. The {rtitle} says the matter will be looked into. It is, slowly.", fx: { honor: 1, them: { op: 5 } } },
        { t: "Give your place to an old woman with a better grievance", r: "Her son was hanged for a theft he did not commit. The court goes quiet. You walk home with nothing for the village.", fx: { honor: 3, family: -3 } },
      ],
    },
    {
      id: "fv_k_audience",
      title: "An audience",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.noble(p) && !C.ruler(p),
      w: 3, cool: 8,
      setup: (p, ctx) => { F.ruler(p, ctx); },
      text: "{them}, {rtitle} of {realmShort}, has granted you an audience, which in this court means a quarter of an hour, standing, with three officials listening. You have come about your house's lands. The {rtitle} has come, it quickly appears, about your house's men: how many, how armed, and how loyal.",
      choices: [
        { t: "Answer about the men honestly", r: "You give the numbers. The {rtitle} thanks you and gives your lands the attention you asked for. Your men are counted now.", fx: { favor: 6, honor: 1, them: { op: 15 } } },
        { t: "Talk only about the lands", check: { s: "diplomacy", s2: "int", d: 52 },
          win: { r: "You steer the quarter-hour back to boundaries and rents. The {rtitle} lets you, and is amused.", fx: { skill: { diplomacy: 2 }, them: { op: 5 } } },
          lose: { r: "The officials take your evasions for an answer. Your house is written down as doubtful.", fx: { favor: -6, them: { op: -10 } } } },
        { t: "Offer more men than you have", r: "The {rtitle} is pleased. Now you must find them.", fx: { favor: 8, honor: -2, coin: -40 } },
      ],
    },
    {
      id: "fv_k_heir_hunt",
      title: "The heir's hunt",
      cond: (p, C) => C.farLand(p) && (C.teen(p) || C.adult(p)) && !C.old(p) && (C.noble(p) || C.rich(p) || C.soldier(p)),
      w: 3, cool: 10,
      setup: (p, ctx) => { F.heir(p, ctx); },
      text: "{them}, heir to the throne of {realmShort}, is riding out to hunt and has asked for young people of good families to ride with {khim}. You are one of them. By noon it is clear the heir rides badly, is bored by the hunt, and wants to talk to someone who is not a courtier.",
      choices: [
        { t: "Talk to the heir as you would to anyone", r: "You talk about horses, weather and nothing. The heir laughs more than once. The courtiers notice.", fx: { them: { type: "friend", op: 25 }, favor: 2 } },
        { t: "Ride ahead and make the kill", check: { s: "riding", s2: "spd", d: 50 },
          win: { r: "Your spear takes the boar. The heir is generous about it, which is not the same as pleased.", fx: { fame: 2, skill: { riding: 1 }, them: { op: 5 } } },
          lose: { r: "Your horse goes down in a ditch. The heir rides back for you, which the court will talk about for a month.", fx: { wound: "limp", them: { op: 15 } } } },
        { t: "Flatter the heir's riding", r: "The heir has heard it before, from everyone, and thanks you in exactly the same voice.", fx: { favor: 1, them: { op: -5 } } },
      ],
    },
    {
      id: "fv_k_heir_child",
      title: "A child of the palace",
      cond: (p, C) => C.farLand(p) && C.child(p) && C.age(p) >= 6 && (C.noble(p) || C.rich(p)),
      w: 4, once: true,
      setup: (p, ctx) => { const q = F.heir(p, ctx); if (q && F.hAge(q) > 16) ctx.skip = 1; },
      text: "At a festival in the palace gardens the children of good houses are let run by the water, and one of them is {them}, the heir of {realmShort}, with a nurse a step behind. The heir has fallen in the fish pond and is standing in it, wet to the knees, daring anyone to laugh.",
      choices: [
        { t: "Climb in too", r: "You wade in beside the heir. The two of you are pulled out together, scolded together, and dried by the same fire.", fx: { them: { type: "friend", op: 30 }, happy: 3, family: -2 } },
        { t: "Laugh", r: "You laugh. The heir does not forget it, in either direction.", fx: { them: { type: "rival", op: -15 }, happy: 2 } },
        { t: "Fetch the nurse a towel", r: "The nurse thanks you. The heir looks at you as if you had gone over to the grown-ups.", fx: { honor: 1, them: { op: -5 } } },
      ],
    },
    {
      id: "fv_k_chancellor_loan",
      title: "The chancellor's loan",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.rich(p) && !C.ruler(p),
      w: 3, cool: 10,
      setup: (p, ctx) => { F.councillor(p, ctx, "chancellor"); },
      text: "{them}, chancellor of {realmShort}, invites you to dine and talks about the treasury, which is empty, and the army, which is not paid. Before the second course a clerk lays a paper beside your bowl: a loan to the crown, at a rate of interest that would be generous if the crown ever paid interest.",
      choices: [
        { t: "Sign it", r: "You sign. The chancellor calls you a friend of the crown, which is a title with no income.", fx: { coin: -120, favor: 8, them: { type: "friend", op: 20 } } },
        { t: "Offer half", check: { s: "diplomacy", s2: "wil", d: 52 },
          win: { r: "Half, and a licence for something you wanted. The chancellor admires the bargain.", fx: { coin: -50, favor: 3, skill: { trade: 2 } } },
          lose: { r: "The chancellor takes the half and remembers the other half.", fx: { coin: -60, them: { op: -10 } } } },
        { t: "Plead poor", r: "The chancellor has your tax roll on the side table. Dinner ends early.", fx: { favor: -6, them: { type: "rival", op: -20 } } },
      ],
    },
    {
      id: "fv_k_marshal_levy",
      title: "The marshal's levy",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.male(p) && !C.old(p) && !C.ruler(p),
      w: 2, cool: 12,
      setup: (p, ctx) => { F.councillor(p, ctx, "marshal"); },
      text: "{them}, marshal of {realmShort}, has ridden into the district with a list. Every household is to send a man for the levy this season, or pay a levy-price in silver or grain. Your household's name is on the list. So is your neighbour's, whose only son is fourteen.",
      choices: [
        { t: "Go yourself", r: "You take your place in the levy's line. The marshal's clerk writes your name twice, once for each household.", fx: { honor: 3, health: -3, skill: { spear: 1 }, newRel: { type: "friend", op: 20 } } },
        { t: "Pay the levy-price", r: "Silver to the clerk. Your neighbour's boy goes, because his family has none.", fx: { coin: -30, happy: -2 } },
        { t: "Ask the marshal to strike the boy", check: { s: "persuasion", s2: "int", d: 55 },
          win: { r: "The marshal looks at the boy for a long breath and strikes him from the list. He adds your name in his place.", fx: { honor: 3, them: { op: 10 }, skill: { persuasion: 1 } } },
          lose: { r: "The marshal says the list is the list, and writes something beside your name in his own hand.", fx: { them: { op: -10 }, happy: -2 } } },
      ],
    },
    {
      id: "fv_k_house_rents",
      title: "The lords of the district",
      cond: (p, C) => C.farLand(p) && C.adult(p) && (C.poor(p) || C.unfree(p)),
      w: 2, cool: 10,
      setup: (p, ctx) => { F.house(p, ctx); },
      text: "{house}, whose seat is at {seat}, owns the land you work. Its steward has come to say the rent is raised by a fifth this year, because the house has a wedding to pay for. Your neighbours are gathered in the yard, waiting to see who will speak first.",
      choices: [
        { t: "Speak first", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "You speak for the yard. The steward settles for a tenth, and says he will remember your face.", fx: { coin: -5, honor: 3, fame: 1, newRel: { type: "rival", op: -15 } } },
          lose: { r: "The steward lets you finish and raises your own rent by a quarter.", fx: { coin: -20, honor: 2 } } },
        { t: "Pay the fifth and keep quiet", r: "You pay. The house's wedding is said to be very fine.", fx: { coin: -15 } },
        { t: "Offer labour at the wedding instead", r: "You carry tables and kill chickens at the seat for a week. The rent is not raised for your household.", fx: { health: -2, coin: -3, skill: { craft: 1 } } },
      ],
    },
    {
      id: "fv_k_house_daughter",
      title: "A match with a house",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.age(p) <= 35 && !C.married(p) && (C.noble(p) || C.rich(p)),
      w: 2, cool: 10,
      setup: (p, ctx) => { F.house(p, ctx); },
      text: "A go-between has come from {house}, at {seat}, to sound out your family about a match. The house is old and short of money. Your family is newer and is not. The go-between talks about the house's ancestors for an hour before she mentions the dowry, which is small, and the debts, which are not mentioned at all.",
      choices: [
        { t: "Tell her your family is interested", r: "The negotiations will take a year. Your family is very pleased, and starts counting the house's debts.", fx: { family: 5, favor: 2 } },
        { t: "Ask about the debts", r: "The go-between goes pale and then names them. They are worse than you thought. She respects you for asking.", fx: { skill: { intrigue: 1 }, family: 2 } },
        { t: "Decline politely", r: "The house is offended in the polite way. Your family is offended in the ordinary way.", fx: { family: -4, honor: 1 } },
      ],
    },
    {
      id: "fv_k_ruler_illness",
      title: "The ruler is ill",
      cond: (p, C) => C.farLand(p) && C.adult(p) && !C.ruler(p) && (C.noble(p) || C.job(p, "healer") || C.job(p, "courtier")),
      w: 2, cool: 15,
      setup: (p, ctx) => { F.ruler(p, ctx); },
      text: "It is said in the capital that {them}, {rtitle} of {realmShort}, has not been seen for nine days. Physicians come and go by a side gate. Two parties at court are already counting who would stand with the heir and who would not. Someone of the first party has asked you, very casually, which way your house would lean.",
      choices: [
        { t: "Say your house serves the throne, whoever sits it", r: "It is the safe answer and everyone knows it. The {rtitle} recovers, eventually, and so does your reputation for caution.", fx: { honor: 1, favor: 1 } },
        { t: "Lean toward the heir", r: "Your name goes on a list. If the {rtitle} recovers, it is the wrong list.", fx: { favor: -3, fame: 1, secret: 1 } },
        { t: "Send the palace a physician of your own", check: { s: "medicine", s2: "int", d: 55 },
          win: { r: "Your physician's fever-bark works where the court's did not. The {rtitle} asks the name of the house that sent it.", fx: { favor: 8, them: { op: 20 } } },
          lose: { r: "Your physician is turned away at the side gate. Someone writes down who sent him.", fx: { favor: -2, coin: -10 } } },
      ],
    },
  ]);
})();
