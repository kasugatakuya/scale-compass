/**
 * 音源からのキー／コード進行推定（純粋関数、DOM 非依存）。
 *
 * 流れ:
 *   1. STFT（FFT）→ 12 音クロマ（音名ごとの強さ）を各フレームで算出
 *   2. クロマの合計を Krumhansl–Kessler プロファイルと照合してキー推定
 *   3. スペクトラルフラックス → 自己相関でテンポ推定 → 拍グリッド
 *   4. 拍ごとのクロマをコードテンプレートと照合し、Viterbi で滑らかなコード列に
 */
import { type ChordQuality, QUALITY_BY_ID } from "./chords";
import { mod12, pcToName, preferredAccidentalForKey, type PitchClass } from "./notes";
import { SCALES, type ScaleDef, scalePcs } from "./scales";

/** ───────── FFT ───────── */

const twiddleCache = new Map<number, { cos: Float32Array; sin: Float32Array; rev: Uint32Array }>();

function tables(n: number) {
  let t = twiddleCache.get(n);
  if (t) return t;
  const cos = new Float32Array(n / 2);
  const sin = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((-2 * Math.PI * i) / n);
    sin[i] = Math.sin((-2 * Math.PI * i) / n);
  }
  const rev = new Uint32Array(n);
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  t = { cos, sin, rev };
  twiddleCache.set(n, t);
  return t;
}

/** 実数入力の in-place 基数 2 FFT。re/im は長さ n（2 のべき乗） */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n & (n - 1)) throw new Error("FFT のサイズは 2 のべき乗である必要があります");
  const { cos, sin, rev } = tables(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step];
        const wi = sin[k * step];
        const a = start + k;
        const b = a + half;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
    }
  }
}

function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/** 振幅スペクトル（0..n/2） */
export function magnitudeSpectrum(frame: Float32Array, window: Float32Array): Float32Array {
  const n = frame.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i] * window[i];
  fft(re, im);
  const mag = new Float32Array(n / 2 + 1);
  for (let k = 0; k <= n / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  return mag;
}

/** ───────── クロマ ───────── */

export interface ChromaOptions {
  frameSize?: number;
  hopSize?: number;
  minFreq?: number;
  maxFreq?: number;
}

export interface Chromagram {
  /** frames[i] は 12 要素（合計 1 に正規化、無音なら全 0） */
  frames: Float32Array[];
  /** 各フレームの中心時刻（秒） */
  times: Float32Array;
  /** 各フレームのエネルギー */
  energy: Float32Array;
  hopSize: number;
  frameSize: number;
}

/** 周波数ビン → ピッチクラスと重みの対応表 */
function binMap(n: number, sampleRate: number, minFreq: number, maxFreq: number) {
  const pcs = new Int8Array(n / 2 + 1).fill(-1);
  const weights = new Float32Array(n / 2 + 1);
  for (let k = 1; k <= n / 2; k++) {
    const f = (k * sampleRate) / n;
    if (f < minFreq || f > maxFreq) continue;
    const midi = 69 + 12 * Math.log2(f / 440);
    const nearest = Math.round(midi);
    // 半音の中心から外れたビンは重みを下げる（低域で隣の半音へ漏れるのを抑える）
    const dist = Math.abs(midi - nearest);
    if (dist > 0.45) continue;
    const octaveWeight = f < 100 ? 0.6 : f > 1200 ? Math.max(0.2, 1 - (f - 1200) / 1600) : 1;
    pcs[k] = mod12(nearest);
    weights[k] = octaveWeight * (1 - dist);
  }
  return { pcs, weights };
}

export function computeChromagram(samples: Float32Array, sampleRate: number, options: ChromaOptions = {}): Chromagram {
  const frameSize = options.frameSize ?? 8192;
  const hopSize = options.hopSize ?? 2048;
  const { pcs, weights } = binMap(frameSize, sampleRate, options.minFreq ?? 55, options.maxFreq ?? 2200);
  const window = hann(frameSize);
  const frameCount = Math.max(0, Math.floor((samples.length - frameSize) / hopSize) + 1);
  const frames: Float32Array[] = [];
  const times = new Float32Array(frameCount);
  const energy = new Float32Array(frameCount);
  const frame = new Float32Array(frameSize);
  for (let i = 0; i < frameCount; i++) {
    const start = i * hopSize;
    frame.set(samples.subarray(start, start + frameSize));
    const mag = magnitudeSpectrum(frame, window);
    const chroma = new Float32Array(12);
    let e = 0;
    for (let k = 0; k < mag.length; k++) e += mag[k] * mag[k];
    // 倍音の抑制: 第 3 倍音（完全 5 度上）と第 5 倍音（長 3 度上）は別の音名に出るので、
    // 基音側の成分から推定した分を差し引く
    const cleaned = new Float32Array(mag.length);
    for (let k = 0; k < mag.length; k++) {
      cleaned[k] = Math.max(0, mag[k] - 0.35 * mag[Math.round(k / 3)] - 0.2 * mag[Math.round(k / 5)]);
    }
    for (let k = 0; k < mag.length; k++) {
      const pc = pcs[k];
      if (pc < 0) continue;
      // べき乗圧縮で音量差を縮めつつ、小さな成分（倍音・ノイズ）を持ち上げすぎない
      chroma[pc] += Math.pow(cleaned[k], 0.6) * weights[k];
    }
    energy[i] = e / frameSize;
    times[i] = (start + frameSize / 2) / sampleRate;
    // ドラムなど広帯域ノイズの床を引いて、音程成分だけを残す（下位 4 分の 1 点を床とする）
    const sortedVals = Array.from(chroma).sort((a, b) => a - b);
    const floor = sortedVals[3];
    let kept = 0;
    for (let p = 0; p < 12; p++) {
      chroma[p] = Math.max(0, chroma[p] - floor);
      kept += chroma[p];
    }
    if (kept > 0) for (let p = 0; p < 12; p++) chroma[p] /= kept;
    frames.push(chroma);
  }
  return { frames, times, energy, hopSize, frameSize };
}

/** ───────── キー推定 ───────── */

// Krumhansl–Kessler のキープロファイル
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface KeyEstimate {
  tonicPc: PitchClass;
  tonic: string;
  mode: "major" | "minor";
  /** 相関係数（-1〜1） */
  score: number;
}

function correlation(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da === 0 || db === 0 ? 0 : num / Math.sqrt(da * db);
}

/** クロマの合計（12 要素）からキー候補を相関の高い順に返す */
export function estimateKey(chroma: ArrayLike<number>): KeyEstimate[] {
  const out: KeyEstimate[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = new Float32Array(12);
    for (let i = 0; i < 12; i++) rotated[i] = chroma[mod12(tonic + i)];
    for (const mode of ["major", "minor"] as const) {
      const score = correlation(rotated, mode === "major" ? KK_MAJOR : KK_MINOR);
      out.push({ tonicPc: tonic, tonic: pcToName(tonic, preferredAccidentalForKey(tonic, mode)), mode, score });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export function sumChroma(chromagram: Chromagram): Float32Array {
  const sum = new Float32Array(12);
  chromagram.frames.forEach((f, i) => {
    const w = Math.sqrt(chromagram.energy[i]);
    for (let p = 0; p < 12; p++) sum[p] += f[p] * w;
  });
  const total = sum.reduce((a, b) => a + b, 0);
  if (total > 0) for (let p = 0; p < 12; p++) sum[p] /= total;
  return sum;
}

/** ───────── テンポ・拍 ───────── */

export interface BeatGrid {
  bpm: number;
  /** 各拍の開始時刻（秒） */
  beats: Float32Array;
  /** テンポ推定の信頼度 0〜1 */
  confidence: number;
}

/** スペクトラルフラックスによるオンセット強度（小さいフレームで時間分解能を上げる） */
export function onsetEnvelope(samples: Float32Array, sampleRate: number, frameSize = 1024, hopSize = 256): { envelope: Float32Array; hopSeconds: number } {
  const window = hann(frameSize);
  const frameCount = Math.max(0, Math.floor((samples.length - frameSize) / hopSize) + 1);
  const envelope = new Float32Array(frameCount);
  let prev: Float32Array | null = null;
  const frame = new Float32Array(frameSize);
  for (let i = 0; i < frameCount; i++) {
    frame.set(samples.subarray(i * hopSize, i * hopSize + frameSize));
    const mag = magnitudeSpectrum(frame, window);
    for (let k = 0; k < mag.length; k++) mag[k] = Math.log1p(mag[k] * 10);
    if (prev) {
      let flux = 0;
      for (let k = 0; k < mag.length; k++) {
        const d = mag[k] - prev[k];
        if (d > 0) flux += d;
      }
      envelope[i] = flux;
    }
    prev = mag;
  }
  // ローカル平均を引いて正規化
  const smoothed = new Float32Array(frameCount);
  const win = 16;
  for (let i = 0; i < frameCount; i++) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(frameCount - 1, i + win); j++) {
      s += envelope[j];
      c++;
    }
    smoothed[i] = Math.max(0, envelope[i] - s / c);
  }
  return { envelope: smoothed, hopSeconds: hopSize / sampleRate };
}

export function estimateTempo(envelope: Float32Array, hopSeconds: number, minBpm = 60, maxBpm = 200): { bpm: number; confidence: number } {
  const n = envelope.length;
  const minLag = Math.floor(60 / (maxBpm * hopSeconds));
  const maxLag = Math.ceil(60 / (minBpm * hopSeconds));
  if (n < maxLag * 2) return { bpm: 120, confidence: 0 };
  let best = { lag: 0, value: -Infinity };
  let total = 0;
  const values: number[] = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += envelope[i] * envelope[i + lag];
    s /= n - lag;
    // 120 BPM 付近を少し優先する対数正規の重み
    const bpm = 60 / (lag * hopSeconds);
    const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 110) / 0.9, 2));
    const v = s * prior;
    values.push(v);
    total += v;
    if (v > best.value) best = { lag, value: v };
  }
  if (best.lag === 0 || total <= 0) return { bpm: 120, confidence: 0 };
  const mean = total / values.length;
  const confidence = Math.max(0, Math.min(1, (best.value - mean) / (best.value + 1e-9)));
  return { bpm: 60 / (best.lag * hopSeconds), confidence };
}

/** 一定テンポと仮定して、オンセットに最も合う位相の拍グリッドを作る */
export function beatGrid(envelope: Float32Array, hopSeconds: number, bpm: number, duration: number, confidence: number): BeatGrid {
  const period = 60 / bpm;
  const periodFrames = period / hopSeconds;
  let bestPhase = 0;
  let bestScore = -Infinity;
  const steps = Math.max(1, Math.floor(periodFrames));
  for (let phase = 0; phase < steps; phase++) {
    let s = 0;
    for (let t = phase; t < envelope.length; t += periodFrames) s += envelope[Math.round(t)] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      bestPhase = phase;
    }
  }
  const beats: number[] = [];
  for (let t = bestPhase * hopSeconds; t < duration; t += period) beats.push(t);
  if (beats.length === 0 || beats[0] > 0.001) beats.unshift(0);
  return { bpm, beats: Float32Array.from(beats), confidence };
}

/** ───────── コード推定 ───────── */

export const DETECTABLE_QUALITIES: ChordQuality[] = ["maj", "min", "7", "maj7", "m7"];

interface ChordTemplate {
  rootPc: PitchClass;
  quality: ChordQuality;
  vector: Float32Array;
  norm: number;
}

function buildTemplates(): ChordTemplate[] {
  const out: ChordTemplate[] = [];
  for (let root = 0; root < 12; root++) {
    for (const q of DETECTABLE_QUALITIES) {
      const v = new Float32Array(12);
      for (const iv of QUALITY_BY_ID[q].intervals) {
        const semis = intervalSemis(iv);
        const pc = mod12(root + semis);
        // 7 度は 3 和音との区別を保ちつつ、やや軽めに
        v[pc] += semis === 10 || semis === 11 ? 0.8 : 1;
        // 倍音（第 3 倍音 = 完全 5 度上、第 5 倍音 = 長 3 度上）を少し含める。
        // 実際の楽器音では 3 度の第 3 倍音が長 7 度に出るため、これを入れないと maj7 を選びすぎる
        v[mod12(pc + 7)] += 0.1;
        v[mod12(pc + 4)] += 0.05;
      }
      let norm = 0;
      for (let p = 0; p < 12; p++) norm += v[p] * v[p];
      out.push({ rootPc: root, quality: q, vector: v, norm: Math.sqrt(norm) });
    }
  }
  return out;
}

function intervalSemis(iv: string): number {
  const num = Number(/^\d+/.exec(iv)![0]);
  const q = iv.replace(/^\d+/, "");
  const base: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };
  let s = base[num];
  if (q === "m") s -= 1;
  else if (q === "d") s -= num === 4 || num === 5 || num === 1 ? 1 : 2;
  else if (q === "A") s += 1;
  return s;
}

let templatesCache: ChordTemplate[] | null = null;
const templates = () => (templatesCache ??= buildTemplates());

export interface ChordSegment {
  start: number;
  end: number;
  /** null = 無音／判定不能 */
  rootPc: PitchClass | null;
  quality: ChordQuality | null;
  symbol: string;
  /** 0〜1 */
  confidence: number;
}

export interface ChordDetectionOptions {
  /** キー推定を使って、ダイアトニックコードをわずかに優先する */
  key?: KeyEstimate | null;
  /** 同じコードに留まる確率（拍ごと） */
  stayProbability?: number;
  accidental?: "sharp" | "flat";
}

/** 拍ごとのクロマ平均 */
export function chromaPerBeat(chromagram: Chromagram, beats: Float32Array, duration: number): { chroma: Float32Array; energy: number }[] {
  const out: { chroma: Float32Array; energy: number }[] = [];
  let fi = 0;
  for (let b = 0; b < beats.length; b++) {
    const start = beats[b];
    const end = b + 1 < beats.length ? beats[b + 1] : duration;
    const sum = new Float32Array(12);
    let count = 0;
    let energy = 0;
    while (fi < chromagram.frames.length && chromagram.times[fi] < start) fi++;
    let j = fi;
    while (j < chromagram.frames.length && chromagram.times[j] < end) {
      const f = chromagram.frames[j];
      for (let p = 0; p < 12; p++) sum[p] += f[p];
      energy += chromagram.energy[j];
      count++;
      j++;
    }
    if (count > 0) {
      for (let p = 0; p < 12; p++) sum[p] /= count;
      energy /= count;
    }
    out.push({ chroma: sum, energy });
  }
  return out;
}

/** 拍ごとのクロマ列から Viterbi でコード列を推定し、連続する同じコードをまとめる */
export function detectChords(beatChroma: { chroma: Float32Array; energy: number }[], beats: Float32Array, duration: number, options: ChordDetectionOptions = {}): ChordSegment[] {
  const T = templates();
  const S = T.length + 1; // 最後は N（無音）
  const N = beatChroma.length;
  if (N === 0) return [];
  const stay = options.stayProbability ?? 0.85;
  const logStay = Math.log(stay);
  const logChange = Math.log((1 - stay) / (S - 1));
  // 放出スコアの鋭さ。大きいほど 1 拍の証拠を重視し、小さいほど前後の連続性（stay）を重視する
  const beta = 20;
  const keyPcs = options.key ? new Set(scalePcs(SCALES.find((s) => s.id === (options.key!.mode === "major" ? "ionian" : "aeolian"))!, options.key.tonicPc)) : null;
  const maxEnergy = Math.max(...beatChroma.map((b) => b.energy), 1e-12);
  const silenceThreshold = maxEnergy * 0.002;

  // 放出スコア
  const emit: Float32Array[] = beatChroma.map(({ chroma: raw, energy }) => {
    const e = new Float32Array(S);
    // 平方根で圧縮し、重ねて弾かれたルート音などの突出を抑える
    const chroma = raw.map((v) => Math.sqrt(Math.max(0, v)));
    let cn = 0;
    for (let p = 0; p < 12; p++) cn += chroma[p] * chroma[p];
    cn = Math.sqrt(cn);
    const silent = energy < silenceThreshold || cn === 0;
    for (let s = 0; s < T.length; s++) {
      if (silent) {
        e[s] = -5;
        continue;
      }
      const t = T[s];
      let dot = 0;
      for (let p = 0; p < 12; p++) dot += chroma[p] * t.vector[p];
      let sim = dot / (cn * t.norm);
      if (keyPcs) {
        const chordPcs = QUALITY_BY_ID[t.quality].intervals.map((iv) => mod12(t.rootPc + intervalSemis(iv)));
        if (chordPcs.every((pc) => keyPcs.has(pc))) sim += 0.04;
      }
      // 三和音をわずかに優先（7 度の証拠が弱いときに 7th を選びすぎない）
      if (t.quality === "maj" || t.quality === "min") sim += 0.01;
      e[s] = beta * sim;
    }
    e[S - 1] = silent ? 0 : -2;
    return e;
  });

  // Viterbi
  const delta = new Float32Array(S);
  const psi: Int16Array[] = [];
  for (let s = 0; s < S; s++) delta[s] = emit[0][s];
  for (let t = 1; t < N; t++) {
    const next = new Float32Array(S);
    const back = new Int16Array(S);
    let bestPrev = 0;
    for (let s = 1; s < S; s++) if (delta[s] > delta[bestPrev]) bestPrev = s;
    for (let s = 0; s < S; s++) {
      const stayScore = delta[s] + logStay;
      const changeScore = delta[bestPrev] + logChange;
      if (stayScore >= changeScore) {
        next[s] = stayScore + emit[t][s];
        back[s] = s;
      } else {
        next[s] = changeScore + emit[t][s];
        back[s] = bestPrev;
      }
    }
    delta.set(next);
    psi.push(back);
  }
  const path = new Int16Array(N);
  let last = 0;
  for (let s = 1; s < S; s++) if (delta[s] > delta[last]) last = s;
  path[N - 1] = last;
  for (let t = N - 1; t > 0; t--) path[t - 1] = psi[t - 1][path[t]];

  // セグメント化
  const accidental = options.accidental ?? (options.key ? preferredAccidentalForKey(options.key.tonicPc, options.key.mode) : "sharp");
  const segments: ChordSegment[] = [];
  for (let t = 0; t < N; t++) {
    const s = path[t];
    const start = beats[t];
    const end = t + 1 < beats.length ? beats[t + 1] : duration;
    // 確信度: 選ばれた状態と次点の放出スコア差
    const sorted = Array.from(emit[t]).sort((a, b) => b - a);
    const margin = (emit[t][s] - (sorted[0] === emit[t][s] ? sorted[1] : sorted[0])) / beta;
    const conf = Math.max(0, Math.min(1, 0.5 + margin * 5));
    const prev = segments[segments.length - 1];
    if (prev && prev.rootPc === (s === S - 1 ? null : T[s].rootPc) && prev.quality === (s === S - 1 ? null : T[s].quality)) {
      prev.end = end;
      prev.confidence = (prev.confidence + conf) / 2;
      continue;
    }
    if (s === S - 1) {
      segments.push({ start, end, rootPc: null, quality: null, symbol: "N", confidence: conf });
    } else {
      const tpl = T[s];
      segments.push({ start, end, rootPc: tpl.rootPc, quality: tpl.quality, symbol: `${pcToName(tpl.rootPc, accidental)}${QUALITY_BY_ID[tpl.quality].suffix}`, confidence: conf });
    }
  }
  return segments;
}

/** ───────── スケールの当てはまり ───────── */

export interface ScaleFit {
  scale: ScaleDef;
  rootPc: PitchClass;
  /** スケール内に含まれるエネルギー割合から音数のコストを引いた値（大きいほど合う） */
  score: number;
  /** スケール内に含まれるエネルギーの割合 0〜1 */
  coverage: number;
}

export function scaleFits(chroma: ArrayLike<number>, rootPc: PitchClass, candidates: ScaleDef[] = SCALES): ScaleFit[] {
  const total = Array.from({ length: 12 }, (_, p) => chroma[p]).reduce((a, b) => a + b, 0) || 1;
  return candidates
    .map((scale) => {
      const pcs = new Set(scalePcs(scale, rootPc));
      let inSum = 0;
      for (let p = 0; p < 12; p++) if (pcs.has(p)) inSum += chroma[p];
      const coverage = inSum / total;
      // 「スケール内に含まれるエネルギーの割合」から、音数に応じたコストを引く。
      // 1 音あたり約 4% 以上のエネルギーを持つ音なら、含めたほうが得になる
      return { scale, rootPc, score: coverage - (0.5 * pcs.size) / 12, coverage };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * クロマは倍音の影響（3 度の第 3 倍音が長 7 度に出るなど）で偏るので、
 * 検出したコードの構成音を鳴っていた時間で重みづけしたヒストグラムと半々で混ぜる。
 */
export function blendWithChordTones(chroma: Float32Array, segments: ChordSegment[]): Float32Array {
  const hist = new Float32Array(12);
  let total = 0;
  for (const seg of segments) {
    if (seg.rootPc === null || seg.quality === null) continue;
    const dur = seg.end - seg.start;
    for (const iv of QUALITY_BY_ID[seg.quality].intervals) {
      hist[mod12(seg.rootPc + intervalSemis(iv))] += dur;
      total += dur;
    }
  }
  const out = new Float32Array(12);
  if (total === 0) {
    out.set(chroma);
    return out;
  }
  for (let p = 0; p < 12; p++) out[p] = 0.5 * chroma[p] + 0.5 * (hist[p] / total);
  return out;
}

/** ───────── 全体のオーケストレーション ───────── */

export interface AudioAnalysisResult {
  duration: number;
  sampleRate: number;
  /** 音源全体のクロマ（12 音の分布、合計 1） */
  chroma: Float32Array;
  /** スケール判定に使う音の分布（クロマと、検出したコードの構成音を半々で混ぜたもの） */
  toneDistribution: Float32Array;
  keys: KeyEstimate[];
  key: KeyEstimate;
  tempo: BeatGrid;
  segments: ChordSegment[];
  scaleFits: ScaleFit[];
}

export type ProgressFn = (stage: string, ratio: number) => void;

/**
 * モノラル PCM（-1〜1）から解析結果を作る。
 * yieldFn を渡すと重い処理の合間に呼ばれる（UI スレッドを止めないため）。
 */
export async function analyzeAudio(samples: Float32Array, sampleRate: number, onProgress?: ProgressFn, yieldFn?: () => Promise<void>): Promise<AudioAnalysisResult> {
  const duration = samples.length / sampleRate;
  onProgress?.("クロマを計算中", 0.05);
  // クロマはフレームごとに分割して計算し、途中で UI に制御を戻す
  const frameSize = 8192;
  const hopSize = 2048;
  const chunkFrames = 160;
  const partial: Chromagram = { frames: [], times: new Float32Array(0), energy: new Float32Array(0), hopSize, frameSize };
  const times: number[] = [];
  const energies: number[] = [];
  const totalFrames = Math.max(0, Math.floor((samples.length - frameSize) / hopSize) + 1);
  for (let f0 = 0; f0 < totalFrames; f0 += chunkFrames) {
    const f1 = Math.min(totalFrames, f0 + chunkFrames);
    const slice = samples.subarray(f0 * hopSize, (f1 - 1) * hopSize + frameSize);
    const c = computeChromagram(slice, sampleRate, { frameSize, hopSize });
    partial.frames.push(...c.frames);
    for (let i = 0; i < c.frames.length; i++) {
      times.push(c.times[i] + (f0 * hopSize) / sampleRate);
      energies.push(c.energy[i]);
    }
    onProgress?.("クロマを計算中", 0.05 + 0.5 * (f1 / totalFrames));
    if (yieldFn) await yieldFn();
  }
  const chromagram: Chromagram = { ...partial, times: Float32Array.from(times), energy: Float32Array.from(energies) };

  onProgress?.("キーを推定中", 0.6);
  const chroma = sumChroma(chromagram);
  const keys = estimateKey(chroma);
  const key = keys[0];
  if (yieldFn) await yieldFn();

  onProgress?.("テンポを推定中", 0.65);
  const { envelope, hopSeconds } = onsetEnvelope(samples, sampleRate);
  const tempoEst = estimateTempo(envelope, hopSeconds);
  const tempo = beatGrid(envelope, hopSeconds, tempoEst.bpm, duration, tempoEst.confidence);
  if (yieldFn) await yieldFn();

  onProgress?.("コードを推定中", 0.85);
  const perBeat = chromaPerBeat(chromagram, tempo.beats, duration);
  const segments = detectChords(perBeat, tempo.beats, duration, { key });
  const toneDistribution = blendWithChordTones(chroma, segments);
  const fits = scaleFits(toneDistribution, key.tonicPc);
  onProgress?.("完了", 1);
  return { duration, sampleRate, chroma, toneDistribution, keys, key, tempo, segments, scaleFits: fits };
}
