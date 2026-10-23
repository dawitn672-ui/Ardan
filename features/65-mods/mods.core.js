// Player mods (65-mods), part two: the player's library, which mods a game runs with, and the Mods panel.
// Road to Ten, Replayability 6: "Load events and realms from data files so players can add their own."
//
// The format, its checker and its compiler are in mods.events.js (A.MODC), with the built-in example mod.
//
// The library: mods the player has loaded, each kept as the checked, cleaned copy the checker returns (never the raw
// file), in localStorage next to the settings (MODS.KEY). Nothing of a mod goes into the game state except a record
// of which mods (id, version, hash) a game was started with: A.S.mods.
//
// Which mods a game runs with is fixed when it starts. A.newGame takes them from its options (o.mods, so a journal's
// replay starts with the same ones) or else from the library's ticked mods, and records them in A.S.mods and the
// journal. Loading a save brings back the mods it records; a missing one is reported, and its events stay off.
// A mod's events are registered once, like any event, and stay in A.EV. While a mod is not in the game they are
// marked trigger, the mark both random rolls skip (as 58-event-cut does for retired events), so they can never be
// drawn and they do not move the random stream. The events of the mods in play are moved to the end of A.EV in a
// fixed order (mod id, then file order), so the same mods and seed make the same rolls however and whenever the
// mods were loaded in this browser.
const MODS = A.MODS = A.MODS || {};
MODS.KEY = 'ardan.mods.v1';
MODS.BUILTIN = {};        // id -> { mod, built, hash }: mods that ship with the game (the example)
MODS.reg = {};            // id -> { hash, events, customs }: what has been compiled and registered in A.EV
MODS.active = [];         // refs of the mods the current game runs with
MODS.note = null;         // what the last load found: { missing: [refs], changed: [refs] }
MODS.last = null;         // the panel's last load result: { ok, name, file, errors, warnings, events }
MODS._lib = null;

const MC = () => A.MODC || null;
const clone = v => JSON.parse(JSON.stringify(v));
const refOf = en => ({ id: en.data.id, v: en.data.version, hash: en.hash, name: en.data.name });

// ---- the library
MODS.read = function () {
  if (MODS._lib) return MODS._lib;
  let lib = { mods: [], builtinOn: {} };
  try {
    const raw = UI.store.get(MODS.KEY), o = raw ? JSON.parse(raw) : null;
    if (o && Array.isArray(o.mods)) lib.mods = o.mods.filter(e => e && typeof e.id === 'string' && /^[a-z][a-z0-9]{1,15}$/.test(e.id) && e.data && typeof e.data === 'object' && typeof e.hash === 'string').map(e => ({ id: e.id, on: !!e.on, hash: e.hash, data: e.data }));
    if (o && o.builtinOn && typeof o.builtinOn === 'object') for (const k in o.builtinOn) lib.builtinOn[k] = !!o.builtinOn[k];
  } catch (e) { /* unreadable storage: an empty library */ }
  return (MODS._lib = lib);
};
MODS.write = function () {
  const lib = MODS.read();
  return UI.store.set(MODS.KEY, JSON.stringify({ v: 1, mods: lib.mods.map(e => ({ id: e.id, on: e.on, hash: e.hash, data: e.data })), builtinOn: lib.builtinOn }));
};
// a stored mod is checked again against this build (a newer game may know fewer or more names); cached by hash
const checked = {};
MODS.recheck = function (en) {
  const key = en.id + ':' + en.hash;
  if (checked[key]) return checked[key];
  const mc = MC();
  if (!mc) return { errors: ['the game is still loading'], warnings: [], mod: null };
  const r = mc.check(clone(en.data), mc.env());
  if (!r.errors.length && mc.hash(JSON.stringify(r.mod)) !== en.hash) r.warnings.push('mod: stored copy changed since it was loaded');
  return (checked[key] = r);
};
// every mod the player can turn on: the built-in ones first, then the library, each with what the panel shows
MODS.list = function () {
  const lib = MODS.read(), out = [];
  const info = (en, builtIn) => {
    const r = builtIn ? { errors: [], warnings: MODS.BUILTIN[en.id].warnings } : MODS.recheck(en), d = en.data;
    const customs = Object.values(d.customs || {}).reduce((a, l) => a + l.length, 0);
    return { id: en.id, name: d.name, version: d.version, author: d.author || '', about: d.about || '', hash: en.hash, on: !!en.on && !r.errors.length,
      builtIn, events: (d.events || []).length, customs, errors: r.errors, warnings: r.warnings };
  };
  for (const id of Object.keys(MODS.BUILTIN).sort()) out.push(info({ id, on: !!lib.builtinOn[id], hash: MODS.BUILTIN[id].hash, data: MODS.BUILTIN[id].mod }, true));
  for (const en of lib.mods.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) out.push(info(en, false));
  return out;
};
MODS.entry = function (id) {
  if (MODS.BUILTIN[id]) return { id, hash: MODS.BUILTIN[id].hash, data: MODS.BUILTIN[id].mod, builtIn: true, on: !!MODS.read().builtinOn[id] };
  return MODS.read().mods.find(e => e.id === id) || null;
};
// the refs of the ticked mods with no errors, in id order: what a new life starts with
MODS.enabledRefs = function () {
  return MODS.list().filter(m => m.on && !m.errors.length).map(m => ({ id: m.id, v: m.version, hash: m.hash, name: m.name }));
};
// add a mod from the text of a file. A mod with any error is refused whole: nothing is stored or registered.
MODS.add = function (text, file) {
  const mc = MC(), res = { ok: false, file: String(file || '').slice(0, 80), errors: [], warnings: [], name: '', events: 0 };
  if (!mc) { res.errors.push('the game is still loading; try again in a moment'); return res; }
  if (typeof text !== 'string') { res.errors.push('the file could not be read as text'); return res; }
  if (text.length > mc.MAX_BYTES) { res.errors.push(`the file is ${Math.round(text.length / 1024)} KB (at most ${mc.MAX_BYTES / 1024})`); return res; }
  let raw;
  try { raw = JSON.parse(text.replace(/^﻿/, '')); } catch (e) { res.errors.push('the file is not valid JSON: ' + String(e.message || e).slice(0, 120)); return res; }
  const r = mc.check(raw, mc.env());
  res.warnings = r.warnings;
  if (r.errors.length) { res.errors = r.errors; return res; }
  const mod = r.mod;
  res.name = mod.name; res.events = (mod.events || []).length;
  if (MODS.BUILTIN[mod.id]) {
    res.errors.push(`id: "${mod.id}" is the built-in ${MODS.BUILTIN[mod.id].mod.name}, already in the list; give your mod its own id` +
      (MODS.BUILTIN[mod.id].hash === mc.hash(JSON.stringify(mod)) ? ' (this file is that mod)' : ''));
    return res;
  }
  const lib = MODS.read(), hash = mc.hash(JSON.stringify(mod)), old = lib.mods.find(e => e.id === mod.id);
  const keep = lib.mods;
  if (old) res.replaced = old.data.version;
  lib.mods = old ? keep.map(e => (e === old ? { id: e.id, on: e.on, hash, data: mod } : e)) : keep.concat([{ id: mod.id, on: true, hash, data: mod }]);
  if (!MODS.write()) { lib.mods = keep; res.errors.push('the browser would not store the mod (storage full or blocked)'); return res; }
  res.ok = true; res.id = mod.id;
  return res;
};
MODS.setOn = function (id, on) {
  const lib = MODS.read();
  if (MODS.BUILTIN[id]) lib.builtinOn[id] = !!on;
  else { const en = lib.mods.find(e => e.id === id); if (!en) return false; en.on = !!on; }
  return MODS.write();
};
MODS.remove = function (id) {
  const lib = MODS.read(), n = lib.mods.length;
  lib.mods = lib.mods.filter(e => e.id !== id);
  return lib.mods.length < n && MODS.write();
};

// ---- registering and turning on
// the example arrives with the event packs (mods.events.js)
MODS.builtIn = function (mod, built, warnings) {
  const mc = MC();
  MODS.BUILTIN[mod.id] = { mod, built, hash: mc.hash(JSON.stringify(mod)), warnings: warnings || [] };
  MODS.reg[mod.id] = { hash: MODS.BUILTIN[mod.id].hash, events: built.events, customs: built.customs };
  MODS.apply();
};
// compile and register a library mod (once per version)
MODS.register = function (en) {
  const have = MODS.reg[en.id];
  if (have && have.hash === en.hash) return have;
  const mc = MC(), r = MODS.recheck(en);
  if (!mc || r.errors.length) return null;
  if (have) for (const e of have.events) if (A.EV[e.id] === e) delete A.EV[e.id];
  const built = mc.compile(r.mod);
  for (const e of built.events) if (A.EV[e.id]) delete A.EV[e.id];   // another mod's event of the same id
  A.defEvents(built.events);
  return (MODS.reg[en.id] = { hash: en.hash, events: built.events, customs: built.customs });
};
// make exactly these mods the ones in play. Returns what could not be found, or was found at another version.
MODS.activate = function (refs) {
  const want = (Array.isArray(refs) ? refs : []).filter(r => r && typeof r.id === 'string').slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const active = [], missing = [], changed = [];
  for (const r of want) {
    const en = MODS.entry(r.id), reg = en && MODS.register(en);
    if (!reg) { missing.push(clone(r)); continue; }
    if (r.hash && r.hash !== en.hash) changed.push({ id: r.id, name: en.data.name, was: r.v, now: en.data.version });
    active.push(refOf(en));
  }
  MODS.active = active;
  MODS.apply();
  return { active, missing, changed };
};
// the marks follow MODS.active: the events of mods in play keep their own trigger mark and go to the end of A.EV
// in a fixed order; every other mod event is marked trigger. Customs follow the same way.
MODS.apply = function () {
  const on = new Set(MODS.active.map(r => r.id));
  for (const id in MODS.reg) for (const e of MODS.reg[id].events) e.trigger = on.has(id) ? !!e._modTrigger : true;
  for (const id of [...on].sort()) {
    const reg = MODS.reg[id];
    if (reg) for (const e of reg.events) { if (A.EV[e.id] === e) delete A.EV[e.id]; A.EV[e.id] = e; }
  }
  const D = A.BIBLE_DATA;
  if (D && typeof D === 'object') {
    for (const rid in D) if (D[rid] && Array.isArray(D[rid].customs)) D[rid].customs = D[rid].customs.filter(c => !c._mod);
    for (const id of [...on].sort()) {
      const reg = MODS.reg[id];
      if (reg) for (const rid of Object.keys(reg.customs || {}).sort()) if (D[rid] && Array.isArray(D[rid].customs)) D[rid].customs.push(...reg.customs[rid]);
    }
  }
};
MODS.isOn = id => MODS.active.some(r => r.id === id);

// ---- a game starts with its mods, and a save brings them back
const newGame = A.newGame;
A.newGame = function (o) {
  const opts = o || {};
  const refs = Array.isArray(opts.mods) ? opts.mods : MODS.enabledRefs();
  const st = MODS.activate(refs);
  // the journal records the options before this runs; give its copy the mods, so a replay starts with the same ones
  const J = A.J;
  if (!A.jPaused && J && J.o && !J.o.mods && J.e && !J.e.length && J.o.seed === opts.seed) J.o.mods = clone(st.active);
  const r = newGame.apply(this, arguments);
  if (A.S) A.S.mods = clone(st.active);
  MODS.note = st.missing.length || st.changed.length ? st : null;
  return r;
};
const deserialize = A.deserialize;
A.deserialize = function () {
  const r = deserialize.apply(this, arguments);
  try {
    const S = A.S, refs = S && Array.isArray(S.mods) ? S.mods.filter(x => x && typeof x.id === 'string') : [];
    if (S && S.mods != null && !Array.isArray(S.mods)) S.mods = [];
    const st = MODS.activate(refs);
    MODS.note = st.missing.length || st.changed.length ? st : null;
  } catch (e) { console.error('mods on load', e); }
  return r;
};
MODS.noteText = function (n) {
  n = n || MODS.note;
  if (!n) return '';
  const parts = [];
  if (n.missing.length) parts.push(`This life was begun with ${n.missing.length === 1 ? 'a mod' : 'mods'} not loaded here: ${n.missing.map(m => `${m.name || m.id} ${m.v || ''}`.trim()).join(', ')}. Their events will not come up until you load ${n.missing.length === 1 ? 'it' : 'them'} (Menu, Mods) and open the save again.`);
  if (n.changed.length) parts.push(`${n.changed.map(m => `${m.name} is version ${m.now} here; this life began with ${m.was}`).join('. ')}. It may not play as it did.`);
  return parts.join(' ');
};
const enterSave = UI.enterSave;
UI.enterSave = function () {
  const r = enterSave.apply(this, arguments);
  try { if (r && MODS.note) UI.toast(MODS.noteText(), 9000); } catch (e) {}
  return r;
};

// ---- the Mods panel (Menu and title screen). Pure: it reads the library and A.S, and changes nothing.
UI.MODS = {
  html() {
    const esc = UI.esc, close = `<button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon('x', 'm')}</button>`;
    const list = MODS.list(), L = MODS.last;
    let h = `<div class="panel mbox wide mods-panel">${close}<h2>Mods</h2>`;
    h += '<p class="small muted">A mod is a .json file of events and customs that players write. It is data only and cannot run code. ' +
      'The mods ticked here come into every life you start from now on; a life keeps the mods it began with.</p>';
    if (A.S && A.S.pc && UI.screen === 'game') {
      const act = Array.isArray(A.S.mods) ? A.S.mods : [];
      h += `<p class="small">${act.length ? `This life began with ${act.map(m => `<b>${esc(m.name || m.id)}</b> ${esc(m.v || '')}`).join(', ')}.` : 'This life began with no mods.'}` +
        (MODS.note ? ` <span class="bad">${esc(MODS.noteText())}</span>` : '') + '</p>';
    }
    h += '<div class="row"><button class="primary" data-a="modLoad">Load a mod file</button><button data-a="modExample">Save the example as a file</button>' +
      (UI.modsFrom === 'menu' ? '<button data-a="modBack">Back to the menu</button>' : '') + '</div>';
    if (L) {
      h += `<div class="small mods-last" role="status">` + (L.ok
        ? `<p class="good">Loaded <b>${esc(L.name)}</b>${L.replaced ? ` (replacing version ${esc(L.replaced)})` : ''}: ${esc(String(L.events))} events.</p>`
        : `<p class="bad">${esc(L.file || 'The file')} was not loaded. ${esc(String(L.errors.length))} ${L.errors.length === 1 ? 'problem' : 'problems'}; nothing from it was added.</p>`) +
        UI.MODS.issues(L.errors, 'bad') + UI.MODS.issues(L.warnings, 'muted') + '</div>';
    }
    h += '<h3 style="margin-top:var(--s-4)">Your mods</h3>';
    if (!list.length) h += '<p class="small muted">None yet.</p>';
    for (const m of list) {
      const cid = 'mod-on-' + m.id;
      h += `<div class="card small mod-row">` +
        `<div class="row"><input type="checkbox" id="${esc(cid)}" data-c="modOn" data-v="${esc(m.id)}" ${m.on ? 'checked' : ''} ${m.errors.length ? 'disabled' : ''}>` +
        `<label for="${esc(cid)}" class="grow"><b>${esc(m.name)}</b> <span class="muted">${esc(m.version)}${m.author ? ' · by ' + esc(m.author) : ''}${m.builtIn ? ' · comes with the game' : ''}</span></label>` +
        (m.builtIn ? '' : `<button class="small" data-a="modRemove" data-v="${esc(m.id)}" aria-label="Remove ${esc(m.name)}">Remove</button>`) + '</div>' +
        `<div class="tiny">${esc(String(m.events))} events${m.customs ? `, ${esc(String(m.customs))} ${m.customs === 1 ? 'custom' : 'customs'}` : ''} · ${m.on ? 'on for new lives' : 'off'}</div>` +
        (m.about ? `<div class="tiny muted">${esc(m.about)}</div>` : '') +
        (m.errors.length ? `<div class="tiny bad">This build cannot run it:</div>` + UI.MODS.issues(m.errors, 'bad') : UI.MODS.issues(m.warnings, 'muted')) + '</div>';
    }
    return h + '</div>';
  },
  issues(list, cls) {
    if (!list || !list.length) return '';
    const n = 12;
    return `<ul class="tiny ${cls}">${list.slice(0, n).map(x => `<li>${UI.esc(x)}</li>`).join('')}${list.length > n ? `<li>and ${list.length - n} more</li>` : ''}</ul>`;
  },
  open(from) { UI.modsFrom = from || (UI.ov && UI.ov.type === 'menu' ? 'menu' : null); UI.ov = { type: 'mods' }; UI.renderModal(); },
  // after a change, redraw and put the focus back where it was
  redraw(sel) { UI.renderModal(); const el = sel && document.querySelector(sel); if (el) el.focus({ preventScroll: true }); },
  loadText(text, file) {
    const r = MODS.add(text, file);
    MODS.last = r;
    UI.MODS.redraw(r.ok ? `#mod-on-${r.id}` : '.mods-last');
    UI.toast(r.ok ? `Mod loaded: ${r.name}.` : 'The mod was not loaded. The panel lists why.', 4000);
    return r;
  },
};
UI.SYS_OV = UI.SYS_OV || [];
if (!UI.SYS_OV.includes('mods')) UI.SYS_OV.push('mods');
for (const k of ['mods', 'modLoad', 'modExample']) if (Array.isArray(UI.NEEDS_CONTENT) && !UI.NEEDS_CONTENT.includes(k)) UI.NEEDS_CONTENT.push(k);
const ovModal = UI.ovModal;
UI.ovModal = function (ov) { return ov && ov.type === 'mods' ? UI.MODS.html() : ovModal.apply(this, arguments); };
Object.assign(UI.A, {
  mods() { MODS.last = null; UI.MODS.open(); },
  modBack() { UI.ov = { type: 'menu' }; UI.renderModal(); },
  modLoad() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      if (f.size > (A.MODC ? A.MODC.MAX_BYTES : 524288)) { MODS.last = { ok: false, file: f.name, errors: [`the file is ${Math.round(f.size / 1024)} KB (at most 512)`], warnings: [] }; UI.MODS.redraw('.mods-last'); return; }
      const rd = new FileReader();
      rd.onload = () => UI.MODS.loadText(String(rd.result), f.name);
      rd.onerror = () => { MODS.last = { ok: false, file: f.name, errors: ['the file could not be read'], warnings: [] }; UI.MODS.redraw('.mods-last'); };
      rd.readAsText(f);
    };
    inp.click();
  },
  modExample() { if (A.MODC) UI.download(JSON.stringify(A.MODC.EXAMPLE, null, 2) + '\n', 'example-mod.json', 'application/json'); },
  modRemove(id) {
    const m = MODS.list().find(x => x.id === id);
    if (MODS.remove(id)) { MODS.last = null; UI.toast(`Removed ${m ? m.name : id}. A life that began with it keeps a note of it.`, 4000); }
    UI.MODS.redraw('[data-a="modLoad"]');
  },
});
Object.assign(UI.C, {
  modOn(el) { MODS.setOn(el.dataset.v, !!el.checked); UI.MODS.redraw(`#mod-on-${el.dataset.v}`); },
});
