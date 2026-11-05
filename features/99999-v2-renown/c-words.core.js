// 99999-v2-renown, part 3: no merit counters in what the player reads (playtest 1 and 2: "Merit 112 / 30",
// "Merit +7.", "(merit +24)"). Merit no longer decides promotion (b-promo), so its numbers go from the text; the
// promotion boards say the standout deed in words. Renown's words are v2's renownWords (a-deeds, through VS.band).
// Rendering only: these rules run on the page's text (99993-v2-stats' sweep) and read nothing from the engine.
(function () {
  const VS = A.V2S;
  if (!VS || !Array.isArray(VS.NUMRULES)) return;
  VS.NUMRULES.unshift(
    // "Your superiors notice the extra hours. (Merit +15)", "(merit +24)"
    [/\s?\((?:[Mm]erit) [+−-]\s?\d+\)/g, () => ''],
    // "... 102 fall. Merit +7." and "Merit +24." in a mission's or a battle's log
    [/\s?\bMerit [+−-]\s?\d+\.?/g, () => ''],
    // a counter left anywhere: "Merit 112 / 30", "Merit in your post 36 / 47"
    [/\bMerit(?: in your post)?:? \d+\s?\/\s?\d+\b/g, () => 'Standing for the next rank: in the board\'s hands'],
  );
})();
