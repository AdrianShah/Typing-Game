import { ConvexHttpClient, ConvexClient } from 'convex/browser';

let convexHttpClient;
let convexWsClient;

// Validate Convex URL on module load
function validateConvexUrl() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    const msg = '[Convex] Missing VITE_CONVEX_URL in .env.local. Backend API calls will fail.';
    console.error(msg);
    return null;
  }
  console.log('[Convex] Using deployment:', convexUrl);
  return convexUrl;
}

validateConvexUrl();

export function getConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    const msg = 'Missing VITE_CONVEX_URL in the environment.';
    console.error('[Convex]', msg);
    throw new Error(msg);
  }

  if (!convexHttpClient) {
    try {
      console.log('[Convex] Initializing HTTP client...');
      convexHttpClient = new ConvexHttpClient(convexUrl);
    } catch (err) {
      console.error('[Convex] Failed to initialize HTTP client:', err);
      throw err;
    }
  }

  return convexHttpClient;
}

export function getConvexWsClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    const msg = 'Missing VITE_CONVEX_URL in the environment.';
    console.error('[Convex]', msg);
    throw new Error(msg);
  }

  if (!convexWsClient) {
    try {
      console.log('[Convex] Initializing WebSocket client...');
      convexWsClient = new ConvexClient(convexUrl);
    } catch (err) {
      console.error('[Convex] Failed to initialize WebSocket client:', err);
      throw err;
    }
  }

  return convexWsClient;
}
