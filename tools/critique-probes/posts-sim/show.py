import json,sys
d=json.load(open(sys.argv[1]))
print('secs',d['secs'],'errs',d['errs'][:5])
res=d['res']
if isinstance(res,dict) and 'error' in res: print(res['error']); sys.exit()
for s in res:
  if 'label' not in s: print('  ',json.dumps(s)[:1500]); continue
  pc=s['pc']; rl=s['realm']
  print('==',s['label'],'| year',pc['year'])
  m=pc['mil']
  print('   pc.mil:',(m and {k:m[k] for k in ('rank','title','div','army','co')}),'| office:',pc['office'],'| mainRole:',pc['mainRole'],'| cmdRole:',pc['cmdRole'],'| v2:',pc['v2rank'],pc['v2leads'])
  print('   superior:',pc['superior'],'| councilMarshal:',pc['councilMarshal'])
  print('   posts:',pc['posts'])
  print('   chain:',pc['chain'][:300])
  print('   armies:',[(a['id'],a['gen'],a['sub'],a['divs'],a['men']) for a in rl['armies']])
  print('   marshal-titled:',rl['marshalTitled'])
