// 97-life-fixes: a second telling for each kind of move the people you know make toward you.
// A kind of NPC move (21-npc-initiative, and the kinds 55-bonds and 64-npc-beliefs add) may now reach you twice in a
// life, ten years apart (a-memory.core.js). The second time it comes as its other telling: the same person-shaped
// situation, the same choices and consequences (shared with the first, so every follow-up still comes back), told
// another way. The queue takes the telling this life has seen least (LF.FAMILY).
// Each variant copies its first telling at load time, so it only exists where that feature is in the build. A
// telling keeps to the tokens its first telling's setup fills, and never opens a sentence with a pronoun token.
(function () {
  const LF = A.LF = A.LF || {};
  LF.FAMILY = LF.FAMILY || {};
  const T = [
    ['ni_borrow', '{them} at the gate', 'You find {them} waiting at the gate in the rain rather than knocking. It takes a long time to come out: {khis} {cause}. The sum is {amt}, back by the next harvest, on {khis} word.{past}'],
    ['ni_feud', 'A boundary stone', 'The quarrel between {them} and {foe} has gone past words: a fence burned, a dog killed. They will meet at the boundary stone at the new moon. {them} asks you to come and stand where {foe} can see you.{past}'],
    ['ni_vouch', '{them} needs a name', '{them} wants {seek}, and the people who decide want someone to speak for {khim}. Your name would carry it. If it goes wrong, they will remember who spoke.{past}'],
    ['ni_hide', 'Three nights in the loft', 'Gravel at your shutter, late. It is {them}, without a cloak, looking back down the lane. {hunt} want {khim}, and {them} swears they have the wrong of it. Three nights, no more, and nobody need know.{past}'],
    ['ni_deal', 'A share in something', '{them} has a plan and a cup of your ale, and talks with both hands: {venture}. All it lacks is {amt} from you, for half the profit by the year\'s end. Most of the plans {them} has had have come good.{past}'],
    ['ni_apprentice', 'Two evenings a week', '{them} watches you struggle at it for a while before saying anything. "That is not how {skillName} is done," comes at last, not unkindly. Through the dark months {them} could show you, two evenings a week.{past}'],
    ['ni_match', 'Two families', 'Over a cup, {them} comes round to it slowly: {mateDesc}, of an age with your {kidRel} {kid}. A good match, {them} says, and two families that stand better together than apart.{past}'],
    ['ni_slander', 'What is said about you', 'A neighbour tells you, then a carter, then the priest\'s boy: {them} is going about saying {lie}. Nobody believes it. Nobody quite forgets it either.{past}'],
    ['ni_challenge', 'Dawn, with witnesses', 'In front of the alehouse and everyone in it, {them} names {wrong}. Two friends stand at {khis} back. The terms are plain: first blood at dawn, or the name of coward in every house in {home}.{past}'],
    ['ni_theft', 'An empty purse', 'Where {amt} should be, there is nothing. No lock was forced. You go over who has been in the house, and keep coming back to {them}, who has been spending freely this month.{past}'],
    ['ni_invite', 'You are wanted', 'A message comes by a neighbour\'s child, word for word: {them} wants you at {occasion}, at the hour named. At the end the child adds, frowning to remember it, that it would not be the same without you.{past}'],
    ['ni_confide', 'A door shut first', 'Late, with the fire down, {them} gets up and shuts the door before sitting again. "Nobody else knows this," comes very quietly. {fear}'],
    ['ni_gift', '{them} brings something', '{them} leaves {gift} on your step, wrapped in sacking, and is halfway down the lane before you open the door. When you catch up, it was going to waste anyway, apparently.{past}'],
    ['bd_old_kindness', 'Not forgotten', '{them} has come with {gift} and stands turning it in both hands at your door. {hline} {them} will not hear of thanks, and then stays until the candle is out.'],
    ['bd_old_wrong', 'An old account', '{them} finds you at the market, where people can hear. {hline} {them} has carried it a long time, and wants it settled here.'],
    ['bd_kin_grudge', 'Kin of the wronged', 'Where the road goes through the trees, {them} is waiting with nobody else in sight. {hline} {them} has come a long way for this.'],
    ['bd_kin_debt', 'What is owed to the family', 'At the gate, {them} gives your name to the porter and waits. {hline} {them} has brought a small present and a larger request: {ask}.'],
    ['nb_praised', 'Your health, they say', 'In a full hall {them} stands and drinks to you, and tells everyone {tale}. Faces turn to look at you. It was not quite like that, but nobody wants to hear the true version now.'],
  ];
  const made = [];
  for (const [base, title, text] of T) {
    const b = A.EV && A.EV[base];
    if (!b || !Array.isArray(b.choices)) continue;   // the first telling's feature is not in this build (or a linter's stub)
    const id = 'lfx_' + base + '_2';
    made.push(Object.assign({}, b, { id, title, text, lfVariantOf: base }));
    LF.FAMILY[base] = (LF.FAMILY[base] || []).filter(x => x !== id).concat([id]);
  }
  if (made.length) A.defEvents(made);
})();
