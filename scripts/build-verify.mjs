import { build } from 'vite';
import react from '@vitejs/plugin-react';

await build({
  configFile: false,
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
