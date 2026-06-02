import { gateParcel, detectVagueQuery } from "./business-rules.mjs";

function normalize(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 2);
}

/**
 * Score un terrain par rapport à une requête.
 * Combine : correspondance lot exact, adresse, municipalité, MRC, zonage, usages.
 */
function scoreParcel(parcel, queryTokens, rawQuery) {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  const hay = {
    lot: normalize(parcel.numero_lot),
    adresse: normalize(parcel.adresse),
    municipalite: normalize(parcel.municipalite),
    mrc: normalize(parcel.mrc),
    zonage: normalize(parcel.zonage),
    usages: normalize((parcel.usages_permis || []).join(" ")),
  };

  // Match lot exact (avec/ sans espaces)
  const rawNormalized = normalize(rawQuery);
  const lotCompact = hay.lot.replace(/\s/g, "");
  const queryCompact = rawNormalized.replace(/\s/g, "");
  if (lotCompact && queryCompact.includes(lotCompact)) score += 100;

  for (const t of queryTokens) {
    if (hay.lot.includes(t)) score += 30;
    if (hay.adresse.includes(t)) score += 18;
    if (hay.municipalite.includes(t)) score += 22;
    if (hay.mrc.includes(t)) score += 8;
    if (hay.zonage.includes(t)) score += 4;
    if (hay.usages.includes(t)) score += 4;
  }
  return score;
}

/**
 * Filtre selon des critères structurés optionnels.
 */
function applyFilters(parcels, filters = {}) {
  return parcels.filter((p) => {
    if (filters.municipalite && normalize(p.municipalite) !== normalize(filters.municipalite)) return false;
    if (filters.mrc && normalize(p.mrc) !== normalize(filters.mrc)) return false;
    if (filters.zonage && !normalize(p.zonage).includes(normalize(filters.zonage))) return false;
    if (filters.zone_inondable && p.zone_inondable !== filters.zone_inondable) return false;
    if (filters.superficie_min && (typeof p.superficie_m2 !== "number" || p.superficie_m2 < filters.superficie_min)) return false;
    if (filters.superficie_max && (typeof p.superficie_m2 !== "number" || p.superficie_m2 > filters.superficie_max)) return false;
    if (filters.exclureRisques) {
      if (p.zone_inondable === "oui") return false;
      if (p.milieux_humides === "oui") return false;
    }
    return true;
  });
}

/**
 * Entrée principale.
 * @param {string} query - libellé tapé par l'utilisateur (adresse, numéro de lot, ou NL).
 * @param {Array} dataset - liste de fiches.
 * @param {Object} options - { filters, limit, includeOutOfRegion (par défaut false) }
 * @returns {{ status, vagueReason?, clarification?, results, total, blockedFromDisplay }}
 */
export function searchParcels(query, dataset, options = {}) {
  const { filters = {}, limit = 50, includeOutOfRegion = false } = options;

  const vagueness = detectVagueQuery(query);
  if (vagueness.vague) {
    return {
      status: "needs_clarification",
      vagueReason: vagueness.reason,
      clarification:
        vagueness.reason === "EMPTY"
          ? "Saisissez une adresse, un numéro de lot ou une requête plus précise (ex. : « terrain résidentiel Shawinigan »)."
          : vagueness.reason === "TOO_SHORT"
            ? "Votre requête est trop courte. Ajoutez plus de détails (ville, type de zonage, numéro de lot…)."
            : "Précisez une ville de la Mauricie, un numéro de lot, ou un type d'usage (résidentiel, agricole, villégiature…).",
      results: [],
      total: 0,
      blockedFromDisplay: 0,
    };
  }

  const qTokens = tokens(query);
  const filtered = applyFilters(dataset, filters);
  const scored = filtered
    .map((p) => ({ p, score: scoreParcel(p, qTokens, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  let blockedFromDisplay = 0;
  const cleaned = [];
  for (const { p, score } of scored) {
    const gate = gateParcel(p);
    if (!gate.displayable && !includeOutOfRegion) {
      blockedFromDisplay += 1;
      continue;
    }
    cleaned.push({ parcel: p, score, gate });
    if (cleaned.length >= limit) break;
  }

  if (cleaned.length === 0) {
    return {
      status: "empty",
      results: [],
      total: 0,
      blockedFromDisplay,
      suggestion:
        "Aucun terrain ne correspond. Essayez une autre ville (Trois-Rivières, Shawinigan, La Tuque…), retirez un filtre, ou utilisez le numéro de lot exact.",
    };
  }

  return {
    status: "ok",
    results: cleaned,
    total: cleaned.length,
    blockedFromDisplay,
  };
}

/**
 * Helper de récupération directe par id.
 */
export function getParcelById(id, dataset) {
  return dataset.find((p) => p.id === id) || null;
}
