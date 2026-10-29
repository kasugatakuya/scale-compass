import { describe, expect, it } from "vitest";
import { TUNING_BY_ID } from "@/data/tunings";
import { parseChord } from "../chord-parser";
import { CHORD_QUALITIES, QUALITY_BY_ID } from "../chords";
import { boxPositions, buildMarkers, filterMarkersByPosition, fretOnString, pcAt, positionsOf, threeNotesPerStringPositions } from "../fretboard";
import { mod12 } from "../notes";
import { SCALE_BY_ID, scalePcs } from "../scales";
import { clicksToBars, progressionToTab, scaleToTab, stringLabels, toAsciiTab } from "../tab";
import { tabToSvg } from "../tab-svg";
import { bassChordTonePositions, GUITAR_SHAPES, guitarVoicings } from "../voicings";

const guitar = TUNING_BY_ID["guitar-standard"];
const bass = TUNING_BY_ID["bass4-standard"];
const bass5 = TUNING_BY_ID["bass5-low-b"];
const guitar7 = TUNING_BY_ID["guitar7-standard"];

const chord = (s: string) => {
  const r = parseChord(s);
  if (!r.ok) throw new Error(r.error);
  return r.chord;
};

describe("fretboard", () => {
  it("開放弦と指定フレットの音", () => {
    expect(pcAt(guitar, 0, 0)).toBe(4); // E
    expect(pcAt(guitar, 5, 0)).toBe(4);
    expect(pcAt(guitar, 1, 3)).toBe(0); // A 弦 3fr = C
    expect(pcAt(bass, 0, 5)).toBe(9); // A
    expect(fretOnString(guitar, 0, 0)).toBe(8); // 6 弦の C は 8fr
    expect(fretOnString(guitar, 0, 0, 9)).toBe(20);
  });
  it("ピッチクラスの位置をすべて列挙", () => {
    const pos = positionsOf(guitar, [0], { min: 0, max: 12 });
    expect(pos).toContainEqual({ string: 1, fret: 3, pc: 0, midi: 48 });
    expect(pos).toContainEqual({ string: 5, fret: 8, pc: 0, midi: 72 });
    expect(pos.every((p) => p.pc === 0)).toBe(true);
  });
  it("マーカーの種類はルート > コードトーン > スケール音で優先", () => {
    const markers = buildMarkers(
      guitar,
      [
        { pc: 0, name: "C", degree: "R", kind: "root" },
        { pc: 0, name: "C", degree: "R", kind: "scale-tone" },
        { pc: 4, name: "E", degree: "3", kind: "chord-tone" },
      ],
      { min: 0, max: 5 },
    );
    expect(markers.filter((m) => m.pc === 0).every((m) => m.kind === "root")).toBe(true);
    expect(markers.filter((m) => m.pc === 4).every((m) => m.kind === "chord-tone")).toBe(true);
  });
  it("3NPS ポジションは各弦 3 音で、昇順に並ぶ", () => {
    const pcs = scalePcs(SCALE_BY_ID.ionian, 0);
    const positions = threeNotesPerStringPositions(guitar, pcs);
    expect(positions.length).toBe(7);
    for (const p of positions) {
      expect(p.stringFrets.every((f) => f.length === 3)).toBe(true);
      let last = -1;
      p.stringFrets.forEach((frets, s) => {
        for (const f of frets) {
          const midi = guitar.strings[s] + f;
          expect(midi).toBeGreaterThan(last);
          last = midi;
          expect(pcs).toContain(mod12(midi));
        }
      });
    }
    // 最初のポジションは 6 弦 E (0fr) から始まる
    expect(positions[0].stringFrets[0]).toEqual([0, 1, 3]);
  });
  it("ボックスポジション（マイナーペンタ A）は 5 つ", () => {
    const pcs = scalePcs(SCALE_BY_ID["minor-pentatonic"], 9);
    const positions = boxPositions(guitar, pcs);
    expect(positions.length).toBe(5);
    const box = positions.find((p) => p.range.min === 5)!;
    expect(box.stringFrets).toEqual([[5, 8], [5, 7], [5, 7], [5, 7], [5, 8], [5, 8]]);
    const markers = buildMarkers(guitar, pcs.map((pc) => ({ pc, name: "", degree: "", kind: "scale-tone" as const })), { min: 0, max: 15 });
    const filtered = filterMarkersByPosition(markers, box);
    expect(filtered.length).toBe(12);
  });
  it("ベースでも動く", () => {
    const pcs = scalePcs(SCALE_BY_ID.dorian, 2);
    const positions = threeNotesPerStringPositions(bass, pcs);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions[0].stringFrets.length).toBe(4);
    expect(boxPositions(bass5, pcs).length).toBeGreaterThan(0);
  });
});

describe("voicings", () => {
  it("すべてのギターフォームは正しい構成音を鳴らす", () => {
    for (const q of CHORD_QUALITIES) {
      const shapes = GUITAR_SHAPES[q.id];
      expect(shapes.length, q.id).toBeGreaterThan(0);
      const c = chord(`C${q.suffix.replace("♭", "b").replace("♯", "#").replace(/[()]/g, "")}`);
      const voicings = guitarVoicings(c, guitar, 24);
      expect(voicings.length, q.id).toBe(shapes.length);
      for (const v of voicings) {
        const sounded = v.pcs.filter((p): p is number => p !== null);
        for (const pc of sounded) expect(c.pcs, `${q.id} ${v.nameJa} frets=${v.frets.join(",")}`).toContain(pc);
        // ルートは必ず含む
        expect(sounded, `${q.id} ${v.nameJa}`).toContain(c.rootPc);
        // 7th コードは 7 度を含む
        const seventh = c.tones.find((t) => t.role === "7");
        if (seventh) expect(sounded, `${q.id} ${v.nameJa} 7th`).toContain(mod12(c.rootPc + seventh.semitones));
        // 3 度（または sus の 2/4 度）を含む（11 は省略を許容）
        const third = c.tones.find((t) => t.role === "3" || t.role === "sus" || (q.group === "suspended" && t.role === "9"));
        if (third && q.id !== "11") expect(sounded, `${q.id} ${v.nameJa} 3rd`).toContain(mod12(c.rootPc + third.semitones));
        // ルート弦のフレットが指定どおり
        expect(v.pcs[v.rootString]).toBe(c.rootPc);
        expect(v.frets.filter((f): f is number => f !== null).every((f) => f >= 0)).toBe(true);
      }
    }
  });
  it("フォームは任意のルートへ移動でき、フレットが範囲内", () => {
    const v = guitarVoicings(chord("F#m7"), guitar);
    expect(v.length).toBe(3);
    expect(v[0].frets).toEqual([2, 4, 2, 2, 2, 2]);
    expect(v[1].frets).toEqual([null, 9, 11, 9, 10, 9]);
    const low = guitarVoicings(chord("Emaj7"), guitar);
    expect(low[0].frets).toEqual([0, null, 1, 1, 0, null]);
  });
  it("ドロップ D でも同じ音が鳴るフレットに変換される", () => {
    const dropD = TUNING_BY_ID["guitar-drop-d"];
    const v = guitarVoicings(chord("D"), dropD);
    const eForm = v[0];
    // 6 弦は 2 フレット分上がる
    expect(eForm.frets).toEqual([12, 12, 12, 11, 10, 10]);
    expect(eForm.pcs.filter((p) => p !== null).every((p) => [2, 6, 9].includes(p!))).toBe(true);
    // 半音下げチューニングでは全体が 1 フレット上がる
    const half = guitarVoicings(chord("E"), TUNING_BY_ID["guitar-half-down"]);
    expect(half[0].frets).toEqual([1, 3, 3, 2, 1, 1]);
  });
  it("7 弦ギターは上 6 本にフォームを適用", () => {
    const v = guitarVoicings(chord("Cmaj7"), guitar7);
    expect(v[0].frets.length).toBe(7);
    expect(v[0].frets[0]).toBeNull();
  });
  it("ベースのコードトーン配置", () => {
    const pos = bassChordTonePositions(chord("Cmaj7"), bass);
    expect(pos.map((p) => p.degree)).toEqual(["R", "3", "5", "7", "R"]);
    expect(pos[0]).toMatchObject({ string: 0, fret: 8, pc: 0 });
    for (const p of pos) expect(mod12(bass.strings[p.string] + p.fret)).toBe(p.pc);
    expect(guitarVoicings(chord("C"), bass)).toEqual([]);
  });
});

describe("tab", () => {
  it("弦ラベル", () => {
    expect(stringLabels(guitar)).toEqual(["E", "A", "D", "G", "B", "e"]);
    expect(stringLabels(bass)).toEqual(["E", "A", "D", "G"]);
    expect(stringLabels(TUNING_BY_ID["guitar-half-down"])).toEqual(["D#", "G#", "C#", "F#", "A#", "D#"]);
  });
  it("スケールの上行タブ（ASCII）", () => {
    const pcs = scalePcs(SCALE_BY_ID["minor-pentatonic"], 9);
    const box = boxPositions(guitar, pcs).find((p) => p.range.min === 5)!;
    const bars = scaleToTab(box, "ascending");
    const ascii = toAsciiTab(bars, guitar);
    const lines = ascii.trimEnd().split("\n");
    expect(lines[0].startsWith("e|")).toBe(true);
    expect(lines[5].startsWith("E|-5--8-")).toBe(true);
    expect(ascii).toContain("-5--8-");
    const both = scaleToTab(box, "both");
    expect(both.flatMap((b) => b.columns).length).toBe(12 + 11);
    const desc = scaleToTab(box, "descending");
    expect(desc[0].columns[0].notes[0]).toEqual({ string: 5, fret: 8 });
  });
  it("コード進行のタブ（コード名ラベル付き）", () => {
    const items = ["Dm7", "G7", "Cmaj7"].map((s) => {
      const c = chord(s);
      return { chord: c, voicing: guitarVoicings(c, guitar)[0] };
    });
    const ascii = toAsciiTab(progressionToTab(items), guitar);
    expect(ascii).toContain("Dm7");
    expect(ascii).toContain("G7");
    expect(ascii).toContain("Cmaj7");
    // Dm7 E フォーム 10fr: 10 12 10 10 10 10
    expect(ascii).toMatch(/E\|-10-/);
  });
  it("クリック履歴から小節へ", () => {
    const bars = clicksToBars([{ string: 0, fret: 3 }, { string: 1, fret: 5 }], 8);
    expect(bars.length).toBe(1);
    expect(bars[0].columns.length).toBe(2);
    expect(clicksToBars([])[0].columns.length).toBe(0);
  });
  it("SVG を出力できる", () => {
    const pcs = scalePcs(SCALE_BY_ID.ionian, 0);
    const pos = threeNotesPerStringPositions(guitar, pcs)[0];
    const svg = tabToSvg(scaleToTab(pos), guitar, { title: "C メジャー 3NPS" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("C メジャー 3NPS");
    expect(svg).toContain(">0<");
  });
  it("チューニングごとの弦数でタブが出る", () => {
    const ascii = toAsciiTab(clicksToBars([{ string: 0, fret: 1 }]), bass5);
    expect(ascii.trimEnd().split("\n").length).toBe(5);
    expect(QUALITY_BY_ID["7"].suffix).toBe("7");
  });
});
