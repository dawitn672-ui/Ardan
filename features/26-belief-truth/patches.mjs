// Belief versus truth: the two news views mark far news as hearsay, and say when later word showed the count ran high.
export default [
  {
    id: 'BT-NEWS-NOTE',
    blob: 'ardan-core',
    why: 'Far news is now set down as it was first told (inflated counts) and corrected months later (belief.core.js). ' +
      'The world news list and the war room dispatches add A.BT.newsNote(n) after each line: "(hearsay)" or "(the count ran high...)".',
    edits: [
      ['A.S.news.slice(0,120).map(n=>`<div class="small" style="margin:3px 0"><span class="muted">${n.y}</span> ${UI.esc(n.t)}</div>`)',
       'A.S.news.slice(0,120).map(n=>`<div class="small" style="margin:3px 0"><span class="muted">${n.y}</span> ${UI.esc(n.t)}<span class="tiny muted">${UI.esc(A.BT?A.BT.newsNote(n):"")}</span></div>`)'],
      ['${news.map(n=>`<div class="tiny">${UI.esc(n.t)}</div>`).join("")}',
       '${news.map(n=>`<div class="tiny">${UI.esc(n.t)}<span class="muted">${UI.esc(A.BT?A.BT.newsNote(n):"")}</span></div>`).join("")}'],
    ],
  },
];
