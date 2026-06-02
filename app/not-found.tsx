import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="container-tight py-24">
      <EmptyState
        title="Fiche introuvable"
        description="Ce terrain n'existe pas dans le périmètre Mauricie actuel, ou son identifiant est obsolète."
        hint="Essayez une nouvelle recherche par adresse, numéro de lot ou municipalité."
        ctaLabel="Nouvelle recherche"
        ctaHref="/recherche"
        tone="warn"
      />
    </div>
  );
}
