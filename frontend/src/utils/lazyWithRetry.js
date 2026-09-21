import { lazy } from 'react';

/**
 * Enhanced lazy loader that gracefully handles dynamic import failures across all tabs.
 * When a new production build generates new chunk hashes and the client holds stale references,
 * this automatically detects the chunk load error and performs a fresh reload to fetch the latest bundle.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const msg = error?.message || (typeof error === 'string' ? error : '');
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError) {
        const lastReload = sessionStorage.getItem('nexus_last_chunk_reload');
        const now = Date.now();
        // Allow automatic reload once every 8 seconds to prevent reload loops
        if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
          sessionStorage.setItem('nexus_last_chunk_reload', now.toString());
          console.warn('[NEXUS-LAND] Dynamic import chunk mismatch detected. Auto-reloading to fetch updated assets...', msg);
          window.location.reload();
          // Return an unresolved promise to keep the loading screen mounted during the reload
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

export default lazyWithRetry;
