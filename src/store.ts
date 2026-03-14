import {
  configureStore,
  createSlice,
  combineReducers,
  type PayloadAction,
  type Reducer,
  type Middleware,
} from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import type { SliceState, SliceConfig, DynamicSliceRegistryEntry, ResetScope, ResetOptions, DynamicStoreConfig } from "./types";

// ─── Internal registry ────────────────────────────────────────────────────────

const dynamicSlices = new Map<string, DynamicSliceRegistryEntry>();

// ─── Slice factory ────────────────────────────────────────────────────────────

function createDynamicSlice<T extends SliceState>(
  sliceId: string,
  initialState: T,
) {
  return createSlice({
    name: sliceId,
    initialState,
    reducers: {
      setData: (state, action: PayloadAction<Partial<T>>) =>
        ({ ...state, ...action.payload }) as T,
      resetData: () => initialState,
    },
  });
}

// Internal reference to the singleton store once it's created
let store: ReturnType<typeof configureStore> | undefined;
let storeConfig: DynamicStoreConfig = { 
  autoResetOnNavigation: false,
  routerActionPrefixes: ["@@router/", "router/"]
};

const routerResetMiddleware: Middleware = (_api) => (next) => (action) => {
  const result = next(action);

  const prefixes = storeConfig.routerActionPrefixes || ["@@router/", "router/"];

  if (
    storeConfig.autoResetOnNavigation &&
    action !== null &&
    typeof action === "object" &&
    "type" in action &&
    typeof (action as { type: unknown }).type === "string"
  ) {
    const type = (action as { type: string }).type;
    const isRouterAction = prefixes.some((prefix) => type.startsWith(prefix));
    
    if (isRouterAction) {
      resetDynamicSlices("non-persistent");
    }
  }

  return result;
};

/**
 * Creates and configures the global Redux store for dynamic slices.
 */
export function createDynamicStore(config: DynamicStoreConfig = {}) {
  // Merge config, ensuring we preserve default prefixes if not provided
  storeConfig = { 
    ...storeConfig, 
    ...config,
    routerActionPrefixes: config.routerActionPrefixes || storeConfig.routerActionPrefixes 
  };

  const rootReducer = combineReducers({
    ...storeConfig.staticReducers,
    _dynamicFallback: (state = null) => state,
  });

  store = configureStore({
    reducer: rootReducer as unknown as Reducer,
    middleware: (getDefaultMiddleware) => {
      const middleware = getDefaultMiddleware().concat(routerResetMiddleware);
      if (storeConfig.extraMiddlewares) {
        return middleware.concat(storeConfig.extraMiddlewares);
      }
      return middleware;
    },
    devTools: storeConfig.devTools,
    preloadedState: storeConfig.preloadedState,
  });

  return store;
}

/**
 * Internal helper to ensure the store has been initialized.
 */
function ensureStore() {
  if (!store) {
    throw new Error(
      "Dynamic store is not initialized. Please call createDynamicStore() at the entry point of your application.",
    );
  }
  return store;
}

export const useAppDispatch = () => ensureStore().dispatch;
export const useAppSelector: TypedUseSelectorHook<any> = useSelector;

/**
 * Returns the current state of the global Redux store.
 */
export function getDynamicStoreState() {
  return ensureStore().getState();
}

// ─── Dynamic reducer injection ────────────────────────────────────────────────

/**
 * Registers a slice and injects its reducer into the store.
 * Calling this multiple times with the same `sliceId` is a no-op.
 */
export function injectReducer<T extends SliceState>(
  sliceId: string,
  config: SliceConfig<T>,
): void {
  if (dynamicSlices.has(sliceId)) return;

  const slice = createDynamicSlice(sliceId, config.initialState);

  dynamicSlices.set(sliceId, {
    actions: slice.actions,
    reducer: slice.reducer,
    config: config as SliceConfig,
  });

  const allReducers: Record<string, Reducer> = {
    ...storeConfig.staticReducers,
    _dynamicFallback: (state = null) => state,
  };
  
  dynamicSlices.forEach((entry, id) => {
    allReducers[id] = entry.reducer as Reducer;
  });

  ensureStore().replaceReducer(combineReducers(allReducers) as unknown as Reducer);
}

// ─── Internal accessor ────────────────────────────────────────────────────────

/**
 * Returns the action creators for a registered slice.
 * Throws if the slice has not been registered yet.
 * @internal
 */
export function getDynamicSliceActions(
  sliceId: string,
): DynamicSliceRegistryEntry["actions"] {
  const entry = dynamicSlices.get(sliceId);
  if (!entry) {
    throw new Error(
      `Dynamic slice "${sliceId}" is not registered. ` +
        "Make sure useDynamicSlice has been called before using imperative helpers.",
    );
  }
  return entry.actions;
}

/**
 * Returns the config for a registered slice, or undefined if not registered.
 * @internal
 */
export function getDynamicSliceConfig(sliceId: string): SliceConfig | undefined {
  return dynamicSlices.get(sliceId)?.config;
}

// ─── Imperative helpers ───────────────────────────────────────────────────────

/**
 * Merge data into a dynamic slice from outside a React component.
 *
 * @example
 * ```ts
 * updateDynamicSlice('cart', { discount: 20 });
 * ```
 */
export function updateDynamicSlice<T extends SliceState>(
  sliceId: string,
  data: Partial<T>,
): void {
  const actions = getDynamicSliceActions(sliceId);
  ensureStore().dispatch(actions.setData(data as Partial<SliceState>));
}

/**
 * Reset a single dynamic slice to its initial state from outside React.
 *
 * @example
 * ```ts
 * resetDynamicSlice('editForm');
 * ```
 */
export function resetDynamicSlice(sliceId: string): void {
  const actions = getDynamicSliceActions(sliceId);
  ensureStore().dispatch(actions.resetData());
}

/**
 * Reset dynamic slices based on the provided scope.
 *
 * - `resetDynamicSlices("non-persistent")`: Resets all slices where `persistOnNavigation` is false.
 * - `resetDynamicSlices("all")`: Resets every registered slice regardless of persistence.
 * - `resetDynamicSlices(["cart", "ui"])`: Resets only slices belonging to these groups.
 *
 * Use the optional `options.excludeGroups` to preserve specific groups from being reset.
 *
 * @example
 * ```ts
 * // Standard navigation reset (must specify scope)
 * resetDynamicSlices("non-persistent");
 *
 * // Deep cleanup with exclusion
 * resetDynamicSlices("all", { excludeGroups: ["settings"] });
 *
 * // Feature-specific reset (no second parameter for groups)
 * resetDynamicSlices(["checkout"]);
 * ```
 */
export function resetDynamicSlices(
  scope: "all" | "non-persistent",
  options?: ResetOptions,
): void;
export function resetDynamicSlices(scope: string[]): void;
export function resetDynamicSlices(
  scope: ResetScope,
  options?: ResetOptions,
): void {
  const excludeGroups = options?.excludeGroups;

  dynamicSlices.forEach((entry) => {
    const { navigationGroups, persistOnNavigation } = entry.config;

    // 0. Check exclusion (if slice belongs to an excluded group, skip reset)
    if (
      excludeGroups &&
      navigationGroups?.some((g) => excludeGroups.includes(g))
    ) {
      return;
    }

    // 1. Reset everything
    if (scope === "all") {
      ensureStore().dispatch(entry.actions.resetData());
      return;
    }

    // 2. Explicit group reset
    if (Array.isArray(scope)) {
      const hasMatch = navigationGroups?.some((group) => scope.includes(group));
      if (hasMatch) {
        ensureStore().dispatch(entry.actions.resetData());
      }
      return;
    }

    // 3. non-persistent mode
    if (!persistOnNavigation) {
      ensureStore().dispatch(entry.actions.resetData());
    }
  });
}

