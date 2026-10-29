"use client";

import { useMemo } from "react";
import { isBass, type Tuning } from "@/data/tunings";
import type { ParsedChord } from "@/lib/music/chord-parser";
import { buildMarkers, filterMarkersByPosition, type NoteSpec, type Position, positionsFor } from "@/lib/music/fretboard";
import { mod12, pcToName, semitonesToDegreeLabel } from "@/lib/music/notes";
import type { PitchClass } from "@/lib/music/notes";
import { bassChordTonePositions, guitarVoicings } from "@/lib/music/voicings";
import { ChordDiagram } from "@/components/fretboard/ChordDiagram";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { FretboardControls, type FretboardSettings } from "@/components/fretboard/FretboardControls";
import { FretboardLegend } from "@/components/fretboard/Legend";
import { Card } from "@/components/ui";
import type { TabNote } from "@/lib/music/tab";

export function FretboardPanel({
  tuning,
  settings,
  onSettings,
  specs,
  scalePcs,
  chord,
  title,
  selectedNotes,
  onNoteClick,
  playButton,
  onSelectVoicing,
}: {
  tuning: Tuning;
  settings: FretboardSettings;
  onSettings: (patch: Partial<FretboardSettings>) => void;
  specs: NoteSpec[];
  /** ポジション算出に使うスケール音（ルートから並べたもの） */
  scalePcs: PitchClass[] | null;
  chord: ParsedChord | null;
  title: string;
  selectedNotes: TabNote[];
  onNoteClick: (n: TabNote) => void;
  playButton?: React.ReactNode;
  onSelectVoicing?: (notes: TabNote[], label: string) => void;
}) {
  const range = { min: settings.fretMin, max: settings.fretMax };
  const positions: Position[] = useMemo(() => {
    if (settings.positionSystem === "all" || !scalePcs || scalePcs.length < 5) return [];
    return positionsFor(settings.positionSystem, tuning, scalePcs);
  }, [settings.positionSystem, scalePcs, tuning]);
  const position = positions.length > 0 ? positions[Math.min(settings.positionIndex, positions.length - 1)] : null;

  const markers = useMemo(() => filterMarkersByPosition(buildMarkers(tuning, specs, range), position), [tuning, specs, range.min, range.max, position]); // eslint-disable-line react-hooks/exhaustive-deps

  const bass = isBass(tuning.instrument);
  const voicings = useMemo(() => (chord && !bass ? guitarVoicings(chord, tuning) : []), [chord, tuning, bass]);
  const bassTones = useMemo(() => (chord && bass ? bassChordTonePositions(chord, tuning, 0) : []), [chord, tuning, bass]);

  const degreeOf = (pc: PitchClass) => (chord ? chord.tones.find((t) => mod12(chord.rootPc + t.semitones) === pc)?.label ?? semitonesToDegreeLabel(mod12(pc - chord.rootPc)) : "");
  const nameOf = (pc: PitchClass) => (chord ? chord.noteNames[chord.tones.findIndex((t) => mod12(chord.rootPc + t.semitones) === pc)] ?? pcToName(pc) : pcToName(pc));

  return (
    <Card title={<span>指板ビュー — {title}</span>} actions={playButton} id="fretboard">
      <div className="flex flex-col gap-3">
        <FretboardControls settings={settings} onChange={onSettings} tuning={tuning} positions={positions} />
        {settings.positionSystem !== "all" && positions.length === 0 && (
          <p className="text-xs text-muted-foreground">ポジション表示はスケールを選択しているときに使えます。</p>
        )}
        <Fretboard
          tuning={tuning}
          markers={markers}
          range={range}
          labelMode={settings.labelMode}
          lefty={settings.lefty}
          position={position}
          selected={selectedNotes}
          onNoteClick={onNoteClick}
          ariaLabel={`${title} の指板表示（${tuning.nameJa}）`}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FretboardLegend />
          <p className="text-xs text-muted-foreground">指板の音をクリックするとタブ譜に追加されます。</p>
        </div>

        {chord && (
          <div className="border-t border-border pt-3">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{bass ? `${chord.symbol} のコードトーンの位置（アルペジオ用）` : `${chord.symbol} の押さえ方`}</h3>
            {bass ? (
              <div className="flex flex-col gap-2">
                <Fretboard
                  tuning={tuning}
                  markers={buildMarkers(
                    tuning,
                    bassTones.map((t) => ({ pc: t.pc, name: nameOf(t.pc), degree: t.degree, kind: t.degree === "R" ? ("root" as const) : ("chord-tone" as const) })),
                    { min: Math.max(0, Math.min(...bassTones.map((t) => t.fret)) - 1), max: Math.max(...bassTones.map((t) => t.fret)) + 1 },
                  ).filter((m) => bassTones.some((t) => t.string === m.string && t.fret === m.fret))}
                  range={{ min: Math.max(0, Math.min(...bassTones.map((t) => t.fret)) - 1), max: Math.max(...bassTones.map((t) => t.fret)) + 1 }}
                  labelMode={settings.labelMode === "dot" ? "degree" : settings.labelMode}
                  lefty={settings.lefty}
                  clickEmpty={false}
                  onNoteClick={onNoteClick}
                  ariaLabel={`${chord.symbol} のコードトーン配置`}
                />
                {onSelectVoicing && (
                  <button
                    type="button"
                    className="self-start rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                    onClick={() => onSelectVoicing(bassTones.map((t) => ({ string: t.string, fret: t.fret })), chord.symbol)}
                  >
                    このアルペジオをタブに追加
                  </button>
                )}
              </div>
            ) : voicings.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {voicings.map((v, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <ChordDiagram voicing={v} tuning={tuning} rootPc={chord.rootPc} degreeOf={degreeOf} nameOf={nameOf} labelMode={settings.labelMode} lefty={settings.lefty} title={chord.symbol} />
                    {onSelectVoicing && (
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-muted"
                        onClick={() =>
                          onSelectVoicing(
                            v.frets.flatMap((f, s) => (f === null ? [] : [{ string: s, fret: f }])),
                            chord.symbol,
                          )
                        }
                      >
                        タブに追加
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">このチューニングでは代表フォームを表示できません。</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
