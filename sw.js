const CACHE_NAME = "ai-teacher-v1";
const urlsToCache = [
  "./home.html",
  "./speakup-ai.html",
  "./about.html",
  "./style.css",
  "./script.js",
  "./conversation.json",
  "./vocab.json",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
