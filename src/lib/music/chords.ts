/**
 * コードの品質（種類）定義。構成インターバルは tonal のインターバル名で持つ。
 */
import { intervalSemitones, intervalToDegreeLabel } from "./notes";

export type ChordQuality =
  | "maj" | "min" | "dim" | "aug" | "sus2" | "sus4"
  | "6" | "m6" | "7" | "maj7" | "m7" | "m7b5" | "dim7" | "mMaj7" | "7sus4"
  | "add9" | "9" | "m9" | "maj9" | "11" | "13"
  | "7b9" | "7#9" | "7#11" | "7b13" | "7#5" | "7alt";

export type ChordGroup = "major" | "minor" | "dominant" | "half-diminished" | "diminished" | "augmented" | "suspended";

export interface ChordQualityDef {
  id: ChordQuality;
  /** 正規化したサフィックス表記（表示用） */
  suffix: string;
  nameJa: string;
  group: ChordGroup;
  /** tonal インターバル名。1P を含む */
  intervals: string[];
  /** 正規化後（小文字・括弧なし・記号は ASCII）のサフィックス別名 */
  aliases: string[];
}

export const CHORD_QUALITIES: ChordQualityDef[] = [
  { id: "maj", suffix: "", nameJa: "メジャー", group: "major", intervals: ["1P", "3M", "5P"], aliases: ["", "maj", "major"] },
  { id: "min", suffix: "m", nameJa: "マイナー", group: "minor", intervals: ["1P", "3m", "5P"], aliases: ["m", "minor"] },
  { id: "dim", suffix: "dim", nameJa: "ディミニッシュ", group: "diminished", intervals: ["1P", "3m", "5d"], aliases: ["dim", "mb5", "m-5"] },
  { id: "aug", suffix: "aug", nameJa: "オーギュメント", group: "augmented", intervals: ["1P", "3M", "5A"], aliases: ["aug", "#5", "+5"] },
  { id: "sus2", suffix: "sus2", nameJa: "サスフォー(2)", group: "suspended", intervals: ["1P", "2M", "5P"], aliases: ["sus2"] },
  { id: "sus4", suffix: "sus4", nameJa: "サスフォー", group: "suspended", intervals: ["1P", "4P", "5P"], aliases: ["sus4", "sus"] },
  { id: "6", suffix: "6", nameJa: "シックス", group: "major", intervals: ["1P", "3M", "5P", "6M"], aliases: ["6", "maj6", "add6"] },
  { id: "m6", suffix: "m6", nameJa: "マイナーシックス", group: "minor", intervals: ["1P", "3m", "5P", "6M"], aliases: ["m6", "madd6"] },
  { id: "7", suffix: "7", nameJa: "セブンス（ドミナント）", group: "dominant", intervals: ["1P", "3M", "5P", "7m"], aliases: ["7", "dom7"] },
  { id: "maj7", suffix: "maj7", nameJa: "メジャーセブンス", group: "major", intervals: ["1P", "3M", "5P", "7M"], aliases: ["maj7"] },
  { id: "m7", suffix: "m7", nameJa: "マイナーセブンス", group: "minor", intervals: ["1P", "3m", "5P", "7m"], aliases: ["m7"] },
  { id: "m7b5", suffix: "m7♭5", nameJa: "マイナーセブンス・フラットファイブ", group: "half-diminished", intervals: ["1P", "3m", "5d", "7m"], aliases: ["m7b5", "m7-5"] },
  { id: "dim7", suffix: "dim7", nameJa: "ディミニッシュセブンス", group: "diminished", intervals: ["1P", "3m", "5d", "7d"], aliases: ["dim7"] },
  { id: "mMaj7", suffix: "mMaj7", nameJa: "マイナーメジャーセブンス", group: "minor", intervals: ["1P", "3m", "5P", "7M"], aliases: ["mmaj7", "mm7", "m+7"] },
  { id: "7sus4", suffix: "7sus4", nameJa: "セブンス・サスフォー", group: "suspended", intervals: ["1P", "4P", "5P", "7m"], aliases: ["7sus4", "7sus", "9sus4", "9sus"] },
  { id: "add9", suffix: "add9", nameJa: "アドナインス", group: "major", intervals: ["1P", "3M", "5P", "9M"], aliases: ["add9", "add2", "2"] },
  { id: "9", suffix: "9", nameJa: "ナインス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "9M"], aliases: ["9", "79"] },
  { id: "m9", suffix: "m9", nameJa: "マイナーナインス", group: "minor", intervals: ["1P", "3m", "5P", "7m", "9M"], aliases: ["m9", "m79"] },
  { id: "maj9", suffix: "maj9", nameJa: "メジャーナインス", group: "major", intervals: ["1P", "3M", "5P", "7M", "9M"], aliases: ["maj9", "maj79"] },
  { id: "11", suffix: "11", nameJa: "イレブンス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "9M", "11P"], aliases: ["11", "7911"] },
  { id: "13", suffix: "13", nameJa: "サーティーンス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "9M", "13M"], aliases: ["13", "7913"] },
  { id: "7b9", suffix: "7(♭9)", nameJa: "セブンス・フラットナインス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "9m"], aliases: ["7b9", "7-9"] },
  { id: "7#9", suffix: "7(♯9)", nameJa: "セブンス・シャープナインス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "9A"], aliases: ["7#9", "7+9"] },
  { id: "7#11", suffix: "7(♯11)", nameJa: "セブンス・シャープイレブンス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "11A"], aliases: ["7#11", "7+11"] },
  { id: "7b13", suffix: "7(♭13)", nameJa: "セブンス・フラットサーティーンス", group: "dominant", intervals: ["1P", "3M", "5P", "7m", "13m"], aliases: ["7b13", "7-13"] },
  { id: "7#5", suffix: "7(♯5)", nameJa: "セブンス・シャープファイブ", group: "dominant", intervals: ["1P", "3M", "5A", "7m"], aliases: ["7#5", "7+5", "aug7", "7aug", "+7"] },
  { id: "7alt", suffix: "7alt", nameJa: "オルタード・ドミナント", group: "dominant", intervals: ["1P", "3M", "7m", "9m", "9A", "11A", "13m"], aliases: ["7alt", "alt", "altered"] },
];

export const QUALITY_BY_ID: Record<ChordQuality, ChordQualityDef> = Object.fromEntries(
  CHORD_QUALITIES.map((q) => [q.id, q]),
) as Record<ChordQuality, ChordQualityDef>;

export const DOMINANT_QUALITIES: ChordQuality[] = CHORD_QUALITIES.filter((q) => q.group === "dominant").map((q) => q.id);
export const MAJOR_QUALITIES: ChordQuality[] = CHORD_QUALITIES.filter((q) => q.group === "major").map((q) => q.id);
export const MINOR_QUALITIES: ChordQuality[] = CHORD_QUALITIES.filter((q) => q.group === "minor").map((q) => q.id);

export type ToneRole = "R" | "3" | "5" | "7" | "6" | "9" | "11" | "13" | "sus";

export interface ChordTone {
  /** tonal インターバル名 */
  interval: string;
  /** ルートからの半音数 (0〜11 に折り畳み) */
  semitones: number;
  /** 役割（コードトーン判定用） */
  role: ToneRole;
  /** 表示ラベル。例: "R", "♭3", "♯11" */
  label: string;
  /** ルート・3rd・5th・7th をコードトーン、それ以外（9/11/13/6）はテンション扱い */
  isChordTone: boolean;
}

export function toneRoleOf(interval: string): ToneRole {
  const num = Number(/^\d+/.exec(interval)?.[0] ?? 0);
  switch (num) {
    case 1: return "R";
    case 2: return "9";
    case 3: return "3";
    case 4: return "sus";
    case 5: return "5";
    case 6: return "6";
    case 7: return "7";
    case 9: return "9";
    case 11: return "11";
    case 13: return "13";
    default: return "R";
  }
}

/** 品質から構成音（インターバル情報）を得る */
export function chordTonesOf(quality: ChordQuality): ChordTone[] {
  const def = QUALITY_BY_ID[quality];
  return def.intervals.map((interval) => {
    const num = Number(/^\d+/.exec(interval)?.[0] ?? 0);
    const role = toneRoleOf(interval);
    const compound = num >= 9;
    // sus コードの 2 度／4 度はコードトーン扱い（3 度の代わり）
    const isChordTone = role === "R" || role === "3" || role === "5" || role === "7" || (def.group === "suspended" && (role === "sus" || (role === "9" && num === 2)));
    return {
      interval,
      semitones: intervalSemitones(interval) % 12,
      role,
      label: intervalToDegreeLabel(interval, compound),
      isChordTone,
    };
  });
}

/** 品質がドミナント系（長3度＋短7度）か */
export const isDominantQuality = (q: ChordQuality): boolean => QUALITY_BY_ID[q].group === "dominant";
export const isMinorQuality = (q: ChordQuality): boolean => QUALITY_BY_ID[q].group === "minor";
export const isMajorQuality = (q: ChordQuality): boolean => QUALITY_BY_ID[q].group === "major";
