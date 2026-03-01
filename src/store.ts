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
import type { SliceState, SliceConfig, DynamicSliceRegistryEntry } from "./types";

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

// ─── Router reset middleware ──────────────────────────────────────────────────

const routerResetMiddleware: Middleware = (_api) => (next) => (action) => {
  const result = next(action);

  if (
    action !== null &&
    typeof action === "object" &&
    "type" in action &&
    typeof (action as { type: unknown }).type === "string"
  ) {
    const type = (action as { type: string }).type;
    if (
      type === "router/navigate" ||
      type.startsWith("@@router") ||
      type.startsWith("router/")
    ) {
      resetNonPersistentDynamicSlices();
    }
  }

  return result;
};

// ─── RTK store ────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: {} as Record<string, Reducer>,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(routerResetMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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

  const allReducers: Record<string, Reducer> = {};
  dynamicSlices.forEach((entry, id) => {
    allReducers[id] = entry.reducer as Reducer;
  });

  store.replaceReducer(combineReducers(allReducers) as unknown as Reducer);
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
  store.dispatch(actions.setData(data as Partial<SliceState>));
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
  store.dispatch(actions.resetData());
}

/**
 * Reset every registered dynamic slice to its initial state.
 *
 * @example
 * ```ts
 * resetAllDynamicSlices();
 * ```
 */
export function resetAllDynamicSlices(): void {
  dynamicSlices.forEach((entry) => {
    store.dispatch(entry.actions.resetData());
  });
}

/**
 * Reset only slices that do not have `persistOnNavigation: true`.
 * Typically dispatched on route change — see `navigateAction`.
 *
 * @example
 * ```ts
 * resetNonPersistentDynamicSlices();
 * ```
 */
export function resetNonPersistentDynamicSlices(): void {
  dynamicSlices.forEach((entry) => {
    if (!entry.config.persistOnNavigation) {
      store.dispatch(entry.actions.resetData());
    }
  });
}

// ─── Navigation helper ────────────────────────────────────────────────────────

/**
 * Creates a navigation action that triggers `resetNonPersistentDynamicSlices`
 * via the router reset middleware.
 *
 * Dispatch this action when your app navigates (React Router, Next.js, etc.).
 *
 * @example
 * ```ts
 * store.dispatch(navigateAction('/dashboard'));
 * ```
 */
export const navigateAction = (pathname: string) =>
  ({ type: "router/navigate", payload: pathname }) as const;
