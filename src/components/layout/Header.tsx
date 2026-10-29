"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "スケール提案", short: "提案" },
  { href: "/progressions", label: "コード進行集", short: "進行集" },
  { href: "/chords", label: "コード解説", short: "コード" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        本文へスキップ
      </a>
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight" aria-label="Scale Compass ホーム">
          <Logo size={28} className="text-accent" />
          <span className="text-base sm:text-lg">Scale Compass</span>
        </Link>
        <nav aria-label="メインナビゲーション" className="ml-auto flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-2.5 ${active ? "bg-accent-soft text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </Link>
            );
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
