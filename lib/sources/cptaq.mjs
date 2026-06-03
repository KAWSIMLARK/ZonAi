// Connecteur CPTAQ — Zone agricole permanente.
//
// Source : Commission de protection du territoire agricole du Québec,
// shapefile officiel "Zone agricole transposée au Cadastre du Québec"
// (https://carto.cptaq.gouv.qc.ca/data/shapefiles/ZA_transposee.zip, mise à jour mai 2026).
// Pas de WMS/REST public exposé pour requête point-by-point. La donnée a donc
// été clip + simplifiée à la bbox Mauricie et embarquée localement.
//
// Schéma : Polygones EPSG:4269 (≈ WGS84), propriétés { id, mrc, zonage, date_maj }
// où zonage ∈ {"Zone agricole", "Zone non agricole"}.

import { readFileSync } from "node:fs";
import { join } from "node:path";

// process.cwd() est stable apres bundling (vs import.meta.url qui se casse
// dans les fonctions serverless Vercel). Le fichier doit etre inclus via
// outputFileTracingIncludes dans next.config.js.
const GEOJSON_PATH = join(process.cwd(), "lib", "data", "cptaq-mauricie.geojson");

// Lazy load : on ne lit le fichier qu'à la première requête, puis on garde
// en mémoire pour la durée du process.
let _featureIndex = null;

function loadIndex() {
  if (_featureIndex) return _featureIndex;
  const raw = readFileSync(GEOJSON_PATH, "utf-8");
  const fc = JSON.parse(raw);

  // Pré-calculer une bbox par feature pour court-circuiter les point-in-polygon coûteux.
  const features = fc.features.map((f) => {
    const bbox = computeBbox(f.geometry);
    return { feature: f, bbox };
  });
  _featureIndex = features;
  return _featureIndex;
}

function computeBbox(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else {
      for (const c of coords) visit(c);
    }
  };
  visit(geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

function bboxContains([minX, minY, maxX, maxY], x, y) {
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

// Ray casting standard pour un point dans un anneau de polygone.
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(x, y, poly) {
  // poly = [outer, hole1, hole2, ...]
  if (!pointInRing(x, y, poly[0])) return false;
  for (let i = 1; i < poly.length; i++) {
    if (pointInRing(x, y, poly[i])) return false; // dans un trou = dehors
  }
  return true;
}

function pointInGeometry(x, y, geom) {
  if (geom.type === "Polygon") return pointInPolygon(x, y, geom.coordinates);
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (pointInPolygon(x, y, poly)) return true;
    }
    return false;
  }
  return false;
}

/**
 * Indique si un point est en zone agricole permanente CPTAQ.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{
 *   agricole: "oui"|"non"|"a_verifier",
 *   zonage?: string,
 *   mrc?: string,
 *   date_maj?: string,
 *   contraintes: string[],
 *   error?: string
 * }>}
 */
export async function cptaqFor(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { agricole: "a_verifier", contraintes: [], error: "Coordonnées invalides." };
  }
  let index;
  try {
    index = loadIndex();
  } catch (err) {
    return {
      agricole: "a_verifier",
      contraintes: [],
      error: `Cartographie CPTAQ indisponible : ${err.message}`,
    };
  }

  for (const { feature, bbox } of index) {
    if (!bboxContains(bbox, lon, lat)) continue;
    if (pointInGeometry(lon, lat, feature.geometry)) {
      const props = feature.properties ?? {};
      const z = String(props.zonage ?? "");
      if (/zone agricole$/i.test(z) || /^zone agricole/i.test(z) && !/non/i.test(z)) {
        return {
          agricole: "oui",
          zonage: z,
          mrc: props.mrc || undefined,
          date_maj: typeof props.date_maj === "string" ? props.date_maj.slice(0, 10) : undefined,
          contraintes: [
            "Zone agricole permanente CPTAQ, toute conversion d'usage requiert une autorisation",
          ],
        };
      }
      // Point trouvé dans un polygone "Zone non agricole" : explicitement non-protégé
      return {
        agricole: "non",
        zonage: z,
        mrc: props.mrc || undefined,
        date_maj: typeof props.date_maj === "string" ? props.date_maj.slice(0, 10) : undefined,
        contraintes: [],
      };
    }
  }

  // Aucun polygone CPTAQ n'englobe le point. La cartographie est exhaustive sur le territoire municipalisé,
  // donc absence = territoire non couvert (régions nord-La Tuque) -> à vérifier.
  return {
    agricole: "a_verifier",
    contraintes: ["Aucun polygone CPTAQ ne couvre ce point (territoire non cartographié)."],
  };
}
