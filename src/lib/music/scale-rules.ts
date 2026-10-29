/**
 * スケール提案ルール（データ駆動）。
 * ルールは上から順に評価され、マッチしたルールの提案をすべてマージする（同じスケールは高い優先度を残す）。
 * reasonJa 内のプレースホルダ: {chord} コード名 / {root} ルート音 / {key} キー名 / {target} 解決先 / {scaleRoot} スケールのルート
 */
import type { ChordAnalysis, Relation } from "./analysis";
import { corePcs } from "./analysis";
import { type ChordQuality, DOMINANT_QUALITIES, MINOR_QUALITIES } from "./chords";
import { type Key, keyLabel, type KeyMode, keyScale, nameInKey } from "./key";
import { mod12, type NoteName, type PitchClass, transposeNameBySemitones } from "./notes";
import { SCALE_BY_ID, type ScaleDef, type ScaleId, scaleNotes, scalePcs, type ScaleNote } from "./scales";

export type Priority = 1 | 2 | 3;

export interface RuleSuggestion {
  scaleId: ScaleId;
  priority: Priority;
  reasonJa: string;
  /** スケールのルートをどこに置くか（既定: コードのルート） */
  rootFrom?: "chord" | "key" | "target";
  /** ルートからの半音オフセット（例: dim7 を Ⅴ7(♭9) と見る → -4） */
  rootOffset?: number;
}

export interface ScaleRule {
  id: string;
  match: {
    quality?: ChordQuality[];
    relation?: Relation[];
    /** トニックからの半音数 */
    interval?: number[];
    keyMode?: KeyMode[];
    /** セカンダリードミナント等の解決先がマイナーかどうか */
    targetMinor?: boolean;
    /** 解決先が不明（省略）な場合にのみマッチ */
    targetUnknown?: boolean;
  };
  suggestions: RuleSuggestion[];
}

const DOM = DOMINANT_QUALITIES;
const MIN = MINOR_QUALITIES;
const MIN7ISH: ChordQuality[] = ["min", "m7", "m9", "m6"];
const MAJ7ISH: ChordQuality[] = ["maj", "maj7", "6", "add9", "maj9"];
const PLAIN_DOM: ChordQuality[] = ["7", "9", "13"];

export const SCALE_RULES: ScaleRule[] = [
  // ───────── メジャーキーのダイアトニック ─────────
  { id: "major-I", match: { relation: ["diatonic"], keyMode: ["major"], interval: [0], quality: MAJ7ISH }, suggestions: [
    { scaleId: "ionian", priority: 1, reasonJa: "キーのメジャースケールそのもの。Ⅰ上では 4 度（{key}の 4 番目の音）を長く伸ばすと濁るので注意。" },
    { scaleId: "lydian", priority: 2, reasonJa: "4 度を ♯4 に替えるとアヴォイドが消え、浮遊感のあるモダンな響きになる。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "4・7 度を抜いた安全なメロディ。外しにくくフレーズが作りやすい。" },
    { scaleId: "major-blues", priority: 3, reasonJa: "♭3 を経過的に混ぜると、ブルース／カントリーの匂いが出る。" },
  ] },
  { id: "major-IV", match: { relation: ["diatonic"], keyMode: ["major"], interval: [5], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "キーの構成音のままⅣから並べたモード。♯4 がアヴォイドにならず、maj7 上で最も自然。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "コードトーン中心の安全な選択。" },
    { scaleId: "ionian", priority: 3, reasonJa: "{root} メジャーとして弾くとⅣの 4 度（キーの ♭7）が入り、少しブルージーになる。" },
  ] },
  { id: "major-II", match: { relation: ["diatonic"], keyMode: ["major"], interval: [2], quality: MIN7ISH }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "キーの構成音のままⅡから並べたモード。Ⅱm7 の定番で、明るめの 6 度が特徴。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "コードトーン中心でロック／ブルース寄りに。" },
    { scaleId: "blues", priority: 3, reasonJa: "♭5 を加えてブルージーなニュアンスを足す。" },
  ] },
  { id: "major-III", match: { relation: ["diatonic"], keyMode: ["major"], interval: [4], quality: MIN7ISH }, suggestions: [
    { scaleId: "phrygian", priority: 1, reasonJa: "キーの構成音のままⅢから並べたモード。♭2（キーの 4 番目の音）はアヴォイド。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "♭2 を避けられるので、安全にマイナーの響きを出せる。" },
    { scaleId: "aeolian", priority: 3, reasonJa: "Ⅲm7 をⅥm7 的（トニック代理）に扱うなら、2 度を長 2 度にして自然に。" },
  ] },
  { id: "major-VI", match: { relation: ["diatonic"], keyMode: ["major"], interval: [9], quality: MIN7ISH }, suggestions: [
    { scaleId: "aeolian", priority: 1, reasonJa: "キーの構成音のままⅥから並べたモード（関係調のナチュラルマイナー）。" },
    { scaleId: "dorian", priority: 2, reasonJa: "6 度を上げるとクールで明るめのマイナーに。Ⅵm7 をⅡm7 的に扱う発想。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "ロック／ポップスのリードの定番。" },
    { scaleId: "blues", priority: 3, reasonJa: "♭5 を加えてブルージーに。" },
  ] },
  { id: "major-V", match: { relation: ["diatonic"], keyMode: ["major"], interval: [7], quality: PLAIN_DOM }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "キーの構成音のままⅤから並べたモード。ドミナント 7th の基本。4 度はアヴォイド。" },
    { scaleId: "altered", priority: 2, reasonJa: "Ⅰへ解決する直前に ♭9・♯9・♯11・♭13 のテンションで強い緊張感を作る。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9・♯11 に加えて ♮5・13 も含む。7(♭9) 的な響きに。" },
    { scaleId: "lydian-b7", priority: 3, reasonJa: "解決せずに留まるドミナントや、♯11 を使いたいときに。" },
    { scaleId: "whole-tone", priority: 3, reasonJa: "♯5（♭13）を含むふわふわした響き。7(♯5) 的に。" },
    { scaleId: "bebop-dominant", priority: 3, reasonJa: "長 7 度を経過音に加えた 8 音。8 分音符でコードトーンが拍頭に揃うジャズ用。" },
    { scaleId: "blues", priority: 3, rootFrom: "key", reasonJa: "キーの {scaleRoot} ブルーススケールを Ⅴ7 上でも引き続き使うロック／ブルースの常套手段。" },
  ] },
  { id: "major-VII", match: { relation: ["diatonic"], keyMode: ["major"], interval: [11], quality: ["m7b5", "dim"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "キーの構成音のままⅦから並べたモード。m7♭5 の基本。♭2 はアヴォイド。" },
    { scaleId: "locrian-#2", priority: 2, reasonJa: "♭2 を 9th に替えると、アヴォイドが消えて洗練された響きになる。" },
  ] },
  { id: "major-diatonic-sus", match: { relation: ["diatonic"], keyMode: ["major"], quality: ["sus2", "sus4", "7sus4"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "3 度を含まない sus コードは、キーの構成音をそのまま使えばよい。ルートからはミクソリディアン的に。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "コードの 2・4・5 度を中心にした透明な響き。" },
  ] },

  // ───────── マイナーキーのダイアトニック ─────────
  { id: "minor-I", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [0], quality: ["min", "m7", "m9"] }, suggestions: [
    { scaleId: "aeolian", priority: 1, reasonJa: "キーのナチュラルマイナースケールそのもの。♭6 が切なさを作る。" },
    { scaleId: "minor-pentatonic", priority: 1, reasonJa: "マイナーキーのリードの基本。外れる音がない。" },
    { scaleId: "dorian", priority: 2, reasonJa: "6 度を上げるとクールで明るめの響き。ファンク／ジャズ寄り。" },
    { scaleId: "blues", priority: 2, reasonJa: "♭5 のブルーノートでロック／ブルースの泥くささを。" },
    { scaleId: "harmonic-minor", priority: 3, reasonJa: "7 度を上げるとクラシカル／ネオクラシカルな響き。Ⅴ7 への流れが強くなる。" },
  ] },
  { id: "minor-Im6", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [0], quality: ["m6"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "m6 の長 6 度を含む。トニックマイナーの定番。" },
    { scaleId: "melodic-minor", priority: 2, reasonJa: "長 7 度も加えた、ジャズらしいトニックマイナー。" },
  ] },
  { id: "minor-ImMaj7", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [0], quality: ["mMaj7"] }, suggestions: [
    { scaleId: "melodic-minor", priority: 1, reasonJa: "mMaj7 の長 7 度と長 6 度を含む、トニックマイナーの代表スケール。" },
    { scaleId: "harmonic-minor", priority: 2, reasonJa: "♭6 を残すと、よりクラシカルで劇的な響き。" },
  ] },
  { id: "minor-II", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [2], quality: ["m7b5", "dim"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "キーの構成音のままⅡから並べたモード。マイナーキーの Ⅱm7♭5 の基本。" },
    { scaleId: "locrian-#2", priority: 2, reasonJa: "♭2 を 9th に替えて、より明るく洗練された半減七の響きに。" },
  ] },
  { id: "minor-bIII", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [3], quality: MAJ7ISH }, suggestions: [
    { scaleId: "ionian", priority: 1, reasonJa: "キーの構成音のまま ♭Ⅲ から並べたモード（関係調のメジャースケール）。" },
    { scaleId: "lydian", priority: 2, reasonJa: "♯4 でアヴォイドを消し、浮遊感を出す。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "安全なコードトーン中心のメロディ。" },
  ] },
  { id: "minor-IV", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [5], quality: MIN7ISH }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "キーの構成音のままⅣから並べたモード。Ⅳm7 の定番。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "コードトーン中心でロック／ブルース寄りに。" },
  ] },
  { id: "minor-Vm", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [7], quality: MIN7ISH }, suggestions: [
    { scaleId: "phrygian", priority: 1, reasonJa: "キーの構成音のままⅤから並べたモード。Ⅴm7 の ♭2 はアヴォイド。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "♭2 を避けた安全なマイナーの響き。" },
  ] },
  { id: "minor-V7", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [7], quality: PLAIN_DOM }, suggestions: [
    { scaleId: "phrygian-dominant", priority: 1, reasonJa: "キーのハーモニックマイナーをⅤから並べたモード（HmP5↓）。♭9・♭13 を含み、マイナーのⅠへ強く解決する。" },
    { scaleId: "altered", priority: 2, reasonJa: "♭9・♯9・♯11・♭13 をすべて使ってさらに緊張感を高める。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9 に ♮5・13 を加えた、7(♭9) 的な響き。" },
    { scaleId: "mixolydian", priority: 3, reasonJa: "♮9・♮13 を使う明るいドミナント。マイナーキーではやや軽い響きになる。" },
  ] },
  { id: "minor-bVI", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [8], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "キーの構成音のまま ♭Ⅵ から並べたモード。♯4 がアヴォイドにならない。" },
    { scaleId: "ionian", priority: 2, reasonJa: "{root} メジャーとして弾くと、ややブルージーな 4 度が入る。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "安全なコードトーン中心のメロディ。" },
  ] },
  { id: "minor-bVII", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [10], quality: PLAIN_DOM }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "キーの構成音のまま ♭Ⅶ から並べたモード。関係調のⅤ7 として自然。" },
    { scaleId: "lydian-b7", priority: 2, reasonJa: "♯11 を加えて、トニックへ解決しないドミナントらしい色に。" },
  ] },
  { id: "minor-VIIdim7", match: { relation: ["diatonic"], keyMode: ["minor"], interval: [11], quality: ["dim7", "dim"] }, suggestions: [
    { scaleId: "diminished", priority: 1, reasonJa: "dim7 の基本スケール（ホール・ハーフ）。コードトーンが全部含まれる。" },
    { scaleId: "harmonic-minor", priority: 2, rootFrom: "key", reasonJa: "キーの {scaleRoot} ハーモニックマイナーをそのまま弾く。Ⅶdim7 はその第 7 音上のコード。" },
  ] },
  { id: "minor-diatonic-sus", match: { relation: ["diatonic"], keyMode: ["minor"], quality: ["sus2", "sus4", "7sus4"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "3 度を含まない sus コード。キーの構成音をそのまま使う。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "マイナーキーの流れを保ったまま sus の浮遊感を出す。" },
  ] },

  // ───────── セカンダリードミナント ─────────
  { id: "secondary-dominant-to-minor", match: { relation: ["secondary-dominant"], targetMinor: true }, suggestions: [
    { scaleId: "phrygian-dominant", priority: 1, reasonJa: "解決先 {target} がマイナーなので、そのハーモニックマイナーの第 5 モード（HmP5↓）。♭9・♭13 が自然に響く。" },
    { scaleId: "altered", priority: 2, reasonJa: "オルタードテンションで緊張感を最大化してから解決する。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9 に ♮13 を加えた 7(♭9) 的な色。" },
    { scaleId: "mixolydian", priority: 3, reasonJa: "基本のドミナントスケール。♮9・♮13 はマイナー解決ではややぶつかる。" },
  ] },
  { id: "secondary-dominant-to-major", match: { relation: ["secondary-dominant"], targetMinor: false }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "解決先 {target} がメジャーなので、基本のドミナントスケールで明るく。" },
    { scaleId: "lydian-b7", priority: 2, reasonJa: "♯11 を加えて少しひねる。4 度のアヴォイドも消える。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9 を混ぜてジャズらしい緊張感を。" },
    { scaleId: "altered", priority: 3, reasonJa: "メジャー解決でも、直前に強い緊張を作りたいときに。" },
  ] },
  { id: "secondary-dominant-unknown", match: { relation: ["secondary-dominant"], targetUnknown: true }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "基本のドミナントスケール。" },
    { scaleId: "altered", priority: 2, reasonJa: "緊張感を高めるオルタードテンション。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9・13 を含む 7(♭9) 的な色。" },
  ] },

  // ───────── 裏コード ─────────
  { id: "tritone-sub", match: { relation: ["tritone-substitution"] }, suggestions: [
    { scaleId: "lydian-b7", priority: 1, reasonJa: "裏コードの定番。本来のⅤ7 のオルタードスケールと同じ構成音になる。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♭9・♯9・♯11 を含み、裏コードの緊張感をさらに強める。" },
    { scaleId: "whole-tone", priority: 3, reasonJa: "♯11・♭13 のふわっとした響き。" },
  ] },

  // ───────── 借用和音（メジャーキー） ─────────
  { id: "borrowed-IVm", match: { relation: ["borrowed"], keyMode: ["major"], interval: [5], quality: ["min", "m7", "m9"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "サブドミナントマイナー。同主調マイナーの構成音をⅣから並べるとドリアンになる。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "コードトーン中心で陰りを強調。" },
    { scaleId: "aeolian", priority: 3, reasonJa: "♭6 を加えてより暗く。" },
  ] },
  { id: "borrowed-IVm6", match: { relation: ["borrowed"], keyMode: ["major"], interval: [5], quality: ["m6", "mMaj7"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "Ⅳm6 の長 6 度（キーの 2 度）を含むドリアン。" },
    { scaleId: "melodic-minor", priority: 2, reasonJa: "長 7 度も加えたジャズ的なサブドミナントマイナー。" },
  ] },
  { id: "borrowed-IIm7b5", match: { relation: ["borrowed"], keyMode: ["major"], interval: [2], quality: ["m7b5", "dim"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "サブドミナントマイナーの Ⅱm7♭5。同主調マイナーの構成音をⅡから並べたロクリアン。" },
    { scaleId: "locrian-#2", priority: 2, reasonJa: "9th を使えるロクリアン♯2 で洗練させる。" },
  ] },
  { id: "borrowed-bVI", match: { relation: ["borrowed"], keyMode: ["major"], interval: [8], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "♭Ⅵmaj7 は同主調マイナーの構成音を並べるとリディアンになる。サブドミナントマイナー系。" },
    { scaleId: "ionian", priority: 2, reasonJa: "{root} メジャーとして弾くと素直な響き。" },
  ] },
  { id: "borrowed-bIII", match: { relation: ["borrowed"], keyMode: ["major"], interval: [3], quality: MAJ7ISH }, suggestions: [
    { scaleId: "ionian", priority: 1, reasonJa: "♭Ⅲmaj7 は同主調マイナーの関係調（{root} メジャー）のⅠ。そのメジャースケールで。" },
    { scaleId: "lydian", priority: 2, reasonJa: "♯4 で浮遊感を足す。" },
  ] },
  { id: "borrowed-bVII7", match: { relation: ["borrowed"], keyMode: ["major"], interval: [10], quality: DOM }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "♭Ⅶ7 は同主調マイナーの構成音を並べるとミクソリディアン。ロックの Ⅰ-♭Ⅶ-Ⅳ などで定番。" },
    { scaleId: "lydian-b7", priority: 2, reasonJa: "♯11（キーの 3 度）を加えてもよく合う。" },
    { scaleId: "major-pentatonic", priority: 3, reasonJa: "コードトーン中心の明るいフレーズ。" },
  ] },
  { id: "borrowed-bVII-maj", match: { relation: ["borrowed"], keyMode: ["major"], interval: [10], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "♭Ⅶmaj7 はキーのミクソリディアン（♭7 を含むメジャー）由来。その構成音を ♭Ⅶ から並べるとリディアンになる。" },
    { scaleId: "ionian", priority: 2, reasonJa: "{root} メジャーとして素直に弾く（同主調マイナー寄りの響き）。" },
    { scaleId: "major-pentatonic", priority: 3, reasonJa: "コードトーン中心の安全な選択。" },
  ] },
  { id: "borrowed-Im", match: { relation: ["borrowed"], keyMode: ["major"], interval: [0], quality: MIN }, suggestions: [
    { scaleId: "aeolian", priority: 1, reasonJa: "同主調マイナーのトニック。ナチュラルマイナーで。" },
    { scaleId: "dorian", priority: 2, reasonJa: "6 度を上げて明るめのマイナーに。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "ロック／ブルースの基本。" },
  ] },
  // ───────── 借用和音（マイナーキー、同主調メジャーから） ─────────
  { id: "borrowed-minor-IVmaj", match: { relation: ["borrowed"], keyMode: ["minor"], interval: [5], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "マイナーキーのⅣmaj7 は同主調メジャーからの借用。その構成音をⅣから並べるとリディアン。" },
    { scaleId: "ionian", priority: 2, reasonJa: "{root} メジャーとして素直に弾く。" },
  ] },
  { id: "borrowed-minor-IV7", match: { relation: ["borrowed"], keyMode: ["minor"], interval: [5], quality: DOM }, suggestions: [
    { scaleId: "lydian-b7", priority: 1, reasonJa: "マイナーキーのⅣ7 はドリアン的な明るさ。♯11 を含むリディアン♭7 がよく合う。" },
    { scaleId: "mixolydian", priority: 2, reasonJa: "ブルース的に素直なドミナントスケールで。" },
    { scaleId: "blues", priority: 2, rootFrom: "key", reasonJa: "キーの {scaleRoot} ブルーススケールでマイナーブルースの流れを保つ。" },
  ] },
  { id: "borrowed-minor-I", match: { relation: ["borrowed"], keyMode: ["minor"], interval: [0], quality: MAJ7ISH }, suggestions: [
    { scaleId: "ionian", priority: 1, reasonJa: "マイナーキーの終わりに明るく解決する「ピカルディ終止」。メジャースケールで。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "安全なコードトーン中心の明るさ。" },
  ] },

  // ───────── 経過ディミニッシュ／ディミニッシュ全般 ─────────
  { id: "passing-dim-up", match: { relation: ["passing-diminished"], quality: ["dim7", "dim"] }, suggestions: [
    { scaleId: "diminished", priority: 1, reasonJa: "dim7 の基本スケール（ホール・ハーフ）。4 つのコードトーンすべてを含む。" },
    { scaleId: "phrygian-dominant", priority: 2, rootOffset: -4, reasonJa: "{chord} を {scaleRoot}7(♭9) のルート省略形と見れば、{scaleRoot} の HmP5↓ がそのまま使える。" },
    { scaleId: "combination-of-diminished", priority: 3, rootOffset: -4, reasonJa: "{scaleRoot}7(♭9) と見たときのコンディミ。dim7 の構成音を全部含む。" },
  ] },
  { id: "dim-generic", match: { relation: ["borrowed", "non-diatonic", "diatonic"], quality: ["dim7"] }, suggestions: [
    { scaleId: "diminished", priority: 1, reasonJa: "dim7 の基本スケール（ホール・ハーフ）。" },
    { scaleId: "phrygian-dominant", priority: 3, rootOffset: -4, reasonJa: "{scaleRoot}7(♭9) のルート省略形として、{scaleRoot} の HmP5↓。" },
  ] },
  { id: "dim-triad-generic", match: { relation: ["borrowed", "non-diatonic"], quality: ["dim"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "dim トライアド（R・♭3・♭5）を含む基本のモード。" },
    { scaleId: "diminished", priority: 2, reasonJa: "dim7 として扱うならディミニッシュ・スケール。" },
  ] },

  // ───────── 関連Ⅱm7 ─────────
  { id: "secondary-ii-m7", match: { relation: ["secondary-ii"], quality: ["m7", "min", "m9"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "一時的な「Ⅱm7」なので、ドリアンで次のドミナントへ流れる。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "コードトーン中心で安全に。" },
  ] },
  { id: "secondary-ii-m7b5", match: { relation: ["secondary-ii"], quality: ["m7b5"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "マイナーへ向かう「Ⅱm7♭5」。ロクリアンが基本。" },
    { scaleId: "locrian-#2", priority: 2, reasonJa: "9th を使えるロクリアン♯2 で洗練させる。" },
  ] },

  // ───────── オルタード系ドミナントの品質ルール（関係を問わず追加） ─────────
  { id: "q-7b9", match: { quality: ["7b9"] }, suggestions: [
    { scaleId: "combination-of-diminished", priority: 1, reasonJa: "7(♭9) のコードトーンをすべて含み、♮5・13 も使える。" },
    { scaleId: "phrygian-dominant", priority: 1, reasonJa: "♭9・♭13 を含み、マイナーへ解決する 7(♭9) に最適。" },
    { scaleId: "altered", priority: 2, reasonJa: "♯9・♯11・♭13 まで加えてさらにオルタードに。" },
  ] },
  { id: "q-7#9", match: { quality: ["7#9"] }, suggestions: [
    { scaleId: "altered", priority: 1, reasonJa: "♯9 を含むオルタードスケール。" },
    { scaleId: "combination-of-diminished", priority: 1, reasonJa: "♯9 と ♮5・13 を含むコンディミ。" },
    { scaleId: "blues", priority: 2, reasonJa: "♯9 ＝ ♭3 と見れば、ルートのブルーススケールでファンク／ブルースの響き。" },
  ] },
  { id: "q-7#11", match: { quality: ["7#11"] }, suggestions: [
    { scaleId: "lydian-b7", priority: 1, reasonJa: "♯11 を含むドミナントスケールの代表。" },
    { scaleId: "whole-tone", priority: 2, reasonJa: "♯11・♭13 を含むホールトーン。" },
    { scaleId: "combination-of-diminished", priority: 3, reasonJa: "♭9・♯9 も加えた 8 音。" },
  ] },
  { id: "q-7b13", match: { quality: ["7b13", "7#5"] }, suggestions: [
    { scaleId: "altered", priority: 1, reasonJa: "♭13 を含むオルタードスケール。" },
    { scaleId: "whole-tone", priority: 1, reasonJa: "♯5（♭13）と ♮9 を含む。7(♯5) の定番。" },
    { scaleId: "mixolydian-b6", priority: 2, reasonJa: "♮9・♮11 を保ちつつ ♭13 だけ加える。" },
    { scaleId: "phrygian-dominant", priority: 2, reasonJa: "♭9・♭13 の HmP5↓。マイナー解決向き。" },
  ] },
  { id: "q-7alt", match: { quality: ["7alt"] }, suggestions: [
    { scaleId: "altered", priority: 1, reasonJa: "「alt」はオルタードテンション（♭9・♯9・♯11・♭13）を自由に使う指示。まさにこのスケールのこと。" },
    { scaleId: "combination-of-diminished", priority: 2, reasonJa: "♮5・13 を含むので厳密な alt からは外れるが、近い緊張感を作れる。" },
    { scaleId: "whole-tone", priority: 3, reasonJa: "♯11・♭13 寄りのオルタードを狙うとき。" },
  ] },
  { id: "q-13", match: { quality: ["13"], relation: ["non-diatonic", "secondary-dominant", "borrowed"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "13th（長 6 度）を含む基本のドミナントスケール。" },
    { scaleId: "lydian-b7", priority: 2, reasonJa: "13 と ♯11 を両立できる。" },
    { scaleId: "bebop-dominant", priority: 3, reasonJa: "ジャズのラインを作る 8 音。" },
  ] },
  { id: "q-11", match: { quality: ["11", "7sus4"], relation: ["non-diatonic", "secondary-dominant", "borrowed", "tritone-substitution"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "4 度（11th）を含む sus 系ドミナントの基本。" },
    { scaleId: "dorian", priority: 2, reasonJa: "3 度を含まないので、♭3 のドリアンでモーダルに弾いても合う。" },
    { scaleId: "minor-pentatonic", priority: 3, rootOffset: 7, reasonJa: "5 度上（{scaleRoot}）のマイナーペンタで、R・4・5・♭7 を中心にした浮遊感。" },
  ] },

  // ───────── ノンダイアトニック（汎用） ─────────
  { id: "nd-dominant", match: { relation: ["non-diatonic"], quality: PLAIN_DOM }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "ドミナント 7th の基本スケール。ブルース的な Ⅰ7・Ⅳ7 ならこれが第一候補。" },
    { scaleId: "lydian-b7", priority: 2, reasonJa: "解決しないドミナントには ♯11 のリディアン♭7。" },
    { scaleId: "blues", priority: 2, reasonJa: "ルートのブルーススケールで泥くさく。" },
    { scaleId: "altered", priority: 3, reasonJa: "緊張感を高めてどこかへ解決させたいときに。" },
  ] },
  { id: "nd-major", match: { relation: ["non-diatonic"], quality: MAJ7ISH }, suggestions: [
    { scaleId: "lydian", priority: 1, reasonJa: "キー外の maj7 には、アヴォイドのないリディアンが万能。" },
    { scaleId: "ionian", priority: 2, reasonJa: "素直にそのコードのメジャースケール。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "コードトーン中心の安全策。" },
  ] },
  { id: "nd-minor", match: { relation: ["non-diatonic"], quality: ["min", "m7", "m9"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "キー外のマイナー 7th には、アヴォイドの少ないドリアンが万能。" },
    { scaleId: "aeolian", priority: 2, reasonJa: "♭6 で暗さを出すならナチュラルマイナー。" },
    { scaleId: "minor-pentatonic", priority: 2, reasonJa: "コードトーン中心の安全策。" },
  ] },
  { id: "nd-m6", match: { relation: ["non-diatonic", "borrowed"], quality: ["m6"] }, suggestions: [
    { scaleId: "dorian", priority: 1, reasonJa: "長 6 度を含むマイナースケール。" },
    { scaleId: "melodic-minor", priority: 2, reasonJa: "長 7 度も使うジャズ的なマイナー 6th。" },
  ] },
  { id: "nd-mMaj7", match: { relation: ["non-diatonic", "borrowed"], quality: ["mMaj7"] }, suggestions: [
    { scaleId: "melodic-minor", priority: 1, reasonJa: "mMaj7 の長 7 度を含むメロディックマイナー。" },
    { scaleId: "harmonic-minor", priority: 2, reasonJa: "♭6 のまま 7 度だけ上げたハーモニックマイナー。" },
  ] },
  { id: "nd-m7b5", match: { relation: ["non-diatonic", "borrowed"], quality: ["m7b5"] }, suggestions: [
    { scaleId: "locrian", priority: 1, reasonJa: "m7♭5 の基本スケール。" },
    { scaleId: "locrian-#2", priority: 2, reasonJa: "9th を使える明るめの半減七スケール。" },
  ] },
  { id: "nd-aug", match: { quality: ["aug"] }, suggestions: [
    { scaleId: "whole-tone", priority: 1, reasonJa: "aug（R・3・♯5）はホールトーンの一部。ふわっとした響き。" },
    { scaleId: "lydian-augmented", priority: 2, reasonJa: "maj7(♯5) 的に扱うなら ♯4・♯5 を含むこのスケール。" },
    { scaleId: "harmonic-minor", priority: 3, rootOffset: -4, reasonJa: "{chord} は {scaleRoot} ハーモニックマイナーの ♭Ⅲ+ でもある。" },
  ] },
  { id: "nd-sus", match: { relation: ["non-diatonic", "borrowed"], quality: ["sus2", "sus4"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "3 度を含まない sus コードは明暗どちらにも寄れる。ミクソリディアンが無難。" },
    { scaleId: "major-pentatonic", priority: 2, reasonJa: "R・2・5 を中心にした透明な響き。" },
    { scaleId: "dorian", priority: 2, reasonJa: "マイナーの流れの中なら ♭3 のドリアンで。" },
  ] },
  { id: "nd-7sus4-diatonic", match: { relation: ["diatonic"], quality: ["7sus4"] }, suggestions: [
    { scaleId: "mixolydian", priority: 1, reasonJa: "7sus4 の基本。4 度がコードトーンなのでアヴォイドではない。" },
  ] },
];

/** ───────────────────────────── 提案の生成 ───────────────────────────── */

export interface SuggestedNote extends ScaleNote {
  isRoot: boolean;
  /** コードトーン（R/3/5/7）か */
  isChordTone: boolean;
  /** コードのテンション（9/11/13/6）か */
  isTension: boolean;
  /** コードトーンの半音上にある音（アヴォイド候補） */
  isAvoid: boolean;
  /** コードにおける役割ラベル（R, 3, ♭7, 9 …） */
  chordLabel?: string;
}

export interface ScaleSuggestion {
  id: string;
  scale: ScaleDef;
  root: NoteName;
  rootPc: PitchClass;
  priority: Priority;
  reasonJa: string;
  notes: SuggestedNote[];
  /** コードトーンをすべて含むか */
  coversChordTones: boolean;
  ruleId: string;
}

const MODE_BY_DEGREE: ScaleId[] = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];

function matches(rule: ScaleRule, a: ChordAnalysis, key: Key): boolean {
  const m = rule.match;
  if (m.quality && !m.quality.includes(a.chord.quality)) return false;
  if (m.relation && !m.relation.includes(a.relation)) return false;
  if (m.interval && !m.interval.includes(a.interval)) return false;
  if (m.keyMode && !m.keyMode.includes(key.mode)) return false;
  if (m.targetMinor !== undefined) {
    if (!a.target || !a.target.chord) return false;
    if (a.target.isMinor !== m.targetMinor) return false;
  }
  if (m.targetUnknown) {
    if (a.target?.chord) return false;
  }
  return true;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export function buildSuggestion(
  scaleId: ScaleId,
  root: NoteName,
  rootPc: PitchClass,
  a: ChordAnalysis,
  priority: Priority,
  reasonJa: string,
  ruleId: string,
): ScaleSuggestion {
  const scale = SCALE_BY_ID[scaleId];
  const chordCore = corePcs(a.chord);
  const chordToneMap = new Map<PitchClass, { label: string; isChordTone: boolean }>();
  for (const t of a.chord.tones) {
    const pc = mod12(a.chord.rootPc + t.semitones);
    if (!chordToneMap.has(pc)) chordToneMap.set(pc, { label: t.label, isChordTone: t.isChordTone });
  }
  const applyAvoid = scale.category === "major-mode";
  const notes: SuggestedNote[] = scaleNotes(scale, root, rootPc).map((n) => {
    const ct = chordToneMap.get(n.pc);
    const isAvoid = applyAvoid && !ct && chordCore.some((c) => mod12(c + 1) === n.pc);
    return {
      ...n,
      isRoot: n.pc === a.chord.rootPc,
      isChordTone: ct?.isChordTone ?? false,
      isTension: ct !== undefined && !ct.isChordTone,
      isAvoid,
      chordLabel: ct?.label,
    };
  });
  const scaleSet = notes.map((n) => n.pc);
  const essential = a.chord.tones.filter((t) => t.isChordTone).map((t) => mod12(a.chord.rootPc + t.semitones));
  return {
    id: `${scaleId}@${rootPc}`,
    scale,
    root,
    rootPc,
    priority,
    reasonJa,
    notes,
    coversChordTones: essential.every((pc) => scaleSet.includes(pc)),
    ruleId,
  };
}

/** コード解析結果から、おすすめスケールを優先度順に返す */
export function suggestScales(a: ChordAnalysis, key: Key, rules: ScaleRule[] = SCALE_RULES): ScaleSuggestion[] {
  const out = new Map<string, ScaleSuggestion & { order: number }>();
  let order = 0;
  const push = (s: ScaleSuggestion) => {
    const existing = out.get(s.id);
    if (!existing || existing.priority > s.priority) out.set(s.id, { ...s, order: existing?.order ?? order++ });
  };

  const targetLabel = a.target?.chord?.symbol ?? a.target?.roman ?? "";
  for (const rule of rules) {
    if (!matches(rule, a, key)) continue;
    for (const sug of rule.suggestions) {
      let root: NoteName = a.chord.root;
      let rootPc: PitchClass = a.chord.rootPc;
      if (sug.rootFrom === "key") {
        root = key.tonic;
        rootPc = key.tonicPc;
      } else if (sug.rootFrom === "target" && a.target) {
        rootPc = a.target.rootPc;
        root = a.target.chord?.root ?? nameInKey(key, rootPc);
      }
      if (sug.rootOffset) {
        rootPc = mod12(rootPc + sug.rootOffset);
        root = transposeNameBySemitones(root, sug.rootOffset);
      }
      const reason = fill(sug.reasonJa, { chord: a.chord.symbol, root: a.chord.root, key: keyLabel(key), target: targetLabel, scaleRoot: root });
      push(buildSuggestion(sug.scaleId, root, rootPc, a, sug.priority, reason, rule.id));
    }
  }

  // 借用和音: ルールに該当しなければ、借用元スケールをコードのルートから並べたモードを提案
  if (a.relation === "borrowed" && ![...out.values()].some((s) => s.priority === 1)) {
    const srcId = a.borrowedFrom ?? (key.mode === "major" ? "aeolian" : "ionian");
    const src = SCALE_BY_ID[srcId];
    if (src.category === "major-mode" && src.parent) {
      const srcPcs = scalePcs(src, key.tonicPc);
      const idx = srcPcs.indexOf(a.chord.rootPc);
      if (idx >= 0) {
        const modeId = MODE_BY_DEGREE[(src.parent.degree - 1 + idx) % 7];
        push(buildSuggestion(modeId, a.chord.root, a.chord.rootPc, a, 1, `借用元（${key.tonic} ${src.nameJa}）の構成音をそのまま ${a.chord.root} から並べたモード。借用元の響きを保てる。`, "borrowed-auto"));
      }
    }
  }

  // コードトーンを含む提案がなければ、含むスケールを探して補う
  if (![...out.values()].some((s) => s.coversChordTones)) {
    const essential = a.chord.tones.filter((t) => t.isChordTone).map((t) => mod12(a.chord.rootPc + t.semitones));
    const priority: Priority = out.size === 0 ? 1 : 2;
    for (const s of Object.values(SCALE_BY_ID)) {
      if (s.category === "bebop") continue;
      if (essential.every((pc) => scalePcs(s, a.chord.rootPc).includes(pc))) {
        push(buildSuggestion(s.id, a.chord.root, a.chord.rootPc, a, priority, "コードトーン（R・3・5・7）をすべて含むスケール。", "fallback-contains"));
      }
    }
  }

  return [...out.values()]
    .sort((x, y) => x.priority - y.priority || Number(y.coversChordTones) - Number(x.coversChordTones) || x.order - y.order)
    .map((s) => {
      const { order: _unused, ...rest } = s;
      void _unused;
      return rest;
    });
}

/** コード進行全体に使える「キーのスケール」 */
export interface KeyScaleSuggestion {
  scale: ScaleDef;
  root: NoteName;
  rootPc: PitchClass;
  priority: Priority;
  reasonJa: string;
  notes: ScaleNote[];
}

export function keyScaleSuggestions(key: Key): KeyScaleSuggestion[] {
  const mk = (id: ScaleId, priority: Priority, reasonJa: string): KeyScaleSuggestion => ({
    scale: SCALE_BY_ID[id],
    root: key.tonic,
    rootPc: key.tonicPc,
    priority,
    reasonJa,
    notes: scaleNotes(SCALE_BY_ID[id], key.tonic, key.tonicPc),
  });
  if (key.mode === "major") {
    return [
      mk("ionian", 1, "キーのメジャースケール。ダイアトニックコードの上なら、この 7 音だけで進行全体を弾ける。"),
      mk("major-pentatonic", 2, "4・7 度を抜いた 5 音。どのダイアトニックコード上でも外れにくい。"),
      mk("minor-pentatonic", 3, "同主調マイナーのペンタ。Ⅰ7・Ⅳ7 を含むブルース進行や、ロックの ♭Ⅶ を含む進行で。"),
      mk("blues", 3, "ブルース進行（Ⅰ7-Ⅳ7-Ⅴ7）では、キーのブルーススケール 1 本で押し切れる。"),
    ];
  }
  return [
    mk("aeolian", 1, "キーのナチュラルマイナースケール。ダイアトニックコードの上ならこの 7 音で進行全体を弾ける。"),
    mk("minor-pentatonic", 1, "マイナーキーのリードの基本。外れる音がない。"),
    mk("blues", 2, "♭5 を加えたブルーススケール。ロック／ブルースの泥くささを。"),
    mk("harmonic-minor", 2, "Ⅴ7 を含むマイナー進行なら、7 度を上げたハーモニックマイナーがドミナント上で特に合う。"),
    mk("dorian", 3, "♭6 を 6 に替えると、クールで明るめのマイナー感（Ⅳ7 を含む進行など）。"),
  ];
}

export { keyScale };
