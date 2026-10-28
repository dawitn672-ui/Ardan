// 9992-identity, part 2: inner voices (design review cycle 1, #7, after Disco Elysium). One short line in a scene, above
// the choices, from the part of you that knows most about it: the skill a check rests on (your best of them), or else
// your strongest skill or most marked trait. A thought you are turning over (part 3) may speak instead.
//
// Pure: the voice and its line are picked by hashing the event id and the person id (as A.npcStyles does), never by
// A.rand, and nothing is written. It speaks only the first time a life meets an event (p.flags.ev has no year for it),
// so a scene seen again is quiet. UI.set.innerVoice = false turns it off.
//
// The registry is open: ID.VOICES[key] = { name, skills: [...], traits: [...], lines: { any: [...], fight: [...], ... } };
// a feature can add a voice or push lines into a kind. Kinds: fight, talk, money, faith, wild, court, kin, body, any.
(function () {
  const ID = A.ID = A.ID || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const hash = ID.hash;

  ID.VOICES = {
    blade: { name: 'Steel', skills: ['melee', 'sword', 'axe', 'spear', 'dagger', 'dualwield', 'shield', 'unarmed', 'lance', 'mounted'], lines: {
      any: ['Count the hands before you count the words.', 'Keep your weight on the back foot until you know.', 'Everyone here is standing too close.'],
      fight: ['He drops his shoulder before he swings. Watch the shoulder.', 'Low and inside. He guards his face like a vain man.', 'Your grip is wet. Wipe it on your thigh.', 'The ground slopes left. Make him climb it.'],
      talk: ['Words are a feint. See where he wants your eyes.', 'You could end this argument in two steps. Don\'t.'],
      court: ['Note the doors, and the men by the doors.'] } },
    bow: { name: 'The Draw', skills: ['bow', 'xbow', 'throwing'], lines: {
      any: ['Wind from the east, light, steady. Good for nothing yet.', 'Mark the distance. You will want it later.'],
      fight: ['Forty paces, and he has no shield.', 'Breathe out. Loose between heartbeats.', 'The man behind him matters more.'],
      wild: ['Fresh slot in the mud. Doe, not long gone.'] } },
    wild: { name: 'Fieldcraft', skills: ['survival', 'tracking', 'stealth', 'athletics', 'riding'], lines: {
      any: ['Smoke in the air, wet wood. Someone camped near.', 'You know three ways out of here already.', 'The birds went quiet a moment ago.'],
      wild: ['Rain by nightfall. The swallows are flying low.', 'Moss on the north side. You are walking in circles.', 'That track is a day old. The beast is not near.'],
      fight: ['Get the sun behind you.'], money: ['A man who sells boots should not have dry ones.'] } },
    sea: { name: 'Salt', skills: ['sea'], lines: {
      any: ['The tide will turn before this is settled.', 'Your legs still sway. Land always lies to you.'],
      wild: ['Gulls inland. A blow is coming off the water.'], money: ['Cargo that cheap was not paid for.'], fight: ['Fight on a wet deck and you fight the deck.'] } },
    tongue: { name: 'Silver Tongue', skills: ['persuasion', 'diplomacy', 'etiquette', 'music'], lines: {
      any: ['Say his name once, early. People soften at their own name.', 'Let the silence do the asking.', 'Smile with the eyes, or not at all.'],
      talk: ['He wants to be asked, not told.', 'Agree with the first thing he says. Then the second is yours.', 'She is afraid. Speak to the fear, not the words.'],
      court: ['Bow a hair lower than the man beside you.', 'The steward decides who sees the lord. Flatter the steward.'],
      money: ['Name a price and be quiet. The first to speak loses.'] } },
    guile: { name: 'Guile', skills: ['deception', 'intrigue', 'gambling'], lines: {
      any: ['Nobody tells the truth in a room this warm.', 'He touched his ear when he said it. Remember that.', 'Everyone owes someone. Find out whom.'],
      talk: ['A lie works best with one true thing tied to it.', 'He has rehearsed this. Ask him something he has not.'],
      court: ['Who here gains if you fail? Look at that one.'], money: ['The dice are shaved. Bet against the house.'] } },
    fear: { name: 'Menace', skills: ['intimidation'], lines: {
      any: ['Stand still. Let them wonder what you will do.', 'He looks away first. He always will.'],
      talk: ['Lower your voice. Make him lean in to hear it.'], fight: ['He has already lost. Show him he knows it.'] } },
    war: { name: 'The Captain', skills: ['command', 'tactics', 'logistics', 'siegecraft'], lines: {
      any: ['Bread first, then glory. Men march on bread.', 'Who holds the high ground here, and who wants it?'],
      fight: ['Never fight with a river at your back.', 'Hold the reserve. The battle is not where it looks.', 'Their left is green levies. Hit the left.'],
      court: ['A council is a battle where nobody bleeds until later.'], money: ['Count the carts, not the coin.'] } },
    ledger: { name: 'The Ledger', skills: ['stewardship', 'trade'], lines: {
      any: ['Somebody is paying for all of this. Find out who.', 'A tenth here, a tenth there. It adds up.'],
      money: ['That price is a third too high and he knows it.', 'Never lend what you cannot lose.', 'The grain will be dearer by spring. Buy now.'],
      court: ['The treasury is thinner than the robes suggest.'], kin: ['A wedding is a contract with music.'] } },
    book: { name: 'Letters', skills: ['learning', 'medicine'], lines: {
      any: ['This has happened before. The old books say how it ended.', 'Write it down tonight, before you remember it wrong.'],
      body: ['Pale gums, sour breath. That is not grief, that is fever.', 'Boil the water first. The old monks were right.'],
      faith: ['The scripture says the opposite, in the older copies.'], talk: ['He quotes the law badly. The clause he wants is the next one.'] } },
    faith: { name: 'The Psalter', skills: ['faith'], lines: {
      any: ['The gods are watching this one. Do it well.', 'Say the short prayer. It costs nothing.'],
      faith: ['A true priest does not ask for silver first.', 'The relic is old. The box is new.'], body: ['Some sicknesses are a door. Some are only sickness.'] } },
    hands: { name: 'Calluses', skills: ['craft', 'husbandry'], lines: {
      any: ['Good work is slow work. You can see who hurried here.', 'Look at his hands. They tell you his trade.'],
      money: ['That iron was quenched in a hurry. It will crack.', 'Feel the wool, not the dye.'], wild: ['The rust is in the third field already. Burn it.', 'Rich soil, poor drainage. Wet feet all spring.'] } },
    nerve: { name: 'Nerve', traits: ['brave'], lines: {
      any: ['Your heart is quiet. Good. Use it.', 'Go first. Others will follow the one who goes first.'],
      fight: ['Fear is only the body asking a question. Answer it.'] } },
    dread: { name: 'Dread', traits: ['craven', 'shy'], lines: {
      any: ['There is a door behind you. You could simply leave.', 'They are all looking at you. Are they?', 'It will go badly. It usually does.'],
      fight: ['Your knees know something your pride does not.'] } },
    pride: { name: 'Pride', traits: ['proud', 'ambitious'], lines: {
      any: ['You were not born to stand at the back.', 'Remember who you are. Make them remember.'],
      court: ['That seat should be yours.'], talk: ['He speaks to you as to a servant. Correct him.'] } },
    mercy: { name: 'Mercy', traits: ['kind', 'generous', 'humble'], lines: {
      any: ['Someone here is hungry. Find them.', 'Whatever you choose, be gentle with the losers.'],
      fight: ['He has children. You can see it in how he stands.'], money: ['A coin means more to her than to you.'] } },
    hunger: { name: 'Hunger', traits: ['greedy', 'cruel', 'deceitful'], lines: {
      any: ['What do you get out of it? Ask that first.', 'There is profit in this, if you are not squeamish.'],
      money: ['He would pay double. Ask double.'], talk: ['Kindness is a debt you collect later.'] } },
    temper: { name: 'Temper', traits: ['wrathful', 'impetuous', 'stubborn'], lines: {
      any: ['One more word from him and you will not answer for yourself.', 'Why wait? Waiting is for men with time.'],
      talk: ['You have been patient. Look where it got you.'], fight: ['Let it out. That is what it is for.'] } },
  };
  ID.voiceOf = function (key) { return ID.VOICES[key] || null; };
  ID.voiceForSkill = function (sk) { for (const k in ID.VOICES) if ((ID.VOICES[k].skills || []).includes(sk)) return k; return null; };

  // what kind of scene this is: the check's skill first, then the print's shape (61's), then a few words of the text
  const SHAPE = { court: 'court', letter: 'talk', learning: 'faith', money: 'money', play: 'talk', food: 'kin', sickness: 'body', favor: 'court',
    war: 'fight', beast: 'wild', travel: 'wild', weather: 'wild', subordinate: 'court', death: 'kin', family: 'kin', romance: 'kin', faith: 'faith', church: 'faith' };
  const SKKIND = { blade: 'fight', bow: 'fight', fear: 'talk', war: 'fight', tongue: 'talk', guile: 'talk', ledger: 'money', hands: 'money', book: 'body', faith: 'faith', wild: 'wild', sea: 'wild' };
  ID.sceneKind = function (q, v, e) {
    const checks = (e.choices || []).map(c => c && c.check && c.check.s).filter(Boolean);
    for (const s of checks) { const k = ID.voiceForSkill(s); if (k && SKKIND[k]) return SKKIND[k]; }
    let shape = null;
    try { shape = UI.WOODCUT && UI.WOODCUT.shapeOf ? UI.WOODCUT.shapeOf(q, v) : null; } catch (err) { shape = null; }
    if (shape && SHAPE[shape]) return SHAPE[shape];
    const t = `${v.title || ''} ${typeof v.text === 'string' ? v.text : ''}`;
    if (/\b(sword|blade|fight|duel|brawl|raid|ambush|battle)\b/i.test(t)) return 'fight';
    if (/\b(coin|suns|price|debt|market|buy|sell|tax)\b/i.test(t)) return 'money';
    if (/\b(priest|temple|church|god|gods|prayer|shrine)\b/i.test(t)) return 'faith';
    if (/\b(fever|sick|wound|blood|plague)\b/i.test(t)) return 'body';
    if (/\b(mother|father|wife|husband|child|son|daughter|wedding)\b/i.test(t)) return 'kin';
    return 'any';
  };

  // who speaks: the skill of the scene's own check (your best of its checks), or your strongest trained skill (30 and
  // up), or your most marked trait; the two last are weighed by hash, so the same life does not hear one voice alone
  ID.speaker = function (pc, e, key) {
    const sk = k => { try { return A.skill(pc, k); } catch (err) { return 0; } };
    const checks = (e.choices || []).map(c => c && c.check && c.check.s).filter(s => s && GD.SKILLS && GD.SKILLS[s]);
    if (checks.length) {
      const best = checks.sort((a, b) => sk(b) - sk(a))[0], k = ID.voiceForSkill(best);
      if (k && sk(best) >= 15) return k;
    }
    let bs = null, bv = 29;
    for (const s in (GD.SKILLS || {})) { const v = sk(s); if (v > bv) { bv = v; bs = s; } }
    const tr = (pc.traits || []).map(t => { for (const k in ID.VOICES) if ((ID.VOICES[k].traits || []).includes(t)) return k; return null; }).filter(Boolean);
    const fromSkill = bs ? ID.voiceForSkill(bs) : null;
    if (fromSkill && tr.length) return hash(key + '|who') % 3 ? fromSkill : tr[hash(key + '|tr') % tr.length];
    return fromSkill || (tr.length ? tr[hash(key + '|tr') % tr.length] : null);
  };

  ID.VOICE_SHARE = 0.6;   // the share of first sightings that carry a voice
  ID.voiceFor = function (pc, q) {
    if (!pc || !q || q.type !== 'event' || !pc.alive || A.age(pc) < 8) return null;
    if (UI.set && UI.set.innerVoice === false) return null;
    const e = A.EV[q.ev];
    if (!e || e.npc && /^cf_/.test(e.id)) return null;
    if (pc.flags && pc.flags.ev && pc.flags.ev[q.ev] != null) return null;     // a scene met before: quiet
    const key = `${q.ev}|${pc.id}`;
    if ((hash(key) % 100) >= ID.VOICE_SHARE * 100) return null;
    const v = q.view || {};
    const kind = ID.sceneKind(q, v, e);
    // a thought you are turning over, or one that ripened, has its say one time in four
    if (ID.thoughtVoice) { const tv = ID.thoughtVoice(pc, key, kind); if (tv) return tv; }
    const who = ID.speaker(pc, e, key), V = who && ID.VOICES[who];
    if (!V) return null;
    const pool = (V.lines[kind] && V.lines[kind].length ? V.lines[kind] : []).concat(V.lines.any || []);
    if (!pool.length) return null;
    const line = pool[hash(key + '|line') % pool.length];
    return { key: who, name: V.name, line, kind };
  };
  ID.voiceHtml = vo => vo ? `<div class="idv-voice idv-${esc(vo.key)}${vo.thought ? ' idv-thought' : ''}" data-voice="${esc(vo.key)}"><span class="idv-who">${esc(vo.name)}</span><span class="idv-line">${esc(vo.line)}</span></div>` : '';

  // the hook: after 92 has built the card (its wrapper runs first), the line goes just above the choices
  const qm = UI.queueModal;
  if (typeof qm === 'function') {
    UI.queueModal = function (q) {
      const h = qm.apply(this, arguments);
      try {
        if (typeof h !== 'string' || !q || q.type !== 'event' || q.result || h.indexOf('idv-voice') >= 0) return h;
        const vo = ID.voiceFor(A.pc(), q);
        if (!vo) return h;
        const at = h.indexOf('<div class="choices');
        return at >= 0 ? h.slice(0, at) + ID.voiceHtml(vo) + h.slice(at) : h;
      } catch (e) { console.error('inner voice', e); return h; }
    };
  }
  // the setting, beside the release's own
  const menu = UI.ILLUM && UI.ILLUM.menu;
  if (typeof menu === 'function') UI.ILLUM.menu = function () { return menu.apply(this, arguments) + `<label class="row"><input type="checkbox" data-c="setInnerVoice" ${UI.set.innerVoice !== false ? 'checked' : ''}> Inner voices in scenes</label>`; };
  Object.assign(UI.C, { setInnerVoice(el) { UI.set.innerVoice = el.checked; UI.saveSettings && UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); } });
})();
