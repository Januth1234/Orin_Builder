import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      target: 'es2020',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@google/genai'))          return 'vendor-ai';
            if (id.includes('firebase/firestore'))     return 'vendor-firebase-firestore';
            if (id.includes('firebase/auth'))          return 'vendor-firebase-auth';
            if (id.includes('firebase'))               return 'vendor-firebase-core';
            if (id.includes('lucide-react'))           return 'vendor-icons';
            if (id.includes('zustand'))                return 'vendor-state';
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
          },
        },
      },
    },
    define: {
      'process.env.API_KEY':          JSON.stringify(env.API_KEY          ?? env.VITE_API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY ?? env.VITE_FIREBASE_API_KEY),
      'process.env.FIREBASE_APP_ID':  JSON.stringify(env.FIREBASE_APP_ID  ?? env.VITE_FIREBASE_APP_ID),
      global: 'window',
    },
    server: { port: 5174 },
  };
});
