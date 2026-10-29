import { describe, expect, it } from "vitest";
import { intervalToDegreeLabel, midiToNoteName, noteNameToMidi, parseNoteName, pcToName, preferredAccidentalForKey, transposeName } from "../notes";

describe("notes", () => {
  it("音名をピッチクラスにする", () => {
    expect(parseNoteName("C")).toEqual({ name: "C", pc: 0 });
    expect(parseNoteName("C#")?.pc).toBe(1);
    expect(parseNoteName("D♭")?.pc).toBe(1);
    expect(parseNoteName("Bb")).toEqual({ name: "B♭", pc: 10 });
    expect(parseNoteName("E#")?.pc).toBe(5);
    expect(parseNoteName("Cb")?.pc).toBe(11);
    expect(parseNoteName("H")).toBeNull();
    expect(parseNoteName("c")).toBeNull();
  });
  it("ピッチクラスを音名にする", () => {
    expect(pcToName(1)).toBe("C♯");
    expect(pcToName(1, "flat")).toBe("D♭");
    expect(pcToName(13)).toBe("C♯");
  });
  it("tonal で正しいスペリングに移調する", () => {
    expect(transposeName("F♯", "7M")).toBe("E♯");
    expect(transposeName("D♭", "3M")).toBe("F");
    expect(transposeName("G", "4d")).toBe("C♭");
    expect(transposeName("C♯", "2A")).toBe("E"); // D𝄪 → E に単純化
    expect(transposeName("B♭", "7m")).toBe("A♭");
  });
  it("度数ラベル", () => {
    expect(intervalToDegreeLabel("1P")).toBe("R");
    expect(intervalToDegreeLabel("3m")).toBe("♭3");
    expect(intervalToDegreeLabel("4A")).toBe("♯4");
    expect(intervalToDegreeLabel("5d")).toBe("♭5");
    expect(intervalToDegreeLabel("7m")).toBe("♭7");
    expect(intervalToDegreeLabel("9m", true)).toBe("♭9");
    expect(intervalToDegreeLabel("9A", true)).toBe("♯9");
    expect(intervalToDegreeLabel("11A", true)).toBe("♯11");
    expect(intervalToDegreeLabel("13m", true)).toBe("♭13");
    expect(intervalToDegreeLabel("2M", false)).toBe("2");
  });
  it("調号に応じた記号の優先", () => {
    expect(preferredAccidentalForKey(5, "major")).toBe("flat"); // F
    expect(preferredAccidentalForKey(7, "major")).toBe("sharp"); // G
    expect(preferredAccidentalForKey(2, "minor")).toBe("flat"); // Dm → F major
    expect(preferredAccidentalForKey(4, "minor")).toBe("sharp"); // Em → G major
  });
  it("MIDI と音名", () => {
    expect(midiToNoteName(40)).toBe("E2");
    expect(midiToNoteName(28)).toBe("E1");
    expect(noteNameToMidi("E2")).toBe(40);
    expect(noteNameToMidi("Bb1")).toBe(34);
    expect(noteNameToMidi("foo")).toBeNull();
  });
});
