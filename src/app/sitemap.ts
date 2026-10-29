import type { MetadataRoute } from "next";
import { CHORD_DOCS } from "@/data/chord-docs";
import { SITE_URL } from "@/lib/site";

// 静的書き出し (output: "export") ではビルド時に sitemap.xml として生成される
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/progressions`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/chords`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...CHORD_DOCS.map((doc) => ({
      url: `${SITE_URL}/chords/${doc.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
