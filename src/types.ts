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
  /** Groups this slice belongs to for selective reset. */
  navigationGroups?: string[];
  resetOnUnmount?: boolean;
}

/** Configuration for resetting dynamic slices. */
export interface ResetOptions {
  /** Groups to ignore during reset (even if they would otherwise be reset). */
  excludeGroups?: string[];
}

/** Configuration for creating the global store. */
export interface DynamicStoreConfig {
  /** 
   * If true, automatically resets non-persistent slices when router-related 
   * actions are dispatched. Default is false.
   */
  autoResetOnNavigation?: boolean;
  /**
   * Custom prefixes for router actions that trigger reset.
   * Default: ['@@router/', 'router/']
   */
  routerActionPrefixes?: string[];
  /**
   * Static reducers that should always be present in the store.
   */
  staticReducers?: Record<string, any>;
  /**
   * Extra middlewares to add to the store.
   */
  extraMiddlewares?: any[];
  /**
   * Initial state of the store.
   */
  preloadedState?: any;
  /**
   * Whether to enable Redux DevTools.
   */
  devTools?: boolean | any;
}

/** Scope for resetting dynamic slices. */
export type ResetScope = "all" | "non-persistent" | string[];

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
export interface UseDynamicSliceReturn<T extends SliceState, S = T>
  extends UseDynamicSliceActionsReturn<T> {
  /** Current slice state (or selected portion of it). */
  data: S;
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
