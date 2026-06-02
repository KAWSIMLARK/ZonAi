// Connecteur MELCCFP — Base de données des zones inondables (BDZI).
//
// Source : ArcGIS REST MapServer du gouv. QC (Thèmes publics, layer 22 =
// "Polygones de zones inondables"). Public, sans clé.
// Doc dataset : https://www.donneesquebec.ca/recherche/dataset/base-de-donnees-des-zones-inondables
//
// Mécanique : point (lon, lat) en EPSG:4326 -> requête spatiale intersects
// retourne 0..N polygones. Si >=1 match -> zone_inondable = oui.
// Le champ Description distingue Zone de grand courant (0-20 ans, risque
// élevé) de Zone de faible courant (20-100 ans).

import { cached } from "../cache.mjs";

const BASE =
  "https://www.servicesgeo.enviroweb.gouv.qc.ca/donnees/rest/services/Public/Themes_publics/MapServer/22/query";
const TIMEOUT_MS = 8000;

function buildUrl(lon, lat) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "Description,No_rapport,Nm_rapport",
    returnGeometry: "false",
    f: "json",
  });
  return `${BASE}?${params.toString()}`;
}

/**
 * Teste si un point est en zone inondable selon la BDZI MELCCFP.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{
 *   inondable: "oui"|"non"|"a_verifier",
 *   recurrence?: "0-20"|"20-100"|"inconnue",
 *   description?: string,
 *   rapport?: string,
 *   contraintes: string[],
 *   raw?: any,
 *   error?: string
 * }>}
 */
export async function inondationFor(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { inondable: "a_verifier", contraintes: [], error: "Coordonnées invalides." };
  }

  const cacheKey = `melccfp-inondation:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  return cached(cacheKey, async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetch(buildUrl(lon, lat), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      return {
        inondable: "a_verifier",
        contraintes: [],
        error: err.name === "AbortError" ? "Timeout MELCCFP" : `Erreur MELCCFP: ${err.message}`,
      };
    }
    clearTimeout(timer);

    if (!response.ok) {
      return {
        inondable: "a_verifier",
        contraintes: [],
        error: `HTTP ${response.status} MELCCFP`,
      };
    }
    const json = await response.json();
    const features = Array.isArray(json.features) ? json.features : [];

    if (features.length === 0) {
      return { inondable: "non", contraintes: [] };
    }

    // S'il y a plusieurs polygones, on retient le plus contraignant.
    let recurrence = "inconnue";
    let description = "";
    let rapport = "";
    for (const f of features) {
      const attrs = f.attributes ?? {};
      const desc = String(attrs.Description ?? "");
      if (/grand courant/i.test(desc)) {
        recurrence = "0-20";
        description = desc;
        rapport = String(attrs.Nm_rapport ?? attrs.No_rapport ?? "");
        break;
      }
      if (/faible courant/i.test(desc) && recurrence !== "0-20") {
        recurrence = "20-100";
        description = desc;
        rapport = String(attrs.Nm_rapport ?? attrs.No_rapport ?? "");
      } else if (recurrence === "inconnue") {
        description = desc;
        rapport = String(attrs.Nm_rapport ?? attrs.No_rapport ?? "");
      }
    }

    const contraintes = [];
    if (recurrence === "0-20") {
      contraintes.push("Plaine inondable récurrence 0-20 ans, construction strictement encadrée");
    } else if (recurrence === "20-100") {
      contraintes.push("Plaine inondable récurrence 20-100 ans, construction encadrée");
    } else {
      contraintes.push(`Polygone inondable identifié, type : ${description || "non précisé"}`);
    }

    return {
      inondable: "oui",
      recurrence,
      description,
      rapport,
      contraintes,
      raw: features.map((f) => f.attributes),
    };
  }, 1000 * 60 * 60 * 24);
}
