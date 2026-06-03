// Connecteur Zonage municipal — Ville de Trois-Rivières (règlement 2021, chapitre 126).
//
// Sources :
//   1) Géométrie des zones : Données Québec dataset zonage-v3r (GeoJSON, 1663 polygones)
//   2) Grilles de spécifications : règlement officiel TR, Annexe 2 (PDF 1663 grilles
//      parsées par scripts/parse-grilles-tr.py → lib/data/grilles-tr.ndjson.gz)
//
// L'extraction couvre : usages permis (classes H, C, I, P, R + codes CUBF),
// hauteur min/max, étages min/max, largeur et superficie minimales du lot,
// coefficient d'emprise au sol (CES), classes spéciales H12 et H13,
// PIIA / PAE applicables, dispositions spéciales (DS.X.Y).

import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";

const GEOJSON_PATH = join(process.cwd(), "lib", "data", "zonage-trois-rivieres.geojson");
const GRILLES_PATH = join(process.cwd(), "lib", "data", "grilles-tr.ndjson.gz");

const REGLEMENT_URL =
  "https://www.v3r.net/services-a-la-population/reglements-municipaux/2021-c-126-reglement-durbanisme-normatif";
const ANNEXE_2_URL =
  "https://www.v3r.net/wp-content/uploads/2024/11/2021-126-Reglement-normatif-Annexe-2-Grilles-de-specifications.pdf";

// Libellés des familles de zonage
const FAMILLE_LABEL = {
  RES: "Résidentielle", RSA: "Résidentielle agricole", RSR: "Résidentielle rurale",
  NOV: "Noyau villageois", COL: "Commerciale locale", COR: "Commerciale régionale",
  CLI: "Commerciale lourde et industrielle", IND: "Industrielle", INA: "Industrielle agricole",
  INR: "Industrielle rurale", IDF: "Industrielle différée", IRV: "Industrie de revalorisation",
  AGD: "Agricole dynamique", AGF: "Agroforestière", EXA: "Extraction en zone agricole",
  EXT: "Extraction", PEV: "Parcs et espaces verts", PIL: "Publique et institutionnelle locale",
  PIR: "Publique et institutionnelle régionale", AER: "Aire écologique et récréative",
  REC: "Récréative", CNA: "Conservation naturelle", ZTP: "Zone tampon", RUR: "Rurale",
  AEP: "Aéroportuaire",
};

const FAMILLE_CATEGORIE = {
  RES: "habitation", RSA: "habitation", RSR: "habitation", NOV: "habitation", RUR: "habitation",
  COL: "commerce", COR: "commerce", CLI: "commerce",
  IND: "industrie", INA: "industrie", INR: "industrie", IDF: "industrie", IRV: "industrie",
  AGD: "agricole", AGF: "agricole", EXA: "agricole",
  PEV: "public", PIL: "public", PIR: "public", AER: "public", REC: "public",
  CNA: "conservation", ZTP: "conservation",
  EXT: "extraction", AEP: "transport",
};

// Mapping classe H → nombre max de logements (Manuel d'urbanisme TR 2021)
const CLASSE_H_LOGEMENTS = {
  H1: { min: 1, max: 1, libelle: "Habitation unifamiliale" },
  H2: { min: 2, max: 2, libelle: "Habitation bifamiliale" },
  H3: { min: 3, max: 3, libelle: "Habitation trifamiliale" },
  H4: { min: 4, max: 4, libelle: "Habitation 4 logements" },
  H5: { min: 5, max: 6, libelle: "Habitation 5 à 6 logements" },
  H6: { min: 7, max: 8, libelle: "Habitation 7 à 8 logements" },
  H7: { min: 9, max: 12, libelle: "Habitation 9 à 12 logements" },
  H8: { min: 13, max: 24, libelle: "Habitation 13 à 24 logements" },
  H9: { min: 25, max: 48, libelle: "Habitation 25 à 48 logements" },
  H10: { min: 49, max: 999, libelle: "Habitation 49 logements et plus" },
  H11: { min: 1, max: 1, libelle: "Maison mobile" },
  H12: { min: 1, max: null, libelle: "Maison de chambres / pension" },
  H13: { min: 1, max: null, libelle: "Résidence collective (personnes âgées, étudiants)" },
};

// ── Indexes (lazy-loaded) ────────────────────────────────────────────────
let _geomIndex = null;
let _grillesIndex = null;

function loadGeomIndex() {
  if (_geomIndex) return _geomIndex;
  const fc = JSON.parse(readFileSync(GEOJSON_PATH, "utf-8"));
  _geomIndex = fc.features.map((f) => ({ feature: f, bbox: bboxOf(f.geometry) }));
  return _geomIndex;
}

function loadGrillesIndex() {
  if (_grillesIndex) return _grillesIndex;
  const text = gunzipSync(readFileSync(GRILLES_PATH)).toString("utf-8");
  const map = {};
  for (const line of text.split("\n")) {
    if (!line) continue;
    try {
      const g = JSON.parse(line);
      map[g.id] = g;
    } catch {
      /* skip */
    }
  }
  _grillesIndex = map;
  return map;
}

// ── Géométrie ────────────────────────────────────────────────────────────
function bboxOf(geom) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < minX) minX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] > maxY) maxY = c[1];
    } else for (const k of c) visit(k);
  };
  visit(geom.coordinates);
  return [minX, minY, maxX, maxY];
}

function inBbox([a, b, c, d], x, y) {
  return x >= a && x <= c && y >= b && y <= d;
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inGeom(x, y, geom) {
  const test = (poly) => {
    if (!inRing(x, y, poly[0])) return false;
    for (let k = 1; k < poly.length; k++) if (inRing(x, y, poly[k])) return false;
    return true;
  };
  if (geom.type === "Polygon") return test(geom.coordinates);
  if (geom.type === "MultiPolygon") {
    for (const p of geom.coordinates) if (test(p)) return true;
  }
  return false;
}

// ── Calcul du potentiel résidentiel précis depuis les usages permis ──────
function calculerPotentielLogements(grille) {
  if (!grille || !Array.isArray(grille.usages_permis)) return null;
  let maxLogements = 0;
  const classesH = [];
  for (const u of grille.usages_permis) {
    const m = u.code && CLASSE_H_LOGEMENTS[u.code];
    if (m) {
      classesH.push({ ...m, code: u.code });
      if (m.max && m.max > maxLogements) maxLogements = m.max;
    }
  }
  // H12 / H13 spéciaux avec leur max explicite
  if (grille.logements_H12_max) maxLogements = Math.max(maxLogements, grille.logements_H12_max);
  if (grille.logements_H13_max) maxLogements = Math.max(maxLogements, grille.logements_H13_max);
  if (classesH.length === 0 && !maxLogements) return null;
  return {
    classes_h_permises: classesH,
    logements_max: maxLogements || null,
    h12_max: grille.logements_H12_max ?? null,
    h13_max: grille.logements_H13_max ?? null,
  };
}

// ── Lookup principal ─────────────────────────────────────────────────────
export async function zonageTroisRivieresFor(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { trouve: false, error: "Coordonnées invalides." };
  }
  let geomIndex, grilles;
  try {
    geomIndex = loadGeomIndex();
    grilles = loadGrillesIndex();
  } catch (err) {
    return { trouve: false, error: `Zonage TR indisponible: ${err.message}` };
  }

  for (const { feature, bbox } of geomIndex) {
    if (!inBbox(bbox, lon, lat)) continue;
    if (!inGeom(lon, lat, feature.geometry)) continue;

    const p = feature.properties ?? {};
    const code = String(p.GROUPEUSAGE ?? "");
    const desc = String(p.V_DESCRIPTION ?? "");
    const idZone = String(p.ZONAGEMUNICIPALID ?? "");
    const famille = FAMILLE_LABEL[code] ?? desc ?? code;
    const categorie = FAMILLE_CATEGORIE[code] ?? "autre";

    // Récupère la grille officielle pour cette zone précise
    const grille = grilles[idZone] ?? null;
    const potentielResidentiel = calculerPotentielLogements(grille);

    const contraintes = [];
    if (categorie === "conservation") {
      contraintes.push("Zone de conservation, construction très restreinte");
    }
    if (code === "AGD" || code === "AGF" || code === "EXA") {
      contraintes.push("Sous régime CPTAQ, conversion d'usage soumise à autorisation");
    }
    if (p.STATUT && p.STATUT !== "En vigueur") {
      contraintes.push(`Statut zonage: ${p.STATUT}`);
    }
    if (grille?.piia) {
      contraintes.push("PIIA applicable (Plan d'implantation et d'intégration architecturale)");
    }
    if (grille?.pae) {
      contraintes.push("PAE applicable (Plan d'aménagement d'ensemble)");
    }
    if (grille?.dispositions_speciales?.length) {
      contraintes.push(`Dispositions spéciales : ${grille.dispositions_speciales.join(", ")}`);
    }

    return {
      trouve: true,
      code_famille: code,
      famille,
      categorie,
      id_zone: idZone || null,
      no_zone: typeof p.NO_ZONE === "number" ? p.NO_ZONE : undefined,
      zonage: idZone ? `${famille} (${idZone})` : famille,
      usages_permis: grille?.usages_permis ?? [],
      potentiel_residentiel: potentielResidentiel,
      normes: grille
        ? {
            hauteur_min_m: grille.hauteur_min_m,
            hauteur_max_m: grille.hauteur_max_m,
            etages_min: grille.etages_min,
            etages_max: grille.etages_max,
            lot_largeur_min_m: grille.lot_largeur_min_m,
            lot_profondeur_min_m: grille.lot_profondeur_min_m,
            lot_superficie_min_m2: grille.lot_superficie_min_m2,
            ces_min: grille.ces_min,
            ces_max: grille.ces_max,
            piia: grille.piia,
            pae: grille.pae,
            dispositions_speciales: grille.dispositions_speciales ?? [],
          }
        : null,
      contraintes,
      reglement_url: REGLEMENT_URL,
      grille_url: ANNEXE_2_URL,
    };
  }

  return {
    trouve: false,
    error: "Aucun polygone de zonage TR ne couvre ce point.",
  };
}
