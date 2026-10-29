"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customTuning, DEFAULT_TUNING_ID, TUNING_BY_ID, type Tuning } from "@/data/tunings";
import { useUrlState } from "@/hooks/useUrlState";
import { analyzeProgression } from "@/lib/music/analysis";
import { parseChord, type ParseResult } from "@/lib/music/chord-parser";
import { positionsFor } from "@/lib/music/fretboard";
import { makeKey } from "@/lib/music/key";
import { specsForChord, specsForKeyScale, specsForSuggestion } from "@/lib/music/markers";
import { mod12 } from "@/lib/music/notes";
import { keyScaleSuggestions, type KeyScaleSuggestion, type ScaleSuggestion, suggestScales } from "@/lib/music/scale-rules";
import { scalePcs } from "@/lib/music/scales";
import type { TabColumn, TabNote } from "@/lib/music/tab";
import type { FretboardSettings } from "@/components/fretboard/FretboardControls";
import { Card, Button } from "@/components/ui";
import { useCopy } from "@/hooks/useCopy";
import { KeySelector } from "./KeySelector";
import { ProgressionInput } from "./ProgressionInput";
import { ChordCard } from "./ChordCard";
import { KeyScalePanel } from "./KeyScalePanel";
import { FretboardPanel } from "./FretboardPanel";
import { TabPanel, type TabMode } from "@/components/tab/TabPanel";
import { PlayButton } from "@/components/audio/PlayButton";

export function ScaleTool() {
  const [state, update] = useUrlState();
  const [tabColumns, setTabColumns] = useState<TabColumn[]>([]);
  const [tabMode, setTabMode] = useState<TabMode>("clicks");
  const [copiedUrl, copyUrl] = useCopy();

  const key = useMemo(() => makeKey(state.tonic, state.mode), [state.tonic, state.mode]);
  const results: ParseResult[] = useMemo(() => state.chords.map(parseChord), [state.chords]);
  const chords = useMemo(() => results.flatMap((r) => (r.ok ? [r.chord] : [])), [results]);
  // 入力インデックス → 有効コードのインデックス
  const validIndexOf = useMemo(() => {
    const map: number[] = [];
    let j = 0;
    for (const r of results) map.push(r.ok ? j++ : -1);
    return map;
  }, [results]);

  const analyses = useMemo(() => analyzeProgression(chords, key), [chords, key]);
  const suggestionsByChord = useMemo(() => analyses.map((a) => suggestScales(a, key)), [analyses, key]);
  const keySuggestions = useMemo(() => keyScaleSuggestions(key), [key]);

  const tuning: Tuning = useMemo(() => {
    if (state.tuningId === "custom" && state.customStrings) return customTuning(state.instrument, state.customStrings);
    return TUNING_BY_ID[state.tuningId] ?? TUNING_BY_ID[DEFAULT_TUNING_ID[state.instrument]];
  }, [state.tuningId, state.customStrings, state.instrument]);

  // 選択中（入力インデックス）→ 解析
  const selectedValid = state.selected >= 0 ? validIndexOf[state.selected] ?? -1 : -1;
  const isKeyView = state.selected === -1;
  const analysis = selectedValid >= 0 ? analyses[selectedValid] : null;
  const suggestions = useMemo(() => (selectedValid >= 0 ? suggestionsByChord[selectedValid] : []), [selectedValid, suggestionsByChord]);

  const selectedSuggestion: ScaleSuggestion | null = useMemo(() => {
    if (!analysis) return null;
    return suggestions.find((s) => s.id === state.scale) ?? suggestions[0] ?? null;
  }, [analysis, suggestions, state.scale]);
  const selectedKeySuggestion: KeyScaleSuggestion | null = useMemo(() => {
    if (!isKeyView) return null;
    return keySuggestions.find((s) => `${s.scale.id}@${s.rootPc}` === state.scale) ?? keySuggestions[0];
  }, [isKeyView, keySuggestions, state.scale]);

  // 選択コードが消えた場合の補正
  useEffect(() => {
    if (state.selected >= results.length && results.length > 0) update({ selected: results.length - 1 });
  }, [state.selected, results.length, update]);

  const specs = useMemo(() => {
    if (isKeyView && selectedKeySuggestion) return specsForKeyScale(selectedKeySuggestion, key);
    if (analysis && selectedSuggestion) return specsForSuggestion(selectedSuggestion, analysis.chord);
    if (analysis) return specsForChord(analysis.chord);
    return [];
  }, [isKeyView, selectedKeySuggestion, key, analysis, selectedSuggestion]);

  const currentScalePcs = useMemo(() => {
    if (isKeyView && selectedKeySuggestion) return scalePcs(selectedKeySuggestion.scale, selectedKeySuggestion.rootPc);
    if (selectedSuggestion) return scalePcs(selectedSuggestion.scale, selectedSuggestion.rootPc);
    return null;
  }, [isKeyView, selectedKeySuggestion, selectedSuggestion]);

  const scaleTitle = isKeyView && selectedKeySuggestion
    ? `${selectedKeySuggestion.root} ${selectedKeySuggestion.scale.nameJa}`
    : analysis && selectedSuggestion
      ? `${analysis.chord.symbol} × ${selectedSuggestion.root} ${selectedSuggestion.scale.nameJa}`
      : analysis
        ? analysis.chord.symbol
        : "コードを入力してください";

  const scalePositionsForTab = useMemo(() => {
    if (!currentScalePcs) return [];
    const system = state.positionSystem === "all" ? "box" : state.positionSystem;
    return positionsFor(system, tuning, currentScalePcs);
  }, [currentScalePcs, state.positionSystem, tuning]);

  const fbSettings: FretboardSettings = {
    instrument: state.instrument,
    tuningId: state.tuningId,
    customStrings: state.customStrings,
    lefty: state.lefty,
    labelMode: state.labelMode,
    fretMin: state.fretMin,
    fretMax: state.fretMax,
    positionSystem: state.positionSystem,
    positionIndex: state.positionIndex,
  };

  const onNoteClick = useCallback((n: TabNote) => {
    setTabColumns((cols) => [...cols, { notes: [n] }]);
    setTabMode("clicks");
  }, []);
  const onSelectVoicing = useCallback((notes: TabNote[], label: string) => {
    setTabColumns((cols) => [...cols, { notes, label }]);
    setTabMode("clicks");
  }, []);

  const selectedNotes = useMemo(() => (tabMode === "clicks" ? tabColumns.flatMap((c) => c.notes) : []), [tabColumns, tabMode]);

  // 試聴用: スケール音（MIDI）
  const playScaleMidis = useMemo(() => {
    if (!currentScalePcs) return null;
    const rootPc = isKeyView && selectedKeySuggestion ? selectedKeySuggestion.rootPc : selectedSuggestion?.rootPc ?? 0;
    const base = 48 + mod12(rootPc); // C3 付近から
    const sorted = currentScalePcs.map((pc) => base + mod12(pc - rootPc));
    return [...sorted, base + 12];
  }, [currentScalePcs, isKeyView, selectedKeySuggestion, selectedSuggestion]);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="tool-heading" className="flex flex-col gap-1">
        <h1 id="tool-heading" className="text-xl font-bold tracking-tight sm:text-2xl">
          コード進行から「使えるスケール」を提案
        </h1>
        <p className="text-sm text-muted-foreground">
          キーとコード進行を入力すると、各コードのローマ数字・機能と、おすすめスケールを理由つきで表示します。スケールを選ぶとギター／ベースの指板に反映され、タブ譜にも書き出せます。
        </p>
      </section>

      <Card
        title="1. キーとコード進行"
        actions={
          <Button size="sm" onClick={() => copyUrl(window.location.href)}>
            {copiedUrl ? "URL をコピーしました" : "この設定の URL をコピー"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <KeySelector tonic={state.tonic} mode={state.mode} onChange={(tonic, mode) => update({ tonic, mode, scale: null })} />
          <ProgressionInput
            chords={state.chords}
            results={results}
            selected={state.selected}
            key={key.tonic + key.mode}
            keyObj={key}
            onChange={(chords) => update({ chords, scale: null })}
            onSelect={(i) => update({ selected: i, scale: null })}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <h2 className="text-sm font-semibold text-muted-foreground">2. コードごとの解析とおすすめスケール</h2>
          <KeyScalePanel
            keyObj={key}
            suggestions={keySuggestions}
            active={isKeyView}
            selectedScaleId={selectedKeySuggestion ? `${selectedKeySuggestion.scale.id}@${selectedKeySuggestion.rootPc}` : null}
            onSelect={(s) => update({ selected: -1, scale: `${s.scale.id}@${s.rootPc}` })}
          />
          {analyses.map((a, i) => {
            const inputIndex = validIndexOf.indexOf(i);
            return (
              <ChordCard
                key={`${i}-${a.chord.symbol}`}
                analysis={a}
                suggestions={suggestionsByChord[i]}
                active={selectedValid === i}
                selectedScaleId={selectedSuggestion?.id ?? null}
                onActivate={() => update({ selected: inputIndex, scale: null })}
                onSelectScale={(s) => update({ selected: inputIndex, scale: s.id })}
                playButton={<PlayButton kind="chord" midis={chordMidis(a.chord.rootPc, a.chord.tones.map((t) => t.semitones), a.chord.bassPc)} label={`${a.chord.symbol} を試聴`} />}
              />
            );
          })}
          {analyses.length === 0 && (
            <Card>
              <p className="text-sm text-muted-foreground">コードが入力されていません。上の入力欄かパレットから追加してください。</p>
            </Card>
          )}
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-16 lg:self-start">
          <h2 className="text-sm font-semibold text-muted-foreground">3. 指板とタブ譜（スマホでは先に表示。下のコードカードでスケールを選ぶと更新されます）</h2>
          <FretboardPanel
            tuning={tuning}
            settings={fbSettings}
            onSettings={(patch) => update(patch)}
            specs={specs}
            scalePcs={currentScalePcs}
            chord={analysis?.chord ?? null}
            title={scaleTitle}
            selectedNotes={selectedNotes}
            onNoteClick={onNoteClick}
            onSelectVoicing={onSelectVoicing}
            playButton={playScaleMidis ? <PlayButton kind="scale" midis={playScaleMidis} label="スケールを試聴" /> : undefined}
          />
          <TabPanel
            tuning={tuning}
            columns={tabColumns}
            onClearColumns={() => setTabColumns([])}
            onUndoColumn={() => setTabColumns((c) => c.slice(0, -1))}
            scalePositions={scalePositionsForTab}
            scaleTitle={scaleTitle}
            chords={chords}
            mode={tabMode}
            onMode={setTabMode}
          />
        </div>
      </div>
    </div>
  );
}

/** コードを鳴らすための MIDI 列（ルートを C3〜B3 付近に置く） */
function chordMidis(rootPc: number, semitones: number[], bassPc?: number): number[] {
  const root = 48 + mod12(rootPc);
  const notes = semitones.map((s) => root + s);
  if (bassPc !== undefined) notes.unshift(36 + mod12(bassPc));
  return notes;
}
