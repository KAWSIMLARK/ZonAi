// Types runtime pour les connecteurs sources.
// (Le mirror TS pour les composants est dans lib/types.ts.)

/**
 * @typedef {Object} GeocodeResult
 * @property {number} lat
 * @property {number} lon
 * @property {string} adresse_complete
 * @property {string} municipalite
 * @property {string|null} mrc
 * @property {string} region
 * @property {string} provenance        // "nominatim" | "adresses-quebec"
 * @property {number} confiance         // 0..1, score interne du provider
 */

/**
 * @typedef {Object} SourceLayer
 * @property {string} name              // "MELCCFP_INONDATION"
 * @property {string} status            // "ok" | "miss" | "error"
 * @property {Object} [data]            // payload propre à la couche
 * @property {string} [message]         // pour les status non-ok
 * @property {string} source            // libellé humain pour les sources affichées
 */

export const SOURCE_NAMES = {
  NOMINATIM: "NOMINATIM",
  ADRESSES_QUEBEC: "ADRESSES_QUEBEC",
  MELCCFP_INONDATION: "MELCCFP_INONDATION",
  CPTAQ_ZONAGE: "CPTAQ_ZONAGE",
  MFFP_FOREST: "MFFP_FOREST",
  TROIS_RIVIERES_ROLE: "TROIS_RIVIERES_ROLE",
};
