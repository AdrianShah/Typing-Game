import { ConvexHttpClient } from 'convex/browser';

let convexClient;

export function getConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('Missing VITE_CONVEX_URL in the environment.');
  }

  if (!convexClient) {
    convexClient = new ConvexHttpClient(convexUrl);
  }

  return convexClient;
}
