/**
 * コードの押さえ方。
 * ギター: ルート弦（6 弦 = E フォーム、5 弦 = A フォーム、4 弦 = D フォーム）に対する相対フレットで定義し、任意のルートへ移動する。
 * ベース: コードトーンの配置（アルペジオ用）を返す。
 */
import { isBass, type Tuning } from "@/data/tunings";
import type { ParsedChord } from "./chord-parser";
import type { ChordQuality } from "./chords";
import { fretOnString, midiAt, pcAt } from "./fretboard";
import { mod12, type PitchClass } from "./notes";

/** 相対フレット。null = ミュート。配列は低音弦→高音弦（6 弦ギター想定） */
export interface ShapeDef {
  /** ルートがある弦（0 = 6 弦, 1 = 5 弦, 2 = 4 弦） */
  rootString: 0 | 1 | 2;
  frets: (number | null)[];
  nameJa: string;
}

export interface ChordVoicing {
  /** 絶対フレット（null = ミュート）。低音弦→高音弦 */
  frets: (number | null)[];
  /** 表示の基準フレット（1 = 開放ポジション） */
  baseFret: number;
  rootString: number;
  nameJa: string;
  /** 各弦の音（度数ラベル用） */
  pcs: (PitchClass | null)[];
}

const E = (frets: (number | null)[], nameJa = "6弦ルート（E フォーム）"): ShapeDef => ({ rootString: 0, frets, nameJa });
const A = (frets: (number | null)[], nameJa = "5弦ルート（A フォーム）"): ShapeDef => ({ rootString: 1, frets, nameJa });
const D = (frets: (number | null)[], nameJa = "4弦ルート（D フォーム）"): ShapeDef => ({ rootString: 2, frets, nameJa });
const x = null;

/** 相対フレットは「ルートのフレット = 0」。E フォームは E 開放、A フォームは A 開放、D フォームは D 開放のフォームそのまま */
export const GUITAR_SHAPES: Record<ChordQuality, ShapeDef[]> = {
  maj: [E([0, 2, 2, 1, 0, 0]), A([x, 0, 2, 2, 2, 0]), D([x, x, 0, 2, 3, 2])],
  min: [E([0, 2, 2, 0, 0, 0]), A([x, 0, 2, 2, 1, 0]), D([x, x, 0, 2, 3, 1])],
  dim: [E([0, 1, 2, 0, x, x]), A([x, 0, 1, 2, 1, x]), D([x, x, 0, 1, 3, 1])],
  aug: [E([0, 3, 2, 1, 1, 0]), A([x, 0, 3, 2, 2, x]), D([x, x, 0, 3, 3, 2])],
  sus2: [E([0, 2, 4, 4, 0, 0]), A([x, 0, 2, 2, 0, 0]), D([x, x, 0, 2, 3, 0])],
  sus4: [E([0, 2, 2, 2, 0, 0]), A([x, 0, 2, 2, 3, 0]), D([x, x, 0, 2, 3, 3])],
  "6": [E([0, 2, 2, 1, 2, 0]), A([x, 0, 2, 2, 2, 2]), D([x, x, 0, 2, 0, 2])],
  m6: [E([0, 2, 2, 0, 2, 0]), A([x, 0, 2, 2, 1, 2]), D([x, x, 0, 2, 0, 1])],
  "7": [E([0, 2, 0, 1, 0, 0]), A([x, 0, 2, 0, 2, 0]), D([x, x, 0, 2, 1, 2])],
  maj7: [E([0, x, 1, 1, 0, x]), A([x, 0, 2, 1, 2, 0]), D([x, x, 0, 2, 2, 2])],
  m7: [E([0, 2, 0, 0, 0, 0]), A([x, 0, 2, 0, 1, 0]), D([x, x, 0, 2, 1, 1])],
  m7b5: [E([0, 1, 0, 0, x, x]), A([x, 0, 1, 0, 1, x]), D([x, x, 0, 1, 1, 1])],
  dim7: [E([0, 1, 2, 0, 2, 0]), A([x, 0, 1, 2, 1, 2]), D([x, x, 0, 1, 0, 1])],
  mMaj7: [E([0, 2, 1, 0, 0, 0]), A([x, 0, 2, 1, 1, 0]), D([x, x, 0, 2, 2, 1])],
  "7sus4": [E([0, 2, 0, 2, 0, 0]), A([x, 0, 2, 0, 3, 0]), D([x, x, 0, 2, 1, 3])],
  add9: [E([0, 2, 2, 1, 0, 2]), A([x, 0, 2, 4, 2, 0])],
  "9": [E([0, 2, 0, 1, 0, 2]), A([x, 0, 2, 4, 2, 3])],
  m9: [E([0, 2, 0, 0, 0, 2]), A([x, 0, 2, 4, 1, 3])],
  maj9: [E([0, 2, 1, 1, 0, 2]), A([x, 0, 2, 4, 2, 4])],
  "11": [E([0, 0, 0, 1, 0, 0]), A([x, 0, 0, 0, 0, 0]), D([x, x, 0, 0, 1, 2])],
  "13": [E([0, 2, 0, 1, 2, 0]), A([x, 0, 2, 0, 2, 2])],
  "7b9": [E([0, 2, 0, 1, 3, 1]), A([x, 0, 2, 3, 2, 3])],
  "7#9": [E([0, x, 0, 1, x, 3], "6弦ルート（E フォーム）"), A([x, 0, -1, 0, 1, x], "5弦ルート（ヘンドリックス・コード）")],
  "7#11": [E([0, 1, 0, 1, 0, 0]), A([x, 0, 1, 0, 2, 3]), D([x, x, 0, 1, 1, 2])],
  "7b13": [E([0, 2, 0, 1, 1, 0]), A([x, 0, 2, 0, 2, 1])],
  "7#5": [E([0, x, 0, 1, 1, 0]), A([x, 0, x, 0, 2, 1])],
  "7alt": [E([0, x, 0, 1, x, 3], "6弦ルート（7(♯9) 型）"), A([x, 0, 3, 0, 2, 1], "5弦ルート（7(♭13) 型）")],
};

/** フォーム定義の基準となる標準チューニング（E A D G B E） */
const REFERENCE_STRINGS = [40, 45, 50, 55, 59, 64];

/**
 * ギターのコードフォームを求める。
 * フォームは標準チューニング基準で定義し、実際のチューニングには「同じ音（MIDI）が出るフレット」へ変換する。
 * 変則チューニングでフレットが負／範囲外になる弦はミュートし、ルート弦が鳴らせないフォームは除外する。
 * 7 弦ギターは上 6 本（高音側）にフォームを適用し、最低音弦はミュートする。
 */
export function guitarVoicings(chord: ParsedChord, tuning: Tuning, maxFret = 15): ChordVoicing[] {
  if (isBass(tuning.instrument)) return [];
  const shapes = GUITAR_SHAPES[chord.quality] ?? [];
  const stringCount = tuning.strings.length;
  const offset = stringCount - 6;
  if (offset < 0) return [];
  const out: ChordVoicing[] = [];
  for (const shape of shapes) {
    const rel = shape.frets;
    const relNums = rel.filter((f): f is number => f !== null);
    const minRel = Math.min(...relNums);
    const maxRel = Math.max(...relNums);
    // 基準チューニングでのルートフレット
    let rootFret = mod12(chord.rootPc - mod12(REFERENCE_STRINGS[shape.rootString]));
    if (rootFret + minRel < 0) rootFret += 12;
    if (rootFret + maxRel > maxFret && rootFret - 12 + minRel >= 0) rootFret -= 12;
    const frets: (number | null)[] = Array.from({ length: stringCount }, () => null);
    let valid = true;
    rel.forEach((r, i) => {
      if (r === null) return;
      const midi = REFERENCE_STRINGS[i] + rootFret + r;
      const f = midi - tuning.strings[i + offset];
      if (f < 0 || f > Math.max(maxFret, rootFret + maxRel)) {
        if (i === shape.rootString) valid = false;
        return;
      }
      frets[i + offset] = f;
    });
    if (!valid) continue;
    const sounded = frets.filter((f): f is number => f !== null);
    if (sounded.length < 3) continue;
    const minSounded = Math.min(...sounded);
    const maxSounded = Math.max(...sounded);
    const baseFret = minSounded === 0 ? 1 : Math.max(1, Math.min(minSounded, maxSounded - 4));
    const pcs = frets.map((f, s) => (f === null ? null : pcAt(tuning, s, f)));
    out.push({ frets, baseFret, rootString: shape.rootString + offset, nameJa: shape.nameJa, pcs });
  }
  return out;
}

export interface BassChordTone {
  string: number;
  fret: number;
  pc: PitchClass;
  degree: string;
}

/** ベース: ルートを最低音弦側に置いた 1 オクターブ分のコードトーン配置（アルペジオ用） */
export function bassChordTonePositions(chord: ParsedChord, tuning: Tuning, preferredRootString = 0): BassChordTone[] {
  const tones = chord.tones.filter((t) => t.isChordTone);
  const rootString = Math.min(preferredRootString, tuning.strings.length - 1);
  const rootFret = fretOnString(tuning, rootString, chord.rootPc);
  const rootMidi = midiAt(tuning, rootString, rootFret);
  const out: BassChordTone[] = [];
  for (const t of tones) {
    const targetMidi = rootMidi + t.semitones;
    // 近いフレット（ルートの -1 〜 +4 フレット）に収まる弦を選ぶ
    let best: BassChordTone | null = null;
    for (let s = 0; s < tuning.strings.length; s++) {
      const f = targetMidi - tuning.strings[s];
      if (f < 0 || f > 24) continue;
      const dist = Math.abs(f - rootFret);
      if (!best || dist < Math.abs(best.fret - rootFret)) best = { string: s, fret: f, pc: mod12(targetMidi), degree: t.label };
    }
    if (best) out.push(best);
  }
  // オクターブ上のルートも加える
  const octMidi = rootMidi + 12;
  for (let s = tuning.strings.length - 1; s >= 0; s--) {
    const f = octMidi - tuning.strings[s];
    if (f >= 0 && Math.abs(f - rootFret) <= 4) {
      out.push({ string: s, fret: f, pc: chord.rootPc, degree: "R" });
      break;
    }
  }
  return out;
}
