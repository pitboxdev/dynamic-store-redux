// ─── RTK store ────────────────────────────────────────────────────────────────
export { store, useAppDispatch, useAppSelector } from "./store";
export type { RootState, AppDispatch } from "./store";

// ─── Dynamic slice hooks ──────────────────────────────────────────────────────
export {
  useDynamicSlice,
  useDynamicSliceWithCleanup,
  useDynamicSliceActions,
} from "./hooks";

// ─── Imperative helpers ───────────────────────────────────────────────────────
export {
  injectReducer,
  updateDynamicSlice,
  resetDynamicSlice,
  resetAllDynamicSlices,
  resetNonPersistentDynamicSlices,
  navigateAction,
} from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  SliceState,
  SetStateAction,
  SliceConfig,
  UseDynamicSliceReturn,
  UseDynamicSliceActionsReturn,
  DynamicSliceRegistryEntry,
} from "./types";
