"use client";

import { useState } from "react";
import { playChord, playScale } from "@/lib/audio";
import { cn } from "@/components/ui";

export function PlayButton({ kind, midis, label, className }: { kind: "chord" | "scale"; midis: number[]; label: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={playing}
      onClick={async () => {
        setPlaying(true);
        try {
          if (kind === "chord") await playChord(midis);
          else await playScale(midis);
        } finally {
          setPlaying(false);
        }
      }}
      className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted disabled:opacity-60", className)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        {playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="M7 4v16l13-8z" />}
      </svg>
      <span>{kind === "chord" ? "試聴" : "スケール試聴"}</span>
    </button>
  );
}
