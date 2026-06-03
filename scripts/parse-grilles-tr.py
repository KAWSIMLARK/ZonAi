"""
Parser des Grilles de spécifications (Règlement d'urbanisme TR 2021, chapitre 126).

Lit le PDF "Annexe 2 - Grilles de spécifications" (1663 pages, 16 MB) et
extrait pour chaque zone les normes structurées :
  - id_zone (ex. RES-4148)
  - usages_permis : classes (H1..H13, C1..., P1..., I1..., R1...) + codes CUBF
  - hauteur : min, max (mètres)
  - etages : min, max
  - superficie_lot : min (par catégorie I/J/R desservi)
  - largeur_lot : min
  - profondeur_lot : min
  - ces : min, max (coefficient d'emprise au sol)
  - logements_H12, logements_H13 : min, max (cas spéciaux pension/résidence collective)
  - dispositions_speciales

Output : lib/data/grilles-tr.json.gz (NDJSON gzippé)
"""

import gzip
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

PDF_PATH = Path("C:/Users/UTILIS~1/AppData/Local/Temp/grilles-tr.pdf")
OUTPUT = Path("lib/data/grilles-tr.ndjson.gz")

CHECK = "•"  # • bullet point used as checkmark

# Régex de capture pour la section Usages
USAGE_CODE_RE = re.compile(
    r"^([HCPIR]\d{1,2}[a-z]?|\d{4})\s+(.+?)(?:\s+[•\s]+)?$",
)


def normalize(line: str) -> str:
    """Replace mojibake artefacts."""
    return line.replace("•", "•")


def parse_number(s: str) -> float | None:
    s = s.strip().replace(",", ".").replace(" ", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def extract_zone(text: str) -> dict | None:
    # ID zone
    m = re.search(r"ZONE\s*:\s*([A-Z]+-\d+[A-Z]?)", text)
    if not m:
        return None
    zone_id = m.group(1).strip()

    out = {
        "id": zone_id,
        "usages_permis": [],
        "usages_prohibes": [],
        "hauteur_min_m": None,
        "hauteur_max_m": None,
        "etages_min": None,
        "etages_max": None,
        "lot_largeur_min_m": None,
        "lot_profondeur_min_m": None,
        "lot_superficie_min_m2": None,
        "ces_min": None,
        "ces_max": None,
        "logements_H12_max": None,
        "logements_H13_max": None,
        "dispositions_speciales": [],
        "piia": False,
        "pae": False,
    }

    lines = [normalize(l.strip()) for l in text.split("\n")]

    # ── Section "Usages autorisés" : entre "Usages autorisés" et "Usages spécifiquement prohibés"
    in_usages = False
    in_prohibes = False
    for line in lines:
        if "Usages autoris" in line:
            in_usages = True
            in_prohibes = False
            continue
        if "Usages sp" in line and "prohib" in line:
            in_usages = False
            in_prohibes = True
            continue
        if "Logements (Classes" in line or "Lotissement" in line or "discr" in line:
            in_usages = False
            in_prohibes = False

        if in_usages and line:
            # Ligne pattern: "<CODE> <Libellé> • • <opt 3 - 8>"
            mm = re.match(r"^([HCPIR]\d{1,2}[a-z]?|\d{4})\s+(.+)", line)
            if mm:
                code = mm.group(1)
                rest = mm.group(2)
                # Au moins une coche (•) signifie usage permis quelque part
                if "•" in rest:
                    # extraire le libellé (texte avant la première coche)
                    libelle = rest.split("•")[0].strip()
                    # extraire la plage d'étages éventuelle (ex. "3 - 8")
                    etages_match = re.search(r"(\d+)\s*-\s*(\d+)", rest)
                    entry = {"code": code, "libelle": libelle}
                    if etages_match:
                        entry["etages"] = [int(etages_match.group(1)), int(etages_match.group(2))]
                    out["usages_permis"].append(entry)
        elif in_prohibes and line:
            mm = re.match(r"^([HCPIR]\d{1,2}[a-z]?|\d{4})\s+(.+)", line)
            if mm:
                out["usages_prohibes"].append({"code": mm.group(1), "libelle": mm.group(2).strip()})

    # ── Logements H12 / H13
    m = re.search(r"Nombre de logements?\s*H12\s+(\d*)\s+(\d*)", text)
    if m:
        out["logements_H12_max"] = int(m.group(2)) if m.group(2) else None
    m = re.search(r"Nombre de logements?\s*H13\s+(\d*)\s+(\d*)", text)
    if m:
        out["logements_H13_max"] = int(m.group(2)) if m.group(2) else None

    # ── PIIA / PAE
    if re.search(r"Plan d'implantation.*?PIIA\)?\s*•", text):
        out["piia"] = True
    if re.search(r"Plan d'am.nagement d'ensemble.*?PAE\)?\s*•", text):
        out["pae"] = True

    # ── Lotissement : valeurs "Largeur minimale du lot (m) <I> <J> <R>"
    # On capture la première valeur trouvée (catégorie la plus permissive)
    def first_num(line_text: str):
        m = re.search(r"([\d,\.]+)", line_text)
        return parse_number(m.group(1)) if m else None

    for line in lines:
        if line.startswith("Largeur minimale du lot"):
            # Format: "Largeur minimale du lot (m) 15 9"
            nums = re.findall(r"([\d,\.]+)", line)
            if nums:
                vals = [parse_number(n) for n in nums if parse_number(n) is not None]
                if vals:
                    out["lot_largeur_min_m"] = min(vals)
        elif line.startswith("Profondeur minimale du lot"):
            nums = re.findall(r"([\d,\.]+)", line)
            if nums:
                vals = [parse_number(n) for n in nums if parse_number(n) is not None]
                if vals:
                    out["lot_profondeur_min_m"] = min(vals)
        elif line.startswith("Superficie minimale du lot"):
            nums = re.findall(r"([\d,\.]+)", line)
            if nums:
                vals = [parse_number(n) for n in nums if parse_number(n) is not None]
                if vals:
                    out["lot_superficie_min_m2"] = min(vals)
        elif line.startswith("Hauteur minimale"):
            out["hauteur_min_m"] = first_num(line)
        elif line.startswith("Hauteur maximale"):
            out["hauteur_max_m"] = first_num(line)
        elif "Nombre d'étages minimum" in line or "Nombre d'étages minimum" in line or "Nombre d?étages minimum" in line:
            out["etages_min"] = first_num(line)
        elif "Nombre d'étages maximum" in line or "Nombre d'étages maximum" in line or "Nombre d?étages maximum" in line:
            out["etages_max"] = first_num(line)
        elif "CES" in line and "minimum" in line:
            out["ces_min"] = first_num(line)
        elif "CES" in line and "maximum" in line:
            out["ces_max"] = first_num(line)
        elif "DS." in line:
            ds_matches = re.findall(r"(DS\.\d+\.\d+)", line)
            for ds in ds_matches:
                if ds not in out["dispositions_speciales"]:
                    out["dispositions_speciales"].append(ds)

    return out


def main():
    if not PDF_PATH.exists():
        print(f"PDF introuvable : {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Lecture {PDF_PATH}...")
    r = PdfReader(str(PDF_PATH))
    print(f"  {len(r.pages)} pages")

    out = []
    skipped = 0
    for i, page in enumerate(r.pages):
        text = page.extract_text()
        if not text:
            skipped += 1
            continue
        zone = extract_zone(text)
        if zone is None:
            skipped += 1
            continue
        out.append(zone)
        if (i + 1) % 100 == 0:
            print(f"  page {i+1}/{len(r.pages)} -> {len(out)} zones extraites")

    print(f"Total : {len(out)} zones, {skipped} pages ignorées")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(OUTPUT, "wt", encoding="utf-8", compresslevel=9) as f:
        for z in out:
            f.write(json.dumps(z, ensure_ascii=False) + "\n")

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Écrit : {OUTPUT} ({size_mb:.2f} MB)")

    # Stats utiles
    with_super = sum(1 for z in out if z["lot_superficie_min_m2"])
    with_etages = sum(1 for z in out if z["etages_max"] is not None)
    with_usages = sum(1 for z in out if z["usages_permis"])
    print(f"  {with_usages} zones avec usages permis listés")
    print(f"  {with_super} zones avec superficie min de lot")
    print(f"  {with_etages} zones avec nb d'étages max")


if __name__ == "__main__":
    main()
