export type Ternary = "oui" | "non" | "a_verifier";
export type ConfidenceLevel = "eleve" | "moyen" | "faible" | "partiel";
export type WarningLevel = "danger" | "warn" | "info" | "ok";

export interface Parcel {
  id: string;
  adresse: string;
  numero_lot: string;
  municipalite: string;
  mrc: string;
  region: string;
  superficie_m2: number;
  valeur_fonciere: number | null;
  zonage: string;
  usages_permis: string[];
  contraintes: string[];
  zone_inondable: Ternary;
  milieux_humides: Ternary;
  batiment_existant: "oui" | "non";
  resume_ia: string;
  niveau_confiance: ConfidenceLevel;
  date_mise_a_jour: string;
  sources: string[];
}

export interface Warning {
  level: WarningLevel;
  code: string;
  title: string;
  message: string;
}

export interface GateResult {
  displayable: boolean;
  blocking: Array<{ code: string; field: string | null; message: string }>;
  advisory: Array<{ code: string; field: string | null; message: string }>;
}

export interface SearchResultItem {
  parcel: Parcel;
  score: number;
  gate: GateResult;
}

export interface SearchResponse {
  status: "ok" | "empty" | "needs_clarification";
  vagueReason?: string;
  clarification?: string;
  suggestion?: string;
  results: SearchResultItem[];
  total: number;
  blockedFromDisplay: number;
}
