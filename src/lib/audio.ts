/**
 * Tone.js による試聴。クリック時に動的 import してバンドルを分離する。
 */
let synthPromise: Promise<{ synth: import("tone").PolySynth; Tone: typeof import("tone") }> | null = null;

async function getSynth() {
  if (!synthPromise) {
    synthPromise = (async () => {
      const Tone = await import("tone");
      await Tone.start();
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.8 },
        volume: -8,
      }).toDestination();
      return { synth, Tone };
    })();
  }
  return synthPromise;
}

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export async function playChord(midis: number[], duration = 1.6): Promise<void> {
  const { synth, Tone } = await getSynth();
  const now = Tone.now();
  // 軽くストロークのように少しずらす
  midis.forEach((m, i) => synth.triggerAttackRelease(midiToFreq(m), duration, now + i * 0.03));
  await new Promise((r) => setTimeout(r, duration * 1000 + 200));
}

export async function playScale(midis: number[], noteLength = 0.28): Promise<void> {
  const { synth, Tone } = await getSynth();
  const now = Tone.now();
  midis.forEach((m, i) => synth.triggerAttackRelease(midiToFreq(m), noteLength * 0.9, now + i * noteLength));
  await new Promise((r) => setTimeout(r, midis.length * noteLength * 1000 + 300));
}
