const CACHE_NAME = "rescueaid-v13";
const urlsToCache = [
  "/",
  "/static/css/style.css",
  "/static/js/app.js",
  "/static/data/tree.json",
  "/static/data/languages.json",
  "/static/data/node-translations.json"
];

self.addEventListener("install", event => {
  console.log("[SW INSTALL] Starting install event with multilingual and voice support...");
  console.log("[SW INSTALL] Caching: HTML, CSS, JavaScript, language data, and emergency decision tree");
  console.log("[SW INSTALL] NEW: 4 Emergency Conditions + Severity Prediction System now offline enabled");
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log("[SW INSTALL] ✓ Cache object created: " + CACHE_NAME);
        
        // Try to cache all URLs at once first
        try {
          await cache.addAll(urlsToCache);
          console.log("[SW INSTALL] ✓ All URLs cached successfully with addAll()");
        } catch (addAllError) {
          console.warn("[SW INSTALL] ⚠ addAll() failed, trying individual caching...", addAllError);
          
          // Fallback: cache each URL individually
          for (const url of urlsToCache) {
            try {
              const response = await fetch(url);
              console.log(`[SW INSTALL] Fetched ${url}: ${response.status}`);
              
              if (response.ok) {
                await cache.put(url, response);
                console.log(`[SW INSTALL] ✓ Cached: ${url}`);
              } else {
                console.warn(`[SW INSTALL] ⚠ Skipped ${url}: ${response.status}`);
              }
            } catch (fetchError) {
              console.error(`[SW INSTALL] ✗ Failed to fetch/cache ${url}:`, fetchError.message);
            }
          }
        }
      } catch (error) {
        console.error("[SW INSTALL] ✗ Fatal error during install:", error);
      }
    })()
  );
  
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("[SW ACTIVATE] Activating Service Worker v13...");
  console.log("[SW ACTIVATE] Updated: New Emergency Conditions + Severity Prediction System");
  console.log("[SW ACTIVATE] Languages and voice data ready for offline use!");
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        console.log("[SW ACTIVATE] Found caches:", cacheNames);
        
        const deletePromises = cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW ACTIVATE] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletePromises);
        console.log("[SW ACTIVATE] ✓ Old caches deleted");
        console.log("[SW ACTIVATE] ✓ Multi-language and voice data ready for complete OFFLINE use!");
        console.log("[SW ACTIVATE] ✓ NEW OFFLINE FEATURES:");
        console.log("[SW ACTIVATE]   • Allergic Reaction (Anaphylaxis detection)");
        console.log("[SW ACTIVATE]   • Severe Breathing Difficulty");
        console.log("[SW ACTIVATE]   • Seizure Management");
        console.log("[SW ACTIVATE]   • Stroke (F.A.S.T. Check)");
        console.log("[SW ACTIVATE]   • Real-time Severity Prediction");
        console.log("[SW ACTIVATE]   • Emergency Alert System");
        console.log("[SW ACTIVATE] ✓ Supported: EN, ES, FR, DE, PT, HI, TA, TE, BN + Voice Commands");
      } catch (error) {
        console.error("[SW ACTIVATE] ✗ Error during activation:", error);
      }
    })()
  );
  
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try to find in cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log(`[SW FETCH] ✓ Serving from cache: ${event.request.url}`);
          return cachedResponse;
        }
        
        console.log(`[SW FETCH] Fetching from network: ${event.request.url}`);
        
        // Fetch from network
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          const responseToCache = networkResponse.clone();
          
          // Cache all static assets, JSON data, HTML, and CSS for offline support
          if (event.request.url.includes('/static/') || 
              event.request.url.endsWith('/') ||
              event.request.url.endsWith('.json') ||
              event.request.url.endsWith('.html')) {
            cache.put(event.request, responseToCache);
            console.log(`[SW FETCH] ✓ Cached for OFFLINE: ${event.request.url}`);
          }
        }
        
        return networkResponse;
      } catch (error) {
        console.warn(`[SW FETCH] ⚠ Network request failed - OFFLINE MODE ACTIVE`);
        console.log(`[SW FETCH] Trying to serve cached version of: ${event.request.url}`);
        
        // Try to return cached version
        try {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log(`[SW FETCH] ✓ Using cached fallback: ${event.request.url}`);
            return cachedResponse;
          }
        } catch (cacheError) {
          console.error(`[SW FETCH] ✗ Cache lookup error:`, cacheError);
        }
        
        // Return offline response
        return new Response("Offline - This page is not in cache. App should work but check your main page.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" })
        });
      }
    })()
  );
});