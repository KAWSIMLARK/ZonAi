// Connecteur Zonage municipal — Ville de Trois-Rivières.
//
// Source : Ville de Trois-Rivières via Données Québec
// (https://www.donneesquebec.ca/recherche/dataset/zonage-v3r), licence
// ouverte, mis à jour régulièrement.
//
// Snapshot embarqué : zonage-trois-rivieres.geojson (708 KB après filtrage
// des champs utiles + simplification topologique). 1663 polygones,
// catégories GROUPEUSAGE (H, C, I, A, CNA, etc.) avec descriptions
// humaines V_DESCRIPTION.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEOJSON_PATH = join(__dirname, "..", "data", "zonage-trois-rivieres.geojson");

let _index = null;

function loadIndex() {
  if (_index) return _index;
  const raw = readFileSync(GEOJSON_PATH, "utf-8");
  const fc = JSON.parse(raw);
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

// Liste minimale des codes de groupe d'usage utilisés à TR + déduction d'usages permis simples
const USAGES_DERIVES = {
  H: ["Résidentielle"],
  R: ["Résidentielle"],
  C: ["Commerce"],
  I: ["Industrie"],
  P: ["Public, équipement institutionnel"],
  A: ["Agricole"],
  CNA: ["Conservation naturelle, aucun usage actif"],
  CR: ["Conservation et récréation"],
  REC: ["Récréation"],
  M: ["Mixte, résidentiel + commercial"],
};

/**
 * Lookup point-in-polygon contre le zonage TR.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{
 *   trouve: boolean,
 *   zonage?: string,
 *   description?: string,
 *   no_zone?: number,
 *   usages_permis?: string[],
 *   contraintes?: string[],
 *   error?: string
 * }>}
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
      const usages = USAGES_DERIVES[code] ?? (desc ? [desc] : []);
      const contraintes = [];
      if (/conservation/i.test(desc)) {
        contraintes.push("Zone de conservation naturelle, restrictions strictes de construction");
      }
      if (/agricole/i.test(desc)) {
        contraintes.push("Usage agricole municipal, à valider avec zone agricole permanente CPTAQ");
      }
      if (p.STATUT && p.STATUT !== "En vigueur") {
        contraintes.push(`Statut zonage: ${p.STATUT}`);
      }
      return {
        trouve: true,
        zonage: code ? `${code}, ${desc}` : desc || "Catégorie non précisée",
        description: desc,
        no_zone: typeof p.NO_ZONE === "number" ? p.NO_ZONE : undefined,
        usages_permis: usages,
        contraintes,
      };
    }
  }
  return {
    trouve: false,
    error: "Aucun polygone de zonage TR ne couvre ce point (territoire hors limites municipales ?)",
  };
}
