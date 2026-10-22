/* =====================================================================
   SERVICE WORKER — un petit script qui tourne en arrière-plan,
   entre l'appli et le réseau. Il garde une copie des fichiers en cache :
   l'appli devient installable ET s'ouvre même sans connexion.

   Stratégie « réseau d'abord » : on essaie de télécharger la dernière
   version (pour que tes mises à jour arrivent), et si le réseau ne
   répond pas, on sert la copie en cache.
   ===================================================================== */

// Change ce numéro à chaque grosse mise à jour pour repartir d'un cache propre
const CACHE = "lecteur-qr-v3";

// Fichiers mis en cache dès l'installation
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
];

// 1) Installation : on remplit le cache
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting(); // la nouvelle version prend la main tout de suite
});

// 2) Activation : on supprime les vieux caches (anciens numéros de version)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3) Chaque requête de l'appli passe ici
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // On met à jour la copie en cache avec la version fraîche
        const copy = response.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)) // hors ligne : on sert le cache
  );
});
