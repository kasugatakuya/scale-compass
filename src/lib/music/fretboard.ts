/**
 * 指板へのマッピングとポジション（ボックス／3NPS）の算出。
 * 弦のインデックスは tuning.strings に合わせて 0 = 最低音弦。
 * 表示上の「1 弦」は最高音弦なので stringNumber = 弦数 - index。
 */
import type { Tuning } from "@/data/tunings";
import { midiToPc, mod12, type PitchClass } from "./notes";

export interface FretPosition {
  /** 0 = 最低音弦 */
  string: number;
  fret: number;
  pc: PitchClass;
  midi: number;
}

export type MarkerKind = "root" | "chord-tone" | "tension" | "scale-tone";

export interface FretboardMarker extends FretPosition {
  kind: MarkerKind;
  /** 音名 */
  name: string;
  /** 度数（R, ♭3, ♯11 …） */
  degree: string;
  /** コードトーンの半音上などアヴォイド候補 */
  isAvoid?: boolean;
}

export interface FretRange {
  min: number;
  max: number;
}

export const DEFAULT_FRET_RANGE: FretRange = { min: 0, max: 15 };

export function midiAt(tuning: Tuning, string: number, fret: number): number {
  return tuning.strings[string] + fret;
}

export function pcAt(tuning: Tuning, string: number, fret: number): PitchClass {
  return midiToPc(midiAt(tuning, string, fret));
}

/** 指定したピッチクラスの位置をすべて列挙 */
export function positionsOf(tuning: Tuning, pcs: PitchClass[], range: FretRange = DEFAULT_FRET_RANGE): FretPosition[] {
  const set = new Set(pcs.map(mod12));
  const out: FretPosition[] = [];
  for (let s = 0; s < tuning.strings.length; s++) {
    for (let f = range.min; f <= range.max; f++) {
      const midi = midiAt(tuning, s, f);
      const pc = midiToPc(midi);
      if (set.has(pc)) out.push({ string: s, fret: f, pc, midi });
    }
  }
  return out;
}

/** 特定の弦でピッチクラスが出る最初のフレット（minFret 以上） */
export function fretOnString(tuning: Tuning, string: number, pc: PitchClass, minFret = 0): number {
  const open = pcAt(tuning, string, 0);
  let f = mod12(pc - open);
  while (f < minFret) f += 12;
  return f;
}

export interface NoteSpec {
  pc: PitchClass;
  name: string;
  degree: string;
  kind: MarkerKind;
  isAvoid?: boolean;
}

/** 音の仕様（ピッチクラスごとの名前・度数・種類）を指板全体へ展開する */
export function buildMarkers(tuning: Tuning, specs: NoteSpec[], range: FretRange = DEFAULT_FRET_RANGE): FretboardMarker[] {
  const byPc = new Map<PitchClass, NoteSpec>();
  for (const s of specs) {
    const existing = byPc.get(s.pc);
    // ルート > コードトーン > テンション > スケール音 の優先で上書き
    if (!existing || rank(s.kind) < rank(existing.kind)) byPc.set(s.pc, s);
  }
  return positionsOf(tuning, [...byPc.keys()], range).map((p) => {
    const spec = byPc.get(p.pc)!;
    return { ...p, kind: spec.kind, name: spec.name, degree: spec.degree, isAvoid: spec.isAvoid };
  });
}

function rank(kind: MarkerKind): number {
  return kind === "root" ? 0 : kind === "chord-tone" ? 1 : kind === "tension" ? 2 : 3;
}

/** ───────── ポジション ───────── */

export type PositionSystem = "box" | "3nps";

export interface Position {
  id: string;
  label: string;
  system: PositionSystem;
  range: FretRange;
  /** 各弦で押さえるフレット（0 = 最低音弦） */
  stringFrets: number[][];
}

const uniqueByFrets = (positions: Position[]): Position[] => {
  const seen = new Set<string>();
  return positions.filter((p) => {
    const k = p.stringFrets.map((f) => f.join(",")).join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * ボックスポジション（CAGED 的な 4〜5 フレット幅の箱）。
 * 最低音弦上の各スケール音を起点に、幅 `width` フレットの窓に入るスケール音を各弦から拾う。
 */
export function boxPositions(tuning: Tuning, scalePcsSorted: PitchClass[], width?: number, maxStartFret = 11): Position[] {
  const set = new Set(scalePcsSorted.map(mod12));
  // ペンタトニック系（6 音以下）は 4 フレット幅の箱、7 音以上は 5 フレット幅
  const w = width ?? (set.size <= 6 ? 3 : 4);
  const starts: number[] = [];
  for (let f = 0; f <= maxStartFret; f++) if (set.has(pcAt(tuning, 0, f))) starts.push(f);
  const positions = starts.map((start, i) => {
    const lo = start;
    const hi = start + w;
    const stringFrets = tuning.strings.map((_, s) => {
      const frets: number[] = [];
      for (let f = lo; f <= hi; f++) if (set.has(pcAt(tuning, s, f))) frets.push(f);
      return frets;
    });
    return {
      id: `box-${i + 1}`,
      label: `ボックス ${i + 1}（${lo}〜${hi}fr）`,
      system: "box" as const,
      range: { min: lo, max: hi },
      stringFrets,
    };
  });
  return uniqueByFrets(positions);
}

/**
 * 3NPS（1 弦 3 音）ポジション。7 音スケール向け。
 * 最低音弦の各スケール音から始めて、弦ごとに次の 3 音を昇順に取る。
 */
export function threeNotesPerStringPositions(tuning: Tuning, scalePcsSorted: PitchClass[], notesPerString = 3, maxStartFret = 11): Position[] {
  const set = new Set(scalePcsSorted.map(mod12));
  const starts: number[] = [];
  for (let f = 0; f <= maxStartFret; f++) if (set.has(pcAt(tuning, 0, f))) starts.push(f);
  const positions: Position[] = [];
  starts.forEach((start, i) => {
    let currentMidi = midiAt(tuning, 0, start) - 1;
    const stringFrets: number[][] = [];
    let ok = true;
    for (let s = 0; s < tuning.strings.length; s++) {
      const frets: number[] = [];
      const open = tuning.strings[s];
      // 前の弦の最後の音より高い、この弦上の次のスケール音から始める
      let midi = Math.max(currentMidi + 1, open);
      while (frets.length < notesPerString) {
        if (set.has(midiToPc(midi))) {
          const f = midi - open;
          if (f > 24) {
            ok = false;
            break;
          }
          frets.push(f);
          currentMidi = midi;
        }
        midi++;
      }
      if (!ok) break;
      stringFrets.push(frets);
    }
    if (!ok) return;
    const all = stringFrets.flat();
    const range = { min: Math.min(...all), max: Math.max(...all) };
    positions.push({ id: `3nps-${i + 1}`, label: `3NPS ポジション ${i + 1}（${range.min}〜${range.max}fr）`, system: "3nps", range, stringFrets });
  });
  return uniqueByFrets(positions);
}

export function positionsFor(system: PositionSystem, tuning: Tuning, scalePcs: PitchClass[]): Position[] {
  return system === "box" ? boxPositions(tuning, scalePcs) : threeNotesPerStringPositions(tuning, scalePcs);
}

/** マーカーをポジションで絞り込む */
export function filterMarkersByPosition(markers: FretboardMarker[], position: Position | null): FretboardMarker[] {
  if (!position) return markers;
  return markers.filter((m) => position.stringFrets[m.string]?.includes(m.fret));
}

/** 表示用の弦番号（1 = 最高音弦） */
export const stringNumber = (tuning: Tuning, index: number): number => tuning.strings.length - index;

/** ポジションマーク（ドット）を付けるフレット */
export const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
export const DOUBLE_INLAY_FRETS = [12, 24];
