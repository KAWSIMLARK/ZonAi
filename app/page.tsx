import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import parcelsData from "@/lib/data/parcels.json";
import { MAURICIE_MRC } from "@/lib/business-rules.mjs";
import type { Parcel } from "@/lib/types";
import { formatArea, formatCurrency } from "@/lib/format";
import {
  Database,
  Drop,
  Leaf,
  MapTrifold,
  ShieldCheck,
  Warning as WarningIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  const parcels = (parcelsData as Parcel[]).filter((p) => p.region === "Mauricie");
  const featured = parcels.filter((p) => p.niveau_confiance === "eleve");
  const hero = featured.find((p) => p.id === "TM-011") ?? featured[0];

  const stats = {
    fiches: parcels.length,
    municipalites: new Set(parcels.map((p) => p.municipalite)).size,
    mrc: MAURICIE_MRC.length,
    inondables: parcels.filter((p) => p.zone_inondable === "oui").length,
  };

  return (
    <div>
      {/* HERO : asymétrique, sans serif, sans eyebrow, sans middle-dot strip */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-wide grid items-start gap-12 pt-20 pb-24 md:grid-cols-[1.2fr_0.8fr] md:pt-24 md:pb-32">
          <div>
            <h1 className="text-[2.5rem] font-semibold tracking-tight leading-[1.05] md:text-[4rem]">
              Acheter un terrain en Mauricie,
              <br />
              <span className="text-accent-deep">sans angle mort.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-mute">
              Cadastre, rôles d'évaluation, zones inondables, milieux humides, zonage. TerraMauricie agrège ces couches et vous montre les contraintes avant l'offre d'achat.
            </p>
            <div className="mt-10">
              <SearchBar size="lg" />
            </div>
          </div>

          {/* Aperçu fiche, sans pill flottant, sans middle-dot strip */}
          <aside className="relative md:mt-8">
            <div
              className="absolute -inset-x-6 -top-6 hidden h-64 rounded-2xl bg-cover bg-center opacity-90 md:block"
              style={{ backgroundImage: "url(https://picsum.photos/seed/mauricie-fleuve-aerial/900/520)" }}
              aria-hidden
            />
            <div className="card relative mt-32 p-6 md:mt-44">
              <div className="flex items-center justify-between">
                <span className="pill pill-accent">Aperçu de fiche</span>
                <span className="text-xs font-mono text-ink-faint">{hero.id}</span>
              </div>
              <p className="mt-3 text-xl font-semibold tracking-tight">{hero.adresse}</p>
              <p className="text-sm text-ink-mute">{hero.municipalite}, MRC {hero.mrc}</p>
              <div className="mt-5 rounded-xl border border-danger/25 bg-danger-wash px-3 py-2.5 text-sm text-danger">
                <p className="font-semibold">Terrain en zone inondable</p>
                <p className="mt-0.5 leading-snug opacity-90">Récurrence 20 à 100 ans, construction encadrée.</p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-ink-faint">Superficie</dt>
                  <dd className="mt-1 tabular-nums">{formatArea(hero.superficie_m2)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Valeur</dt>
                  <dd className="mt-1 tabular-nums">{formatCurrency(hero.valeur_fonciere)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-ink-faint">Zonage</dt>
                  <dd className="mt-1">{hero.zonage}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {/* DISCLOSURE bandeau de transparence sur les données — répond directement à la question utilisateur */}
      <section id="donnees" className="border-b border-line bg-warn-wash/40">
        <div className="container-wide flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <WarningIcon size={20} weight="fill" className="mt-0.5 flex-shrink-0 text-warn" />
            <div>
              <p className="text-sm font-semibold text-warn">Prototype, données fictives</p>
              <p className="mt-0.5 max-w-3xl text-sm text-ink-soft">
                Les 15 fiches affichées sont fabriquées pour la démonstration. Aucune adresse saisie n'est validée contre une source officielle. En production, TerraMauricie brancherait les sources listées plus bas.
              </p>
            </div>
          </div>
          <a href="#sources" className="btn-secondary self-start whitespace-nowrap text-xs">Voir les sources visées</a>
        </div>
      </section>

      {/* STATS — sans eyebrows, lecture rapide */}
      <section id="couverture" className="border-b border-line">
        <div className="container-wide grid gap-0 py-12 md:grid-cols-4 md:divide-x md:divide-line">
          {[
            { v: stats.fiches, k: "Fiches mock", sub: "Cas valides, partiels, limites" },
            { v: stats.municipalites, k: "Municipalités", sub: "Mauricie couverte" },
            { v: stats.mrc, k: "MRC", sub: "TR, Shawinigan, La Tuque, Maskinongé, Chenaux, Mékinac" },
            { v: stats.inondables, k: "Zones inondables", sub: "Avertissements automatiques" },
          ].map((s) => (
            <div key={s.k} className="px-6 py-4">
              <p className="text-4xl font-semibold tabular-nums tracking-tight">{s.v}</p>
              <p className="mt-2 text-sm font-medium">{s.k}</p>
              <p className="mt-1 text-xs text-ink-mute">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED — layout asymétrique (1 grande + 2 petites) au lieu de 3 cartes égales */}
      <section className="container-wide py-20 md:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="max-w-2xl text-h1 font-semibold tracking-tight">
            Trois lectures de terrains, trois niveaux de prudence.
          </h2>
          <Link href="/recherche" className="btn-secondary whitespace-nowrap">Voir tout</Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-12">
          {featured[0] && (
            <Link
              href={`/terrain/${featured[0].id}`}
              className="card-interactive group md:col-span-7"
            >
              <div
                className="h-56 rounded-t-2xl bg-cover bg-center md:h-72"
                style={{ backgroundImage: `url(https://picsum.photos/seed/${featured[0].id}-aerial/1100/600)` }}
              />
              <div className="p-7">
                <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">{featured[0].municipalite}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight group-hover:text-accent-deep">{featured[0].adresse}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-mute">{featured[0].resume_ia}</p>
                <div className="hairline my-5" />
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-faint">{formatArea(featured[0].superficie_m2)}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(featured[0].valeur_fonciere)}</span>
                </div>
              </div>
            </Link>
          )}

          <div className="grid gap-5 md:col-span-5">
            {featured.slice(1, 3).map((p) => (
              <Link key={p.id} href={`/terrain/${p.id}`} className="card-interactive group flex flex-col p-6">
                <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">{p.municipalite}</p>
                <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-accent-deep">{p.adresse}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-ink-mute">{p.resume_ia}</p>
                <div className="hairline my-4 mt-auto" />
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-faint">{formatArea(p.superficie_m2)}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(p.valeur_fonciere)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SOURCES — pas de numérotation 01-06, icônes Phosphor, layout 2 colonnes */}
      <section id="sources" className="border-t border-line bg-accent-wash/40">
        <div className="container-wide grid gap-12 py-20 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <h2 className="text-h1 font-semibold tracking-tight text-accent-deep">
              Croiser les sources. Refuser les compromis.
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              Chaque fiche est confrontée à neuf règles métier avant d'être présentée. Un terrain en zone inondable ne peut pas apparaître sans avertissement. Une fiche partielle ne peut pas se faire passer pour complète.
            </p>
            <Link href="/recherche" className="btn-primary mt-8">Démarrer une recherche</Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { Icon: Database, t: "Cadastre du Québec", d: "Identité officielle du lot et sa superficie." },
              { Icon: MapTrifold, t: "Rôles municipaux", d: "Valeur foncière, propriétaire, usage déclaré." },
              { Icon: Drop, t: "MELCCFP, zones inondables", d: "Plaines de récurrence 0 à 20 et 20 à 100 ans." },
              { Icon: Leaf, t: "Atlas CIC, milieux humides", d: "Milieux humides cartographiés ou probables." },
              { Icon: ShieldCheck, t: "CPTAQ", d: "Zones agricoles permanentes." },
              { Icon: WarningIcon, t: "Règles de cohérence", d: "Avertissements clairs avant tout résumé." },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="card flex gap-4 p-5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent-deep">
                  <Icon size={20} weight="duotone" />
                </span>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="mt-1 text-sm text-ink-mute">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="container-wide py-20 md:py-24">
        <div className="card flex flex-col items-start justify-between gap-6 p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-h1 font-semibold tracking-tight">Un terrain en tête ?</h2>
            <p className="mt-2 text-ink-mute">Saisissez son adresse, son numéro de lot, ou décrivez-le simplement.</p>
          </div>
          <Link href="/recherche" className="btn-primary">Lancer une recherche</Link>
        </div>
      </section>
    </div>
  );
}
