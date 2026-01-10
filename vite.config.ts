import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Tự động tạo chứng chỉ SSL giả lập cho Localhost
  ],
  base: './', // QUAN TRỌNG: Giúp app chạy được ngay cả khi không nằm ở thư mục gốc
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    host: true, // Tự động bind ra IP mạng LAN (thay cho --host 0.0.0.0)
  }
})