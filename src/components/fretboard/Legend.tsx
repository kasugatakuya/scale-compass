export function FretboardLegend({ showAvoid = true, showTension = true }: { showAvoid?: boolean; showTension?: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="凡例">
      <li className="flex items-center gap-1.5">
        <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--fb-root)" /></svg>
        ルート（丸）
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="16" height="16" aria-hidden="true"><polygon points="8,0.5 15.5,8 8,15.5 0.5,8" fill="var(--fb-chord)" /></svg>
        コードトーン 3rd・5th・7th（ひし形）
      </li>
      {showTension && (
        <li className="flex items-center gap-1.5">
          <svg width="16" height="16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="var(--fb-tension)" /></svg>
          テンション 9・11・13（四角）
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="var(--fb-scale-fill)" stroke="var(--fb-scale)" strokeWidth="1.5" /></svg>
        スケール音（白丸）
      </li>
      {showAvoid && (
        <li className="flex items-center gap-1.5">
          <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="var(--fb-scale-fill)" stroke="var(--fb-scale)" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
          アヴォイド候補（点線）
        </li>
      )}
    </ul>
  );
}
