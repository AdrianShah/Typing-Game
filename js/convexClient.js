import { ConvexHttpClient, ConvexClient } from 'convex/browser';

let convexHttpClient;
let convexWsClient;

export function getConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('Missing VITE_CONVEX_URL in the environment.');
  }

  if (!convexHttpClient) {
    convexHttpClient = new ConvexHttpClient(convexUrl);
  }

  return convexHttpClient;
}

export function getConvexWsClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('Missing VITE_CONVEX_URL in the environment.');
  }

  if (!convexWsClient) {
    convexWsClient = new ConvexClient(convexUrl);
  }

  return convexWsClient;
}
