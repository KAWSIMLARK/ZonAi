// Orchestrateur. Combine les couches sources pour produire un Parcel live.
// À ce stade : géocodage seulement (étapes 1-3). Les autres connecteurs
// s'enregistreront ici aux étapes 4+.

import { geocode as geocodeNominatim } from "./nominatim.mjs";
import { geocode as geocodeAQ } from "./adresses-quebec.mjs";
import { inondationFor } from "./melccfp-inondation.mjs";
import { cptaqFor } from "./cptaq.mjs";
import { zonageTroisRivieresFor } from "./zonage-trois-rivieres.mjs";
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

  // 1. Géocodage Adresses Québec en premier (officiel, précis sur les rangs)
  let geo = await geocodeAQ(query);
  layers.push({
    name: "ADRESSES_QUEBEC",
    status: geo ? "ok" : "miss",
    data: geo,
    source: "Adresses Québec, géocodage officiel (MRNF)",
  });

  // 2. Fallback Nominatim si Adresses Québec n'a rien retenu
  if (!geo) {
    geo = await geocodeNominatim(query);
    layers.push({
      name: "NOMINATIM",
      status: geo ? "ok" : "miss",
      data: geo,
      source: "OpenStreetMap, Nominatim (fallback)",
    });
  }

  if (!geo) {
    return {
      status: "empty",
      reason: "Aucune correspondance géocodée pour cette adresse (Adresses Québec + Nominatim).",
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

  // 3+. Couches géo : inondations + zonage agricole en parallèle (Promise.all)
  const [inond, cptaq] = await Promise.all([
    inondationFor(geo.lat, geo.lon),
    cptaqFor(geo.lat, geo.lon),
  ]);
  layers.push({
    name: "MELCCFP_INONDATION",
    status: inond.error ? "error" : "ok",
    data: inond,
    source: "MELCCFP, Base de données des zones inondables (BDZI)",
    message: inond.error,
  });
  layers.push({
    name: "CPTAQ_ZONAGE",
    status: cptaq.error ? "error" : "ok",
    data: cptaq,
    source: "CPTAQ, Zone agricole transposée au Cadastre",
    message: cptaq.error,
  });

  // 5. Couche municipale, branchée uniquement quand la municipalité est couverte
  let zonageMuni = null;
  if (municipalite === "Trois-Rivières") {
    zonageMuni = await zonageTroisRivieresFor(geo.lat, geo.lon);
    layers.push({
      name: "TROIS_RIVIERES_ZONAGE",
      status: zonageMuni.error ? "miss" : "ok",
      data: zonageMuni,
      source: "Ville de Trois-Rivières, zonage municipal",
      message: zonageMuni.error,
    });
  }

  const contraintes = [
    ...(inond.contraintes ?? []),
    ...(cptaq.contraintes ?? []),
    ...((zonageMuni?.contraintes) ?? []),
  ];
  const sources = [
    geo.provenance === "adresses-quebec"
      ? "Adresses Québec, géocodage officiel"
      : "OpenStreetMap / Nominatim",
  ];
  if (!inond.error) sources.push("MELCCFP, BDZI");
  if (!cptaq.error) sources.push("CPTAQ, Zone agricole transposée au Cadastre");
  if (zonageMuni && zonageMuni.trouve) sources.push("Ville de Trois-Rivières, zonage municipal");

  const mrcLabel = mrc === "Les Chenaux" ? "MRC des Chenaux" : mrc ? `MRC de ${mrc}` : "";
  const inondTxt =
    inond.inondable === "oui"
      ? `Point situé en zone inondable (récurrence ${inond.recurrence ?? "inconnue"}). Construction encadrée par la Politique de protection des rives, du littoral et des plaines inondables.`
      : inond.inondable === "non"
        ? "Aucune zone inondable cartographiée à ce point selon la BDZI."
        : `Statut inondable indéterminé (${inond.error ?? "couche indisponible"}).`;
  const cptaqTxt =
    cptaq.agricole === "oui"
      ? " Le lot est en zone agricole permanente CPTAQ : conversion d'usage soumise à autorisation."
      : cptaq.agricole === "non"
        ? " Hors zone agricole permanente CPTAQ."
        : "";

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
    zonage:
      zonageMuni && zonageMuni.trouve
        ? zonageMuni.zonage
        : cptaq.agricole === "oui"
          ? "Agricole (CPTAQ)"
          : "Non disponible (zonage municipal non branché)",
    usages_permis: zonageMuni?.usages_permis ?? [],
    contraintes,
    zone_inondable: inond.inondable,
    milieux_humides: "a_verifier",
    batiment_existant: "a_verifier",
    resume_ia: `Adresse géocodée à ${municipalite}${mrcLabel ? `, ${mrcLabel}` : ""}. ${inondTxt}${cptaqTxt}`,
    niveau_confiance: inond.error ? "partiel" : "moyen",
    date_mise_a_jour: new Date().toISOString().slice(0, 10),
    sources,
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
