"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Warning } from "@phosphor-icons/react";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[ZonAI] erreur runtime:", error);
  }, [error]);

  return (
    <div className="container-tight py-24">
      <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-danger/30 bg-danger-wash text-danger">
          <Warning size={22} weight="fill" />
        </div>
        <div className="max-w-md">
          <h2 className="text-h1 font-semibold tracking-tight">Une erreur est survenue</h2>
          <p className="mt-2 text-sm text-ink-mute">
            ZonAI n'a pas pu charger cette analyse. Cela peut être lié à des données mock incomplètes, ou à un cas non géré.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-line bg-canvas p-3 text-left text-xs text-ink-mute">
              {error.message}
            </pre>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => reset()} className="btn-secondary">Réessayer</button>
          <Link href="/" className="btn-ghost">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
