"use client";

import type { ChordAnalysis } from "@/lib/music/analysis";
import { RELATION_LABEL_JA } from "@/lib/music/analysis";
import { slashChordKind } from "@/lib/music/chord-parser";
import { QUALITY_BY_ID } from "@/lib/music/chords";
import { FUNCTION_LABEL_JA } from "@/lib/music/key";
import type { ScaleSuggestion } from "@/lib/music/scale-rules";
import { Chip, cn } from "@/components/ui";
import { ScaleSuggestionList } from "./ScaleSuggestionList";

const FUNC_TONE = { tonic: "chord", subdominant: "tension", dominant: "root", other: "neutral" } as const;

export function ChordCard({
  analysis,
  suggestions,
  active,
  selectedScaleId,
  onActivate,
  onSelectScale,
  playButton,
}: {
  analysis: ChordAnalysis;
  suggestions: ScaleSuggestion[];
  active: boolean;
  selectedScaleId: string | null;
  onActivate: () => void;
  onSelectScale: (s: ScaleSuggestion) => void;
  playButton?: React.ReactNode;
}) {
  const { chord } = analysis;
  const slash = slashChordKind(chord);
  return (
    <article
      className={cn("rounded-xl border bg-card shadow-sm transition-colors", active ? "border-accent ring-2 ring-accent/30" : "border-border")}
      aria-current={active ? "true" : undefined}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <button type="button" onClick={onActivate} className="flex items-baseline gap-2 text-left" aria-label={`${chord.symbol} を指板に表示`}>
          <span className="text-2xl font-bold tracking-tight">{chord.symbol}</span>
          <span className="text-base font-semibold text-accent">{analysis.roman}</span>
        </button>
        <Chip tone={FUNC_TONE[analysis.func]}>{FUNCTION_LABEL_JA[analysis.func]}</Chip>
        <Chip tone={analysis.relation === "diatonic" ? "neutral" : "accent"}>{RELATION_LABEL_JA[analysis.relation]}</Chip>
        {analysis.hasAlteredTensions && <Chip tone="accent">オルタードテンション付き</Chip>}
        <span className="ml-auto flex items-center gap-2">
          {playButton}
          {!active ? (
            <button type="button" onClick={onActivate} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
              指板に表示
            </button>
          ) : (
            <a href="#fretboard" className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted lg:hidden">
              ↑ 指板へ
            </a>
          )}
        </span>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm leading-relaxed">{analysis.explanationJa}</p>
        {slash !== "none" && (
          <p className="text-xs text-muted-foreground">
            {slash === "inversion"
              ? `ベース音 ${chord.bass} はコードトーンなので転回形（${chord.bass} を一番下に置いた並び）です。スケール選びは元のコード ${chord.root}${QUALITY_BY_ID[chord.quality].suffix} と同じでかまいません。`
              : `ベース音 ${chord.bass} はコードトーン外です。上のコード（${chord.root}${QUALITY_BY_ID[chord.quality].suffix}）を基準にスケールを選び、ベース音は響きの土台として扱います。`}
          </p>
        )}
        <div>
          <h3 className="mb-1 text-xs font-semibold text-muted-foreground">構成音</h3>
          <ul className="flex flex-wrap gap-1.5" aria-label={`${chord.symbol} の構成音`}>
            {chord.tones.map((t, i) => (
              <li
                key={t.interval}
                className={cn(
                  "flex items-baseline gap-1 rounded-md px-2 py-1 font-mono text-sm",
                  t.role === "R" ? "bg-fb-root text-white" : t.isChordTone ? "bg-fb-chord text-white" : "bg-fb-tension text-white",
                )}
              >
                <span className="font-semibold">{chord.noteNames[i]}</span>
                <span className="text-xs opacity-85">{t.label}</span>
              </li>
            ))}
            {chord.bass && (
              <li className="flex items-baseline gap-1 rounded-md border border-dashed border-border px-2 py-1 font-mono text-sm">
                <span className="font-semibold">{chord.bass}</span>
                <span className="text-xs text-muted-foreground">ベース</span>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">おすすめスケール（クリックで指板に表示）</h3>
          <ScaleSuggestionList
            suggestions={suggestions}
            selectedId={active ? selectedScaleId : null}
            onSelect={(s) => {
              onActivate();
              onSelectScale(s);
            }}
          />
        </div>
      </div>
    </article>
  );
}
