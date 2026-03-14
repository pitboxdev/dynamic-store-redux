// ─── RTK store ────────────────────────────────────────────────────────────────
export { createDynamicStore, useAppDispatch, useAppSelector } from "./store";

// ─── Dynamic slice hooks ──────────────────────────────────────────────────────
export {
  useDynamicSlice,
  useDynamicSliceActions,
} from "./hooks";

// ─── Imperative helpers ───────────────────────────────────────────────────────
export {
  injectReducer,
  updateDynamicSlice,
  resetDynamicSlice,
  resetDynamicSlices,
} from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  SliceState,
  SetStateAction,
  SliceConfig,
  UseDynamicSliceReturn,
  UseDynamicSliceActionsReturn,
  ResetScope,
  ResetOptions,
  DynamicStoreConfig,
  DynamicSliceRegistryEntry,
} from "./types";
