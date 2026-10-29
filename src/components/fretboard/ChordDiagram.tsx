import type { Tuning } from "@/data/tunings";
import type { ChordVoicing } from "@/lib/music/voicings";
import { mod12, type PitchClass } from "@/lib/music/notes";

export interface ChordDiagramProps {
  voicing: ChordVoicing;
  tuning: Tuning;
  rootPc: PitchClass;
  /** ピッチクラス → 度数ラベル */
  degreeOf: (pc: PitchClass) => string;
  nameOf?: (pc: PitchClass) => string;
  labelMode?: "degree" | "name" | "dot";
  lefty?: boolean;
  title?: string;
  size?: number;
}

/** 縦型コードダイアグラム（弦が縦、フレットが横） */
export function ChordDiagram({ voicing, tuning, rootPc, degreeOf, nameOf, labelMode = "degree", lefty = false, title, size = 1 }: ChordDiagramProps) {
  const stringCount = tuning.strings.length;
  const colW = 22 * size;
  const rowH = 24 * size;
  const padX = 14 * size;
  const padTop = 30 * size;
  const rows = 5;
  const width = padX * 2 + (stringCount - 1) * colW;
  const height = padTop + rows * rowH + 14 * size;
  const base = voicing.baseFret;
  const sounded = voicing.frets.filter((f): f is number => f !== null);
  const needsBase = Math.min(...sounded.filter((f) => f > 0), Infinity) > 0 && base > 1;

  // 弦 index 0（最低音）は左。左利きなら右
  const xOf = (s: number) => padX + (lefty ? stringCount - 1 - s : s) * colW;
  const yOfFret = (f: number) => padTop + (f - base + 0.5) * rowH;

  return (
    <figure className="inline-flex flex-col items-center gap-1">
      <svg role="img" aria-label={`${title ?? ""} ${voicing.nameJa}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="select-none">
        {/* ナット or ベースフレット */}
        {base === 1 ? (
          <rect x={padX - 1} y={padTop - 3 * size} width={(stringCount - 1) * colW + 2} height={4 * size} fill="var(--fb-nut)" />
        ) : (
          <text x={lefty ? width - 2 : 2} y={padTop + rowH * 0.5 + 4 * size} fontSize={10 * size} textAnchor={lefty ? "end" : "start"} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
            {base}fr
          </text>
        )}
        {/* フレット線 */}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={i} x1={padX} y1={padTop + i * rowH} x2={padX + (stringCount - 1) * colW} y2={padTop + i * rowH} stroke="var(--fb-fret)" strokeWidth={1} />
        ))}
        {/* 弦 */}
        {tuning.strings.map((_, s) => (
          <line key={s} x1={xOf(s)} y1={padTop} x2={xOf(s)} y2={padTop + rows * rowH} stroke="var(--fb-string)" strokeWidth={1.2} />
        ))}
        {/* 押弦・開放・ミュート */}
        {voicing.frets.map((f, s) => {
          const x = xOf(s);
          if (f === null) {
            return (
              <text key={s} x={x} y={padTop - 8 * size} textAnchor="middle" fontSize={11 * size} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                ×
              </text>
            );
          }
          const pc = voicing.pcs[s]!;
          const isRoot = mod12(pc) === rootPc;
          const label = labelMode === "dot" ? "" : labelMode === "name" && nameOf ? nameOf(pc) : degreeOf(pc);
          if (f === 0) {
            return (
              <g key={s}>
                <circle cx={x} cy={padTop - 10 * size} r={6 * size} fill={isRoot ? "var(--fb-root)" : "var(--card)"} stroke={isRoot ? "var(--fb-root)" : "var(--fb-chord)"} strokeWidth={1.5} />
                {label && (
                  <text x={x} y={padTop - 10 * size + 3 * size} textAnchor="middle" fontSize={7.5 * size} fontWeight={600} fill={isRoot ? "var(--fb-marker-text)" : "var(--foreground)"}>
                    {label}
                  </text>
                )}
              </g>
            );
          }
          const y = yOfFret(f);
          return (
            <g key={s}>
              <circle cx={x} cy={y} r={8.5 * size} fill={isRoot ? "var(--fb-root)" : "var(--fb-chord)"} />
              {label && (
                <text x={x} y={y + 3 * size} textAnchor="middle" fontSize={label.length > 2 ? 7 * size : 8.5 * size} fontWeight={600} fill="var(--fb-marker-text)">
                  {label}
                </text>
              )}
            </g>
          );
        })}
        {needsBase && null}
      </svg>
      <figcaption className="text-[11px] text-muted-foreground">{voicing.nameJa}</figcaption>
    </figure>
  );
}
