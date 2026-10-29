"use client";

import { KEY_TONICS, type KeyMode } from "@/lib/music/key";
import { nameToPc } from "@/lib/music/notes";
import { Segmented, cn } from "@/components/ui";

export function KeySelector({ tonic, mode, onChange }: { tonic: string; mode: KeyMode; onChange: (tonic: string, mode: KeyMode) => void }) {
  const tonicPc = nameToPc(tonic);
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span id="key-tonic-label">キー（トニック）</span>
        <div role="radiogroup" aria-labelledby="key-tonic-label" className="grid grid-cols-6 gap-1 sm:grid-cols-12">
          {KEY_TONICS[mode].map((name) => {
            const active = nameToPc(name) === tonicPc;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(name, mode)}
                className={cn(
                  "rounded-md border px-1.5 py-1.5 text-sm font-medium",
                  active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      <Segmented<KeyMode>
        label="モード"
        value={mode}
        onChange={(m) => {
          // 同じピッチクラスのまま表記を切り替える
          const next = KEY_TONICS[m].find((n) => nameToPc(n) === tonicPc) ?? KEY_TONICS[m][0];
          onChange(next, m);
        }}
        options={[
          { value: "major", label: "メジャー" },
          { value: "minor", label: "マイナー" },
        ]}
      />
    </div>
  );
}
