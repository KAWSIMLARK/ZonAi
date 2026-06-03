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
const CUBF_LIBELLE = {
  1000: "Logement",
  1100: "Maison unifamiliale",
  1110: "Maison mobile",
  1200: "Habitation collective (chambres)",
  1212: "Habitation bifamiliale (2 logements)",
  1213: "Habitation trifamiliale (3 logements)",
  1215: "Habitation 4 à 6 logements",
  1216: "Habitation 7 à 9 logements",
  1217: "Habitation 10 logements et plus",
  1500: "Chalet, villa, maison de villégiature",
  1600: "Roulotte sur emplacement",
  1700: "Plus d'un logement attaché à non-résidentiel",
  1900: "Autres immeubles résidentiels",
  2000: "Industriel manufacturier",
  3000: "Activité commerciale",
  4000: "Public, parc, terrain de jeu",
  5000: "Activité récréative",
  6000: "Communications, transport",
  7100: "Exploitation agricole",
  7200: "Exploitation forestière",
  8000: "Terrain vacant",
  9000: "Voirie, propriété publique",
};

function cubfLabel(code) {
  if (!code) return null;
  const c = parseInt(code, 10);
  if (!Number.isFinite(c)) return code;
  if (CUBF_LIBELLE[c]) return CUBF_LIBELLE[c];
  // Fallback par famille (centaines puis milliers)
  const cent = c - (c % 100);
  if (CUBF_LIBELLE[cent]) return CUBF_LIBELLE[cent];
  const mil = Math.floor(c / 1000) * 1000;
  return CUBF_LIBELLE[mil] ?? `Code CUBF ${code}`;
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
  const codes = [best.u1, best.u2, best.u3].filter(Boolean);
  const labels = codes.map(cubfLabel).filter(Boolean);
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
    cubf_codes: codes,
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
    if (code === 1100 || code === 1110) fourchettes.push({ label: "Unifamiliale", min: 1, max: 1 });
    if (code === 1212) fourchettes.push({ label: "Bifamiliale", min: 2, max: 2 });
    if (code === 1213) fourchettes.push({ label: "Trifamiliale", min: 3, max: 3 });
    if (code === 1215) fourchettes.push({ label: "Habitation 4 à 6 logements", min: 4, max: 6 });
    if (code === 1216) fourchettes.push({ label: "Habitation 7 à 9 logements", min: 7, max: 9 });
    if (code === 1217) fourchettes.push({ label: "Habitation 10 logements et plus", min: 10, max: 999 });
    if (code === 1500) fourchettes.push({ label: "Villégiature", min: 1, max: 1 });
    if (code === 8000) fourchettes.push({ label: "Terrain vacant", min: 0, max: 0 });
  }
  if (fourchettes.length === 0) return null;
  const min = Math.min(...fourchettes.map((f) => f.min));
  const max = Math.max(...fourchettes.map((f) => f.max));
  return {
    fourchette_logements: { min, max },
    classes: fourchettes,
    logements_actuels: nb_logements_actuels,
  };
}
