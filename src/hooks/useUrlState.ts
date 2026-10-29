"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_STATE, queryToState, stateToQuery, type ToolState } from "@/lib/url-state";

/**
 * ツールの状態を URL クエリと同期する。
 * 初期値はクエリから読み、更新は history.replaceState で URL に反映（共有可能）。
 */
export function useUrlState(): [ToolState, (patch: Partial<ToolState> | ((prev: ToolState) => Partial<ToolState>)) => void] {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ToolState>(() => queryToState(searchParams.toString()));
  const lastQuery = useRef(stateToQuery(state));

  // 戻る／進むなど外部から URL が変わったときは取り込む
  useEffect(() => {
    const q = searchParams.toString();
    if (q === lastQuery.current) return;
    // 空クエリ（トップへ戻った）なら既定へ
    const next = q ? queryToState(q) : { ...DEFAULT_STATE, chords: [...DEFAULT_STATE.chords] };
    lastQuery.current = stateToQuery(next);
    setState(next);
  }, [searchParams]);

  const update = useCallback((patch: Partial<ToolState> | ((prev: ToolState) => Partial<ToolState>)) => {
    setState((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      const q = stateToQuery(next);
      if (q !== lastQuery.current) {
        lastQuery.current = q;
        if (typeof window !== "undefined") {
          const url = `${window.location.pathname}?${q}`;
          window.history.replaceState(window.history.state, "", url);
        }
      }
      return next;
    });
  }, []);

  return [state, update];
}
