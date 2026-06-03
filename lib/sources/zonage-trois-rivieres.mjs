// Connecteur Zonage municipal — Ville de Trois-Rivières.
//
// Source : Ville de Trois-Rivières via Données Québec
// (https://www.donneesquebec.ca/recherche/dataset/zonage-v3r), licence ouverte.
//
// Limite IMPORTANTE du dataset open :
// La grille de spécifications du règlement (densité, hauteur max, sous-zones
// type C4, RES-1 vs RES-2, usages spécifiques comme Airbnb) n'est PAS dans
// les données ouvertes. Seule la famille de zonage et son identifiant
// (ex. COL-203, RES-1024) sont exposés. Pour le détail il faut consulter
// le règlement de zonage 2021+amendements en vigueur :
//   https://www.v3r.net/wp-content/uploads/2021/04/Reglement-sur-le-zonage.pdf

import { readFileSync } from "node:fs";
import { join } from "node:path";

const GEOJSON_PATH = join(process.cwd(), "lib", "data", "zonage-trois-rivieres.geojson");

const REGLEMENT_URL =
  "https://www.v3r.net/wp-content/uploads/2021/04/Reglement-sur-le-zonage.pdf";

// Libellés exacts des familles de zonage TR (extraits du dataset open).
// La sous-zone fine (C1/C2/C3/C4, H1/H2/H3 etc.) n'est pas exposée et
// doit être cherchée dans le règlement.
const FAMILLE_LABEL = {
  RES: "Résidentielle",
  RSA: "Résidentielle agricole",
  RSR: "Résidentielle rurale",
  NOV: "Noyau villageois",
  COL: "Commerciale locale",
  COR: "Commerciale régionale",
  CLI: "Commerciale lourde et industrielle",
  IND: "Industrielle",
  INA: "Industrielle agricole",
  INR: "Industrielle rurale",
  IDF: "Industrielle différée",
  IRV: "Industrie de revalorisation",
  AGD: "Agricole dynamique",
  AGF: "Agroforestière",
  EXA: "Extraction en zone agricole",
  EXT: "Extraction",
  PEV: "Parcs et espaces verts",
  PIL: "Publique et institutionnelle locale",
  PIR: "Publique et institutionnelle régionale",
  AER: "Aire écologique et récréative",
  REC: "Récréative",
  CNA: "Conservation naturelle",
  ZTP: "Zone tampon",
  RUR: "Rurale",
  AEP: "Aéroportuaire",
};

// Famille → type d'usage typique permis, à titre indicatif uniquement.
// La granularité réelle (Airbnb, multilogement, hauteur) dépend du
// sous-zone précis (C1 vs C4, etc.) au règlement.
const FAMILLE_USAGES_TYPIQUES = {
  RES: ["Résidentielle (unifamiliale à multilogement selon sous-zone)"],
  RSA: ["Résidentielle en zone agricole"],
  RSR: ["Résidentielle en milieu rural"],
  NOV: ["Résidentielle de noyau villageois", "Commerces de proximité"],
  COL: ["Commerce local (services de proximité)", "Voir règlement pour Airbnb / location court terme"],
  COR: ["Commerce régional", "Service à grande surface"],
  CLI: ["Commerce lourd", "Industrie légère"],
  IND: ["Industrie manufacturière"],
  INA: ["Industrie liée à l'agriculture"],
  AGD: ["Agriculture dynamique (CPTAQ, restrictions strictes)"],
  AGF: ["Agroforesterie"],
  PEV: ["Parc, espace vert"],
  PIL: ["Équipement public local (école, garderie, etc.)"],
  PIR: ["Équipement public régional"],
  AER: ["Récréation extensive en milieu écologique"],
  REC: ["Récréation"],
  CNA: ["Conservation, usages très restreints"],
  RUR: ["Habitation rurale, agriculture extensive"],
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

let _index = null;

function loadIndex() {
  if (_index) return _index;
  const fc = JSON.parse(readFileSync(GEOJSON_PATH, "utf-8"));
  _index = fc.features.map((f) => ({ feature: f, bbox: bboxOf(f.geometry) }));
  return _index;
}

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

/**
 * Lookup point-in-polygon contre le zonage TR.
 *
 * Renvoie le code famille (ex. COL), son libellé (« Commerciale locale »),
 * l'identifiant unique de zone (ex. COL-203) et un lien direct vers le
 * règlement de zonage où l'utilisateur peut chercher cette zone précise
 * pour vérifier les usages détaillés (Airbnb, multilogement, hauteur, etc.).
 */
export async function zonageTroisRivieresFor(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { trouve: false, error: "Coordonnées invalides." };
  }
  let index;
  try {
    index = loadIndex();
  } catch (err) {
    return { trouve: false, error: `Zonage TR indisponible: ${err.message}` };
  }
  for (const { feature, bbox } of index) {
    if (!inBbox(bbox, lon, lat)) continue;
    if (inGeom(lon, lat, feature.geometry)) {
      const p = feature.properties ?? {};
      const code = String(p.GROUPEUSAGE ?? "");
      const desc = String(p.V_DESCRIPTION ?? "");
      const idZone = String(p.ZONAGEMUNICIPALID ?? "");
      const famille = FAMILLE_LABEL[code] ?? desc ?? code;
      const categorie = FAMILLE_CATEGORIE[code] ?? "autre";
      const usages = FAMILLE_USAGES_TYPIQUES[code] ?? (desc ? [desc] : []);
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
      return {
        trouve: true,
        code_famille: code,
        famille,
        categorie,
        id_zone: idZone || null,
        no_zone: typeof p.NO_ZONE === "number" ? p.NO_ZONE : undefined,
        zonage: idZone ? `${famille} (${idZone})` : famille,
        usages_permis: usages,
        contraintes,
        reglement_url: REGLEMENT_URL,
        note_sous_zone:
          "Le sous-zone exact (ex. C4 pour Airbnb, H3 multilogement) n'est pas dans les données ouvertes. Consultez le règlement de zonage avec l'identifiant de zone ci-dessus.",
      };
    }
  }
  return {
    trouve: false,
    error: "Aucun polygone de zonage TR ne couvre ce point.",
  };
}
