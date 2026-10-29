/**
 * キー（調）とダイアトニックコード、ローマ数字表記、コード機能。
 */
import { type ChordQuality, QUALITY_BY_ID } from "./chords";
import { mod12, type NoteName, parseNoteName, type PitchClass, pcToName, preferredAccidentalForKey, transposeName } from "./notes";
import { SCALE_BY_ID, type ScaleDef, scalePcs } from "./scales";

export type KeyMode = "major" | "minor";

export interface Key {
  tonic: NoteName;
  tonicPc: PitchClass;
  mode: KeyMode;
}

export type HarmonicFunction = "tonic" | "subdominant" | "dominant" | "other";

export const FUNCTION_LABEL_JA: Record<HarmonicFunction, string> = {
  tonic: "トニック（T）",
  subdominant: "サブドミナント（SD）",
  dominant: "ドミナント（D）",
  other: "その他",
};

export const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ"];

/** キーを作る。tonic は "C", "F♯", "Bb" など */
export function makeKey(tonic: NoteName, mode: KeyMode): Key {
  const parsed = parseNoteName(tonic);
  if (!parsed) throw new Error(`不正なキーです: ${tonic}`);
  return { tonic: parsed.name, tonicPc: parsed.pc, mode };
}

export function keyLabel(key: Key): string {
  return `${key.tonic} ${key.mode === "major" ? "メジャー" : "マイナー"}`;
}

/** キーの基本スケール（メジャー: アイオニアン、マイナー: エオリアン） */
export function keyScale(key: Key): ScaleDef {
  return key.mode === "major" ? SCALE_BY_ID.ionian : SCALE_BY_ID.aeolian;
}

export function keyScalePcs(key: Key): PitchClass[] {
  return scalePcs(keyScale(key), key.tonicPc);
}

/** 平行調（同主調）: C メジャー ⇄ C マイナー */
export function parallelKey(key: Key): Key {
  return { ...key, mode: key.mode === "major" ? "minor" : "major" };
}

/** 関係調: C メジャー ⇄ A マイナー */
export function relativeKey(key: Key): Key {
  const prefer = preferredAccidentalForKey(key.tonicPc, key.mode);
  if (key.mode === "major") {
    const pc = mod12(key.tonicPc + 9);
    return { tonic: transposeName(key.tonic, "6M"), tonicPc: pc, mode: "minor" };
  }
  const pc = mod12(key.tonicPc + 3);
  return { tonic: pcToName(pc, prefer), tonicPc: pc, mode: "major" };
}

export interface DiatonicChord {
  /** 1〜7 */
  degree: number;
  /** トニックからの半音数 */
  interval: number;
  root: NoteName;
  rootPc: PitchClass;
  triad: ChordQuality;
  seventh: ChordQuality;
  roman: string;
  romanSeventh: string;
  func: HarmonicFunction;
}

const MAJOR_DIATONIC: { triad: ChordQuality; seventh: ChordQuality; func: HarmonicFunction }[] = [
  { triad: "maj", seventh: "maj7", func: "tonic" },
  { triad: "min", seventh: "m7", func: "subdominant" },
  { triad: "min", seventh: "m7", func: "tonic" },
  { triad: "maj", seventh: "maj7", func: "subdominant" },
  { triad: "maj", seventh: "7", func: "dominant" },
  { triad: "min", seventh: "m7", func: "tonic" },
  { triad: "dim", seventh: "m7b5", func: "dominant" },
];

const MINOR_DIATONIC: { triad: ChordQuality; seventh: ChordQuality; func: HarmonicFunction }[] = [
  { triad: "min", seventh: "m7", func: "tonic" },
  { triad: "dim", seventh: "m7b5", func: "subdominant" },
  { triad: "maj", seventh: "maj7", func: "tonic" },
  { triad: "min", seventh: "m7", func: "subdominant" },
  { triad: "min", seventh: "m7", func: "dominant" },
  { triad: "maj", seventh: "maj7", func: "subdominant" },
  { triad: "maj", seventh: "7", func: "dominant" },
];

/** ダイアトニックコード（三和音と四和音） */
export function diatonicChords(key: Key): DiatonicChord[] {
  const scale = keyScale(key);
  const table = key.mode === "major" ? MAJOR_DIATONIC : MINOR_DIATONIC;
  return scale.intervals.map((iv, i) => {
    const root = transposeName(key.tonic, iv);
    const rootPc = mod12(key.tonicPc + scalePcs(scale, 0)[i]);
    const interval = mod12(rootPc - key.tonicPc);
    const { triad, seventh, func } = table[i];
    const romanBase = romanForInterval(interval, key.mode, triad);
    return {
      degree: i + 1,
      interval,
      root,
      rootPc,
      triad,
      seventh,
      roman: romanBase + QUALITY_BY_ID[triad].suffix,
      romanSeventh: romanBase + QUALITY_BY_ID[seventh].suffix,
      func,
    };
  });
}

/**
 * トニックからの半音数 → ローマ数字（メジャースケール基準。マイナーキーでも ♭Ⅲ・♭Ⅵ・♭Ⅶ と表記）
 * 非ダイアトニック度数は ♭ 表記を基本とし、dim 系コードのみ ♯ 表記（♯Ⅳdim7 など）
 */
export function romanForInterval(interval: number, _mode: KeyMode, quality?: ChordQuality): string {
  const table: Record<number, string> = { 0: "Ⅰ", 2: "Ⅱ", 4: "Ⅲ", 5: "Ⅳ", 7: "Ⅴ", 9: "Ⅵ", 11: "Ⅶ" };
  const iv = mod12(interval);
  if (table[iv]) return table[iv];
  const isDim = quality === "dim" || quality === "dim7";
  const flat: Record<number, string> = { 1: "♭Ⅱ", 3: "♭Ⅲ", 6: "♭Ⅴ", 8: "♭Ⅵ", 10: "♭Ⅶ" };
  const sharp: Record<number, string> = { 1: "♯Ⅰ", 3: "♯Ⅱ", 6: "♯Ⅳ", 8: "♯Ⅴ", 10: "♯Ⅵ" };
  return isDim ? sharp[iv] : flat[iv];
}

/** コードのルートと品質からローマ数字つき表記を作る（例: "Ⅱm7", "♭Ⅶ7"） */
export function romanNumeral(key: Key, rootPc: PitchClass, quality: ChordQuality): string {
  const interval = mod12(rootPc - key.tonicPc);
  return romanForInterval(interval, key.mode, quality) + QUALITY_BY_ID[quality].suffix;
}

/** 度数（1〜7）と変化記号を取り出す */
export function degreeInfo(key: Key, rootPc: PitchClass): { degree: number; accidental: "" | "♭" | "♯"; interval: number } {
  const interval = mod12(rootPc - key.tonicPc);
  const majorDegrees: Record<number, number> = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
  if (majorDegrees[interval] !== undefined) return { degree: majorDegrees[interval], accidental: "", interval };
  const flatDegree: Record<number, number> = { 1: 2, 3: 3, 6: 5, 8: 6, 10: 7 };
  return { degree: flatDegree[interval], accidental: "♭", interval };
}

/** キー内でのピッチクラス表記（調号に合わせた ♯/♭） */
export function nameInKey(key: Key, pc: PitchClass): NoteName {
  return pcToName(pc, preferredAccidentalForKey(key.tonicPc, key.mode));
}

/** 全 12 キーのトニック候補（表示用スペリング） */
export const KEY_TONICS: Record<KeyMode, NoteName[]> = {
  major: ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"],
  minor: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
};
