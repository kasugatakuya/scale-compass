"use client";

import type { KeyScaleSuggestion } from "@/lib/music/scale-rules";
import { type Key, keyLabel } from "@/lib/music/key";
import { Chip, cn } from "@/components/ui";

const PRIORITY_LABEL = { 1: "第一候補", 2: "おすすめ", 3: "応用" } as const;

export function KeyScalePanel({
  keyObj,
  suggestions,
  active,
  selectedScaleId,
  onSelect,
}: {
  keyObj: Key;
  suggestions: KeyScaleSuggestion[];
  active: boolean;
  selectedScaleId: string | null;
  onSelect: (s: KeyScaleSuggestion) => void;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", active ? "border-accent ring-2 ring-accent/30" : "border-border")} aria-label="進行全体で使えるスケール">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">
          進行全体で使える共通スケール <span className="font-normal text-muted-foreground">（{keyLabel(keyObj)}）</span>
        </h2>
      </header>
      <ol className="flex flex-col gap-1.5 p-3">
        {suggestions.map((s) => {
          const id = `${s.scale.id}@${s.rootPc}`;
          const isActive = active && selectedScaleId === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                aria-pressed={isActive}
                className={cn("w-full rounded-md border px-3 py-2 text-left", isActive ? "border-accent bg-accent-soft" : "border-border hover:bg-muted")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={s.priority === 1 ? "p1" : s.priority === 2 ? "p2" : "p3"}>{PRIORITY_LABEL[s.priority]}</Chip>
                  <span className="text-sm font-semibold">
                    {s.root} {s.scale.nameJa}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{s.notes.map((n) => n.name).join(" ")}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.reasonJa}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
