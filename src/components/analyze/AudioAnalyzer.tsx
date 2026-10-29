"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeAudioFile } from "@/lib/audio-decode";
import { analyzeAudio, type AudioAnalysisResult, type ChordSegment, type KeyEstimate, scaleFits } from "@/lib/music/audio-analysis";
import { analyzeProgression } from "@/lib/music/analysis";
import { parseChord } from "@/lib/music/chord-parser";
import { keyScalePcs, makeKey } from "@/lib/music/key";
import { pcToName, preferredAccidentalForKey } from "@/lib/music/notes";
import { toolHref } from "@/lib/url-state";
import { useCopy } from "@/hooks/useCopy";
import { ProgressionPlayButton } from "@/components/audio/ProgressionPlayButton";
import { Button, Card, Chip, cn } from "@/components/ui";

type Phase = { kind: "idle" } | { kind: "decoding" } | { kind: "analyzing"; stage: string; ratio: number } | { kind: "done" } | { kind: "error"; message: string };

interface EditableSegment extends ChordSegment {
  id: number;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function AudioAnalyzer() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [fileName, setFileName] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [segments, setSegments] = useState<EditableSegment[]>([]);
  const [keyChoice, setKeyChoice] = useState<KeyEstimate | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, copy] = useCopy();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const run = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|ogg|flac|aiff?)$/i.test(file.name)) {
      setPhase({ kind: "error", message: "音声ファイル（mp3 / wav / m4a / ogg など）を選んでください。" });
      return;
    }
    setFileName(file.name);
    setResult(null);
    setSegments([]);
    setKeyChoice(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    try {
      setPhase({ kind: "decoding" });
      const decoded = await decodeAudioFile(file);
      if (decoded.duration > 15 * 60) {
        setPhase({ kind: "error", message: "15 分を超える音源は対応していません。区間を切り出してから試してください。" });
        return;
      }
      setPhase({ kind: "analyzing", stage: "開始", ratio: 0 });
      const res = await analyzeAudio(
        decoded.samples,
        decoded.sampleRate,
        (stage, ratio) => setPhase({ kind: "analyzing", stage, ratio }),
        () => new Promise((r) => setTimeout(r, 0)),
      );
      setResult(res);
      setKeyChoice(res.key);
      setSegments(res.segments.map((s, i) => ({ ...s, id: i })));
      setPhase({ kind: "done" });
    } catch (e) {
      setPhase({ kind: "error", message: `解析に失敗しました: ${e instanceof Error ? e.message : String(e)}` });
    }
  }, []);

  const key = useMemo(() => (keyChoice ? makeKey(keyChoice.tonic, keyChoice.mode) : null), [keyChoice]);
  const fits = useMemo(() => (result && key ? scaleFits(result.toneDistribution, key.tonicPc).slice(0, 5) : []), [result, key]);

  /** 連続する同じコードをまとめ、無音を除いた進行 */
  const progression = useMemo(() => {
    const out: string[] = [];
    for (const s of segments) {
      if (s.symbol === "N" || !s.symbol.trim()) continue;
      if (out[out.length - 1] !== s.symbol) out.push(s.symbol);
    }
    return out;
  }, [segments]);
  const progressionAnalysis = useMemo(() => {
    if (!key) return [];
    const parsed = progression.map(parseChord).flatMap((r) => (r.ok ? [r.chord] : []));
    return analyzeProgression(parsed, key);
  }, [progression, key]);

  const currentIndex = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end);

  const updateSegment = (id: number, symbol: string) => setSegments((segs) => segs.map((s) => (s.id === id ? { ...s, symbol } : s)));
  const deleteSegment = (id: number) => setSegments((segs) => segs.filter((s) => s.id !== id));
  const mergeWithPrevious = (id: number) =>
    setSegments((segs) => {
      const i = segs.findIndex((s) => s.id === id);
      if (i <= 0) return segs;
      const prev = segs[i - 1];
      const cur = segs[i];
      const merged = { ...prev, end: cur.end, confidence: (prev.confidence + cur.confidence) / 2 };
      return [...segs.slice(0, i - 1), merged, ...segs.slice(i + 1)];
    });

  const seek = (t: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      void audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 入力 */}
      <Card title="1. 音源ファイルを選ぶ">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void run(f);
          }}
          className={cn("flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors", dragOver ? "border-accent bg-accent-soft" : "border-border")}
        >
          <p className="text-sm">ここに音声ファイルをドラッグ＆ドロップ、または</p>
          <Button variant="primary" onClick={() => inputRef.current?.click()}>
            ファイルを選択
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
            className="sr-only"
            aria-label="音声ファイル"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void run(f);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">
            mp3 / wav / m4a / ogg などに対応。処理はすべてこのブラウザ内で行われ、ファイルはどこにも送信されません。
          </p>
        </div>
        {fileName && (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">ファイル: </span>
            {fileName}
          </p>
        )}
        {phase.kind === "decoding" && <p className="mt-2 text-sm text-muted-foreground">デコード中…</p>}
        {phase.kind === "analyzing" && (
          <div className="mt-3 flex flex-col gap-1" role="status" aria-live="polite">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{phase.stage}</span>
              <span>{Math.round(phase.ratio * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${phase.ratio * 100}%` }} />
            </div>
          </div>
        )}
        {phase.kind === "error" && (
          <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {phase.message}
          </p>
        )}
      </Card>

      {result && key && keyChoice && (
        <>
          {/* 再生 */}
          {audioUrl && (
            <Card title="再生（コードの切り替わりを追いながら聴けます）">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                aria-label="アップロードした音源の再生"
              />
              <div className="mt-3 flex h-8 w-full overflow-hidden rounded-md border border-border" role="list" aria-label="コードのタイムライン">
                {segments.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="listitem"
                    title={`${fmtTime(s.start)} ${s.symbol === "N" ? "（無音）" : s.symbol}`}
                    onClick={() => seek(s.start)}
                    style={{ width: `${((s.end - s.start) / result.duration) * 100}%`, opacity: s.symbol === "N" ? 0.25 : 0.45 + s.confidence * 0.55 }}
                    className={cn("h-full border-r border-background text-[10px] leading-8 overflow-hidden whitespace-nowrap", i === currentIndex ? "bg-fb-root text-white" : "bg-accent text-accent-foreground")}
                  >
                    {s.end - s.start > result.duration / 40 ? (s.symbol === "N" ? "" : s.symbol) : ""}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">いま鳴っているコード: </span>
                <span className="font-semibold">{currentIndex >= 0 ? (segments[currentIndex].symbol === "N" ? "（無音）" : segments[currentIndex].symbol) : "—"}</span>
              </p>
            </Card>
          )}

          {/* キー・テンポ・音の分布 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="2. 推定キー">
              <div className="flex flex-col gap-2">
                <p className="text-2xl font-bold">
                  {keyChoice.tonic} {keyChoice.mode === "major" ? "メジャー" : "マイナー"}
                </p>
                <p className="text-xs text-muted-foreground">ほかの候補（クリックで切り替え。ローマ数字とツールへの引き継ぎに反映されます）</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keys.slice(0, 5).map((k) => {
                    const active = k.tonicPc === keyChoice.tonicPc && k.mode === keyChoice.mode;
                    return (
                      <button
                        key={`${k.tonicPc}-${k.mode}`}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setKeyChoice(k)}
                        className={cn("rounded-md border px-2 py-1 text-xs", active ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-muted")}
                      >
                        {k.tonic} {k.mode === "major" ? "メジャー" : "マイナー"} <span className="opacity-70">({(k.score * 100).toFixed(0)})</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">テンポ: </span>
                  約 {Math.round(result.tempo.bpm)} BPM
                  <span className="text-xs text-muted-foreground">（信頼度 {Math.round(result.tempo.confidence * 100)}%。倍・半分の値になることがあります）</span>
                </p>
              </div>
            </Card>
            <Card title="使われている音の分布と合うスケール">
              <div className="flex items-end gap-1" role="img" aria-label="12 音の分布（濃い色はキーのスケール音）">
                {Array.from(result.toneDistribution).map((v, pc) => {
                  const max = Math.max(...Array.from(result.toneDistribution), 1e-6);
                  const inKey = keyScalePcs(key).includes(pc);
                  return (
                    <div key={pc} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-20 w-full items-end rounded-sm bg-muted">
                        <div className={cn("w-full rounded-sm", inKey ? "bg-accent" : "bg-fb-scale")} style={{ height: `${(v / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pcToName(pc, preferredAccidentalForKey(key.tonicPc, key.mode))}</span>
                    </div>
                  );
                })}
              </div>
              <ol className="mt-3 flex flex-col gap-1 text-sm">
                {fits.map((f, i) => (
                  <li key={f.scale.id} className="flex items-center gap-2">
                    <Chip tone={i === 0 ? "p1" : "p3"}>{i + 1}</Chip>
                    <span className="font-medium">
                      {key.tonic} {f.scale.nameJa}
                    </span>
                    <span className="text-xs text-muted-foreground">音の {Math.round(f.coverage * 100)}% を含む</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* コード進行 */}
          <Card
            title="3. 推定したコード進行（編集できます）"
            actions={
              <>
                <ProgressionPlayButton chords={progression} className="py-1 text-xs" />
                <Button size="sm" onClick={() => copy(progression.join(" | "))}>
                  {copied ? "コピーしました" : "進行をコピー"}
                </Button>
                <Link href={toolHref(key.tonic, key.mode, progression)} className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90">
                  スケール提案ツールで開く
                </Link>
              </>
            }
          >
            <p className="mb-3 text-xs text-muted-foreground">
              推定はあくまで「たたき台」です。濃い色ほど確信度が高く、薄いものは間違っている可能性があります。コード名を直接書き換えたり、不要な区間を削除・結合してください（対応: メジャー／マイナー／7／maj7／m7。それ以外のコードは手で入力できます）。
            </p>
            <ol className="flex flex-wrap gap-1.5" aria-label="まとめたコード進行">
              {progressionAnalysis.map((a, i) => (
                <li key={i} className="flex flex-col items-center rounded-md border border-border px-2 py-1">
                  <span className="text-sm font-semibold">{a.chord.symbol}</span>
                  <span className="text-[11px] text-accent">{a.roman}</span>
                </li>
              ))}
              {progressionAnalysis.length === 0 && <li className="text-sm text-muted-foreground">コードが検出されませんでした。</li>}
            </ol>
            <div className="mt-4 max-h-96 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">開始</th>
                    <th className="px-2 py-1.5 text-left font-medium">長さ</th>
                    <th className="px-2 py-1.5 text-left font-medium">コード</th>
                    <th className="px-2 py-1.5 text-left font-medium">確信度</th>
                    <th className="px-2 py-1.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s, i) => {
                    const parsed = s.symbol === "N" ? null : parseChord(s.symbol);
                    const invalid = parsed !== null && !parsed.ok;
                    return (
                      <tr key={s.id} className={cn("border-t border-border", i === currentIndex && "bg-accent-soft")}>
                        <td className="px-2 py-1 font-mono text-xs">
                          <button type="button" onClick={() => seek(s.start)} className="hover:underline" aria-label={`${fmtTime(s.start)} から再生`}>
                            {fmtTime(s.start)}
                          </button>
                        </td>
                        <td className="px-2 py-1 font-mono text-xs text-muted-foreground">{(s.end - s.start).toFixed(1)}s</td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={s.symbol === "N" ? "" : s.symbol}
                            placeholder="（無音）"
                            onChange={(e) => updateSegment(s.id, e.target.value.trim() || "N")}
                            aria-label={`${fmtTime(s.start)} のコード`}
                            className={cn("w-24 rounded border bg-card px-1.5 py-0.5 font-mono text-sm", invalid ? "border-danger text-danger" : "border-border")}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted" title={`${Math.round(s.confidence * 100)}%`}>
                            <div className="h-full bg-accent" style={{ width: `${s.confidence * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button type="button" onClick={() => mergeWithPrevious(s.id)} disabled={i === 0} className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40" aria-label="前の区間と結合">
                            ↑結合
                          </button>
                          <button type="button" onClick={() => deleteSegment(s.id)} className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-danger-soft hover:text-danger" aria-label="この区間を削除">
                            削除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
