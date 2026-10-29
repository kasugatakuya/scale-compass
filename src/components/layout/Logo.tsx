/** コンパス（方位磁針）をモチーフにした自作ロゴ */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className} focusable="false">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      {/* 4 方位の目盛り */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="24" y1="4" x2="24" y2="9" />
        <line x1="24" y1="39" x2="24" y2="44" />
        <line x1="4" y1="24" x2="9" y2="24" />
        <line x1="39" y1="24" x2="44" y2="24" />
      </g>
      {/* 針: 北側を赤系、南側を本体色 */}
      <polygon points="24,9.5 28.5,24 19.5,24" fill="var(--fb-root)" />
      <polygon points="24,38.5 28.5,24 19.5,24" fill="currentColor" opacity="0.85" />
      <circle cx="24" cy="24" r="3" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
