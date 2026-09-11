const CACHE='terreiro-v3';
const ASSETS=['/','/index.html','/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('script.google.com'))return;
  // Não cachear mobile.html e pontos.html — sempre buscar do servidor
  if(e.request.url.includes('mobile.html')||e.request.url.includes('pontos.html')||e.request.url.includes('admin.html'))return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cl=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,cl));return r;})).catch(()=>caches.match('/index.html')));
});
