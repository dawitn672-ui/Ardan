// Ardan's own icons (docs/design/brief.md §7.4): about forty period objects on a 24 x 24 grid, drawn at 16, 20 and 24
// px. Every icon is a stroke drawing in currentColor (the release's .ic class sets the 1.75 stroke, round caps and
// joins), with at most one filled accent shape, lit from the upper left. They live in one registry, UI.ICONSET, with
// a label for each, and go where the brief names: the six stats, the six vitals, the purse and the clock, the 13 groups
// of the Life tab, the six tabs, and the controls. Each one keeps its word beside it the first time it appears, and its
// tooltip carries the icon and the word together.
//
// The release draws icons with UI.icon(name), from UI.ICONS (Lucide outlines). This feature adds its names to that
// registry and redraws the release's names it covers (coins, users, swords ...), so every place that already asks for
// one of them gets the new drawing with no patch. Drawing only: no A.rand, no change to A.S.
(function () {
  const A_ = (d, o = '') => `<path d="${d}" fill="currentColor" stroke="none"${o}/>`;   // the one filled accent shape
  const P = d => `<path d="${d}"/>`;
  const C = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  // [name, label, group, svg]
  const SET = [
    // ---- the six stats (brief §1.3)
    ['fist', 'Strength', 'stat', P('M6.5 10.2V8.3a1.5 1.5 0 0 1 3 0v-.6a1.5 1.5 0 0 1 3 0v.3a1.5 1.5 0 0 1 3 0v.6a1.5 1.5 0 0 1 3 0V14a6.5 6.5 0 0 1-6.5 6.5h-1A5.5 5.5 0 0 1 5 15v-2.7a2 2 0 0 1 1.5-2.1z') + P('M5.2 13.4h5.3a1.6 1.6 0 0 0 0-3.2H8.2') + P('M12.5 8v2.2M15.5 8.6v2')],
    ['wing', 'Speed', 'stat', P('M2.6 10C6 5 11.6 3.3 21.4 3.8c-.5 2.6-1.8 4.2-3.8 5.1 1 .5 1.9.6 2.9.5-1.4 3-3.8 4.3-6.9 4.5.8.6 1.6.9 2.6 1-2.1 3-5.3 4.2-8.6 3.6.6.7 1.3 1.2 2.1 1.5C6.3 20.6 3.4 17.6 2.6 10z') + P('M6.4 13c3.6-1 7-3 9.8-6')],
    ['eye', 'Combat instincts', 'stat', P('M2.2 12C4.4 7.8 7.9 5.6 12 5.6s7.6 2.2 9.8 6.4c-2.2 4.2-5.7 6.4-9.8 6.4S4.4 16.2 2.2 12z') + C(12, 12, 3.2) + A_('M10.6 10.4a1.3 1.3 0 1 0 0 .1z')],
    ['flame', 'Stamina', 'stat', P('M12 21.5c-3.9 0-6.5-2.7-6.5-6.2 0-3.9 3.1-5.6 3.6-9.8 2.4 1.4 3.4 3.5 3.1 5.8 1.1-.7 1.9-2 2-3.5 2.5 2 3.8 4.7 3.8 7.5 0 3.5-2.4 6.2-6 6.2z') + A_('M12 21.5c-1.8 0-3-1.2-3-2.9 0-1.9 1.5-2.7 2.2-4.6 1.7 1.1 3.8 2.6 3.8 4.6 0 1.7-1.2 2.9-3 2.9z', ' opacity=".45"')],
    ['lamp', 'Intelligence', 'stat', P('M3 14.5h13l3.5-2.8H22c-1.2 3.6-4.5 6.3-9 6.3H9.5C6 18 3 16.6 3 14.5z') + P('M6.5 14.5a3.5 3.5 0 0 1 7 0') + P('M10 11V9.6') + P('M8 21h7') + P('M11.5 18v3') + A_('M20.2 9.8c-1.2-.9-1.3-2.4-.2-4.3 1.1 1.9 1.1 3.4.2 4.3z')],
    ['peak', 'Willpower', 'stat', P('M2.5 20.5 10 7.5l3.8 6.2 2.2-3.2 5.5 10z') + P('M10 7.5V2.5l3.5 1.3-3.5 1.4') + P('M7.6 11.6l1.6 1.2 1.6-1.4 1.4 1.4')],
    // ---- the six vitals
    ['heart', 'Health', 'vital', P('M12 20.3S3.4 15.4 3 9.6C2.7 6.6 4.8 4.4 7.4 4.4c2 0 3.6 1.2 4.6 2.9 1-1.7 2.6-2.9 4.6-2.9 2.6 0 4.7 2.2 4.4 5.2-.4 5.8-9 10.7-9 10.7z') + A_('M6 8.4c.2-1.2 1-2 2.2-2.2-.1 1.2-.9 2-2.2 2.2z')],
    ['joy', 'Happiness', 'vital', C(12, 12, 4.2) + P('M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7') + A_('M10 10.9a1 1 0 1 0 0 .1zM14 10.9a1 1 0 1 0 0 .1z')],
    ['mirror', 'Looks', 'vital', P('M12 2.2c3 0 5.2 2.8 5.2 6.4s-2.2 6.4-5.2 6.4-5.2-2.8-5.2-6.4S9 2.2 12 2.2z') + P('M12 15v6.6M9.6 17.6h4.8') + A_('M12 4.1c1.9 0 3.4 2 3.4 4.5S13.9 13.1 12 13.1 8.6 11.1 8.6 8.6 10.1 4.1 12 4.1z', ' opacity=".3"') + P('M9.9 9.4c-.1-1.7.6-3 1.7-3.6')],
    ['laurel', 'Renown', 'vital', P('M9 20.5C5.3 18.7 3.4 15 3.8 10.3M15 20.5c3.7-1.8 5.6-5.5 5.2-10.2') + P('M3.9 13.6c-1.3-.9-1.9-2.1-1.8-3.4 1.3.6 2 1.8 1.8 3.4zM5 16.8c-1.5-.2-2.6-1-3-2.3 1.5-.1 2.6.7 3 2.3zM7.3 19.2c-1.5.4-2.8 0-3.6-1.1 1.4-.4 2.7 0 3.6 1.1zM3.8 10.2c-1.1-1.1-1.4-2.4-1-3.7 1.2.8 1.6 2.1 1 3.7z') + P('M20.1 13.6c1.3-.9 1.9-2.1 1.8-3.4-1.3.6-2 1.8-1.8 3.4zM19 16.8c1.5-.2 2.6-1 3-2.3-1.5-.1-2.6.7-3 2.3zM16.7 19.2c1.5.4 2.8 0 3.6-1.1-1.4-.4-2.7 0-3.6 1.1zM20.2 10.2c1.1-1.1 1.4-2.4 1-3.7-1.2.8-1.6 2.1-1 3.7z') + A_('M12 4.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z')],
    ['shield', 'Honour', 'vital', P('M12 21.5c-4.6-1.9-7.6-5.2-7.6-10.2V5.6L12 3l7.6 2.6v5.7c0 5-3 8.3-7.6 10.2z') + P('M8 10.2l4 3.6 4-3.6') + A_('M4.4 5.6 12 3v5.6H4.4z', ' opacity=".35"')],
    ['candle', 'Piety', 'vital', P('M9.4 21V10.4h5.2V21') + P('M5.5 21h13') + P('M12 10.4V8.8') + P('M14.6 13.2c-1.1 0-1.2 1.6-2.1 1.6') + A_('M12 7.9c-1.8-1.2-1.9-3.4 0-6 1.9 2.6 1.8 4.8 0 6z')],
    // ---- the purse and the clock
    ['sun-coin', 'Coin (suns)', 'resource', P('M11.4 5.2A7.4 7.4 0 0 1 21 14.6') + C(10, 14, 7.4) + A_('M10 10.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z', ' opacity=".55"')],
    ['hourglass', 'Initiative', 'resource', P('M6 2.8h12M6 21.2h12') + P('M7.4 2.8v2.6c0 2.6 4.6 4.3 4.6 6.6s-4.6 4-4.6 6.6v2.6M16.6 2.8v2.6c0 2.6-4.6 4.3-4.6 6.6s4.6 4 4.6 6.6v2.6') + A_('M8.6 20.2c.4-1.8 2.2-2.9 3.4-3.3 1.2.4 3 1.5 3.4 3.3z')],
    ['broken-coin', 'Debt', 'resource', P('M10.2 3.5a8.5 8.5 0 0 0 0 17l1.6-4.6-2.6-4.2 2-4z') + P('M14 4.6a8.5 8.5 0 0 1 0 17l1.6-4.6-2.6-4.2 2-4z') + A_('M6 12.2a1.9 1.9 0 1 0 3.8 0 1.9 1.9 0 0 0-3.8 0z', ' opacity=".5"')],
    // ---- the 13 groups of the Life tab
    ['sprout', 'Only now', 'group', P('M12 21v-7.5') + P('M12 13.5C12 10 9.6 7.4 5.5 7.4c0 3.6 2.5 6.1 6.5 6.1z') + P('M12 15.5c0-3.2 2.1-5.6 6-5.6 0 3.2-2.2 5.6-6 5.6z') + P('M6.5 21h11') + A_('M12 13.5C12 10 9.6 7.4 5.5 7.4c1.2 1.6 3.3 4.4 6.5 6.1z', ' opacity=".4"')],
    ['book', 'Body and mind', 'group', P('M5 5A2 2 0 0 1 7 3h12v14.5H7a2 2 0 0 0-2 2z') + P('M5 19.5A2 2 0 0 0 7 21.5h12v-4') + P('M9 7.5h6M9 10.5h4') + A_('M15.5 3h2v6l-1-1-1 1z')],
    ['cups', 'Social', 'group', `<g transform="rotate(-14 7.5 12)">${P('M4 5h7l-.6 5.2a2.9 2.9 0 0 1-5.8 0z')}${P('M7.5 13.1V19M5.3 19h4.4')}</g><g transform="rotate(14 16.5 12)">${P('M13 5h7l-.6 5.2a2.9 2.9 0 0 1-5.8 0z')}${P('M16.5 13.1V19M14.3 19h4.4')}</g>` + P('M12 2.2v1.6M9.6 3l.7 1.2M14.4 3l-.7 1.2')],
    ['herb', 'Health', 'group', P('M4.5 14h15a7.5 7.5 0 0 1-15 0z') + P('M9 21.5h6') + P('M14.5 14l4-11') + P('M8.5 14c-1.6-2-1.6-4.3 0-6.5 1.6 2.2 1.6 4.5 0 6.5z') + A_('M8.5 14c-1.6-2-1.6-4.3 0-6.5z', ' opacity=".45"')],
    ['bow', 'Wilds', 'group', P('M7 2.8c6.3 2.6 9.5 5.7 9.5 9.2S13.3 18.6 7 21.2') + P('M7 2.8v18.4') + P('M2.5 12h17.5') + P('M17.3 9.3 20 12l-2.7 2.7') + P('M2.5 12l-1-1.5M2.5 12l-1 1.5')],
    ['laurel', 'Glory', 'group', null],
    ['candle', 'Faith', 'group', null],
    ['pouch', 'Money', 'group', P('M9 6.2h6L13.7 8.5c3.9 1.2 6.3 4.3 6.3 7.6 0 3-2.4 5-5.3 5H9.3C6.4 21.1 4 19.1 4 16.1c0-3.3 2.4-6.4 6.3-7.6z') + P('M9 6.2 7.6 3.4M15 6.2l1.4-2.8M12 6.2V3') + P('M10.3 8.5h3.4') + A_('M12 12.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z', ' opacity=".5"')],
    ['road', 'World', 'group', P('M4 21.5 10.3 4.5M20 21.5 13.7 4.5') + P('M12 20.5v-2.5M12 15v-2M12 10V8.8') + P('M2 4.5h20') + A_('M17.5 4.5a2.5 2.5 0 0 1 5 0z', ' opacity=".55"')],
    ['banner', 'War', 'group', P('M4.5 3.5h15') + P('M6.5 3.5v14l5.5-3.6 5.5 3.6v-14') + P('M12 3.5V1.8') + P('M2.5 3.5h2M19.5 3.5h2') + A_('M12 7.2l1 2.1 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z')],
    ['mask', 'Intrigue', 'group', P('M2.4 8.2c3-1.6 6.6-1.3 9.6.9 3-2.2 6.6-2.5 9.6-.9-.3 4.8-2.6 8-5.7 8-2.1 0-3-1.6-3.9-3.2-.9 1.6-1.8 3.2-3.9 3.2-3.1 0-5.4-3.2-5.7-8z') + P('M5.8 11.4c1-.9 2.4-.9 3.4 0M14.8 11.4c1-.9 2.4-.9 3.4 0') + P('M21.6 8.2 22.5 5')],
    ['knife', 'Crime', 'group', P('M12 2.4l2.3 3.2v8.2H9.7V5.6z') + P('M7.2 13.8h9.6') + P('M12 13.8v5') + C(12, 20.6, 1.6) + A_('M12 2.4l2.3 3.2v8.2H12z', ' opacity=".4"')],
    ['anvil', 'Work', 'group', P('M3 6.5h13c.3 2.3 2 3.4 5 3.4-1.4 2.4-3.8 3.1-6.6 3.1v2.1a2.3 2.3 0 0 0 2.3 2.3v2.6H6.6V17.4a2.3 2.3 0 0 0 2.3-2.3V13H7.6C4.8 13 3 10.6 3 6.5z') + P('M5 20h14.5') + A_('M3 6.5h13c.1.8.4 1.5.9 2H3.1z', ' opacity=".45"')],
    // ---- the six tabs
    ['sun', 'Life', 'tab', C(12, 12, 4.2) + P('M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7')],
    ['people', 'People', 'tab', C(9, 7.8, 3.6) + P('M2.5 20.5c0-3.7 2.9-6.6 6.5-6.6s6.5 2.9 6.5 6.6') + P('M15.6 4.4a3.6 3.6 0 0 1 0 6.9M18 14.1c2.1.9 3.5 3.2 3.5 6.4')],
    ['swords', 'Path and war', 'tab', P('M3.5 3.5 14 14M20.5 3.5 10 14') + P('M11.8 16.2l4.4-4.4M7.8 11.8l4.4 4.4') + P('M14.6 14.6l3.5 3.5M9.4 14.6l-3.5 3.5') + C(19, 19, 1.3) + C(5, 19, 1.3)],
    ['house', 'Holdings', 'tab', P('M2.8 11.2 12 3.6l9.2 7.6') + P('M5 9.4V21h14V9.4') + P('M10 21v-5.5h4V21') + P('M16 6.4V3.8h2.2v4.4') + A_('M10 21v-5.5h4V21z', ' opacity=".45"')],
    ['crown', 'Realm', 'tab', P('M3 7.8l4.2 4L12 5l4.8 6.8 4.2-4-2 10.2H5z') + P('M5 21h14') + A_('M12 13.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z')],
    ['open-book', 'Chronicle', 'tab', P('M12 6.4C9.9 4.9 7 4.4 2.8 4.9v13.2c4.2-.5 7.1 0 9.2 1.5 2.1-1.5 5-2 9.2-1.5V4.9c-4.2-.5-7.1 0-9.2 1.5z') + P('M12 6.4v13.2') + P('M5.5 8.6c1.7-.1 3.1.1 4.2.6M5.5 11.6c1.7-.1 3.1.1 4.2.6M14.3 9.2c1.1-.5 2.5-.7 4.2-.6')],
    // ---- the controls
    ['chevron', 'More', 'ui', P('M9 6l6 6-6 6')],
    ['pin', 'Place', 'ui', P('M12 21.6s-6.6-6-6.6-11.6a6.6 6.6 0 0 1 13.2 0c0 5.6-6.6 11.6-6.6 11.6z') + C(12, 10, 2.5)],
    ['close', 'Close', 'ui', P('M6 6l12 12M18 6 6 18')],
    ['menu', 'Menu', 'ui', P('M4 6h16M4 12h16M4 18h16')],
    ['seal', 'Save', 'ui', P('M12 3.2c1.4 0 1.8 1 3 1.3 1.2.3 2.2-.3 3 .6.8.9.1 1.9.5 3.1.4 1.2 1.6 1.6 1.6 2.9s-1.2 1.7-1.6 2.9c-.4 1.2.3 2.2-.5 3.1-.8.9-1.8.3-3 .6-1.2.3-1.6 1.3-3 1.3s-1.8-1-3-1.3c-1.2-.3-2.2.3-3-.6-.8-.9-.1-1.9-.5-3.1C3.1 12.8 1.9 12.4 1.9 11.1s1.2-1.7 1.6-2.9c.4-1.2-.3-2.2.5-3.1.8-.9 1.8-.3 3-.6 1.2-.3 1.6-1.3 3-1.3z') + C(12, 11.1, 4) + P('M10.4 21.5l1.6-2 1.6 2') + A_('M10.5 9.3l1.5 3.8 1.5-3.8z')],
    ['play', 'Play', 'ui', P('M7 4.6v14.8l11.6-7.4z')],
    ['next', 'Next', 'ui', P('M5 5.2v13.6l9.6-6.8z') + P('M18.5 5.2v13.6')],
    ['quiet', 'Quiet', 'ui', P('M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z') + A_('M17 4.2l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z')],
    ['info', 'About this', 'ui', C(12, 12, 9) + P('M12 11v6') + A_('M12 6.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z')],
    ['warning', 'Warning', 'ui', P('M10.3 4.2a2 2 0 0 1 3.4 0l7.8 13.6a2 2 0 0 1-1.7 3H4.2a2 2 0 0 1-1.7-3z') + P('M12 9.5v4.8') + A_('M12 16.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z')],
    ['check', 'Done', 'ui', P('M4.8 12.6l4.6 4.6L19.2 7')],
    ['lock', 'Locked', 'ui', `<rect x="5" y="10.5" width="14" height="10.5" rx="2"/>` + P('M8 10.5V7.4a4 4 0 0 1 8 0v3.1') + P('M12 14.6v2.6')],
  ];
  const IS = UI.ICONSET = {};
  for (const [name, label, group, svg] of SET) {
    if (svg == null) { if (IS[name]) IS[name].also = (IS[name].also || []).concat([[label, group]]); continue; }
    IS[name] = { label, group, svg };
  }
  UI.ICONSET_NAMES = Object.keys(IS);

  // the release's names this set redraws (left), each from one of ours (right)
  const SAME = UI.ICONSET_ALIAS = {
    coins: 'sun-coin', users: 'people', swords: 'swords', crown: 'crown', 'book-open': 'open-book', scroll: 'open-book', house: 'house', hourglass: 'hourglass',
    'map-pin': 'pin', save: 'seal', menu: 'menu', play: 'play', 'skip-forward': 'next', moon: 'quiet', info: 'info', 'triangle-alert': 'warning', check: 'check',
    lock: 'lock', x: 'close', 'chevron-right': 'chevron', heart: 'heart', shield: 'shield', eye: 'eye', flame: 'flame', sun: 'sun',
  };
  UI.ICONS = UI.ICONS || {};
  UI.ICONS_RELEASE = Object.assign({}, UI.ICONS);
  for (const k in IS) UI.ICONS[k] = IS[k].svg;
  for (const k in SAME) UI.ICONS[k] = IS[SAME[k]].svg;
  // a named icon as markup, with its word for a screen reader when it stands alone (labelled: true)
  UI.iconOf = (name, cls = 's', labelled) => {
    const I = IS[name]; if (!I) return '';
    return labelled ? `<svg class="ic ${cls}" viewBox="0 0 24 24" role="img" aria-label="${UI.esc(I.label)}" focusable="false">${I.svg}</svg>`
      : `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${I.svg}</svg>`;
  };

  // ---- which icon goes with what
  const STAT = UI.ICON_STAT = { str: 'fist', spd: 'wing', ins: 'eye', sta: 'flame', int: 'lamp', wil: 'peak' };
  const VITAL = UI.ICON_VITAL = { health: 'heart', happy: 'joy', looks: 'mirror', fame: 'laurel', honor: 'shield', piety: 'candle' };
  const GROUP = UI.ICON_GROUP = {
    'only now': 'sprout', 'body & mind': 'book', social: 'cups', faith: 'candle', health: 'herb', wilds: 'bow', glory: 'laurel', money: 'pouch', world: 'road',
    war: 'banner', intrigue: 'mask', crime: 'knife', work: 'anvil', 'at work': 'anvil', craft: 'anvil', study: 'book',
  };
  const TABS = UI.ICON_TAB = { life: 'sun', people: 'people', pathwar: 'swords', holdings: 'house', realm: 'crown', chronicle: 'open-book' };
  const groupOf = cat => { const k = String(cat || '').toLowerCase().trim(); return GROUP[k] || GROUP[k.replace(/:.*$/, '')] || null; };
  UI.iconGroupOf = groupOf;

  // ---- the tabs
  for (const g of UI.GROUPS || []) if (TABS[g.k]) g.icon = TABS[g.k];

  // ---- the profile: each vital and stat carries its icon before its word (91-look's stat tiles take ours instead)
  const LOOK = UI.LOOK;
  if (LOOK && LOOK.STAT_ICON) for (const k in STAT) LOOK.STAT_ICON[k] = IS[STAT[k]].svg;
  const prof = UI.renderProfile;
  if (typeof prof === 'function') UI.renderProfile = function () {
    let h = prof.apply(this, arguments);
    if (typeof h !== 'string') return h;
    try {
      h = h.replace(/<span class="lbl">(?=<span class="tt" data-tt="(health|happy|looks|fame|honor|piety)")/g, (m, k) => m + `<span class="ico-l">${UI.iconOf(VITAL[k])}</span>`);
      if (!(UI.LOOK && UI.LOOK.STAT_ICON)) h = h.replace(/<span class="lbl">(?=<span class="tipt ?" data-tip="stat:(str|spd|ins|sta|int|wil)")/g, (m, k) => m + `<span class="ico-l">${UI.iconOf(STAT[k])}</span>`);
    } catch (e) {}
    return h;
  };

  // ---- the purse: the debt beside the coin gets the broken coin; icon-only buttons keep their word as a tooltip
  const top = UI.renderTop;
  if (typeof top === 'function') UI.renderTop = function () {
    let h = top.apply(this, arguments);
    if (typeof h !== 'string') return h;
    try {
      h = h.replace(/(<span class="bad"[^>]*>)(owes |\(debt )/, (m, a, b) => a + UI.iconOf('broken-coin') + b);
      h = h.replace(/<button class="small" data-a="(save|menu)" aria-label="(Save|Menu)">/g, (m, a, l) => m.replace('>', ` title="${l}">`));
    } catch (e) {}
    return h;
  };

  // ---- the Life tab: each group's header carries its icon; 91-look's tiles take ours too
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function () {
    let h = life.apply(this, arguments);
    if (typeof h !== 'string') return h;
    try { h = h.replace(/<div class="group-h">([^<]+)<\/div>/g, (m, t) => { const k = groupOf(t); return k ? `<div class="group-h">${UI.iconOf(k)}${t}</div>` : m; }); } catch (e) {}
    return h;
  };
  if (LOOK && typeof LOOK.groupIcon === 'function') {
    const gi = LOOK.groupIcon;
    LOOK.groupIcon = g => { const k = groupOf(g) || groupOf(GD.ACTIVITIES && GD.ACTIVITIES[g] && GD.ACTIVITIES[g].cat); return k ? UI.iconOf(k) : gi(g); };
  }

  // ---- tooltips: a stat's, a vital's, the purse's and the clock's popover opens with its icon beside its word
  const TT = UI.TT;
  if (TT && typeof TT.html === 'function') {
    const html = TT.html;
    const TIP = { coin: 'sun-coin', initiative: 'hourglass', debt: 'broken-coin' };
    TT.html = function (key, arg) {
      let h = html.apply(this, arguments);
      try {
        const k = key === 'stat' ? STAT[arg] : VITAL[key] || TIP[key] || (key === 'act' && GD.ACTIVITIES && GD.ACTIVITIES[arg] ? groupOf(GD.ACTIVITIES[arg].cat) : null);
        if (k && typeof h === 'string' && h.includes('<div class="tip-h">')) h = h.replace('<div class="tip-h">', `<div class="tip-h">${UI.iconOf(k, 's ico-tip')}`);
      } catch (e) {}
      return h;
    };
  }

  // ---- styles: an icon sits a little before its word
  const CSS = `
  .ico-l{display:inline-flex;vertical-align:-.2em;margin-right:4px;color:var(--ink-3,var(--text-3))}
  .ico-l .ic{width:14px;height:14px}
  #profile .lk-vitals .ico-l{margin-right:2px}
  #profile .lk-vitals .ico-l .ic{width:12px;height:12px}
  .group-h > .ic{width:16px;height:16px;margin-right:6px;vertical-align:-.22em;color:var(--accent)}
  .tip-h > .ico-tip{width:16px;height:16px;margin-right:6px;vertical-align:-.2em}
  #topbar .bad > .ic{width:14px;height:14px;margin-right:2px}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('ico-css')) { const s = document.createElement('style'); s.id = 'ico-css'; s.textContent = CSS; document.head.appendChild(s); }
})();
