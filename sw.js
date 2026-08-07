const CACHE_NAME = "ask-brice-v2";

const ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/manifest.json",

    "/js/app.js",
    "/js/api.js",
    "/js/chat.js",
    "/js/ui.js",
    "/js/media.js",
    "/js/storage.js",
    "/js/voice.js",
    "/js/settings.js",
    "/js/animations.js"
];

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))

    );

    self.skipWaiting();

});

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys =>

            Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            )

        )

    );

    self.clients.claim();

});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request).then(response => {

            return response || fetch(event.request);

        })

    );

});