import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: true,
    hmr: { overlay: false },
    fs: { strict: false }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連のベンダーライブラリ
          'react-vendor': ['react', 'react-dom'],
          
          // UI関連のライブラリ
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label'
          ],
          
          // アイコンライブラリ
          'icon-vendor': ['lucide-react'],
          
          // チャート関連
          'chart-vendor': ['recharts'],
          
          // フォーム関連
          'form-vendor': ['react-hook-form'],
          
          // ドラッグ&ドロップ
          'dnd-vendor': ['react-dnd', 'react-dnd-html5-backend'],
          
          // 日付関連
          'date-vendor': ['react-day-picker'],
          
          // ユーティリティ
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
    
    // 圧縮設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})