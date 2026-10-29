import { describe, expect, it } from "vitest";
import { normalizeSuffix, parseChord, parseProgression, slashChordKind, splitProgression } from "../chord-parser";

const ok = (s: string) => {
  const r = parseChord(s);
  if (!r.ok) throw new Error(`${s}: ${r.error}`);
  return r.chord;
};

describe("chord-parser", () => {
  it("基本的なコードをパースする", () => {
    const c = ok("Dm7");
    expect(c.root).toBe("D");
    expect(c.rootPc).toBe(2);
    expect(c.quality).toBe("m7");
    expect(c.noteNames).toEqual(["D", "F", "A", "C"]);
    expect(c.pcs).toEqual([2, 5, 9, 0]);
    expect(c.symbol).toBe("Dm7");
  });
  it("表記ゆれ: maj7", () => {
    for (const s of ["Cmaj7", "CM7", "C△7", "CΔ7", "C△", "Cma7", "CMaj7", "Cmaj(7)"]) {
      expect(ok(s).quality, s).toBe("maj7");
    }
    expect(ok("CM").quality).toBe("maj");
    expect(ok("Cmaj").quality).toBe("maj");
    expect(ok("Cm").quality).toBe("min");
  });
  it("表記ゆれ: m7b5 / dim / aug / minor", () => {
    for (const s of ["Bm7b5", "Bm7♭5", "Bm7(b5)", "Bm7(♭5)", "Bø", "Bø7", "Bm7-5"]) expect(ok(s).quality, s).toBe("m7b5");
    for (const s of ["Bdim7", "B°7", "Bo7"]) expect(ok(s).quality, s).toBe("dim7");
    for (const s of ["Bdim", "B°"]) expect(ok(s).quality, s).toBe("dim");
    for (const s of ["Caug", "C+", "C(#5)", "C+5"]) expect(ok(s).quality, s).toBe("aug");
    for (const s of ["Am7", "Amin7", "A-7", "Ami7"]) expect(ok(s).quality, s).toBe("m7");
    for (const s of ["AmMaj7", "Am(maj7)", "AmM7", "A-△7", "Am△7"]) expect(ok(s).quality, s).toBe("mMaj7");
  });
  it("表記ゆれ: テンション", () => {
    for (const s of ["G7b9", "G7(b9)", "G7♭9", "G7(♭9)", "G7-9"]) expect(ok(s).quality, s).toBe("7b9");
    for (const s of ["G7#9", "G7(#9)", "G7♯9", "G7+9"]) expect(ok(s).quality, s).toBe("7#9");
    expect(ok("G7#11").quality).toBe("7#11");
    expect(ok("G7b13").quality).toBe("7b13");
    expect(ok("G7alt").quality).toBe("7alt");
    expect(ok("G7(#5)").quality).toBe("7#5");
    expect(ok("G13").quality).toBe("13");
    expect(ok("G11").quality).toBe("11");
    expect(ok("Cadd9").quality).toBe("add9");
    expect(ok("Csus4").quality).toBe("sus4");
    expect(ok("Csus").quality).toBe("sus4");
    expect(ok("Csus2").quality).toBe("sus2");
    expect(ok("C6").quality).toBe("6");
    expect(ok("Cm6").quality).toBe("m6");
    expect(ok("C9").quality).toBe("9");
    expect(ok("Cm9").quality).toBe("m9");
    expect(ok("Cmaj9").quality).toBe("maj9");
    expect(ok("G7sus4").quality).toBe("7sus4");
  });
  it("構成音の役割", () => {
    const g7alt = ok("G7alt");
    expect(g7alt.tones.map((t) => t.label)).toEqual(["R", "3", "♭7", "♭9", "♯9", "♯11", "♭13"]);
    expect(g7alt.noteNames).toEqual(["G", "B", "F", "A♭", "A♯", "C♯", "E♭"]);
    const c13 = ok("C13");
    expect(c13.tones.filter((t) => t.isChordTone).map((t) => t.label)).toEqual(["R", "3", "5", "♭7"]);
    expect(c13.tones.filter((t) => !t.isChordTone).map((t) => t.label)).toEqual(["9", "13"]);
  });
  it("スラッシュコード", () => {
    const c = ok("C/E");
    expect(c.bass).toBe("E");
    expect(c.bassPc).toBe(4);
    expect(c.symbol).toBe("C/E");
    expect(slashChordKind(c)).toBe("inversion");
    const d = ok("G/A");
    expect(slashChordKind(d)).toBe("foreign-bass");
    expect(d.pcs).toContain(9);
    expect(ok("Am7/G").quality).toBe("m7");
    expect(ok("F#m7b5/A").bass).toBe("A");
  });
  it("フラット／シャープのルート", () => {
    expect(ok("Bb7").root).toBe("B♭");
    expect(ok("B♭7").rootPc).toBe(10);
    expect(ok("F#m").root).toBe("F♯");
    expect(ok("Db").rootPc).toBe(1);
    expect(ok("Ebmaj7").noteNames).toEqual(["E♭", "G", "B♭", "D"]);
  });
  it("不正な入力はエラー", () => {
    expect(parseChord("H7").ok).toBe(false);
    expect(parseChord("Cfoo").ok).toBe(false);
    expect(parseChord("").ok).toBe(false);
  });
  it("進行の分割", () => {
    expect(splitProgression("Dm7 | G7 | Cmaj7 | Am7")).toEqual(["Dm7", "G7", "Cmaj7", "Am7"]);
    expect(splitProgression("Dm7, G7,Cmaj7")).toEqual(["Dm7", "G7", "Cmaj7"]);
    expect(splitProgression("Dm7 G7\nCmaj7")).toEqual(["Dm7", "G7", "Cmaj7"]);
    expect(splitProgression("C/E | G/B")).toEqual(["C/E", "G/B"]);
    const results = parseProgression("Dm7 | G7 | Xyz");
    expect(results.map((r) => r.ok)).toEqual([true, true, false]);
  });
  it("normalizeSuffix", () => {
    expect(normalizeSuffix("M7")).toBe("maj7");
    expect(normalizeSuffix("△")).toBe("maj7");
    expect(normalizeSuffix("ø")).toBe("m7b5");
    expect(normalizeSuffix("-7")).toBe("m7");
    expect(normalizeSuffix("7(♭9)")).toBe("7b9");
    expect(normalizeSuffix("+")).toBe("aug");
    expect(normalizeSuffix("m")).toBe("m");
    expect(normalizeSuffix("M")).toBe("maj");
  });
});
