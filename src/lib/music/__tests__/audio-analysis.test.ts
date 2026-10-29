import { describe, expect, it } from "vitest";
import { analyzeAudio, beatGrid, chromaPerBeat, computeChromagram, detectChords, estimateKey, estimateTempo, fft, onsetEnvelope, scaleFits, sumChroma } from "../audio-analysis";
import { mod12 } from "../notes";

const SR = 22050;
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** 倍音つきの合成コード（ギターのストロークを雑に模す）。拍頭に短いノイズを足してオンセットを作る */
function synthProgression(chords: number[][], secondsPerChord: number, bpm: number, sr = SR): Float32Array {
  const total = Math.floor(chords.length * secondsPerChord * sr);
  const out = new Float32Array(total);
  const beatPeriod = 60 / bpm;
  let seed = 1;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff - 0.5;
  };
  chords.forEach((midis, ci) => {
    const start = Math.floor(ci * secondsPerChord * sr);
    const len = Math.floor(secondsPerChord * sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let v = 0;
      for (const m of midis) {
        const f = midiToFreq(m);
        for (let h = 1; h <= 4; h++) v += Math.sin(2 * Math.PI * f * h * t) / (h * h);
      }
      // 拍ごとに減衰するエンベロープ
      const phase = t % beatPeriod;
      const env = Math.exp(-phase * 2.5);
      out[start + i] = (v / (midis.length * 1.5)) * env;
      if (phase < 0.02) out[start + i] += rand() * 0.6 * (1 - phase / 0.02);
    }
  });
  return out;
}

describe("fft", () => {
  it("小さな信号で DFT と一致する", () => {
    const n = 16;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 3 * i) / n) + 0.5 * Math.cos((2 * Math.PI * 5 * i) / n);
    const input = Float32Array.from(re);
    fft(re, im);
    for (let k = 0; k < n; k++) {
      let r = 0;
      let i2 = 0;
      for (let t = 0; t < n; t++) {
        r += input[t] * Math.cos((-2 * Math.PI * k * t) / n);
        i2 += input[t] * Math.sin((-2 * Math.PI * k * t) / n);
      }
      expect(re[k]).toBeCloseTo(r, 3);
      expect(im[k]).toBeCloseTo(i2, 3);
    }
  });
});

describe("chroma / key", () => {
  it("単一コードのクロマは構成音に集中する", () => {
    const samples = synthProgression([[48, 52, 55]], 2, 120); // C E G
    const cg = computeChromagram(samples, SR);
    const sum = sumChroma(cg);
    const top = Array.from(sum).map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, 3).map((x) => x.i).sort();
    expect(top).toEqual([0, 4, 7]);
  });
  it("理想的なプロファイルから C メジャー／A マイナーを判定", () => {
    const cMajor = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    expect(estimateKey(cMajor)[0]).toMatchObject({ tonicPc: 0, mode: "major" });
    const aMinor = Array.from({ length: 12 }, (_, p) => [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17][mod12(p - 9)]);
    expect(estimateKey(aMinor)[0]).toMatchObject({ tonicPc: 9, mode: "minor" });
  });
  it("スケールの当てはまり: C メジャーの分布にはアイオニアンが上位", () => {
    const chroma = [1, 0, 0.6, 0, 0.9, 0.7, 0, 0.9, 0, 0.6, 0, 0.5];
    const fits = scaleFits(chroma, 0);
    expect(fits[0].scale.id).toBe("ionian");
    expect(fits[0].coverage).toBeCloseTo(1, 5);
  });
});

describe("tempo / chords", () => {
  const progression = [
    [48, 52, 55, 60], // C
    [53, 57, 60, 65], // F
    [55, 59, 62, 67], // G
    [48, 52, 55, 60], // C
  ];
  const samples = synthProgression(progression, 2, 120);

  it("テンポを 120 BPM 付近と推定する", () => {
    const { envelope, hopSeconds } = onsetEnvelope(samples, SR);
    const t = estimateTempo(envelope, hopSeconds);
    expect(t.bpm).toBeGreaterThan(114);
    expect(t.bpm).toBeLessThan(126);
    const grid = beatGrid(envelope, hopSeconds, t.bpm, samples.length / SR, t.confidence);
    expect(grid.beats.length).toBeGreaterThanOrEqual(15);
  });

  it("C → F → G → C を推定する", () => {
    const cg = computeChromagram(samples, SR);
    const beats = Float32Array.from(Array.from({ length: 16 }, (_, i) => i * 0.5));
    const perBeat = chromaPerBeat(cg, beats, 8);
    const segments = detectChords(perBeat, beats, 8, { key: { tonicPc: 0, tonic: "C", mode: "major", score: 1 } });
    const symbols = segments.filter((s) => s.symbol !== "N").map((s) => s.symbol);
    expect(symbols).toEqual(["C", "F", "G", "C"]);
    expect(segments[0].start).toBe(0);
    expect(segments[0].confidence).toBeGreaterThan(0.5);
  });

  it("analyzeAudio が一通り動く", async () => {
    let yields = 0;
    const result = await analyzeAudio(samples, SR, undefined, async () => {
      yields++;
    });
    expect(result.key).toMatchObject({ tonicPc: 0, mode: "major" });
    expect(result.tempo.bpm).toBeGreaterThan(114);
    expect(result.segments.filter((s) => s.symbol !== "N").map((s) => s.symbol)).toEqual(["C", "F", "G", "C"]);
    expect(result.scaleFits[0].scale.id).toBe("ionian");
    expect(yields).toBeGreaterThan(0);
  });

  it("7th コードを含む Ⅱ-Ⅴ-Ⅰ（Dm7 G7 Cmaj7）はルートと長短が合う", async () => {
    const twoFive = synthProgression(
      [
        [50, 53, 57, 60], // Dm7
        [55, 59, 62, 65], // G7
        [48, 52, 55, 59], // Cmaj7
        [48, 52, 55, 59],
      ],
      2,
      120,
    );
    const result = await analyzeAudio(twoFive, SR);
    const symbols = result.segments.filter((s) => s.symbol !== "N").map((s) => s.symbol);
    expect(symbols.length).toBeGreaterThanOrEqual(3);
    expect(symbols[0]).toMatch(/^Dm7?$/);
    expect(symbols[1]).toMatch(/^G7?$/);
    expect(symbols[2]).toMatch(/^C(maj7)?$/);
    expect(result.segments.every((s) => s.confidence >= 0 && s.confidence <= 1)).toBe(true);
  });

  it("無音区間は N になる", async () => {
    const silence = new Float32Array(SR * 2);
    const chord = synthProgression([[48, 52, 55, 60]], 2, 120);
    const samples = new Float32Array(silence.length + chord.length);
    samples.set(silence, 0);
    samples.set(chord, silence.length);
    const result = await analyzeAudio(samples, SR);
    expect(result.segments[0].symbol).toBe("N");
    expect(result.segments[0].end).toBeGreaterThan(1.3); // フレーム幅（約 0.37 秒）ぶん早めに切り替わる
    expect(result.segments.some((s) => s.symbol === "C")).toBe(true);
  });

  it("マイナー進行（Am Dm E7 Am）", async () => {
    const minor = synthProgression(
      [
        [45, 48, 52, 57],
        [50, 53, 57, 62],
        [52, 56, 59, 62],
        [45, 48, 52, 57],
      ],
      2,
      100,
    );
    const result = await analyzeAudio(minor, SR);
    expect(result.key.mode).toBe("minor");
    expect(result.key.tonicPc).toBe(9);
    const symbols = result.segments.filter((s) => s.symbol !== "N").map((s) => s.symbol);
    expect(symbols[0]).toBe("Am");
    expect(symbols).toContain("Dm");
    expect(symbols.some((s) => s === "E7" || s === "E")).toBe(true);
  });
});
