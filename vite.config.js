import { defineConfig } from 'vite';

// Derive the base path dynamically so CI and forks work without edits.
// Priority: explicit VITE_BASE env var -> GitHub Actions repo name -> '/'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const baseFromEnv = process.env.VITE_BASE;
const base = baseFromEnv || (process.env.GITHUB_ACTIONS ? `/${repoName || 'WPM-ATLAS'}/` : '/');

export default defineConfig({
  base,
  server: {
    port: 8000,
  },
  preview: {
    port: 8000,
  },
});
