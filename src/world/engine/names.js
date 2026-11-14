// Culture-specific name builders (small syllable sets; swap in Ardan's real naming rules from the Codex).
export const CULTURES = {
  aldic: { male: ['Al', 'Ber', 'Cor', 'Ed', 'Gar', 'Har', 'Os', 'Ro', 'Wil', 'Ty', 'Ald', 'Bran'], maleEnd: ['ric', 'win', 'mund', 'ard', 'bert', 'old', 'an', 'wen', 'red'],
    female: ['Ae', 'Bea', 'Ce', 'El', 'Gwen', 'Is', 'Mar', 'Ro', 'Wyn', 'Ad', 'Ma'], femaleEnd: ['wen', 'da', 'lyn', 'ith', 'ra', 'gyth', 'ela', 'ris'],
    house: ['Ash', 'Black', 'Hollin', 'Stone', 'Wyr', 'Bram', 'Thorn', 'Gale', 'Marl', 'Hart'], houseEnd: ['ford', 'mere', 'wick', 'dale', 'hold', 'ley', 'brook', 'ham'] },
  solenne: { male: ['Am', 'Ber', 'Cel', 'Gas', 'Lu', 'Ma', 'Re', 'Thi', 'Ga', 'Jeh'], maleEnd: ['aury', 'trand', 'estin', 'ton', 'cien', 'rin', 'naud', 'baut', 'llard'],
    female: ['A', 'Bé', 'Cla', 'É', 'Is', 'Lis', 'Mar', 'Sé', 'Yo'], femaleEnd: ['line', 'atrix', 'rette', 'lise', 'eut', 'onne', 'gaude', 'rine'],
    house: ['Val', 'Mont', 'Beau', 'Roche', 'Lan', 'Cler', 'Fon'], houseEnd: ['mont', 'fort', 'court', 'lieu', 'val', 'cieux', 'teine'] },
  khuul: { male: ['Bat', 'Tem', 'Ar', 'Jeb', 'Ogh', 'Sub', 'Tol', 'Chag', 'Mun'], maleEnd: ['ur', 'gen', 'dai', 'ke', 'tai', 'lun', 'jin', 'khar'],
    female: ['Bor', 'Kha', 'Ol', 'Sor', 'Al', 'Ech', 'Tur'], femaleEnd: ['te', 'lun', 'gana', 'ke', 'ai', 'jin'],
    house: ['Borg', 'Tai', 'Ong', 'Mer', 'Kere'], houseEnd: ['hen', 'chut', 'git', 'kit', 'id'] },
  orcish: { male: ['Gro', 'Ush', 'Mak', 'Thra', 'Gor', 'Dur', 'Kra', 'Rug'], maleEnd: ['ath', 'nak', 'gul', 'tar', 'mok', 'uk', 'gash'],
    female: ['Sha', 'Gru', 'Ura', 'Mog', 'Yaz', 'Bor'], femaleEnd: ['ka', 'zha', 'gra', 'mira', 'lok'],
    house: ['Tusk', 'Red Hide', 'Old Mare', 'Iron Jaw', 'Ash Hoof'], houseEnd: [''], place: ['Kra', 'Gor', 'Ush', 'Thar', 'Mok', 'Dra'], placeEnd: ['oth', 'gash', 'rak', 'mul', 'dun', 'zar'] },
};
export function makeNamer(rng) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    given(culture, sex) { const c = CULTURES[culture] ?? CULTURES.aldic; return cap(rng.pick(sex === 'female' ? c.female : c.male) + rng.pick(sex === 'female' ? c.femaleEnd : c.maleEnd)); },
    house(culture) { const c = CULTURES[culture] ?? CULTURES.aldic; return cap(rng.pick(c.house) + rng.pick(c.houseEnd)); },
    place(culture) { const c = CULTURES[culture] ?? CULTURES.aldic; return cap(rng.pick(c.place ?? c.house) + rng.pick(c.placeEnd ?? c.houseEnd)); },
  };
}
