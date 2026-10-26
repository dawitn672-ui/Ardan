// Reading the lore (canon/lore/far-lands.json, written by the lore lane) into the shapes the generator uses. The lore's
// layout was not fixed when this was written, so every field is looked for under the names a writer is likely to use,
// and anything missing is left for the placeholders to fill. Positions are in km in the game's frame (x east from the
// Known World's west edge, y south from its north edge).
const list = v => Array.isArray(v) ? v : v && typeof v === 'object' ? Object.entries(v).map(([id, x]) => Object.assign({ id }, x)) : [];
const num = v => (typeof v === 'number' && isFinite(v)) ? v : (typeof v === 'string' && v.trim() && isFinite(+v.replace(/[, ]/g, ''))) ? +v.replace(/[, ]/g, '') : null;
const str = (...vs) => { for (const v of vs) if (typeof v === 'string' && v.trim()) return v.trim(); return null; };
const clean = s => s == null ? s : String(s).replace(/[<>"]/g, '');
const strs = v => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => clean(x.trim())) : typeof v === 'string' ? v.split(/[;,]/).map(x => clean(x.trim())).filter(Boolean) : [];

export function readLore(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const R = list(raw.realms || raw.polities || raw.states), C = list(raw.cultures || raw.peoples), F = list(raw.faiths || raw.religions);
  const realms = R.map(r => {
    const cap = r.capital && typeof r.capital === 'object' ? r.capital : {};
    const pos = r.pos || r.position || r.km || cap.pos || cap.km || {};
    const x = num(r.x ?? r.capitalX ?? r.cx ?? cap.x ?? pos.x ?? (Array.isArray(pos) ? pos[0] : null));
    const y = num(r.y ?? r.capitalY ?? r.cy ?? cap.y ?? pos.y ?? (Array.isArray(pos) ? pos[1] : null));
    const ruler = r.ruler && typeof r.ruler === 'object' ? r.ruler : { name: r.ruler };
    return {
      id: str(r.id, r.polity_id), name: clean(str(r.name, r.title_full)), short: clean(str(r.short, r.shortName, r.short_name)), type: clean(str(r.type, r.kind, r.polity)),
      title: clean(str(r.title, r.rulerTitle, r.ruler_title, ruler.title)), race: str(r.race, r.main_race, r.people), place: str(cap.place_id, cap.id), typeFull: clean(str(r.type_full)) || '', rulerSex: str(ruler.sex), born: num(ruler.born), capital: clean(str(typeof r.capital === 'string' ? r.capital : null, cap.name, r.capitalName, r.capital_name)),
      x, y, area: num(r.area ?? r.area_km2 ?? r.areaKm2 ?? r.km2), pop: num(r.pop ?? r.population), cult: str(r.culture, r.cult, r.cultureId, r.culture_id), faith: str(r.faith, r.religion, r.faithId, r.faith_id),
      ruler: clean(str(ruler.name, ruler.fullName)), color: /^#[0-9a-f]{6}$/i.test(r.color || (r.colours && r.colours.map_color) || '') ? (r.color || r.colours.map_color) : null, house: clean(r.house && typeof r.house === 'object' ? str(r.house.name) : str(r.house)), standing: num(r.army && typeof r.army === 'object' ? r.army.standing : null), levyN: num(r.army && typeof r.army === 'object' ? r.army.levy : null), gov: str(r.gov, r.succession), law: str(r.law),
      land: str(r.land, r.farLand, r.far_land), army: num(typeof r.army === 'object' ? null : r.army), income: num(r.income), stability: str(r.stability),
      allies: strs(r.allies), rivals: strs(r.rivals), intro: clean(str(r.intro, r.summary, r.primer && r.primer.intro)), want: clean(str(r.want)), fear: clean(str(r.fear)), rulerNote: clean(str(ruler.note)),
    };
  }).filter(r => r.id && /^POL-/.test(r.id) && r.name);
  const cultures = C.map(c => {
    const names = c.names || c.nameLists || c.name_lists || {};
    return { id: str(c.id), name: clean(str(c.name)), race: str(c.race) || 'human', land: str(c.land), note: clean(str(c.note, c.summary)) || '',
      m: strs(c.m || names.m || names.male || c.male), f: strs(c.f || names.f || names.female || c.female), house: strs(c.house || names.house || names.houses || names.family || c.houses), places: strs(names.places),
      epi: strs(c.epi || names.epi || names.epithets || c.epithets), naming: c.naming && typeof c.naming === 'object' && c.naming.common ? c.naming : null, lang: clean(str(c.lang, c.language, c.tongue)) };
  }).filter(c => c.id && /^CUL-/.test(c.id) && c.name);
  const faiths = F.map(f => ({ id: str(f.id, f.religion_id), name: clean(str(f.name)), kind: str(f.kind) || 'organized', belief: clean(str(f.belief, f.summary)) || '', afterlife: clean(str(f.afterlife)) || '',
    clergy: clean(str(f.clergy)) || '', rituals: clean(str(f.rituals)) || '', festivals: clean(str(f.festivals)) || '', taboos: clean(str(f.taboos)) || '', politics: clean(str(f.politics)) || '' }))
    .filter(f => f.id && /^REL-/.test(f.id) && f.name);
  return { realms, cultures, faiths };
}
