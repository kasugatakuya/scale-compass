import { describe, expect, it } from "vitest";
import { analyzeProgression } from "../analysis";
import { parseChord, type ParsedChord } from "../chord-parser";
import { makeKey } from "../key";
import { keyScaleSuggestions, SCALE_RULES, suggestScales } from "../scale-rules";
import { SCALE_BY_ID } from "../scales";

const chords = (...names: string[]): ParsedChord[] =>
  names.map((n) => {
    const r = parseChord(n);
    if (!r.ok) throw new Error(r.error);
    return r.chord;
  });

const C = makeKey("C", "major");
const Am = makeKey("A", "minor");

const topIds = (names: string[], index: number, key = C, n = 3) => {
  const a = analyzeProgression(chords(...names), key);
  return suggestScales(a[index], key).slice(0, n).map((s) => `${s.scale.id}@${s.root}`);
};
const allIds = (names: string[], index: number, key = C) => {
  const a = analyzeProgression(chords(...names), key);
  return suggestScales(a[index], key).map((s) => s.scale.id);
};

describe("analysis: ダイアトニック", () => {
  const prog = ["Dm7", "G7", "Cmaj7", "Am7", "Bm7b5", "Em7", "Fmaj7"];
  const a = analyzeProgression(chords(...prog), C);
  it("ローマ数字と機能", () => {
    expect(a.map((x) => x.roman)).toEqual(["Ⅱm7", "Ⅴ7", "Ⅰmaj7", "Ⅵm7", "Ⅶm7♭5", "Ⅲm7", "Ⅳmaj7"]);
    expect(a.map((x) => x.func)).toEqual(["subdominant", "dominant", "tonic", "tonic", "dominant", "tonic", "subdominant"]);
    expect(a.every((x) => x.relation === "diatonic")).toBe(true);
  });
  it("Dm7 → ドリアン", () => {
    expect(topIds(prog, 0)[0]).toBe("dorian@D");
  });
  it("G7 → ミクソリディアン、オルタード、コンディミ", () => {
    const ids = allIds(prog, 1);
    expect(ids[0]).toBe("mixolydian");
    expect(ids.slice(0, 3)).toEqual(expect.arrayContaining(["altered", "combination-of-diminished"]));
  });
  it("Cmaj7 → アイオニアン／リディアン", () => {
    const ids = allIds(prog, 2);
    expect(ids[0]).toBe("ionian");
    expect(ids).toContain("lydian");
    expect(ids).toContain("major-pentatonic");
  });
  it("Am7 → エオリアン（ドリアンも候補）", () => {
    const ids = allIds(prog, 3);
    expect(ids[0]).toBe("aeolian");
    expect(ids).toContain("dorian");
    expect(ids).toContain("minor-pentatonic");
  });
  it("Bm7♭5 → ロクリアン／ロクリアン♯2", () => {
    expect(allIds(prog, 4).slice(0, 2)).toEqual(["locrian", "locrian-#2"]);
  });
  it("Em7 → フリジアン、Fmaj7 → リディアン", () => {
    expect(allIds(prog, 5)[0]).toBe("phrygian");
    expect(allIds(prog, 6)[0]).toBe("lydian");
  });
  it("アヴォイドノートの判定（Cmaj7 のアイオニアンでは F）", () => {
    const s = suggestScales(a[2], C)[0];
    expect(s.scale.id).toBe("ionian");
    expect(s.notes.filter((n) => n.isAvoid).map((n) => n.name)).toEqual(["F"]);
    expect(s.notes.filter((n) => n.isChordTone).map((n) => n.name)).toEqual(["C", "E", "G", "B"]);
    expect(s.coversChordTones).toBe(true);
  });
});

describe("analysis: ノンダイアトニック", () => {
  it("G7alt → オルタード／コンディミ", () => {
    const ids = allIds(["Dm7", "G7alt", "Cmaj7"], 1);
    expect(ids[0]).toBe("altered");
    expect(ids[1]).toBe("combination-of-diminished");
    const a = analyzeProgression(chords("Dm7", "G7alt", "Cmaj7"), C)[1];
    expect(a.roman).toBe("Ⅴ7alt");
    expect(a.func).toBe("dominant");
  });
  it("A7 → Dm7 はセカンダリードミナント Ⅴ7/Ⅱ、HmP5↓ が第一候補", () => {
    const a = analyzeProgression(chords("A7", "Dm7", "G7", "Cmaj7"), C)[0];
    expect(a.relation).toBe("secondary-dominant");
    expect(a.roman).toBe("Ⅴ7/Ⅱ");
    expect(a.target?.isMinor).toBe(true);
    const ids = suggestScales(a, C).map((s) => s.scale.id);
    expect(ids[0]).toBe("phrygian-dominant");
    expect(ids).toContain("altered");
  });
  it("C7 → F はセカンダリードミナント Ⅴ7/Ⅳ、ミクソリディアンが第一候補", () => {
    const a = analyzeProgression(chords("C7", "Fmaj7"), C)[0];
    expect(a.relation).toBe("secondary-dominant");
    expect(a.roman).toBe("Ⅴ7/Ⅳ");
    expect(suggestScales(a, C)[0].scale.id).toBe("mixolydian");
  });
  it("D7 単独（解決先なし）でも Ⅴ7/Ⅴ と推定", () => {
    const a = analyzeProgression(chords("D7"), C)[0];
    expect(a.relation).toBe("secondary-dominant");
    expect(a.roman).toBe("Ⅴ7/Ⅴ");
  });
  it("D♭7 → Cmaj7 は裏コード → リディアン♭7", () => {
    const a = analyzeProgression(chords("Dm7", "Db7", "Cmaj7"), C)[1];
    expect(a.relation).toBe("tritone-substitution");
    expect(a.roman).toBe("♭Ⅱ7");
    expect(suggestScales(a, C)[0].scale.id).toBe("lydian-b7");
  });
  it("Fm7 → 借用（サブドミナントマイナー）→ ドリアン", () => {
    const a = analyzeProgression(chords("Fm7", "Cmaj7"), C)[0];
    expect(a.relation).toBe("borrowed");
    expect(a.roman).toBe("Ⅳm7");
    expect(a.func).toBe("subdominant");
    expect(suggestScales(a, C)[0].scale.id).toBe("dorian");
  });
  it("B♭maj7 → 借用 ♭Ⅶ → リディアン／アイオニアン", () => {
    const a = analyzeProgression(chords("Bbmaj7", "Cmaj7"), C)[0];
    expect(a.relation).toBe("borrowed");
    expect(a.roman).toBe("♭Ⅶmaj7");
    expect(a.borrowedFrom).toBe("mixolydian");
    const ids = suggestScales(a, C).map((s) => s.scale.id);
    expect(ids.slice(0, 2)).toEqual(["lydian", "ionian"]);
  });
  it("B♭7 → 借用 ♭Ⅶ7 → ミクソリディアン", () => {
    const a = analyzeProgression(chords("C", "Bb7", "F", "C"), C)[1];
    expect(a.relation).toBe("borrowed");
    expect(suggestScales(a, C)[0].scale.id).toBe("mixolydian");
  });
  it("A♭maj7 → 借用 ♭Ⅵ → リディアン", () => {
    const a = analyzeProgression(chords("Abmaj7", "G7"), C)[0];
    expect(a.relation).toBe("borrowed");
    expect(suggestScales(a, C)[0].scale.id).toBe("lydian");
  });
  it("C♯dim7 → Dm7 は経過ディミニッシュ → ディミニッシュスケール、A の HmP5↓", () => {
    const a = analyzeProgression(chords("C", "C#dim7", "Dm7"), C)[1];
    expect(a.relation).toBe("passing-diminished");
    expect(a.roman).toBe("♯Ⅰdim7");
    const s = suggestScales(a, C);
    expect(s[0].scale.id).toBe("diminished");
    const hm = s.find((x) => x.scale.id === "phrygian-dominant");
    expect(hm?.root).toBe("A");
  });
  it("Em7♭5 → A7 → Dm7 の Em7♭5 は関連Ⅱm7", () => {
    const a = analyzeProgression(chords("Em7b5", "A7", "Dm7"), C)[0];
    expect(a.relation).toBe("secondary-ii");
    expect(suggestScales(a, C)[0].scale.id).toBe("locrian");
  });
  it("A♭7 → G7 は裏コード（Ⅴ7/Ⅴ の裏）", () => {
    const a = analyzeProgression(chords("Ab7", "G7", "C"), C)[0];
    expect(a.relation).toBe("tritone-substitution");
    expect(a.explanationJa).toContain("Ⅱ7");
  });
  it("E7(♭9) → Am7: 品質ルールでコンディミ／HmP5↓", () => {
    const a = analyzeProgression(chords("E7b9", "Am7"), C)[0];
    expect(a.relation).toBe("secondary-dominant");
    const ids = suggestScales(a, C).map((s) => s.scale.id);
    expect(ids.slice(0, 2)).toEqual(expect.arrayContaining(["phrygian-dominant", "combination-of-diminished"]));
  });
  it("Caug → ホールトーン", () => {
    expect(allIds(["Caug"], 0)[0]).toBe("whole-tone");
  });
  it("スラッシュコード C/E はダイアトニック扱い", () => {
    const a = analyzeProgression(chords("C/E"), C)[0];
    expect(a.relation).toBe("diatonic");
    expect(a.roman).toBe("Ⅰ");
  });
  it("ブルースの Ⅰ7（C7 → F7）はミクソリディアンにキーのブルーススケールも含む", () => {
    const a = analyzeProgression(chords("C7", "F7", "G7"), C);
    expect(a[0].roman).toBe("Ⅴ7/Ⅳ");
    const s1 = suggestScales(a[1], C);
    expect(s1[0].scale.id).toBe("mixolydian");
    expect(s1.some((s) => s.scale.id === "blues")).toBe(true);
  });
});

describe("analysis: マイナーキー", () => {
  it("Am: Am7 Dm7 E7 Am7", () => {
    const a = analyzeProgression(chords("Am7", "Dm7", "E7", "Am7"), Am);
    expect(a.map((x) => x.roman)).toEqual(["Ⅰm7", "Ⅳm7", "Ⅴ7", "Ⅰm7"]);
    expect(a[2].relation).toBe("diatonic");
    expect(a[2].diatonicSource).toBe("harmonic-minor");
    expect(a[2].func).toBe("dominant");
    const ids = suggestScales(a[2], Am).map((s) => s.scale.id);
    expect(ids[0]).toBe("phrygian-dominant");
    expect(suggestScales(a[0], Am).map((s) => s.scale.id).slice(0, 2)).toEqual(expect.arrayContaining(["aeolian", "minor-pentatonic"]));
    expect(suggestScales(a[1], Am)[0].scale.id).toBe("dorian");
  });
  it("Am: Bm7♭5 → ロクリアン、Fmaj7 → リディアン、G7 → ミクソリディアン", () => {
    const a = analyzeProgression(chords("Bm7b5", "Fmaj7", "G7", "Cmaj7"), Am);
    expect(a.map((x) => x.roman)).toEqual(["Ⅱm7♭5", "♭Ⅵmaj7", "♭Ⅶ7", "♭Ⅲmaj7"]);
    expect(suggestScales(a[0], Am)[0].scale.id).toBe("locrian");
    expect(suggestScales(a[1], Am)[0].scale.id).toBe("lydian");
    expect(suggestScales(a[2], Am)[0].scale.id).toBe("mixolydian");
    expect(suggestScales(a[3], Am)[0].scale.id).toBe("ionian");
  });
  it("Am: D7（Ⅳ7、同主調メジャーからの借用）→ リディアン♭7", () => {
    const a = analyzeProgression(chords("Am7", "D7"), Am)[1];
    expect(a.relation).toBe("borrowed");
    expect(a.roman).toBe("Ⅳ7");
    expect(suggestScales(a, Am)[0].scale.id).toBe("lydian-b7");
  });
  it("Am: AmMaj7 → メロディックマイナー", () => {
    const a = analyzeProgression(chords("AmMaj7"), Am)[0];
    expect(a.relation).toBe("diatonic");
    expect(suggestScales(a, Am)[0].scale.id).toBe("melodic-minor");
  });
});

describe("scale-rules: 整合性", () => {
  it("ルール表のスケール ID はすべて定義済み", () => {
    for (const r of SCALE_RULES) for (const s of r.suggestions) expect(SCALE_BY_ID[s.scaleId], `${r.id}:${s.scaleId}`).toBeDefined();
  });
  it("ルール ID は一意", () => {
    const ids = SCALE_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("対応コード全種に対して提案が 1 つ以上返る（C メジャー／A マイナー）", () => {
    const suffixes = ["", "m", "dim", "aug", "sus2", "sus4", "6", "m6", "7", "maj7", "m7", "m7b5", "dim7", "mMaj7", "7sus4", "add9", "9", "m9", "maj9", "11", "13", "7b9", "7#9", "7#11", "7b13", "7#5", "7alt"];
    const roots = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    for (const key of [C, Am]) {
      for (const root of roots) {
        for (const suf of suffixes) {
          const a = analyzeProgression(chords(`${root}${suf}`), key)[0];
          const s = suggestScales(a, key);
          expect(s.length, `${root}${suf} in ${key.tonic}${key.mode}`).toBeGreaterThan(0);
          // 第一候補はコードトーンを含むこと（sus/alt など特殊なものは例外を許容）
          if (!["7alt", "11", "13", "7#9", "7b13", "7#5", "7#11", "7b9", "sus2", "sus4", "7sus4", "add9", "9", "m9", "maj9", "6", "m6"].includes(suf)) {
            expect(s[0].coversChordTones, `${root}${suf} in ${key.tonic}${key.mode}: ${s[0].scale.id}`).toBe(true);
          }
        }
      }
    }
  });
  it("キー全体のスケール", () => {
    expect(keyScaleSuggestions(C)[0].scale.id).toBe("ionian");
    expect(keyScaleSuggestions(Am)[0].scale.id).toBe("aeolian");
    expect(keyScaleSuggestions(C)[0].notes.map((n) => n.name)).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });
});
