"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";

interface Props {
  initialValue?: string;
  size?: "lg" | "md";
  exemples?: string[];
}

const DEFAULT_EXAMPLES = [
  "1875 rue Notre-Dame, Trois-Rivières",
  "lot 2 510 783",
  "résidentiel Shawinigan",
  "agricole Maskinongé",
];

export function SearchBar({ initialValue = "", size = "lg", exemples = DEFAULT_EXAMPLES }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialValue);
  const isLg = size === "lg";

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/recherche?q=${encodeURIComponent(trimmed)}` : "/recherche");
  }

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className={`group flex items-center gap-2 rounded-2xl border border-line bg-surface ${
          isLg ? "p-2 pl-5" : "p-1.5 pl-4"
        } shadow-card transition-shadow duration-300 ease-editorial focus-within:shadow-card-hover focus-within:border-line-strong`}
      >
        <MagnifyingGlass size={isLg ? 20 : 16} className="flex-shrink-0 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Adresse, numéro de lot, ou requête (ex. résidentiel Shawinigan)"
          className={`min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-faint focus:outline-none ${
            isLg ? "py-3 text-base" : "py-2 text-sm"
          }`}
          aria-label="Rechercher un terrain"
        />
        <button type="submit" className={isLg ? "btn-primary" : "btn-primary text-xs px-3 py-2"}>
          Analyser
          <ArrowRight size={isLg ? 14 : 12} weight="bold" />
        </button>
      </form>
      {exemples.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-mute">
          <span className="text-ink-faint">Essayer</span>
          {exemples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                router.push(`/recherche?q=${encodeURIComponent(ex)}`);
              }}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
