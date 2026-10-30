// Realm bibles, part A: the north (47-realm-bible). See bible.core.js for the kinds of custom and their fields.
(function () {
  const D = A.BIBLE_DATA = A.BIBLE_DATA || {}, W = A.BIBLE_WORDS = A.BIBLE_WORDS || {};

  W['CUL-02'] = [['hald', 'a household, one roof under one tax'], ['ringsworn', 'sworn on the iron ring'], ['folkmoot', 'the gathering of free men']];

  D['POL-01'] = {
    want: 'To push the Horde back over the Gordush for good and plough the steppe edge, so that the iron ring binds the whole plain.',
    fear: 'That Irondeep stops selling iron, and the heaviest cavalry in the Westland finds itself riding in leather.',
    place: { name: 'The Ring Hall at Kingsmere', text: 'Where the Emperor sits under a ring of black iron as wide as a cartwheel, and every lord swears on it at New Year.' },
    customs: [
      { id: 'ald_hearth', name: 'The hearth mark', kind: 'year', m: 0, who: 'free',
        rule: 'Each {w1} pays one mark a year at New Year, when the lords swear on the ring.',
        text: 'New Year\'s Day. In Kingsmere the lords kneel and swear on the iron ring; in your village the reeve walks from {w1} to {w1} for the hearth mark, one Ironside mark a roof. Yours is the third door he knocks on.',
        fx: { coin: -3 }, keepT: 'Pay the mark', keep: 'You pay. He scratches a line beside your name and moves on.',
        defy: { t: 'Bar the door and say you are out', r: 'He writes your name twice. In spring his men take a pig for it, and the neighbours watch.', fx: { coin: -6, wil: 1 } },
        log: 'The reeve takes the hearth mark from your {w1}.' },
      { id: 'ald_eldest', name: 'The eldest son\'s land', kind: 'mourn', share: 'eldestSon',
        rule: 'When a parent dies, the eldest son takes the land, the house and the plough-team.',
        text: '{parent} is buried in the yard of the Seven Halls. By the law of Aldmark the eldest son takes the land, the house and the team; the rest take what he gives them. The estate comes to {estate}. You get {got}.',
        fx: { happy: -2 }, keepT: 'Let the law stand', keep: 'You stand by the grave and say nothing about the will. Nobody else does either.',
        defy: { t: 'Take it to the {w3}', r: 'The {w3} hears you out and upholds the law. Your brother remembers that you asked.', fx: { wil: 1, happy: -4, honor: 1 } },
        log: '{parent} is buried, and the land goes as Aldmark\'s law says: you get {got}.' },
      { id: 'ald_scutage', name: 'Forty days or two marks', kind: 'levy', who: 'male',
        rule: 'In war, every free man owes forty days with the host, or two marks of scutage.',
        text: 'War, and the levy-riders come through with a list. Every free man of a {w1} owes forty days with the Emperor\'s host, or two marks of scutage to stay at home and plough.',
        fx: { coin: -6 }, keepT: 'Pay the scutage and stay', keep: 'You pay the two marks. The rider moves on to the next door.',
        defy: { t: 'Be out in the far field when they come', r: 'They do not find you. Your neighbours, who paid, notice that you did not.', fx: { honor: -4 } },
        log: 'The levy rides through for the war; you pay the scutage.' },
    ],
  };
})();
