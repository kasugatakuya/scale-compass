/**
 * コード進行の解析: 各コードがキーの中でどんな役割か（ダイアトニック／セカンダリードミナント／借用など）
 */
import type { ParsedChord } from "./chord-parser";
import { type ChordQuality, isDominantQuality, isMinorQuality, QUALITY_BY_ID } from "./chords";
import { degreeInfo, diatonicChords, type HarmonicFunction, type Key, keyScalePcs, parallelKey, romanForInterval } from "./key";
import { mod12, type PitchClass } from "./notes";
import { SCALE_BY_ID, type ScaleId, scalePcs } from "./scales";

export type Relation =
  | "diatonic"
  | "secondary-dominant"
  | "tritone-substitution"
  | "borrowed"
  | "passing-diminished"
  | "secondary-ii"
  | "non-diatonic";

export const RELATION_LABEL_JA: Record<Relation, string> = {
  diatonic: "ダイアトニック",
  "secondary-dominant": "セカンダリードミナント",
  "tritone-substitution": "裏コード",
  borrowed: "借用和音（モーダルインターチェンジ）",
  "passing-diminished": "経過ディミニッシュ",
  "secondary-ii": "関連Ⅱm7",
  "non-diatonic": "ノンダイアトニック",
};

export interface ChordAnalysis {
  index: number;
  chord: ParsedChord;
  /** 例: "Ⅱm7", "♭Ⅶ7", "Ⅴ7/Ⅱ" */
  roman: string;
  /** 1〜7 */
  degree: number;
  accidental: "" | "♭" | "♯";
  /** トニックからの半音数 */
  interval: number;
  isDiatonic: boolean;
  /** ダイアトニック判定の出典 */
  diatonicSource?: "natural" | "harmonic-minor" | "melodic-minor";
  /** テンションがキー外（Ⅴ7alt など）か */
  hasAlteredTensions?: boolean;
  func: HarmonicFunction;
  relation: Relation;
  /** 借用元のスケール（同主調の各モードなど） */
  borrowedFrom?: ScaleId;
  /** セカンダリードミナント等のターゲット */
  target?: { chord?: ParsedChord; rootPc: PitchClass; roman: string; isMinor: boolean };
  /** 日本語の説明 */
  explanationJa: string;
}

const isSubset = (pcs: PitchClass[], set: PitchClass[]) => pcs.every((p) => set.includes(p));

/** スラッシュコードのベース音を除いた「コード本体」のピッチクラス */
export function corePcs(chord: ParsedChord): PitchClass[] {
  return chord.tones.map((t) => mod12(chord.rootPc + t.semitones));
}

/** 判定に使う骨格（R・3・5・7。ドミナント系は 5 度を除き、テンションは含めない） */
export function essentialPcs(chord: ParsedChord): PitchClass[] {
  const dom = isDominantQuality(chord.quality);
  return chord.tones.filter((t) => t.isChordTone && !(dom && t.role === "5")).map((t) => mod12(chord.rootPc + t.semitones));
}

function chordIsMinorish(q: ChordQuality): boolean {
  return isMinorQuality(q) || q === "m7b5" || q === "dim" || q === "dim7";
}

function funcForDiatonic(key: Key, interval: number): HarmonicFunction {
  const d = diatonicChords(key).find((c) => c.interval === interval);
  return d?.func ?? "other";
}

/** 同主調での機能。借用和音の機能表示に使う */
function borrowedFunction(key: Key, interval: number): HarmonicFunction {
  const p = parallelKey(key);
  const d = diatonicChords(p).find((c) => c.interval === interval);
  if (d) return d.func;
  if (interval === 7 || interval === 11) return "dominant";
  if (interval === 5 || interval === 2 || interval === 8) return "subdominant";
  return "other";
}

const modeLabel = (key: Key) => (key.mode === "major" ? "メジャー" : "マイナー");

/** 借用元の候補（トニックを共有する各モード）。順番＝優先度 */
function borrowSources(key: Key): ScaleId[] {
  return key.mode === "major"
    ? ["aeolian", "mixolydian", "dorian", "phrygian", "lydian", "harmonic-minor", "melodic-minor"]
    : ["ionian", "dorian", "mixolydian", "lydian", "phrygian", "harmonic-minor", "melodic-minor"];
}

function findBorrowSource(key: Key, pcs: PitchClass[]): ScaleId | null {
  for (const id of borrowSources(key)) if (isSubset(pcs, scalePcs(SCALE_BY_ID[id], key.tonicPc))) return id;
  return null;
}

function sourceLabel(key: Key, id: ScaleId): string {
  if (id === "aeolian") return `同主調（${key.tonic} マイナー）`;
  if (id === "ionian") return `同主調（${key.tonic} メジャー）`;
  return `${key.tonic} ${SCALE_BY_ID[id].nameJa.replace(/（.*?）/g, "")}`;
}

function romanOf(key: Key, chord: ParsedChord): string {
  const { interval } = degreeInfo(key, chord.rootPc);
  return romanForInterval(interval, key.mode, chord.quality) + QUALITY_BY_ID[chord.quality].suffix;
}

export function analyzeChord(chords: ParsedChord[], index: number, key: Key): ChordAnalysis {
  const chord = chords[index];
  const next = chords[index + 1];
  const prev = chords[index - 1];
  const pcs = corePcs(chord);
  const essential = essentialPcs(chord);
  const { degree, accidental, interval } = degreeInfo(key, chord.rootPc);
  const q = chord.quality;
  const suffix = QUALITY_BY_ID[q].suffix;
  const romanBase = romanForInterval(interval, key.mode, q);
  const roman = romanBase + suffix;
  const keyPcs = keyScalePcs(key);
  const base = { index, chord, roman, degree, accidental, interval };
  const fullyDiatonic = isSubset(pcs, keyPcs);

  // 1. ダイアトニック（骨格がキーの基本スケールに含まれる。テンションのみキー外なら「オルタード付き」扱い）
  if (isSubset(essential, keyPcs) && keyPcs.includes(chord.rootPc)) {
    return {
      ...base,
      isDiatonic: true,
      diatonicSource: "natural",
      hasAlteredTensions: !fullyDiatonic,
      func: funcForDiatonic(key, interval),
      relation: "diatonic",
      explanationJa: fullyDiatonic
        ? `${key.tonic} ${modeLabel(key)}のダイアトニックコード（${roman}）。キーのスケールの構成音だけで作られています。`
        : `ダイアトニックの ${romanBase}7 にキー外のテンション（オルタードテンション）を加えた形。骨格（R・3・7）はキー内なので役割は変わらず、響きだけ緊張感が増します。`,
    };
  }

  // 1b. マイナーキー: ハーモニックマイナー／メロディックマイナー由来（Ⅰ・Ⅴ・Ⅶ・♭Ⅲ）
  if (key.mode === "minor" && [0, 3, 7, 11].includes(interval)) {
    const hm = scalePcs(SCALE_BY_ID["harmonic-minor"], key.tonicPc);
    const mm = scalePcs(SCALE_BY_ID["melodic-minor"], key.tonicPc);
    if (isSubset(essential, hm)) {
      return {
        ...base,
        isDiatonic: true,
        diatonicSource: "harmonic-minor",
        hasAlteredTensions: !isSubset(pcs, hm),
        func: interval === 7 || interval === 11 ? "dominant" : "tonic",
        relation: "diatonic",
        explanationJa: `ハーモニックマイナー由来のコード（${roman}）。マイナーキーでは第 7 音を半音上げて、ドミナントの力を強めます。`,
      };
    }
    if (isSubset(essential, mm)) {
      return {
        ...base,
        isDiatonic: true,
        diatonicSource: "melodic-minor",
        hasAlteredTensions: !isSubset(pcs, mm),
        func: interval === 7 ? "dominant" : "tonic",
        relation: "diatonic",
        explanationJa: `メロディックマイナー由来のコード（${roman}）。6・7 音を半音上げたマイナースケールから生まれます。`,
      };
    }
  }

  // 2. ドミナント系の非ダイアトニック
  if (isDominantQuality(q)) {
    // 2a. 次のコードへ完全 4 度上行（セカンダリードミナント）
    if (next && mod12(next.rootPc - chord.rootPc) === 5) {
      const targetBase = romanForInterval(degreeInfo(key, next.rootPc).interval, key.mode, next.quality);
      const targetRoman = romanOf(key, next);
      return {
        ...base,
        roman: `Ⅴ7/${targetBase}`,
        isDiatonic: false,
        func: "dominant",
        relation: "secondary-dominant",
        target: { chord: next, rootPc: next.rootPc, roman: targetRoman, isMinor: chordIsMinorish(next.quality) },
        explanationJa: `次の ${next.symbol}（${targetRoman}）に対するドミナント（Ⅴ7）として働くセカンダリードミナント（${roman} ＝ Ⅴ7/${targetBase}）。一時的に ${next.root} をトニックと見立てます。`,
      };
    }
    // 2b. 次のコードへ半音下行（裏コード）
    if (next && mod12(next.rootPc - chord.rootPc) === 11) {
      const targetRoman = romanOf(key, next);
      const origDomRoot = mod12(chord.rootPc + 6);
      const origRoman = romanForInterval(mod12(origDomRoot - key.tonicPc), key.mode, "7") + "7";
      return {
        ...base,
        isDiatonic: false,
        func: "dominant",
        relation: "tritone-substitution",
        target: { chord: next, rootPc: next.rootPc, roman: targetRoman, isMinor: chordIsMinorish(next.quality) },
        explanationJa: `${next.symbol}（${targetRoman}）へ半音上から下りて解決する裏コード（トライトーン・サブスティテューション）。本来の ${origRoman} と 3rd・7th（トライトーン）を共有しています。`,
      };
    }
    // 2c. マイナーキーの Ⅳ7（ドリアン／マイナーブルース的な借用）
    if (key.mode === "minor" && interval === 5) {
      return {
        ...base,
        isDiatonic: false,
        func: "subdominant",
        relation: "borrowed",
        borrowedFrom: "dorian",
        explanationJa: `マイナーキーの Ⅳ7。同主調のドリアン（6 度が長い）から借りた、マイナーブルースの定番コードです。`,
      };
    }
    // 2d. 同主調からの借用（♭Ⅶ7 など）
    const parallelPcs = keyScalePcs(parallelKey(key));
    if (isSubset(pcs, parallelPcs)) {
      return {
        ...base,
        isDiatonic: false,
        func: borrowedFunction(key, interval),
        relation: "borrowed",
        borrowedFrom: key.mode === "major" ? "aeolian" : "ionian",
        explanationJa: `同主調（${key.tonic} ${key.mode === "major" ? "マイナー" : "メジャー"}）から借りてきたコード（${roman}）。モーダルインターチェンジで一瞬だけ色を変えます。`,
      };
    }
    // 2e. 解決先が省略されたセカンダリードミナント（ダイアトニックコードの完全 5 度上）
    const potentialTarget = mod12(chord.rootPc + 5);
    const dia = diatonicChords(key).find((c) => c.rootPc === potentialTarget);
    if (dia && dia.degree !== 1) {
      const targetBase = romanForInterval(dia.interval, key.mode, dia.triad);
      return {
        ...base,
        roman: `Ⅴ7/${targetBase}`,
        isDiatonic: false,
        func: "dominant",
        relation: "secondary-dominant",
        target: { rootPc: dia.rootPc, roman: dia.romanSeventh, isMinor: chordIsMinorish(dia.seventh) },
        explanationJa: `${dia.root}（${dia.romanSeventh}）へ向かうセカンダリードミナント（${roman} ＝ Ⅴ7/${targetBase}）。直後に解決していなくても、その響きを借りています。`,
      };
    }
    // 2f. ♭Ⅱ7 は Ⅴ7 の裏コード
    if (interval === 1) {
      return {
        ...base,
        isDiatonic: false,
        func: "dominant",
        relation: "tritone-substitution",
        target: { rootPc: key.tonicPc, roman: "Ⅰ", isMinor: key.mode === "minor" },
        explanationJa: `Ⅴ7 の裏コード（♭Ⅱ7）。Ⅴ7 とトライトーンを共有し、Ⅰへ半音上から解決します。`,
      };
    }
    return {
      ...base,
      isDiatonic: false,
      func: interval === 5 ? "subdominant" : "other",
      relation: "non-diatonic",
      explanationJa:
        interval === 5
          ? `ブルースの Ⅳ7（${roman}）。キーの 3 度を ♭3 にするブルーノートを含み、Ⅰ7-Ⅳ7-Ⅴ7 のブルース進行で使われます。`
          : `キーに含まれないドミナント 7th（${roman}）。ブルース的な響きや、転調の入口として使われます。`,
    };
  }

  // 3. ディミニッシュ系
  if (q === "dim" || q === "dim7") {
    if (next && mod12(next.rootPc - chord.rootPc) === 1) {
      const targetRoman = romanOf(key, next);
      return {
        ...base,
        isDiatonic: false,
        func: "dominant",
        relation: "passing-diminished",
        target: { chord: next, rootPc: next.rootPc, roman: targetRoman, isMinor: chordIsMinorish(next.quality) },
        explanationJa: `半音上の ${next.symbol}（${targetRoman}）へ滑り込む経過ディミニッシュ。${next.root} に対する Ⅴ7(♭9) のルート省略形とも解釈できます。`,
      };
    }
    if (prev && mod12(chord.rootPc - prev.rootPc) === 1 && next && mod12(chord.rootPc - next.rootPc) === 1) {
      return {
        ...base,
        isDiatonic: false,
        func: "other",
        relation: "passing-diminished",
        explanationJa: `半音上から下りる経過ディミニッシュ。前後のコードを滑らかにつなぎます。`,
      };
    }
    const src = findBorrowSource(key, pcs);
    if (src) {
      return {
        ...base,
        isDiatonic: false,
        func: interval === 11 ? "dominant" : "subdominant",
        relation: "borrowed",
        borrowedFrom: src,
        explanationJa: `${sourceLabel(key, src)}から借りたディミニッシュコード（${roman}）。`,
      };
    }
    return {
      ...base,
      isDiatonic: false,
      func: "other",
      relation: "non-diatonic",
      explanationJa: `キー外のディミニッシュコード（${roman}）。経過音的に使われるか、代理ドミナントとして働きます。`,
    };
  }

  // 4. 関連Ⅱm7（次のコードがドミナントで、その Ⅱ にあたる）
  if ((q === "m7" || q === "m7b5" || q === "min" || q === "m9") && next && isDominantQuality(next.quality) && mod12(next.rootPc - chord.rootPc) === 5) {
    const afterNext = chords[index + 2];
    const targetPc = mod12(next.rootPc + 5);
    const dia = diatonicChords(key).find((c) => c.rootPc === targetPc);
    const resolved = afterNext && afterNext.rootPc === targetPc ? afterNext : undefined;
    const targetRoman = resolved ? romanOf(key, resolved) : dia?.romanSeventh ?? romanForInterval(mod12(targetPc - key.tonicPc), key.mode);
    return {
      ...base,
      isDiatonic: false,
      func: "subdominant",
      relation: "secondary-ii",
      target: { chord: resolved, rootPc: targetPc, roman: targetRoman, isMinor: q === "m7b5" },
      explanationJa: `次の ${next.symbol} とセットで ${targetRoman} へ向かう「Ⅱ-Ⅴ」の Ⅱ にあたるコード（関連Ⅱm7）。${q === "m7b5" ? "m7♭5 なので、解決先はマイナーの響きです。" : ""}`,
    };
  }

  // 5. 借用和音（同主調の各モード、ハーモニック／メロディックマイナーから）
  const src = findBorrowSource(key, pcs);
  if (src) {
    const sdm = key.mode === "major" && (interval === 5 || interval === 8 || interval === 2 || interval === 10);
    return {
      ...base,
      isDiatonic: false,
      func: borrowedFunction(key, interval),
      relation: "borrowed",
      borrowedFrom: src,
      explanationJa: `${sourceLabel(key, src)}から借りてきたコード（${roman}）。${sdm ? "サブドミナントマイナー系の、少し陰りのある響きです。" : key.mode === "minor" ? "マイナーキーに明るさを差し込む効果があります。" : "モーダルインターチェンジで一瞬だけ色を変えます。"}`,
    };
  }

  return {
    ...base,
    isDiatonic: false,
    func: "other",
    relation: "non-diatonic",
    explanationJa: `キーのスケールに含まれないノンダイアトニックコード（${roman}）。コードトーンを基準にスケールを選びます。`,
  };
}

export function analyzeProgression(chords: ParsedChord[], key: Key): ChordAnalysis[] {
  return chords.map((_, i) => analyzeChord(chords, i, key));
}
