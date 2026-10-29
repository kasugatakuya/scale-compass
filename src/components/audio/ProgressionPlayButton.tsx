"use client";

import { useEffect, useRef, useState } from "react";
import { chordToMidis, playProgression, type ProgressionPlayback } from "@/lib/audio";
import { parseChord } from "@/lib/music/chord-parser";
import { cn } from "@/components/ui";

/**
 * コード進行を順番に鳴らすボタン。再生中は停止ボタンになり、鳴っているコードの番号を onChord で通知する。
 */
export function ProgressionPlayButton({ chords, onChord, label = "進行を試聴", className }: { chords: string[]; onChord?: (index: number) => void; label?: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const playback = useRef<ProgressionPlayback | null>(null);

  // アンマウント時は停止
  useEffect(() => () => playback.current?.stop(), []);

  const toggle = async () => {
    if (playing) {
      playback.current?.stop();
      return;
    }
    const midis = chords.map(parseChord).flatMap((r) => (r.ok ? [chordToMidis(r.chord)] : []));
    if (midis.length === 0) return;
    setPlaying(true);
    try {
      const pb = await playProgression(midis, 1.1, onChord);
      playback.current = pb;
      await pb.done;
    } finally {
      playback.current = null;
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "停止" : label}
      aria-pressed={playing}
      className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-muted", playing && "border-accent text-accent", className)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        {playing ? <rect x="5" y="5" width="14" height="14" rx="2" /> : <path d="M7 4v16l13-8z" />}
      </svg>
      <span>{playing ? "停止" : label}</span>
    </button>
  );
}
