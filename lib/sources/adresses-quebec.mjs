// Connecteur Adresses Québec — géocodage officiel québécois.
//
// Source : ArcGIS GeocodeServer du ministère (Ressources naturelles), via
// le dataset "Adresses Québec" sur Données Québec.
// Doc : https://www.donneesquebec.ca/recherche/dataset/adresses-quebec
//
// Avantages vs Nominatim :
//  - Données officielles, dérivées du AQbâti et AQréseau+
//  - Précision route par route, numéro civique inclus
//  - Couvre les rangs ruraux et chemins forestiers
//  - Pas de throttle 1 req/s
//
// Limites :
//  - Pas de champ MRC ni région dans la réponse, à dériver via la municipalité
//  - Renvoie EPSG:32198 par défaut, on demande explicitement outSR=4326
//  - Adresses approximatives (sans numéro) renvoient parfois 0 candidat

import { cached } from "../cache.mjs";

const ENDPOINT =
  "https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/AdressesQuebec_Geocodage/GeocodeServer/findAddressCandidates";
const TIMEOUT_MS = 8000;

const MIN_SCORE = 70; // score sur 100, Esri considère 80+ très bon, 70-80 acceptable

/**
 * Géocode une adresse via Adresses Québec.
 *
 * @param {string} query
 * @returns {Promise<{
 *   lat: number,
 *   lon: number,
 *   adresse_complete: string,
 *   municipalite: string,
 *   mrc: string|null,
 *   region: string,
 *   provenance: "adresses-quebec",
 *   confiance: number,
 *   raw?: any
 * } | null>}
 */
export async function geocode(query) {
  const cleaned = (query ?? "").trim();
  if (!cleaned) return null;

  const params = new URLSearchParams({
    SingleLine: cleaned,
    f: "json",
    outFields: "*",
    maxLocations: "1",
    outSR: "4326",
  });
  const url = `${ENDPOINT}?${params.toString()}`;
  const cacheKey = `aq:${url}`;

  return cached(
    cacheKey,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let response;
      try {
        response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        console.warn(
          "[adresses-quebec] fetch error:",
          err.name === "AbortError" ? "timeout" : err.message
        );
        return null;
      }
      clearTimeout(timer);

      if (!response.ok) {
        console.warn("[adresses-quebec] HTTP", response.status);
        return null;
      }
      const json = await response.json();
      const candidates = Array.isArray(json.candidates) ? json.candidates : [];
      if (candidates.length === 0) return null;

      const top = candidates[0];
      if (typeof top.score !== "number" || top.score < MIN_SCORE) return null;

      const a = top.attributes ?? {};
      const lon = top.location?.x;
      const lat = top.location?.y;
      if (typeof lon !== "number" || typeof lat !== "number") return null;

      return {
        lat,
        lon,
        adresse_complete: top.address || a.Match_addr || cleaned,
        municipalite: a.City || "",
        mrc: null, // Adresses Québec ne le distribue pas ici, à dériver
        region: a.State === "Québec" ? "Québec" : a.State || "Québec",
        provenance: "adresses-quebec",
        confiance: top.score / 100,
        raw: { score: top.score, addr_type: a.Addr_type, zip: a.ZIP, house: a.House },
      };
    },
    1000 * 60 * 60 * 24 // 24 h
  );
}
