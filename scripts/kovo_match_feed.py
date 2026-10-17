#!/usr/bin/env python3
"""K-Volley Lab match-only staged feed. Player data and publishing are excluded.

DB BANK is an end-of-match source. 'fixture_only' models live status transitions
for offline tests only, NEVER an actual score source. No live URL is yet verified.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys

STATUSES = ('scheduled', 'live', 'final', 'postponed', 'cancelled')
SOURCE_TYPES = ('dbbank_final', 'fixture_only')


class FeedError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise FeedError(message)


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def validate_sets(status, sets, won, current_set):
    require(isinstance(sets, list) and len(sets) <= 5, 'sets must be <=5 entries')
    require(isinstance(won, dict) and set(won) == {'home', 'away'}, 'won keys')
    require(all(type(v) is int and 0 <= v <= 3 for v in won.values()), 'invalid sets won')
    completed = 0
    for index, score in enumerate(sets):
        require(isinstance(score, dict) and set(score) == {'home', 'away', 'complete'}, 'set schema')
        h, a, done = score['home'], score['away'], score['complete']
        require(type(h) is int and type(a) is int and 0 <= h <= 99 and 0 <= a <= 99, 'invalid points')
        require(type(done) is bool, 'complete must be boolean')
        if done:
            completed += 1
            require(h != a, 'tied completed set')
            top, bottom = max(h,a), min(h,a)
            require(top >= (15 if index == 4 else 25) and top-bottom >= 2, 'invalid final set points')
        else:
            require(index == len(sets)-1 and status == 'live',
                    'incomplete set permitted only at end of live match')
    hw = sum(s['complete'] and s['home'] > s['away'] for s in sets)
    aw = sum(s['complete'] and s['away'] > s['home'] for s in sets)
    require((hw,aw) == (won['home'],won['away']), 'sets won disagree with completed sets')
    if status == 'final':
        require(3 <= len(sets) <= 5 and completed == len(sets), 'final requires 3-5 completed sets')
        require(max(hw,aw)==3 and min(hw,aw)<=2, 'invalid match winner')
        require(current_set is None, 'final current_set must be null')
    elif status == 'live':
        require(max(hw,aw)<3, 'live cannot have 3 winning sets')
        require(type(current_set) is int and 1 <= current_set <= 5, 'current_set required')
        require(current_set == completed+1, 'current_set not aligned')
        require(len(sets) in (completed, completed+1), 'bad live set count')
    else:
        require(not sets and hw == aw == 0 and current_set is None, 'non-playing game has scores')


def normalize_state(raw):
    require(isinstance(raw,dict), 'state object required')
    require(set(raw)=={'status','sets','sets_won','current_set'}, 'unexpected state fields')
    require(raw['status'] in STATUSES, 'invalid status')
    validate_sets(raw['status'],raw['sets'],raw['sets_won'],raw['current_set'])
    return raw


def dbbank_final(entry):
    # Importing parse_match is safe: it does not process individual player tables.
    from kovo_match_collector import parse_match, request_public_page, validate_url
    url = validate_url(entry['source']['url'])
    match = parse_match(request_public_page(url), url, {
        'date':entry['date'],
        'home_team':entry['home']['name'],
        'away_team':entry['away']['name']
    })
    score = match['score']
    state = normalize_state({
        'status':'final',
        'sets':[{'home':s['home'],'away':s['away'],'complete':True} for s in score['sets']],
        'sets_won':{'home':score['home'],'away':score['away']},
        'current_set':None
    })
    return state, {'provider':'KOVO_DB_BANK','url':url,
                   'game_number':match['game_number'],'type':'final_result_only'}


def fixture_state(entry, root, simulate):
    require(simulate, 'fixtures cannot be used for actual collection')
    name = entry['source']['path']
    require(isinstance(name,str) and re.fullmatch(r'[a-zA-Z0-9_./-]+\.json',name), 'fixture path')
    require(not name.startswith('/') and '..' not in Path(name).parts, 'path traversal')
    path=(root/name).resolve()
    require(path.is_relative_to(root.resolve()),'fixture outside root')
    return normalize_state(json.loads(path.read_text(encoding='utf-8'))), {
        'provider':'FIXTURE','url':None,'type':'simulation_only'}


def observation(entry, root, simulate=False):
    source_type=entry['source']['type']
    require(source_type in SOURCE_TYPES, 'unverified source adapter')
    if source_type=='dbbank_final':
        require(not simulate,'simulation must use fixture data')
        return dbbank_final(entry)
    return fixture_state(entry,root,simulate)


def validate_manifest(data):
    require(isinstance(data,dict) and isinstance(data.get('matches'),list),'manifest matches')
    items=data['matches']
    require(0<len(items)<=20,'manifest 1..20 matches')
    ids=set()
    for e in items:
        require(isinstance(e,dict) and re.fullmatch(r'[A-Za-z0-9_-]{4,80}',e.get('match_id','')), 'match id')
        require(e['match_id'] not in ids,'duplicate match')
        ids.add(e['match_id'])
        require(re.fullmatch(r'20\d{2}-\d{2}-\d{2}',e.get('date','')),'date')
        require(re.fullmatch(r'[a-z0-9-]{4,100}',e.get('competition_slug','')),'competition slug')
        for side in ('home','away'):
            require(isinstance(e.get(side),dict) and
                    re.fullmatch(r'[A-Z0-9]{2,10}',e[side].get('code','')),'team code')
            require(isinstance(e[side].get('name'),str) and e[side]['name'],'team name')
        require(e['home']['code']!=e['away']['code'],'duplicate teams')
        require(isinstance(e.get('source'),dict) and
                e['source'].get('type') in SOURCE_TYPES,'source')
        if e['source']['type']=='dbbank_final':
            from kovo_match_collector import validate_url
            validate_url(e['source']['url'])
    return items


def safe_update(previous,new,allow_correction=False):
    """Reject final rewrites, live point/set regressions without explicit review."""
    old=previous['state']
    a,b=old['status'],new['status']
    if a=='final':
        require(b=='final','final to nonfinal regression')
        require(old==new or allow_correction,'final correction needs review')
    if a in ('postponed','cancelled') and b!=a and not allow_correction:
        raise FeedError('administrative status change needs review')
    if a=='live' and b=='scheduled':
        raise FeedError('live to scheduled regression')
    if a=='live' and b=='live' and not allow_correction:
        require(sum(new['sets_won'].values()) >= sum(old['sets_won'].values()),
                'completed set regression')
        require(new['current_set']>=old['current_set'],'set number regression')
        if new['current_set']==old['current_set'] and new['sets'] and old['sets']:
            current,prior=new['sets'][-1],old['sets'][-1]
            require(current['home']>=prior['home'] and current['away']>=prior['away'],
                    'live point decrease requires review')
    return new!=old


def collect(manifest,output,previous=None,simulate=False):
    manifest=Path(manifest)
    entries=validate_manifest(json.loads(manifest.read_text(encoding='utf-8')))
    old={}
    if previous and Path(previous).exists():
        previous_data=json.loads(Path(previous).read_text(encoding='utf-8'))
        old={m['match_id']:m for m in previous_data.get('matches',[])}
    records=[]
    counts={'new':0,'changed':0,'unchanged':0}
    for entry in entries:
        state,source=observation(entry,manifest.parent,simulate)
        prior=old.get(entry['match_id'])
        if prior:
            require(prior['date']==entry['date'] and
                    prior['home_code']==entry['home']['code'] and
                    prior['away_code']==entry['away']['code'], 'match identity changed')
            changed=safe_update(prior,state)
        else:
            changed=True
        counts['new' if not prior else 'changed' if changed else 'unchanged']+=1
        records.append({
            'match_id':entry['match_id'],'competition_slug':entry['competition_slug'],
            'date':entry['date'],'home_code':entry['home']['code'],
            'away_code':entry['away']['code'],'state':state,
            'revision':(prior['revision']+1 if prior and changed else prior['revision'] if prior else 1),
            'source':source,'review_status':'SIMULATION_ONLY' if simulate else 'SOURCE_REVIEW_REQUIRED'
        })
    doc={'schema_version':1,'generated_at':now_utc(),
         'mode':'SIMULATION_ONLY' if simulate else 'STAGING_ONLY',
         'counts':counts,'matches':records}
    output=Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    tmp=output.with_suffix(output.suffix+'.tmp')
    tmp.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    tmp.replace(output)
    print('MATCH_FEED_OK',json.dumps(counts),'mode='+doc['mode'],flush=True)
    return doc


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',default='data/kovo/match-feed/pilot_manifest.json')
    parser.add_argument('--output',default='data/kovo/match-feed/staged.json')
    parser.add_argument('--previous')
    parser.add_argument('--simulate',action='store_true')
    args=parser.parse_args(argv)
    try:
        collect(args.manifest,args.output,args.previous,args.simulate)
    except (FeedError,ValueError,KeyError,FileNotFoundError,OSError) as e:
        print('MATCH_FEED_BLOCKED',type(e).__name__,str(e)[:180],file=sys.stderr)
        return 1
    return 0


if __name__=='__main__':
    sys.exit(main())
