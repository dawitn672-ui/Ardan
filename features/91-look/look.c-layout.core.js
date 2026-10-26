// 91-look, part 3: the layout (brief §4) and the pieces that live in it: the rail (identity, vitals, stat tiles, needs),
// the Life panel (What now, Your days, Activities as a tile grid) and the phone's Life page.
//
//   >= 1600 px  three columns, roomy:  300 / minmax(560px, 1fr) / 600, gap 12, padding 16, at most 1760 wide
//   1100-1599   three columns, compact: 248 / flexible / 488 (at 1366 x 768 every column is 700 px tall)
//   761-1099    two columns: the rail becomes an identity strip over the story, its full self a sheet on demand
//   <= 760      the phone, as 71-phone draws it (44 px targets, 14 px text floor)
(function () {
  const LOOK = UI.LOOK, X = LOOK.X, T = LOOK.T;
  const D = '#game:not(.phone)';   // desktop only: never touches 71-phone's layout
  LOOK.css.layout = `
@media (min-width:761px){
  ${D}{grid-template-columns:248px minmax(0,1fr) 488px;grid-template-rows:44px minmax(0,1fr);gap:8px;padding:8px;height:100vh;min-height:0}
  ${D} #side{grid-column:auto;min-height:0}
  ${D} #logwrap{height:auto;min-height:0}
  ${D} #topbar{min-height:44px;height:44px;padding:0 10px;gap:10px;align-items:center;flex-wrap:nowrap;border-radius:var(--r-m)}
  ${D} #topbar button{min-height:32px;height:32px;padding:0 10px}
  ${D} #topbar button.primary{min-height:32px;padding:0 16px}
  ${D} #topbar .clk{gap:6px;flex-wrap:nowrap}
  ${D} #topbar .clk-spd button{min-width:30px;min-height:30px;height:30px;padding:0 4px}
  ${D} #topbar .top-right{gap:6px}
  ${D} #topbar .info{gap:12px}
  /* the story: a sunken well, the only thing on the Life screen that scrolls */
  ${D} #logwrap{background:var(--surface)}
  ${D} #log{background:var(--sunken);margin:8px;border-radius:var(--r-m);padding:16px 16px 12px;border:1px solid var(--line)}
  ${D} #agebar{background:transparent;border-top:1px solid var(--line)}
  /* the rail */
  ${D} #profile{padding:10px 10px;display:flex;flex-direction:column;gap:8px;overflow:auto}
  ${D} #profile > *{flex:none;margin:0}
  ${D} #side > #tabbody{padding:4px 12px 8px}
}
/* 1100-1279: the same three columns, a little narrower at the sides (240 / flexible / 440) */
@media (min-width:1100px) and (max-width:1279px){
  ${D}{grid-template-columns:240px minmax(0,1fr) 440px}
}
.lk-railbtn{display:none}
/* >= 1600: roomy */
@media (min-width:1600px){
  ${D}{grid-template-columns:300px minmax(560px,1fr) 600px;grid-template-rows:52px minmax(0,1fr);gap:12px;padding:16px;max-width:1760px;margin:0 auto}
  ${D} #topbar{height:52px;min-height:52px}
  ${D} #profile{padding:16px}
  ${D} #side > #tabbody{padding:12px 16px}
  ${D} #log{padding:20px 24px 16px}
  /* three columns, not the brief's four: at four the 140 px tiles cut a third of their labels */
  ${D} .lk-acts{grid-template-columns:repeat(3,minmax(0,1fr))}
  ${D} .lk-acts > .act{min-height:34px}
}

/* ---- the rail (brief §4.1: identity 112, chips 24, vitals 72, stats 80, needs 48, proficiencies, body, buttons) */
${D} #profile .fold-pid{display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;align-items:start;margin:0}
${D} #profile .fold-pid .portrait-wrap{display:none}
.lk-bust{position:relative;width:88px;height:88px;flex:none;isolation:isolate}
.lk-bust::before{content:"";position:absolute;inset:-1.5px;z-index:-1;background:var(--line-strong);clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut))}
.lk-bust svg{display:block;width:100%;height:100%;clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut))}
.lk-bust.lk-ruler::before{background:var(--r-legendary);inset:-2px}
.lk-bust.lk-noble::before{background:var(--accent);inset:-2px}
${D} #profile .fold-pid-t{min-width:0;display:flex;flex-direction:column;gap:2px;padding-top:2px}
${D} #profile .fold-pid-t .pname{text-align:left;font-size:var(--t-name);line-height:1.25;overflow-wrap:anywhere}
${D} #profile .fold-pid-t .ptitle{text-align:left;font-size:var(--t-small);line-height:var(--lh-small);color:var(--ink-2);margin:0}
${D} #profile .lk-rank{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
${D} #profile .lk-chips{display:flex;flex-wrap:nowrap;gap:4px;overflow:hidden;align-items:center;text-align:left;justify-content:flex-start;margin:0 !important;min-height:24px}
${D} #profile .lk-chips.lk-open{flex-wrap:wrap}
${D} #profile .lk-chips > .chip{flex:none;white-space:nowrap}
${D} #profile .lk-chips > .chip.lk-cut{display:none}
${D} #profile .lk-chips.lk-open > .chip.lk-cut{display:inline-flex}
${X('.chip.lk-more')}{border-style:dashed;color:var(--ink-2);background:transparent;cursor:pointer;min-height:22px;font-family:var(--f-ui)}
${X('.chip.lk-more:hover')}{color:var(--accent);border-color:var(--accent)}
${D} #profile > .sep, ${D} #profile > .tiny.muted{display:none}
/* vitals: 2 columns x 3 rows of 24 */
${D} #profile .lk-vitals{display:grid;grid-template-columns:1fr 1fr;column-gap:12px;row-gap:0}
${D} #profile .lk-vitals .barrow{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:'l v' 'b b';grid-template-rows:24px 3px;row-gap:0;margin:0 0 2px;align-content:center;font-size:var(--t-small);line-height:1.2}
${D} #profile .lk-vitals .barrow > .lbl{grid-area:l;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
${D} #profile .lk-vitals .barrow > .lbl .tt, ${D} #profile .lk-vitals .barrow > .val[data-tt]{min-height:24px;display:inline-flex;align-items:center}
${D} #profile .lk-vitals .barrow > .val{grid-area:v;font-weight:700;font-size:var(--t-small);color:var(--ink);min-width:24px;justify-content:flex-end;text-align:right}
${D} #profile .lk-vitals .barrow > .bar{grid-area:b;height:3px}
.lk-vitals .bar > i{background:var(--vital)}
.lk-vitals .lk-v-health .bar > i{background:var(--vital-health)}
.lk-vitals .lk-v-renown .bar > i{background:var(--accent)}
${X('.lk-low > .val, .lk-low > .val *')}{color:var(--danger)}
.lk-low > .val::after{content:" ▼";font-size:.8em}
/* the six stats: 3 x 2 tiles of 72 x 36, one colour and one icon each (brief §1.3, §5.4) */
${D} #profile .lk-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}
${D} #profile .lk-stats .barrow{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:'i l v';align-items:center;column-gap:3px;margin:0;height:36px;padding:0 4px 5px;
  background:var(--raised);border:1px solid var(--line);border-radius:var(--r-s);font-size:var(--t-cap);line-height:1}
${D} #profile .lk-stats .barrow > .lk-si{grid-area:i;color:var(--sc);display:inline-flex}
${D} #profile .lk-stats .barrow > .lk-si svg{width:13px;height:13px}
${D} #profile .lk-stats .barrow > .lbl{grid-area:l;font-weight:700;letter-spacing:0;text-transform:uppercase;color:var(--ink-2);overflow:visible;white-space:nowrap}
${D} #profile .lk-stats .barrow > .lbl .tipt, ${D} #profile .lk-stats .barrow > .lbl .tt{min-height:0;border-bottom:0}
${D} #profile .lk-stats .barrow > .val{grid-area:v;font-size:${T(18)};line-height:1;font-weight:700;color:var(--sc);text-align:right;letter-spacing:-.02em}
${D} #profile .lk-stats .barrow > .bar{position:absolute;left:5px;right:5px;bottom:4px;height:3px;background:var(--sunken)}
${D} #profile .lk-stats .barrow > .bar > i{background:var(--sc)}
${D} #profile .lk-stats .barrow:hover{border-color:var(--sc)}
.st-str{--sc:var(--st-str)}.st-spd{--sc:var(--st-spd)}.st-ins{--sc:var(--st-ins)}.st-sta{--sc:var(--st-sta)}.st-int{--sc:var(--st-int)}.st-wil{--sc:var(--st-wil)}
/* the four needs of 35-moods, moved here from the Life tab: 2 x 2 rows of 24 */
.lk-needs{display:grid;grid-template-columns:1fr 1fr;column-gap:12px}
.lk-needs .lk-need{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:'l v' 'b b';grid-template-rows:24px 3px;row-gap:0;margin:0 0 2px;align-content:center;font-size:var(--t-small);line-height:1.2}
.lk-needs .lk-need > .lbl{grid-area:l;color:var(--ink-2)}
.lk-needs .lk-need > .lbl .tt{min-height:24px;display:inline-flex;align-items:center}
.lk-needs .lk-need > .val{grid-area:v;font-weight:700;min-width:24px;min-height:24px;display:inline-flex;align-items:center;justify-content:flex-end}
.lk-needs .lk-need > .bar{grid-area:b;height:3px}
.lk-needs .lk-need > .bar > i{background:var(--vital)}
.lk-needs .lk-need.lk-low > .bar > i{background:var(--danger)}
.lk-needs .lk-mood{grid-column:1 / -1;font-size:var(--t-small);color:var(--warn);line-height:1.3;margin-top:2px}
.lk-needs .lk-mood.ok{color:var(--ok)}
.lk-needs .lk-nh{grid-column:1 / -1;display:flex;align-items:center;gap:8px;min-height:24px}
.lk-needs .lk-nh .tt{min-height:24px}
.lk-needs .lk-nh .tag{color:var(--ink-3)}
/* proficiencies and the buttons */
${D} #profile .profs .prow{grid-template-columns:minmax(0,1fr) 28px 64px;min-height:24px;padding:0;align-content:center;font-size:var(--t-small);line-height:1.2;row-gap:2px}
${D} #profile .profs .prow .tier{font-size:var(--t-cap);color:var(--ink-3);opacity:1}
${D} #profile .fold > .fold-b{padding:0 0 var(--sp-1)}
${D} #profile .fold{border-top:1px solid var(--line)}
${D} #profile .bm-body svg{width:40px;height:auto}
${D} #profile .bm-body{min-height:40px}
.lk-railrow{display:flex;gap:4px;flex-wrap:wrap}
.lk-railrow button{flex:1 1 auto;min-height:28px;padding:0 8px;font-size:var(--t-small)}
@media (min-width:1600px){
  ${D} #profile .fold-pid{grid-template-columns:1fr;justify-items:start}
  ${D} #profile .fold-pid .portrait-wrap{display:block;width:176px;margin:0}
  ${D} #profile .fold-pid .portrait-wrap svg{width:176px;max-width:none;height:auto}
  ${D} #profile .lk-bust{display:none}
  ${D} #profile .lk-stats .barrow{height:40px}
}

/* ---- the Life panel at 1100 px and up: nothing scrolls but the story; Activities takes what height is left and
   scrolls inside its own section when the player opens Your days (brief §4.1) */
@media (min-width:761px){
  ${D} #tabbody.lk-life{display:flex;flex-direction:column}
  ${D} #tabbody.lk-life > *{flex:none}
  ${D} #tabbody.lk-life > .fold-acts{flex:1 1 auto;min-height:150px;display:flex;flex-direction:column}
  ${D} #tabbody.lk-life > .fold-acts > .fold-head{flex:none}
  ${D} #tabbody.lk-life > .fold-acts > .fold-b{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 2px 4px;margin:0 -2px;overscroll-behavior:contain}
  ${D} #tabbody.lk-life > .fold-acts:not(.open){flex:none;min-height:0}
  ${D} #tabbody.lk-life > .moods, ${D} #tabbody.lk-life > .lk-ini, ${D} #tabbody.lk-life > .fold-tools{display:none}
  ${D} #tabbody.lk-life > .fold:first-of-type, ${D} #tabbody.lk-life > .fold-card:first-child{border-top:0}
}
@media (min-width:761px){
  ${X('#game:not(.phone) .fold > .fold-head')}{min-height:30px}
  ${X('#game:not(.phone) .fold-card > .fold-x')}{height:30px}
  ${X('#game:not(.phone) .fold-card > .fold-x + *')}{min-height:30px}
}
/* What now: a header and three rows of 32 */
${X('#tabbody .whatnow')}{padding:0 0 6px;margin:0}
${X('.whatnow .wn-h')}{min-height:30px;display:flex;align-items:center;gap:6px;padding-left:22px}
${X('.whatnow .wn-list')}{gap:4px;grid-template-columns:minmax(0,1fr)}
${X('.whatnow .wn-list > li')}{min-width:0}
${D} .wn-item{min-height:32px;padding:3px 10px 3px 6px;gap:8px;width:100%;max-width:100%}
${D} .wn-item .wn-n{flex:0 0 20px;height:20px;font-size:var(--t-cap)}
${D} .wn-item .wn-t{flex-direction:row;align-items:baseline;gap:8px;min-width:0;overflow:hidden}
${D} .wn-item .wn-t b{flex:none;white-space:nowrap;font-size:var(--t-ui)}
${D} .wn-item .wn-why{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* Your days, folded to its own summary: a header row of 32 */
${X('.plan-card > .row:first-of-type, .plan-card > .fold-x + .row')}{gap:8px;flex-wrap:nowrap;min-height:32px}
${X('.plan-card > .fold-x + .row > .tag')}{color:var(--ink-2)}
${X('.plan-card > .fold-x + .row > b')}{font-size:var(--t-ui);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
${X('.plan-card > .fold-x + .row > .tiny')}{white-space:nowrap;margin-left:auto;flex:none}
${X('.plan-card')}{padding:0 0 var(--sp-2)}
${X('.plan-card .lk-yd-head > .lk-yd-sel')}{flex:0 1 200px;min-width:150px}
${X('.plan-card .lk-yd-head > .lk-yd-sel select')}{width:100%;min-height:28px;height:28px;padding:0 26px 0 8px;font-size:var(--t-small)}
${X('.plan-card .lk-yd-head > b')}{flex:1 1 auto}
${X('.plan-grid > .lk-vh')}{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
#game.phone .plan-card .lk-yd-head > .lk-yd-sel select{height:44px;min-height:44px;font-size:${T(15)}}
#game.phone .plan-card .lk-yd-head{flex-wrap:wrap;row-gap:4px;padding-top:0;padding-bottom:0}
#game.phone .plan-card .lk-yd-head > b, #game.phone .plan-card .lk-yd-head > .tiny{display:none}
#game.phone .plan-card .lk-yd-head > .lk-yd-sel{flex:1 1 160px}
${X('.plan-grid')}{grid-template-columns:84px 1fr;gap:4px 10px;margin-top:4px}
${X('.plan-grid select')}{min-height:32px}
${X('.plan-card .barrow')}{grid-template-columns:96px minmax(0,1fr) auto}
${X('.plan-grid .seg button')}{min-height:30px}

/* ---- Activities (brief §5.6): one grid of tiles; the description is in each tile's tooltip */
${X('.lk-acts')}{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px 4px;align-content:start}
${X('.lk-acts > .act')}{position:relative;display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;column-gap:6px;min-height:32px;height:auto;padding:1px 6px 1px 7px;text-align:left;
  background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);box-shadow:var(--e-1);color:var(--ink)}
${X('.lk-acts > .act > .lk-gi')}{grid-column:1;grid-row:1;display:inline-flex;color:var(--ink-3)}
${X('.lk-acts > .act > .lk-gi svg')}{width:16px;height:16px}
${X('.lk-acts > .act > .an')}{grid-column:2;grid-row:1;font-size:var(--t-small);font-weight:600;line-height:1.08;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
${X('.lk-acts > .act > .cost')}{grid-column:3;grid-row:1;float:none;margin:0;font-size:var(--t-cap);font-weight:700;color:var(--ink-2);font-variant-numeric:tabular-nums}
${X('.lk-acts > .act > .cost.lk-free')}{color:var(--ok)}
${X('.lk-acts > .act > .ad')}{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;margin:0}
${X('.lk-acts > .act:hover:not(:disabled)')}{background:var(--raised);border-color:var(--accent);color:var(--accent)}
${X('.lk-acts > .act:hover:not(:disabled) > .lk-gi')}{color:var(--accent)}
${X('.lk-acts > .act:active:not(:disabled)')}{background:var(--sunken);transform:none}
${X('.lk-acts > .act:disabled')}{color:var(--ink-3);background:var(--surface);box-shadow:none;cursor:not-allowed}
${X('.lk-acts > .act.lk-now')}{box-shadow:inset 2px 0 0 var(--accent), var(--e-1)}
${X('.lk-acts > .act.lk-gstart')}{}
/* other tabs' actions (at work, the council): cards with their description, on the new surfaces */
${X('.acts:not(.lk-acts) > .act')}{background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);box-shadow:var(--e-1);padding:6px 10px}
${X('.acts:not(.lk-acts) > .act .an')}{font-size:var(--t-ui);font-weight:600}
${X('.acts:not(.lk-acts) > .act .ad')}{font-size:var(--t-small);color:var(--ink-3)}
${X('.acts:not(.lk-acts) > .act .cost')}{font-size:var(--t-cap);color:var(--ink-2)}
${X('.acts:not(.lk-acts) > .act:hover:not(:disabled)')}{border-color:var(--accent);color:var(--ink)}

/* ---- the phone's Life page (brief §4.4): What now as one row, Your days folded, the activities as tiles of 44.
   Three columns, not the brief's two: two columns of 31 tiles made the page 1.45 screens; three make it about 1.15. */
@media (max-width:760px){
  #game.phone .lk-acts{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}
  #game.phone .lk-acts > .act{display:block;min-height:44px;padding:4px 6px;line-height:1.15}
  #game.phone #tabbody > .fold-acts > .fold-b{padding-bottom:4px}
  #game.phone #tabbody > .fold-card.folded{padding-bottom:0}
  #game.phone #tabbody > .whatnow{padding-bottom:0}
  #game.phone .lk-acts > .act > .lk-gi{display:none}
  #game.phone .lk-acts > .act > .an{display:inline;font-size:${T(14)};line-height:1.15;-webkit-line-clamp:unset}
  #game.phone .lk-acts > .act > .cost{float:right;margin:1px 0 0 4px;font-size:${T(14)};line-height:1.15}
  #game.phone #tabbody > .moods, #game.phone #tabbody > .lk-ini{display:none}
  #game.phone .whatnow{padding:0;border:0}
  #game.phone .whatnow > .fold-x, #game.phone .whatnow > .wn-h{display:none}
  #game.phone .whatnow .wn-list > li:not(:first-child){display:none}
  #game.phone .whatnow .wn-item{min-height:44px;padding:4px 10px 4px 6px}
  #game.phone .whatnow .wn-item .wn-t{flex-direction:row;align-items:baseline;gap:6px;min-width:0}
  #game.phone .whatnow .wn-item .wn-t b::before{content:"Next: ";color:var(--ink-3);font-weight:600}
  #game.phone .whatnow .wn-item .wn-why{display:none}
  #game.phone .ph-you{margin:0 0 6px;padding:2px 10px 2px 4px}
  #game.phone .fold > .fold-head{min-height:44px}
  #game.phone .fold-card > .fold-x{height:44px}
  #game.phone .fold-card > .fold-x + *{min-height:44px}
  #game.phone .fold-sum{font-size:${T(14)}}
  #game.phone .fold-tools .ghost{min-height:44px}
  #game.phone .lk-needs{margin:8px 0}
  #game.phone .lk-needs .lk-need{grid-template-rows:auto 3px;row-gap:2px}
  #game.phone #tabbody.lk-plife > .fold-tools{display:none}
  /* the first-run hint rides above the dock, over the page, until the player dismisses it */
  #game.phone #tabbody > .hint{position:fixed;left:8px;right:8px;bottom:calc(128px + env(safe-area-inset-bottom, 0px));z-index:46;margin:0;background:var(--overlay);border:1px solid var(--accent);box-shadow:var(--e-3)}
  #game.phone #tabbody > .whatnow + *{border-top:0}
  /* 71-phone's floors on the screens outside the game (the new life) and for glossary chips (24 px) */
  #app summary{min-height:44px;display:flex;align-items:center}
  ${X('#game.phone .chip, #modal .chip')}{min-height:24px}
  /* the event sheet: prose at 16 / 25 (brief §4.4) */
  #modal.ph-sheet .mtext{font-size:var(--t-prose);line-height:var(--lh-prose)}
}
/* 761-1099: two columns; the rail is a strip over the story, the full rail a sheet (the Stats button) */
@media (min-width:761px) and (max-width:1099px){
  ${D}{grid-template-columns:minmax(0,1fr) 440px;grid-template-rows:auto auto minmax(0,1fr);height:100vh;grid-template-areas:"top top" "rail side" "log side"}
  ${D} #topbar{grid-area:top;height:auto;min-height:44px;flex-wrap:wrap;padding:4px 10px}
  ${D} #profile.panel{grid-area:rail;position:relative;overflow:visible;display:grid;grid-template-columns:48px minmax(0,1fr) auto;grid-template-rows:auto auto;align-items:center;gap:2px 12px;padding:8px 12px;min-height:64px;z-index:20}
  ${D} #profile.panel > :not(.fold-pid):not(.lk-vitals):not(.lk-railbtn){display:none}
  ${D} #profile.panel > .fold-pid{display:contents}
  ${D} #profile.panel .lk-bust{grid-column:1;grid-row:1 / span 2;width:48px;height:48px}
  ${D} #profile.panel .fold-pid-t{grid-column:2;grid-row:1;display:flex;flex-direction:row;align-items:baseline;gap:10px;min-width:0;padding:0}
  ${D} #profile.panel .fold-pid-t .pname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:var(--t-h3)}
  ${D} #profile.panel .fold-pid-t > :not(.pname):not(.ptitle){display:none}
  ${D} #profile.panel > .lk-vitals{grid-column:2;grid-row:2;display:flex;gap:16px}
  ${D} #profile.panel > .lk-vitals > .barrow:not(.lk-v-health):not(.lk-v-happiness){display:none}
  ${D} #profile.panel > .lk-vitals > .barrow{width:120px}
  ${D} #profile.panel > .lk-railbtn{grid-column:3;grid-row:1 / span 2;display:inline-flex}
  ${D} #logwrap{grid-area:log}
  ${D} #side{grid-area:side}
  /* the sheet */
  #game.lk-rail-open:not(.phone) #profile{display:flex;flex-direction:column;align-items:stretch;position:absolute;left:8px;top:56px;width:min(340px,calc(100vw - 480px));max-height:calc(100vh - 72px);overflow:auto;box-shadow:var(--e-3);z-index:40}
  #game.lk-rail-open:not(.phone) #profile > *{display:revert}
  #game.lk-rail-open:not(.phone) #profile > .fold-pid{display:grid}
  #game.lk-rail-open:not(.phone) #profile > .lk-vitals, #game.lk-rail-open:not(.phone) #profile > .lk-stats, #game.lk-rail-open:not(.phone) #profile > .lk-needs{display:grid}
  #game.lk-rail-open:not(.phone) #profile .fold-pid-t > *{display:revert}
  #game.lk-rail-open:not(.phone) #profile > .lk-railbtn{position:absolute;right:8px;top:8px}
  ${D} .lk-acts{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;
})();
