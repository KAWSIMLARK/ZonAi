import { LogoLockup } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-canvas">
      <div className="container-wide py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LogoLockup size={28} wordmarkClassName="text-xl" />
            <p className="mt-3 max-w-md text-sm text-ink-mute">
              Intelligence foncière régionale. Les couches branchées sont réelles, les
              valeurs proviennent du rôle géoréférencé 2026 du MAMH. Validation municipale
              recommandée avant toute décision.
            </p>
          </div>
          <div>
            <p className="label-eyebrow">Périmètre</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>Trois-Rivières</li>
              <li>Shawinigan</li>
              <li>La Tuque</li>
              <li>MRC Maskinongé</li>
              <li>MRC des Chenaux</li>
              <li>MRC Mékinac</li>
            </ul>
          </div>
          <div>
            <p className="label-eyebrow">Sources branchées</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>Adresses Québec (MRNF)</li>
              <li>Rôle d'évaluation 2026 (MAMH)</li>
              <li>MELCCFP, zones inondables</li>
              <li>CPTAQ, zonage agricole</li>
              <li>CIC, milieux humides</li>
              <li>Ville de Trois-Rivières</li>
            </ul>
          </div>
        </div>
        <div className="hairline mt-10" />
        <p className="mt-6 text-xs text-ink-faint">
          © 2026 ZonAI. Aucune fiche présentée ne constitue un avis d'évaluation, légal ou environnemental.
        </p>
      </div>
    </footer>
  );
}
