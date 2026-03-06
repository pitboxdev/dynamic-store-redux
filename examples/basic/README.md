# @pitboxdev/dynamic-store-redux Example

This is a demonstration of the power and simplicity of `@pitboxdev/dynamic-store-redux`.

## Key Features Demonstrated

- **Zero Boilerplate**: No actions, reducers, or constants to define manually.
- **Dynamic Slice Injection**: Slices are created and injected into the Redux store automatically on component mount.
- **Smart Re-renders (Selectors)**: Components subscribe only to the specific parts of the state they need.
- **Cross-branch Updates**: Any component can update any slice, regardless of their position in the React tree.

## How it Works (Optimization)

Check the browser console while interacting with the app:

1. **Sidebar Toggle**: Only the `Sidebar` component re-renders. `Header` and `MainContent` remain static because they use `useDynamicSliceActions` or specific selectors.
2. **Profile Name Edit**: Only `ProfileEditor` and `Header` (which displays the name) re-render. `UserStats` remains static because it's subscribed only to `user.score`.
3. **Adding Points**: `UserStats`, `Header`, and `Sidebar` (which shows points) re-render, but `ProfileEditor` does not.

## Project Structure

- `src/storeConfigs.js`: Central place for initial states (though they can be defined inline too).
- `src/components/`: Modular components using the library hooks.

## Installation

```bash
npm install
npm start
```

## Learn More

Visit the main repository: [dynamic-store-redux](https://www.npmjs.com/package/@pitboxdev/dynamic-store-redux)
