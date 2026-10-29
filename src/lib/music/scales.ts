/**
 * スケール定義表。インターバルは tonal 形式。labels は度数表示の上書き（テンション表記など）。
 */
import { intervalSemitones, intervalToDegreeLabel, mod12, type NoteName, type PitchClass, transposeName } from "./notes";

export type ScaleId =
  | "ionian" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "aeolian" | "locrian"
  | "melodic-minor" | "dorian-b2" | "lydian-augmented" | "lydian-b7" | "mixolydian-b6" | "locrian-#2" | "altered"
  | "harmonic-minor" | "phrygian-dominant"
  | "whole-tone" | "diminished" | "combination-of-diminished"
  | "major-pentatonic" | "minor-pentatonic" | "blues" | "major-blues" | "ryukyu"
  | "bebop-dominant";

export type ScaleCategory =
  | "major-mode" | "melodic-minor-mode" | "harmonic-minor-mode" | "symmetric" | "pentatonic" | "blues" | "bebop";

export interface ScaleDef {
  id: ScaleId;
  nameJa: string;
  nameEn: string;
  /** 別名（日本語の通称など） */
  aliasesJa?: string[];
  category: ScaleCategory;
  intervals: string[];
  /** 度数ラベルの上書き（例: オルタードは ♭9 ♯9 ♯11 ♭13 表記） */
  labels?: string[];
  /** 親スケールと、その何番目の音から始まるか（1 始まり） */
  parent?: { id: ScaleId; degree: number };
  /** 短い説明（響き・使いどころ） */
  descriptionJa: string;
}

export const SCALES: ScaleDef[] = [
  { id: "ionian", nameJa: "アイオニアン（メジャースケール）", nameEn: "Ionian", aliasesJa: ["メジャースケール"], category: "major-mode", intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"], parent: { id: "ionian", degree: 1 }, descriptionJa: "明るく安定した基本のスケール。Ⅰmaj7 上では 4 度がアヴォイド（長く伸ばすと濁る）。" },
  { id: "dorian", nameJa: "ドリアン", nameEn: "Dorian", category: "major-mode", intervals: ["1P", "2M", "3m", "4P", "5P", "6M", "7m"], parent: { id: "ionian", degree: 2 }, descriptionJa: "マイナーだが 6 度が長く、少し明るくクールな響き。Ⅱm7 やファンク／モーダルジャズの定番。" },
  { id: "phrygian", nameJa: "フリジアン", nameEn: "Phrygian", category: "major-mode", intervals: ["1P", "2m", "3m", "4P", "5P", "6m", "7m"], parent: { id: "ionian", degree: 3 }, descriptionJa: "♭2 が特徴のスパニッシュ／エキゾチックな響き。Ⅲm7 上や、メタルのリフでも多用。" },
  { id: "lydian", nameJa: "リディアン", nameEn: "Lydian", category: "major-mode", intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7M"], parent: { id: "ionian", degree: 4 }, descriptionJa: "♯4 が浮遊感・透明感を生む。Ⅳmaj7 の定番で、maj7 コード全般にアヴォイドなしで使える。" },
  { id: "mixolydian", nameJa: "ミクソリディアン", nameEn: "Mixolydian", category: "major-mode", intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m"], parent: { id: "ionian", degree: 5 }, descriptionJa: "メジャーの ♭7 版。ドミナント 7th の基本スケールで、ロック／ブルースの明るいリードにも。" },
  { id: "aeolian", nameJa: "エオリアン（ナチュラルマイナー）", nameEn: "Aeolian", aliasesJa: ["ナチュラルマイナースケール"], category: "major-mode", intervals: ["1P", "2M", "3m", "4P", "5P", "6m", "7m"], parent: { id: "ionian", degree: 6 }, descriptionJa: "いわゆるマイナースケール。Ⅵm7 や、マイナーキーのⅠm7 の基本。♭6 が切なさを出す。" },
  { id: "locrian", nameJa: "ロクリアン", nameEn: "Locrian", category: "major-mode", intervals: ["1P", "2m", "3m", "4P", "5d", "6m", "7m"], parent: { id: "ionian", degree: 7 }, descriptionJa: "♭2 と ♭5 を含む不安定な響き。m7♭5（ハーフディミニッシュ）の基本スケール。" },

  { id: "melodic-minor", nameJa: "メロディックマイナー", nameEn: "Melodic minor", category: "melodic-minor-mode", intervals: ["1P", "2M", "3m", "4P", "5P", "6M", "7M"], parent: { id: "melodic-minor", degree: 1 }, descriptionJa: "マイナーの 6・7 度を上げたスケール。mMaj7 / m6 のトニックマイナーに合う、ジャズらしい響き。" },
  { id: "dorian-b2", nameJa: "ドリアン♭2", nameEn: "Dorian ♭2", category: "melodic-minor-mode", intervals: ["1P", "2m", "3m", "4P", "5P", "6M", "7m"], parent: { id: "melodic-minor", degree: 2 }, descriptionJa: "フリジアンの 6 度を上げた形。7sus4(♭9) などに使える。" },
  { id: "lydian-augmented", nameJa: "リディアン・オーギュメント", nameEn: "Lydian augmented", category: "melodic-minor-mode", intervals: ["1P", "2M", "3M", "4A", "5A", "6M", "7M"], parent: { id: "melodic-minor", degree: 3 }, descriptionJa: "♯4 と ♯5 を持つ、maj7(♯5) やオーギュメント系に合う幻想的な響き。" },
  { id: "lydian-b7", nameJa: "リディアン♭7（リディアン・ドミナント）", nameEn: "Lydian ♭7", aliasesJa: ["リディアンドミナント"], category: "melodic-minor-mode", intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7m"], labels: ["R", "9", "3", "♯11", "5", "13", "♭7"], parent: { id: "melodic-minor", degree: 4 }, descriptionJa: "ミクソリディアンの 4 度を上げた形。♯11 を含み、裏コード（♭Ⅱ7）や解決しないドミナントに最適。" },
  { id: "mixolydian-b6", nameJa: "ミクソリディアン♭6", nameEn: "Mixolydian ♭6", category: "melodic-minor-mode", intervals: ["1P", "2M", "3M", "4P", "5P", "6m", "7m"], labels: ["R", "9", "3", "11", "5", "♭13", "♭7"], parent: { id: "melodic-minor", degree: 5 }, descriptionJa: "ドミナント 7th に ♭13 を加えたい時のスケール。マイナーへ解決する Ⅴ7 に合う。" },
  { id: "locrian-#2", nameJa: "ロクリアン♯2", nameEn: "Locrian ♯2", aliasesJa: ["ロクリアン♮2", "ハーフディミニッシュスケール"], category: "melodic-minor-mode", intervals: ["1P", "2M", "3m", "4P", "5d", "6m", "7m"], labels: ["R", "9", "♭3", "11", "♭5", "♭13", "♭7"], parent: { id: "melodic-minor", degree: 6 }, descriptionJa: "ロクリアンの ♭2 を長 2 度（9th）に変えた形。m7♭5 上で 9th が使え、より明るく洗練された響き。" },
  { id: "altered", nameJa: "オルタード", nameEn: "Altered (Super Locrian)", aliasesJa: ["スーパーロクリアン"], category: "melodic-minor-mode", intervals: ["1P", "2m", "2A", "3M", "4A", "6m", "7m"], labels: ["R", "♭9", "♯9", "3", "♯11", "♭13", "♭7"], parent: { id: "melodic-minor", degree: 7 }, descriptionJa: "♭9・♯9・♯11・♭13 のオルタードテンションをすべて含む。Ⅴ7 → Ⅰ の解決に強い緊張感を与える。" },

  { id: "harmonic-minor", nameJa: "ハーモニックマイナー", nameEn: "Harmonic minor", category: "harmonic-minor-mode", intervals: ["1P", "2M", "3m", "4P", "5P", "6m", "7M"], parent: { id: "harmonic-minor", degree: 1 }, descriptionJa: "マイナーの 7 度を上げたスケール。マイナーキーのドミナント（Ⅴ7）を生み、クラシカル／ネオクラシカルな響き。" },
  { id: "phrygian-dominant", nameJa: "ハーモニックマイナー・パーフェクト5th・ビロウ（HmP5↓）", nameEn: "Phrygian dominant", aliasesJa: ["フリジアンドミナント", "スパニッシュスケール", "HmP5↓"], category: "harmonic-minor-mode", intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7m"], labels: ["R", "♭9", "3", "11", "5", "♭13", "♭7"], parent: { id: "harmonic-minor", degree: 5 }, descriptionJa: "ハーモニックマイナーを 5 度下から始めた形。マイナーへ解決するドミナント 7th（♭9・♭13）に最適。" },

  { id: "whole-tone", nameJa: "ホールトーン", nameEn: "Whole tone", aliasesJa: ["全音音階"], category: "symmetric", intervals: ["1P", "2M", "3M", "4A", "5A", "7m"], labels: ["R", "9", "3", "♯11", "♭13", "♭7"], descriptionJa: "全音だけで作る 6 音スケール。aug や 7(♯5) 上で、ふわっとした浮遊感を出す。" },
  { id: "diminished", nameJa: "ディミニッシュ・スケール（ホール・ハーフ）", nameEn: "Diminished (whole-half)", category: "symmetric", intervals: ["1P", "2M", "3m", "4P", "5d", "6m", "6M", "7M"], descriptionJa: "全音・半音を交互に並べた 8 音スケール。dim7 コードの基本スケール。" },
  { id: "combination-of-diminished", nameJa: "コンビネーション・オブ・ディミニッシュ（ハーフ・ホール）", nameEn: "Half-whole diminished", aliasesJa: ["コンディミ", "ドミナント・ディミニッシュ"], category: "symmetric", intervals: ["1P", "2m", "2A", "3M", "4A", "5P", "6M", "7m"], labels: ["R", "♭9", "♯9", "3", "♯11", "5", "13", "♭7"], descriptionJa: "半音・全音を交互に並べた 8 音スケール。♭9・♯9・♯11 に加えて ♮5・13 を含み、7(♭9) や 13(♭9) に合う。" },

  { id: "major-pentatonic", nameJa: "メジャーペンタトニック", nameEn: "Major pentatonic", category: "pentatonic", intervals: ["1P", "2M", "3M", "5P", "6M"], descriptionJa: "メジャースケールから 4・7 度を抜いた 5 音。アヴォイドがなく外しにくい。カントリー／ポップスの定番。" },
  { id: "minor-pentatonic", nameJa: "マイナーペンタトニック", nameEn: "Minor pentatonic", category: "pentatonic", intervals: ["1P", "3m", "4P", "5P", "7m"], descriptionJa: "ロック／ブルースのリードの基本。マイナーコード上はもちろん、ドミナント上でもブルージーに使える。" },
  { id: "blues", nameJa: "ブルーススケール（マイナーブルース）", nameEn: "Blues scale", category: "blues", intervals: ["1P", "3m", "4P", "5d", "5P", "7m"], descriptionJa: "マイナーペンタに ♭5（ブルーノート）を加えた 6 音。ブルース／ロックの泥くさいフレーズに。" },
  { id: "major-blues", nameJa: "メジャーブルーススケール", nameEn: "Major blues scale", category: "blues", intervals: ["1P", "2M", "3m", "3M", "5P", "6M"], descriptionJa: "メジャーペンタに ♭3 を加えた 6 音。カントリー／ブルースの明るいフレーズに。" },

  { id: "ryukyu", nameJa: "琉球スケール（沖縄音階）", nameEn: "Ryukyu scale", aliasesJa: ["沖縄スケール", "ニロ抜き長音階"], category: "pentatonic", intervals: ["1P", "3M", "4P", "5P", "7M"], descriptionJa: "メジャースケールから 2・6 度を抜いた 5 音（ニロ抜き）。沖縄民謡の独特の明るさと哀感を生む。4 度と長 7 度が半音でぶつかる動きが特徴。" },
  { id: "bebop-dominant", nameJa: "ビバップ・ドミナント", nameEn: "Bebop dominant", category: "bebop", intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m", "7M"], descriptionJa: "ミクソリディアンに長 7 度を加えた 8 音。8 分音符でコードトーンが拍頭に来るジャズ用スケール。" },
];

export const SCALE_BY_ID: Record<ScaleId, ScaleDef> = Object.fromEntries(SCALES.map((s) => [s.id, s])) as Record<ScaleId, ScaleDef>;

export interface ScaleNote {
  pc: PitchClass;
  name: NoteName;
  /** 度数ラベル（R, ♭3, ♯11 …） */
  degree: string;
  /** ルートからの半音数 */
  semitones: number;
}

/** スケール定義とルート音名から、構成音を得る */
export function scaleNotes(scale: ScaleDef, root: NoteName, rootPc: PitchClass): ScaleNote[] {
  return scale.intervals.map((interval, i) => {
    const semitones = intervalSemitones(interval) % 12;
    return {
      pc: mod12(rootPc + semitones),
      name: transposeName(root, interval),
      degree: scale.labels?.[i] ?? intervalToDegreeLabel(interval),
      semitones,
    };
  });
}

/** スケールのピッチクラス集合 */
export function scalePcs(scale: ScaleDef, rootPc: PitchClass): PitchClass[] {
  return scale.intervals.map((iv) => mod12(rootPc + intervalSemitones(iv)));
}

/** 指定したピッチクラス集合をすべて含むスケール（7 音系優先）を探す */
export function scalesContaining(pcs: PitchClass[], rootPc: PitchClass, categories?: ScaleCategory[]): ScaleDef[] {
  return SCALES.filter((s) => (!categories || categories.includes(s.category)) && pcs.every((pc) => scalePcs(s, rootPc).includes(pc)));
}
