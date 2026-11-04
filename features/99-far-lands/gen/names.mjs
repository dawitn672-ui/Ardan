// Names for the far lands: a sound palette for each of the ten Far Lands (a stand-in until the lore's naming rules,
// canon/lore/far-lands.json, are read in their place). A word is two to four syllables of onset, vowel and coda, with
// codas inside a word kept to the soft ones (n, r, l, s, m...) so no word stacks consonants, and an ending from the
// land's own set now and then. Two cultures of a land share its palette and differ in their endings. No name is an
// English word, holds a quote or an angle bracket (SAVES.clean strips those), or repeats another name in the world.

const PAL = {
  // the Black Pines: soft stops, long vowels, -la, -nen, -va
  T: { on: ['k', 't', 'v', 's', 'h', 'm', 'n', 'l', 'r', 'j', 'p', ''], nu: ['a', 'e', 'i', 'o', 'u', 'aa', 'ei', 'uo', 'ai', 'y'],
    mid: ['', '', '', 'n', 's', 't', 'k', 'r', 'l', 'h'], fin: ['', '', 'n', 's', 'k', 'l', 'r'], syl: [2, 3], ends: [['va', 'la', 'nen', 'sk', 'ja'], ['ra', 'ola', 'mo', 'ki', 'sto']] },
  // the Rime Coast: k and q, -ik, -uq, -aat
  N: { on: ['k', 'q', 't', 'n', 'p', 's', 'a', 'i', 'u', ''], nu: ['a', 'i', 'u', 'aa', 'ii', 'uu'], mid: ['', '', 'k', 't', 'n', 'r', 'v'], fin: ['k', 'q', 't', 'n'],
    syl: [2, 3], ends: [['ik', 'uq', 'aat', 'vik'], ['nak', 'tuq', 'liq', 'sut']] },
  // the Long Grass: open vowels in harmony, -an, -tai, -dar
  F: { on: ['b', 'k', 't', 's', 'sh', 'ch', 'j', 'm', 'n', 'y', 'd', 'kh', 'g', 'b', 'a', 'o', 'u'], nu: ['a', 'u', 'o', 'e', 'i', 'a', 'u'], mid: ['', '', 'n', 'r', 'l', 'k', 'm', 'sh', 'r', 'n'],
    fin: ['n', 'r', 'k', 't', 'l', '', 'sh', 'm', 'ng', 'z'], syl: [2, 3], ends: [['an', 'tai', 'gul', 'dar', 'kan', 'ur'], ['bek', 'tash', 'sun', 'tei', 'gan', 'chin']] },
  // the Sand Basins: -and, -esh, -avan, -arak
  B: { on: ['kh', 'y', 's', 'z', 'm', 'n', 'p', 'b', 't', 'd', 'g', 'r', 'f', 'v', 'a', 'i'], nu: ['a', 'e', 'i', 'o', 'u', 'ai', 'a'], mid: ['', '', 'n', 'r', 's', 'sh', 'm', 'z', 'r'],
    fin: ['n', 'r', 'nd', 'sh', 'z', 'kh', 'd', '', 'm'], syl: [2, 3], ends: [['and', 'esh', 'avan', 'arak', 'izar'], ['ush', 'ana', 'ird', 'atar', 'eb', 'ond']] },
  // the High Steppes: clipped syllables, ng and lh, -ling, -tse, -gar
  H: { on: ['lh', 'ng', 'dr', 'gy', 'ts', 'ky', 'ny', 'p', 't', 'k', 'g', 's', 'r', 'd', 'ch', 'sh', 'l', 'n'], nu: ['a', 'o', 'e', 'i', 'u'], mid: ['', '', '', 'n', 'ng', 'r', 'l', 'm'],
    fin: ['', 'ng', 'n', 'r', 'k', 'p', 'l', ''], syl: [2, 2], ends: [['ling', 'tse', 'gar', 'dzong', 'sum'], ['ri', 'mo', 'pal', 'shar', 'den']] },
  // the Twin Rivers: two even syllables run together, -an, -eng, -ou
  R: { on: ['ch', 'sh', 'h', 'l', 'm', 'n', 't', 'k', 's', 'y', 'w', 'j', 'p', 'f', 'd', 'g', 'z', 'b', 'ts'], nu: ['a', 'e', 'i', 'o', 'u', 'ai', 'ao', 'ou', 'ei', 'ia', 'ua', 'uo'], mid: ['', '', 'n', 'ng', 'n'],
    fin: ['n', 'ng', '', '', 'n'], syl: [2, 2], ends: [] },
  // the Southern Peninsulas: long words, aspirates, -pana, -ndra, -kam
  M: { on: ['v', 'r', 'm', 'n', 'k', 't', 'd', 'p', 'b', 's', 'h', 'ch', 'j', 'l', 'th', 'dh', 'bh', 'kh', 'g', 'a', 'i'], nu: ['a', 'a', 'i', 'u', 'e', 'o', 'aa', 'ii'], mid: ['', '', '', 'n', 'm', 'r', 'l', 'nd', 'sh', 'tt'],
    fin: ['', '', 'n', 'm', 'r', 'l'], syl: [2, 4], ends: [['pana', 'ndra', 'kam', 'vati', 'mala'], ['tarai', 'ttam', 'reni', 'dha', 'kot']] },
  // the Thousand Isles: open vowels, -ua, -ang, -oa
  A: { on: ['t', 'k', 'm', 'n', 'l', 's', 'b', 'p', 'r', 'w', 'h', 'ng', 'd', 'j', 'g', ''], nu: ['a', 'e', 'i', 'o', 'u', 'au', 'ai', 'a'], mid: ['', '', '', 'n', 'ng', 'r', 'h'],
    fin: ['', '', '', 'n', 'ng', 'k', 'h'], syl: [2, 4], ends: [['ua', 'ang', 'oa', 'eru', 'awi'], ['amu', 'ira', 'ong', 'eli', 'aka']] },
  // the Sunrise Isles: consonant and vowel in turn, -ra, -shi, -mo
  I: { on: ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'g', 'z', 'd', 'b', 'sh', 'ch', 'ts', 'f'], nu: ['a', 'i', 'u', 'e', 'o', 'a', 'o'], mid: ['', '', '', '', 'n'],
    fin: ['', '', '', 'n'], syl: [2, 4], ends: [['ra', 'shi', 'mo', 'no', 'ga'], ['zu', 'tani', 'ko', 'ro', 'miya']] },
  // the Deep Southland: prenasalised stops and open syllables, -we, -nga, -ba
  D: { on: ['mb', 'nd', 'ng', 'k', 't', 'm', 'n', 'l', 'w', 'z', 's', 'b', 'g', 'ny', 'ts', 'kw', 'y', 'h'], nu: ['a', 'e', 'i', 'o', 'u', 'a'], mid: [''],
    fin: [''], syl: [2, 4], ends: [['we', 'nga', 'ba', 'ndo', 'li'], ['ka', 'ma', 'zi', 'tu', 'nyi']] },
};
export const LAND_CODES = Object.keys(PAL);

const BAD = /^(an|and|ban|bun|cut|dam|damn|den|dig|dog|fat|fun|gun|hat|hell|hit|ink|kill|man|men|mud|nun|pan|pen|pig|pot|rat|run|sad|sex|sin|son|sun|tan|tar|ten|tin|ton|war|win|bed|bad|bat|bit|bus|cat|cop|cup|fan|fig|hen|hog|hot|jam|jet|lad|lap|map|mat|nap|net|nut|pad|pat|pet|pin|pit|rag|ram|rib|rob|rod|rug|sap|sat|sip|sit|tab|tap|tip|top|tub|van|wet|wig|yak|yam|ash|sea|tea|toe|tie|lie|die|dye|hue|use|may|bay|day|hay|key|way|boy|toy|soy|joy|kim|tom|tim|ana|ian|jan|kate|lisa|maria|anna|nina|mia|asia|india|china|korea|japan|tokyo|delhi|cairo|lima|roma|paris|london|berlin|oslo|kabul|tibet|nepal|mali|chad|togo|peru|iran|iraq|oman|cuba|fiji|samoa|tonga|bali|java|borneo|luzon|hindu|islam|allah|buddha|kami|zen|tao|yoga|ninja|samurai|sushi|kimono|karma|mantra|lama|khan|shah|sultan|raja|tsar|czar|kaiser|pope|nazi|hitler|stalin|mao|lenin|kenya|ghana|congo|sudan|chile|libya|syria|yemen|qatar|dubai|tonga|nauru|palau|laos|burma|sikkim|assam|bengal|punjab|kerala|tamil|hanoi|seoul|busan|osaka|kyoto|nara|kobe|beijing|shanghai|hunan|henan|hubei|wuhan|tianjin|xian|lhasa|kandy|goa|bombay|madras|mumbai|patna|agra|dhaka|manila|davao|cebu|jakarta|bandung|medan|lagos|accra|dakar|tunis|rabat|addis|harare|lusaka|maputo|luanda|kigali|kampala|nairobi|mombasa|zanzibar|tanga|samarkand|bukhara|khiva|merv|kashgar|turfan|hotan|yarkand|kokand|tashkent|almaty|astana|urumqi|ulan|batu|bator|tuva|altai|baikal|amur|lena|yakut|ob|irtysh|tomsk|omsk|kazan|perm|ufa|neva|volga|don|dnieper|oka|kama|ural|sahara|nile|niger|zambezi|limpopo|orange|vaal|ganges|indus|yamuna|mekong|yangtze|huang|kong|tonle|irrawaddy|salween|chao|phraya|brahma|vishnu|shiva|kali|durga|ganesh|rama|krishna|sita|arjuna|jesus|christ|maria|mary|moses|abraham|noah|adam|eve|satan|lucifer)$/i;
const tidy = s => s.replace(/(.)\1\1+/g, '$1$1').replace(/^(.)\1/, '$1');

export function namer(R, land, variant = 0, used = new Set()) {
  const P = PAL[land] || PAL.F;
  const raw = useEnd => {
    const n = P.syl[0] + Math.floor(R() * (P.syl[1] - P.syl[0] + 1));
    let s = '';
    for (let k = 0; k < n; k++) {
      let on = R.pick(P.on);
      if (k > 0 && /^[aeiou]/.test(on)) on = R.pick(P.on.filter(o => o && !/^[aeiou]/.test(o)));   // vowel-initial onsets start a word only
      s += on + (/^[aeiou]$/.test(on) ? '' : R.pick(P.nu)) + (k === n - 1 ? R.pick(P.fin) : R.pick(P.mid));
    }
    const ends = P.ends[variant % Math.max(1, P.ends.length)];
    if (useEnd && ends && ends.length) s = s.replace(/[aeiouy]+[^aeiouy]*$/, '') + R.pick(ends);
    return tidy(s);
  };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  return {
    word(opts = {}) {
      for (let k = 0; k < 600; k++) {
        const s = raw(opts.end ?? R() < 0.4);
        if (s.length < (opts.min || 4) || s.length > (opts.max || 9)) continue;
        if (/[^a-z]/.test(s) || BAD.test(s)) continue;
        if (/[^aeiouy]{3}/.test(s) || /([hjvwyqzgbdf])\1/.test(s)) continue;   // no stacked consonants, no doubled h, j, v...
        if (/[aeiouy]{3}/.test(s) || /^[^aeiouy]{2}/.test(s.replace(/^(ch|sh|kh|th|dh|bh|lh|ng|ny|ts|gy|ky|dr|mb|nd|kw)/, 'C'))) continue;
        if (/^[aeiouy]{2}/.test(s) && !/^(ai|au|ei|ou)/.test(s)) continue;
        const n = cap(s);
        if (used.has(n.toLowerCase())) continue;
        used.add(n.toLowerCase());
        return n;
      }
      const n = cap(raw(true)) + 'a';
      used.add(n.toLowerCase());
      return n;
    },
  };
}
