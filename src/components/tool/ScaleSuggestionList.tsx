"use client";

import type { ScaleSuggestion } from "@/lib/music/scale-rules";
import { Chip, cn } from "@/components/ui";

const PRIORITY_LABEL = { 1: "第一候補", 2: "おすすめ", 3: "応用" } as const;

export function ScaleSuggestionList({
  suggestions,
  selectedId,
  onSelect,
  compact = false,
}: {
  suggestions: ScaleSuggestion[];
  selectedId: string | null;
  onSelect: (s: ScaleSuggestion) => void;
  compact?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-1.5" aria-label="おすすめスケール">
      {suggestions.map((s) => {
        const active = s.id === selectedId;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              aria-pressed={active}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left transition-colors",
                active ? "border-accent bg-accent-soft" : "border-border bg-card hover:bg-muted",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={s.priority === 1 ? "p1" : s.priority === 2 ? "p2" : "p3"}>{PRIORITY_LABEL[s.priority]}</Chip>
                <span className="text-sm font-semibold">
                  {s.root} {s.scale.nameJa}
                </span>
                <span className="text-xs text-muted-foreground">{s.scale.nameEn}</span>
                {s.missingChordTones.length > 0 && (
                  <Chip tone={s.coversChordTones ? "neutral" : "danger"}>{s.missingChordTones.map((l) => (l === "R" ? "ルート" : `${l}度`)).join("・")}を含まない</Chip>
                )}
              </div>
              {!compact && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.reasonJa}</p>}
              <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="構成音">
                {s.notes.map((n) => (
                  <li
                    key={n.pc}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[11px] leading-tight",
                      n.isRoot ? "bg-fb-root text-white" : n.isChordTone ? "bg-fb-chord text-white" : n.isTension ? "bg-fb-tension text-white" : "bg-muted text-foreground",
                      n.isAvoid && "border border-dashed border-muted-foreground",
                    )}
                    title={n.isAvoid ? "アヴォイドノート候補（コードトーンの半音上）" : undefined}
                  >
                    {n.name}
                    <span className="opacity-80"> {n.chordLabel ?? n.degree}</span>
                  </li>
                ))}
              </ul>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
