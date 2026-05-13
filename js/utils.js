export function safeParse(raw, fallback) {
    if (!raw) return fallback;

    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/**
 * Phase 3: API Resilience - Timeout wrapper
 * Rejects promise if it takes longer than specified milliseconds
 */
export function withTimeout(promise, timeoutMs = 10000, label = 'Operation') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
    ]);
}

/**
 * Phase 3: API Resilience - Retry wrapper
 * Retries async function up to maxRetries times with exponential backoff
 */
export async function withRetry(fn, maxRetries = 2, label = 'Operation') {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt <= maxRetries) {
                const delayMs = Math.pow(2, attempt - 1) * 500; // 500ms, 1s, 2s, etc.
                console.warn(`[API] ${label} attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}