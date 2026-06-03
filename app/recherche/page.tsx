import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { ParcelCard } from "@/components/ParcelCard";
import { EmptyState } from "@/components/EmptyState";
import { lookup } from "@/lib/sources/aggregator.mjs";
import type { Parcel } from "@/lib/types";
import { ArrowLeft, CheckCircle, Warning as WarningIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { q?: string };
}

type LookupResponse = {
  status: "ok" | "empty" | "out_of_region" | "needs_clarification" | "error";
  parcel?: Parcel & { _live?: boolean; _coords?: { lat: number; lon: number }; _layers?: unknown[] };
  reason?: string;
  layers?: Array<{ name: string; status: string; source: string; message?: string }>;
};

export default async function RechercheePage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? "").trim();

  const response: LookupResponse = q
    ? ((await lookup(q)) as LookupResponse)
    : {
        status: "needs_clarification",
        reason: "Saisissez une adresse, un numéro de lot, ou un code postal en Mauricie.",
        layers: [],
      };

  return (
    <div className="container-wide py-12">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-ink-mute hover:text-ink"
        >
          <ArrowLeft size={12} weight="bold" />
          Retour
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-h1 font-semibold tracking-tight">Rechercher un terrain</h1>
          {response.status === "ok" && (
            <p className="text-sm text-ink-mute">1 résultat live</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SearchBar initialValue={q} size="lg" />
      </div>

      {/* Bandeau de couches sources interrogées */}
      {response.layers && response.layers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Couches interrogées
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {response.layers.map((l) => (
              <li key={l.name} className="flex items-start gap-2 text-sm">
                {l.status === "ok" ? (
                  <CheckCircle size={14} weight="fill" className="mt-0.5 flex-shrink-0 text-ok" />
                ) : (
                  <WarningIcon
                    size={14}
                    weight="fill"
                    className="mt-0.5 flex-shrink-0 text-ink-faint"
                  />
                )}
                <span className="text-ink-soft">
                  {l.source}
                  {l.message && <span className="text-ink-faint"> ({l.message})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-8 space-y-4">
        {response.status === "needs_clarification" && (
          <EmptyState
            title="Précisez votre recherche"
            description={response.reason}
            hint="Exemple, 1875 rue Notre-Dame Trois-Rivières, ou 752 5e Rue de la Pointe Shawinigan."
            tone="info"
          />
        )}

        {response.status === "out_of_region" && (
          <EmptyState
            title="Hors Mauricie"
            description={response.reason}
            hint="ZonAI ne couvre que la région administrative 04, Mauricie."
            tone="warn"
          />
        )}

        {response.status === "empty" && (
          <EmptyState
            title="Adresse introuvable"
            description={`Aucune correspondance pour « ${q} ».`}
            hint="Adresses Québec et OpenStreetMap n'ont rien retourné. Essayez avec un numéro civique ou un code postal."
            ctaLabel="Nouvelle recherche"
            ctaHref="/recherche"
            tone="warn"
          />
        )}

        {response.status === "error" && (
          <EmptyState
            title="Erreur de traitement"
            description={response.reason}
            tone="danger"
          />
        )}

        {response.status === "ok" && response.parcel && (
          <div className="grid gap-4">
            <ParcelCard parcel={response.parcel as Parcel} query={q} />
          </div>
        )}
      </section>
    </div>
  );
}
