import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
// The only setup required is importing the store and wrapping the App
import { store } from '@pitboxdev/dynamic-store-redux';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <App />
    </Provider>
);
