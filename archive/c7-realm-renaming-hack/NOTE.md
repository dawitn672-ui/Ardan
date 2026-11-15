# The renaming hack (99999-v2-names)

`names.core.js`, `test.mjs`, `README.md` as they stood in `src/world/99999-v2-names/`. The owner's Nov 5 request, every
realm named like a real kingdom, was carried out as a layer over the page: ordered regular expressions (`NM.fix`) run over every
string of the lore, `A.T`, `A.log`, `A.news`, the setters of `innerHTML`, `outerHTML`, `textContent`, `title` and
`innerText`, `setAttribute`, the canvas's `fillText`, `strokeText` and `measureText`, the chronicle's export and the saves
(CRITIQUE P6: "a person called Amber or a typed name is rewritten too").

Replaced by C7 (D-058): the names are written into the lore and the source, once, with this file's rules
(`tools/c7/rename-realms.mjs` reads `names.core.js` from here), and four were changed to fit their governments. The test
`nmOldNames` (`src/world/999981-names-and-cultures/test.mjs`) is the descendant of `nmLives`. Last commit that built it:
`b87c908`.
