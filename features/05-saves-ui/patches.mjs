// Saves and keyboard: exact find/replace edits on the minified build. See README.md.
export default [
  {
    id: 'SAVE-WARN',
    blob: 'ardan-core',
    why: 'Every autosave was silent, including failures (quota, aborted transaction), so a player could lose years without a word. ' +
      'A failed autosave now warns (at most once every 2 minutes). A manual save also asks the browser to keep the site\'s storage ' +
      '(Safari otherwise clears it after 7 days away).',
    edits: [[
      'return r.ok&&UI.ptTick&&UI.ptTick("saved",!0),silent||UI.toast(r.ok?`Saved (${r.kb} KB).`:"This browser would not keep the save — use Menu → Export to keep it as a file."),r.ok}',
      'return r.ok&&UI.ptTick&&UI.ptTick("saved",!0),!silent&&typeof navigator<"u"&&navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{}),' +
        '(!silent||!r.ok&&Date.now()-(UI._saveWarn||0)>12e4&&(UI._saveWarn=Date.now()))&&UI.toast(r.ok?`Saved (${r.kb} KB).`:r.blocked?' +
        '"Ardan is open in another tab, so this tab is not saving. Close the other tab to save here.":' +
        '"This browser would not keep the save — use Menu → Export to keep it as a file.",r.ok?void 0:7e3),r.ok}',
    ]],
  },
  {
    id: 'SAVE-ONE-TAB',
    blob: 'ardan-core',
    why: 'Two tabs shared one save slot with no lock, so within about 3 autosaves one life overwrote the other. A Web Lock now ' +
      'lets one tab save at a time; a second tab says so, does not save, and takes over when the first one closes.',
    edits: [[
      ',SAVES.init=async function(){await SAVES.open();',
      ',SAVES.lock=function(){const L=typeof navigator<"u"&&navigator.locks;if(!L||SAVES.lockTried)return Promise.resolve();SAVES.lockTried=!0;' +
        'return new Promise(res=>{L.request("ardan-saves",{ifAvailable:!0},lk=>{if(lk)return SAVES.blocked=!1,res(),new Promise(()=>{});' +
        'SAVES.blocked=!0,res(),setTimeout(()=>UI.toast&&UI.toast("Ardan is already open in another tab. This tab will not save, so that game stays safe.",8e3),1500);' +
        'L.request("ardan-saves",()=>(SAVES.blocked=!1,UI.toast&&UI.toast("The other Ardan tab closed. This tab saves again."),new Promise(()=>{}))).catch(()=>{});return null}).catch(()=>{SAVES.blocked=!1,res()})})},' +
        'SAVES.init=async function(){await SAVES.lock();await SAVES.open();',
    ], [
      'SAVES.save=async function(S,J){const{bytes,meta}=',
      'SAVES.save=async function(S,J){if(SAVES.blocked)return{ok:!1,blocked:!0,kb:0};const{bytes,meta}=',
    ]],
  },
  {
    id: 'SAVE-NEW-LIFE-CONFIRM',
    blob: 'ardan-core',
    why: 'Starting a new life (Begin or Random) gave no warning, and three yearly autosaves later the previous life had rotated ' +
      'out of all backups. If the saved life is still going, the game now asks first and says how to keep it.',
    edits: [[
      'UI.startLife=function(){const c=UI.cr;',
      'UI.startLife=function(){if(!UI._newLifeOk){const cur=(SAVES.listCache||[]).find(x=>x&&x.slot==="cur"),m=cur&&cur.meta;' +
        'if(m&&m.alive){UI.confirm({title:"Start a new life?",text:`Your saved life (${m.name||"unnamed"}, age ${m.age}, ${m.year} AR) is still going. ' +
        'This browser keeps one life: after a few years of the new one, autosaves will push the old one out. To keep it, go back, ' +
        'continue it, and use Menu → Export first.`,yes:"Start the new life",danger:!0,run:()=>{UI._newLifeOk=!0;try{UI.startLife()}finally{UI._newLifeOk=!1}}});return}}const c=UI.cr;',
    ]],
  },
  {
    id: 'SAVE-BACKUP-MESSAGE',
    blob: 'ardan-core',
    why: 'Loading an older backup on purpose from the Menu said "The newest save was damaged".',
    edits: [[
      'd={S:null,damaged:[{why:e.message}]}}return d?d.S?UI.enterSaveSafe(d)',
      'd={S:null,damaged:[{why:e.message}]}}slot&&d&&(d.chosen=!0);return d?d.S?UI.enterSaveSafe(d)',
    ], [
      'UI.toast(d.slot&&d.slot!=="cur"?"The newest save was damaged — loaded the one before it.":"Welcome back to Ardan.")',
      'UI.toast(d.slot&&d.slot!=="cur"&&!d.chosen?"The newest save was damaged — loaded the one before it.":"Welcome back to Ardan.")',
    ]],
  },
  {
    id: 'UI-KEYBOARD',
    blob: 'ardan-core',
    why: 'Keyboard play. (1) The 1.5 s clock redraw and every action rebuilt the tab with innerHTML, dropping focus to <body>; ' +
      'focus now returns to the same control, or to the tab panel if that control is gone. (2) Enter then skipped time from <body>; ' +
      'it now skips time only when nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, ' +
      'every character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and role=button ' +
      'and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no longer loses up to a year.',
    edits: [[
      'UI.clockKeys&&UI.clockKeys(),UI.render()},UI.TIPS={}',
      'UI.clockKeys&&UI.clockKeys(),UI.extras(),UI.render()},' +
        'UI.focusKey=()=>{const el=document.activeElement;return!el||el===document.body||!el.closest||!el.closest("#app")?null:' +
        '{id:el.id||null,a:el.getAttribute("data-a"),v:el.getAttribute("data-v"),c:el.getAttribute("data-c"),k:el.getAttribute("data-k"),tip:el.getAttribute("data-tip"),inTab:!!el.closest("#tabbody")}},' +
        'UI.focusRestore=f=>{if(!f)return;const ae=document.activeElement;if(ae&&ae!==document.body&&document.contains(ae))return;const q=x=>CSS.escape(x);' +
        'const sel=f.id?"#"+q(f.id):f.a?`[data-a="${q(f.a)}"]`+(f.v!=null?`[data-v="${q(f.v)}"]`:""):f.c?`[data-c="${q(f.c)}"]`+(f.k!=null?`[data-k="${q(f.k)}"]`:""):f.tip?`[data-tip="${q(f.tip)}"]`:null;' +
        'let el=null;try{el=sel&&document.querySelector(sel)}catch{}if(!el&&f.inTab&&(el=document.getElementById("tabbody"),el&&!el.hasAttribute("tabindex")&&el.setAttribute("tabindex","-1")),el)try{el.focus({preventScroll:!0})}catch{}},' +
        'UI.extras=function(){if(UI._extras)return;UI._extras=!0;' +
        'document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&UI.screen==="game"&&A.S&&UI.set.autosave&&UI.save(!0)});' +
        'const up=()=>{for(const el of document.querySelectorAll("#app [data-a]:not(button):not(a):not(input):not(select):not(textarea):not(option):not([tabindex])"))el.setAttribute("tabindex","0"),el.hasAttribute("role")||el.setAttribute("role","button")};' +
        'new MutationObserver(up).observe(document.body,{childList:!0,subtree:!0}),up();' +
        'document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;t&&t.matches&&t.matches("[data-a][role=button]:not(button)")&&(e.preventDefault(),e.stopImmediatePropagation(),t.click())},!0)},' +
        'UI.TIPS={}',
    ], [
      '!UI.isControl(e.target)&&(e.preventDefault(),UI.A.age())',
      '!UI.isControl(e.target)&&e.target===document.body&&(e.preventDefault(),UI.A.age())',
    ], [
      'UI.refreshTab=function(){const tb=UI.$("#tabbody");if(!tb)return;const st=tb.scrollTop;',
      'UI.refreshTab=function(){const tb=UI.$("#tabbody");if(!tb)return;const st=tb.scrollTop,_f=UI.focusKey();',
    ], [
      'tb.innerHTML=UI.renderTab(),tb.scrollTop=st;',
      'tb.innerHTML=UI.renderTab(),tb.scrollTop=st,UI.focusRestore(_f);',
    ], [
      'UI.render();return}const pf=UI.$("#profile");',
      'UI.render();return}const _f=UI.focusKey(),pf=UI.$("#profile");',
    ], [
      'const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight)}UI.renderModal()}',
      'const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight),UI.focusRestore(_f)}UI.renderModal()}',
    ]],
  },
];
