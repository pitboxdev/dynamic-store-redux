<div align="center">

# @pitboxdev/dynamic-store-redux

> Dynamic slice factory for [Redux Toolkit](https://redux-toolkit.js.org/) — `useState`-like ergonomics with the full power of RTK.

<p align="center">
  <a href="https://www.npmjs.com/package/@pitboxdev/dynamic-store-redux">
    <img src="https://img.shields.io/npm/v/@pitboxdev/dynamic-store-redux?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://bundlephobia.com/package/@pitboxdev/dynamic-store-redux">
    <img src="https://img.shields.io/bundlephobia/minzip/@pitboxdev/dynamic-store-redux?style=flat-square&label=minzipped" alt="Bundle Size" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict" />
  </a>
</p>

</div>

---

## 🚀 Live Demo

- **[Basic Demo](https://codesandbox.io/s/github/pitboxdev/dynamic-store-redux/tree/main/examples/basic)** – Theme toggling, cross-branch state updates, and complex reset scenarios.

---

## ⚡ Simplicity First

```tsx
const { data, setData } = useDynamicSlice('user', { initialState });
```
**That's it.** No actions, no reducers, no boilerplate. Just `useState` ergonomics with the full power of Redux.

---

## 🚀 Quick Start

### 1. Installation & Setup

```bash
npm install @pitboxdev/dynamic-store-redux @reduxjs/toolkit react-redux
```

Initialize the store in your entry point:

```tsx
import { Provider } from "react-redux";
import { createDynamicStore } from "@pitboxdev/dynamic-store-redux";

// Basic initialization
const store = createDynamicStore();

// OR: Advanced initialization
const advancedStore = createDynamicStore({
  staticReducers: { 
    auth: authReducer, 
    settings: settingsReducer 
  },
  extraMiddlewares: [loggerMiddleware],
  preloadedState: { settings: { theme: 'dark' } },
  devTools: true
});
```

### 2. Basic Usage

```tsx
import { useDynamicSlice } from "@pitboxdev/dynamic-store-redux";

interface UserState { name: string; score: number }

function Profile() {
  const { 
    data,       // Current state (or selected part)
    setData,    // Update state (shallow merge)
    resetData,  // Reset to initial state
    getData,    // Sync getter (avoids re-renders in callbacks)
  } = useDynamicSlice<UserState>(
    "profile",                     // 1. Slice ID (must be unique)
    {                              // 2. Configuration Object
      initialState: { name: "Guest", score: 0 },
      persistOnNavigation: true,   // Keep state when changing routes
      resetOnUnmount: true,        // Reset state when component unmounts
      navigationGroups: ["auth"],  // Tag for selective bulk reset
    },
    (state) => state               // 3. Optional Selector (for performance)
  );

  return (
    <div>
      <p>{data.name}: {data.score}</p>
      <button onClick={() => setData((prev) => ({ score: prev.score + 1 }))}>
        +1 Score
      </button>
      <button onClick={resetData}>Reset</button>
    </div>
  );
}
```

---

## 🧹 Cleanup & Navigation

By default, dynamic slices are persistent. You can trigger cleanup manually when the route changes or when a component unmounts.

### Config Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `persistOnNavigation` | `boolean` | `false` | If true, state is NOT reset when `resetDynamicSlices("non-persistent")` is called. |
| `navigationGroups` | `string[]` | — | Tags for grouping slices. Allows for selective bulk resets (e.g., reset all "UI" slices but keep "User" slices). |
| `resetOnUnmount` | `boolean` | `false` | Automatically reset state when the component calling `useDynamicSlice` is unmounted. |

### Why use `navigationGroups`?

Grouping slices is powerful for managing complex state lifetimes. Instead of resetting slices one by one, you can categorize them:

- **Example 1: The Multi-Step Form**
  Tag all slices in a checkout flow with `navigationGroups: ["checkout"]`. When the user finishes or cancels, call `resetDynamicSlices(["checkout"])` to clean up everything at once.
- **Example 2: Global UI State**
  Tag modals, sidebars, and filters with `navigationGroups: ["ui"]`. You can then reset all UI elements during navigation while keeping data slices alive.

### Manual & Selective Reset

```ts
import { resetDynamicSlices } from "@pitboxdev/dynamic-store-redux";

// 1. Basic navigation cleanup:
// Resets everything EXCEPT slices with { persistOnNavigation: true }
resetDynamicSlices("non-persistent"); 

// 2. The "Logout" pattern:
// Resets absolutely every dynamic slice to its initial state.
resetDynamicSlices("all"); 

// 3. Selective reset by Tag:
// Resets only slices that have "checkout" in their navigationGroups.
resetDynamicSlices(["checkout"]); 

// 4. Reset with Exclusions:
// Resets everything but skip slices tagged with "user-settings" or "theme".
resetDynamicSlices("all", { excludeGroups: ["user-settings", "theme"] });
```

#### ⚓ Router Integration

To trigger cleanup **only on transitions** (skipping the first render), use a ref guard:

```tsx
const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  resetDynamicSlices("non-persistent");
}, [location.pathname]);
```



---

## 🛠️ Advanced Features

### Optimizing Re-renders
Pass a selector as the third argument to subscribe only to specific state changes:

```tsx
const { data: score } = useDynamicSlice("user", config, (s) => s.score);
```

### Subscriptions-free access
Use `useDynamicSliceActions` to get setters and getters without subscribing to state changes (prevents re-renders).

```tsx
const { setData, getData } = useDynamicSliceActions<UserState>("user");
```

---

## 🤝 Need Professional Help?
Available for technical collaboration on React/Redux architecture and custom project development.
Contact: [kiselevm2015@gmail.com](mailto:kiselevm2015@gmail.com)

---

## License
[MIT](./LICENSE) © Pitboxdev
