// After-action reports: the war views name what decided each battle. The reports themselves need no patch:
// aar.core.js wraps the line-battle and war-map functions. (A.warYear, an older one-roll resolver, is never called.)
export default [
  {
    id: 'AAR-WAR-VIEWS',
    blob: 'ardan-core',
    why: 'The two war views listed recent battles by name and year only. Each now adds what decided it (A.aarWhy), as plain escaped text.',
    edits: [
      ['${w.battles.slice(-4).map(b=>UI.esc(b.name+" "+b.y)).join(" · ")}', '${w.battles.slice(-4).map(b=>UI.esc(b.name+" "+b.y+(A.aarWhy?A.aarWhy(b):""))).join(" · ")}'],
      ['${w.battles.slice(-3).map(b=>UI.esc(b.name+" ("+b.y+")")).join(" · ")}', '${w.battles.slice(-3).map(b=>UI.esc(b.name+" ("+b.y+")"+(A.aarWhy?A.aarWhy(b):""))).join(" · ")}'],
    ],
  },
];
