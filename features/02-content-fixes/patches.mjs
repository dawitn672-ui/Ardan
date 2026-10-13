// Event content fixes: exact find/replace edits on the minified build. See README.md.
export default [
  {
    id: 'EVT-TOKEN-DIGITS',
    blob: 'ardan-core',
    why: 'Tokens with digits ({mate2}, {h1}, {m2him}, {cap2}, {age2}, {n1}...) were neither filled nor caught, so 39 events ' +
      'showed raw braces ("You owe {mate2} {debt} suns"). The values were already in the context; allow digits in both patterns.',
    edits: [
      ['return str.replace(/\\{([a-zA-Z_.]+)\\}/g,', 'return str.replace(/\\{([a-zA-Z0-9_.]+)\\}/g,'],
      ['(v.skip=!!(q.ctx&&q.ctx.skip)||/\\{[a-zA-Z_.]+\\}/.test(', '(v.skip=!!(q.ctx&&q.ctx.skip)||/\\{[a-zA-Z0-9_.]+\\}/.test('],
    ],
  },
  {
    id: 'EVT-DELEG-COUSIN',
    blob: 'ardan-content',
    why: 'st_deleg_cousin used {they}, which is not a token, so the event was always dropped after using up its roll.',
    edits: [['You hear afterwards that {they} is the cousin', 'You hear afterwards that {them} is the cousin']],
  },
  {
    id: 'EVT-SERV-SECRET',
    blob: 'ardan-content',
    why: 'wk_serv_secret: one of its four secrets contains {enemy}, which this pack never filled, so the event was dropped 1 time in 4.',
    edits: [[
      'setup:(p,ctx)=>{ctx.secret=A.pick(["the steward has been selling',
      'setup:(p,ctx)=>{ctx.secret=A.T(A.pick(["the steward has been selling',
    ], [
      '"the mistress has a lover among the household knights"])},text:"Servants know everything.',
      '"the mistress has a lover among the household knights"]))},text:"Servants know everything.',
    ]],
  },
  {
    id: 'EVT-TEXT-DIET',
    blob: 'ardan-content',
    why: 'The text diet (event text <= 80 words, choices <= 12) had three misses: two 13-word choices, and rl_sec_calf, ' +
      'whose 59-word intro plus the public story it pulls from the lore rendered at about 83 words.',
    edits: [
      ['Leave the law as it is and swear the lords to it again', 'Keep the law and swear the lords to it again'],
      ["Go, and tell the officer what you have overheard at your master's table", "Go, and report what you overheard at your master's table"],
      ['intro:()=>"A clerk in Amberport\'s harbor market is throwing out old rolls. One line catches your eye: a pale elephant calf, sold in 1101 to buyers from a Ranpuri temple, paid in gold. The white elephant Moon-Pearl has no calf, people say, and the dream of Ranpur ends when she dies. Or does she have one?"',
        'intro:()=>"A clerk in Amberport\'s harbor market is throwing out old rolls. One line: a pale elephant calf, sold in 1101 to a Ranpuri temple, paid in gold. The white elephant Moon-Pearl has no calf, people say, and Ranpur\'s dream ends when she dies. Or has she?"'],
    ],
  },
  {
    id: 'TXT-MENTOR-LEGACY',
    blob: 'ardan-core',
    why: 'The "The teacher" mastery still promised "+1 legacy", a system that was removed.',
    edits: [[
      'love you for it; your trade remembers you (+1 legacy if you die a master).",',
      'love you for it; your trade remembers you.",',
    ]],
  },
];
