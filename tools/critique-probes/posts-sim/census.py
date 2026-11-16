import json,sys,glob,statistics as st
files=sys.argv[1:]
keys=None; agg={}
rows_all=[]
for f in files:
  d=json.load(open(f)); r=d['res']
  if 'error' in r: continue
  years=[y for y in r.get('years',[]) if y.get('census')]
  if not years and 'rows' in r: years=[{'y':x['y'],'census':x['c']} for x in r['rows']]
  for y in years:
    c=y['census']; rows_all.append((f,y['y'],c))
print('runs',len(files),'world-years',len(rows_all))
skip={'samples','occMarshalNotSeat','anySamples'}
ks=[k for k in rows_all[0][2] if k not in skip]
for k in ks:
  vals=[c[k] for _,_,c in rows_all if k in c]
  if not vals: continue
  nz=sum(1 for v in vals if v)
  print(f"{k:28s} mean {st.mean(vals):7.2f}  max {max(vals):5}  nonzero-years {nz}/{len(vals)}")
