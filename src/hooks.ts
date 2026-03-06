import { useRef, useEffect, useMemo, useCallback } from "react";
import type {
    SliceState,
    SliceConfig,
    SetStateAction,
    UseDynamicSliceReturn,
    UseDynamicSliceActionsReturn,
} from "./types";
import {
    store,
    injectReducer,
    getDynamicSliceActions,
    getDynamicSliceConfig,
    useAppDispatch,
    useAppSelector,
} from "./store";

// ─── useDynamicSlice ──────────────────────────────────────────────────────────

/**
 * Hook that returns `setData`, `resetData`, and `getData` for a dynamically
 * registered RTK slice without subscribing to its state changes.
 *
 * Useful for child components that only need to dispatch actions or get current state
 * without triggering re-renders when the state changes.
 *
 * @example
 * ```tsx
 * function ResetButton() {
 *   const { resetData } = useDynamicSliceActions('counter');
 *   return <button onClick={resetData}>Reset</button>;
 * }
 * ```
 */
export function useDynamicSliceActions<T extends SliceState>(
    sliceId: string,
): UseDynamicSliceActionsReturn<T> {
    const dispatch = useAppDispatch();

    const getData = useCallback((): T => {
        const currentState = (store.getState() as Record<string, unknown>)[sliceId];
        if (currentState !== undefined) {
            return currentState as T;
        }
        const config = getDynamicSliceConfig(sliceId);
        if (!config) {
            throw new Error(
                `Dynamic slice "${sliceId}" is not registered. Make sure useDynamicSlice has been called before using useDynamicSliceActions.`,
            );
        }
        return config.initialState as T;
    }, [sliceId]);

    const setData = useCallback((updater: SetStateAction<T>): void => {
        const actions = getDynamicSliceActions(sliceId);

        if (typeof updater === "function") {
            const currentState = getData();
            const updates = (updater as (prevState: T) => Partial<T>)(currentState);
            dispatch(actions.setData(updates as Partial<SliceState>));
        } else {
            dispatch(actions.setData(updater as Partial<SliceState>));
        }
    }, [sliceId, dispatch, getData]);

    const resetData = useCallback((): void => {
        const actions = getDynamicSliceActions(sliceId);
        dispatch(actions.resetData());
    }, [sliceId, dispatch]);

    return useMemo(
        () => ({ setData, resetData, getData }),
        [setData, resetData, getData],
    );
}

/**
 * Hook that dynamically registers an RTK slice and provides a `useState`-like
 * `setData` setter backed by Redux Toolkit.
 *
 * The slice is injected once on first render and lives in the global RTK store.
 * Use `<Provider store={store}>` from `react-redux` to make it available to
 * your component tree.
 *
 * `setData` accepts two forms:
 * - **Object** — merged into the current state (shallow merge)
 * - **Updater function** — receives the latest state and returns a partial
 *   update. Always prefer this form when new state depends on old state.
 *
 * @example
 * ```tsx
 * interface CounterState { value: number; step: number }
 *
 * function Counter() {
 *   const { data, setData, resetData } = useDynamicSlice<CounterState>(
 *     'counter',
 *     { initialState: { value: 0, step: 1 } },
 *   );
 *
 *   // object update
 *   const setStep = (step: number) => setData({ step });
 *
 *   // functional update — always reads the latest state
 *   const increment = () => setData((prev) => ({ value: prev.value + prev.step }));
 *
 *   return <button onClick={increment}>{data.value}</button>;
 * }
 * ```
 */
export function useDynamicSlice<T extends SliceState, S = T>(
    sliceId: string,
    config: SliceConfig<T>,
    selector?: (data: T) => S,
): UseDynamicSliceReturn<T, S> {
    const initialized = useRef(false);
    // Capture the initial initialState to keep selector fallback stable
    // even if the user passes a new object literal on every render.
    const initialRef = useRef(config.initialState);

    if (!initialized.current) {
        injectReducer(sliceId, config);
        initialized.current = true;
    }

    const data = useAppSelector((state) => {
        const sliceData = ((state as Record<string, unknown>)[sliceId] ??
            initialRef.current) as T;
        return selector ? selector(sliceData) : (sliceData as unknown as S);
    });

    const { setData, resetData, getData } = useDynamicSliceActions<T>(sliceId);

    useEffect(() => {
        return () => {
            if (config.resetOnUnmount) {
                resetData();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sliceId, config.resetOnUnmount, resetData]);

    return useMemo(
        () => ({ data, setData, resetData, getData }),
        [data, setData, resetData, getData],
    );
}
