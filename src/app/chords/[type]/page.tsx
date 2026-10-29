import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHORD_DOCS, DOC_BY_SLUG } from "@/data/chord-docs";
import { ChordDocView } from "@/components/chords/ChordDocView";

export function generateStaticParams() {
  return CHORD_DOCS.map((d) => ({ type: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const doc = DOC_BY_SLUG[type];
  if (!doc) return {};
  return { title: doc.title, alternates: { canonical: `/chords/${doc.slug}` }, description: `${doc.title}の構成音・響き・使われる場面・相性のよいスケールを、ギター／ベースの指板とタブ譜で解説。` };
}

export default async function ChordDocPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const doc = DOC_BY_SLUG[type];
  if (!doc) notFound();
  return <ChordDocView doc={doc} />;
}
