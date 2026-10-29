"use client";

import { useState } from "react";
import { buildChordSymbol, type ParseResult, parseChord, splitProgression } from "@/lib/music/chord-parser";
import { CHORD_QUALITIES, type ChordQuality } from "@/lib/music/chords";
import { type Key, KEY_TONICS, nameInKey } from "@/lib/music/key";
import { Button, Chip, cn } from "@/components/ui";

const PALETTE_GROUPS: { label: string; qualities: ChordQuality[] }[] = [
  { label: "三和音", qualities: ["maj", "min", "dim", "aug", "sus2", "sus4"] },
  { label: "セブンス", qualities: ["7", "maj7", "m7", "m7b5", "dim7", "mMaj7", "6", "m6", "7sus4"] },
  { label: "テンション", qualities: ["add9", "9", "m9", "maj9", "11", "13"] },
  { label: "オルタード", qualities: ["7b9", "7#9", "7#11", "7b13", "7#5", "7alt"] },
];

export function ProgressionInput({
  chords,
  results,
  selected,
  keyObj: key,
  onChange,
  onSelect,
}: {
  chords: string[];
  results: ParseResult[];
  selected: number;
  keyObj: Key;
  onChange: (chords: string[]) => void;
  onSelect: (index: number) => void;
}) {
  const joined = chords.join(" | ");
  const [text, setText] = useState(joined);
  const [prevJoined, setPrevJoined] = useState(joined);
  // 親からコード列が変わったら入力欄も合わせる（レンダー中の state 調整パターン）
  if (joined !== prevJoined) {
    setPrevJoined(joined);
    setText(joined);
  }
  const [paletteRoot, setPaletteRoot] = useState<string>(key.tonic);
  const [paletteBass, setPaletteBass] = useState<string>("");
  const [paletteOpen, setPaletteOpen] = useState(true);

  const commit = () => {
    const next = splitProgression(text);
    if (next.join("|") !== chords.join("|")) onChange(next);
  };

  const roots = KEY_TONICS[key.mode].map((n) => n);
  const rootPcs = Array.from({ length: 12 }, (_, pc) => nameInKey(key, pc));

  const addChord = (q: ChordQuality) => {
    const symbol = buildChordSymbol(paletteRoot, q, paletteBass || undefined);
    const r = parseChord(symbol);
    if (!r.ok) return;
    onChange([...chords, r.chord.symbol]);
    onSelect(chords.length);
  };

  const remove = (i: number) => {
    const next = chords.filter((_, j) => j !== i);
    onChange(next);
    if (selected >= next.length) onSelect(Math.max(0, next.length - 1));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= chords.length) return;
    const next = [...chords];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    onSelect(j);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>
          コード進行（テキスト入力。<code className="font-mono">|</code> やスペース、カンマで区切る。例: <code className="font-mono">Dm7 | G7 | Cmaj7 | Am7</code>）
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
            }}
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground"
            aria-label="コード進行"
            placeholder="Dm7 | G7 | Cmaj7 | Am7"
          />
          <Button variant="primary" onClick={commit}>
            反映
          </Button>
        </div>
      </label>

      {/* チップ表示 */}
      <ol className="flex flex-wrap items-center gap-1.5" aria-label="入力されたコード">
        {results.map((r, i) => {
          const active = i === selected;
          return (
            <li key={`${i}-${r.ok ? r.chord.symbol : r.input}`} className="flex items-center">
              <div
                className={cn(
                  "flex items-center overflow-hidden rounded-md border text-sm",
                  r.ok ? (active ? "border-accent bg-accent-soft" : "border-border bg-card") : "border-danger bg-danger-soft text-danger",
                )}
              >
                <button
                  type="button"
                  onClick={() => r.ok && onSelect(i)}
                  aria-pressed={active}
                  aria-label={r.ok ? `${r.chord.symbol} を選択` : `${r.input}（読めません）`}
                  title={r.ok ? undefined : r.error}
                  className="px-2.5 py-1 font-medium"
                >
                  {r.ok ? r.chord.symbol : r.input}
                </button>
                <button type="button" onClick={() => move(i, -1)} aria-label="左へ移動" className="px-1 py-1 text-xs text-muted-foreground hover:bg-muted" disabled={i === 0}>
                  ‹
                </button>
                <button type="button" onClick={() => move(i, 1)} aria-label="右へ移動" className="px-1 py-1 text-xs text-muted-foreground hover:bg-muted" disabled={i === results.length - 1}>
                  ›
                </button>
                <button type="button" onClick={() => remove(i)} aria-label={`${r.ok ? r.chord.symbol : r.input} を削除`} className="px-1.5 py-1 text-xs text-muted-foreground hover:bg-danger-soft hover:text-danger">
                  ×
                </button>
              </div>
              {i < results.length - 1 && <span className="px-1 text-muted-foreground" aria-hidden="true">→</span>}
            </li>
          );
        })}
        {results.length === 0 && <li className="text-sm text-muted-foreground">コードを入力するか、下のパレットから追加してください。</li>}
      </ol>

      {/* パレット */}
      <div className="rounded-md border border-border">
        <button
          type="button"
          onClick={() => setPaletteOpen((o) => !o)}
          aria-expanded={paletteOpen}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-muted"
        >
          <span>クリックでコードを追加</span>
          <span aria-hidden="true">{paletteOpen ? "▾" : "▸"}</span>
        </button>
        {paletteOpen && (
          <div className="flex flex-col gap-3 border-t border-border p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span id="palette-root">ルート</span>
                <div role="radiogroup" aria-labelledby="palette-root" className="flex flex-wrap gap-1">
                  {rootPcs.map((name, pc) => {
                    const active = paletteRoot === name || roots.indexOf(paletteRoot) === pc;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPaletteRoot(name)}
                        className={cn("min-w-9 rounded-md border px-1.5 py-1 text-sm font-medium", active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted")}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>ベース音（スラッシュコード）</span>
                <select value={paletteBass} onChange={(e) => setPaletteBass(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground">
                  <option value="">なし</option>
                  {rootPcs.map((n) => (
                    <option key={n} value={n}>
                      /{n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {PALETTE_GROUPS.map((g) => (
              <div key={g.label} className="flex flex-wrap items-center gap-1.5">
                <span className="w-20 text-xs text-muted-foreground">{g.label}</span>
                {g.qualities.map((q) => {
                  const def = CHORD_QUALITIES.find((d) => d.id === q)!;
                  const symbol = buildChordSymbol(paletteRoot, q, paletteBass || undefined);
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => addChord(q)}
                      title={def.nameJa}
                      aria-label={`${symbol} を追加（${def.nameJa}）`}
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm hover:border-accent hover:bg-accent-soft"
                    >
                      {symbol}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => onChange([])}>
                すべてクリア
              </Button>
              <Chip tone="neutral">クリックしたコードは末尾に追加されます</Chip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
