// Orchestrateur. Combine les couches sources pour produire un Parcel live.
// À ce stade : géocodage seulement (étapes 1-3). Les autres connecteurs
// s'enregistreront ici aux étapes 4+.

import { geocode } from "./nominatim.mjs";
import { MAURICIE_MUNICIPALITIES, MAURICIE_MRC } from "../business-rules.mjs";

/**
 * Heuristique simple pour déduire une MRC à partir de la municipalité Nominatim.
 * À l'étape 3 ce sera remplacé par un cross-check WFS contre les limites administratives.
 */
const MUNI_TO_MRC = {
  "Trois-Rivières": "Trois-Rivières",
  Shawinigan: "Shawinigan",
  "La Tuque": "La Tuque",
  Louiseville: "Maskinongé",
  "Saint-Léon-le-Grand": "Maskinongé",
  Maskinongé: "Maskinongé",
  "Saint-Paulin": "Maskinongé",
  "Saint-Justin": "Maskinongé",
  "Saint-Édouard-de-Maskinongé": "Maskinongé",
  "Sainte-Ursule": "Maskinongé",
  "Saint-Mathieu-du-Parc": "Maskinongé",
  "Saint-Élie-de-Caxton": "Maskinongé",
  "Sainte-Anne-de-la-Pérade": "Les Chenaux",
  Batiscan: "Les Chenaux",
  "Saint-Maurice": "Les Chenaux",
  Champlain: "Les Chenaux",
  "Sainte-Geneviève-de-Batiscan": "Les Chenaux",
  "Saint-Luc-de-Vincennes": "Les Chenaux",
  "Saint-Narcisse": "Les Chenaux",
  "Saint-Prosper-de-Champlain": "Les Chenaux",
  "Saint-Stanislas": "Les Chenaux",
  "Saint-Tite": "Mékinac",
  "Saint-Roch-de-Mékinac": "Mékinac",
  "Sainte-Thècle": "Mékinac",
  "Saint-Adelphe": "Mékinac",
  Hérouxville: "Mékinac",
  "Notre-Dame-de-Montauban": "Mékinac",
  "Lac-aux-Sables": "Mékinac",
  "Trois-Rives": "Mékinac",
  "Grandes-Piles": "Mékinac",
};

function isInMauricie(municipalite) {
  return MAURICIE_MUNICIPALITIES.includes(municipalite);
}

function deduceMrc(municipalite) {
  return MUNI_TO_MRC[municipalite] ?? null;
}

/**
 * Lookup principal. Prend une adresse texte, retourne un objet Parcel
 * compatible avec le moteur d'affichage existant, plus des métadonnées
 * de provenance pour chaque couche.
 *
 * @param {string} query - adresse, code postal, ou texte libre
 * @returns {Promise<{status: string, parcel?: Object, layers: Array, reason?: string}>}
 */
export async function lookup(query) {
  if (!query || typeof query !== "string" || query.trim().length < 3) {
    return {
      status: "needs_clarification",
      reason: "Saisissez une adresse complète (numéro, rue, ville).",
      layers: [],
    };
  }

  const layers = [];

  // 1. Géocodage
  const geo = await geocode(query);
  layers.push({
    name: "NOMINATIM",
    status: geo ? "ok" : "miss",
    data: geo,
    source: "OpenStreetMap / Nominatim",
  });

  if (!geo) {
    return {
      status: "empty",
      reason: "Aucune correspondance géocodée pour cette adresse.",
      layers,
    };
  }

  // 2. Vérification région (étape 3, mais déjà câblée ici dès qu'on a Nominatim)
  const municipalite = geo.municipalite;
  const inMauricie = isInMauricie(municipalite);

  if (!inMauricie) {
    return {
      status: "out_of_region",
      reason: `« ${municipalite}${geo.region ? `, ${geo.region}` : ""} » est hors du périmètre TerraMauricie (Mauricie uniquement).`,
      geo,
      layers,
    };
  }

  const mrc = deduceMrc(municipalite);

  // Parcel synthétique provisoire (les autres couches viendront enrichir)
  const parcel = {
    id: `LIVE-${geo.lat.toFixed(5)}-${geo.lon.toFixed(5)}`,
    adresse: geo.adresse_complete,
    numero_lot: "À déterminer (cadastre non branché)",
    municipalite,
    mrc: mrc ?? "Mauricie",
    region: "Mauricie",
    superficie_m2: null,
    valeur_fonciere: null,
    zonage: "Non disponible (zonage municipal non branché)",
    usages_permis: [],
    contraintes: [],
    zone_inondable: "a_verifier",
    milieux_humides: "a_verifier",
    batiment_existant: "a_verifier",
    resume_ia: `Adresse géocodée à ${municipalite}${mrc ? `, ${mrc === "Les Chenaux" ? "MRC des Chenaux" : `MRC de ${mrc}`}` : ""}. Les couches environnementales et cadastrales seront ajoutées aux étapes suivantes du branchement.`,
    niveau_confiance: "partiel",
    date_mise_a_jour: new Date().toISOString().slice(0, 10),
    sources: ["OpenStreetMap / Nominatim"],
    // métadonnées de provenance
    _live: true,
    _coords: { lat: geo.lat, lon: geo.lon },
    _layers: layers,
  };

  return {
    status: "ok",
    parcel,
    layers,
  };
}

export const MAURICIE_HELPERS = { isInMauricie, deduceMrc, MAURICIE_MUNICIPALITIES, MAURICIE_MRC };
