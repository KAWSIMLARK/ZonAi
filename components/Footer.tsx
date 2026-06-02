export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-canvas">
      <div className="container-wide py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-xl font-semibold tracking-tight">TerraMauricie</p>
            <p className="mt-2 max-w-md text-sm text-ink-mute">
              Prototype d'intelligence foncière régionale pour la Mauricie. Les données affichées sont fictives et servent uniquement à démontrer la mécanique. À valider auprès des sources officielles avant toute décision.
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
            <p className="label-eyebrow">Référentiels visés</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>Cadastre du Québec</li>
              <li>Rôles d'évaluation municipaux</li>
              <li>MELCCFP, zones inondables</li>
              <li>CPTAQ, zonage agricole</li>
              <li>Atlas CIC, milieux humides</li>
            </ul>
          </div>
        </div>
        <div className="hairline mt-10" />
        <p className="mt-6 text-xs text-ink-faint">
          © 2026 TerraMauricie. Prototype non commercial. Aucune fiche présentée ne constitue un avis d'évaluation, légal ou environnemental.
        </p>
      </div>
    </footer>
  );
}
