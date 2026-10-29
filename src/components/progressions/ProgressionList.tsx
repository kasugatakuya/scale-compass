"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_CATEGORIES, ALL_GENRES, ALL_MOODS, DIFFICULTY_LABEL, type Genre, type Mood, type Progression, PROGRESSIONS } from "@/data/progressions";
import { toolHref } from "@/lib/url-state";
import { Button, Chip, cn } from "@/components/ui";

export function ProgressionList() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre | "">("");
  const [mood, setMood] = useState<Mood | "">("");
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRESSIONS.filter((p) => {
      if (genre && !p.genres.includes(genre)) return false;
      if (mood && !p.mood.includes(mood)) return false;
      if (difficulty && p.difficulty !== difficulty) return false;
      if (!q) return true;
      const hay = [p.nameJa, ...(p.aliases ?? []), ...p.roman, ...p.chords, p.description, ...(p.examples ?? []), ...p.genres, ...p.mood].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, genre, mood, difficulty]);

  const grouped = ALL_CATEGORIES.map((c) => ({ category: c, items: filtered.filter((p) => p.category === c) })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          <span>検索（名前・ローマ数字・コード・曲名）</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例: カノン, Ⅱm7, Am, ブルース"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>ジャンル</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value as Genre | "")} className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground">
            <option value="">すべて</option>
            {ALL_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>ムード</span>
          <select value={mood} onChange={(e) => setMood(e.target.value as Mood | "")} className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground">
            <option value="">すべて</option>
            {ALL_MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span id="difficulty-label">難易度</span>
          <div role="radiogroup" aria-labelledby="difficulty-label" className="inline-flex rounded-md border border-border p-0.5">
            {([0, 1, 2, 3] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={difficulty === d}
                onClick={() => setDifficulty(d)}
                className={cn("rounded px-2 py-1 text-sm", difficulty === d ? "bg-accent text-accent-foreground" : "hover:bg-muted")}
              >
                {d === 0 ? "すべて" : DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
        <p className="w-full text-xs text-muted-foreground sm:w-auto sm:pb-2">{filtered.length} 件</p>
      </div>

      {grouped.length === 0 && <p className="text-sm text-muted-foreground">条件に合う進行がありません。</p>}
      {grouped.map((g) => (
        <section key={g.category} aria-labelledby={`cat-${g.category}`} className="flex flex-col gap-3">
          <h2 id={`cat-${g.category}`} className="text-base font-semibold">
            {g.category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {g.items.map((p) => (
              <ProgressionCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProgressionCard({ p }: { p: Progression }) {
  const [open, setOpen] = useState(false);
  const href = toolHref(p.key.tonic, p.key.mode, p.chords);
  return (
    <article id={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-bold leading-tight">{p.nameJa}</h3>
        {p.aliases && <p className="text-xs text-muted-foreground">別名: {p.aliases.join(" / ")}</p>}
        <div className="flex flex-wrap gap-1 pt-1">
          <Chip tone="accent">{DIFFICULTY_LABEL[p.difficulty]}</Chip>
          {p.genres.map((g) => (
            <Chip key={g}>{g}</Chip>
          ))}
          {p.mood.map((m) => (
            <Chip key={m} tone="p3">
              {m}
            </Chip>
          ))}
        </div>
      </header>
      <div className="rounded-md bg-muted px-3 py-2">
        <p className="font-mono text-sm leading-relaxed">{p.roman.join(" → ")}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          キー {p.key.tonic} {p.key.mode === "major" ? "メジャー" : "マイナー"}: {p.chords.join(" | ")}
        </p>
      </div>
      <p className="text-sm leading-relaxed">{p.description}</p>
      {open && (
        <div className="flex flex-col gap-2 text-sm">
          {p.tip && (
            <p className="rounded-md border border-dashed border-border p-2 text-xs leading-relaxed">
              <span className="font-semibold">演奏のヒント: </span>
              {p.tip}
            </p>
          )}
          {p.examples && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">代表的な使用例: </span>
              {p.examples.join("、")}
            </p>
          )}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Link href={href} className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90">
          スケール提案ツールで開く
        </Link>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "ヒントを閉じる" : "ヒント・使用例"}
        </Button>
      </div>
    </article>
  );
}
