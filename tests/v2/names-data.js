// The v2 engine names people from data/names.json; the page sets it from A.DATA.names, a test imports this first.
import fs from 'node:fs';
import { setNameData } from '../../src/world/engine/names.js';
setNameData(JSON.parse(fs.readFileSync(new URL('../../data/names.json', import.meta.url), 'utf8')));
