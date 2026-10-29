"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const ORDER = ["system", "light", "dark"] as const;
const LABEL: Record<(typeof ORDER)[number], string> = { system: "システム", light: "ライト", dark: "ダーク" };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // SSR 中はテーマが不明なので「システム」を表示し、クライアントで実際の値に置き換える
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const current = (mounted && ORDER.includes(theme as (typeof ORDER)[number]) ? theme : "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
      aria-label={`テーマ: ${LABEL[current]}。クリックで${LABEL[next]}に切替`}
      title={`テーマ: ${LABEL[current]}`}
    >
      <span aria-hidden="true">
        {current === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        ) : current === "light" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8" /></svg>
        )}
      </span>
      <span className="hidden sm:inline">{LABEL[current]}</span>
    </button>
  );
}
