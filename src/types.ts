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
 * Configuration options for useDynamicSlice / useDynamicSliceWithCleanup.
 */
export interface SliceConfig<T extends SliceState = SliceState> {
  /** Initial state values used on first mount and on resetData. */
  initialState: T;
  /** Keep state alive across navigation (not reset on resetNonPersistentDynamicSlices). */
  persistOnNavigation?: boolean;
  /** Automatically reset state when the component unmounts (useDynamicSliceWithCleanup only). */
  resetOnUnmount?: boolean;
}

/**
 * Return type of useDynamicSlice / useDynamicSliceWithCleanup.
 */
export interface UseDynamicSliceReturn<T extends SliceState> {
  /** Current slice state. */
  data: T;
  /**
   * Update the slice state. Accepts either a partial object (merged into
   * current state) or a function that receives the latest state and returns
   * a partial update — exactly like React's useState setter.
   */
  setData: (updater: SetStateAction<T>) => void;
  /** Reset the slice to its initial state. */
  resetData: () => void;
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
