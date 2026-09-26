import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-clerk': ['@clerk/clerk-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
});
