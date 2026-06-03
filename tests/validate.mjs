#!/usr/bin/env node
// Suite de validation ZonAI, version « branchement live ».
//
// Cette suite ne s'appuie plus sur des fiches mock. Elle valide :
//   A. Les fonctions pures de business-rules (sans dépendance externe)
//   B. Les connecteurs locaux (CPTAQ, zonage TR) avec coordonnées connues
//   C. Les connecteurs réseau (Nominatim, Adresses Québec, MELCCFP) avec
//      des adresses ou points réels
//   D. L'aggregator end-to-end sur 3 cas réels
//
// Pas de dépendance npm. Exécution : `node tests/validate.mjs`.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  validateParcel,
  deriveWarnings,
  detectVagueQuery,
  MAURICIE_MUNICIPALITIES,
  MAURICIE_MRC,
  CONFIDENCE_LEVELS,
} from "../lib/business-rules.mjs";
import { geocode as geocodeNominatim } from "../lib/sources/nominatim.mjs";
import { geocode as geocodeAQ } from "../lib/sources/adresses-quebec.mjs";
import { inondationFor } from "../lib/sources/melccfp-inondation.mjs";
import { cptaqFor } from "../lib/sources/cptaq.mjs";
import { milieuxHumidesFor } from "../lib/sources/milieux-humides.mjs";
import { zonageTroisRivieresFor } from "../lib/sources/zonage-trois-rivieres.mjs";
import { roleFor, inferPotentielResidentiel } from "../lib/sources/role-evaluation.mjs";
import { lookup } from "../lib/sources/aggregator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dirname, "..", "RAPPORT_VALIDATION.md");

const results = [];
let currentSection = "";
let currentCategory = "";

function section(n) { currentSection = n; }
function category(n) { currentCategory = n; }

async function test(name, fn, { critical = false } = {}) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({
      section: currentSection,
      category: currentCategory,
      name,
      status: "pass",
      critical,
      detail: typeof detail === "string" ? detail : null,
      ms: Date.now() - start,
    });
  } catch (e) {
    results.push({
      section: currentSection,
      category: currentCategory,
      name,
      status: "fail",
      critical,
      detail: e.message,
      ms: Date.now() - start,
    });
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg ?? "Valeurs différentes"} : attendu ${JSON.stringify(b)}, reçu ${JSON.stringify(a)}`);
}

// Points de référence connus, validés manuellement
const POINTS = {
  TR_RUE_NOTRE_DAME_OUEST: { lat: 46.3460, lon: -72.5638 }, // urbain, industriel
  CAP_MADELEINE_BORD_FLEUVE: { lat: 46.357, lon: -72.510 }, // bord du fleuve, plaine
  LA_TUQUE_CENTRE: { lat: 47.438, lon: -72.785 },
  LOUISEVILLE_RURAL: { lat: 46.27, lon: -73.00 }, // rang agricole
  SAINT_TITE_RURAL: { lat: 46.74, lon: -72.57 },
  SHERBROOKE: { lat: 45.398, lon: -71.902 },
  HUMIDE_TR_VERIFIE: { lat: 46.30329, lon: -72.47847 }, // centroid d'un polygone CIC
};

// ══════════════════════════════════════════════════════════════════════════
// A. Règles métier (fonctions pures)
// ══════════════════════════════════════════════════════════════════════════
section("A. Règles métier pures");

category("Référentiel Mauricie");
await test("MAURICIE_MUNICIPALITIES contient >= 30 entrées", () => {
  assert(MAURICIE_MUNICIPALITIES.length >= 30, `Reçu ${MAURICIE_MUNICIPALITIES.length}`);
});
await test("MAURICIE_MRC contient exactement 6 entrées", () => {
  assertEqual(MAURICIE_MRC.length, 6);
});
await test("Niveaux de confiance valides", () => {
  for (const n of ["eleve", "moyen", "faible", "partiel"]) {
    assert(CONFIDENCE_LEVELS.includes(n), `Niveau manquant : ${n}`);
  }
});

category("Validation de fiche");
await test("validateParcel(null) renvoie des erreurs", () => {
  const issues = validateParcel(null);
  assert(issues.length > 0);
});
await test("validateParcel(objet vide) signale les champs manquants", () => {
  const issues = validateParcel({});
  assert(issues.some((i) => i.code === "MISSING_FIELD"));
});
await test("Superficie négative déclenche INVALID_AREA", () => {
  const p = {
    id: "x", adresse: "a", numero_lot: "1", municipalite: "Trois-Rivières", mrc: "Trois-Rivières",
    region: "Mauricie", superficie_m2: -10, valeur_fonciere: 100, zonage: "z",
    usages_permis: [], contraintes: [], zone_inondable: "non", milieux_humides: "non",
    batiment_existant: "non", resume_ia: "r", niveau_confiance: "eleve",
    date_mise_a_jour: "2026-01-01", sources: ["s"],
  };
  const issues = validateParcel(p);
  assert(issues.some((i) => i.code === "INVALID_AREA"), "INVALID_AREA absent");
}, { critical: true });

category("Avertissements dérivés");
await test("Zone inondable oui ⇒ FLOOD_ZONE danger", () => {
  const p = { zone_inondable: "oui", milieux_humides: "non", niveau_confiance: "eleve", region: "Mauricie", zonage: "x", usages_permis: ["x"] };
  const w = deriveWarnings(p);
  assert(w.some((x) => x.code === "FLOOD_ZONE" && x.level === "danger"));
}, { critical: true });
await test("milieux_humides a_verifier ⇒ warn (jamais ok)", () => {
  const p = { zone_inondable: "non", milieux_humides: "a_verifier", niveau_confiance: "eleve", region: "Mauricie", zonage: "x", usages_permis: ["x"] };
  const w = deriveWarnings(p);
  assert(w.some((x) => x.code === "WETLAND_TO_VERIFY"));
}, { critical: true });
await test("Confiance partielle ⇒ PARTIAL_DATA", () => {
  const p = { zone_inondable: "non", milieux_humides: "non", niveau_confiance: "partiel", region: "Mauricie", zonage: "x", usages_permis: ["x"] };
  const w = deriveWarnings(p);
  assert(w.some((x) => x.code === "PARTIAL_DATA"));
});
await test("Hors région ⇒ OUT_OF_REGION danger", () => {
  const p = { region: "Estrie", zone_inondable: "non", milieux_humides: "non", niveau_confiance: "eleve", zonage: "x", usages_permis: ["x"] };
  const w = deriveWarnings(p);
  assert(w.some((x) => x.code === "OUT_OF_REGION"));
}, { critical: true });

category("Détection requête vague");
await test("Vide ⇒ vague EMPTY", () => assertEqual(detectVagueQuery("").vague, true));
await test("< 3 caractères ⇒ vague TOO_SHORT", () => assertEqual(detectVagueQuery("ab").vague, true));
await test("« lot » seul ⇒ vague GENERIC_TERM", () => assertEqual(detectVagueQuery("lot").vague, true));
await test("« Sherbrooke » accepté (laisser le moteur décider)", () => assertEqual(detectVagueQuery("Sherbrooke").vague, false));

// ══════════════════════════════════════════════════════════════════════════
// B. Connecteurs locaux (point-in-polygon hors réseau)
// ══════════════════════════════════════════════════════════════════════════
section("B. Connecteurs locaux");

category("CPTAQ");
await test("Centre Trois-Rivières ⇒ non agricole", async () => {
  const r = await cptaqFor(POINTS.TR_RUE_NOTRE_DAME_OUEST.lat, POINTS.TR_RUE_NOTRE_DAME_OUEST.lon);
  assertEqual(r.agricole, "non");
}, { critical: true });
await test("Louiseville rang rural ⇒ oui agricole", async () => {
  const r = await cptaqFor(POINTS.LOUISEVILLE_RURAL.lat, POINTS.LOUISEVILLE_RURAL.lon);
  assertEqual(r.agricole, "oui");
  assert(r.contraintes.some((c) => /CPTAQ/.test(c)));
}, { critical: true });
await test("Saint-Tite rural ⇒ oui agricole", async () => {
  const r = await cptaqFor(POINTS.SAINT_TITE_RURAL.lat, POINTS.SAINT_TITE_RURAL.lon);
  assertEqual(r.agricole, "oui");
});
await test("Coordonnées invalides gérées proprement", async () => {
  const r = await cptaqFor("abc", null);
  assertEqual(r.agricole, "a_verifier");
  assert(r.error);
});

category("Zonage Trois-Rivières");
await test("Centre TR trouve un polygone municipal", async () => {
  const r = await zonageTroisRivieresFor(POINTS.TR_RUE_NOTRE_DAME_OUEST.lat, POINTS.TR_RUE_NOTRE_DAME_OUEST.lon);
  assert(r.trouve, "Aucun polygone trouvé au centre TR");
  assert(r.zonage, "Pas de zonage retourné");
}, { critical: true });
await test("Coordonnées hors TR (La Tuque) ⇒ pas de polygone", async () => {
  const r = await zonageTroisRivieresFor(POINTS.LA_TUQUE_CENTRE.lat, POINTS.LA_TUQUE_CENTRE.lon);
  assertEqual(r.trouve, false);
});

// ══════════════════════════════════════════════════════════════════════════
// C. Connecteurs réseau
// ══════════════════════════════════════════════════════════════════════════
section("C. Connecteurs réseau");

category("Adresses Québec");
await test("Adresse standard Trois-Rivières géocodée", async () => {
  const r = await geocodeAQ("1875 rue Notre-Dame Trois-Rivières");
  assert(r, "Aucun résultat");
  assertEqual(r.provenance, "adresses-quebec");
  assert(r.confiance > 0.7, `Confiance trop basse : ${r.confiance}`);
  assert(Math.abs(r.lat - 46.34) < 0.05, `Latitude inattendue : ${r.lat}`);
}, { critical: true });
await test("Sherbrooke géocodé hors Mauricie", async () => {
  const r = await geocodeAQ("910 rue King Ouest Sherbrooke");
  assert(r, "Sherbrooke non géocodée");
  assertEqual(r.municipalite, "Sherbrooke");
});
await test("Chaîne vide ⇒ null", async () => {
  const r = await geocodeAQ("");
  assertEqual(r, null);
});

category("MELCCFP zones inondables");
await test("Point bord du fleuve ⇒ inondable oui", async () => {
  const r = await inondationFor(POINTS.CAP_MADELEINE_BORD_FLEUVE.lat, POINTS.CAP_MADELEINE_BORD_FLEUVE.lon);
  assertEqual(r.inondable, "oui");
  assert(r.contraintes.length > 0);
}, { critical: true });
await test("La Tuque centre ⇒ non inondable", async () => {
  const r = await inondationFor(POINTS.LA_TUQUE_CENTRE.lat, POINTS.LA_TUQUE_CENTRE.lon);
  assertEqual(r.inondable, "non");
});

category("Milieux humides CIC");
await test("Polygone humide connu ⇒ humide oui + classe", async () => {
  const r = await milieuxHumidesFor(POINTS.HUMIDE_TR_VERIFIE.lat, POINTS.HUMIDE_TR_VERIFIE.lon);
  assertEqual(r.humide, "oui");
  assert(r.classe_libelle, "Libellé de classe manquant");
  assert(r.contraintes.length > 0);
}, { critical: true });
await test("Centre urbain Trois-Rivières ⇒ non humide", async () => {
  const r = await milieuxHumidesFor(POINTS.TR_RUE_NOTRE_DAME_OUEST.lat, POINTS.TR_RUE_NOTRE_DAME_OUEST.lon);
  assertEqual(r.humide, "non");
});

category("Rôle d'évaluation foncière 2026");
await test("Adresse TR connue ⇒ unité d'évaluation trouvée avec valeur", async () => {
  const r = await roleFor(46.3460, -72.5638);
  assert(r.trouve, "Pas d'unité trouvée");
  assert(r.matricule, "Matricule manquant");
  assert(r.valeur_totale && r.valeur_totale > 0, `Valeur totale manquante : ${r.valeur_totale}`);
  assert(r.distance_m < 500, `Distance match trop grande : ${r.distance_m} m`);
}, { critical: true });

await test("Adresse Louiseville ⇒ logements rapportés", async () => {
  const r = await roleFor(46.27, -73.00);
  assert(r.trouve, "Pas d'unité Louiseville");
  // Cette zone rurale doit avoir un bâtiment résidentiel typique
  assert(r.annee_construction || r.nombre_logements, "Aucune donnée de bâtiment");
});

await test("inferPotentielResidentiel sur CUBF 1212 (bifamiliale)", () => {
  const p = inferPotentielResidentiel(["1212"], 1);
  assert(p, "Pas de potentiel renvoyé");
  assertEqual(p.fourchette_logements.max, 2);
});

await test("inferPotentielResidentiel sur CUBF 1215 (5-9 logements selon repertoire BDU)", () => {
  const p = inferPotentielResidentiel(["1215"], 5);
  assert(p, "Pas de potentiel renvoyé");
  assertEqual(p.fourchette_logements.min, 5);
  assertEqual(p.fourchette_logements.max, 9);
});

// ══════════════════════════════════════════════════════════════════════════
// D. Aggregator end-to-end (live)
// ══════════════════════════════════════════════════════════════════════════
section("D. Aggregator live");

await test("Trois-Rivières urbaine ⇒ status ok, 6 couches", async () => {
  const r = await lookup("1875 rue Notre-Dame Trois-Rivières");
  assertEqual(r.status, "ok");
  assert(r.parcel, "Pas de parcel");
  assertEqual(r.parcel.region, "Mauricie");
  assert(r.layers.length >= 6, `Trop peu de couches : ${r.layers.length}`);
  const names = r.layers.map((l) => l.name);
  for (const n of [
    "ADRESSES_QUEBEC",
    "MELCCFP_INONDATION",
    "CPTAQ_ZONAGE",
    "CIC_MILIEUX_HUMIDES",
    "ROLE_EVALUATION_2026",
    "TROIS_RIVIERES_ZONAGE",
  ]) {
    assert(names.includes(n), `Couche manquante : ${n}`);
  }
  // Vérifier que le parcel a la valeur foncière et les logements
  assert(r.parcel.valeur_fonciere && r.parcel.valeur_fonciere > 0, "Valeur foncière manquante");
  assert(r.parcel._role && r.parcel._role.matricule, "Matricule manquant");
}, { critical: true });

await test("Sherbrooke ⇒ status out_of_region", async () => {
  const r = await lookup("910 rue King Ouest Sherbrooke");
  assertEqual(r.status, "out_of_region");
}, { critical: true });

await test("Requête vide ⇒ status needs_clarification", async () => {
  const r = await lookup("");
  assertEqual(r.status, "needs_clarification");
}, { critical: true });

await test("Trois-Rivières inclut couche zonage municipal", async () => {
  const r = await lookup("1875 rue Notre-Dame Trois-Rivières");
  assertEqual(r.status, "ok");
  assert(r.layers.some((l) => l.name === "TROIS_RIVIERES_ZONAGE"), "Couche TR absente");
});

await test("Cap-de-la-Madeleine bord du fleuve ⇒ zone inondable oui", async () => {
  // Test direct sur la couche pour bypass aléa de précision géocodage
  const r = await inondationFor(POINTS.CAP_MADELEINE_BORD_FLEUVE.lat, POINTS.CAP_MADELEINE_BORD_FLEUVE.lon);
  assertEqual(r.inondable, "oui");
});

// ══════════════════════════════════════════════════════════════════════════
// Synthèse + rapport
// ══════════════════════════════════════════════════════════════════════════

const total = results.length;
const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;
const criticalFailed = results.filter((r) => r.status === "fail" && r.critical).length;
const durationMs = results.reduce((a, r) => a + r.ms, 0);

const c = { red: 31, green: 32, yellow: 33, cyan: 36, gray: 90, bold: 1 };
const col = (s, k) => `\x1b[${c[k]}m${s}\x1b[0m`;

const grouped = {};
for (const r of results) {
  grouped[r.section] ??= {};
  grouped[r.section][r.category || "—"] ??= [];
  grouped[r.section][r.category || "—"].push(r);
}

console.log(col("\n━━ ZonAI · Suite de validation (mode live) ━━", "bold"));
for (const [sec, cats] of Object.entries(grouped)) {
  console.log("\n" + col(sec, "cyan"));
  for (const [cat, tests] of Object.entries(cats)) {
    console.log("  " + col(cat, "gray"));
    for (const t of tests) {
      const icon = t.status === "pass" ? col("✓", "green") : col("✗", "red");
      const crit = t.critical ? col(" [CRITIQUE]", "yellow") : "";
      console.log(`    ${icon} ${t.name}${crit}`);
      if (t.status === "fail") console.log(col(`        → ${t.detail}`, "red"));
    }
  }
}

console.log("\n" + col("━━ Résumé ━━", "bold"));
console.log(`  Total : ${total}`);
console.log(`  ${col("✓ Réussis", "green")} : ${passed}`);
console.log(`  ${col("✗ Échoués", failed ? "red" : "gray")} : ${failed}`);
console.log(`  ${col("‼ Critiques échoués", criticalFailed ? "red" : "gray")} : ${criticalFailed}`);
console.log(`  Durée : ${durationMs} ms\n`);

// Rapport markdown
let md = `# Rapport de validation — ZonAI (mode live)\n\n`;
md += `*Généré le ${new Date().toISOString()} · ${total} tests · ${passed} réussis · ${failed} échoués · ${criticalFailed} échecs critiques · ${durationMs} ms*\n\n`;
md += `## Mode\n\nLes données mock ont été supprimées. La suite teste maintenant :\n`;
md += `- Les fonctions pures de business-rules (référentiel Mauricie, validation, avertissements)\n`;
md += `- Les connecteurs locaux (CPTAQ in-memory, zonage Trois-Rivières in-memory)\n`;
md += `- Les connecteurs réseau (Adresses Québec, MELCCFP BDZI)\n`;
md += `- L'aggregator end-to-end avec adresses réelles\n\n`;
md += `## Sources branchées\n\n`;
md += `| Source | Mode d'accès | Couverture |\n|---|---|---|\n`;
md += `| Adresses Québec (MRNF) | ArcGIS GeocodeServer public | Québec entier |\n`;
md += `| OpenStreetMap Nominatim | API publique, fallback | Mondial |\n`;
md += `| MELCCFP BDZI | ArcGIS REST MapServer public | Québec entier |\n`;
md += `| CPTAQ Déméter | Shapefile officiel, snapshot mai 2026, clipé Mauricie | Mauricie (275 polygones) |\n`;
md += `| Canards Illimités Canada, milieux humides 2022 | ArcGIS REST public | Sud du Québec habité, 34 512 polygones bbox Mauricie |\n`;
md += `| MAMH, rôle d'évaluation foncière géoréférencé 2026 | GPKG provincial 2.6 GB, extrait Mauricie 4.3 MB | 121 915 unités d'évaluation (31 codes municipaux) |\n`;
md += `| Ville de Trois-Rivières, zonage municipal | Données ouvertes Données Québec, snapshot | Trois-Rivières (1 663 zones) |\n\n`;

md += `## Résultats par section\n\n`;
for (const [sec, cats] of Object.entries(grouped)) {
  md += `### ${sec}\n\n`;
  for (const [cat, tests] of Object.entries(cats)) {
    md += `#### ${cat}\n\n`;
    md += `| Statut | Test | Critique | Détail |\n|:---:|---|:---:|---|\n`;
    for (const t of tests) {
      const icon = t.status === "pass" ? "✅" : "❌";
      const crit = t.critical ? "🔒" : "";
      md += `| ${icon} | ${t.name} | ${crit} | ${t.detail ?? ""} |\n`;
    }
    md += "\n";
  }
}

md += `## Conclusion\n\n`;
if (criticalFailed === 0 && failed === 0) {
  md += `✅ Tous les tests passent. Les couches branchées sont opérationnelles.\n`;
} else if (criticalFailed === 0) {
  md += `⚠️ ${failed} test(s) non critique(s) en échec. Les règles métier critiques sont satisfaites.\n`;
} else {
  md += `❌ ${criticalFailed} test(s) CRITIQUE(S) en échec.\n`;
}

writeFileSync(REPORT_PATH, md, "utf-8");
console.log(col(`📝 Rapport écrit : ${REPORT_PATH}`, "cyan"));

process.exit(criticalFailed > 0 ? 1 : 0);
