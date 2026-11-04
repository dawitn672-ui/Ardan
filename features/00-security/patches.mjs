// Security: exact find/replace edits on the minified build. See README.md.
export default [
  {
    id: 'SEC-CSP',
    blob: 'html',
    why: 'Content-Security-Policy: only the page\'s own inline scripts (by hash) and the scripts they create may run. ' +
      'Injected inline handlers (onerror=, onclick=) and injected <script> tags are blocked, whatever slips into the markup.',
    edits: [[
      '<meta charset="utf-8">\n',
      '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src __SCRIPT_HASHES__ \'strict-dynamic\'; ' +
        'style-src \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; ' +
        'connect-src data: blob:; base-uri \'none\'; form-action \'none\'; object-src \'none\'">\n',
    ]],
  },
  {
    id: 'SEC-SAVE-CLEAN',
    blob: 'ardan-core',
    why: 'A loaded save is untrusted (players swap files; the checksum anyone can recompute). Before a save is entered, ' +
      'strip < and > from every string and key (no game text uses them), strip " from everything except prose fields, ' +
      'and force log line classes, years and ages into safe shapes. Closes the script injection through the story log, ' +
      'realm colours, ids in data-v attributes and portrait colours.',
    edits: [[
      ',UI.enterSave=function(d){return UI.clkStop&&',
      ',SAVES.clean=function(d){const PROSE=/^(lines|primer|t|text|desc|manner|wants|fears|looks|famNote|occ|famRole|title|history)$/,' +
        'fix=(s,prose)=>(s=s.replace(/[<>]/g,""),prose?s:s.replace(/"/g,"")),' +
        'walk=(v,prose,depth)=>{if(typeof v=="string")return fix(v,prose);if(!v||typeof v!="object"||depth>80)return v;' +
        'if(Array.isArray(v)){for(let i=0;i<v.length;i++)v[i]=walk(v[i],prose,depth+1);return v}' +
        'for(const k of Object.keys(v)){const val=walk(v[k],prose||PROSE.test(k),depth+1),ck=fix(k,!1);ck!==k?(delete v[k],ck&&(v[ck]=val)):v[k]=val}return v};' +
        'if(d&&d.S){walk(d.S,!1,0);for(const e of Array.isArray(d.S.log)?d.S.log:[])if(e&&typeof e=="object"){e.year=+e.year||0,e.age=+e.age||0;' +
        'for(const l of Array.isArray(e.lines)?e.lines:[])Array.isArray(l)&&typeof l[1]=="string"&&!/^[\\w -]*$/.test(l[1])&&(l[1]="")}}' +
        'return d&&d.meta&&walk(d.meta,!1,0),d},' +
        'UI.enterSaveSafe=function(d){try{return UI.enterSave(d)}catch(e){return console.error(e),UI.noteError&&UI.noteError(e,"load"),' +
        'UI.clkStop&&UI.clkStop(),UI.screen="title",UI.ov=null,UI.render(),UI.toast("That save could not be opened: "+(e&&e.message||e)+"."),!1}},' +
        'UI.enterSave=function(d){return SAVES.clean(d),UI.clkStop&&',
    ], [
      'd: "+e.message+"."),!1}return UI.enterSave(d)},UI.continueGame=',
      'd: "+e.message+"."),!1}return UI.enterSaveSafe(d)},UI.continueGame=',
    ], [
      'return d?d.S?UI.enterSave(d):(UI.toast("Every save',
      'return d?d.S?UI.enterSaveSafe(d):(UI.toast("Every save',
    ]],
  },
  {
    id: 'SEC-LOG-CLASS',
    blob: 'ardan-core',
    why: 'Escape the story-log line class where it is written into markup (second layer behind SEC-SAVE-CLEAN).',
    edits: [['class="ll ${c}">', 'class="ll ${UI.esc(c)}">']],
  },
];
