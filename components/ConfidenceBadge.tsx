import { confidenceLabel } from "@/lib/format";
import type { ConfidenceLevel } from "@/lib/types";

const dotByLevel: Record<ConfidenceLevel, string> = {
  eleve: "bg-ok",
  moyen: "bg-info",
  partiel: "bg-warn",
  faible: "bg-danger",
};

const ringByLevel: Record<ConfidenceLevel, string> = {
  eleve: "border-ok/30 bg-ok-wash text-ok",
  moyen: "border-info/30 bg-info-wash text-info",
  partiel: "border-warn/30 bg-warn-wash text-warn",
  faible: "border-danger/30 bg-danger-wash text-danger",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={`pill ${ringByLevel[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotByLevel[level]}`} />
      Confiance {confidenceLabel(level).toLowerCase()}
    </span>
  );
}
