import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { MAURICIE_MRC } from "@/lib/business-rules.mjs";
import {
  Database,
  Drop,
  House,
  Leaf,
  MapTrifold,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const EXEMPLES = [
  {
    q: "1875 rue Notre-Dame Trois-Rivières",
    ville: "Trois-Rivières",
    note: "Zonage municipal complet (Ville de TR)",
  },
  {
    q: "752 5e Rue de la Pointe Shawinigan",
    ville: "Shawinigan",
    note: "Zone inondable, CPTAQ, géocodage AQ",
  },
  {
    q: "100 rang Sainte-Marie Saint-Tite",
    ville: "Saint-Tite",
    note: "Zone agricole rurale, CPTAQ actif",
  },
];

export default function HomePage() {
  const stats = {
    couches: 4,
    mrc: MAURICIE_MRC.length,
    cptaq: "275 polygones",
    zonageTr: "1 663 zones",
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-wide grid items-start gap-12 pt-20 pb-24 md:grid-cols-[1.2fr_0.8fr] md:pt-24 md:pb-32">
          <div>
            <h1 className="text-[2.5rem] font-semibold tracking-tight leading-[1.05] md:text-[4rem]">
              Acheter un terrain en Mauricie,
              <br />
              <span className="text-accent-deep">sans angle mort.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-mute">
              Saisissez une adresse. TerraMauricie croise en direct le géocodage officiel,
              les zones inondables MELCCFP, la zone agricole CPTAQ, et le zonage municipal,
              et résume les contraintes avant l'offre d'achat.
            </p>
            <div className="mt-10">
              <SearchBar size="lg" exemples={EXEMPLES.map((e) => e.q)} />
            </div>
          </div>

          {/* Aperçu des couches actives plutôt qu'une fiche fictive */}
          <aside className="relative md:mt-8">
            <div
              className="absolute -inset-x-6 -top-6 hidden h-56 rounded-2xl bg-cover bg-center opacity-90 md:block"
              style={{
                backgroundImage: "url(https://picsum.photos/seed/mauricie-fleuve-aerial/900/520)",
              }}
              aria-hidden
            />
            <div className="card relative mt-32 p-6 md:mt-44">
              <span className="pill pill-accent">Sources branchées en direct</span>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapTrifold size={18} className="mt-0.5 flex-shrink-0 text-accent-deep" />
                  <div>
                    <p className="font-medium">Adresses Québec, géocodage officiel</p>
                    <p className="text-xs text-ink-mute">
                      MRNF, AQréseau+, précision route et numéro civique
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Drop size={18} className="mt-0.5 flex-shrink-0 text-accent-deep" />
                  <div>
                    <p className="font-medium">MELCCFP, zones inondables</p>
                    <p className="text-xs text-ink-mute">
                      BDZI ArcGIS REST, récurrence 0 à 20 et 20 à 100 ans
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Leaf size={18} className="mt-0.5 flex-shrink-0 text-accent-deep" />
                  <div>
                    <p className="font-medium">CPTAQ, zone agricole permanente</p>
                    <p className="text-xs text-ink-mute">
                      Cartographie Déméter, point-in-polygon local
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <House size={18} className="mt-0.5 flex-shrink-0 text-accent-deep" />
                  <div>
                    <p className="font-medium">Ville de Trois-Rivières, zonage municipal</p>
                    <p className="text-xs text-ink-mute">
                      1 663 zones, données ouvertes v3r.net
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* TRANSPARENCE sur le statut prototype */}
      <section id="donnees" className="border-b border-line bg-warn-wash/30">
        <div className="container-wide flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-warn">Prototype</p>
            <p className="text-sm text-ink-soft">
              Les couches branchées sont réelles, mais la cartographie CPTAQ et le zonage TR
              sont des snapshots ouverts mis à jour 2026, pas une consultation live de
              l'autorité. Toute décision finale doit être validée auprès de la municipalité
              et des sources officielles.
            </p>
          </div>
          <a href="#sources" className="btn-secondary self-start whitespace-nowrap text-xs">
            Voir le détail des sources
          </a>
        </div>
      </section>

      {/* STATS basées sur le live, pas sur le mock */}
      <section id="couverture" className="border-b border-line">
        <div className="container-wide grid gap-0 py-12 md:grid-cols-4 md:divide-x md:divide-line">
          <div className="px-6 py-4">
            <p className="text-4xl font-semibold tabular-nums tracking-tight">{stats.couches}</p>
            <p className="mt-2 text-sm font-medium">Couches branchées</p>
            <p className="mt-1 text-xs text-ink-mute">
              Adresses Québec, MELCCFP, CPTAQ, Trois-Rivières
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-4xl font-semibold tabular-nums tracking-tight">{stats.mrc}</p>
            <p className="mt-2 text-sm font-medium">MRC de la Mauricie</p>
            <p className="mt-1 text-xs text-ink-mute">
              Trois-Rivières, Shawinigan, La Tuque, Maskinongé, Chenaux, Mékinac
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-4xl font-semibold tabular-nums tracking-tight">{stats.cptaq}</p>
            <p className="mt-2 text-sm font-medium">Zone agricole CPTAQ</p>
            <p className="mt-1 text-xs text-ink-mute">
              Cartographie officielle clip Mauricie, mai 2026
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-4xl font-semibold tabular-nums tracking-tight">{stats.zonageTr}</p>
            <p className="mt-2 text-sm font-medium">Zones municipales TR</p>
            <p className="mt-1 text-xs text-ink-mute">
              Ville de Trois-Rivières, données ouvertes
            </p>
          </div>
        </div>
      </section>

      {/* EXEMPLES à tester */}
      <section className="container-wide py-20 md:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="max-w-2xl text-h1 font-semibold tracking-tight">
            Trois adresses à tester, trois lectures différentes.
          </h2>
          <Link href="/recherche" className="btn-secondary whitespace-nowrap">
            Page recherche
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {EXEMPLES.map((ex) => (
            <Link
              key={ex.q}
              href={`/recherche?q=${encodeURIComponent(ex.q)}`}
              className="card-interactive group flex flex-col p-6"
            >
              <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                {ex.ville}
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-accent-deep">
                {ex.q}
              </h3>
              <p className="mt-3 text-sm text-ink-mute">{ex.note}</p>
              <div className="hairline my-4 mt-auto" />
              <p className="text-xs text-ink-faint">Lancer l'analyse →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* SOURCES */}
      <section id="sources" className="border-t border-line bg-accent-wash/40">
        <div className="container-wide grid gap-12 py-20 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <h2 className="text-h1 font-semibold tracking-tight text-accent-deep">
              Quatre couches, des sources nommées.
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              Chaque réponse de recherche affiche les couches interrogées et leur statut.
              Aucune donnée n'est inventée. Quand une couche est indisponible, la fiche le dit
              et propose une vérification.
            </p>
            <Link href="/recherche" className="btn-primary mt-8">
              Démarrer une recherche
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              {
                Icon: MapTrifold,
                t: "Adresses Québec",
                d: "MRNF, ArcGIS GeocodeServer officiel. Sortie WGS84.",
              },
              {
                Icon: Database,
                t: "OpenStreetMap, Nominatim",
                d: "Fallback gratuit si Adresses Québec ne répond pas.",
              },
              {
                Icon: Drop,
                t: "MELCCFP, BDZI",
                d: "Plaines inondables 0 à 20 et 20 à 100 ans. ArcGIS REST.",
              },
              {
                Icon: Leaf,
                t: "CPTAQ Déméter",
                d: "Zone agricole transposée au cadastre, mai 2026.",
              },
              {
                Icon: House,
                t: "Ville de Trois-Rivières",
                d: "Zonage municipal en vigueur, GROUPEUSAGE + description.",
              },
              {
                Icon: ShieldCheck,
                t: "Validation Mauricie",
                d: "Cross-check des 30 municipalités. Hors région rejetée.",
              },
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

      {/* CTA */}
      <section className="container-wide py-20 md:py-24">
        <div className="card flex flex-col items-start justify-between gap-6 p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-h1 font-semibold tracking-tight">Un terrain en tête ?</h2>
            <p className="mt-2 text-ink-mute">
              Saisissez son adresse complète, le code postal aide la précision.
            </p>
          </div>
          <Link href="/recherche" className="btn-primary">
            Lancer une recherche
          </Link>
        </div>
      </section>
    </div>
  );
}
