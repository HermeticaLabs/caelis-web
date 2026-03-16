/**
 * sw.js — Caelis Web Service Worker v1.5
 * PWA instalable para iOS, Android y desktop.
 * Motor astronómico funciona offline.
 * Lectura IA requiere conexión (Cloudflare Worker).
 * © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
 */

const CACHE_NAME = 'caelis-web-v1.5.0';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js',
];

// Instalación — cachear activos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Caelis Web SW] Precaching v1.5.0');
      return cache.addAll(LOCAL_ASSETS).then(() =>
        Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)))
      );
    })
  );
  self.skipWaiting();
});

// Activación — limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[Caelis Web SW] Eliminando caché antigua:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch — Cache-First para activos locales, Network-First para API IA
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Llamadas a la API de IA — siempre red, nunca caché
  if (event.request.url.includes('workers.dev') ||
      event.request.url.includes('anthropic.com')) {
    return; // deja pasar sin interceptar
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        console.warn('[Caelis Web SW] Sin red:', event.request.url);
      });
    })
  );
});
