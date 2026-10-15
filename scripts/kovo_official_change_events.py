"""Structured facts from HTML-body KOVO change notices; no full-body archiving."""
import re
from datetime import date
from html.parser import HTMLParser

FIELDS = ("event_id","notice_id","notice_date","season","kind","player_name","registered_name",
"gender","from_team","to_team","destination","jersey_number","position",
"previous_number","new_number","previous_position","new_position",
"salary_krw","option_krw","loan_start","loan_end","effective_date","confidence","source_url","notes")

class VisibleLines(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ("script","style"): self.skip+=1
        if tag in ("p","div","li","br","tr","h1","h2","h3"): self.parts.append("\n")
    def handle_endtag(self,tag):
        if tag in ("script","style"):self.skip=max(0,self.skip-1)
        if tag in ("p","div","li","tr"):self.parts.append("\n")
    def handle_data(self,data):
        if not self.skip:self.parts.append(data)

def extract_lines(html):
    parser=VisibleLines();parser.feed(html or "")
    return [re.sub(r"\s+"," ",line).strip() for line in "".join(parser.parts).splitlines() if line.strip()]

def date_iso(text):
    m=re.search(r"(20\d{2})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})",str(text or ""))
    if not m:return ""
    try:return date(int(m[1]),int(m[2]),int(m[3])).isoformat()
    except ValueError:return ""

def value(line,labels):
    for label in labels:
        m=re.match(r"^\s*"+re.escape(label)+r"\s*[:：]\s*(.*?)\s*$",line)
        if m:return m[1].strip()
    return ""

def amount(text):
    if not text:return None
    if str(text).strip() in ("없음","-","무"):return 0
    m=re.fullmatch(r"\s*([\d,]+)\s*천원\s*",str(text))
    return int(m[1].replace(",",""))*1000 if m else None

def segments(lines):
    marker=re.compile(r"^(선수명|이름|성명)\s*[:：]\s*")
    before,groups,current=[],[],[]
    for line in lines:
        if marker.match(line):
            if current:groups.append(current)
            current=[line]
        elif current:current.append(line)
        else:before.append(line)
    if current:groups.append(current)
    if not groups:
        pattern=(r"^\s*(SOOP(?:\s+SOOPers)?|페퍼저축은행|대한항공|현대캐피탈|"
            r"우리카드|KB손해보험|한국전력|OK저축은행|삼성화재|GS칼텍스|"
            r"한국도로공사|현대건설|흥국생명|IBK기업은행|정관장)\s*[:：]\s*([가-힣]{2,5})")
        for line in lines:
            m=re.match(pattern,line)
            if m:groups.append(["선수명 : "+m[2],"공시소속 : "+m[1]])
    return before,groups

def parse_events(html,title,notice_id,notice_date,kind,team,gender,source_url):
    lines=extract_lines(html)
    before,groups=segments(lines)
    date_string=next((value(line,["공시일","공시요청일"]) for line in lines if value(line,["공시일","공시요청일"])),"")
    general_date=date_iso(date_string) or str(notice_date)[:10]
    events=[]
    for group in groups:
        raw=value(group[0],["선수명","이름","성명"])
        if not raw:continue
        reg=re.search(r"등록명\s*[:：]\s*([가-힣A-Za-z\- ]+)",raw)
        registered_name=reg[1].strip(" )") if reg else ""
        player=re.sub(r"\(등록명.*$","",raw).strip()
        if not 1<len(player)<70:continue
        labels={}
        for line in group[1:]:
            if ":" in line or "：" in line:
                key,val=re.split(r"[:：]",line,maxsplit=1)
                labels[re.sub(r"\s+","",key)]=val.strip()
        def get(*keys):return next((labels[k] for k in keys if labels.get(k)),"")
        from_team=get("전소속구단","전소속팀","이적전구단","이전소속구단","공시소속")
        destination=get("임대구단")
        number=position=old_num=new_num=old_pos=new_pos=""
        uniform=get("배번/포지션","배번/위치","배번","등번호/포지션")
        match=re.search(r"(\d{1,3})\s*번?\s*/\s*([가-힣A-Za-z ]+)",uniform)
        if match:number=str(int(match[1]));position=match[2].strip()
        else:
            match=re.search(r"(\d{1,3})",uniform)
            if match:number=str(int(match[1]))
        changed=get("변경전/변경후","변경전/ 변경후","변경전/변경 후","변경전 / 변경후","변경전")
        if changed:
            pieces=re.split(r"\s*(?:->|→|⇒|=>)\s*",changed,maxsplit=1)
            if len(pieces)==2:
                if kind=="number_change":
                    n=re.search(r"\d+",pieces[0]);m=re.search(r"\d+",pieces[1])
                    old_num=str(int(n[0])) if n else "";new_num=str(int(m[0])) if m else ""
                    if new_num:number=new_num
                if kind=="position_change":
                    old_pos=pieces[0].strip();new_pos=pieces[1].strip();position=new_pos
        cash=get("연봉/옵션","연봉/ 옵션","연봉 / 옵션")
        parts=re.split(r"\s*/\s*",cash,maxsplit=1) if cash else []
        salary=amount(parts[0]) if len(parts)>0 else None
        option=amount(parts[1]) if len(parts)>1 else None
        dates=re.findall(r"20\d{2}[./-]\d{1,2}[./-]\d{1,2}",get("임대기간"))
        loan_start=date_iso(dates[0]) if dates else ""
        loan_end=date_iso(dates[1]) if len(dates)>1 else ""
        to_team=team if kind in ("transfer","registration","foreign_or_asian_quota","reinstatement") else ""
        effective=loan_start if kind=="loan" and loan_start else general_date
        confidence="high" if kind!="other_player_notice" and player and gender else "review"
        if kind=="transfer" and not from_team:confidence="review"
        if kind=="loan" and not (destination and loan_start):confidence="review"
        if kind in ("number_change","position_change") and not (new_num or new_pos):confidence="review"
        notes=""
        if kind=="loan" and loan_end and loan_end<general_date:notes="공시 이전 임대기간 종료; 현재 임대 중으로 단정 금지"
        if kind=="voluntary_termination":notes="이후 해지취소 및 재등록 공시 검토 필요"
        if kind=="free_agent":notes="자유신분 공시; 재등록 여부 검토 필요"
        if kind=="reinstatement":notes="임의해지 해지 및 선수등록"
        events.append({
            "event_id":f"{notice_id}-{len(events)+1:02d}","notice_id":notice_id,
            "notice_date":general_date,"season":"2026-27" if "2026-2027" in title else "2025-26" if "2025-2026" in title else "",
            "kind":kind,"player_name":player,"registered_name":registered_name,"gender":gender,
            "from_team":from_team,"to_team":to_team,"destination":destination,
            "jersey_number":number,"position":position,"previous_number":old_num,"new_number":new_num,
            "previous_position":old_pos,"new_position":new_pos,
            "salary_krw":salary,"option_krw":option,"loan_start":loan_start,"loan_end":loan_end,
            "effective_date":effective,"confidence":confidence,"source_url":source_url,"notes":notes
        })
    return events
