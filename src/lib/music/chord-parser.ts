/**
 * コードネームのパース。表記ゆれ（M7 / maj7 / △7、m7b5 / ø、dim / ° など）を正規化する。
 */
import { CHORD_QUALITIES, type ChordQuality, type ChordTone, chordTonesOf, QUALITY_BY_ID } from "./chords";
import { mod12, type NoteName, parseNoteName, type PitchClass, transposeName } from "./notes";

export interface ParsedChord {
  /** 入力そのまま */
  input: string;
  /** 正規化した表記。例: "Dm7", "Bm7♭5", "C/E" */
  symbol: string;
  root: NoteName;
  rootPc: PitchClass;
  quality: ChordQuality;
  /** スラッシュコードのベース音 */
  bass?: NoteName;
  bassPc?: PitchClass;
  /** 構成音（ルートからの情報） */
  tones: ChordTone[];
  /** 構成音の音名（ルートのスペリングに合わせる） */
  noteNames: NoteName[];
  /** 構成音のピッチクラス集合（ベース音が構成音外なら含める） */
  pcs: PitchClass[];
}

export type ParseResult = { ok: true; chord: ParsedChord } | { ok: false; input: string; error: string };

const ALIAS_TO_QUALITY: Map<string, ChordQuality> = new Map();
for (const def of CHORD_QUALITIES) for (const alias of def.aliases) ALIAS_TO_QUALITY.set(alias, def.id);

/** サフィックス（ルート音名の後ろ）の表記ゆれを正規化して小文字 ASCII にする */
export function normalizeSuffix(rawSuffix: string): string {
  let s = rawSuffix.normalize("NFKC").trim();
  s = s.replace(/[()\s]/g, "");
  s = s.replace(/♯/g, "#").replace(/♭/g, "b");
  // △ / Δ : 数字が続かなければ maj7 の意味
  s = s.replace(/[△Δ](?!\d)/g, "maj7").replace(/[△Δ]/g, "maj");
  // ø : ハーフディミニッシュ
  s = s.replace(/[øØ]7?/g, "m7b5");
  // ° º ∘ o : ディミニッシュ（o は先頭のみ）
  s = s.replace(/[°º∘]/g, "dim").replace(/^o(?=7|$)/, "dim");
  // マイナー表記: min / mi / - / M の判別（M は大文字＝メジャー）
  s = s.replace(/^(min|mi)(?=\d|$|maj|M)/, "m");
  s = s.replace(/^-(?=\d|$|maj|M|△)/, "m");
  // マイナーメジャーセブンス: mM7 / m(maj7) / mmaj7 / -△7
  s = s.replace(/^mM(?=7|9)/, "mmaj");
  // メジャー: M / Maj / MAJ / ma / Ma （m 単体は小文字=マイナーなので触らない）
  s = s.replace(/^(Maj|MAJ|Ma|ma|M)(?=\d|$)/, "maj");
  // "maj" 単体 → メジャートライアド。"maj7" 等はそのまま
  s = s.toLowerCase();
  // + はオーギュメント。+5 / +7 / +9 / +11 の形はエイリアス側で処理
  s = s.replace(/^\+(?=$|7)/, "aug").replace(/^aug7$/, "7#5");
  // "7(#9)" → "7#9" は括弧除去で済んでいる。"7-9" 等はエイリアスで処理
  return s;
}

/** 単一コードをパース */
export function parseChord(input: string): ParseResult {
  const trimmed = input.normalize("NFKC").trim();
  if (!trimmed) return { ok: false, input, error: "空の入力です" };
  const m = /^([A-G])(♯|#|♭|b)?(.*?)(?:\/([A-G])(♯|#|♭|b)?)?$/.exec(trimmed);
  if (!m) return { ok: false, input, error: `コードとして読めません: ${trimmed}` };
  const rootParsed = parseNoteName(`${m[1]}${m[2] ?? ""}`);
  if (!rootParsed) return { ok: false, input, error: `ルート音が不正です: ${trimmed}` };
  const suffix = normalizeSuffix(m[3] ?? "");
  const quality = ALIAS_TO_QUALITY.get(suffix);
  if (quality === undefined) return { ok: false, input, error: `未対応のコードタイプです: ${m[3]}` };

  const tones = chordTonesOf(quality);
  const noteNames = tones.map((t) => transposeName(rootParsed.name, t.interval));
  const pcs: PitchClass[] = [];
  for (const t of tones) {
    const pc = mod12(rootParsed.pc + t.semitones);
    if (!pcs.includes(pc)) pcs.push(pc);
  }

  let bass: NoteName | undefined;
  let bassPc: PitchClass | undefined;
  if (m[4]) {
    const bassParsed = parseNoteName(`${m[4]}${m[5] ?? ""}`);
    if (!bassParsed) return { ok: false, input, error: `ベース音が不正です: ${trimmed}` };
    bass = bassParsed.name;
    bassPc = bassParsed.pc;
    if (!pcs.includes(bassPc)) pcs.push(bassPc);
  }

  const symbol = `${rootParsed.name}${QUALITY_BY_ID[quality].suffix}${bass ? `/${bass}` : ""}`;
  return {
    ok: true,
    chord: { input, symbol, root: rootParsed.name, rootPc: rootParsed.pc, quality, bass, bassPc, tones, noteNames, pcs },
  };
}

/**
 * コード進行文字列を分割してパースする。
 * 区切り: "|" , "," , 改行, 連続スペース。"Dm7 G7 Cmaj7" のような空白区切りも許容。
 */
export function splitProgression(text: string): string[] {
  return text
    .normalize("NFKC")
    .split(/[|,\n\r→]+|\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "-" && s !== "%");
}

export function parseProgression(text: string): ParseResult[] {
  return splitProgression(text).map(parseChord);
}

/** スラッシュコードの判定: ベース音がコードトーンなら転回形 */
export function slashChordKind(chord: ParsedChord): "none" | "inversion" | "foreign-bass" {
  if (chord.bassPc === undefined) return "none";
  const chordPcs = chord.tones.map((t) => mod12(chord.rootPc + t.semitones));
  return chordPcs.includes(chord.bassPc) ? "inversion" : "foreign-bass";
}

/** ルート音名と品質からコードシンボルを組み立てる */
export function buildChordSymbol(root: NoteName, quality: ChordQuality, bass?: NoteName): string {
  return `${root}${QUALITY_BY_ID[quality].suffix}${bass ? `/${bass}` : ""}`;
}
