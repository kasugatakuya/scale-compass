/**
 * スケール提案／コードから指板マーカー用の NoteSpec を作る（純粋関数）
 */
import type { ParsedChord } from "./chord-parser";
import type { NoteSpec } from "./fretboard";
import type { Key } from "./key";
import { mod12, semitonesToDegreeLabel } from "./notes";
import type { KeyScaleSuggestion, ScaleSuggestion } from "./scale-rules";

/** 選択中のスケール提案から。度数ラベルはコードのルート基準 */
export function specsForSuggestion(s: ScaleSuggestion, chord: ParsedChord): NoteSpec[] {
  return s.notes.map((n) => ({
    pc: n.pc,
    name: n.name,
    degree: n.chordLabel ?? semitonesToDegreeLabel(mod12(n.pc - chord.rootPc)),
    kind: n.isRoot ? "root" : n.isChordTone ? "chord-tone" : n.isTension ? "tension" : "scale-tone",
    isAvoid: n.isAvoid,
  }));
}

/** コードトーンのみ（スケール未選択時） */
export function specsForChord(chord: ParsedChord): NoteSpec[] {
  const out: NoteSpec[] = chord.tones.map((t, i) => ({
    pc: mod12(chord.rootPc + t.semitones),
    name: chord.noteNames[i],
    degree: t.label,
    kind: t.role === "R" ? "root" : t.isChordTone ? "chord-tone" : "tension",
  }));
  if (chord.bassPc !== undefined && !out.some((o) => o.pc === chord.bassPc)) {
    out.push({ pc: chord.bassPc, name: chord.bass!, degree: semitonesToDegreeLabel(mod12(chord.bassPc - chord.rootPc)), kind: "tension" });
  }
  return out;
}

/** キーのスケール（トニック基準） */
export function specsForKeyScale(s: KeyScaleSuggestion, key: Key): NoteSpec[] {
  return s.notes.map((n) => ({
    pc: n.pc,
    name: n.name,
    degree: n.degree,
    kind: n.pc === key.tonicPc ? "root" : "scale-tone",
  }));
}
