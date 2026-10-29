/**
 * Tone.js による試聴。クリック時に動的 import してバンドルを分離する。
 * 音色は Karplus–Strong（弦をはじく物理モデル）の PluckSynth を複数ボイス用意し、
 * ローパス＋軽いリバーブを通してギター／ベースらしい「はじいた弦」の音にする。
 */
type ToneModule = typeof import("tone");

interface Engine {
  Tone: ToneModule;
  voices: import("tone").PluckSynth[];
  next: number;
}

let enginePromise: Promise<Engine> | null = null;
const VOICES = 8;

async function getEngine(): Promise<Engine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const Tone = await import("tone");
      await Tone.start();
      // 出力チェーン: 各ボイス → ローパス → コンプ → リバーブ(並列) → 出力
      const filter = new Tone.Filter({ type: "lowpass", frequency: 3200, rolloff: -12, Q: 0.5 });
      const comp = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.005, release: 0.15 });
      const reverb = new Tone.Reverb({ decay: 1.4, preDelay: 0.01, wet: 0.18 });
      const gain = new Tone.Gain(0.6);
      filter.connect(comp);
      comp.connect(gain);
      gain.connect(reverb);
      reverb.toDestination();
      gain.toDestination();
      const voices = Array.from({ length: VOICES }, () =>
        new Tone.PluckSynth({ attackNoise: 0.8, dampening: 3400, resonance: 0.985, release: 0.6 }).connect(filter),
      );
      return { Tone, voices, next: 0 };
    })();
  }
  return enginePromise;
}

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** 音域に応じて弦の明るさ（ダンピング）と持続を変える。低音ほど太く、減衰は遅め */
function voiceParamsFor(midi: number): { dampening: number; resonance: number } {
  if (midi < 40) return { dampening: 1800, resonance: 0.992 }; // ベース音域
  if (midi < 52) return { dampening: 2600, resonance: 0.99 };
  if (midi < 64) return { dampening: 3400, resonance: 0.985 };
  return { dampening: 4200, resonance: 0.98 };
}

function pluck(engine: Engine, midi: number, time: number, duration: number) {
  const voice = engine.voices[engine.next % VOICES];
  engine.next++;
  const p = voiceParamsFor(midi);
  voice.dampening = p.dampening;
  voice.resonance = p.resonance;
  voice.triggerAttack(midiToFreq(midi), time);
  voice.triggerRelease(time + duration);
}

/** コードをストローク（低い音から順に少しずらして）で鳴らす */
export async function playChord(midis: number[], duration = 2.2): Promise<void> {
  const engine = await getEngine();
  const now = engine.Tone.now() + 0.05;
  const sorted = [...midis].sort((a, b) => a - b);
  sorted.forEach((m, i) => pluck(engine, m, now + i * 0.045, duration));
  await new Promise((r) => setTimeout(r, (duration + sorted.length * 0.045) * 1000 + 200));
}

/** スケールを 1 音ずつ順に鳴らす */
export async function playScale(midis: number[], noteLength = 0.3): Promise<void> {
  const engine = await getEngine();
  const now = engine.Tone.now() + 0.05;
  midis.forEach((m, i) => pluck(engine, m, now + i * noteLength, noteLength * 1.6));
  await new Promise((r) => setTimeout(r, (midis.length * noteLength + 0.6) * 1000));
}

/** 単音（指板クリックなど） */
export async function playNote(midi: number, duration = 1.2): Promise<void> {
  const engine = await getEngine();
  pluck(engine, midi, engine.Tone.now() + 0.02, duration);
}

/** コードの構成音を試聴用の MIDI 列にする（ルートを C3〜B3、ベース音はその 1 オクターブ下） */
export function chordToMidis(chord: { rootPc: number; bassPc?: number; tones: { semitones: number }[] }): number[] {
  const root = 48 + ((chord.rootPc % 12) + 12) % 12;
  const notes = chord.tones.map((t) => root + t.semitones);
  if (chord.bassPc !== undefined) notes.unshift(36 + ((chord.bassPc % 12) + 12) % 12);
  return notes;
}

export interface ProgressionPlayback {
  /** 再生終了（停止含む）で解決 */
  done: Promise<void>;
  stop: () => void;
}

/**
 * コード進行を順番に鳴らす。各コードは secondsPerChord 秒ずつ。
 * onChord は鳴り始めたコードの番号（終了時は -1）を通知する。
 */
export async function playProgression(chords: number[][], secondsPerChord = 1.1, onChord?: (index: number) => void): Promise<ProgressionPlayback> {
  const engine = await getEngine();
  const start = engine.Tone.now() + 0.05;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });

  chords.forEach((midis, i) => {
    const t = start + i * secondsPerChord;
    const sorted = [...midis].sort((a, b) => a - b);
    sorted.forEach((m, j) => pluck(engine, m, t + j * 0.04, secondsPerChord * 0.95));
    timers.push(setTimeout(() => onChord?.(i), i * secondsPerChord * 1000 + 50));
  });
  timers.push(
    setTimeout(() => {
      onChord?.(-1);
      finish();
    }, chords.length * secondsPerChord * 1000 + 400),
  );

  const stop = () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    const now = engine.Tone.now();
    for (const v of engine.voices) v.triggerRelease(now);
    onChord?.(-1);
    finish();
  };
  return { done, stop };
}
