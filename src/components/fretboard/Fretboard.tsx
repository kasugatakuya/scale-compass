"use client";

import { useId, useMemo } from "react";
import type { Tuning } from "@/data/tunings";
import { DOUBLE_INLAY_FRETS, type FretboardMarker, type FretRange, INLAY_FRETS, type Position, stringNumber } from "@/lib/music/fretboard";
import { midiToNoteName } from "@/lib/music/notes";
import type { LabelMode } from "@/lib/url-state";

export interface FretboardProps {
  tuning: Tuning;
  markers: FretboardMarker[];
  range: FretRange;
  labelMode: LabelMode;
  lefty?: boolean;
  /** ハイライトするポジション（範囲を淡く塗る） */
  position?: Position | null;
  /** タブ入力などで選択中の音 */
  selected?: { string: number; fret: number }[];
  onNoteClick?: (pos: { string: number; fret: number }) => void;
  /** 空いているセル（マーカーなし）もクリック可能にするか */
  clickEmpty?: boolean;
  className?: string;
  ariaLabel?: string;
}

const FRET_W = 58;
const NUT_W = 34;
const STRING_GAP = 30;
const PAD_X = 36;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

export function Fretboard({ tuning, markers, range, labelMode, lefty = false, position = null, selected = [], onNoteClick, clickEmpty = true, className = "", ariaLabel }: FretboardProps) {
  const uid = useId();
  const stringCount = tuning.strings.length;
  const fretCount = range.max - range.min + 1;
  const showNut = range.min === 0;
  const firstW = showNut ? NUT_W : FRET_W;
  const width = PAD_X * 2 + firstW + (fretCount - 1) * FRET_W;
  const height = PAD_TOP + PAD_BOTTOM + (stringCount - 1) * STRING_GAP;
  const boardLeft = PAD_X;
  const boardRight = width - PAD_X;

  // フレット f の左右端（左利きなら左右反転）
  const fretBounds = useMemo(() => {
    const m = new Map<number, { x0: number; x1: number }>();
    let x = boardLeft;
    for (let f = range.min; f <= range.max; f++) {
      const w = f === range.min ? firstW : FRET_W;
      m.set(f, { x0: x, x1: x + w });
      x += w;
    }
    return m;
  }, [range.min, range.max, firstW, boardLeft]);

  const flipX = (x: number) => (lefty ? width - x : x);
  const centerX = (f: number) => {
    const b = fretBounds.get(f)!;
    return flipX((b.x0 + b.x1) / 2);
  };
  // 弦 index 0 = 最低音弦 → 画面の一番下
  const stringY = (s: number) => PAD_TOP + (stringCount - 1 - s) * STRING_GAP;

  const markerMap = useMemo(() => {
    const m = new Map<string, FretboardMarker>();
    for (const mk of markers) if (mk.fret >= range.min && mk.fret <= range.max) m.set(`${mk.string}:${mk.fret}`, mk);
    return m;
  }, [markers, range.min, range.max]);
  const selectedSet = useMemo(() => new Set(selected.map((s) => `${s.string}:${s.fret}`)), [selected]);

  const labels = tuning.strings.map((m) => midiToNoteName(m).replace(/-?\d+$/, ""));

  return (
    <div className={`overflow-x-auto scrollbar-thin ${className}`}>
      <svg
        role="img"
        aria-label={ariaLabel ?? `${tuning.nameJa} の指板。${markers.length} 個の音を表示`}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block select-none"
        style={{ minWidth: width }}
      >
        <defs>
          <clipPath id={`${uid}-board`}>
            <rect x={flipX(boardLeft) < flipX(boardRight) ? flipX(boardLeft) : flipX(boardRight)} y={PAD_TOP - 10} width={boardRight - boardLeft} height={(stringCount - 1) * STRING_GAP + 20} rx={4} />
          </clipPath>
        </defs>
        {/* 木部 */}
        <rect
          x={Math.min(flipX(boardLeft), flipX(boardRight))}
          y={PAD_TOP - 10}
          width={boardRight - boardLeft}
          height={(stringCount - 1) * STRING_GAP + 20}
          rx={4}
          fill="var(--fb-wood)"
        />
        {/* ポジションのハイライト */}
        {position && (
          <rect
            x={Math.min(flipX(fretBounds.get(Math.max(position.range.min, range.min))?.x0 ?? boardLeft), flipX(fretBounds.get(Math.min(position.range.max, range.max))?.x1 ?? boardRight))}
            y={PAD_TOP - 10}
            width={Math.abs((fretBounds.get(Math.min(position.range.max, range.max))?.x1 ?? boardRight) - (fretBounds.get(Math.max(position.range.min, range.min))?.x0 ?? boardLeft))}
            height={(stringCount - 1) * STRING_GAP + 20}
            fill="var(--fb-position)"
          />
        )}
        {/* インレイ */}
        {Array.from(fretBounds.entries()).map(([f]) => {
          if (f === 0 || !INLAY_FRETS.includes(f)) return null;
          const cx = centerX(f);
          const midY = PAD_TOP + ((stringCount - 1) * STRING_GAP) / 2;
          if (DOUBLE_INLAY_FRETS.includes(f)) {
            return (
              <g key={`inlay-${f}`} fill="var(--fb-inlay)">
                <circle cx={cx} cy={midY - STRING_GAP} r={5} />
                <circle cx={cx} cy={midY + STRING_GAP} r={5} />
              </g>
            );
          }
          return <circle key={`inlay-${f}`} cx={cx} cy={midY} r={5} fill="var(--fb-inlay)" />;
        })}
        {/* フレット線 */}
        {Array.from(fretBounds.entries()).map(([f, b]) => {
          const isNut = f === 0;
          const x = flipX(b.x1);
          const leftEdge = f === range.min ? flipX(b.x0) : null;
          return (
            <g key={`fret-${f}`}>
              {leftEdge !== null && !isNut && <line x1={leftEdge} y1={PAD_TOP - 10} x2={leftEdge} y2={PAD_TOP + (stringCount - 1) * STRING_GAP + 10} stroke="var(--fb-fret)" strokeWidth={2} />}
              {isNut ? (
                <rect x={x - 3} y={PAD_TOP - 10} width={6} height={(stringCount - 1) * STRING_GAP + 20} fill="var(--fb-nut)" />
              ) : (
                <line x1={x} y1={PAD_TOP - 10} x2={x} y2={PAD_TOP + (stringCount - 1) * STRING_GAP + 10} stroke="var(--fb-fret)" strokeWidth={2} />
              )}
              {/* フレット番号 */}
              {f > 0 && (
                <text x={centerX(f)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                  {f}
                </text>
              )}
            </g>
          );
        })}
        {/* 弦 */}
        {tuning.strings.map((_, s) => {
          const y = stringY(s);
          const thickness = 1 + ((stringCount - 1 - s) / Math.max(1, stringCount - 1)) * 2.2;
          return (
            <g key={`string-${s}`}>
              <line x1={Math.min(flipX(boardLeft), flipX(boardRight))} y1={y} x2={Math.max(flipX(boardLeft), flipX(boardRight))} y2={y} stroke="var(--fb-string)" strokeWidth={thickness} />
              <text x={lefty ? width - PAD_X + 10 : PAD_X - 10} y={y + 4} textAnchor={lefty ? "start" : "end"} fontSize={11} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                {labels[s]}
              </text>
            </g>
          );
        })}
        {/* クリック領域（空セル） */}
        {clickEmpty && onNoteClick &&
          tuning.strings.map((_, s) =>
            Array.from(fretBounds.entries()).map(([f, b]) => {
              if (markerMap.has(`${s}:${f}`)) return null;
              const x0 = Math.min(flipX(b.x0), flipX(b.x1));
              return (
                <rect
                  key={`cell-${s}-${f}`}
                  x={x0}
                  y={stringY(s) - STRING_GAP / 2}
                  width={b.x1 - b.x0}
                  height={STRING_GAP}
                  fill="transparent"
                  className="cursor-pointer hover:fill-[var(--fb-position)]"
                  onClick={() => onNoteClick({ string: s, fret: f })}
                  aria-hidden="true"
                />
              );
            }),
          )}
        {/* マーカー */}
        {Array.from(markerMap.values()).map((mk) => {
          const cx = centerX(mk.fret);
          const cy = stringY(mk.string);
          const isSel = selectedSet.has(`${mk.string}:${mk.fret}`);
          const label = labelMode === "name" ? mk.name : labelMode === "degree" ? mk.degree : "";
          const r = 12;
          const fill = mk.kind === "root" ? "var(--fb-root)" : mk.kind === "chord-tone" ? "var(--fb-chord)" : mk.kind === "tension" ? "var(--fb-tension)" : "var(--fb-scale-fill)";
          const stroke = mk.kind === "scale-tone" ? "var(--fb-scale)" : fill;
          const textFill = mk.kind === "scale-tone" ? "var(--foreground)" : "var(--fb-marker-text)";
          const aria = `${stringNumber(tuning, mk.string)}弦 ${mk.fret === 0 ? "開放" : `${mk.fret}フレット`}: ${mk.name}（${mk.degree}）${mk.kind === "root" ? " ルート" : mk.kind === "chord-tone" ? " コードトーン" : mk.kind === "tension" ? " テンション" : ""}${mk.isAvoid ? " アヴォイド" : ""}`;
          const shape =
            mk.kind === "chord-tone" ? (
              <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy} ${cx},${cy + r + 1} ${cx - r - 1},${cy}`} fill={fill} stroke={stroke} strokeWidth={1.5} />
            ) : mk.kind === "tension" ? (
              <rect x={cx - r + 1} y={cy - r + 1} width={(r - 1) * 2} height={(r - 1) * 2} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />
            ) : (
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={mk.isAvoid ? 1.5 : 1.5} strokeDasharray={mk.isAvoid ? "3 2" : undefined} />
            );
          const interactive = Boolean(onNoteClick);
          return (
            <g
              key={`${mk.string}:${mk.fret}`}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={aria}
              className={interactive ? "cursor-pointer outline-none focus-visible:[&>circle,&>polygon,&>rect]:stroke-[var(--ring)] focus-visible:[&>circle,&>polygon,&>rect]:stroke-[3px]" : undefined}
              onClick={interactive ? () => onNoteClick!({ string: mk.string, fret: mk.fret }) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNoteClick!({ string: mk.string, fret: mk.fret });
                      }
                    }
                  : undefined
              }
            >
              {isSel && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="var(--ring)" strokeWidth={2.5} />}
              {shape}
              {label && (
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={label.length > 2 ? 9 : 11} fontWeight={600} fill={textFill} fontFamily="var(--font-sans)" style={{ pointerEvents: "none" }}>
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
