"""Isolated, read-only applicant reconciliation. No MASTER writes or ID allocation.

Input records are verified official PDF extracts. Private Drive identity input is
only a conflict veto; none of its cells are copied into public output.
"""
import argparse, collections, copy, hashlib, json, re, sys
from pathlib import Path

def read(p): return json.loads(Path(p).read_text())
def dump(p, value):
    p=Path(p); p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def norm(v): return re.sub(r'\s+','',str(v or '')).casefold()
def dob(v): return str(v or '').replace('.','-')[:10]
def school(v):
    v=norm(v).replace('대학교','대').replace('고등학교','고')
    return {'국립목포대':'목포대','인하대사범대학부속고':'인하사대부고','전주근영여자고':'근영여고','광주여자대':'광주여대','천안청수고':'청수고'}.get(v,v).replace('여자고','여고')
def record_id(season,gender,row):
    # Applicant/event identity, NEVER a player ID. Renumbering does not change it.
    key='|'.join([season,gender,norm(row['name']),dob(row['birth_date'])])
    return f'KVL-DA-{season}-{gender}-'+hashlib.sha256(key.encode()).hexdigest()[:14]
def match(row,gender,catalog,drive):
    names=[p for p in catalog if p['gender']==gender and norm(p['name'])==norm(row['name'])]
    exact=[p for p in names if dob(p.get('birthDate'))==row['birth_date']]
    name_drive=[p for p in drive if norm(p['name'])==norm(row['name']) and dob(p.get('birth_date'))==row['birth_date']]
    reason='기존 공개 DB에서 동일 신원을 확인하지 못했습니다.'; status='unmatched'; chosen=None; rule=None
    if len(exact)>1: status='duplicate_review'; reason='이름·생년월일이 같은 기존 ID가 여러 개입니다.'
    elif exact: chosen=exact[0];rule='name_birth_date'
    else:
        plausible=[p for p in names if school(p.get('school'))==school(row['school_or_team'])]
        # Never fall back from a conflicting full DOB to a weaker rule.
        if plausible:
            status='duplicate_review' if len(plausible)>1 else 'needs_review'
            reason='동일 이름·소속 후보의 생년월일이 공식 명단과 다르거나 확인되지 않았습니다.'
            unknown=[p for p in plausible if not p.get('birthDate')]
            if len(unknown)==1 and len(plausible)==1 and set(row['positions']) & set(re.split(r'[/,+]',unknown[0].get('rawPosition',''))):
                chosen=unknown[0];rule='name_affiliation_position'
        elif name_drive:
            status='needs_review';reason='MASTER에서 확인된 후보와 현재 공개 프로필의 신원 표기가 달라 검수가 필요합니다.'
    if chosen:
        same_id_drive=[p for p in drive if p['id']==chosen['id']]
        conflict=any(norm(p['name'])!=norm(row['name']) or (p.get('birth_date') and dob(p['birth_date'])!=row['birth_date']) for p in same_id_drive)
        other_ids={p['id'] for p in name_drive}-{chosen['id']}
        if other_ids: status='duplicate_review';reason='같은 신원에 다른 영구 ID 후보가 있어 자동 연결하지 않았습니다.';chosen=None
        elif conflict: status='needs_review';reason='공개 프로필과 MASTER의 신원 정보가 충돌해 검수가 필요합니다.';chosen=None
        elif not re.fullmatch(r'KVL-P-\d{6}',chosen['id']): status='needs_review';reason='기존 영구 ID 연결 검수가 필요합니다.';chosen=None
        else: status='matched';reason='공식 명단의 이름·생년월일과 기존 공개 프로필을 대조했습니다.' if rule=='name_birth_date' else '공식 이름·소속·포지션을 대조했습니다. 생년월일은 기존 DB에 없습니다.'
    candidates=sorted({p['id'] for p in names if school(p.get('school'))==school(row['school_or_team'])}|{p['id'] for p in name_drive})
    public={'status':status,'player_id':chosen['id'] if chosen else None,'profile_verified':bool(chosen),'evidence':([{'rule':rule,'official_source':row['source_url'],'profile_identity':'existing public player search + canonical identity overlay','master_checked':bool(same_id_drive)}] if chosen else []),'public_reason':reason}
    return public,candidates

def revisions(previous,current,history):
    """Identical recapture is a no-op. Corrections preserve full public before/after.
    Identity corrections require an explicit reviewed replacement (not silent reuse).
    """
    if previous==current:return history
    old={r['applicant_id']:r for r in previous.get('applicants',[])};new={r['applicant_id']:r for r in current['applicants']}
    changes=[]
    for key in sorted(old.keys()|new.keys()):
        if old.get(key)!=new.get(key):changes.append({'applicant_id':key,'before':old.get(key),'after':new.get(key),'note':'absence is not evidence of withdrawal' if key not in new else None})
    digest=hashlib.sha256(json.dumps(current,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    if not any(x['snapshot_sha256']==digest for x in history):history.append({'snapshot_sha256':digest,'verified_at':current['verified_at'],'sources':current['sources'],'changes':changes})
    return history

def build(inputs,catalog,drive,season,checked):
    data={'schema_version':1,'season':season,'verified_at':checked,'divisions':{},'sources':[],'applicants':[]};links=[];review=[]
    for gender,bundle in inputs:
        source=bundle['source'];rows=bundle['records'];expected=bundle['official_count']
        assert len(rows)==expected, 'Official / extracted count mismatch'
        assert len({(norm(x['name']),x['birth_date']) for x in rows})==len(rows),'Duplicate applicant'
        assert sorted(x['source_sequence'] for x in rows)==list(range(1,expected+1)),'Missing official row'
        src=f'KOVO-{season}-{gender}-{source["page_url"].split("/")[-1]}'
        label='남자부' if gender=='M' else '여자부'
        data['sources'].append({'source_id':src,'title':f'{season} KOVO {label} 공식 드래프트 신청자 명단','url':source['page_url'],'published_at':source['published_at'][:10],'verified_at':checked,'sha256':source['sha256'],'archive_drive_id':source['archive_drive_id'],'attachments':[{'url':source['attachment_url'],'sha256':source['sha256']}],'note':'KOVO 공식 보도자료 첨부 PDF의 전체 표를 추출하고 원본 화면으로 대조. 지명 결과는 별도 검증 전입니다.'})
        data['divisions'][gender]={'official_count':expected,'count_label':' · '.join(f'{label}{n}' for category,label in [('university','대학'),('high_school','고교'),('industrial','실업'),('overseas_korean','동포')] if (n:=sum(r['participation_category']==category for r in rows))),'summary':f'공식 {expected}명 · 수록 {expected}명 대조 완료 · 2026.10.22 확인'}
        for row in rows:
            id=record_id(season,gender,row)
            data['applicants'].append({'applicant_id':id,'season':season,'draft_year':int(season[:4]),'gender':gender,'name':row['name'],'affiliation':row['school_or_team'],'category':row['participation_category'],'grade':row['grade'],'positions':row['positions'],'height_cm':row['height_cm'],'birth_year':row['birth_year'],'application_status':'confirmed','selection':{'status':'unverified','team':None,'round':None,'pick':None},'published_at':source['published_at'][:10],'verified_at':checked,'updated_at':checked,'source_id':src,'source_url':source['page_url'],'source_locator':f'첨부 PDF {row["source_page"]}쪽 · {row["source_sequence"]}번','source_order':row['source_sequence'],'access_level':'PUBLIC','record_status':'VERIFIED'})
            link,candidates=match(row,gender,catalog,drive);link['applicant_id']=id;links.append(link)
            if link['status']!='matched':review.append({'applicant_id':id,'gender':gender,'name':row['name'],'affiliation':row['school_or_team'],'status':link['status'],'reason':link['public_reason'],'candidate_ids':candidates,'source_url':source['page_url']})
    linked=[r['player_id'] for r in links if r['status']=='matched'];assert len(linked)==len(set(linked)),'Same player linked to multiple applicants in one event'
    return data,{'schema_version':1,'season':season,'verified_at':checked,'links':links},review

def main():
    p=argparse.ArgumentParser();p.add_argument('--input-dir',required=True);p.add_argument('--catalog',required=True);p.add_argument('--drive-identities',required=True);p.add_argument('--out',required=True);p.add_argument('--report-dir',required=True);p.add_argument('--season',default='2026-27');p.add_argument('--checked',default='2026-10-22');p.add_argument('--source-config',default=str(Path(__file__).with_name('sources-2026-27.json')));a=p.parse_args()
    root=Path(a.input_dir);inputs=[]
    cfg=read(a.source_config);assert cfg['season']==a.season;archives={s['key']:s['archive_drive_id'] for s in cfg['sources']}
    verification=read(root/'official-source-verification.json')
    from collect import extract
    for g,sex in [('men','M'),('women','W')]:
        b=read(root/f'{g}-official-applicants-normalized.json');pdf=root/Path(b['source']['local_file']).name
        assert hashlib.sha256(pdf.read_bytes()).hexdigest()==b['source']['sha256'],'Original hash mismatch'
        reviewed=next(s for s in cfg['sources'] if s['key']==g)
        assert reviewed['sha256']==b['source']['sha256']
        original_rows=extract(pdf,reviewed)
        assert [{k:r[k] for k in original_rows[0]} for r in b['records']]==original_rows,'Normalized facts differ from original PDF'
        b['records']=original_rows;b['source']=reviewed
        b['source']['archive_drive_id']=archives[g];b['official_count']=verification[g]['official_count'];inputs.append((sex,b))
    catalog=read(a.catalog)['players'];drive=read(a.drive_identities);data,links,review=build(inputs,catalog,drive,a.season,a.checked)
    out=Path(a.out);report=Path(a.report_dir);previous=read(out/'applicants.json') if (out/'applicants.json').exists() else {}
    history=read(report/'revision-history.json') if (report/'revision-history.json').exists() else []
    dump(report/'revision-history.json',revisions(previous,data,history));dump(out/'applicants.json',data);dump(out/'player-links.json',links);dump(report/'connection-review.json',review)
    result={'official':{g:data['divisions'][g]['official_count'] for g in ['M','W']},'by_gender':{g:dict(collections.Counter(l['status'] for l in links['links'] if next(x for x in data['applicants'] if x['applicant_id']==l['applicant_id'])['gender']==g)) for g in ['M','W']},'counts':dict(collections.Counter(l['status'] for l in links['links'])),'applicant_duplicates':0,'duplicate_linked_player_ids':0,'new_player_ids':0,'public_catalog_records':len(catalog),'drive_master_rows_checked':len(drive),'raw_dob_and_weight_exported':False}
    dump(report/'data-validation.json',result);print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
