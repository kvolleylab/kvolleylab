"""Read-only reproduction of the official PDF/XLSX structural extraction.

Usage: python scripts/validate_academic_source_samples.py /path/to/verified/samples
Requires the optional pdfplumber package; not used by scheduled production jobs.
Downloads are deliberately separate. Only the three named, verified samples are read.
No workbook/PDF is changed and no private/contact field values are retained.
"""
import hashlib
import json
from pathlib import Path
import sys
from xml.etree import ElementTree as ET
from zipfile import ZipFile

import pdfplumber

if len(sys.argv) != 2:
    raise SystemExit("Usage: python scripts/validate_academic_source_samples.py /path/to/verified/samples")
root = Path(sys.argv[1])
expected_hashes = {
    "danyang_2026_guidelines.pdf": "127f2a21c2b492d2af9a1715466825e7cc08668d19ebc54b9931b6a73052cf4f",
    "kusf_volleyball_2026_regional_rules.pdf": "49d8bce2026142383b9aef513ba79469f445fba8ddebf3ead6ca4e1470f15790",
    "kusf_volleyball_2026_application_men.xlsx": "b7bdd74c5d3c03a69c197e248804dcd0607754184f5e50fe82245c8a0cbed0f0",
}
for sample, expected_hash in expected_hashes.items():
    actual_hash = hashlib.sha256((root / sample).read_bytes()).hexdigest()
    if actual_hash != expected_hash:
        raise SystemExit("Unqualified source revision: " + sample)

report = {"pdfs": [], "xlsx": {}}
for filename in ["danyang_2026_guidelines.pdf", "kusf_volleyball_2026_regional_rules.pdf"]:
    file = root / filename
    item = {"filename": filename, "bytes": file.stat().st_size,
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(), "pages": []}
    with pdfplumber.open(file) as document:
        for number, page in enumerate(document.pages, 1):
            tables = page.extract_tables()
            item["pages"].append({"page": number, "chars": len(page.chars),
                                  "images": len(page.images), "tables": len(tables)})
            if filename == "danyang_2026_guidelines.pdf" and number == 2:
                rows = []
                division = None
                for row in tables[0][1:]:
                    if row[0]:
                        division = "men" if "남" in row[0] else "women"
                    rows.extend({"division": division, "group": row[2].strip(), "team": team.strip()}
                                for team in row[3].split(","))
                item["team_rows"] = rows
                item["team_counts"] = {sex: sum(row["division"] == sex for row in rows)
                                       for sex in ["men", "women"]}
                assert item["team_counts"] == {"men": 15, "women": 7}
                assert len({(row["division"], row["team"]) for row in rows}) == 22
    report["pdfs"].append(item)

file = root / "kusf_volleyball_2026_application_men.xlsx"
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
with ZipFile(file) as archive:
    names = archive.namelist()
    shared = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", ns)]
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {item.attrib["Id"]: item.attrib["Target"] for item in rels}
    item = {"filename": file.name, "bytes": file.stat().st_size,
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
            "has_vba": any("vbaProject" in name for name in names),
            "external_links": any(name.startswith("xl/externalLinks/") for name in names), "sheets": []}
    for sheet in workbook.findall("m:sheets/m:sheet", ns):
        target = targets[sheet.attrib["{" + ns["r"] + "}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        xml = ET.fromstring(archive.read(target))
        cells = {}
        for cell in xml.findall("m:sheetData/m:row/m:c", ns):
            value = cell.findtext("m:v", default="", namespaces=ns)
            if cell.attrib.get("t") == "s":
                value = shared[int(value)]
            elif cell.attrib.get("t") == "inlineStr":
                value = "".join(cell.find("m:is", ns).itertext())
            cells[cell.attrib["r"]] = value
        item["sheets"].append({"name": sheet.attrib["name"],
                               "dimension": xml.find("m:dimension", ns).attrib["ref"],
                               "merged_ranges": len(xml.findall("m:mergeCells/m:mergeCell", ns)),
                               "formulas": len(xml.findall(".//m:f", ns)),
                               "header_fields": [cells.get(column + "15", "") for column in "ABCDEFGHIJK"],
                               "populated_player_names": sum(bool(cells.get("B" + str(row), "")) for row in range(17, 37))})
    report["xlsx"] = item
print(json.dumps(report, ensure_ascii=False, indent=2))
