// A count and its noun, singular for one (round 2 A0, docs/CRITIQUE.md E10: "1 armies in the field"). Pure.
//   A.plural(1, 'army', 'armies') -> "1 army";  A.plural(3, 'battle') -> "3 battles"
A.plural = A.plural || function (n, one, many) {
  return `${n} ${n === 1 ? one : (many || one + 's')}`;
};
