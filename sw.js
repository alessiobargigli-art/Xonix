const VERSION='0.3.30';
const CACHE='xonix-'+VERSION;
const CORE=['./','./index.html','./style.css?v='+VERSION,'./game.js?v='+VERSION,'./manifest.webmanifest','./icon.svg','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
 ]));
});

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const isAppShell=url.origin===self.location.origin&&!url.pathname.includes('/backgrounds/');
 if(isAppShell){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
   if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
   return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>{
  const network=fetch(event.request).then(response=>{
   if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
   return response;
  }).catch(()=>cached);
  return cached||network;
 }));
});