import { useRef, useEffect } from "react";
import type {
  SliceState,
  SliceConfig,
  SetStateAction,
  UseDynamicSliceReturn,
} from "./types";
import {
  store,
  injectReducer,
  getDynamicSliceActions,
  useAppDispatch,
  useAppSelector,
} from "./store";

// ─── useDynamicSlice ──────────────────────────────────────────────────────────

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
export function useDynamicSlice<T extends SliceState>(
  sliceId: string,
  config: SliceConfig<T>,
): UseDynamicSliceReturn<T> {
  const initialized = useRef(false);

  if (!initialized.current) {
    injectReducer(sliceId, config);
    initialized.current = true;
  }

  const data = useAppSelector(
    (state) =>
      ((state as Record<string, unknown>)[sliceId] ??
        config.initialState) as T,
  );

  const dispatch = useAppDispatch();

  const setData = (updater: SetStateAction<T>): void => {
    const actions = getDynamicSliceActions(sliceId);

    if (typeof updater === "function") {
      const currentState = (
        (store.getState() as Record<string, unknown>)[sliceId] ??
        config.initialState
      ) as T;
      const updates = (updater as (prevState: T) => Partial<T>)(currentState);
      dispatch(actions.setData(updates as Partial<SliceState>));
    } else {
      dispatch(actions.setData(updater as Partial<SliceState>));
    }
  };

  const resetData = (): void => {
    const actions = getDynamicSliceActions(sliceId);
    dispatch(actions.resetData());
  };

  return { data, setData, resetData };
}

// ─── useDynamicSliceWithCleanup ───────────────────────────────────────────────

/**
 * Same as `useDynamicSlice` but automatically calls `resetData` when the
 * component unmounts — useful when `config.resetOnUnmount` is `true`.
 *
 * Ideal for modal dialogs, wizard steps, or scoped edit forms.
 *
 * @example
 * ```tsx
 * function EditModal() {
 *   const { data, setData, resetData } = useDynamicSliceWithCleanup<FormState>(
 *     'editForm',
 *     { initialState: { name: '', email: '' }, resetOnUnmount: true },
 *   );
 *   // State resets automatically when the modal unmounts
 * }
 * ```
 */
export function useDynamicSliceWithCleanup<T extends SliceState>(
  sliceId: string,
  config: SliceConfig<T>,
): UseDynamicSliceReturn<T> {
  const result = useDynamicSlice<T>(sliceId, config);

  useEffect(() => {
    return () => {
      if (config.resetOnUnmount === true) {
        result.resetData();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceId, config.resetOnUnmount]);

  return result;
}
