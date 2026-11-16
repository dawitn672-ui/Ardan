const o = {};
o.MIL = GD.MIL; o.NOBLE_RUNGS = GD.NOBLE_RUNGS; o.COUNCIL = A.COUNCIL; o.CAREERS = Object.keys(GD.CAREERS || {});
o.ladders = LORE.ladders; o.titlesByRealm = LORE.titlesByRealm;
o.milUnitWord = [0,1,2,3,4,5,6,7,8,9,10].map(r => { try { return A.milUnitWord(r); } catch (e) { return 'ERR' } });
o.rankName = typeof A.rankName === 'function' ? [0,1,2,3,4,5,6,7,8,9].map(r => { try { return A.rankName(r) } catch (e) { return 'ERR' } }) : null;
o.fns = Object.keys(A).filter(k => /rank|promot|office|council|marshal|captain|command|company|army|title|holder|seat/i.test(k));
return o;
