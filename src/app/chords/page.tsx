import type { Metadata } from "next";
import Link from "next/link";
import { CHORD_DOCS, DOC_GROUP_LABEL, DOC_GROUP_ORDER } from "@/data/chord-docs";

export const metadata: Metadata = {
  title: "コード解説",
  description: "三和音、セブンス、ナインス、テンション、ドミナントの役割、裏コード、ダイアトニックコード、転回形など、コードの種類ごとに構成音・響き・使われる場面・相性のよいスケールを解説。",
};

export default function ChordsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">コード解説</h1>
        <p className="text-sm text-muted-foreground">
          コードの種類ごとに、構成音（度数）・響きの特徴・使われる場面・相性のよいスケール・ギター／ベースでの弾き方を、指板とタブ譜つきで解説します。初めての方は「三和音」から順に読むのがおすすめです。
        </p>
      </section>
      {DOC_GROUP_ORDER.map((group) => {
        const docs = CHORD_DOCS.filter((d) => d.group === group);
        return (
          <section key={group} aria-labelledby={`g-${group}`} className="flex flex-col gap-3">
            <h2 id={`g-${group}`} className="text-base font-semibold">
              {DOC_GROUP_LABEL[group]}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((d) => (
                <li key={d.slug}>
                  <Link href={`/chords/${d.slug}`} className="flex h-full flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent hover:bg-accent-soft/40">
                    <span className="font-semibold">{d.title}</span>
                    {d.subtitle && <span className="font-mono text-xs text-muted-foreground">{d.subtitle}</span>}
                    <span className="text-xs text-muted-foreground">{d.formula.join(" · ")}</span>
                    <span className="mt-1 line-clamp-2 text-xs leading-relaxed">{d.sound}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
