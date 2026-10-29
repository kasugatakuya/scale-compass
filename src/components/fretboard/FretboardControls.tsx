"use client";

import { INSTRUMENT_LABEL_JA, type Instrument, TUNINGS, type Tuning } from "@/data/tunings";
import type { Position, PositionSystem } from "@/lib/music/fretboard";
import { midiToNoteName, noteNameToMidi } from "@/lib/music/notes";
import type { LabelMode } from "@/lib/url-state";
import { Button, Segmented, Select, Toggle } from "@/components/ui";

export interface FretboardSettings {
  instrument: Instrument;
  tuningId: string;
  customStrings: number[] | null;
  lefty: boolean;
  labelMode: LabelMode;
  fretMin: number;
  fretMax: number;
  positionSystem: PositionSystem | "all";
  positionIndex: number;
}

const NOTE_CHOICES = Array.from({ length: 12 }, (_, i) => i);
const OCTAVES = [0, 1, 2, 3, 4, 5];

export function FretboardControls({
  settings,
  onChange,
  tuning,
  positions,
  compact = false,
}: {
  settings: FretboardSettings;
  onChange: (patch: Partial<FretboardSettings>) => void;
  tuning: Tuning;
  positions: Position[];
  compact?: boolean;
}) {
  const tuningsForInstrument = TUNINGS.filter((t) => t.instrument === settings.instrument);
  const isCustom = settings.tuningId === "custom";

  const setInstrument = (instrument: Instrument) => {
    const first = TUNINGS.find((t) => t.instrument === instrument)!;
    onChange({ instrument, tuningId: first.id, customStrings: null, positionIndex: 0 });
  };

  const setCustomString = (index: number, midi: number) => {
    const strings = [...(settings.customStrings ?? tuning.strings)];
    strings[index] = midi;
    onChange({ customStrings: strings, tuningId: "custom" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Select label="楽器" value={settings.instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
          {(Object.keys(INSTRUMENT_LABEL_JA) as Instrument[]).map((i) => (
            <option key={i} value={i}>
              {INSTRUMENT_LABEL_JA[i]}
            </option>
          ))}
        </Select>
        <Select
          label="チューニング"
          value={isCustom ? "custom" : settings.tuningId}
          onChange={(e) => {
            if (e.target.value === "custom") onChange({ tuningId: "custom", customStrings: [...tuning.strings] });
            else onChange({ tuningId: e.target.value, customStrings: null });
          }}
        >
          {tuningsForInstrument.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameJa}
            </option>
          ))}
          <option value="custom">カスタム…</option>
        </Select>
        <Segmented<LabelMode>
          label="表示"
          value={settings.labelMode}
          onChange={(labelMode) => onChange({ labelMode })}
          options={[
            { value: "degree", label: "度数" },
            { value: "name", label: "音名" },
            { value: "dot", label: "ドット" },
          ]}
        />
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>フレット範囲</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              aria-label="開始フレット"
              min={0}
              max={20}
              value={settings.fretMin}
              onChange={(e) => {
                const v = Math.max(0, Math.min(Number(e.target.value), settings.fretMax - 4));
                onChange({ fretMin: v });
              }}
              className="w-14 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
            />
            <span>〜</span>
            <input
              type="number"
              aria-label="終了フレット"
              min={4}
              max={24}
              value={settings.fretMax}
              onChange={(e) => {
                const v = Math.min(24, Math.max(Number(e.target.value), settings.fretMin + 4));
                onChange({ fretMax: v });
              }}
              className="w-14 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
            />
          </div>
        </div>
        <div className="pb-1.5">
          <Toggle label="左利き" checked={settings.lefty} onChange={(lefty) => onChange({ lefty })} />
        </div>
      </div>
      {isCustom && (
        <fieldset className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-border p-2">
          <legend className="px-1 text-xs text-muted-foreground">カスタムチューニング（低音弦 → 高音弦）</legend>
          {(settings.customStrings ?? tuning.strings).map((midi, i) => {
            const pc = ((midi % 12) + 12) % 12;
            const oct = Math.floor(midi / 12) - 1;
            return (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{tuning.strings.length - i}弦</span>
                <select aria-label={`${tuning.strings.length - i}弦の音名`} value={pc} onChange={(e) => setCustomString(i, (oct + 1) * 12 + Number(e.target.value))} className="rounded border border-border bg-card px-1 py-1 text-sm">
                  {NOTE_CHOICES.map((p) => (
                    <option key={p} value={p}>
                      {midiToNoteName(p + 60).replace(/\d+$/, "")}
                    </option>
                  ))}
                </select>
                <select aria-label={`${tuning.strings.length - i}弦のオクターブ`} value={oct} onChange={(e) => setCustomString(i, (Number(e.target.value) + 1) * 12 + pc)} className="rounded border border-border bg-card px-1 py-1 text-sm">
                  {OCTAVES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const text = window.prompt("音名をスペース区切りで入力（低音弦→高音弦）例: D2 A2 D3 G3 B3 E4", (settings.customStrings ?? tuning.strings).map((m) => midiToNoteName(m).replace("♯", "#")).join(" "));
              if (!text) return;
              const midis = text.trim().split(/\s+/).map(noteNameToMidi);
              if (midis.every((m): m is number => m !== null) && midis.length >= 4) onChange({ customStrings: midis, tuningId: "custom" });
              else window.alert("音名を読めませんでした。例: E2 A2 D3 G3 B3 E4");
            }}
          >
            テキストで指定
          </Button>
        </fieldset>
      )}
      {!compact && (
        <div className="flex flex-wrap items-end gap-3">
          <Segmented<PositionSystem | "all">
            label="ポジション"
            value={settings.positionSystem}
            onChange={(positionSystem) => onChange({ positionSystem, positionIndex: 0 })}
            options={[
              { value: "all", label: "全体" },
              { value: "box", label: "ボックス（CAGED）", title: "4〜5 フレット幅の箱で区切る" },
              { value: "3nps", label: "3NPS", title: "1 弦 3 音のポジション" },
            ]}
          />
          {settings.positionSystem !== "all" && positions.length > 0 && (
            <div className="flex items-end gap-1">
              <Select label="番号" value={Math.min(settings.positionIndex, positions.length - 1)} onChange={(e) => onChange({ positionIndex: Number(e.target.value) })}>
                {positions.map((p, i) => (
                  <option key={p.id} value={i}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <Button size="sm" aria-label="前のポジション" onClick={() => onChange({ positionIndex: (settings.positionIndex - 1 + positions.length) % positions.length })}>
                ←
              </Button>
              <Button size="sm" aria-label="次のポジション" onClick={() => onChange({ positionIndex: (settings.positionIndex + 1) % positions.length })}>
                →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
