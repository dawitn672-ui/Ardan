import json,sys,glob
for f in sys.argv[1:]:
  d=json.load(open(f)); r=d['res']
  if 'error' in r: print(f,'ERROR',r['error'][:500]); continue
  print('#####',f,'seed',r['seed'],r['status'],'enlist',r['enlist'],'secs/yr',round(r['secsPerYear'],1),'errs',len(d['errs']))
  for fl in r['flags']: print('   FLAG',fl['y'],fl['k'],json.dumps(fl['v'])[:300])
  last=None
  for y in r['years']:
    if y.get('dead'): print('   DEAD',y); continue
    key=(y['rank'],y['office'],y['cmdRole'],tuple(y['posts']))
    if key!=last: print('   ',y['y'],'age',y['age'],'rank',y['rank'],'office',y['office'],'|',y['mainRole'],'|',y['cmdRole'],y['v2rank'],y['leads'],'| sup',(y['superior'] or {}).get('occ'),'| posts',y['posts'])
    last=key
