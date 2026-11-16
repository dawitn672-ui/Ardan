import json, sys, collections, re
allc=[]
for L in sys.argv[1:]:
    for line in open(L+'/log.jsonl'):
        o=json.loads(line)
        if o.get('k')=='card': o['L']=L; allc.append(o)
print('cards', len(allc))
def stake(c):
    parts=[p.strip() for p in c.split('|')]
    return ' '.join(parts[1:]).strip()
one=[o for o in allc if len(o['ch'])==1]
noeff=[o for o in allc if all(stake(c) in ('Nothing changes','It will be remembered','') or stake(c).startswith('The gathering ends') for c in o['ch'])]
print('single-choice cards', len(one), [ (o['L'],o['title']) for o in one][:12])
print('cards where no choice shows a stake', len(noeff), [(o['L'],o['title']) for o in noeff][:15])
# counsel inserts
coun=[o for o in allc if re.search(r'→ favours choice', o['text'])]
print('cards with a counsel insert', len(coun), 'of', len(allc))
# memory/chronicle inserts: sentences referring to past years in cards
mem=[o for o in allc if re.search(r'\b(in|of|since) 11[01]\d\b', o['text'])]
print('cards citing a past year', len(mem))
# check (dice) choices
chk=sum(1 for o in allc for c in o['ch'] if 'Check:' in c); tot=sum(len(o['ch']) for o in allc)
print('choices with a check', chk, 'of', tot)
# results contradicting preview: stake mentions regard of X but result shows only coin etc - skip
# lethal / death words in stakes
leth=[(o['L'],o['title'],c[:90]) for o in allc for c in o['ch'] if re.search(r'could kill|gallows|to the death|death', c)]
print('choices that warn of death', len(leth), leth[:8])
fights=[(o['L'],o['title'],c[:120]) for o in allc for c in o['ch'] if 'Starts a fight' in c]
print('"Starts a fight" choices', len(fights), fights[:8])
t=collections.Counter(o['ev'].split('_')[0] for o in allc if o.get('ev'))
print('event prefixes', t.most_common(30))
