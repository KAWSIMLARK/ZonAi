import Link from "next/link";
import { formatArea, formatCurrency, formatDate } from "@/lib/format";
import type { Parcel } from "@/lib/types";
import { ConstraintBadges } from "./ConstraintBadges";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function ParcelCard({
  parcel,
  score,
  query,
}: {
  parcel: Parcel;
  score?: number;
  query?: string;
}) {
  // Pour les fiches live, la page détail relance la requête via le paramètre q.
  const href = query
    ? `/terrain/${encodeURIComponent(parcel.id)}?q=${encodeURIComponent(query)}`
    : `/terrain/${encodeURIComponent(parcel.id)}`;
  return (
    <Link href={href} className="card-interactive group block overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.6fr_1fr]">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-mono text-ink-faint">MRC {parcel.mrc}</p>
              <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-ink group-hover:text-accent-deep">
                {parcel.adresse}
              </h3>
              <p className="mt-1 font-mono text-xs text-ink-faint">Lot {parcel.numero_lot}</p>
            </div>
            <ConfidenceBadge level={parcel.niveau_confiance} />
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-mute">{parcel.resume_ia}</p>

          <div className="mt-5">
            <ConstraintBadges parcel={parcel} />
          </div>
        </div>

        <div className="border-t border-line bg-canvas/60 p-6 md:border-l md:border-t-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="text-xs text-ink-faint">Superficie</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatArea(parcel.superficie_m2)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Valeur foncière</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatCurrency(parcel.valeur_fonciere)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-ink-faint">Zonage</dt>
              <dd className="mt-1 text-sm">{parcel.zonage}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-ink-faint">Mise à jour</dt>
              <dd className="mt-1 text-sm text-ink-soft">{formatDate(parcel.date_mise_a_jour)}</dd>
            </div>
          </dl>
          {typeof score === "number" && (
            <p className="mt-4 text-[11px] font-mono uppercase tracking-wider text-ink-faint">
              Pertinence {score}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
