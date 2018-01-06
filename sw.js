// Version
const version = '1.0';

// App shell assets
const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/icon.png',
  'images/launch.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js'
];

// Install Service Worker
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(`static-${version}`)
      .then(cache => cache.addAll(appAssets))
  );
});

// Activate Service Worker
self.addEventListener('activate', e => {
  // Clean old version of static cache
  let cleaned = caches.keys().then(keys => {
    // iterate cache names(keys)
    keys.forEach(key => {
      // if cache does not equal current cache
      // but matches previous/outdated cache then delete
      if (key !== `static-${version}` && key.match('static-')) {
        return caches.delete(key);
      }
    });
  });

  e.waitUntil(cleaned);
});

// Static cache strategy - cache with network fallback
const staticCache = (req, cacheName = `static-${version}`) => {
  return caches.match(req).then(cachedRes => {
    // Return cached response if found
    if (cachedRes) return cachedRes;

    // Otherwise get asset from network
    return fetch(req).then(networkRes => {
      // Update cache with network reponse
      caches.open(cacheName)
        .then(cache => cache.put(req, networkRes));

      // Return a clone of network response up the promise chain
      return networkRes.clone();
    })
  });
};

// Network with cache fallback
const fallbackCache = req => {
  // Try network
  return fetch(req).then(networkRes => {
    // Check if networkRes is ok, otherwise fallback to cache
    // 404 will resolve but failed response due to not network will not
    // throw exception to jump right into .catch()
    if (! networkRes.ok) throw 'Fetch Error';

    // Update cache with network reponse
    caches.open(`static-${version}`)
      .then(cache => cache.put(req, networkRes));

    // Return a clone of network response up the promise chain
    return networkRes.clone();
  })

  // Try cache
  .catch(err => caches.match(req));
};

// Clean Giphy cache
const cleanGiphyCache = giphysArray => {
  // Open giphy cache
  caches.open('giphy').then(cache => {
    // Get all the entries in cache
    cache.keys().then(keys => {
      // Iterate through
      keys.forEach(key => {
        // If entry is NOT part of current Giphy's, Delete
        if (! giphysArray.includes(key)) cache.delete(key);
      });
    });
  });
};

// Fetch Asset
self.addEventListener('fetch', e => {
  // Working with more resources then just local assets
  // need identify the 'fetch' as a localstatic (App Shell)
  if (e.request.url.match(location.origin)) {
    // Seperate caching strategy from fetch
    e.respondWith(staticCache(e.request));
  }

  // Giphy Api
  else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) {
    e.respondWith(fallbackCache(e.request));
  }

  // Giphy Api
  else if (e.request.url.match('giphy.com/media')) {
    e.respondWith(staticCache(e.request, 'giphy'));
  }
});

// Listen for message from client
self.addEventListener('message', e => {
  // Identify message
  if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphysArray);
});