import Link from "next/link";
import { notFound } from "next/navigation";
import parcelsData from "@/lib/data/parcels.json";
import { getParcelById } from "@/lib/search.mjs";
import { deriveWarnings, gateParcel } from "@/lib/business-rules.mjs";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { ConstraintBadges } from "@/components/ConstraintBadges";
import { WarningBanner } from "@/components/WarningBanner";
import { formatArea, formatCurrency, formatDate, ternaryLabel } from "@/lib/format";
import type { Parcel, Warning } from "@/lib/types";
import { ArrowLeft, XCircle } from "@phosphor-icons/react/dist/ssr";

export function generateStaticParams() {
  return (parcelsData as Parcel[]).map((p) => ({ id: p.id }));
}

export default function TerrainPage({ params }: { params: { id: string } }) {
  const parcel = getParcelById(params.id, parcelsData as Parcel[]) as Parcel | null;
  if (!parcel) notFound();

  const gate = gateParcel(parcel);
  const warnings = deriveWarnings(parcel) as Warning[];

  return (
    <div className="container-tight py-12">
      <Link
        href="/recherche"
        className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={12} weight="bold" />
        Retour aux résultats
      </Link>

      {/* Visuel d'en-tête : photo aérienne mock par fiche */}
      <div
        className="mt-6 h-48 w-full rounded-2xl bg-cover bg-center md:h-64"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${parcel.id}-detail/1400/520)` }}
        aria-hidden
      />

      <header className="mt-6 grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-end">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            MRC {parcel.mrc}, {parcel.region}
          </p>
          <h1 className="mt-2 text-display-2 font-semibold leading-tight">{parcel.adresse}</h1>
          <p className="mt-2 font-mono text-sm text-ink-faint">
            {parcel.id}, lot {parcel.numero_lot}
          </p>
          <div className="mt-4">
            <ConstraintBadges parcel={parcel} />
          </div>
        </div>
        <div className="card flex flex-col gap-3 p-5">
          <ConfidenceBadge level={parcel.niveau_confiance} />
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-faint">Valeur foncière</span>
            <span className="text-2xl font-semibold tabular-nums">{formatCurrency(parcel.valeur_fonciere)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-faint">Superficie</span>
            <span className="tabular-nums">{formatArea(parcel.superficie_m2)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-faint">Mise à jour</span>
            <span className="text-sm text-ink-soft">{formatDate(parcel.date_mise_a_jour)}</span>
          </div>
        </div>
      </header>

      {!gate.displayable && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger-wash p-5 text-danger">
          <div className="flex items-start gap-3">
            <XCircle size={20} weight="fill" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Fiche bloquée par les règles métier</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-snug opacity-90">
                {gate.blocking.map((b) => (
                  <li key={b.code}>{b.message}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm opacity-90">
                Cette fiche reste consultable à titre de démonstration, mais ne serait jamais présentée à un utilisateur en production.
              </p>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <section className="mt-8">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Avertissements</p>
          <div className="mt-3">
            <WarningBanner warnings={warnings} />
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
        <article className="card p-7">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Lecture TerraMauricie</p>
          <p className="mt-3 text-lg leading-relaxed text-ink">{parcel.resume_ia}</p>
        </article>

        <aside className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Statut environnemental</p>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-mute">Zone inondable</dt>
              <dd className="font-medium">{ternaryLabel(parcel.zone_inondable)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-mute">Milieux humides</dt>
              <dd className="font-medium">{ternaryLabel(parcel.milieux_humides)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-mute">Bâtiment</dt>
              <dd className="font-medium">{ternaryLabel(parcel.batiment_existant)}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Zonage</p>
          <p className="mt-2 font-medium">{parcel.zonage}</p>
          <div className="hairline my-4" />
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Usages permis</p>
          {parcel.usages_permis.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {parcel.usages_permis.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-warn">Aucun usage documenté, à valider en urbanisme.</p>
          )}
        </div>
        <div className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Contraintes</p>
          {parcel.contraintes.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {parcel.contraintes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ok">Aucune contrainte signalée par les sources consultées.</p>
          )}
          <div className="hairline my-4" />
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Sources</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {parcel.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-12 text-center text-xs text-ink-faint">
        Données mock à but de démonstration. TerraMauricie n'engage aucune responsabilité légale.
      </p>
    </div>
  );
}
