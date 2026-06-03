// Connecteur milieux humides — Cartographie détaillée du sud du Québec.
//
// Source : Canards Illimités Canada (CIC), en partenariat avec le MELCCFP.
// Couverture : sud du Québec habité, mise à jour 2022.
// Endpoint : ArcGIS REST MapServer publique, sans clé.
//
// Sept classes officielles :
//   EP : eau peu profonde
//   MAR: marais
//   PHU: prairie humide
//   MAC: marécage
//   TBO: tourbière ombrotrophe (bog)
//   TMI: tourbière minérotrophe (fen)
//   TBB: tourbière boisée

import { cached } from "../cache.mjs";

const BASE =
  "https://maps.ducks.ca/arcgis/rest/services/Public/QC_Carto_MH_sudqc_2022/MapServer/0/query";
const TIMEOUT_MS = 8000;

const CLASSE_LABEL = {
  EP: "Eau peu profonde",
  MAR: "Marais",
  PHU: "Prairie humide",
  MAC: "Marécage",
  TBO: "Tourbière ombrotrophe (bog)",
  TMI: "Tourbière minérotrophe (fen)",
  TBB: "Tourbière boisée",
};

function buildUrl(lon, lat) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "CLASSE,CONF_CLASS,CONF_DELIM,SOURCE_DOCUM,ANNEE_DOCUM",
    returnGeometry: "false",
    f: "json",
  });
  return `${BASE}?${params.toString()}`;
}

/**
 * Indique si un point est dans un milieu humide cartographié.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{
 *   humide: "oui"|"non"|"a_verifier",
 *   classe?: string,
 *   classe_libelle?: string,
 *   confiance_classe?: number,
 *   source_documentaire?: string,
 *   annee?: number,
 *   contraintes: string[],
 *   error?: string
 * }>}
 */
export async function milieuxHumidesFor(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { humide: "a_verifier", contraintes: [], error: "Coordonnées invalides." };
  }
  const cacheKey = `mh:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  return cached(cacheKey, async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(buildUrl(lon, lat), {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      return {
        humide: "a_verifier",
        contraintes: [],
        error:
          err.name === "AbortError"
            ? "Timeout milieux humides CIC"
            : `Erreur milieux humides: ${err.message}`,
      };
    }
    clearTimeout(timer);

    if (!res.ok) {
      return {
        humide: "a_verifier",
        contraintes: [],
        error: `HTTP ${res.status} milieux humides`,
      };
    }
    const json = await res.json();
    const features = Array.isArray(json.features) ? json.features : [];
    if (features.length === 0) {
      return { humide: "non", contraintes: [] };
    }
    const a = features[0].attributes ?? {};
    const classe = String(a.CLASSE ?? "");
    const libelle = CLASSE_LABEL[classe] ?? classe;
    return {
      humide: "oui",
      classe,
      classe_libelle: libelle,
      confiance_classe:
        typeof a.CONF_CLASS === "number" ? a.CONF_CLASS : undefined,
      source_documentaire: a.SOURCE_DOCUM || undefined,
      annee: typeof a.ANNEE_DOCUM === "number" ? a.ANNEE_DOCUM : undefined,
      contraintes: [
        `Milieu humide cartographié : ${libelle}. Caractérisation environnementale et autorisation MELCCFP probables avant intervention.`,
      ],
    };
  }, 1000 * 60 * 60 * 24);
}
