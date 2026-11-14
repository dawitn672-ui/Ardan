import json, sys
L=sys.argv[1]; start=int(sys.argv[2]) if len(sys.argv)>2 else 0; maxn=int(sys.argv[3]) if len(sys.argv)>3 else 10**9
n=0
for i,line in enumerate(open(L+'/log.jsonl')):
    if i<start: continue
    o=json.loads(line); k=o.get('k')
    if k=='card':
        res=(o.get('result') or '')
        # strip boilerplate
        for b in ['Each choice shows your odds, set by your stats and skills. Keys 1 to 6 choose too.Got it⚑','Keep thisContinue Enter']:
            res=res.replace(b,' '); 
        t=o['text'].replace('Each choice shows your odds, set by your stats and skills. Keys 1 to 6 choose too.Got it⚑','')
        j=res.find('You chose:')
        print(f"#{i} [{o['date']} a{o['age']}] {o['ev']}{' NPC' if o.get('npc') else ''} :: {o['title']}\n   {t[:700]}\n   CH: " + '\n       '.join(c[:260] for c in o['ch']) + f"\n   => {res[j:j+500] if j>=0 else res[:300]}")
        n+=1
    elif k=='modal':
        if o['title'] and 'You chose' in o['text']: continue
        print(f"#{i} [{o['date']}] MODAL '{o['title']}' did={o['did']}\n   {o['text'][:900]}\n   ACTS: {o['acts'][:12]}")
    elif k=='overlay':
        print(f"#{i} [{o['date']}] OVERLAY {o.get('ov')} {json.dumps(o.get('d'))[:900]}")
    elif k in ('snap',):
        print(f"#{i} SNAP {json.dumps(o['me'])[:500]}")
    elif k=='path':
        pass
    elif k=='act':
        print(f"#{i} ACT {o['key']} :: {o.get('toast','')[:200]}")
    else:
        print(f"#{i} {json.dumps(o)[:300]}")
    if n>=maxn: break
