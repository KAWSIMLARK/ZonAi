import Link from "next/link";
import { notFound } from "next/navigation";
import { lookup } from "@/lib/sources/aggregator.mjs";
import { deriveWarnings } from "@/lib/business-rules.mjs";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { ConstraintBadges } from "@/components/ConstraintBadges";
import { WarningBanner } from "@/components/WarningBanner";
import { formatArea, formatCurrency, formatDate, ternaryLabel } from "@/lib/format";
import type { Parcel, Warning } from "@/lib/types";
import {
  ArrowLeft,
  Buildings,
  House,
  ArrowsOutSimple,
  ArrowSquareOut,
  CheckCircle,
  XCircle,
  Question,
} from "@phosphor-icons/react/dist/ssr";

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
  codes_internes?: string[];
}

interface PotentielData {
  fourchette_logements?: { min: number; max: number };
  classes?: Array<{ label: string; min: number; max: number; inferred?: boolean }>;
  logements_actuels?: number | null;
  inferred?: boolean;
}

interface ZonageMuniData {
  trouve?: boolean;
  code_famille?: string;
  famille?: string;
  categorie?: string;
  id_zone?: string | null;
  zonage?: string;
  usages_permis?: Array<{ code: string; libelle: string; etages?: [number, number] }> | string[];
  potentiel_residentiel?: {
    logements_max?: number | null;
    classes_h_permises?: Array<{ code: string; libelle: string; min: number; max: number | null }>;
    h12_max?: number | null;
    h13_max?: number | null;
  };
  normes?: {
    hauteur_min_m?: number | null;
    hauteur_max_m?: number | null;
    etages_min?: number | null;
    etages_max?: number | null;
    lot_largeur_min_m?: number | null;
    lot_profondeur_min_m?: number | null;
    lot_superficie_min_m2?: number | null;
    ces_min?: number | null;
    ces_max?: number | null;
    piia?: boolean;
    pae?: boolean;
    dispositions_speciales?: string[];
  };
  reglement_url?: string;
  grille_url?: string;
}

interface SubdivisionData {
  statut: "possible" | "a_verifier" | "non";
  raison: string;
  indices: string[];
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
      _zonage_muni?: ZonageMuniData | null;
      _subdivision?: SubdivisionData;
    };
  };
  if (result.status !== "ok" || !result.parcel) notFound();

  const parcel = result.parcel;
  const warnings = deriveWarnings(parcel) as Warning[];
  const layers = parcel._layers ?? [];
  const role = parcel._role;
  const potentiel = parcel._potentiel ?? null;
  const zonageMuni = parcel._zonage_muni ?? null;
  const subdivision = parcel._subdivision ?? null;

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
            Lecture ZonAI
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

          {/* Capacité résidentielle : actuel vs permis (selon règlement officiel) */}
          <aside className="card p-6">
            <div className="flex items-center gap-2">
              <House size={18} weight="duotone" className="text-accent-deep" />
              <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                Capacité résidentielle
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-line bg-canvas/60 p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                  Actuel (rôle)
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {role.nombre_logements ?? "0"}
                </p>
                <p className="text-xs text-ink-mute">
                  {role.nombre_logements === 1 ? "logement" : "logements"}
                </p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent-wash/40 p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-accent-deep/70">
                  Permis (règlement)
                </p>
                {zonageMuni?.potentiel_residentiel?.logements_max ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-accent-deep">
                      {zonageMuni.potentiel_residentiel.logements_max >= 999
                        ? "49+"
                        : zonageMuni.potentiel_residentiel.logements_max}
                    </p>
                    <p className="text-xs text-ink-mute">logements max</p>
                  </>
                ) : potentiel?.fourchette_logements ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-accent-deep">
                      {potentiel.fourchette_logements.min === potentiel.fourchette_logements.max
                        ? potentiel.fourchette_logements.min
                        : `${potentiel.fourchette_logements.min}–${potentiel.fourchette_logements.max === 999 ? "+" : potentiel.fourchette_logements.max}`}
                    </p>
                    <p className="text-xs text-ink-mute">selon usage</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xl font-semibold text-ink-faint">?</p>
                    <p className="text-xs text-ink-mute">à vérifier règlement</p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-line bg-canvas/60 p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                  Étages actuels
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {role.nombre_etages_max ?? "?"}
                </p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent-wash/40 p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-accent-deep/70">
                  Étages permis
                </p>
                {zonageMuni?.normes?.etages_max != null ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-accent-deep">
                      {zonageMuni.normes.etages_min === zonageMuni.normes.etages_max
                        ? zonageMuni.normes.etages_max
                        : `${zonageMuni.normes.etages_min ?? 1}–${zonageMuni.normes.etages_max}`}
                    </p>
                    <p className="text-xs text-ink-mute">
                      hauteur {zonageMuni.normes.hauteur_max_m ?? "?"} m max
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xl font-semibold text-ink-faint">
                    voir<br />règlement
                  </p>
                )}
              </div>
            </div>

            {/* Classes H permises avec libellés exacts */}
            {zonageMuni?.potentiel_residentiel?.classes_h_permises &&
              zonageMuni.potentiel_residentiel.classes_h_permises.length > 0 && (
                <div className="mt-4 rounded-xl border border-line bg-canvas/40 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                    Classes d'habitation permises
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                    {zonageMuni.potentiel_residentiel.classes_h_permises.map((c) => (
                      <li key={c.code} className="flex items-baseline justify-between gap-2">
                        <span>
                          <span className="font-mono text-accent-deep">{c.code}</span> {c.libelle}
                        </span>
                        <span className="font-mono text-[10px] text-ink-faint">
                          {c.max === c.min ? `${c.max} log` : `${c.min}–${c.max ?? "?"} log`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {zonageMuni?.grille_url && zonageMuni?.id_zone && (
              <a
                href={zonageMuni.grille_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent-deep hover:underline"
              >
                <ArrowSquareOut size={12} weight="bold" />
                Grille de spécifications zone {zonageMuni.id_zone} (PDF)
              </a>
            )}
          </aside>
        </section>
      )}

      {/* Normes du règlement : implantation, lot, CES */}
      {zonageMuni?.normes && (zonageMuni.normes.lot_superficie_min_m2 || zonageMuni.normes.ces_max) && (
        <section className="mt-6 card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Normes officielles du règlement de zonage
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
            {zonageMuni.normes.lot_superficie_min_m2 != null && (
              <div>
                <dt className="text-xs text-ink-faint">Lot min</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {zonageMuni.normes.lot_superficie_min_m2} m²
                </dd>
              </div>
            )}
            {zonageMuni.normes.lot_largeur_min_m != null && (
              <div>
                <dt className="text-xs text-ink-faint">Largeur lot min</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {zonageMuni.normes.lot_largeur_min_m} m
                </dd>
              </div>
            )}
            {zonageMuni.normes.lot_profondeur_min_m != null && (
              <div>
                <dt className="text-xs text-ink-faint">Profondeur lot min</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {zonageMuni.normes.lot_profondeur_min_m} m
                </dd>
              </div>
            )}
            {zonageMuni.normes.ces_max != null && (
              <div>
                <dt className="text-xs text-ink-faint">CES max</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {(zonageMuni.normes.ces_max * 100).toFixed(0)} %
                </dd>
              </div>
            )}
            {zonageMuni.normes.hauteur_min_m != null && (
              <div>
                <dt className="text-xs text-ink-faint">Hauteur min</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {zonageMuni.normes.hauteur_min_m} m
                </dd>
              </div>
            )}
            {zonageMuni.normes.hauteur_max_m != null && (
              <div>
                <dt className="text-xs text-ink-faint">Hauteur max</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums">
                  {zonageMuni.normes.hauteur_max_m} m
                </dd>
              </div>
            )}
            {zonageMuni.normes.piia && (
              <div>
                <dt className="text-xs text-ink-faint">PIIA</dt>
                <dd className="mt-1 text-sm font-medium text-warn">Applicable</dd>
              </div>
            )}
            {zonageMuni.normes.pae && (
              <div>
                <dt className="text-xs text-ink-faint">PAE</dt>
                <dd className="mt-1 text-sm font-medium text-warn">Applicable</dd>
              </div>
            )}
          </dl>
          {zonageMuni.normes.dispositions_speciales && zonageMuni.normes.dispositions_speciales.length > 0 && (
            <p className="mt-4 text-xs text-ink-mute">
              Dispositions spéciales :{" "}
              <span className="font-mono">{zonageMuni.normes.dispositions_speciales.join(", ")}</span>
              {" — voir le règlement pour le détail."}
            </p>
          )}
        </section>
      )}

      {/* Subdivision possible */}
      {subdivision && (
        <section className="mt-6">
          <div
            className={`card flex items-start gap-4 p-5 ${
              subdivision.statut === "non"
                ? "border-danger/25 bg-danger-wash/50"
                : subdivision.statut === "possible"
                  ? "border-ok/30 bg-ok-wash/50"
                  : "border-warn/30 bg-warn-wash/40"
            }`}
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                subdivision.statut === "non"
                  ? "text-danger"
                  : subdivision.statut === "possible"
                    ? "text-ok"
                    : "text-warn"
              }`}
            >
              {subdivision.statut === "non" ? (
                <XCircle size={24} weight="fill" />
              ) : subdivision.statut === "possible" ? (
                <CheckCircle size={24} weight="fill" />
              ) : (
                <Question size={24} weight="fill" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-3">
                <ArrowsOutSimple size={14} className="text-ink-mute" />
                <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                  Subdivision du terrain
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold">
                {subdivision.statut === "non"
                  ? "Probablement non subdivisible"
                  : subdivision.statut === "possible"
                    ? "Subdivision possible"
                    : "À évaluer en urbanisme"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{subdivision.raison}</p>
              {subdivision.indices.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink-mute">
                  {subdivision.indices.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Zonage</p>
          {zonageMuni && zonageMuni.trouve ? (
            <>
              <p className="mt-2 text-lg font-semibold">{zonageMuni.famille}</p>
              {zonageMuni.id_zone && (
                <p className="mt-1 font-mono text-xs text-ink-faint">
                  Zone {zonageMuni.id_zone}
                </p>
              )}
              {zonageMuni.reglement_url && (
                <a
                  href={zonageMuni.reglement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-deep hover:underline"
                >
                  <ArrowSquareOut size={12} weight="bold" />
                  Règlement complet 2021, c.126
                </a>
              )}
            </>
          ) : (
            <p className="mt-2 font-medium">{parcel.zonage}</p>
          )}
          <div className="hairline my-4" />
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            Usages permis (règlement)
          </p>
          {Array.isArray(zonageMuni?.usages_permis) && zonageMuni.usages_permis.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {(zonageMuni.usages_permis as Array<{ code: string; libelle: string; etages?: [number, number] }>).map((u) => (
                <li key={u.code + u.libelle} className="flex items-baseline gap-2">
                  <span className="inline-block min-w-[2.5rem] font-mono text-xs text-accent-deep">
                    {u.code}
                  </span>
                  <span className="flex-1">{u.libelle}</span>
                  {u.etages && (
                    <span className="font-mono text-[10px] text-ink-faint">
                      {u.etages[0]}–{u.etages[1]} ét.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : parcel.usages_permis.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {parcel.usages_permis.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-warn">
              Usages spécifiques à valider au règlement de zonage municipal.
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
