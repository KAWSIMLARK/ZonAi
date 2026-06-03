// Orchestrateur. Combine les couches sources pour produire un Parcel live.
// À ce stade : géocodage seulement (étapes 1-3). Les autres connecteurs
// s'enregistreront ici aux étapes 4+.

import { geocode as geocodeNominatim } from "./nominatim.mjs";
import { geocode as geocodeAQ } from "./adresses-quebec.mjs";
import { inondationFor } from "./melccfp-inondation.mjs";
import { cptaqFor } from "./cptaq.mjs";
import { milieuxHumidesFor } from "./milieux-humides.mjs";
import { zonageTroisRivieresFor } from "./zonage-trois-rivieres.mjs";
import {
  roleFor,
  inferPotentielResidentiel,
  evaluerSubdivisionPossible,
} from "./role-evaluation.mjs";
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
      reason: `« ${municipalite}${geo.region ? `, ${geo.region}` : ""} » est hors du périmètre ZonAI (Mauricie uniquement).`,
      geo,
      layers,
    };
  }

  const mrc = deduceMrc(municipalite);

  // 3+. Couches géo : inondations + zonage agricole + milieux humides + rôle d'évaluation
  const [inond, cptaq, humide, role] = await Promise.all([
    inondationFor(geo.lat, geo.lon),
    cptaqFor(geo.lat, geo.lon),
    milieuxHumidesFor(geo.lat, geo.lon),
    roleFor(geo.lat, geo.lon),
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
  layers.push({
    name: "CIC_MILIEUX_HUMIDES",
    status: humide.error ? "error" : "ok",
    data: humide,
    source: "Canards Illimités Canada, milieux humides sud du Québec 2022",
    message: humide.error,
  });
  layers.push({
    name: "ROLE_EVALUATION_2026",
    status: role.trouve ? "ok" : role.error ? "miss" : "miss",
    data: role,
    source: "MAMH, rôle d'évaluation foncière géoréférencé 2026",
    message: role.error,
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
    ...(humide.contraintes ?? []),
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
  if (!humide.error) sources.push("Canards Illimités Canada, milieux humides 2022");
  if (role.trouve) sources.push("MAMH, rôle d'évaluation foncière 2026");
  if (zonageMuni && zonageMuni.trouve) sources.push("Ville de Trois-Rivières, zonage municipal");

  // Potentiel résidentiel :
  //   1) Si on a une grille officielle TR, utiliser directement les classes H permises
  //   2) Sinon, fallback heuristique sur CUBF + nb logements actuels
  let potentiel = null;
  if (zonageMuni?.potentiel_residentiel?.logements_max) {
    const pr = zonageMuni.potentiel_residentiel;
    potentiel = {
      fourchette_logements: { min: 1, max: pr.logements_max },
      classes: pr.classes_h_permises.map((c) => ({
        label: c.libelle,
        min: c.min,
        max: c.max ?? c.min,
      })),
      logements_actuels: role.nombre_logements ?? null,
      source: "Grille de spécifications, règlement TR 2021 c.126",
    };
  } else if (role.trouve) {
    potentiel = inferPotentielResidentiel(role.cubf_codes ?? [], role.nombre_logements);
  }

  // Évaluation subdivision : utilise la VRAIE superficie minimale réglementaire si disponible
  const superficieMinReglementaire = zonageMuni?.normes?.lot_superficie_min_m2 ?? null;
  const subdivision = evaluerSubdivisionPossible({
    superficie_m2: role.superficie_terrain_m2 ?? null,
    front_m: role.front_terrain_m ?? null,
    cptaq_agricole: cptaq.agricole === "oui",
    zone_inondable: inond.inondable === "oui",
    batiment_existant: Boolean(role.annee_construction || role.aire_etage_m2 || role.nombre_logements),
    zonage_categorie: zonageMuni?.categorie ?? null,
    superficie_min_reglementaire_m2: superficieMinReglementaire,
  });

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
  const humideTxt =
    humide.humide === "oui"
      ? ` Présence d'un milieu humide cartographié, classe ${humide.classe_libelle ?? humide.classe}.`
      : humide.humide === "a_verifier"
        ? " Statut milieux humides indéterminé."
        : "";

  // Usages permis : zonage municipal + usage principal du rôle (libellé humain seulement)
  const usagesRoleHumains = (role.usages_secondaires ?? []).filter(
    (s) => !/^code cubf\b/i.test(s)
  );
  const usagesPermis = [
    ...(zonageMuni?.usages_permis ?? []),
    ...(role.usage_principal && !/^code cubf\b/i.test(role.usage_principal)
      ? [`${role.usage_principal} (au rôle)`]
      : []),
    ...usagesRoleHumains.slice(0, 2),
  ];

  // Détermine si bâtiment existant à partir du rôle (année construction ou aire d'étage)
  const batimentExistant = role.trouve
    ? (role.annee_construction || role.aire_etage_m2 || role.nombre_logements ? "oui" : "non")
    : "a_verifier";

  const roleTxt = role.trouve
    ? ` Au rôle d'évaluation : ${
        role.nombre_logements ? `${role.nombre_logements} logement${role.nombre_logements > 1 ? "s" : ""}, ` : ""
      }${role.annee_construction ? `construit en ${role.annee_construction}, ` : ""}valeur totale ${
        role.valeur_totale ? `${(role.valeur_totale / 1000).toFixed(0)} k$` : "non disponible"
      } (à ${role.distance_m} m).`
    : "";

  const parcel = {
    id: `LIVE-${geo.lat.toFixed(5)}-${geo.lon.toFixed(5)}`,
    adresse: geo.adresse_complete,
    numero_lot: role.matricule ? `Matricule ${role.matricule}` : "Non disponible (cadastre non branché)",
    municipalite,
    mrc: mrc ?? "Mauricie",
    region: "Mauricie",
    superficie_m2: role.superficie_terrain_m2 ?? null,
    valeur_fonciere: role.valeur_totale ?? null,
    zonage:
      zonageMuni && zonageMuni.trouve
        ? zonageMuni.zonage
        : cptaq.agricole === "oui"
          ? "Agricole (CPTAQ)"
          : role.usage_principal
            ? `${role.usage_principal} (selon rôle)`
            : "Non disponible (zonage municipal non branché)",
    usages_permis: usagesPermis,
    contraintes,
    zone_inondable: inond.inondable,
    milieux_humides: humide.humide,
    batiment_existant: batimentExistant,
    resume_ia: `Adresse géocodée à ${municipalite}${mrcLabel ? `, ${mrcLabel}` : ""}.${roleTxt} ${inondTxt}${humideTxt}${cptaqTxt}`,
    niveau_confiance: role.trouve && role.valeur_totale ? "eleve" : inond.error ? "partiel" : "moyen",
    date_mise_a_jour: new Date().toISOString().slice(0, 10),
    sources,
    // métadonnées étendues
    _live: true,
    _coords: { lat: geo.lat, lon: geo.lon },
    _layers: layers,
    _role: role,
    _potentiel: potentiel,
    _zonage_muni: zonageMuni ?? null,
    _subdivision: subdivision,
  };

  return {
    status: "ok",
    parcel,
    layers,
  };
}

export const MAURICIE_HELPERS = { isInMauricie, deduceMrc, MAURICIE_MUNICIPALITIES, MAURICIE_MRC };
