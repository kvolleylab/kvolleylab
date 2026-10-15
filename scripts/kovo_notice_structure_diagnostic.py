#!/usr/bin/env python3
"""Inspect public KOVO announcement *structure* without archiving original body HTML."""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path

spec = importlib.util.spec_from_file_location("kovo", Path(__file__).with_name("kovo_official_notices.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

IDS = [155584, 156562, 155700, 155569, 157191, 156913, 156912,
       156626, 156625, 156777, 156776, 156736, 156588, 156517,
       155648, 157270, 156914, 157539, 157538, 157273, 155304]

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"): self.skip += 1
        if tag in ("p", "div", "tr", "br", "li"): self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in ("script", "style"): self.skip = max(0, self.skip-1)
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)

for ident in IDS:
    d=mod.detail(ident)
    title=mod.korean_text(d.get("titles"), "title")
    html=mod.korean_text(d.get("bodies"), "body")
    parser=mod.TableParser(); parser.feed(html)
    visible=VisibleText();visible.feed(html)
    text="\n".join(" ".join(line.split()) for line in "".join(visible.parts).splitlines())
    lines=[line[:95] for line in text.splitlines() if len(line.strip())>3]
    print(f"NOTICE id={ident} title={title[:95]} len={len(html)} tables={len(parser.tables)}")
    print("  text_peek: "+" | ".join(lines[:12])[:900])
    for i,table in enumerate(parser.tables[:3]):
        print(f"  table[{i}] rows={len(table)} max_columns={max(map(len,table),default=0)}")
        for row in table[:6]:
            print("    "+repr([c[:65] for c in row[:10]]))
    print("  ...")
