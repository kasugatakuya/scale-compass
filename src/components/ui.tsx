import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ children, className, title, actions, id }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const sizes = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const variants = {
    primary: "bg-accent text-accent-foreground hover:opacity-90",
    secondary: "border border-border bg-card hover:bg-muted",
    ghost: "hover:bg-muted",
    danger: "border border-danger/40 text-danger hover:bg-danger-soft",
  }[variant];
  return <button type="button" className={cn(base, sizes, variants, className)} {...props} />;
}

export function Select({ label, className, children, id, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const selectId = id ?? `sel-${label.replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={selectId} className={cn("flex flex-col gap-1 text-xs text-muted-foreground", className)}>
      <span>{label}</span>
      <select
        id={selectId}
        className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

/** ラジオグループ風の切替ボタン */
export function Segmented<T extends string>({ label, value, options, onChange, size = "md" }: { label: string; value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span id={`seg-${label}`}>{label}</span>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="inline-flex rounded-md border border-border bg-card p-0.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.title}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded px-2 font-medium transition-colors",
                size === "sm" ? "py-0.5 text-xs" : "py-1 text-sm",
                active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className="relative h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "root" | "chord" | "tension" | "danger" | "p1" | "p2" | "p3"; className?: string }) {
  const tones = {
    neutral: "bg-muted text-foreground",
    accent: "bg-accent-soft text-accent",
    root: "bg-fb-root text-white",
    chord: "bg-fb-chord text-white",
    tension: "bg-fb-tension text-white",
    danger: "bg-danger-soft text-danger",
    p1: "bg-accent text-accent-foreground",
    p2: "bg-accent-soft text-accent",
    p3: "bg-muted text-muted-foreground",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones, className)}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-border bg-muted px-1 font-mono text-[11px]">{children}</kbd>;
}
