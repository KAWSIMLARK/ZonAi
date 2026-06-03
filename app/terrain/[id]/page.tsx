import Link from "next/link";
import { notFound } from "next/navigation";
import { lookup } from "@/lib/sources/aggregator.mjs";
import { deriveWarnings } from "@/lib/business-rules.mjs";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { ConstraintBadges } from "@/components/ConstraintBadges";
import { WarningBanner } from "@/components/WarningBanner";
import { formatArea, formatCurrency, formatDate, ternaryLabel } from "@/lib/format";
import type { Parcel, Warning } from "@/lib/types";
import { ArrowLeft, Buildings, House } from "@phosphor-icons/react/dist/ssr";

interface RoleData {
  trouve?: boolean;
  matricule?: string;
  distance_m?: number;
  front_terrain_m?: number | null;
  superficie_terrain_m2?: number | null;
  nombre_etages_max?: number | null;
  annee_construction?: number | null;
  aire_etage_m2?: number | null;
  nombre_logements?: number | null;
  nombre_chambres_locatives?: number | null;
  nombre_locaux_non_residentiels?: number | null;
  valeur_terrain?: number | null;
  valeur_batiments?: number | null;
  valeur_totale?: number | null;
  usage_principal?: string | null;
  usages_secondaires?: string[];
  cubf_codes?: string[];
}

interface PotentielData {
  fourchette_logements?: { min: number; max: number };
  classes?: Array<{ label: string; min: number; max: number }>;
  logements_actuels?: number | null;
}

interface PageProps {
  params: { id: string };
  searchParams: { q?: string };
}

// Les fiches live n'ont pas d'ID persistant : on requête à nouveau via la query.
// Pour l'instant, la page détail est servie sur la base d'un paramètre q
// passé en searchParams. L'ID est conservé pour cohérence URL.
export const dynamic = "force-dynamic";

export default async function TerrainPage({ params, searchParams }: PageProps) {
  const q = (searchParams.q ?? "").trim();
  if (!q) notFound();

  const result = (await lookup(q)) as {
    status: string;
    parcel?: Parcel & {
      _layers?: Array<{ name: string; status: string; source: string; message?: string }>;
      _role?: RoleData;
      _potentiel?: PotentielData | null;
    };
  };
  if (result.status !== "ok" || !result.parcel) notFound();

  const parcel = result.parcel;
  const warnings = deriveWarnings(parcel) as Warning[];
  const layers = parcel._layers ?? [];
  const role = parcel._role;
  const potentiel = parcel._potentiel ?? null;

  return (
    <div className="container-tight py-12">
      <Link
        href={`/recherche?q=${encodeURIComponent(q)}`}
        className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={12} weight="bold" />
        Retour à la recherche
      </Link>

      {/* Visuel d'en-tête */}
      <div
        className="mt-6 h-48 w-full rounded-2xl bg-cover bg-center md:h-64"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${params.id}/1400/520)` }}
        aria-hidden
      />

      <header className="mt-6 grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-end">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            MRC {parcel.mrc}, {parcel.region}
          </p>
          <h1 className="mt-2 text-display-2 font-semibold leading-tight">{parcel.adresse}</h1>
          <p className="mt-2 font-mono text-sm text-ink-faint">{parcel.id}</p>
          <div className="mt-4">
            <ConstraintBadges parcel={parcel} />
          </div>
        </div>
        <div className="card flex flex-col gap-3 p-5">
          <ConfidenceBadge level={parcel.niveau_confiance} />
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-faint">Valeur foncière</span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(parcel.valeur_fonciere)}
            </span>
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

      {warnings.length > 0 && (
        <section className="mt-8">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Avertissements
          </p>
          <div className="mt-3">
            <WarningBanner warnings={warnings} />
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
        <article className="card p-7">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Lecture TerraMauricie
          </p>
          <p className="mt-3 text-lg leading-relaxed text-ink">{parcel.resume_ia}</p>
        </article>

        <aside className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Statut environnemental
          </p>
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

      {/* Bâtiment et rôle d'évaluation */}
      {role && role.trouve && (
        <section className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
          <div className="card p-7">
            <div className="flex items-center gap-2">
              <Buildings size={18} weight="duotone" className="text-accent-deep" />
              <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                Bâtiment et rôle d'évaluation
              </p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-3">
              {role.annee_construction != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Année construction</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{role.annee_construction}</dd>
                </div>
              )}
              {role.nombre_etages_max != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Nb d'étages max</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{role.nombre_etages_max}</dd>
                </div>
              )}
              {role.aire_etage_m2 != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Aire d'étage</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{formatArea(role.aire_etage_m2)}</dd>
                </div>
              )}
              {role.front_terrain_m != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Front sur rue</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{role.front_terrain_m.toFixed(1)} m</dd>
                </div>
              )}
              {role.nombre_locaux_non_residentiels != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Locaux non résidentiels</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{role.nombre_locaux_non_residentiels}</dd>
                </div>
              )}
              {role.nombre_chambres_locatives != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Chambres locatives</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{role.nombre_chambres_locatives}</dd>
                </div>
              )}
            </dl>
            <div className="hairline my-5" />
            <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
              {role.valeur_terrain != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Valeur terrain</dt>
                  <dd className="mt-1 font-medium tabular-nums">{formatCurrency(role.valeur_terrain)}</dd>
                </div>
              )}
              {role.valeur_batiments != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Valeur bâtiments</dt>
                  <dd className="mt-1 font-medium tabular-nums">{formatCurrency(role.valeur_batiments)}</dd>
                </div>
              )}
              {role.valeur_totale != null && (
                <div>
                  <dt className="text-xs text-ink-faint">Valeur totale</dt>
                  <dd className="mt-1 font-medium tabular-nums">{formatCurrency(role.valeur_totale)}</dd>
                </div>
              )}
            </dl>
            <p className="mt-5 text-xs text-ink-faint">
              Matricule {role.matricule}, unité au rôle 2026 trouvée à {role.distance_m} m du point géocodé.
            </p>
          </div>

          {/* Capacité résidentielle */}
          <aside className="card p-6">
            <div className="flex items-center gap-2">
              <House size={18} weight="duotone" className="text-accent-deep" />
              <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                Capacité résidentielle
              </p>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-mute">Logements actuels (rôle)</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {role.nombre_logements ?? <span className="text-base text-ink-faint">Aucun</span>}
                </span>
              </div>
              {potentiel && potentiel.fourchette_logements && (
                <div className="rounded-xl border border-line bg-canvas/60 p-3">
                  <p className="text-xs text-ink-faint">Permis selon la classe d'utilisation</p>
                  <p className="mt-1 text-base font-medium">
                    {potentiel.fourchette_logements.min === potentiel.fourchette_logements.max
                      ? `${potentiel.fourchette_logements.min} logement${potentiel.fourchette_logements.min > 1 ? "s" : ""}`
                      : `${potentiel.fourchette_logements.min} à ${potentiel.fourchette_logements.max} logements`}
                  </p>
                  {potentiel.classes && potentiel.classes[0] && (
                    <p className="mt-1 text-xs text-ink-mute">{potentiel.classes[0].label}</p>
                  )}
                </div>
              )}
              {!potentiel && role.usage_principal && (
                <p className="text-xs text-ink-mute">
                  Densité maximale selon le règlement de zonage municipal, non disponible en API ouverte. À consulter au PDF de zonage de la municipalité.
                </p>
              )}
            </div>
          </aside>
        </section>
      )}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Zonage</p>
          <p className="mt-2 font-medium">{parcel.zonage}</p>
          <div className="hairline my-4" />
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Usages permis
          </p>
          {parcel.usages_permis.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {parcel.usages_permis.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-warn">
              Aucun usage documenté pour cette municipalité, à valider en urbanisme.
            </p>
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
            <p className="mt-2 text-sm text-ok">
              Aucune contrainte signalée par les couches consultées.
            </p>
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

      {layers.length > 0 && (
        <section className="mt-10 card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Couches techniques interrogées
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {layers.map((l) => (
              <li
                key={l.name}
                className="flex items-start justify-between gap-3 text-sm text-ink-soft"
              >
                <span>{l.source}</span>
                <span
                  className={`pill text-[10px] ${
                    l.status === "ok" ? "pill-ok" : l.status === "error" ? "pill-danger" : "pill-warn"
                  }`}
                >
                  {l.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-ink-faint">
        Données live croisées au moment du chargement. Validation municipale recommandée avant toute décision.
      </p>
    </div>
  );
}
