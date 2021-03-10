//Installeren van service worker & toevoegen assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("static").then((cache) => {
      return cache.addAll([
         //de service worker kan alleen geinstalleerd worden, als alle resources in cache.all zijn gecached
        "./",
        "./styles.css",
        "images/icon-192x192.png",
        "./app.js",
      ]);
    })
  );
});

self.addEventListener("fetch", function (event) {
  let request = event.request;
  let url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  let cachedResponse = a;
  await caches.match(request);
  return cachedResponse || fetch(request);
}

//als een request niet matched met wat er in de cache zit, haal je het van het netwerk. Die laad de pagina en voegt het toe in de cache
async function networkFirst(request) {
  let cache = caches.open("api-data");
  try {
    let response = fetch(request);
    (await cache).put(request, (await response).clone());
    return response;
  } catch (e) {
    return (await cache).match(request);
  }
}
