/**
 * ブラウザで音声ファイルをデコードし、解析用のモノラル PCM（22.05 kHz）にする。
 * ファイルは端末内で処理され、どこにも送信されない。
 */
export const ANALYSIS_SAMPLE_RATE = 22050;

export interface DecodedAudio {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
}

export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  const buffer = await file.arrayBuffer();
  // OfflineAudioContext のサンプルレートに合わせて自動でリサンプリングされる
  const ctx = new OfflineAudioContext(1, 1, ANALYSIS_SAMPLE_RATE);
  const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
    const result = ctx.decodeAudioData(buffer, resolve, reject);
    if (result && typeof (result as Promise<AudioBuffer>).then === "function") (result as Promise<AudioBuffer>).then(resolve, reject);
  });
  const length = decoded.length;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / decoded.numberOfChannels;
  }
  return { samples: mono, sampleRate: decoded.sampleRate, duration: decoded.duration };
}
