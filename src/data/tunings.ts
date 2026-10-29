/**
 * チューニングのプリセット。strings は低音弦→高音弦の MIDI ノート番号。
 */
export type Instrument = "guitar" | "guitar7" | "bass4" | "bass5";

export interface Tuning {
  id: string;
  nameJa: string;
  instrument: Instrument;
  strings: number[];
}

export const INSTRUMENT_LABEL_JA: Record<Instrument, string> = {
  guitar: "ギター（6弦）",
  guitar7: "ギター（7弦）",
  bass4: "ベース（4弦）",
  bass5: "ベース（5弦）",
};

export const TUNINGS: Tuning[] = [
  { id: "guitar-standard", nameJa: "標準（E A D G B E）", instrument: "guitar", strings: [40, 45, 50, 55, 59, 64] },
  { id: "guitar-drop-d", nameJa: "ドロップ D（D A D G B E）", instrument: "guitar", strings: [38, 45, 50, 55, 59, 64] },
  { id: "guitar-half-down", nameJa: "半音下げ（E♭ A♭ D♭ G♭ B♭ E♭）", instrument: "guitar", strings: [39, 44, 49, 54, 58, 63] },
  { id: "guitar-whole-down", nameJa: "全音下げ（D G C F A D）", instrument: "guitar", strings: [38, 43, 48, 53, 57, 62] },
  { id: "guitar-drop-c", nameJa: "ドロップ C（C G C F A D）", instrument: "guitar", strings: [36, 43, 48, 53, 57, 62] },
  { id: "guitar-dadgad", nameJa: "DADGAD", instrument: "guitar", strings: [38, 45, 50, 55, 57, 62] },
  { id: "guitar-open-g", nameJa: "オープン G（D G D G B D）", instrument: "guitar", strings: [38, 43, 50, 55, 59, 62] },
  { id: "guitar7-standard", nameJa: "7弦 標準（B E A D G B E）", instrument: "guitar7", strings: [35, 40, 45, 50, 55, 59, 64] },
  { id: "guitar7-drop-a", nameJa: "7弦 ドロップ A（A E A D G B E）", instrument: "guitar7", strings: [33, 40, 45, 50, 55, 59, 64] },
  { id: "bass4-standard", nameJa: "標準（E A D G）", instrument: "bass4", strings: [28, 33, 38, 43] },
  { id: "bass4-drop-d", nameJa: "ドロップ D（D A D G）", instrument: "bass4", strings: [26, 33, 38, 43] },
  { id: "bass4-half-down", nameJa: "半音下げ（E♭ A♭ D♭ G♭）", instrument: "bass4", strings: [27, 32, 37, 42] },
  { id: "bass5-low-b", nameJa: "5弦 Low B（B E A D G）", instrument: "bass5", strings: [23, 28, 33, 38, 43] },
  { id: "bass5-high-c", nameJa: "5弦 High C（E A D G C）", instrument: "bass5", strings: [28, 33, 38, 43, 48] },
];

export const TUNING_BY_ID: Record<string, Tuning> = Object.fromEntries(TUNINGS.map((t) => [t.id, t]));

export const DEFAULT_TUNING_ID: Record<Instrument, string> = {
  guitar: "guitar-standard",
  guitar7: "guitar7-standard",
  bass4: "bass4-standard",
  bass5: "bass5-low-b",
};

export const isBass = (instrument: Instrument): boolean => instrument === "bass4" || instrument === "bass5";

/** カスタムチューニングを作る（MIDI 配列から） */
export function customTuning(instrument: Instrument, strings: number[]): Tuning {
  return { id: `custom:${strings.join(".")}`, nameJa: "カスタム", instrument, strings };
}
