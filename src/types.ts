// ─── Base constraints ─────────────────────────────────────────────────────────

/**
 * A plain object that can serve as slice state.
 * Keys are strings, values can be anything.
 */
export type SliceState = Record<string, unknown>;

// ─── useDynamicSlice types ────────────────────────────────────────────────────

/**
 * Updater argument for setData — either a partial object or a function
 * that receives the previous state and returns a partial object.
 * Mirrors the React useState updater pattern.
 */
export type SetStateAction<T extends SliceState> =
  | Partial<T>
  | ((prevState: T) => Partial<T>);

/**
 * Configuration options for useDynamicSlice.
 */
export interface SliceConfig<T extends SliceState = SliceState> {
  /** Initial state values used on first mount and on resetData. */
  initialState: T;
  /** Keep state alive across navigation (not reset on resetNonPersistentDynamicSlices). */
  persistOnNavigation?: boolean;
  /** Automatically reset state when the component unmounts. */
  resetOnUnmount?: boolean;
}

/**
 * Return type of useDynamicSliceActions.
 */
export interface UseDynamicSliceActionsReturn<T extends SliceState> {
  /**
   * Update the slice state. Accepts either a partial object (merged into
   * current state) or a function that receives the latest state and returns
   * a partial update.
   */
  setData: (updater: SetStateAction<T>) => void;
  /** Reset the slice to its initial state. */
  resetData: () => void;
  /** Get the current store data synchronously without subscribing to changes. */
  getData: () => T;
}

/**
 * Return type of useDynamicSlice.
 */
export interface UseDynamicSliceReturn<T extends SliceState>
  extends UseDynamicSliceActionsReturn<T> {
  /** Current slice state. */
  data: T;
}

// ─── Internal registry ────────────────────────────────────────────────────────

/**
 * Internal registry entry stored per sliceId.
 * Uses `any` intentionally — the Map is an internal detail and callers
 * always interact through the typed hook API.
 * @internal
 */
export interface DynamicSliceRegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => { type: string; payload: any };
    resetData: () => { type: string };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reducer: (state: any, action: any) => any;
  config: SliceConfig;
}
