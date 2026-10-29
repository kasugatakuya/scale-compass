import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, queryToState, stateToQuery, toolHref } from "../url-state";

describe("url-state", () => {
  it("往復変換", () => {
    const state = { ...DEFAULT_STATE, tonic: "F♯", mode: "minor" as const, chords: ["F#m7", "B7", "Emaj7", "C#m7/B"], instrument: "bass5" as const, tuningId: "bass5-high-c", selected: 2, scale: "dorian@6", labelMode: "name" as const, lefty: true, fretMin: 3, fretMax: 12, positionSystem: "3nps" as const, positionIndex: 2 };
    const q = stateToQuery(state);
    expect(q).toContain("prog=F%23m7|B7|Emaj7|C%23m7%2FB");
    expect(queryToState(q)).toEqual(state);
  });
  it("既定値は省略される", () => {
    expect(stateToQuery(DEFAULT_STATE)).toBe("key=C&mode=major&prog=Dm7|G7|Cmaj7|Am7");
    expect(queryToState("")).toEqual(DEFAULT_STATE);
  });
  it("不正な値は既定値に戻す", () => {
    const s = queryToState("key=H&mode=foo&inst=piano&frets=10-3&view=bar&i=abc");
    expect(s.tonic).toBe("C");
    expect(s.mode).toBe("major");
    expect(s.instrument).toBe("guitar");
    expect(s.fretMin).toBe(0);
    expect(s.labelMode).toBe("degree");
    expect(s.selected).toBe(0);
  });
  it("ツールへのリンク", () => {
    expect(toolHref("C", "major", ["F", "G", "Em", "Am"])).toBe("/?key=C&mode=major&prog=F|G|Em|Am");
    expect(queryToState(toolHref("Db", "major", ["Db"]).slice(2)).tonic).toBe("D♭");
  });
});
