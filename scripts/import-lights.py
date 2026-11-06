"""Turn the scraper's warning-lights.json into data/lights.json for the site.

Usage: python scripts/import-lights.py path/to/warning-lights.json

- Makes left out: Honda (UK manuals) and Hyundai (only 5 records parsed).
- Lights with no name are dropped (icon-only entries we can't label).
- Manual text is tidied: page references, market notes like "(U.S.A.) or (Canada)", bullets.
- Colour comes from the export, or from a leading "(Red)"/"(Yellow)" in the manual text; otherwise null
  (the site then shows the usual colour, marked as such).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAKES = {"Toyota", "Lexus", "Nissan", "Kia"}
MODEL_NAMES = {"Rav Plug In Hybrid": "RAV4 Plug-in Hybrid", "ARIYA": "Ariya", "LEAF": "Leaf", "ESh": "ES Hybrid", "GSh": "GS Hybrid", "LCh": "LC Hybrid", "LSh": "LS Hybrid", "LXh": "LX Hybrid", "NXh": "NX Hybrid", "RXh": "RX Hybrid", "TXh": "TX Hybrid", "UXh": "UX Hybrid", "BZ": "bZ", "BZ4X": "bZ4X", "BZ Woodland": "bZ Woodland"}
COLOUR = {"yellow": "amber", "amber": "amber", "orange": "amber", "red": "red", "green": "green", "blue": "blue", "white": "white"}


def clean(t):
    t = (t or "").replace(" ", " ")
    t = re.sub(r"\(U\.S\.A\.\)|\(Canada\)|\(except [^)]*\)", "", t)
    t = re.sub(r"\s*(•\s*)?Handling method \([^)]*\)", "", t)
    t = re.sub(r"\(?\s*•?\s*P\.\s?\d+(-\d+)?\)?\.?\)?", "", t)
    t = re.sub(r"See “[^”]*”( in the [^.]*)?\.?", "", t)
    t = re.sub(r"\s*•\s*", "; ", t)
    t = re.sub(r"^[;:,.\s]+|\s+(?=[;:,.])", "", t)
    t = re.sub(r";\s*;", ";", t)
    t = re.sub(r";\s*(or|and)\s*;", r"; \1", t)
    t = re.sub(r"(?i)^(or\s*)?\((red|yellow|amber|green|blue|white)\)\s*", "", t)
    t = re.sub(r"\s{2,}", " ", t).strip(" ;")
    t = re.sub(r":\s*;", ":", t)
    if len(t) > 420:
        cut = t[:420]
        end = max(cut.rfind(". "), cut.rfind("; "))
        t = (cut[: end + 1] if end > 150 else cut.rsplit(" ", 1)[0] + "…").rstrip(";") 
    if t and t[-1] not in ".…!?":
        t += "."
    return t[:1].upper() + t[1:]


def clean_name(n):
    n = n or ""
    # Text that leaked in from the previous paragraph ends with ".)" or ". "; keep what follows.
    n = re.split(r"\.\)\s+|\.\s+(?=[A-Za-z])", n)[-1]
    n = re.sub(r"(?i)^(\d+-\d+\s+)?(\d+\s+)?instruments and controls\s+(\d+\s+)?|^(indicator lights|warning lights)\s+(or\s+)?|^or\s+|^and\s+", "", n)
    n = re.sub(r"^\(?P\.[\d-]+\)?\.?\)?\s*", "", n)
    # Hyphenation splits in the PDF text ("Intelli-gent", "indi-cator").
    n = re.sub(r"(?i)^gent key", "Intelligent Key", n)
    if re.match(r"(?i)^(cator|ator|tor|ing|tion|ment)\b", n):
        return ""
    n = re.sub(r"\s*\((if )?so equipped\)|\s*\(if equipped\)|[“”\"]", "", n, flags=re.I)
    n = re.sub(r"\s{2,}", " ", n).strip(" .;:")
    return n[:1].upper() + n[1:]


def main(src):
    out = []
    for r in json.loads(Path(src).read_text(encoding="utf-8")):
        if r["make"] not in MAKES:
            continue
        lights, seen = [], set()
        for l in r["lights"]:
            name = clean_name(l["name"])
            if re.match(r"(?i)^(if |tire and |pressure warning valve|indicates |belt is loose|the |when )", name) or re.search(r"\(warn-$|\($", name):
                continue
            # Fragments and cabin lights/chimes that aren't dashboard symbols.
            if re.match(r"(?i)^(indicator|light|reminder light|\(unnamed.*|ing light|if so equipped\)?|.* chime|console light|auto room lamp|welcome light|luggage compartment light|personal light|interior light|vanity light|map light|door courtesy light|.*(room|dome|trunk|glove ?box|footwell) (lamp|light))$", name):
                continue
            if not name or len(name) > 80:
                continue
            raw = l.get("meaning") or ""
            col = COLOUR.get((l.get("colour") or "").lower())
            m = re.match(r"(?i)\s*(?:\(U\.S\.A\.\)\s*)?(?:or\s*)?\((Red|Yellow|Amber|Green|Blue|White)\)", raw)
            if not col and m:
                col = COLOUR[m.group(1).lower()]
            raw = re.sub(r"^\s*(\(U\.S\.A\.\)\s*(or)?\s*)?\((Red|Yellow|Amber|Green|Blue|White)\)\s*(\(Canada\))?", "", raw)
            k = (name.lower(), col)
            if k in seen:
                continue
            seen.add(k)
            lights.append({k2: v for k2, v in {
                "name": name, "symbol": l.get("symbol_id"), "colour": col, "meaning": clean(raw),
                "action": clean(l.get("what_to_do")) if l.get("what_to_do") else None,
                "page": str(l.get("printed_page") or l.get("page") or "") or None,
            }.items() if v is not None})
        if len(lights) < 5:
            continue
        out.append({"make": r["make"], "model": MODEL_NAMES.get(r["model"], r["model"]), "year": r["year"], "source_name": r["source_name"], "lights": lights})
    # Two editions of one year: keep the fuller one.
    best = {}
    for r in out:
        k = (r["make"], r["model"], r["year"])
        if k not in best or len(r["lights"]) > len(best[k]["lights"]):
            best[k] = r
    out = sorted(best.values(), key=lambda r: (r["make"], r["model"], r["year"]))
    (ROOT / "data/lights.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(len(out), "model-years,", sum(len(r["lights"]) for r in out), "lights")


if __name__ == "__main__":
    main(sys.argv[1])
