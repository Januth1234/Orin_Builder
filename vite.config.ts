import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1200,
      minify: 'esbuild',
      target: 'es2020',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@google/genai'))    return 'vendor-ai';

            // ALL Firebase packages in ONE chunk.
            // Splitting firebase/auth, firebase/firestore into separate chunks
            // creates circular Rollup chunk dependencies → TDZ error at runtime:
            // "Cannot access 'X' before initialization"
            if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';

            if (id.includes('react-router'))     return 'vendor-router';
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) return 'vendor-react';
            if (id.includes('lucide-react'))     return 'vendor-icons';
            if (id.includes('zustand'))          return 'vendor-state';
          },
        },
      },
    },
    define: {
      'process.env.API_KEY':               JSON.stringify(env.API_KEY               ?? env.VITE_API_KEY),
      'process.env.FIREBASE_API_KEY':      JSON.stringify(env.FIREBASE_API_KEY      ?? env.VITE_FIREBASE_API_KEY),
      'process.env.FIREBASE_APP_ID':       JSON.stringify(env.FIREBASE_APP_ID       ?? env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID ?? ''),
      global: 'window',
    },
    server: { port: 5174 },
  };
});
