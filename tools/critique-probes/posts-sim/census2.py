import json,sys,statistics as st
for f in sys.argv[1:]:
  d=json.load(open(f)); r=d['res']
  if 'error' in r: print(f,'ERR',r['error'][:300]); continue
  print('#####',f,'seed',r['seed'],'secs/yr',round(r['secsPerYear'],1),'errs',len(d['errs']))
  for row in r['rows']:
    c=row['c']; c2=row['c2']
    print('  ',row['y'],'| realms',c2['realms'],'seatMarshal',c2['seatMarshal'],'| realms w/ other marshal-titled',c2['realmsWithOtherMarshalTitle'],'(people',c2['otherMarshalTitled'],c2['otherMarshalBy'],')',
      '| coAtStale',c2['coAtStale'],'companies2claim',c2['companiesTwoClaimants'],'senior2claim',c2['seniorTwoClaimants'],
      '| milRank people',c2['milRankPeople'],'no post',c2['milRankNoPost'],'| genOcc',c2['genOcc'],'noArmy',c2['genOccNoArmy'],
      '| armies',c['armies'],'genTwo',c['genTwoArmies'],'genIsSeatMarshal',c['genIsCouncilMarshal'],'genOtherSeat',c['genAlsoCouncilNonMarshal'],'divCmdDead',c['divCmdDead'],'2seats',c['personTwoCouncilSeats'],'polxGen',c['polHolderAlsoGen'],'polxSeat',c['polHolderAlsoCouncil'],'polxDiv',c['polHolderAlsoDivCmd'],'councillorDead',c['councillorDead'],'councillorIsRuler',c['councillorIsRuler'])
    if row is r['rows'][-1]:
      for s in c2['samples'][:10]: print('      sample',json.dumps(s)[:300])
