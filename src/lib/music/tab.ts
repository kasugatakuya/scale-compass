/**
 * タブ譜データと ASCII タブの生成。
 */
import type { Tuning } from "@/data/tunings";
import type { ParsedChord } from "./chord-parser";
import type { Position } from "./fretboard";
import { midiToNoteName, type PitchClass } from "./notes";
import type { ChordVoicing } from "./voicings";

export interface TabNote {
  /** 0 = 最低音弦 */
  string: number;
  fret: number;
}

/** 1 拍（縦に並ぶ音）の列 */
export interface TabColumn {
  notes: TabNote[];
  /** 列上部に表示するラベル（コード名など） */
  label?: string;
}

export interface TabBar {
  columns: TabColumn[];
}

export type TabDirection = "ascending" | "descending" | "both";

/** 弦ごとの短い音名ラベル（高音弦の E は小文字 e で区別する習慣） */
export function stringLabels(tuning: Tuning): string[] {
  const names = tuning.strings.map((m) => midiToNoteName(m).replace(/-?\d+$/, "").replace("♯", "#").replace("♭", "b"));
  const highIdx = names.length - 1;
  return names.map((n, i) => {
    if (i === highIdx && n === "E" && names[0] === "E") return "e";
    return n;
  });
}

/** ポジションからスケールの上行／下降タブを作る */
export function scaleToTab(position: Position, direction: TabDirection = "ascending", notesPerColumn = 1): TabBar[] {
  const asc: TabNote[] = [];
  position.stringFrets.forEach((frets, string) => {
    for (const fret of [...frets].sort((a, b) => a - b)) asc.push({ string, fret });
  });
  let seq: TabNote[];
  if (direction === "ascending") seq = asc;
  else if (direction === "descending") seq = [...asc].reverse();
  else seq = [...asc, ...[...asc].reverse().slice(1)];
  const columns: TabColumn[] = seq.map((n) => ({ notes: [n] }));
  // 4 列（または指定）ごとに小節へ分割
  const perBar = Math.max(1, 8 * notesPerColumn);
  const bars: TabBar[] = [];
  for (let i = 0; i < columns.length; i += perBar) bars.push({ columns: columns.slice(i, i + perBar) });
  return bars;
}

/** コードフォームを 1 列（ストローク）に変換 */
export function voicingToColumn(voicing: ChordVoicing, label?: string): TabColumn {
  const notes: TabNote[] = [];
  voicing.frets.forEach((f, string) => {
    if (f !== null) notes.push({ string, fret: f });
  });
  return { notes, label };
}

/** コード進行をコードごとに 1 小節のタブへ（strumsPerBar 回ストローク） */
export function progressionToTab(items: { chord: ParsedChord; voicing: ChordVoicing | null; notes?: TabNote[] }[], strumsPerBar = 1): TabBar[] {
  return items.map(({ chord, voicing, notes }) => {
    const columns: TabColumn[] = [];
    for (let i = 0; i < strumsPerBar; i++) {
      if (voicing) columns.push(voicingToColumn(voicing, i === 0 ? chord.symbol : undefined));
      else if (notes && notes.length > 0) {
        if (i === 0) notes.forEach((n, j) => columns.push({ notes: [n], label: j === 0 ? chord.symbol : undefined }));
      } else columns.push({ notes: [], label: i === 0 ? chord.symbol : undefined });
    }
    return { columns };
  });
}

/** ベースのコードトーン配置をアルペジオ列に */
export function notesToColumns(notes: TabNote[], label?: string): TabColumn[] {
  return notes.map((n, i) => ({ notes: [n], label: i === 0 ? label : undefined }));
}

export interface AsciiTabOptions {
  /** 1 行に入れる小節数 */
  barsPerLine?: number;
  /** 列の最小幅（数字 + ダッシュ） */
  minColumnWidth?: number;
}

/**
 * ASCII タブ。高音弦を上にして出力。
 * e|--5--7--8--|
 * B|-----------|
 */
export function toAsciiTab(bars: TabBar[], tuning: Tuning, options: AsciiTabOptions = {}): string {
  const barsPerLine = options.barsPerLine ?? 4;
  const minWidth = options.minColumnWidth ?? 3;
  const labels = stringLabels(tuning);
  const labelWidth = Math.max(...labels.map((l) => l.length));
  const stringCount = tuning.strings.length;
  const lines: string[] = [];

  for (let b = 0; b < bars.length; b += barsPerLine) {
    const chunk = bars.slice(b, b + barsPerLine);
    const rows: string[] = Array.from({ length: stringCount }, () => "");
    let labelRow = "";
    for (const bar of chunk) {
      for (let s = 0; s < stringCount; s++) rows[s] += "|";
      labelRow += " ";
      for (const col of bar.columns) {
        const width = Math.max(minWidth, ...col.notes.map((n) => String(n.fret).length + 2), (col.label?.length ?? 0) + 1);
        for (let s = 0; s < stringCount; s++) {
          const note = col.notes.find((n) => n.string === s);
          const text = note ? String(note.fret) : "";
          rows[s] += "-" + text + "-".repeat(width - 1 - text.length);
        }
        labelRow += (col.label ?? "") + " ".repeat(Math.max(0, width - (col.label?.length ?? 0)));
      }
    }
    for (let s = 0; s < stringCount; s++) rows[s] += "|";
    if (labelRow.trim().length > 0) lines.push(" ".repeat(labelWidth) + labelRow.trimEnd());
    // 高音弦（index 大）を上に
    for (let s = stringCount - 1; s >= 0; s--) lines.push(labels[s].padEnd(labelWidth) + rows[s]);
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

/** 指板クリックの履歴から列を作る（1 音 1 列） */
export function clicksToBars(notes: TabNote[], perBar = 8): TabBar[] {
  const bars: TabBar[] = [];
  for (let i = 0; i < notes.length; i += perBar) {
    bars.push({ columns: notes.slice(i, i + perBar).map((n) => ({ notes: [n] })) });
  }
  return bars.length > 0 ? bars : [{ columns: [] }];
}

export const pcOfTabNote = (tuning: Tuning, n: TabNote): PitchClass => ((tuning.strings[n.string] + n.fret) % 12 + 12) % 12;
