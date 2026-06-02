import Link from "next/link";
import { Compass, Warning, Info } from "@phosphor-icons/react/dist/ssr";

interface Props {
  title: string;
  description?: string;
  hint?: string;
  ctaLabel?: string;
  ctaHref?: string;
  tone?: "info" | "warn" | "danger";
}

const iconByTone = {
  info: Info,
  warn: Warning,
  danger: Warning,
};
const colorByTone = {
  info: "text-info",
  warn: "text-warn",
  danger: "text-danger",
};

export function EmptyState({
  title,
  description,
  hint,
  ctaLabel = "Effacer la recherche",
  ctaHref = "/recherche",
  tone = "info",
}: Props) {
  const Icon = iconByTone[tone] ?? Compass;
  return (
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full border border-line ${colorByTone[tone]}`}>
        <Icon size={22} weight="duotone" />
      </div>
      <div className="max-w-md">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-2 text-sm text-ink-mute">{description}</p>}
        {hint && <p className="mt-3 text-sm text-ink-soft">{hint}</p>}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link href={ctaHref} className="btn-secondary">{ctaLabel}</Link>
        <Link href="/" className="btn-ghost">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
