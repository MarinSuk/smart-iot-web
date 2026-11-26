import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Vite config: dev proxy forwards /api to the backend gateway.
 * Vite 配置：开发环境将 /api 代理转发至后端服务。
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
