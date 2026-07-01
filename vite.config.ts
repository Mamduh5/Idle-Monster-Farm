import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'game-polish-lab-live-style',
    configureServer(server) {
      server.middlewares.use('/.game-polish-lab/live-style/farm-slot.json', (_request, response) => {
        const liveStylePath = path.join(server.config.root, '.game-polish-lab', 'live-style', 'farm-slot.json');

        fs.readFile(liveStylePath, 'utf8', (error, text) => {
          if (error) {
            response.statusCode = 404;
            response.end();
            return;
          }

          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.setHeader('Cache-Control', 'no-store');
          response.end(text);
        });
      });
    },
  }],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
