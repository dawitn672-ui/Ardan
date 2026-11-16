// Round 2 B4 (D-007): descriptions open on click, never on hover. The release put a province card on the maps under the
// pointer (onmousemove, onpointermove) and clipped the answer of an activity at 140 characters; both go here.
export default [
  {
    id: 'TT-MAP-TIP-CLICK',
    blob: 'ardan-core',
    why: 'UI: the world map (MAP.bind), the Atlas-less world view (UI.gm) and the War Room showed a province card whenever the ' +
      'pointer moved over a province, which a phone never does and which the owner\'s rule (descriptions open on click, ' +
      'never on hover) forbids. The card is now made by a press on the province (the press still selects it as before); a ' +
      'second press on the same province, Esc, or a press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.',
    edits: [
      // MAP.bind: the on-mousemove card becomes a function the click calls
      ['canvas.onmousemove=ev=>{const pid=MAP.provAt(canvas,ev);if(pid<0){tip.classList.add("hidden");return}const p=A.prov(pid),r=A.realm(p.owner);let html=',
       'canvas.__mapTip=ev=>{const pid=MAP.provAt(canvas,ev);if(pid<0){tip.classList.add("hidden");canvas.__tipPid=-1;return}if(pid===canvas.__tipPid&&!tip.classList.contains("hidden")){tip.classList.add("hidden");canvas.__tipPid=-1;return}canvas.__tipPid=pid;const p=A.prov(pid),r=A.realm(p.owner);let html='],
      ['canvas.onmouseleave=()=>tip.classList.add("hidden"),canvas.onclick=ev=>{const pid=MAP.provAt(canvas,ev);',
       'canvas.onclick=ev=>{canvas.__mapTip(ev);const pid=MAP.provAt(canvas,ev);'],
      // UI.gm (the world view): the drag stays on pointermove, the card moves to the click
      ['UI.gmDraw(),tip.classList.add("hidden");return}}const pid=toProv(ev);if(pid<0){tip.classList.add("hidden");return}const p=A.prov(pid),r=A.realm(p.owner);tip.innerHTML=',
       'UI.gmDraw(),tip.classList.add("hidden");return}}},cv.__gmTip=ev=>{const pid=toProv(ev);if(pid<0){tip.classList.add("hidden");cv.__tipPid=-1;return}if(pid===cv.__tipPid&&!tip.classList.contains("hidden")){tip.classList.add("hidden");cv.__tipPid=-1;return}cv.__tipPid=pid;const p=A.prov(pid),r=A.realm(p.owner);tip.innerHTML='],
      ['tip.classList.remove("hidden")},cv.onmouseleave=()=>tip.classList.add("hidden"),cv.onclick=ev=>{if(UI.gm.dragged){UI.gm.dragged=!1;return}const pid=toProv(ev);',
       'tip.classList.remove("hidden")},cv.onclick=ev=>{if(UI.gm.dragged){UI.gm.dragged=!1;return}cv.__gmTip(ev);const pid=toProv(ev);'],
      // the War Room
      ['tip&&tip.classList.add("hidden");return}}if(ev.pointerType==="touch"||!tip)return;const pid=UI.wrProvAt(cv,ev);if(pid<0){tip.classList.add("hidden");return}tip.innerHTML=UI.wrTip(pid);',
       'tip&&tip.classList.add("hidden");return}}},cv.__wrTip=ev=>{if(!tip)return;const pid=UI.wrProvAt(cv,ev);if(pid<0){tip.classList.add("hidden");cv.__tipPid=-1;return}if(pid===cv.__tipPid&&!tip.classList.contains("hidden")){tip.classList.add("hidden");cv.__tipPid=-1;return}cv.__tipPid=pid;tip.innerHTML=UI.wrTip(pid);'],
      ['cv.onclick=ev=>{if(UI.wr.dragged){UI.wr.dragged=!1;return}const pc=A.pc(),R2=A.cmdRole(pc)',
       'cv.onclick=ev=>{if(UI.wr.dragged){UI.wr.dragged=!1;return}cv.__wrTip(ev);const pc=A.pc(),R2=A.cmdRole(pc)'],
    ],
  },
  {
    id: 'TT-WORDS-NO-HOVER',
    blob: 'ardan-core',
    why: 'UI: three lines of the release tell the player to hover (the map caption, the "Underlined words" hint, the help ' +
      'page). Nothing opens on hover any more, so they say press.',
    edits: [
      ['Hover for details, click to select a realm. Hatched', 'Tap or click a province for details and to select its realm. Hatched'],
      ['Underlined words explain themselves. Hover or tap your <b>fighting worth</b> on the left', 'Underlined words explain themselves. Tap or click your <b>fighting worth</b> on the left'],
      ['hover, tap or press Enter on them', 'tap, click or press Enter on them'],
    ],
  },
  {
    id: 'TT-ACT-RESULT-WHOLE',
    blob: 'ardan-core',
    why: 'UI: UI.A.act and UI.A.practice cut the answer of an activity at 140 and 160 characters ("…") and showed it as a ' +
      'toast. The answer is now whole: 99998-click-open puts it on the activity sheet; this keeps the release\'s own ' +
      'functions from cutting it when something calls them.',
    edits: [
      ['const r=A.doActivity("practice",k);r&&r.msg&&UI.toast(r.msg.length>160?r.msg.slice(0,157)+"…":r.msg),UI.refresh()', 'const r=A.doActivity("practice",k);r&&r.msg&&UI.toast(r.msg),UI.refresh()'],
      ['r&&r.msg&&r.ok===!1?UI.toast(r.msg):r&&r.msg&&UI.toast(r.msg.length>140?r.msg.slice(0,137)+"…":r.msg),UI.refresh()', 'r&&r.msg&&UI.toast(r.msg),UI.refresh()'],
    ],
  },
];
