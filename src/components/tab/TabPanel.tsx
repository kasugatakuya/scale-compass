"use client";

import { useMemo, useState } from "react";
import type { Tuning } from "@/data/tunings";
import type { ParsedChord } from "@/lib/music/chord-parser";
import type { Position } from "@/lib/music/fretboard";
import { progressionToTab, scaleToTab, type TabBar, type TabColumn, type TabDirection, toAsciiTab } from "@/lib/music/tab";
import { tabToSvg } from "@/lib/music/tab-svg";
import { bassChordTonePositions, guitarVoicings } from "@/lib/music/voicings";
import { isBass } from "@/data/tunings";
import { useCopy } from "@/hooks/useCopy";
import { Button, Card, Segmented, Select } from "@/components/ui";

export type TabMode = "clicks" | "scale" | "progression";

export function TabPanel({
  tuning,
  columns,
  onClearColumns,
  onUndoColumn,
  scalePositions,
  scaleTitle,
  chords,
  mode,
  onMode,
}: {
  tuning: Tuning;
  columns: TabColumn[];
  onClearColumns: () => void;
  onUndoColumn: () => void;
  scalePositions: Position[];
  scaleTitle: string;
  chords: ParsedChord[];
  mode: TabMode;
  onMode: (m: TabMode) => void;
}) {
  const [direction, setDirection] = useState<TabDirection>("ascending");
  const [positionIndex, setPositionIndex] = useState(0);
  const [strums, setStrums] = useState(1);
  const [voicingIndex, setVoicingIndex] = useState(0);
  const [copied, copy] = useCopy();

  const bars: TabBar[] = useMemo(() => {
    if (mode === "clicks") {
      const out: TabBar[] = [];
      for (let i = 0; i < columns.length; i += 8) out.push({ columns: columns.slice(i, i + 8) });
      return out.length ? out : [{ columns: [] }];
    }
    if (mode === "scale") {
      const pos = scalePositions[Math.min(positionIndex, scalePositions.length - 1)];
      return pos ? scaleToTab(pos, direction) : [{ columns: [] }];
    }
    const bass = isBass(tuning.instrument);
    return progressionToTab(
      chords.map((chord) => {
        if (bass) return { chord, voicing: null, notes: bassChordTonePositions(chord, tuning).map((t) => ({ string: t.string, fret: t.fret })) };
        const vs = guitarVoicings(chord, tuning);
        return { chord, voicing: vs[Math.min(voicingIndex, Math.max(0, vs.length - 1))] ?? null };
      }),
      strums,
    );
  }, [mode, columns, scalePositions, positionIndex, direction, chords, tuning, strums, voicingIndex]);

  const title = mode === "clicks" ? "指板で選んだ音" : mode === "scale" ? `${scaleTitle}（${direction === "ascending" ? "上行" : direction === "descending" ? "下降" : "上行→下降"}）` : `コード進行 ${chords.map((c) => c.symbol).join(" - ")}`;
  const ascii = useMemo(() => toAsciiTab(bars, tuning), [bars, tuning]);

  const download = (type: "svg" | "png") => {
    const isDark = document.documentElement.classList.contains("dark");
    const svg = tabToSvg(bars, tuning, { title: `Scale Compass — ${title}`, foreground: isDark ? "#ececf1" : "#1f2937", background: isDark ? "#1b1d23" : "#ffffff" });
    const fileBase = `scale-compass-tab-${Date.now()}`;
    if (type === "svg") {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      triggerDownload(URL.createObjectURL(blob), `${fileBase}.svg`);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(URL.createObjectURL(blob), `${fileBase}.png`);
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <Card
      title="タブ譜"
      id="tab"
      actions={
        <>
          <Button size="sm" onClick={() => copy(ascii)} aria-live="polite">
            {copied ? "コピーしました" : "テキストをコピー"}
          </Button>
          <Button size="sm" onClick={() => download("svg")}>
            SVG
          </Button>
          <Button size="sm" onClick={() => download("png")}>
            PNG
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Segmented<TabMode>
            label="内容"
            value={mode}
            onChange={onMode}
            options={[
              { value: "clicks", label: "指板で選んだ音" },
              { value: "scale", label: "スケール上行／下降" },
              { value: "progression", label: "コード進行全体" },
            ]}
          />
          {mode === "clicks" && (
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={onUndoColumn} disabled={columns.length === 0}>
                1 つ戻す
              </Button>
              <Button size="sm" variant="danger" onClick={onClearColumns} disabled={columns.length === 0}>
                クリア
              </Button>
            </div>
          )}
          {mode === "scale" && (
            <>
              <Segmented<TabDirection>
                label="方向"
                value={direction}
                onChange={setDirection}
                options={[
                  { value: "ascending", label: "上行" },
                  { value: "descending", label: "下降" },
                  { value: "both", label: "上行→下降" },
                ]}
              />
              {scalePositions.length > 0 ? (
                <Select label="ポジション" value={Math.min(positionIndex, scalePositions.length - 1)} onChange={(e) => setPositionIndex(Number(e.target.value))}>
                  {scalePositions.map((p, i) => (
                    <option key={p.id} value={i}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="pb-1.5 text-xs text-muted-foreground">スケールを選択するとポジションを選べます。</p>
              )}
            </>
          )}
          {mode === "progression" && (
            <>
              <Select label="1 小節のストローク数" value={strums} onChange={(e) => setStrums(Number(e.target.value))}>
                {[1, 2, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              {!isBass(tuning.instrument) && (
                <Select label="フォーム" value={voicingIndex} onChange={(e) => setVoicingIndex(Number(e.target.value))}>
                  <option value={0}>6弦ルート優先</option>
                  <option value={1}>5弦ルート優先</option>
                  <option value={2}>4弦ルート優先</option>
                </Select>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{title}（{tuning.nameJa}）</p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs leading-snug" aria-label="ASCII タブ譜" tabIndex={0}>
          {ascii}
        </pre>
      </div>
    </Card>
  );
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
