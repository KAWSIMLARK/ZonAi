import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { ParcelCard } from "@/components/ParcelCard";
import { EmptyState } from "@/components/EmptyState";
import parcelsData from "@/lib/data/parcels.json";
import { searchParcels } from "@/lib/search.mjs";
import { MAURICIE_MRC } from "@/lib/business-rules.mjs";
import type { Parcel } from "@/lib/types";
import { ArrowLeft, FunnelSimple } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { q?: string; mrc?: string; exclureRisques?: string };
}

export default function RechercheePage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? "").trim();
  const mrc = searchParams.mrc;
  const exclureRisques = searchParams.exclureRisques === "1";

  const dataset = parcelsData as Parcel[];
  const filters: { mrc?: string; exclureRisques?: boolean } = {};
  if (mrc) filters.mrc = mrc;
  if (exclureRisques) filters.exclureRisques = true;

  const response = q
    ? searchParcels(q, dataset, { filters })
    : {
        status: "needs_clarification" as const,
        clarification: "Saisissez une adresse, un numéro de lot, ou décrivez ce que vous cherchez.",
        results: [],
        total: 0,
        blockedFromDisplay: 0,
      };

  return (
    <div className="container-wide py-12">
      <div className="flex flex-col gap-3">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-xs text-ink-mute hover:text-ink">
          <ArrowLeft size={12} weight="bold" />
          Retour
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-h1 font-semibold tracking-tight">Rechercher un terrain</h1>
          {q && response.status === "ok" && (
            <p className="text-sm text-ink-mute">
              {response.total} résultat{response.total > 1 ? "s" : ""}
              {response.blockedFromDisplay > 0 && (
                <span>, {response.blockedFromDisplay} masqué{response.blockedFromDisplay > 1 ? "s" : ""} par les règles</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SearchBar initialValue={q} size="lg" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FunnelSimple size={14} className="text-ink-faint" />
        <span className="mr-1 text-xs text-ink-faint">Filtres</span>
        {MAURICIE_MRC.map((m) => {
          const active = m === mrc;
          const href = `/recherche?${new URLSearchParams({
            ...(q ? { q } : {}),
            ...(active ? {} : { mrc: m }),
            ...(exclureRisques ? { exclureRisques: "1" } : {}),
          }).toString()}`;
          return (
            <Link
              key={m}
              href={href}
              className={`pill transition-colors ${
                active ? "bg-ink text-canvas border-ink" : "hover:border-line-strong hover:text-ink"
              }`}
            >
              {m}
            </Link>
          );
        })}
        <Link
          href={`/recherche?${new URLSearchParams({
            ...(q ? { q } : {}),
            ...(mrc ? { mrc } : {}),
            ...(exclureRisques ? {} : { exclureRisques: "1" }),
          }).toString()}`}
          className={`pill ${exclureRisques ? "pill-accent" : ""}`}
        >
          {exclureRisques ? "✓ " : ""}Exclure les risques majeurs
        </Link>
      </div>

      <section className="mt-10 space-y-4">
        {response.status === "needs_clarification" && (
          <EmptyState
            title="Précisez votre recherche"
            description={response.clarification}
            hint="Astuce, tapez « Trois-Rivières », un numéro de lot, ou un usage (résidentiel, agricole, villégiature)."
            tone="info"
          />
        )}

        {response.status === "empty" && (
          <EmptyState
            title="Aucun résultat"
            description={`Aucune fiche ne correspond à « ${q} »${mrc ? ` dans la MRC ${mrc}` : ""}.`}
            hint={response.suggestion}
            ctaLabel="Réinitialiser les filtres"
            ctaHref={`/recherche?q=${encodeURIComponent(q)}`}
            tone="warn"
          />
        )}

        {response.status === "ok" && (
          <>
            {response.blockedFromDisplay > 0 && (
              <div className="rounded-2xl border border-warn/30 bg-warn-wash px-4 py-3 text-sm text-warn">
                <p className="font-semibold">
                  {response.blockedFromDisplay} fiche{response.blockedFromDisplay > 1 ? "s" : ""} masquée{response.blockedFromDisplay > 1 ? "s" : ""} par les règles métier
                </p>
                <p className="mt-0.5 opacity-90">
                  Données hors région Mauricie, ou superficies invalides. TerraMauricie ne les présente pas sans validation.
                </p>
              </div>
            )}
            <div className="grid gap-4">
              {response.results.map(({ parcel, score }) => (
                <ParcelCard key={parcel.id} parcel={parcel} score={score} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
