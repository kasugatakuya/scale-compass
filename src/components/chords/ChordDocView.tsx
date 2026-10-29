"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type ChordDoc, DOC_BY_SLUG, DOC_GROUP_LABEL } from "@/data/chord-docs";
import { TUNING_BY_ID, type Tuning } from "@/data/tunings";
import { analyzeProgression } from "@/lib/music/analysis";
import { parseChord } from "@/lib/music/chord-parser";
import { buildMarkers } from "@/lib/music/fretboard";
import { makeKey } from "@/lib/music/key";
import { specsForChord, specsForSuggestion } from "@/lib/music/markers";
import { mod12, pcToName, semitonesToDegreeLabel } from "@/lib/music/notes";
import { buildSuggestion, suggestScales } from "@/lib/music/scale-rules";
import { SCALE_BY_ID } from "@/lib/music/scales";
import { progressionToTab, toAsciiTab } from "@/lib/music/tab";
import { bassChordTonePositions, guitarVoicings } from "@/lib/music/voicings";
import { toolHref } from "@/lib/url-state";
import { useCopy } from "@/hooks/useCopy";
import { ChordDiagram } from "@/components/fretboard/ChordDiagram";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { FretboardLegend } from "@/components/fretboard/Legend";
import { PlayButton } from "@/components/audio/PlayButton";
import { Button, Card, Chip, Segmented, cn } from "@/components/ui";

export function ChordDocView({ doc }: { doc: ChordDoc }) {
  const [instrument, setInstrument] = useState<"guitar" | "bass">("guitar");
  const [scaleIndex, setScaleIndex] = useState<number>(-1);
  const [copied, copy] = useCopy();
  const tuning: Tuning = TUNING_BY_ID[instrument === "guitar" ? "guitar-standard" : "bass4-standard"];

  const parsed = parseChord(doc.exampleChord);
  const chord = parsed.ok ? parsed.chord : null;
  const key = makeKey(doc.exampleProgression?.key.tonic ?? "C", doc.exampleProgression?.key.mode ?? "major");

  const analysis = useMemo(() => (chord ? analyzeProgression([chord], key)[0] : null), [chord, key]);
  const scaleSuggestion = useMemo(() => {
    if (!analysis || !chord || scaleIndex < 0) return null;
    const id = doc.scales[scaleIndex];
    const auto = suggestScales(analysis, key).find((s) => s.scale.id === id && s.rootPc === chord.rootPc);
    return auto ?? buildSuggestion(id, chord.root, chord.rootPc, analysis, 2, "", "doc");
  }, [analysis, chord, scaleIndex, doc.scales, key]);

  const specs = useMemo(() => {
    if (!chord) return [];
    if (scaleSuggestion) return specsForSuggestion(scaleSuggestion, chord);
    return specsForChord(chord);
  }, [chord, scaleSuggestion]);
  const markers = useMemo(() => buildMarkers(tuning, specs, { min: 0, max: 12 }), [tuning, specs]);

  const voicings = useMemo(() => (chord && instrument === "guitar" ? guitarVoicings(chord, tuning) : []), [chord, tuning, instrument]);
  const bassTones = useMemo(() => (chord && instrument === "bass" ? bassChordTonePositions(chord, tuning) : []), [chord, tuning, instrument]);
  const ascii = useMemo(() => {
    if (!chord) return "";
    const bars = instrument === "guitar"
      ? progressionToTab(voicings.map((v) => ({ chord, voicing: v })))
      : progressionToTab([{ chord, voicing: null, notes: bassTones.map((t) => ({ string: t.string, fret: t.fret })) }]);
    return toAsciiTab(bars, tuning);
  }, [chord, instrument, voicings, bassTones, tuning]);

  const progressionAnalysis = useMemo(() => {
    if (!doc.exampleProgression) return null;
    const chords = doc.exampleProgression.chords.map(parseChord).flatMap((r) => (r.ok ? [r.chord] : []));
    return analyzeProgression(chords, makeKey(doc.exampleProgression.key.tonic, doc.exampleProgression.key.mode));
  }, [doc.exampleProgression]);

  const degreeOf = (pc: number) => (chord ? chord.tones.find((t) => mod12(chord.rootPc + t.semitones) === pc)?.label ?? semitonesToDegreeLabel(mod12(pc - chord.rootPc)) : "");
  const nameOf = (pc: number) => (chord ? chord.noteNames[chord.tones.findIndex((t) => mod12(chord.rootPc + t.semitones) === pc)] ?? pcToName(pc) : pcToName(pc));
  const chordMidis = chord ? [...(chord.bassPc !== undefined ? [36 + mod12(chord.bassPc)] : []), ...chord.tones.map((t) => 48 + mod12(chord.rootPc) + t.semitones)] : [];

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="パンくず" className="text-xs text-muted-foreground">
        <Link href="/chords" className="hover:underline">
          コード解説
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{DOC_GROUP_LABEL[doc.group]}</span>
      </nav>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
        {doc.subtitle && <p className="font-mono text-sm text-muted-foreground">{doc.subtitle}</p>}
        <div className="flex flex-wrap gap-1.5">
          {doc.formula.map((f) => (
            <Chip key={f} tone="chord">
              {f}
            </Chip>
          ))}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="響きの特徴">
          <p className="text-sm leading-relaxed">{doc.sound}</p>
        </Card>
        <Card title="使われる場面">
          <p className="text-sm leading-relaxed">{doc.usage}</p>
        </Card>
      </div>

      <Card title="解説">
        <div className="flex flex-col gap-3">
          {doc.body.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </Card>

      {chord && (
        <Card
          title={`${chord.symbol} を例にした指板上の位置`}
          actions={
            <>
              <PlayButton kind="chord" midis={chordMidis} label={`${chord.symbol} を試聴`} />
              <Link href={toolHref(key.tonic, key.mode, doc.exampleProgression?.chords ?? [chord.symbol])} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">
                スケール提案ツールで開く
              </Link>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <Segmented<"guitar" | "bass">
                label="楽器"
                value={instrument}
                onChange={setInstrument}
                options={[
                  { value: "guitar", label: "ギター" },
                  { value: "bass", label: "ベース" },
                ]}
              />
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span id="doc-scale-label">相性のよいスケール（クリックで指板に重ねる）</span>
                <div role="radiogroup" aria-labelledby="doc-scale-label" className="flex flex-wrap gap-1">
                  <button type="button" role="radio" aria-checked={scaleIndex === -1} onClick={() => setScaleIndex(-1)} className={cn("rounded-md border px-2 py-1 text-xs", scaleIndex === -1 ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted")}>
                    コードトーンのみ
                  </button>
                  {doc.scales.map((id, i) => (
                    <button key={id} type="button" role="radio" aria-checked={scaleIndex === i} onClick={() => setScaleIndex(i)} className={cn("rounded-md border px-2 py-1 text-xs", scaleIndex === i ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted")}>
                      {chord.root} {SCALE_BY_ID[id].nameJa}
                    </button>
                  ))}
                </div>
              </div>
              {scaleSuggestion && (
                <PlayButton kind="scale" midis={[...scaleSuggestion.notes.map((n) => 48 + mod12(chord.rootPc) + mod12(n.pc - chord.rootPc)), 60 + mod12(chord.rootPc)]} label="スケールを試聴" />
              )}
            </div>
            {scaleSuggestion && <p className="text-xs text-muted-foreground">{SCALE_BY_ID[scaleSuggestion.scale.id].descriptionJa}</p>}
            <Fretboard tuning={tuning} markers={markers} range={{ min: 0, max: 12 }} labelMode="degree" ariaLabel={`${chord.symbol} の指板表示`} />
            <FretboardLegend showAvoid={Boolean(scaleSuggestion)} />
            <div className="border-t border-border pt-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{instrument === "guitar" ? "押さえ方の例" : "コードトーンの配置（アルペジオ）"}</h3>
              {instrument === "guitar" ? (
                <div className="flex flex-wrap gap-4">
                  {voicings.map((v, i) => (
                    <ChordDiagram key={i} voicing={v} tuning={tuning} rootPc={chord.rootPc} degreeOf={degreeOf} nameOf={nameOf} title={chord.symbol} />
                  ))}
                </div>
              ) : (
                <Fretboard
                  tuning={tuning}
                  markers={buildMarkers(tuning, bassTones.map((t) => ({ pc: t.pc, name: nameOf(t.pc), degree: t.degree, kind: t.degree === "R" ? ("root" as const) : ("chord-tone" as const) })), { min: Math.max(0, Math.min(...bassTones.map((t) => t.fret)) - 1), max: Math.max(...bassTones.map((t) => t.fret)) + 1 }).filter((m) => bassTones.some((t) => t.string === m.string && t.fret === m.fret))}
                  range={{ min: Math.max(0, Math.min(...bassTones.map((t) => t.fret)) - 1), max: Math.max(...bassTones.map((t) => t.fret)) + 1 }}
                  labelMode="degree"
                  ariaLabel={`${chord.symbol} のベース用コードトーン配置`}
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground">タブ譜</h3>
                <Button size="sm" onClick={() => copy(ascii)}>
                  {copied ? "コピーしました" : "コピー"}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs leading-snug" tabIndex={0}>
                {ascii}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {doc.exampleProgression && progressionAnalysis && (
        <Card title="進行の例">
          <p className="mb-2 text-xs text-muted-foreground">
            {doc.exampleProgression.caption}（キー {key.tonic} {key.mode === "major" ? "メジャー" : "マイナー"}）
          </p>
          <ol className="flex flex-wrap gap-2">
            {progressionAnalysis.map((a, i) => (
              <li key={i} className="flex flex-col items-center rounded-md border border-border px-3 py-1.5">
                <span className="font-semibold">{a.chord.symbol}</span>
                <span className="text-xs text-accent">{a.roman}</span>
              </li>
            ))}
          </ol>
          <Link href={toolHref(key.tonic, key.mode, doc.exampleProgression.chords)} className="mt-3 inline-flex rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90">
            この進行をスケール提案ツールで開く
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="ギターでの弾き方のコツ">
          <p className="text-sm leading-relaxed">{doc.tips.guitar}</p>
        </Card>
        <Card title="ベースでの弾き方のコツ">
          <p className="text-sm leading-relaxed">{doc.tips.bass}</p>
        </Card>
      </div>

      <Card title="相性のよいスケール">
        <ul className="flex flex-col gap-2">
          {doc.scales.map((id) => (
            <li key={id} className="text-sm">
              <span className="font-semibold">{SCALE_BY_ID[id].nameJa}</span>
              <span className="ml-1 text-xs text-muted-foreground">({SCALE_BY_ID[id].nameEn})</span>
              <p className="text-xs text-muted-foreground">{SCALE_BY_ID[id].descriptionJa}</p>
            </li>
          ))}
        </ul>
      </Card>

      {doc.glossary && (
        <Card title="用語解説">
          <dl className="grid gap-2 sm:grid-cols-2">
            {doc.glossary.map((g) => (
              <div key={g.term} className="rounded-md bg-muted p-2">
                <dt className="text-sm font-semibold">{g.term}</dt>
                <dd className="text-xs leading-relaxed text-muted-foreground">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {doc.related && (
        <nav aria-label="関連する解説" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">関連:</span>
          {doc.related.filter((r) => DOC_BY_SLUG[r]).map((r) => (
            <Link key={r} href={`/chords/${r}`} className="rounded-md border border-border px-2.5 py-1 hover:bg-muted">
              {DOC_BY_SLUG[r].title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
