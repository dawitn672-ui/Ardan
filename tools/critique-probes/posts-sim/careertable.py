import json,glob,collections
rows=[]
for f in sorted(glob.glob('q*/w*_*.out.json')):
  d=json.load(open(f)); r=d['res']
  if 'error' in r: rows.append((f,'ERR')); continue
  ys=[y for y in r['years'] if not y.get('dead')]
  dead=[y for y in r['years'] if y.get('dead')]
  ranks=[y['rank'] for y in ys]
  fl=collections.Counter(x['k'] for x in r['flags'])
  first={}
  for x in r['flags']:
    first.setdefault(x['k'],x)
  seat=[x for x in r['flags'] if x['k']=='namedToSeat']
  path=[]
  last=None
  for y in ys:
    k=(y['rank'],y['office'])
    if k!=last: path.append(f"{y['y']}:{'r'+str(y['rank']) if y['rank'] is not None else 'out'}{'/'+y['office'] if y['office'] else ''}")
    last=k
  rows.append((r['seed'],r['status'],len(ys),(dead[0]['y'] if dead else ''),' '.join(path),', '.join(f"{x['y']} {x['v']['seat']} at rank {x['v']['rank']}" for x in seat),dict(fl)))
for row in rows: print(row)
