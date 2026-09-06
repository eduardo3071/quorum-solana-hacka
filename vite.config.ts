import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    // `@/` aponta para `src`, como no projeto Next de onde estas telas vieram.
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: { host: true, port: 8080 },
  preview: { host: true, port: 8080 },
});
