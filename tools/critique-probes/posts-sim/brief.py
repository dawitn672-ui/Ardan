import json,sys
for f in sys.argv[1:]:
  d=json.load(open(f)); res=d['res']
  print('#####',f,'secs',d['secs'],'errs',len(d['errs']), d['errs'][:2])
  if isinstance(res,dict): print(res.get('error','')[:1500]); continue
  for s in res:
    if 'label' not in s: print('   *',json.dumps(s)[:600]); continue
    pc=s['pc'];rl=s['realm'];m=pc['mil']
    print('  ==',s['label'],'| rank',m and m['rank'],'| office',pc['office'],'| mainRole',pc['mainRole'],'| cmdRole',pc['cmdRole']['key'],pc['cmdRole']['armies'],'| seat',pc['councilMarshal'],'| sup',pc['superior'])
    print('     posts',pc['posts'])
    print('     armies',[(a['id'],a['gen'],a['sub'],a['divs']) for a in rl['armies']])
    if rl['marshalTitled']: print('     marshal-titled',[(x['who'],x['occ'],x['posts']) for x in rl['marshalTitled']])
