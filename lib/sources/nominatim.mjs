// Connecteur Nominatim (OpenStreetMap).
//
// Politique d'usage Nominatim : https://operations.osmfoundation.org/policies/nominatim/
//  - max 1 requête par seconde
//  - User-Agent identifiant l'app obligatoire
//  - pas d'usage intensif sans serveur dédié
//
// Pour ce prototype : faible volume, User-Agent identifiant, cache LRU 30 min.
// Pour un déploiement réel, remplacer par instance Nominatim hébergée ou Adresses Québec.

import { cached } from "../cache.mjs";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const UA = "ZonAI/0.1 (prototype, github.com/KAWSIMLARK/Terramauricie)";

// Throttle 1 req/s : on enchaîne les promesses sur un même ticket.
let lastCall = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

/**
 * Géocode une adresse libre. Retourne null si rien.
 * @param {string} query
 * @returns {Promise<{lat:number, lon:number, adresse_complete:string, municipalite:string, mrc:string|null, region:string, provenance:string, confiance:number}|null>}
 */
export async function geocode(query) {
  const cleaned = query.trim();
  if (!cleaned) return null;

  // Forcer le bias Québec / Canada
  const params = new URLSearchParams({
    q: cleaned,
    format: "json",
    addressdetails: "1",
    limit: "1",
    countrycodes: "ca",
    "accept-language": "fr-CA,fr",
  });

  const url = `${NOMINATIM_URL}?${params.toString()}`;
  const cacheKey = `nominatim:${url}`;

  return cached(
    cacheKey,
    async () => {
      await throttle();
      let response;
      try {
        response = await fetch(url, {
          headers: { "User-Agent": UA, Accept: "application/json" },
        });
      } catch (err) {
        console.error("[nominatim] fetch error:", err);
        return null;
      }
      if (!response.ok) {
        console.warn("[nominatim] HTTP", response.status);
        return null;
      }
      const arr = await response.json();
      if (!Array.isArray(arr) || arr.length === 0) return null;

      const top = arr[0];
      const addr = top.address ?? {};

      // Nominatim distribue la commune dans plusieurs champs selon le type d'entité
      const municipalite =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county || // fallback
        "";

      // Extraire MRC depuis "county" si présent
      let mrc = null;
      if (addr.county && /MRC/i.test(addr.county)) {
        mrc = addr.county.replace(/^MRC\s+(de\s+|d['’]\s*)?/i, "");
      }

      const region = addr.state || addr["ISO3166-2-lvl4"] || "Québec";
      const confiance = typeof top.importance === "number" ? Math.min(1, top.importance * 2) : 0.5;

      return {
        lat: parseFloat(top.lat),
        lon: parseFloat(top.lon),
        adresse_complete: top.display_name,
        municipalite,
        mrc,
        region,
        provenance: "nominatim",
        confiance,
      };
    },
    1000 * 60 * 60 * 24 // 24 h
  );
}
