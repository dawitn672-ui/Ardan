import json, sys, collections
for L in sys.argv[1:]:
    months=[json.loads(l) for l in open(L+'/months.jsonl')]
    log=[json.loads(l) for l in open(L+'/log.jsonl')]
    cards=[o for o in log if o.get('k')=='card']
    # cards per age (all cards incl. activity-triggered)
    by=collections.Counter(o['age'] for o in cards if o.get('age') is not None)
    steps=collections.Counter(); quiet=collections.Counter(); camp=0; campq=0
    for m in months:
        a=m.get('age'); steps[a]+=1
        if m.get('cards',0)==0: quiet[a]+=1
        if m.get('camp'): camp+=1; campq+= (m.get('cards',0)==0)
    print('=====',L, 'steps',len(months),'cards',len(cards),'camp steps',camp,'quiet camp steps',campq)
    for a in sorted(steps):
        print(f"  age {a}: steps {steps[a]}, month-cards-0 {quiet[a]}, all cards {by.get(a,0)}")
    # repeated titles
    t=collections.Counter(o['title'] for o in cards)
    print('  repeated titles:', [(k,v) for k,v in t.most_common(12) if v>1])
    # no-effect choices
    noeff=sum(1 for o in cards for c in o['ch'] if c.split('|')[-1].strip() in ('Nothing changes','It will be remembered') )
    print('  choices total', sum(len(o['ch']) for o in cards), ' "Nothing changes"/"It will be remembered":', noeff)
    ms=[m['ms'] for m in months if m.get('cards',0)==0 and not m.get('camp')]
    if ms: print('  quiet-month ms: first10 avg', sum(ms[:10])/len(ms[:10]), 'last10 avg', sum(ms[-10:])/len(ms[-10:]))
