# @pitboxdev/dynamic-store-redux

> Dynamic slice factory built on top of [Redux Toolkit](https://redux-toolkit.js.org/) — `useState`-like ergonomics with the full power of RTK.

[![npm version](https://img.shields.io/npm/v/@pitboxdev/dynamic-store-redux.svg)](https://www.npmjs.com/package/@pitboxdev/dynamic-store-redux)
[![license](https://img.shields.io/npm/l/@pitboxdev/dynamic-store-redux.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Setup](#setup)
- [`useDynamicSlice`](#usedynamicslice)
  - [Quick Start](#quick-start)
  - [Functional updater (`setData`)](#functional-updater-setdata)
  - [Examples](#examples)
- [`useDynamicSliceWithCleanup`](#usedynamicslicewithcleanup)
- [Imperative helpers (outside React)](#imperative-helpers-outside-react)
- [Navigation reset](#navigation-reset)
- [Config options](#config-options)
- [TypeScript](#typescript)
- [Full API Reference](#full-api-reference)
- [License](#license)

---

## Overview

`@pitboxdev/dynamic-store-redux` lets you create and use RTK slices **on demand** — no boilerplate, no manual `createSlice` / `combineReducers`. Each slice is injected into a single shared RTK store at runtime and accessed through a hook whose API mirrors `useState`.

| Feature | Description |
|---|---|
| **Dynamic injection** | Slices are registered lazily when the hook first renders |
| **useState-like API** | `setData(obj)` or `setData((prev) => update)` |
| **Auto-cleanup** | `useDynamicSliceWithCleanup` resets state on unmount |
| **Navigation reset** | Non-persistent slices reset automatically on route changes |
| **Imperative helpers** | Call `updateDynamicSlice` / `resetDynamicSlice` from anywhere |
| **RTK DevTools** | All state is visible in Redux DevTools |

---

## Installation

```bash
npm install @pitboxdev/dynamic-store-redux @reduxjs/toolkit react-redux
# or
yarn add @pitboxdev/dynamic-store-redux @reduxjs/toolkit react-redux
# or
pnpm add @pitboxdev/dynamic-store-redux @reduxjs/toolkit react-redux
```

> **Peer dependencies:** `react >= 18`, `@reduxjs/toolkit >= 2` and `react-redux >= 9` must be installed in your project.

---

## Setup

Wrap your application with `<Provider>` using the exported `store`:

```tsx
import { Provider } from 'react-redux';
import { store } from '@pitboxdev/dynamic-store-redux';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

That's the only setup required. Slices are registered automatically when hooks are first called.

---

## `useDynamicSlice`

The main hook. Registers an RTK slice on first render and returns `{ data, setData, resetData }`.

### Quick Start

```tsx
import { useDynamicSlice } from '@pitboxdev/dynamic-store-redux';

interface CounterState {
  value: number;
  step: number;
}

function Counter() {
  const { data, setData, resetData } = useDynamicSlice<CounterState>('counter', {
    initialState: { value: 0, step: 1 },
  });

  // Object update — simple field override
  const setStep = (step: number) => setData({ step });

  // Functional update — always reads the latest state from the store
  const increment = () => setData((prev) => ({ value: prev.value + prev.step }));

  return (
    <div>
      <p>Count: {data.value}</p>
      <button onClick={increment}>+{data.step}</button>
      <button onClick={() => setStep(5)}>Set step to 5</button>
      <button onClick={resetData}>Reset</button>
    </div>
  );
}
```

### Functional updater (`setData`)

`setData` accepts two forms:

```ts
// 1. Partial object — shallow-merged into current state
setData({ value: 42 });

// 2. Updater function — receives the latest state, returns a partial update
setData((prev) => ({ value: prev.value + 1 }));
```

**Why use the functional form?**

Without it, rapid successive calls all see the same snapshot:

```ts
// ❌ stale closure — both calls read the same data.value
setData({ value: data.value + 1 });
setData({ value: data.value + 1 }); // still reads the old value → result: +1

// ✅ functional — each call receives the result of the previous dispatch
setData((prev) => ({ value: prev.value + 1 }));
setData((prev) => ({ value: prev.value + 1 })); // → result: +2
```

Always prefer the functional form when the new state depends on the old state.

### Examples

#### Todo list

```tsx
interface Todo { id: string; text: string; completed: boolean }
interface TodosState { items: Todo[]; filter: 'all' | 'active' | 'completed' }

function TodoList() {
  const { data, setData, resetData } = useDynamicSlice<TodosState>('todos', {
    initialState: { items: [], filter: 'all' },
  });

  const addTodo = (text: string) =>
    setData((prev) => ({
      items: [...prev.items, { id: Date.now().toString(), text, completed: false }],
    }));

  const toggle = (id: string) =>
    setData((prev) => ({
      items: prev.items.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    }));

  const clearCompleted = () =>
    setData((prev) => ({
      items: prev.items.filter((t) => !t.completed),
      filter: 'all',
    }));

  return (
    <div>
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            addTodo(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
      <ul>
        {data.items
          .filter((t) => {
            if (data.filter === 'active') return !t.completed;
            if (data.filter === 'completed') return t.completed;
            return true;
          })
          .map((t) => (
            <li key={t.id}>
              <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
              {t.text}
            </li>
          ))}
      </ul>
      <button onClick={clearCompleted}>Clear completed</button>
      <button onClick={resetData}>Reset all</button>
    </div>
  );
}
```

#### Shopping cart (persistent across navigation)

```tsx
interface CartItem { id: string; name: string; price: number; quantity: number }
interface CartState { items: CartItem[]; discount: number }

function Cart() {
  const { data, setData } = useDynamicSlice<CartState>('cart', {
    initialState: { items: [], discount: 0 },
    persistOnNavigation: true, // won't reset on route change
  });

  const addItem = (product: Omit<CartItem, 'quantity'>) =>
    setData((prev) => {
      const exists = prev.items.find((i) => i.id === product.id);
      return {
        items: exists
          ? prev.items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev.items, { ...product, quantity: 1 }],
      };
    });

  const total = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    * (1 - data.discount / 100);

  return <div>Total: {total}</div>;
}
```

#### Form with validation

```tsx
interface FormState {
  email: string;
  password: string;
  errors: { email?: string; password?: string };
  isValid: boolean;
}

function LoginForm() {
  const { data, setData, resetData } = useDynamicSlice<FormState>('loginForm', {
    initialState: { email: '', password: '', errors: {}, isValid: false },
  });

  const setEmail = (email: string) =>
    setData((prev) => {
      const errors = { ...prev.errors };
      if (!email.includes('@')) errors.email = 'Invalid email';
      else delete errors.email;
      return { email, errors, isValid: Object.keys(errors).length === 0 };
    });

  const setPassword = (password: string) =>
    setData((prev) => {
      const errors = { ...prev.errors };
      if (password.length < 6) errors.password = 'Min 6 characters';
      else delete errors.password;
      return { password, errors, isValid: Object.keys(errors).length === 0 };
    });

  return (
    <form>
      <input value={data.email} onChange={(e) => setEmail(e.target.value)} />
      {data.errors.email && <span>{data.errors.email}</span>}
      <input
        type="password"
        value={data.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {data.errors.password && <span>{data.errors.password}</span>}
      <button type="submit" disabled={!data.isValid}>Submit</button>
      <button type="button" onClick={resetData}>Reset</button>
    </form>
  );
}
```

---

## `useDynamicSliceWithCleanup`

Same API as `useDynamicSlice` but calls `resetData` automatically when the component unmounts — useful for modal dialogs, wizard steps, or edit forms.

```tsx
import { useDynamicSliceWithCleanup } from '@pitboxdev/dynamic-store-redux';

function EditModal() {
  const { data, setData } = useDynamicSliceWithCleanup<FormState>('editForm', {
    initialState: { name: '', email: '' },
    resetOnUnmount: true,
  });

  // State resets automatically when the modal closes
}
```

---

## Imperative helpers (outside React)

All helpers operate on the shared RTK store directly — no hook or component required.

```ts
import {
  updateDynamicSlice,
  resetDynamicSlice,
  resetAllDynamicSlices,
  resetNonPersistentDynamicSlices,
} from '@pitboxdev/dynamic-store-redux';

// Merge data into a slice
updateDynamicSlice('cart', { discount: 20 });

// Reset one slice to its initial state
resetDynamicSlice('editForm');

// Reset every registered slice
resetAllDynamicSlices();

// Reset only slices without persistOnNavigation: true (call on route change)
resetNonPersistentDynamicSlices();
```

---

## Navigation reset

Non-persistent slices are reset automatically when the router middleware detects a navigation action.
Dispatch `navigateAction` whenever your app navigates:

```ts
import { store, navigateAction } from '@pitboxdev/dynamic-store-redux';

// React Router — in your router listener
store.dispatch(navigateAction('/dashboard'));

// Next.js App Router — in a layout useEffect
useEffect(() => {
  store.dispatch(navigateAction(pathname));
}, [pathname]);
```

The middleware listens for actions whose `type` starts with `router/` or `@@router`, so it is also compatible with `connected-react-router` and similar libraries out of the box.

---

## Config options

| Option | Type | Default | Description |
|---|---|---|---|
| `initialState` | `T` | — | **(required)** Initial values; also used when `resetData()` is called |
| `persistOnNavigation` | `boolean` | `false` | Skip reset when `resetNonPersistentDynamicSlices()` is called |
| `resetOnUnmount` | `boolean` | `false` | Auto-reset on unmount (`useDynamicSliceWithCleanup` only) |

---

## TypeScript

All types are inferred automatically. You can also import them explicitly:

```ts
import {
  useDynamicSlice,
  type SliceConfig,
  type SetStateAction,
  type UseDynamicSliceReturn,
} from '@pitboxdev/dynamic-store-redux';

interface FormState {
  firstName: string;
  lastName: string;
  age: number;
  agreed: boolean;
}

const config: SliceConfig<FormState> = {
  initialState: { firstName: '', lastName: '', age: 0, agreed: false },
  resetOnUnmount: true,
};

function RegistrationForm() {
  const { data, setData, resetData }: UseDynamicSliceReturn<FormState> =
    useDynamicSlice<FormState>('regForm', config);

  // TypeScript errors on unknown keys:
  // setData({ unknown: true }); ❌

  const setAge = (age: number) =>
    setData((prev) => ({
      age,
      agreed: age < 18 ? false : prev.agreed,
    }));
}
```

---

## Full API Reference

### `useDynamicSlice<T>(sliceId, config)`

| Parameter | Type | Description |
|---|---|---|
| `sliceId` | `string` | Unique key for this slice in the shared RTK store |
| `config` | `SliceConfig<T>` | See [Config options](#config-options) |

Returns `{ data: T, setData, resetData }`.

---

### `useDynamicSliceWithCleanup<T>(sliceId, config)`

Same signature as `useDynamicSlice`. Calls `resetData()` on unmount when `config.resetOnUnmount` is `true`.

---

### `store`

The underlying RTK store. Pass it to `<Provider store={store}>`.

```ts
import { store } from '@pitboxdev/dynamic-store-redux';
store.getState(); // read full state
store.dispatch(navigateAction('/home')); // dispatch any action
```

---

### `injectReducer<T>(sliceId, config)`

Manually inject a slice without rendering a hook. Useful for pre-loading slices at app startup.

```ts
import { injectReducer } from '@pitboxdev/dynamic-store-redux';
injectReducer('cart', { initialState: { items: [], discount: 0 } });
```

---

### `navigateAction(pathname)`

Creates a `router/navigate` action. Dispatch it to trigger `resetNonPersistentDynamicSlices` via the router middleware.

---

### Imperative helpers

| Function | Signature | Description |
|---|---|---|
| `updateDynamicSlice` | `(sliceId, data) => void` | Merge data into a slice from outside React |
| `resetDynamicSlice` | `(sliceId) => void` | Reset one slice to its `initialState` |
| `resetAllDynamicSlices` | `() => void` | Reset every registered slice |
| `resetNonPersistentDynamicSlices` | `() => void` | Reset slices where `persistOnNavigation` is not `true` |

---

### Exported types

| Type | Description |
|---|---|
| `SliceState` | `Record<string, unknown>` — base constraint for state objects |
| `SliceConfig<T>` | Config type for `useDynamicSlice` |
| `SetStateAction<T>` | `Partial<T> \| ((prev: T) => Partial<T>)` — setter argument |
| `UseDynamicSliceReturn<T>` | Return type of `useDynamicSlice` |
| `DynamicSliceRegistryEntry` | Internal registry entry (advanced use) |
| `RootState` | RTK store root state type |
| `AppDispatch` | RTK store dispatch type |

---

## License

[MIT](./LICENSE) © Pitboxdev
