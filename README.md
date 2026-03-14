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

- **[CodeSandbox Example](https://codesandbox.io/s/github/pitboxdev/dynamic-store-redux/tree/main/examples/basic)** – See it in action: Theme toggling, cross-branch state updates, and complex reset scenarios.

---

## ⚡ Features

- 🛠️ **DX First:** Zero boilerplate. API mirrors `useState` ergonomics.
- 🧹 **Auto-Cleanup:** Optional store resets on navigation (with exclusions) or unmount.
- 🔄 **Code-Splitting Ready:** Inject reducers lazily exactly when they are needed.
- 🛡️ **100% Type-safe:** Written in TypeScript with pristine inference.
- 🪶 **Tiny:** Zero impact on performance, leverages your existing RTK setup.

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
const store = createDynamicStore({ autoResetOnNavigation: true });

// OR: Advanced initialization with all features
const advancedStore = createDynamicStore({
  autoResetOnNavigation: true,
  staticReducers: { 
    auth: authReducer, 
    settings: settingsReducer 
  },
  extraMiddlewares: [loggerMiddleware],
  routerActionPrefixes: ['@@router/', 'NAVIGATE/'],
  preloadedState: { settings: { theme: 'dark' } },
  devTools: true
});
```

### 2. Basic Usage

```tsx
import { useDynamicSlice } from "@pitboxdev/dynamic-store-redux";

interface UserState { name: string; score: number }

function Profile() {
  const { data, setData, resetData } = useDynamicSlice<UserState>("user", {
    initialState: { name: "Guest", score: 0 },
    persistOnNavigation: true, // Keep state when changing routes
  });

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

By default, all dynamic slices are **reset automatically** when the route changes. You can control this behavior per-slice.

### Config Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `persistOnNavigation` | `boolean` | `false` | If true, state is NOT reset on route change. |
| `navigationGroups` | `string[]` | — | Tag slices for selective reset. |
| `resetOnUnmount` | `boolean` | `false` | Reset state when component unmounts. |

### Manual & Selective Reset

Trigger the cleanup in your root layout or navigation logic:

```ts
import { resetDynamicSlices } from "@pitboxdev/dynamic-store-redux";

// 1. In your router useEffect (scope is now mandatory):
resetDynamicSlices("non-persistent"); 

// 2. Skip specific groups during navigation:
resetDynamicSlices("non-persistent", { excludeGroups: ["multi-step-form"] });

// 3. Deep cleanup (e.g., Logout):
resetDynamicSlices("all"); 

// 4. Selective reset:
resetDynamicSlices(["cart", "checkout"]); 
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

### Outside React (Imperative)
```ts
import { 
  updateDynamicSlice, 
  resetDynamicSlice, 
  resetDynamicSlices 
} from "@pitboxdev/dynamic-store-redux";

updateDynamicSlice("user", { name: "New Name" });
resetDynamicSlize("user");
resetDynamicSlices("all", { excludeGroups: ["auth"] });
```

---

## 🤝 Need Professional Help?
Available for technical collaboration on React/Redux architecture and custom project development.
Contact: [kiselevm2015@gmail.com](mailto:kiselevm2015@gmail.com)

---

## License
[MIT](./LICENSE) © Pitboxdev
