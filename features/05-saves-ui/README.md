# Saves and keyboard

**Aspect:** UI and UX, Technical · **Kind:** fix (applied in every build)

Silent save failures, two tabs overwriting each other, a new life erasing the old one, keyboard play.

## Patches

| Patch | Why |
| --- | --- |
| `SAVE-WARN` | Every autosave was silent, including failures (quota, aborted transaction), so a player could lose years without a word. A failed autosave now warns (at most once every 2 minutes). A manual save also asks the browser to keep the site's storage (Safari otherwise clears it after 7 days away). |
| `SAVE-ONE-TAB` | Two tabs shared one save slot with no lock, so within about 3 autosaves one life overwrote the other. A Web Lock now lets one tab save at a time; a second tab says so, does not save, and takes over when the first one closes. |
| `SAVE-NEW-LIFE-CONFIRM` | Starting a new life (Begin or Random) gave no warning, and three yearly autosaves later the previous life had rotated out of all backups. If the saved life is still going, the game now asks first and says how to keep it. |
| `SAVE-BACKUP-MESSAGE` | Loading an older backup on purpose from the Menu said "The newest save was damaged". |
| `UI-KEYBOARD` | Keyboard play. (1) The 1.5 s clock redraw and every action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no longer loses up to a year. |

## Tests

`keyboard`, `saveSafety`, `twoTabs` in `test.mjs`. Run them with `node tests/run.mjs --features=saves-ui`.
