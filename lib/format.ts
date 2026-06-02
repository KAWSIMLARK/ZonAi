const nfArea = new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 0 });
const nfCurrency = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});
const dfDate = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatArea(m2: number | null | undefined): string {
  if (m2 === null || m2 === undefined || !Number.isFinite(m2)) return "Indisponible";
  if (m2 >= 10000) {
    const ha = m2 / 10000;
    return `${nfArea.format(Math.round(ha * 100) / 100)} ha (${nfArea.format(m2)} m²)`;
  }
  return `${nfArea.format(m2)} m²`;
}

export function formatCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "Non disponible";
  return nfCurrency.format(v);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Indisponible";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Indisponible";
  return dfDate.format(d);
}

export function ternaryLabel(t: string | null | undefined): string {
  if (t === "oui") return "Oui";
  if (t === "non") return "Non";
  if (t === "a_verifier") return "À vérifier";
  return "Inconnu";
}

export function confidenceLabel(c: string | null | undefined): string {
  switch (c) {
    case "eleve":
      return "Élevée";
    case "moyen":
      return "Moyenne";
    case "faible":
      return "Faible";
    case "partiel":
      return "Partielle";
    default:
      return "Inconnue";
  }
}
