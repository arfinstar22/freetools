import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { handleAIIntentRequest } from './api/ai-intent.ts';

function aiGatewayDevPlugin(): Plugin {
  return {
    name: 'ai-gateway-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai-intent') {
          await handleAIIntentRequest(req, res);
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiGatewayDevPlugin()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
