
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Removed manual shim for process.env. Guidelines prohibit defining process.env.
// Assume process.env.API_KEY is handled externally by the environment.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
