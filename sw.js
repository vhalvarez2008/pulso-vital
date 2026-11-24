'use strict';

const prefix = 'pulso-vital-shell-';
const cacheName = prefix + '30';
const shell = new URL('./index.html', self.location.href);
const assets = [shell, './manifest.webmanifest', './pulso-192.png', './pulso-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== shell.origin) return;
  const root = new URL('./', shell);
  if (request.mode === 'navigate' && (url.pathname === root.pathname || url.pathname === shell.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(request);
        if (response.ok && !url.searchParams.has('demo')) await cache.put(shell,response.clone());
        return response;
      } catch {
        return (await cache.match(shell)) || Response.error();
      }
    })());
  }
});

