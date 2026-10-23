"""Capture-only adapter. Reuses existing KOVO public transport, not registration parser.
Pinned source hashes + visually reviewed merged-cell ranges fail closed on revision.
Run with --fetch to recheck the public press API and preserve originals in --archive.
No network request ever publishes data or modifies MASTER.
"""
import argparse, hashlib, json, sys
from pathlib import Path
from datetime import date
from urllib.parse import quote, urlsplit, urlunsplit
from urllib.request import Request,urlopen
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from kovo_official_notices import request_json
from build import dump,read

def extract(pdfpath,source):
    import pdfplumber
    assert hashlib.sha256(pdfpath.read_bytes()).hexdigest()==source['sha256'],'Source revised: archive first, re-review PDF before publishing'
    with pdfplumber.open(pdfpath) as pdf:
        assert len(pdf.pages)==1,'Review changed layout'
        tables=pdf.pages[0].extract_tables(); assert len(tables)==1,'Review changed table structure'
        table=tables[0]
    assert table[0]==['구분','순','소속','학년','성명','생년월일','신장','체중','출신학교','포지션']
    rows=[]
    for raw in table[1:]:
        n=int(raw[1]);aff=next(s for first,last,s in source['affiliation_ranges'] if first<=n<=last)
        if raw[2]:assert raw[2]==aff,'Merged affiliation mismatch'
        birth=raw[5].rstrip('.').replace('.','-');date.fromisoformat(birth)
        gender=source['gender']
        category=next(c for first,last,c in source['category_ranges'] if first<=n<=last)
        rows.append({'name':raw[4],'birth_date':birth,'birth_year':int(birth[:4]),'school_or_team':aff,'grade':None if raw[3]=='-' else int(raw[3]),'participation_category':category,'height_cm':float(raw[6]),'positions':[p.strip() for p in raw[9].split(',')],'source_sequence':n,'source_page':1,'source_url':source['page_url']})
    assert len(rows)==source['official_count'];assert len({(r['name'],r['birth_date']) for r in rows})==len(rows)
    return rows

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);p.add_argument('--archive',required=True);p.add_argument('--fetch',action='store_true');a=p.parse_args();cfg=read(a.config);root=Path(a.archive);root.mkdir(parents=True,exist_ok=True);summary={}
    for source in cfg['sources']:
        key=source['key'];path=root/Path(source['local_file']).name
        if a.fetch:
            payload=request_json(urlsplit(source['api_url']).path)
            raw=json.dumps(payload,ensure_ascii=False,indent=2).encode();digest=hashlib.sha256(raw).hexdigest()
            (root/f'{key}-api-{digest}.json').write_bytes(raw)
            # Only the reviewed public official CDN attachment; no credential/session scraping.
            assert 'cdn.kovo.co.kr'==urlsplit(source['attachment_url']).hostname
            u=urlsplit(source['attachment_url']);url=urlunsplit((u.scheme,u.netloc,quote(u.path),u.query,''))
            with urlopen(Request(url,headers={'Referer':'https://kovo.co.kr/'}),timeout=30) as response:pdf=response.read(5_000_001)
            assert len(pdf)<=5_000_000 and pdf.startswith(b'%PDF-')
            digest=hashlib.sha256(pdf).hexdigest();(root/f'{key}-{digest}.pdf').write_bytes(pdf)
            assert digest==source['sha256'],'Corrected original preserved; human layout/content review required'
            path.write_bytes(pdf)
        rows=extract(path,source);dump(root/f'{key}-official-applicants-normalized.json',{'source':source,'records':rows});summary[key]={'official_count':source['official_count'],'extracted_count':len(rows)}
    dump(root/'official-source-verification.json',summary);print(json.dumps(summary))
if __name__=='__main__':main()
