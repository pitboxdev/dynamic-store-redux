import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createDynamicStore } from '@pitboxdev/dynamic-store-redux';
import App from './App';

// Initialize the store and enable auto-reset for navigation actions
const store = createDynamicStore({ autoResetOnNavigation: true });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <App />
    </Provider>
);
