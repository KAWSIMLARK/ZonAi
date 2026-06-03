// Connecteur Rôle d'évaluation foncière géoréférencé du Québec 2026.
//
// Source : Affaires municipales du Québec (MAMH), dataset
// "Rôles d'évaluation foncière du Québec géoréférencés 2026",
// licence ouverte.
//
// Snapshot embarqué : 121 915 unités d'évaluation Mauricie clipées par codes
// municipaux officiels, NDJSON gzippé (~4.3 MB).
//
// Mapping BDU vérifié contre le Répertoire officiel v2.5 (MAMH) :
//   rl0301a -> dimension linéaire en front sur voie publique (m)
//   rl0302a -> superficie du terrain (m²)
//   rl0306a -> nombre maximal d'étages
//   rl0307a -> année construction originelle
//   rl0308a -> aire d'étage du bâtiment principal (m²)
//   rl0311a -> NOMBRE TOTAL DE LOGEMENTS
//   rl0312a -> nombre de chambres locatives
//   rl0313a -> nombre de locaux non résidentiels
//   rl0402a -> valeur du terrain ($)
//   rl0403a -> valeur des bâtiments ($)
//   rl0404a -> valeur de l'immeuble ($)
//   rl0105a/0106a/0107a -> codes CUBF

import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";

const NDJSON_GZ = join(process.cwd(), "lib", "data", "role-mauricie.ndjson.gz");

// Codes CUBF (Codes d'utilisation des biens-fonds).
// Référence : Manuel d'évaluation foncière du Québec, partie 3E.
// Liste élargie aux codes les plus fréquemment rencontrés dans le rôle 2026.
const CUBF_LIBELLE = {
  // ─── 1000 Résidentiel ───
  1000: "Logement",
  1100: "Maison unifamiliale",
  1110: "Maison mobile",
  1200: "Maison de chambres et pension",
  1211: "Habitation unifamiliale",
  1212: "Habitation bifamiliale (2 logements)",
  1213: "Habitation trifamiliale (3 logements)",
  1214: "Habitation quadrifamiliale (4 logements)",
  1215: "Habitation 5 à 9 logements",
  1216: "Habitation 10 à 19 logements",
  1217: "Habitation 20 logements et plus",
  1220: "Maison de chambres",
  1230: "Résidence pour personnes âgées",
  1300: "Habitation 2 étages avec logement accessoire",
  1400: "Maison intergénérationnelle",
  1500: "Chalet, villa, maison de villégiature",
  1600: "Roulotte sur emplacement",
  1700: "Habitation mixte attachée à non-résidentiel",
  1900: "Autres immeubles résidentiels",
  // ─── 2000 Industrie manufacturière ───
  2000: "Industriel manufacturier",
  2300: "Industrie de l'alimentation",
  2500: "Industrie du bois",
  2700: "Industrie de l'imprimerie",
  2800: "Industrie chimique",
  2900: "Industrie des produits métalliques",
  // ─── 3000 Transport, communications ───
  3000: "Transport, services publics, communications",
  3100: "Transport par rail",
  3200: "Transport par voie navigable",
  3400: "Transport par route",
  3500: "Communications",
  3600: "Services publics (électricité, gaz, eau)",
  // ─── 4000 Commerce ───
  4000: "Commerce",
  4100: "Commerce de gros",
  4200: "Magasin général",
  4300: "Restauration",
  4400: "Hôtel, motel, gîte",
  4500: "Commerce de détail",
  4600: "Service automobile (station-service, garage)",
  4700: "Commerce récréatif",
  4800: "Service financier, immobilier, assurance",
  4900: "Service personnel et professionnel",
  // ─── 5000 Services ───
  5000: "Services",
  5100: "Service de santé",
  5200: "Service éducationnel",
  5300: "Service religieux et de bien-être",
  5400: "Service de logement",
  5500: "Service de réparation",
  5600: "Service personnel",
  5800: "Service touristique et récréatif",
  // ─── 6000 Culture, loisirs ───
  6000: "Culture et loisirs",
  6100: "Récréation extérieure",
  6200: "Récréation aquatique",
  6300: "Récréation hivernale",
  6400: "Sport intérieur",
  6500: "Manifestation culturelle",
  6900: "Loisir, hébergement à caractère récréatif",
  // ─── 7000 Production primaire ───
  7000: "Production primaire",
  7100: "Agriculture",
  7110: "Production de céréales",
  7120: "Production de bovins",
  7130: "Production laitière",
  7200: "Forêt",
  7210: "Exploitation forestière",
  7400: "Pêche et chasse",
  // ─── 8000 Terrains vacants ───
  8000: "Terrain vacant",
  8100: "Terrain vacant non desservi",
  8110: "Terrain vacant en zone agricole",
  8200: "Terrain vacant desservi (eau, égout)",
  8300: "Terrain vacant en milieu humide ou inondable",
  8500: "Boisé non exploité commercialement",
  // ─── 9000 Communautaire et public ───
  9000: "Communautaire et public",
  9100: "Aire publique de rencontre",
  9200: "Cimetière",
  9300: "Voirie publique",
  9400: "Administration publique",
  9500: "Sécurité publique",
  9600: "Défense nationale",
  9700: "Établissement de détention",
};

/**
 * Libellé pour un code CUBF.
 *  - Retourne un libellé exact si le code est dans la table
 *  - Retourne un libellé de famille (par centaines puis milliers) en fallback
 *  - Retourne null pour les codes non-CUBF (alphanumériques type "B152", "C750")
 */
function cubfLabel(code) {
  if (!code) return null;
  // Strict numérique 4 chiffres requis pour CUBF
  if (!/^\d{4}$/.test(String(code).trim())) return null;
  const c = parseInt(code, 10);
  if (CUBF_LIBELLE[c]) return CUBF_LIBELLE[c];
  // Fallback par centaines
  const cent = c - (c % 100);
  if (CUBF_LIBELLE[cent]) return `${CUBF_LIBELLE[cent]} (variante ${c})`;
  // Fallback par milliers
  const mil = Math.floor(c / 1000) * 1000;
  if (CUBF_LIBELLE[mil]) return `${CUBF_LIBELLE[mil]} (catégorie ${c})`;
  return `Catégorie CUBF ${c}`;
}

let _units = null;

function loadAll() {
  if (_units) return _units;
  const raw = readFileSync(NDJSON_GZ);
  const text = gunzipSync(raw).toString("utf-8");
  const out = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // ignore
    }
  }
  _units = out;
  return out;
}

// Approximation lat/lon -> km à 46°N
const KM_PER_DEG_LAT = 111;
const KM_PER_DEG_LON = 77;

function distKm(a, b) {
  const dLat = (a.lat - b.lat) * KM_PER_DEG_LAT;
  const dLon = (a.lon - b.lon) * KM_PER_DEG_LON;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Trouve l'unité d'évaluation la plus proche d'un point.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {Object} options { maxDistanceKm = 0.3 }
 */
export async function roleFor(lat, lon, { maxDistanceKm = 0.3 } = {}) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { trouve: false, error: "Coordonnées invalides." };
  }
  let units;
  try {
    units = loadAll();
  } catch (err) {
    return { trouve: false, error: `Rôle indisponible: ${err.message}` };
  }

  const dLatWin = maxDistanceKm / KM_PER_DEG_LAT;
  const dLonWin = maxDistanceKm / KM_PER_DEG_LON;
  let best = null;
  let bestKm = Infinity;
  for (const u of units) {
    if (Math.abs(u.lat - lat) > dLatWin) continue;
    if (Math.abs(u.lon - lon) > dLonWin) continue;
    const d = distKm({ lat, lon }, u);
    if (d < bestKm) {
      bestKm = d;
      best = u;
    }
  }
  if (!best) {
    return {
      trouve: false,
      error: `Aucune unité d'évaluation à moins de ${Math.round(maxDistanceKm * 1000)} m.`,
    };
  }
  const codesBruts = [best.u1, best.u2, best.u3].filter(Boolean);
  // On garde uniquement les CUBF numeriques (4 chiffres) pour les libelles
  const codesCubfNumeriques = codesBruts.filter((c) => /^\d{4}$/.test(String(c).trim()));
  const labels = codesCubfNumeriques.map(cubfLabel).filter(Boolean);
  const codesNonCubf = codesBruts.filter((c) => !/^\d{4}$/.test(String(c).trim()));
  return {
    trouve: true,
    distance_m: Math.round(bestKm * 1000),
    matricule: best.mat,
    front_terrain_m: best.front_m ?? null,
    superficie_terrain_m2: best.sup_terr ?? null,
    nombre_etages_max: best.n_etages ?? null,
    annee_construction: best.annee ? parseInt(best.annee, 10) : null,
    aire_etage_m2: best.aire_etage ?? null,
    nombre_logements: best.nb_log ?? null,
    nombre_chambres_locatives: best.nb_chambres ?? null,
    nombre_locaux_non_residentiels: best.nb_locaux_nr ?? null,
    valeur_terrain: best.v_terr ?? null,
    valeur_batiments: best.v_bati ?? null,
    valeur_totale: best.v_tot ?? null,
    usage_principal: labels[0] ?? null,
    usages_secondaires: labels.slice(1),
    cubf_codes: codesCubfNumeriques,
    // Codes additionnels non documentes (codes municipaux internes ou
    // codes secondaires du repertoire BDU). Non affiches dans l'UI par
    // defaut, mais conserves pour debug et transparence.
    codes_internes: codesNonCubf,
  };
}

/**
 * Estimation du potentiel résidentiel à partir des codes CUBF.
 * Renvoie une fourchette de logements typique pour la classe.
 */
export function inferPotentielResidentiel(codes_cubf = [], nb_logements_actuels = null) {
  const fourchettes = [];
  for (const c of codes_cubf) {
    const code = parseInt(c, 10);
    if (!Number.isFinite(code)) continue;
    if (code === 1100 || code === 1110 || code === 1211) fourchettes.push({ label: "Unifamiliale", min: 1, max: 1 });
    if (code === 1212) fourchettes.push({ label: "Bifamiliale", min: 2, max: 2 });
    if (code === 1213) fourchettes.push({ label: "Trifamiliale", min: 3, max: 3 });
    if (code === 1214) fourchettes.push({ label: "Quadrifamiliale", min: 4, max: 4 });
    if (code === 1215) fourchettes.push({ label: "Habitation 5 à 9 logements", min: 5, max: 9 });
    if (code === 1216) fourchettes.push({ label: "Habitation 10 à 19 logements", min: 10, max: 19 });
    if (code === 1217) fourchettes.push({ label: "Habitation 20 logements et plus", min: 20, max: 999 });
    if (code === 1500) fourchettes.push({ label: "Villégiature", min: 1, max: 1 });
    if (code === 8000 || code === 8100 || code === 8200) fourchettes.push({ label: "Terrain vacant", min: 0, max: 0 });
  }
  // Fallback : CUBF générique (1000) ou inconnu mais on a nb_log actuel → classe à partir de l'usage actuel
  if (fourchettes.length === 0 && typeof nb_logements_actuels === "number" && nb_logements_actuels >= 1) {
    if (nb_logements_actuels === 1) fourchettes.push({ label: "Unifamiliale (selon usage actuel)", min: 1, max: 1, inferred: true });
    else if (nb_logements_actuels === 2) fourchettes.push({ label: "Bifamiliale (selon usage actuel)", min: 2, max: 2, inferred: true });
    else if (nb_logements_actuels === 3) fourchettes.push({ label: "Trifamiliale (selon usage actuel)", min: 3, max: 3, inferred: true });
    else if (nb_logements_actuels >= 4 && nb_logements_actuels <= 9) fourchettes.push({ label: "Habitation 5 à 9 logements (selon usage)", min: 4, max: 9, inferred: true });
    else if (nb_logements_actuels >= 10) fourchettes.push({ label: `Habitation ${nb_logements_actuels}+ logements (selon usage)`, min: nb_logements_actuels, max: 999, inferred: true });
  }
  if (fourchettes.length === 0) return null;
  const min = Math.min(...fourchettes.map((f) => f.min));
  const max = Math.max(...fourchettes.map((f) => f.max));
  return {
    fourchette_logements: { min, max },
    classes: fourchettes,
    logements_actuels: nb_logements_actuels,
    inferred: fourchettes.some((f) => f.inferred),
  };
}

/**
 * Évalue le potentiel de subdivision d'un terrain à partir des données
 * disponibles. Heuristique : approximation, à valider au règlement.
 *
 * @param {Object} args
 * @param {number|null} args.superficie_m2  superficie totale du terrain
 * @param {number|null} args.front_m         dimension linéaire en front
 * @param {boolean} args.cptaq_agricole      true si en zone agricole CPTAQ
 * @param {boolean} args.zone_inondable      true si plaine inondable
 * @param {boolean} args.batiment_existant   true si déjà bâti
 * @param {string|null} args.zonage_categorie « habitation », « commerce », etc.
 * @returns {{ statut: "possible"|"a_verifier"|"non", raison: string, indices: string[] }}
 */
export function evaluerSubdivisionPossible({
  superficie_m2,
  front_m,
  cptaq_agricole,
  zone_inondable,
  batiment_existant,
  zonage_categorie,
  superficie_min_reglementaire_m2,
}) {
  const indices = [];

  if (cptaq_agricole) {
    return {
      statut: "non",
      raison: "Zone agricole permanente CPTAQ : toute subdivision exige une autorisation de la CPTAQ et est rarement accordée.",
      indices: ["Régime CPTAQ actif"],
    };
  }
  if (zonage_categorie === "conservation") {
    return {
      statut: "non",
      raison: "Zone de conservation, subdivision interdite par défaut.",
      indices: ["Zonage de conservation"],
    };
  }
  if (typeof superficie_m2 !== "number" || superficie_m2 <= 0) {
    return {
      statut: "a_verifier",
      raison: "Superficie inconnue, impossible d'évaluer.",
      indices: [],
    };
  }

  // Si on a la vraie superficie minimale du règlement, on l'utilise.
  // Sinon, heuristique par catégorie :
  //   Habitation desservi (eau+égout) : ~370 m²
  //   Habitation non desservi         : 4 000 m²
  //   Commerce / industrie            : 500 m²
  //   Agricole                        : 30 000 m²
  let seuilMinimumLot;
  let sourceSeuil;
  if (typeof superficie_min_reglementaire_m2 === "number" && superficie_min_reglementaire_m2 > 0) {
    seuilMinimumLot = superficie_min_reglementaire_m2;
    sourceSeuil = "règlement officiel TR";
  } else {
    if (zonage_categorie === "habitation") seuilMinimumLot = 400;
    else if (zonage_categorie === "commerce" || zonage_categorie === "industrie") seuilMinimumLot = 500;
    else if (zonage_categorie === "agricole") seuilMinimumLot = 30000;
    else seuilMinimumLot = 4000;
    sourceSeuil = "estimation par catégorie";
  }

  const seuilDouble = seuilMinimumLot * 2;
  if (superficie_m2 < seuilDouble) {
    return {
      statut: "non",
      raison: `Le terrain (${Math.round(superficie_m2)} m²) est trop petit pour deux lots conformes (minimum ${seuilMinimumLot} m² × 2 selon ${sourceSeuil}).`,
      indices: [`Superficie ${Math.round(superficie_m2)} m² < ${seuilDouble} m²`],
    };
  }

  if (zone_inondable) {
    indices.push("Plaine inondable : règles particulières");
  }
  if (batiment_existant) {
    indices.push("Bâtiment existant à conserver ou démolir");
  }
  if (typeof front_m === "number" && front_m > 0 && front_m < 25) {
    indices.push(`Front sur rue de ${front_m.toFixed(1)} m, possiblement insuffisant pour deux lots`);
  } else if (typeof front_m === "number") {
    indices.push(`Front sur rue de ${front_m.toFixed(1)} m`);
  }

  // Cas "à vérifier" si on a la superficie + double minimum
  return {
    statut: "a_verifier",
    raison: `Le terrain (${Math.round(superficie_m2)} m²) est assez grand pour envisager une subdivision, mais le minimum exact dépend du sous-zone au règlement. À valider en urbanisme.`,
    indices,
  };
}
