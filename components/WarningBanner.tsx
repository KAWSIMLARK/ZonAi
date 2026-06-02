import { Warning as WarningIcon, Info } from "@phosphor-icons/react/dist/ssr";
import type { Warning } from "@/lib/types";

const toneByLevel: Record<string, string> = {
  danger: "border-danger/30 bg-danger-wash text-danger",
  warn: "border-warn/30 bg-warn-wash text-warn",
  info: "border-info/30 bg-info-wash text-info",
  ok: "border-ok/30 bg-ok-wash text-ok",
};

export function WarningBanner({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null;
  return (
    <div className="space-y-3">
      {warnings.map((w) => {
        const Icon = w.level === "danger" || w.level === "warn" ? WarningIcon : Info;
        return (
          <div
            key={w.code}
            role={w.level === "danger" ? "alert" : "status"}
            className={`rounded-2xl border ${toneByLevel[w.level] ?? toneByLevel.info} px-4 py-3`}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} weight="fill" className="mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{w.title}</p>
                <p className="mt-1 text-sm leading-snug opacity-90">{w.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
