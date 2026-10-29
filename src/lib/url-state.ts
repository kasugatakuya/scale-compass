/**
 * スケール提案ツールの状態 ⇄ URL クエリ。共有できるようにすべての入力を載せる。
 */
import { DEFAULT_TUNING_ID, type Instrument } from "@/data/tunings";
import type { KeyMode } from "@/lib/music/key";
import type { PositionSystem } from "@/lib/music/fretboard";

export type LabelMode = "name" | "degree" | "dot";

export interface ToolState {
  tonic: string;
  mode: KeyMode;
  /** コード名の配列（入力順） */
  chords: string[];
  instrument: Instrument;
  tuningId: string;
  /** カスタムチューニングの MIDI 列（tuningId が "custom" のとき） */
  customStrings: number[] | null;
  /** 選択中のコードのインデックス（-1 = キー全体） */
  selected: number;
  /** 選択中のスケール提案の id（"dorian@2" など） */
  scale: string | null;
  labelMode: LabelMode;
  lefty: boolean;
  fretMin: number;
  fretMax: number;
  positionSystem: PositionSystem | "all";
  positionIndex: number;
}

export const DEFAULT_STATE: ToolState = {
  tonic: "C",
  mode: "major",
  chords: ["Dm7", "G7", "Cmaj7", "Am7"],
  instrument: "guitar",
  tuningId: DEFAULT_TUNING_ID.guitar,
  customStrings: null,
  selected: 0,
  scale: null,
  labelMode: "degree",
  lefty: false,
  fretMin: 0,
  fretMax: 15,
  positionSystem: "all",
  positionIndex: 0,
};

const INSTRUMENTS: Instrument[] = ["guitar", "guitar7", "bass4", "bass5"];

export function stateToQuery(state: ToolState): string {
  const p = new URLSearchParams();
  const d = DEFAULT_STATE;
  p.set("key", state.tonic);
  p.set("mode", state.mode);
  p.set("prog", state.chords.join("|"));
  if (state.instrument !== d.instrument) p.set("inst", state.instrument);
  if (state.tuningId !== DEFAULT_TUNING_ID[state.instrument]) p.set("tuning", state.tuningId);
  if (state.customStrings) p.set("strings", state.customStrings.join("."));
  if (state.selected !== d.selected) p.set("i", String(state.selected));
  if (state.scale) p.set("scale", state.scale);
  if (state.labelMode !== d.labelMode) p.set("view", state.labelMode);
  if (state.lefty) p.set("lefty", "1");
  if (state.fretMin !== d.fretMin || state.fretMax !== d.fretMax) p.set("frets", `${state.fretMin}-${state.fretMax}`);
  if (state.positionSystem !== "all") p.set("pos", `${state.positionSystem}-${state.positionIndex}`);
  return p.toString().replace(/%7C/g, "|");
}

export function queryToState(query: string | URLSearchParams): ToolState {
  const p = typeof query === "string" ? new URLSearchParams(query) : query;
  const s: ToolState = { ...DEFAULT_STATE, chords: [...DEFAULT_STATE.chords] };
  const key = p.get("key");
  if (key && /^[A-G](♯|#|♭|b)?$/.test(key)) s.tonic = key.replace("#", "♯").replace("b", "♭");
  const mode = p.get("mode");
  if (mode === "major" || mode === "minor") s.mode = mode;
  const prog = p.get("prog");
  if (prog !== null) s.chords = prog.split(/[|,]/).map((c) => c.trim()).filter(Boolean);
  const inst = p.get("inst");
  if (inst && (INSTRUMENTS as string[]).includes(inst)) s.instrument = inst as Instrument;
  s.tuningId = p.get("tuning") ?? DEFAULT_TUNING_ID[s.instrument];
  const strings = p.get("strings");
  if (strings) {
    const arr = strings.split(".").map(Number).filter((n) => Number.isInteger(n) && n > 0 && n < 128);
    if (arr.length >= 4) {
      s.customStrings = arr;
      s.tuningId = "custom";
    }
  }
  const i = Number(p.get("i"));
  if (p.has("i") && Number.isInteger(i) && i >= -1) s.selected = i;
  s.scale = p.get("scale");
  const view = p.get("view");
  if (view === "name" || view === "degree" || view === "dot") s.labelMode = view;
  s.lefty = p.get("lefty") === "1";
  const frets = /^(\d+)-(\d+)$/.exec(p.get("frets") ?? "");
  if (frets) {
    const a = Number(frets[1]);
    const b = Number(frets[2]);
    if (a >= 0 && b <= 24 && b - a >= 4) {
      s.fretMin = a;
      s.fretMax = b;
    }
  }
  const pos = /^(box|3nps)-(\d+)$/.exec(p.get("pos") ?? "");
  if (pos) {
    s.positionSystem = pos[1] as PositionSystem;
    s.positionIndex = Number(pos[2]);
  }
  return s;
}

/** コード進行集などから「ツールで開く」リンクを作る */
export function toolHref(tonic: string, mode: KeyMode, chords: string[]): string {
  return `/?${stateToQuery({ ...DEFAULT_STATE, tonic, mode, chords, selected: 0 })}`;
}
