import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-canvas">
            <Compass size={16} weight="bold" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">TerraMauricie</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <Link href="/recherche" className="transition-colors hover:text-ink">Rechercher</Link>
          <a href="#couverture" className="transition-colors hover:text-ink">Couverture</a>
          <a href="#donnees" className="transition-colors hover:text-ink">Données</a>
          <Link href="/recherche" className="btn-primary text-xs px-3.5 py-2">Démarrer</Link>
        </nav>
      </div>
    </header>
  );
}
