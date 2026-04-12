import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Typing-Game/' : '/',
  server: {
    port: 8000,
  },
  preview: {
    port: 8000,
  },
});
