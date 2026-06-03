import Link from "next/link";
import { LogoLockup } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" aria-label="ZonAI, accueil" className="flex items-center gap-3">
          <LogoLockup size={26} />
          <span className="hidden text-xs font-mono uppercase tracking-[0.16em] text-ink-faint sm:inline">
            Mauricie
          </span>
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
