// 9989-what-you-seek (P3, order 54, D-062): the world answers what you seek, never what it handed you.
//
// The owner: "remove the ambitions feature ... everything comes down to free will. Any of these things should be
// available to you but not a single thing should be handed to you without you seeking it out." The ambitions (97) and
// the chapters (9993) are retired to archive/. The 30-odd scenes written for an ambition (the release's pa_* pack: a
// sword master passing through, a guild seat, a cheap estate, buying your freedom, a petition to widen the realm ...)
// read C.ambition(p, k), which read the ambition a card had handed you. They now read what you are doing of your own
// will, so a scene meets the life that went looking for it:
//
//   the aim you set in your plan (GD.AIMS: Push for advancement, Turn a coin, Seek renown, Devotion, Study, Look for
//   love, Tend your family, Win a patron, Scheme, Plan your freedom, Govern, Statecraft, Prepare for war),
//   the training you chose yourself (the plan's train, when it is not the one the engine filled in for you),
//   a post you took (a trade, the army, the clergy, an office), a shop you opened, a style you went to school for,
//   the roads you have travelled.
//
// A.SEEK.why(p, k) says why in words ('' when you are not seeking it); A.SEEK.is(p, k) is the yes or no C.ambition
// reads. Pure: reads the person, draws nothing, writes nothing (event conditions call it).
(function () {
  if (typeof A === 'undefined') return;
  const SEEK = A.SEEK = A.SEEK || {};
  const plan = p => (p && p.plan) || {};
  const aim = (p, k) => plan(p).aim === k;
  // training you chose: the plan's focus when the engine did not fill it in for you (ENG-PLAN-FOLLOWS-LIFE)
  const trains = (p, ...ks) => { const P = plan(p); return !!P.train && P.train !== P.trainAuto && ks.includes(P.train); };
  const sk = (p, k) => (A.skill ? A.skill(p, k) : 0);
  const path = p => (p && p.job && A.pathOfCareer ? A.pathOfCareer(p.job.c) : '');
  const style = p => (p && p.styles ? Math.max(0, ...Object.values(p.styles).map(s => (s && s.rank) || 0)) : 0);
  const noble = p => ['noble', 'royal'].includes(p.status) || !!(p.noble && p.noble.rung >= 4);
  const office = p => !!p.office || !!(A.POSTS && A.POSTS.held && A.POSTS.held(p.id).some(k => /^(office|council|court):/.test(k)));
  const adultAge = p => (A.C && A.C.ageAdj ? A.C.ageAdj(p) : A.age(p));
  // each: p => the reason in words, or ''
  SEEK.RULES = {
    freedom: p => !(p.flags && p.flags.unfree) ? '' : aim(p, 'freedom') ? 'you plan your freedom' : (+p.coin || 0) >= 20 ? 'you are putting coin by' : '',
    wealth: p => aim(p, 'wealth') ? 'you set out to turn a coin' : p.job && p.job.own ? 'you keep a shop of your own' : path(p) === 'guild' && (+p.coin || 0) >= 500 ? 'you trade, and it pays' : '',
    trade: p => {
      if (!p.job || !['guild', 'common', 'sea', 'learning'].includes(path(p))) return '';
      const J = GD.CAREERS && GD.CAREERS[p.job.c];
      return aim(p, 'advance') ? 'you push to rise in your trade' : J && J.skill && trains(p, J.skill) ? 'you train at your trade by choice' : '';
    },
    family: p => aim(p, 'family') ? 'you tend your family' : aim(p, 'love') ? 'you look for love' : '',
    renown: p => aim(p, 'renown') ? 'you seek renown' : (+p.fame || 0) >= 30 ? 'your name already travels' : '',
    faith: p => aim(p, 'faith') ? 'you keep to your devotions' : p.job && p.job.c === 'clergy' ? 'you took holy orders' : '',
    scholar: p => aim(p, 'study') ? 'you study' : trains(p, 'learning') ? 'you chose your books' : '',
    teacher: p => (aim(p, 'study') || trains(p, 'learning')) && sk(p, 'learning') >= 35 && adultAge(p) >= 25 ? 'you are learned, and still at it' : '',
    blade: p => trains(p, 'sword', 'melee') ? 'you train the blade by choice' : style(p) >= 1 ? 'you went to school for a style' : '',
    knight: p => p.order ? 'you joined an order' : p.mil && !p.mil.merc && aim(p, 'advance') && (style(p) >= 1 || noble(p)) ? 'you push to rise, and you can fight' : '',
    soldier: p => p.mil && !p.mil.merc && aim(p, 'advance') ? 'you push to rise in the ranks' : '',
    explorer: p => (p.seen || []).length >= 2 ? 'you have been abroad' : path(p) === 'sea' ? 'you went to sea' : '',
    court: p => office(p) ? 'you hold an office' : aim(p, 'patron') && (noble(p) || p.status === 'gentry') ? 'you court a patron among the great' : '',
    throne: p => aim(p, 'scheme') && (noble(p) || (p.mil && p.mil.rank >= 5) || (+p.fame || 0) >= 30) ? 'you scheme, and you are within reach' : '',
    expand: p => p.ruler && aim(p, 'warplan') ? 'you prepare for war' : '',
    golden: p => p.ruler && aim(p, 'govern') ? 'you govern' : '',
    web: p => p.ruler && aim(p, 'statecraft') ? 'you work at statecraft' : '',
  };
  SEEK.why = function (p, k) {
    if (!p) return '';
    try {
      if (k) { const f = SEEK.RULES[k]; return f ? f(p) || '' : ''; }
      for (const key of Object.keys(SEEK.RULES)) { const w = SEEK.RULES[key](p); if (w) return w; }
    } catch (e) { console.error('what you seek', e); }
    return '';
  };
  SEEK.is = (p, k) => !!SEEK.why(p, k);
})();
