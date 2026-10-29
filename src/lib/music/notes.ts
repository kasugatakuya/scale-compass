/**
 * 音名・ピッチクラス・度数のユーティリティ（純粋関数）
 * 表示用の音名は ♯ / ♭ の記号を使い、内部計算は 0〜11 のピッチクラスで行う。
 */
import { Interval, Note } from "tonal";

/** 0 = C, 1 = C♯/D♭ … 11 = B */
export type PitchClass = number;
/** 表示用音名。例: "C", "F♯", "B♭" */
export type NoteName = string;
export type Accidental = "sharp" | "flat";

const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const LETTER_PC: Record<string, PitchClass> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const mod12 = (n: number): PitchClass => ((n % 12) + 12) % 12;

/** 表示用記号(♯♭) を tonal 用の ASCII(#b) に */
export const toAscii = (name: string): string =>
  name.replace(/♯/g, "#").replace(/♭/g, "b").replace(/𝄪/g, "##").replace(/𝄫/g, "bb");

/** ASCII(#b) を表示用記号(♯♭) に */
export const toUnicode = (name: string): string =>
  name.replace(/##/g, "𝄪").replace(/bb/g, "𝄫").replace(/#/g, "♯").replace(/b/g, "♭");

/**
 * 音名文字列をピッチクラスへ。"C", "C#", "Db", "F♯", "Bb", "E#" を受け付ける。
 * 不正な場合は null。
 */
export function parseNoteName(input: string): { name: NoteName; pc: PitchClass } | null {
  const m = /^([A-G])(♯|#|♭|b|𝄪|##|𝄫|bb)?$/.exec(input.trim());
  if (!m) return null;
  const letter = m[1];
  const acc = m[2] ?? "";
  const shift =
    acc === "" ? 0 : acc === "♯" || acc === "#" ? 1 : acc === "♭" || acc === "b" ? -1 : acc === "𝄪" || acc === "##" ? 2 : -2;
  return { name: toUnicode(letter + toAscii(acc)), pc: mod12(LETTER_PC[letter] + shift) };
}

/** ピッチクラスを音名に（既定は ♯ 表記）。 */
export function pcToName(pc: PitchClass, prefer: Accidental = "sharp"): NoteName {
  return (prefer === "flat" ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
}

/** 名前からピッチクラス（表示用・ASCII どちらでも）。不正なら 0 ではなく例外。 */
export function nameToPc(name: NoteName): PitchClass {
  const parsed = parseNoteName(name);
  if (!parsed) throw new Error(`不正な音名です: ${name}`);
  return parsed.pc;
}

/**
 * ルート音名を tonal のインターバル名（"3M", "7m", "9m" など）で移調し、
 * 表示用の音名を返す。ダブルシャープ／ダブルフラットは単純な異名同音へ落とす。
 */
export function transposeName(root: NoteName, interval: string): NoteName {
  const raw = Note.transpose(toAscii(root), interval);
  if (!raw) throw new Error(`移調に失敗しました: ${root} + ${interval}`);
  const simplified = /##|bb/.test(raw) ? Note.simplify(raw) : raw;
  return toUnicode(simplified);
}

/** 半音数から音名を移調（♯/♭ の選択は結果に任せる）。 */
export function transposeNameBySemitones(root: NoteName, semitones: number): NoteName {
  return transposeName(root, Interval.fromSemitones(semitones));
}

/** tonal インターバル名 → 半音数 (0〜) */
export function intervalSemitones(interval: string): number {
  const s = Interval.semitones(interval);
  if (s === undefined || Number.isNaN(s)) throw new Error(`不正なインターバルです: ${interval}`);
  return s;
}

/**
 * インターバル名から度数ラベル（R, ♭3, ♯11 など）を作る。
 * compound = true なら 2→9, 4→11, 6→13 のテンション表記にする。
 */
export function intervalToDegreeLabel(interval: string, compound = false): string {
  const m = /^(\d+)([PMmAd]+)$/.exec(interval);
  if (!m) throw new Error(`不正なインターバルです: ${interval}`);
  let num = Number(m[1]);
  const q = m[2];
  if (num === 1 && q === "P") return "R";
  if (num === 8 && q === "P") return "R";
  if (compound && (num === 2 || num === 4 || num === 6)) num += 7;
  if (!compound && num > 7) num -= 7;
  const base = num % 7 === 0 ? 7 : num % 7; // 1..7
  const isPerfectClass = base === 1 || base === 4 || base === 5;
  let acc = "";
  if (isPerfectClass) {
    acc = q === "P" ? "" : q === "A" ? "♯" : q === "d" ? "♭" : q === "AA" ? "𝄪" : "𝄫";
  } else {
    acc = q === "M" ? "" : q === "m" ? "♭" : q === "A" ? "♯" : q === "d" ? "𝄫" : "";
  }
  return `${acc}${num}`;
}

/** ルートからの半音数を、簡潔な度数ラベルにする（スケール表示などで使う汎用版） */
export const SEMITONE_DEGREE_LABELS = ["R", "♭2", "2", "♭3", "3", "4", "♯4", "5", "♭6", "6", "♭7", "7"];

export function semitonesToDegreeLabel(semitones: number): string {
  return SEMITONE_DEGREE_LABELS[mod12(semitones)];
}

/** キーのフラット／シャープ傾向（調号）から、表記の優先記号を決める。 */
export function preferredAccidentalForKey(tonicPc: PitchClass, mode: "major" | "minor"): Accidental {
  // メジャー: F, B♭, E♭, A♭, D♭, G♭ はフラット系。マイナーはその短3度上のメジャーと同じ。
  const majorPc = mode === "major" ? tonicPc : mod12(tonicPc + 3);
  return [5, 10, 3, 8, 1, 6].includes(mod12(majorPc)) ? "flat" : "sharp";
}

/** MIDI ノート番号 → ピッチクラス */
export const midiToPc = (midi: number): PitchClass => mod12(midi);

/** MIDI ノート番号 → 音名+オクターブ（例: 40 → "E2"） */
export function midiToNoteName(midi: number, prefer: Accidental = "sharp"): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${pcToName(midiToPc(midi), prefer)}${octave}`;
}

/** 音名+オクターブ（"E2", "Bb1", "C♯3"）→ MIDI。失敗時 null */
export function noteNameToMidi(input: string): number | null {
  const m = /^([A-G](?:♯|#|♭|b)?)(-?\d)$/.exec(input.trim());
  if (!m) return null;
  const parsed = parseNoteName(m[1]);
  if (!parsed) return null;
  return (Number(m[2]) + 1) * 12 + parsed.pc;
}
