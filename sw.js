// 定義快取名稱
const CACHE_NAME = 'unipocket-cache-v1';

// 預先快取的靜態資源
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './themes.css',
  './app.js',
  './manifest.json',
  './UniPocket_png192.png',
  './UniPocket_png512.png',
  './icon.svg'
];

// 1. 載入 OneSignal 的核心
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. 強制新的 Service Worker 立即接管
self.addEventListener('install', (event) => {
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 安裝 Service Worker 並快取核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟動並清除過期快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 攔截請求：網路優先，失敗時退回快取 (Network-first with cache fallback)
self.addEventListener('fetch', (event) => {
  // 排除 Supabase 等外部 API 請求
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return; 
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 若請求成功，將新版本寫入快取
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 離線或請求失敗時從快取取得
        return caches.match(event.request);
      })
  );
});
