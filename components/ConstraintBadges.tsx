import type { Parcel } from "@/lib/types";

export function ConstraintBadges({ parcel }: { parcel: Parcel }) {
  const badges: Array<{ label: string; tone: string }> = [];

  if (parcel.zone_inondable === "oui") badges.push({ label: "Zone inondable", tone: "pill-danger" });
  else if (parcel.zone_inondable === "a_verifier") badges.push({ label: "Inondable à vérifier", tone: "pill-warn" });

  if (parcel.milieux_humides === "oui") badges.push({ label: "Milieux humides", tone: "pill-danger" });
  else if (parcel.milieux_humides === "a_verifier") badges.push({ label: "Humides à vérifier", tone: "pill-warn" });

  if (typeof parcel.zonage === "string" && /agricole/i.test(parcel.zonage)) {
    badges.push({ label: "CPTAQ, zone agricole", tone: "pill-info" });
  }
  if (typeof parcel.zonage === "string" && /forest/i.test(parcel.zonage)) {
    badges.push({ label: "Forestier", tone: "pill-accent" });
  }
  if (parcel.batiment_existant === "oui") badges.push({ label: "Bâtiment existant", tone: "pill" });

  if (badges.length === 0) badges.push({ label: "Aucune contrainte signalée", tone: "pill-ok" });

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b.label} className={b.tone}>{b.label}</span>
      ))}
    </div>
  );
}
