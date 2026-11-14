// From src/people/99993-v2-stats/j-numbers.core.js, inside the UI.barRow wrapper: the war score bar in words. Retired by
// W0 (D-052) with the bar itself.
        // a war's score (-100..100, the release's Wars and World wars pages) in words (A2 merge: a re-rolled world put a
        // war on the page and its bare "51" broke the no-numbers rule)
        if (/^(War score|Attacker's score)$/.test(l)) {
          const s = 2 * v - 100, w = s >= 60 ? 'winning outright' : s >= 25 ? 'winning' : s >= 8 ? 'ahead' : s > -8 ? 'even' : s > -25 ? 'behind' : s > -60 ? 'losing' : 'losing badly';
          return barRow.call(this, label, v, max, cls, pot, w);
        }
