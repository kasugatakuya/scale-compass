import { describe, expect, it } from "vitest";
import { degreeInfo, diatonicChords, makeKey, relativeKey, romanNumeral } from "../key";
import { SCALE_BY_ID, SCALES, scaleNotes, scalePcs, scalesContaining } from "../scales";

describe("scales", () => {
  it("すべてのスケールは 1P から始まり、重複のない半音集合を持つ", () => {
    for (const s of SCALES) {
      expect(s.intervals[0]).toBe("1P");
      const pcs = scalePcs(s, 0);
      expect(new Set(pcs).size, s.id).toBe(pcs.length);
      if (s.labels) expect(s.labels.length, s.id).toBe(s.intervals.length);
    }
  });
  it("代表的なスケールの構成音", () => {
    expect(scaleNotes(SCALE_BY_ID.dorian, "D", 2).map((n) => n.name)).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
    expect(scaleNotes(SCALE_BY_ID.lydian, "F", 5).map((n) => n.name)).toEqual(["F", "G", "A", "B", "C", "D", "E"]);
    expect(scaleNotes(SCALE_BY_ID.altered, "G", 7).map((n) => n.name)).toEqual(["G", "A♭", "A♯", "B", "C♯", "E♭", "F"]);
    expect(scaleNotes(SCALE_BY_ID.altered, "G", 7).map((n) => n.degree)).toEqual(["R", "♭9", "♯9", "3", "♯11", "♭13", "♭7"]);
    expect(scalePcs(SCALE_BY_ID["combination-of-diminished"], 7)).toEqual([7, 8, 10, 11, 1, 2, 4, 5]);
    expect(scaleNotes(SCALE_BY_ID["phrygian-dominant"], "E", 4).map((n) => n.name)).toEqual(["E", "F", "G♯", "A", "B", "C", "D"]);
    expect(scalePcs(SCALE_BY_ID.blues, 9)).toEqual([9, 0, 2, 3, 4, 7]);
    expect(scalePcs(SCALE_BY_ID["whole-tone"], 0)).toEqual([0, 2, 4, 6, 8, 10]);
  });
  it("コードトーンを含むスケールを探せる", () => {
    const ids = scalesContaining([0, 4, 7, 10], 0).map((s) => s.id);
    expect(ids).toContain("mixolydian");
    expect(ids).toContain("lydian-b7");
    expect(ids).not.toContain("ionian");
  });
});

describe("key", () => {
  it("ダイアトニックコード（C メジャー）", () => {
    const key = makeKey("C", "major");
    const d = diatonicChords(key);
    expect(d.map((c) => c.root)).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(d.map((c) => c.romanSeventh)).toEqual(["Ⅰmaj7", "Ⅱm7", "Ⅲm7", "Ⅳmaj7", "Ⅴ7", "Ⅵm7", "Ⅶm7♭5"]);
    expect(d.map((c) => c.func)).toEqual(["tonic", "subdominant", "tonic", "subdominant", "dominant", "tonic", "dominant"]);
  });
  it("ダイアトニックコード（A マイナー）", () => {
    const key = makeKey("A", "minor");
    const d = diatonicChords(key);
    expect(d.map((c) => c.root)).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(d.map((c) => c.romanSeventh)).toEqual(["Ⅰm7", "Ⅱm7♭5", "♭Ⅲmaj7", "Ⅳm7", "Ⅴm7", "♭Ⅵmaj7", "♭Ⅶ7"]);
  });
  it("F♯ メジャーのスペリング", () => {
    const d = diatonicChords(makeKey("F♯", "major"));
    expect(d.map((c) => c.root)).toEqual(["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯"]);
  });
  it("ローマ数字", () => {
    const key = makeKey("C", "major");
    expect(romanNumeral(key, 2, "m7")).toBe("Ⅱm7");
    expect(romanNumeral(key, 10, "7")).toBe("♭Ⅶ7");
    expect(romanNumeral(key, 1, "7")).toBe("♭Ⅱ7");
    expect(romanNumeral(key, 1, "dim7")).toBe("♯Ⅰdim7");
    expect(romanNumeral(key, 6, "dim7")).toBe("♯Ⅳdim7");
    expect(romanNumeral(key, 8, "maj7")).toBe("♭Ⅵmaj7");
    expect(degreeInfo(key, 10)).toEqual({ degree: 7, accidental: "♭", interval: 10 });
  });
  it("関係調", () => {
    expect(relativeKey(makeKey("C", "major"))).toMatchObject({ tonic: "A", mode: "minor" });
    expect(relativeKey(makeKey("A", "minor"))).toMatchObject({ tonic: "C", mode: "major" });
    expect(relativeKey(makeKey("E♭", "major")).tonic).toBe("C");
  });
});
