import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Định nghĩa đối tượng process để tránh lỗi 'process is not defined' trên trình duyệt
// Đồng thời gán API Key mà người dùng cung cấp vào môi trường hệ thống
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: 'AIzaSyA73hilYx3rRGgdAOTjdKgWouJNIJoPetU'
    }
  };
}

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