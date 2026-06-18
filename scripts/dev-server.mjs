import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const server = await createServer({
  configFile: false,
  plugins: [react()],
  root: '.',
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
});

await server.listen();

server.printUrls();
