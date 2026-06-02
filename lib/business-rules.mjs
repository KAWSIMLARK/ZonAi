// Règles métier simulées pour TerraMauricie.
// Fonctions pures — utilisées par l'app ET par la suite de tests.

export const MAURICIE_MUNICIPALITIES = [
  // Trois-Rivières (ville-MRC unique)
  "Trois-Rivières",
  // Shawinigan
  "Shawinigan",
  // La Tuque (agglomération)
  "La Tuque",
  // MRC de Maskinongé
  "Louiseville",
  "Saint-Léon-le-Grand",
  "Maskinongé",
  "Saint-Paulin",
  "Saint-Justin",
  "Saint-Édouard-de-Maskinongé",
  "Sainte-Ursule",
  "Saint-Mathieu-du-Parc",
  "Saint-Élie-de-Caxton",
  // MRC des Chenaux
  "Sainte-Anne-de-la-Pérade",
  "Batiscan",
  "Saint-Maurice",
  "Champlain",
  "Sainte-Geneviève-de-Batiscan",
  "Saint-Luc-de-Vincennes",
  "Saint-Narcisse",
  "Saint-Prosper-de-Champlain",
  "Saint-Stanislas",
  // MRC de Mékinac
  "Saint-Tite",
  "Saint-Roch-de-Mékinac",
  "Sainte-Thècle",
  "Saint-Adelphe",
  "Hérouxville",
  "Notre-Dame-de-Montauban",
  "Lac-aux-Sables",
  "Trois-Rives",
  "Grandes-Piles",
];

export const MAURICIE_MRC = [
  "Trois-Rivières",
  "Shawinigan",
  "La Tuque",
  "Maskinongé",
  "Les Chenaux",
  "Mékinac",
];

export const CONFIDENCE_LEVELS = ["eleve", "moyen", "faible", "partiel"];
export const TERNARY_VALUES = ["oui", "non", "a_verifier"];

const REQUIRED_FIELDS = [
  "id",
  "adresse",
  "numero_lot",
  "municipalite",
  "mrc",
  "region",
  "superficie_m2",
  "valeur_fonciere",
  "zonage",
  "usages_permis",
  "contraintes",
  "zone_inondable",
  "milieux_humides",
  "batiment_existant",
  "resume_ia",
  "niveau_confiance",
  "date_mise_a_jour",
  "sources",
];

/**
 * Vérifie qu'un parcel a tous les champs requis. Renvoie la liste des champs manquants.
 * Un champ avec valeur null/undefined est considéré présent uniquement si le champ
 * autorise null (uniquement valeur_fonciere dans notre modèle).
 */
export function findMissingFields(parcel) {
  if (!parcel || typeof parcel !== "object") return REQUIRED_FIELDS.slice();
  const missing = [];
  for (const f of REQUIRED_FIELDS) {
    const v = parcel[f];
    if (v === undefined) missing.push(f);
    else if (v === null && f !== "valeur_fonciere") missing.push(f);
  }
  return missing;
}

/**
 * Valide les types et plages. Retourne la liste des problèmes (vide = ok).
 */
export function validateParcel(parcel) {
  const issues = [];
  if (!parcel || typeof parcel !== "object") {
    issues.push({ code: "INVALID_OBJECT", field: null, message: "Fiche invalide." });
    return issues;
  }

  const missing = findMissingFields(parcel);
  for (const f of missing) {
    issues.push({ code: "MISSING_FIELD", field: f, message: `Champ obligatoire manquant : ${f}.` });
  }

  if (typeof parcel.superficie_m2 === "number") {
    if (!Number.isFinite(parcel.superficie_m2) || parcel.superficie_m2 <= 0) {
      issues.push({
        code: "INVALID_AREA",
        field: "superficie_m2",
        message: "La superficie doit être un nombre strictement positif.",
      });
    }
  } else if (parcel.superficie_m2 !== undefined && parcel.superficie_m2 !== null) {
    issues.push({
      code: "INVALID_AREA_TYPE",
      field: "superficie_m2",
      message: "La superficie doit être numérique.",
    });
  }

  if (parcel.valeur_fonciere !== null && parcel.valeur_fonciere !== undefined) {
    if (typeof parcel.valeur_fonciere !== "number" || !Number.isFinite(parcel.valeur_fonciere) || parcel.valeur_fonciere < 0) {
      issues.push({
        code: "INVALID_VALUE",
        field: "valeur_fonciere",
        message: "La valeur foncière doit être numérique et non négative.",
      });
    }
  }

  if (parcel.region && parcel.region !== "Mauricie") {
    issues.push({
      code: "OUT_OF_REGION",
      field: "region",
      message: `La région « ${parcel.region} » est hors couverture TerraMauricie.`,
    });
  }

  if (parcel.municipalite && !MAURICIE_MUNICIPALITIES.includes(parcel.municipalite)) {
    issues.push({
      code: "MUNICIPALITY_NOT_IN_MAURICIE",
      field: "municipalite",
      message: `La municipalité « ${parcel.municipalite} » n'appartient pas à la Mauricie.`,
    });
  }

  if (parcel.mrc && !MAURICIE_MRC.includes(parcel.mrc) && parcel.region === "Mauricie") {
    issues.push({
      code: "INVALID_MRC",
      field: "mrc",
      message: `La MRC « ${parcel.mrc} » n'est pas reconnue en Mauricie.`,
    });
  }

  if (parcel.zone_inondable && !TERNARY_VALUES.includes(parcel.zone_inondable)) {
    issues.push({ code: "INVALID_TERNARY", field: "zone_inondable", message: "Valeur attendue : oui | non | a_verifier." });
  }
  if (parcel.milieux_humides && !TERNARY_VALUES.includes(parcel.milieux_humides)) {
    issues.push({ code: "INVALID_TERNARY", field: "milieux_humides", message: "Valeur attendue : oui | non | a_verifier." });
  }

  if (parcel.niveau_confiance && !CONFIDENCE_LEVELS.includes(parcel.niveau_confiance)) {
    issues.push({ code: "INVALID_CONFIDENCE", field: "niveau_confiance", message: "Niveau de confiance non reconnu." });
  }

  if (!Array.isArray(parcel.usages_permis)) {
    issues.push({ code: "INVALID_USAGES", field: "usages_permis", message: "usages_permis doit être un tableau." });
  }
  if (!Array.isArray(parcel.contraintes)) {
    issues.push({ code: "INVALID_CONSTRAINTS", field: "contraintes", message: "contraintes doit être un tableau." });
  }
  if (!Array.isArray(parcel.sources)) {
    issues.push({ code: "INVALID_SOURCES", field: "sources", message: "sources doit être un tableau." });
  }

  if (parcel.date_mise_a_jour && Number.isNaN(Date.parse(parcel.date_mise_a_jour))) {
    issues.push({ code: "INVALID_DATE", field: "date_mise_a_jour", message: "Date invalide." });
  }

  return issues;
}

/**
 * Détermine si une fiche est diffusable telle quelle. Renvoie:
 *   { displayable: bool, blocking: [...], advisory: [...] }
 *
 * Règles bloquantes : superficie invalide, hors région, hors Mauricie.
 * Règles « advisory » : zone inondable, milieux humides à vérifier, partiel, etc.
 */
export function gateParcel(parcel) {
  const issues = validateParcel(parcel);
  const blocking = issues.filter((i) =>
    ["INVALID_AREA", "INVALID_AREA_TYPE", "OUT_OF_REGION", "MUNICIPALITY_NOT_IN_MAURICIE", "INVALID_OBJECT"].includes(i.code)
  );
  return {
    displayable: blocking.length === 0,
    blocking,
    advisory: issues.filter((i) => !blocking.includes(i)),
  };
}

/**
 * Calcule les avertissements visibles à l'utilisateur à partir d'un parcel.
 * Renvoie un tableau de { level, title, message }.
 *   level ∈ "danger" | "warn" | "info"
 */
export function deriveWarnings(parcel) {
  const out = [];
  if (!parcel) return out;

  if (parcel.zone_inondable === "oui") {
    out.push({
      level: "danger",
      code: "FLOOD_ZONE",
      title: "Terrain en zone inondable",
      message:
        "Ce terrain est cartographié en plaine inondable. Toute construction ou rénovation est strictement encadrée par la Politique de protection des rives, du littoral et des plaines inondables.",
    });
  } else if (parcel.zone_inondable === "a_verifier") {
    out.push({
      level: "warn",
      code: "FLOOD_TO_VERIFY",
      title: "Statut inondable à vérifier",
      message: "Le statut d'inondabilité n'a pas pu être confirmé. Confirmation municipale recommandée.",
    });
  }

  if (parcel.milieux_humides === "oui") {
    out.push({
      level: "danger",
      code: "WETLAND",
      title: "Présence de milieux humides",
      message:
        "Des milieux humides protégés sont présents sur le lot. Une caractérisation et une autorisation du MELCCFP peuvent être requises.",
    });
  } else if (parcel.milieux_humides === "a_verifier") {
    out.push({
      level: "warn",
      code: "WETLAND_TO_VERIFY",
      title: "Milieux humides à vérifier",
      message: "Présence possible de milieux humides selon les cartes consultées. Caractérisation environnementale recommandée.",
    });
  }

  if (parcel.niveau_confiance === "partiel") {
    out.push({
      level: "warn",
      code: "PARTIAL_DATA",
      title: "Données partielles",
      message: "Certains champs de cette fiche sont incomplets. À valider avant toute décision.",
    });
  } else if (parcel.niveau_confiance === "faible") {
    out.push({
      level: "danger",
      code: "LOW_CONFIDENCE",
      title: "Niveau de confiance faible",
      message: "Les données présentent des incohérences. À ne pas utiliser sans validation directe à la source.",
    });
  }

  if (Array.isArray(parcel.usages_permis) && parcel.usages_permis.length === 0) {
    out.push({
      level: "warn",
      code: "NO_USES_DOCUMENTED",
      title: "Aucun usage permis documenté",
      message: "Les usages permis n'ont pas pu être extraits du règlement. À confirmer en urbanisme municipal.",
    });
  }

  if (typeof parcel.zonage === "string" && /indéterminé|à clarifier|contradictoire/i.test(parcel.zonage)) {
    out.push({
      level: "warn",
      code: "ZONING_AMBIGUOUS",
      title: "Zonage ambigu",
      message: "Le zonage présente des mentions contradictoires entre sources. Clarification requise.",
    });
  }

  if (parcel.region && parcel.region !== "Mauricie") {
    out.push({
      level: "danger",
      code: "OUT_OF_REGION",
      title: "Hors région Mauricie",
      message: `Cette fiche se situe en région « ${parcel.region} », hors du périmètre couvert par TerraMauricie.`,
    });
  }

  // Cohérence : si zonage agricole CPTAQ, mention attendue dans contraintes ou résumé
  if (typeof parcel.zonage === "string" && /agricole/i.test(parcel.zonage)) {
    const constraintsText = (parcel.contraintes || []).join(" ") + " " + (parcel.resume_ia || "");
    if (!/CPTAQ|protection du territoire/i.test(constraintsText)) {
      out.push({
        level: "info",
        code: "AGRI_REMINDER",
        title: "Zone agricole protégée",
        message: "Les terrains agricoles sont protégés par la Loi sur la protection du territoire et des activités agricoles (CPTAQ).",
      });
    }
  }

  return out;
}

/**
 * Niveau d'avertissement global (le plus élevé des avertissements).
 */
export function advisoryLevel(parcel) {
  const w = deriveWarnings(parcel);
  if (w.some((x) => x.level === "danger")) return "danger";
  if (w.some((x) => x.level === "warn")) return "warn";
  if (w.some((x) => x.level === "info")) return "info";
  return "ok";
}

/**
 * Vérifie qu'un résumé IA est cohérent avec les contraintes. Renvoie les incohérences.
 */
export function checkResumeCoherence(parcel) {
  const issues = [];
  const resume = (parcel?.resume_ia || "").toLowerCase();
  if (parcel?.zone_inondable === "oui" && !/inondab|plaine inondable|récurrence/i.test(resume)) {
    issues.push({
      code: "RESUME_MISSING_FLOOD",
      message: "Le résumé n'évoque pas explicitement la zone inondable alors que zone_inondable='oui'.",
    });
  }
  if (parcel?.milieux_humides === "oui" && !/milieu|humide/i.test(resume)) {
    issues.push({
      code: "RESUME_MISSING_WETLAND",
      message: "Le résumé n'évoque pas les milieux humides alors que milieux_humides='oui'.",
    });
  }
  if (parcel?.milieux_humides === "a_verifier" && /sans contrainte|aucune contrainte/i.test(resume)) {
    issues.push({
      code: "RESUME_FALSE_REASSURANCE",
      message: "Le résumé décrit la fiche comme sans contrainte alors que des milieux humides sont à vérifier.",
    });
  }
  if (parcel?.zone_inondable === "oui" && /sans contrainte|aucune contrainte/i.test(resume)) {
    issues.push({
      code: "RESUME_FALSE_REASSURANCE_FLOOD",
      message: "Le résumé décrit la fiche comme sans contrainte alors qu'elle est en zone inondable.",
    });
  }
  return issues;
}

/**
 * Détecte si une requête en langage naturel est trop vague pour donner un résultat utile.
 *
 * Volontairement permissif : seules les requêtes vides, trop courtes ou strictement
 * réduites à un terme générique sont bloquées. Toute autre requête est transmise au
 * moteur de recherche qui retournera `empty` si rien ne matche — ce qui permet de
 * détecter et signaler les fiches hors région masquées.
 */
export function detectVagueQuery(q) {
  if (!q || typeof q !== "string") return { vague: true, reason: "EMPTY" };
  const cleaned = q.trim().toLowerCase();
  if (cleaned.length === 0) return { vague: true, reason: "EMPTY" };
  if (cleaned.length < 3) return { vague: true, reason: "TOO_SHORT" };
  const vagueTerms = ["terrain", "lot", "propriété", "propriete", "maison", "quelque chose", "n'importe", "tout"];
  if (vagueTerms.includes(cleaned)) return { vague: true, reason: "GENERIC_TERM" };
  return { vague: false };
}
