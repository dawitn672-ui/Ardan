# Security

**Aspect:** Technical · **Kind:** fix (applied in every build)

A crafted save file could run script. Now a Content-Security-Policy blocks injected handlers and scripts, and loaded saves are sanitized.

## Patches

| Patch | Why |
| --- | --- |
| `SEC-CSP` | Content-Security-Policy: only the page's own inline scripts (by hash) and the scripts they create may run. Injected inline handlers (onerror=, onclick=) and injected <script> tags are blocked, whatever slips into the markup. |
| `SEC-SAVE-CLEAN` | A loaded save is untrusted (players swap files; the checksum anyone can recompute). Before a save is entered, strip < and > from every string and key (no game text uses them), strip " from everything except prose fields, and force log line classes, years and ages into safe shapes. Closes the script injection through the story log, realm colours, ids in data-v attributes and portrait colours. |
| `SEC-LOG-CLASS` | Escape the story-log line class where it is written into markup (second layer behind SEC-SAVE-CLEAN). |

## Tests

`xssSave`, `csp` in `test.mjs`. Run them with `node tests/run.mjs --features=security`.
