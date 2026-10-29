/**
 * タブ譜を SVG 文字列として描画（純粋関数）。PNG 書き出しの元にも使う。
 */
import type { Tuning } from "@/data/tunings";
import { stringLabels, type TabBar } from "./tab";

export interface TabSvgOptions {
  barsPerLine?: number;
  columnWidth?: number;
  stringGap?: number;
  /** 文字色・線色（ダーク／ライト対応のため呼び出し側で指定） */
  foreground?: string;
  background?: string;
  fontFamily?: string;
  title?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function tabToSvg(bars: TabBar[], tuning: Tuning, options: TabSvgOptions = {}): string {
  const barsPerLine = options.barsPerLine ?? 4;
  const colW = options.columnWidth ?? 26;
  const gap = options.stringGap ?? 16;
  const fg = options.foreground ?? "#1f2937";
  const bg = options.background ?? "#ffffff";
  const font = options.fontFamily ?? "ui-monospace, SFMono-Regular, Menlo, monospace";
  const labels = stringLabels(tuning);
  const stringCount = tuning.strings.length;
  const left = 40;
  const top = options.title ? 56 : 36;
  const systemHeight = gap * (stringCount - 1) + 56;

  const lines: string[][] = [];
  for (let b = 0; b < bars.length; b += barsPerLine) lines.push(bars.slice(b, b + barsPerLine).map(() => ""));
  const systems = Math.max(1, Math.ceil(bars.length / barsPerLine));
  let maxWidth = 0;
  const parts: string[] = [];

  for (let sys = 0; sys < systems; sys++) {
    const chunk = bars.slice(sys * barsPerLine, (sys + 1) * barsPerLine);
    const y0 = top + sys * systemHeight;
    let xCursor = left;
    const barXs: number[] = [xCursor];
    for (const bar of chunk) {
      xCursor += 10;
      for (const col of bar.columns) {
        const w = Math.max(colW, (col.label?.length ?? 0) * 8 + 8);
        const cx = xCursor + w / 2;
        if (col.label) parts.push(`<text x="${cx}" y="${y0 - 14}" text-anchor="middle" font-size="12" font-weight="600" fill="${fg}" font-family="${font}">${esc(col.label)}</text>`);
        for (const n of col.notes) {
          const y = y0 + (stringCount - 1 - n.string) * gap;
          const text = String(n.fret);
          const tw = text.length * 7 + 6;
          parts.push(`<rect x="${cx - tw / 2}" y="${y - 7}" width="${tw}" height="14" fill="${bg}" />`);
          parts.push(`<text x="${cx}" y="${y + 4}" text-anchor="middle" font-size="12" fill="${fg}" font-family="${font}">${text}</text>`);
        }
        xCursor += w;
      }
      xCursor += 10;
      barXs.push(xCursor);
    }
    if (chunk.length === 0) {
      xCursor += 120;
      barXs.push(xCursor);
    }
    maxWidth = Math.max(maxWidth, xCursor + 20);
    // 弦の線（上に描いて数字の矩形で隠す順にしたいので先頭に挿入）
    const stringLines: string[] = [];
    for (let s = 0; s < stringCount; s++) {
      const y = y0 + (stringCount - 1 - s) * gap;
      stringLines.push(`<line x1="${left}" y1="${y}" x2="${xCursor}" y2="${y}" stroke="${fg}" stroke-opacity="0.45" stroke-width="1" />`);
      stringLines.push(`<text x="${left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${fg}" font-family="${font}">${esc(labels[s])}</text>`);
    }
    for (const bx of barXs) {
      stringLines.push(`<line x1="${bx}" y1="${y0}" x2="${bx}" y2="${y0 + (stringCount - 1) * gap}" stroke="${fg}" stroke-width="1.2" />`);
    }
    parts.unshift(...stringLines);
  }

  const height = top + systems * systemHeight;
  const title = options.title ? `<text x="${left}" y="22" font-size="14" font-weight="700" fill="${fg}" font-family="${font}">${esc(options.title)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}" viewBox="0 0 ${maxWidth} ${height}"><rect width="100%" height="100%" fill="${bg}" />${title}${parts.join("")}</svg>`;
}
