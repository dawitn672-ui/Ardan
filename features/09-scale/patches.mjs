// The engine at scale: exact find/replace edits on the minified build. See README.md.
// Every site that writes a province's owner (or creates a house) after the game has started tells 09-scale's indexes
// that land (or the houses) moved, so the province-per-realm index and the house-per-realm index are rebuilt before
// anyone reads them again. test.mjs (scaleSites) checks that no other write site exists in the built game.
const land = 'A.scaleLand&&A.scaleLand()', house = 'A.scaleHouse&&A.scaleHouse()';
export default [
  {
    id: 'SCALE-LAND-WRITES',
    blob: 'ardan-core',
    why: 'A.realmProvs and A.neighbors scanned every province on every call (A.politicsYear asks them for every pair of ' +
      'realms, so a year cost realms² × provinces). 09-scale answers them from an index of provinces by owner, which must ' +
      'be dropped the moment a province changes hands. These are all the places that write a province\'s owner directly: ' +
      'transferProv, the claimant settlements in settleWar, a claimant taking land in a succession war, a player founding ' +
      'a realm, a faction breaking away, and Tessaria\'s split at the start. Each now bumps the land version.',
    edits: [
      ['prov.owner=to,', `prov.owner=to,${land},`],
      ['for(const q of north)q.owner="POL-31A";', `for(const q of north)q.owner="POL-31A",${land};`],
      ['for(const p of A.realmProvs(claimR.id))p.owner=w.leadD;', `for(const p of A.realmProvs(claimR.id))p.owner=w.leadD,${land};`, 2],
      ['for(const p of A.realmProvs(claimR.id))p.owner=target.id;', `for(const p of A.realmProvs(claimR.id))p.owner=target.id,${land};`],
      ['for(const p of take)p.owner=nr.id;', `for(const p of take)p.owner=nr.id,${land};`],
      ['for(const id of provIds)A.prov(id).owner=r.id;', `for(const id of provIds)A.prov(id).owner=r.id,${land};`],
      ['for(const p of provs)p.owner=nr.id;', `for(const p of provs)p.owner=nr.id,${land};`],
    ],
  },
  {
    id: 'SCALE-HOUSE-WRITES',
    blob: 'ardan-core',
    why: 'A.realmHouses filtered every house in the world on every call. 09-scale answers it from an index of houses by ' +
      'realm, dropped when a house is created during play: the player\'s own house (founding a realm, or rising into the ' +
      'gentry). Nothing in the release changes a house\'s realm, kind or extinction during play (70-fresh-realms does, inside ' +
      'A.initWorld); test.mjs (scaleSites) checks the creation sites, and each month 09-scale compares the index with the houses.',
    edits: [
      ['A.S.houses[hid].realm=r.id;', `A.S.houses[hid].realm=r.id,${house};`],
      ['founded:A.S.year,members:[pc.id]},pc.house=hid,', `founded:A.S.year,members:[pc.id]},${house},pc.house=hid,`],
    ],
  },
  {
    id: 'SCALE-EMBARGO-COUNT',
    blob: 'ardan-core',
    why: 'A.priceTarget (for every imported good of every market, twice a month) and A.tradeMul (for every realm in every ' +
      'A.updateRealmPops) counted embargoes and trade pacts by walking every realm and calling A.hasTrade for each: ' +
      'realms² work per market pass, 23 ms per updateRealmPops at 10x. 09-scale counts the same two numbers over the ' +
      'realms that have an embargo on their books and over the realm\'s own trade pacts (A.scaleEmbPact, A.scaleEmb); the ' +
      'original loop still runs when they answer null (A.SCALE_OFF, or A.hasTrade replaced).',
    edits: [
      ['let emb=0,pact=0;for(const id in A.S.realms){const o=A.S.realms[id];o.alive&&(o.tr&&o.tr.emb&&o.tr.emb[r.id]>A.S.year&&emb++,A.hasTrade(r.id,id)&&pact++)}',
        'let emb=0,pact=0;const _ep=A.scaleEmbPact&&A.scaleEmbPact(r);if(_ep)emb=_ep[0],pact=_ep[1];else for(const id in A.S.realms){const o=A.S.realms[id];o.alive&&(o.tr&&o.tr.emb&&o.tr.emb[r.id]>A.S.year&&emb++,A.hasTrade(r.id,id)&&pact++)}'],
      ['let n=0;for(const id in A.S.realms){const o=A.S.realms[id];o.alive&&o.tr&&o.tr.emb&&o.tr.emb[r.id]>A.S.year&&n++}',
        'let n=A.scaleEmb?A.scaleEmb(r):null;if(n==null){n=0;for(const id in A.S.realms){const o=A.S.realms[id];o.alive&&o.tr&&o.tr.emb&&o.tr.emb[r.id]>A.S.year&&n++}}'],
    ],
  },
  {
    id: 'SCALE-EMBARGO-ADD',
    blob: 'ardan-core',
    why: 'Embargoes are counted from a list of the realms that have ever laid one (09-scale), so the list must grow the ' +
      'moment a realm lays its first. A.sign is the only place that writes an embargo; lifting one only deletes, which ' +
      'cannot make the list too short.',
    edits: [['case"emb":ra.tr.emb[b]=Y+(opts.years||5),', 'case"emb":ra.tr.emb[b]=Y+(opts.years||5),A.scaleEmbAdd&&A.scaleEmbAdd(ra),']],
  },
  {
    id: 'SCALE-SUPPLY-CTRL',
    blob: 'ardan-core',
    why: 'A.supplyMap worked out who controls each province (A.ctrl, then a Map lookup) for every province of the map, ' +
      'once for every realm at war, every day. Inside A.wsSupplyDay nothing changes hands, so 09-scale works out the ' +
      'controllers once per day and gives each realm its codes per controller (A.scaleFr), the same codes in the same ' +
      'places. Outside that batch, or with A.SCALE_OFF, the original loop runs.',
    edits: [['for(let i=0;i<N;i++)fr[i]=codeOf(A.ctrl(S.prov[i]));', 'if(!(A.scaleFr&&A.scaleFr(fr,N,codeOf,rid)))for(let i=0;i<N;i++)fr[i]=codeOf(A.ctrl(S.prov[i]));']],
  },
  {
    id: 'SCALE-PATH-RELATIONS',
    blob: 'ardan-core',
    why: 'A.wsPath (an army\'s road) asked A.friendly and A.hostile, each a walk over every war, for every road it ' +
      'weighed: thousands of times per path on a large map. The answers depend only on who holds the next province, and ' +
      'nothing changes while a path is found, so 09-scale remembers them per holder for the length of one search ' +
      '(A.scaleRel). With A.SCALE_OFF both are asked every time, as before.',
    edits: [
      ['const dist=new Float64Array(N).fill(1/0),prev=new Int32Array(N).fill(-1),done=new Uint8Array(N),heap=[[0,from]];',
        'const _rm=new Map,dist=new Float64Array(N).fill(1/0),prev=new Int32Array(N).fill(-1),done=new Uint8Array(N),heap=[[0,from]];'],
      ['const P=S.prov[u],step=(v,sea)=>{const Q=S.prov[v],c=A.ctrl(Q),own=rid&&A.friendly(c,rid),foe=rid&&A.hostile(rid,c),',
        'const P=S.prov[u],step=(v,sea)=>{const Q=S.prov[v],c=A.ctrl(Q),_r=A.scaleRel?A.scaleRel(_rm,c,rid):[rid&&A.friendly(c,rid),rid&&A.hostile(rid,c)],own=_r[0],foe=_r[1],'],
    ],
  },
  {
    id: 'SCALE-PAIR-PERSONA',
    blob: 'ardan-core',
    why: 'A.politicsYear weighs every pair of live realms (A.aiPullSum), and each weighing asks A.rulerPersona for both ' +
      'rulers: 2 × realms² persona lookups a year, each building a key from the ruler\'s traits. Nothing in one realm\'s ' +
      'pass over the others changes a ruler, so 09-scale remembers each persona for the length of that pass ' +
      '(A.scalePairs opens and closes it; A.SCALE_CHECK compares every remembered persona with a fresh one).',
    edits: [
      ['for(const k in r.claims)S.year-r.claims[k]>=60&&delete r.claims[k];for(const o of live){',
        'for(const k in r.claims)S.year-r.claims[k]>=60&&delete r.claims[k];A.scalePairs&&A.scalePairs(1);for(const o of live){'],
      ['r.rel[o.id]=A.clamp(Math.round((r.rel[o.id]||0)+d),-100,100)}if(r.overlord){',
        'r.rel[o.id]=A.clamp(Math.round((r.rel[o.id]||0)+d),-100,100)}A.scalePairs&&A.scalePairs(0);if(r.overlord){'],
    ],
  },
  // ---- one world (world.core.js): these ask questions that answer null or false on the Known World, so a Known World
  // game plays exactly as before
  {
    id: 'WORLD-WAR-CAP',
    blob: 'ardan-core',
    why: 'A.aiWarCheck stopped every realm from starting a war while four wars were under way anywhere. Written for 35 ' +
      'realms; on the Great Continent the four were shared by 153 realms and ten lands, and the cap was full on a fifth to ' +
      'a third of days. A.warCapFull gives each land its share of the four (at least one), and is null on the Known World. ' +
      'A realm whose land is full makes no new war (its neighbours are passed over; the shuffles draw as before).',
    edits: [
      ['if(S.wars.filter(w=>w.cb!=="throne").length>=4)return;const live=A.dLive();',
        'const capFull=A.warCapFull&&A.warCapFull();if(!capFull&&S.wars.filter(w=>w.cb!=="throne").length>=4)return;const live=A.dLive();'],
      ['for(const oid of A.shuffle(A.neighbors(r.id))){const o=A.realm(oid);if(!o||!o.alive||o.isRebel||',
        'for(const oid of A.shuffle(A.neighbors(r.id))){const o=A.realm(oid);if(!o||!o.alive||o.isRebel||capFull&&capFull(r)||'],
    ],
  },
  {
    id: 'WORLD-REACH',
    blob: 'ardan-core',
    why: 'Neighbours (land or sea lane) could declare war, a coalition took in the neighbours of neighbours, and an ally ' +
      'or tributary (or a partner in a defensive pact, a guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25 realms from ' +
      'six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known World) keeps all ' +
      'three to realms whose land comes within 1,500 km of the other side.',
    edits: [
      ['const o=A.realm(oid);if(!o||!o.alive||o.isRebel||capFull&&capFull(r)||',
        'const o=A.realm(oid);if(!o||!o.alive||o.isRebel||capFull&&capFull(r)||A.outOfReach&&A.outOfReach(r.id,oid)||'],
      ['A.relBetween(m.id,t.id)<20&&(A.neighbors(t.id).includes(m.id)||A.neighbors(m.id).some(n=>A.neighbors(t.id).includes(n)))',
        'A.relBetween(m.id,t.id)<20&&(A.neighbors(t.id).includes(m.id)||A.neighbors(m.id).some(n=>A.neighbors(t.id).includes(n)))&&!(A.outOfReach&&A.outOfReach(m.id,t.id))'],
      ['const join=(side,rid,why)=>{const r=A.realm(rid);return!r||!r.alive||',
        'const join=(side,rid,why)=>{const r=A.realm(rid);return!r||!r.alive||A.outOfReach&&A.outOfReach(rid,side==="att"?w.leadD:w.leadA)||'],
      // the pacts' own call (defensive pacts, guarantees, leagues), on a war's start
      ['const join=(side,rid,why)=>{const r=A.realm(rid);!r||!r.alive||',
        'const join=(side,rid,why)=>{const r=A.realm(rid);!r||!r.alive||A.outOfReach&&A.outOfReach(rid,side==="att"?def:att)||'],
      ['o&&o.alive&&!o.playerRun&&!w.att.includes(m)&&!w.def.includes(m)&&!A.atWar(m).length&&A.chance(.4)&&(w.def.push(m)',
        'o&&o.alive&&!o.playerRun&&!w.att.includes(m)&&!w.def.includes(m)&&!A.atWar(m).length&&!(A.outOfReach&&A.outOfReach(m,att))&&A.chance(.4)&&(w.def.push(m)'],
    ],
  },
];
