import fs from 'node:fs';
import path from 'node:path';

// Halaman /diag: dijalankan DI BROWSER TABLET.
// Tujuan: kumpulkan bukti perangkat nyata (localStorage, IndexedDB, canvas,
// kuota, dukungan API) lalu kirim ke laptop lewat /api/dev-diag.
// Dev-only: plugin ini tidak ikut build produksi.

const DIAG_HTML = `<!doctype html><html lang="id"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Diagnostik Bunda Journal</title>
<style>
 body{font:16px/1.5 -apple-system,Segoe UI,sans-serif;background:#faf9f7;color:#1c1917;margin:0;padding:20px}
 h1{font-size:20px;margin:0 0 4px} .sub{color:#78716c;font-size:13px;margin-bottom:16px}
 table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden}
 td{padding:10px;border-bottom:1px solid #e7e5e4;vertical-align:top;font-size:14px}
 td:first-child{font-weight:600;width:38%} .ok{color:#15803d;font-weight:700} .bad{color:#b91c1c;font-weight:700}
 pre{background:#1f1d1b;color:#f5f2eb;padding:12px;border-radius:10px;overflow:auto;font-size:12px}
 .note{background:#fff;border-left:3px solid #556b2f;padding:10px 12px;border-radius:6px;font-size:13px;margin:14px 0}
</style></head><body>
<h1>Diagnostik di perangkat ini</h1>
<div class="sub">Halaman ini menguji penyimpanan & API browser, lalu mengirim hasilnya ke laptop.</div>
<div class="note">Biarkan halaman ini terbuka sampai muncul "Terkirim ke laptop".</div>
<table id="rows"></table>
<h3>Data mentah</h3><pre id="raw">menjalankan…</pre>
<script>
(function(){
  var results = { startedAt: new Date().toISOString(), checks: [], errors: [] };
  var rows = document.getElementById('rows');
  window.addEventListener('error', function(e){ results.errors.push(String(e.message||e.error)); });
  window.addEventListener('unhandledrejection', function(e){ results.errors.push('promise: '+String(e.reason)); });

  function add(name, pass, detail){
    results.checks.push({ name: name, pass: pass, detail: String(detail == null ? '' : detail) });
    var tr = document.createElement('tr');
    var a = document.createElement('td'); a.textContent = name;
    var b = document.createElement('td');
    var s = document.createElement('span'); s.className = pass ? 'ok' : 'bad'; s.textContent = pass ? 'OK ' : 'GAGAL ';
    b.appendChild(s); b.appendChild(document.createTextNode(String(detail == null ? '' : detail)));
    tr.appendChild(a); tr.appendChild(b); rows.appendChild(tr);
  }

  function bytes(n){ return n > 1048576 ? (n/1048576).toFixed(1)+' MB' : (n/1024).toFixed(0)+' KB'; }

  function openDb(name, version, upgrade){
    return new Promise(function(resolve, reject){
      var req = indexedDB.open(name, version);
      req.onupgradeneeded = function(e){ if (upgrade) upgrade(e.target.result); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
      req.onblocked = function(){ reject(new Error('blocked')); };
    });
  }

  function idbGet(db, store, key){
    return new Promise(function(resolve){
      if (!db.objectStoreNames.contains(store)) return resolve(null);
      var tx = db.transaction(store, 'readonly');
      var g = tx.objectStore(store).get(key);
      g.onsuccess = function(){ resolve(g.result || null); };
      g.onerror = function(){ resolve(null); };
    });
  }

  async function run(){
    results.device = {
      ua: navigator.userAgent,
      platform: navigator.platform || '',
      screen: screen.width + 'x' + screen.height,
      viewport: innerWidth + 'x' + innerHeight,
      dpr: devicePixelRatio,
      touch: ('ontouchstart' in window),
      lang: navigator.language,
      standalone: matchMedia('(display-mode: standalone)').matches
    };
    add('Info perangkat', true, results.device.screen + ' @' + results.device.dpr + 'x · ' + (results.device.touch ? 'touch' : 'no-touch'));

    // 1. localStorage
    try {
      var k = 'bunda_diag_probe';
      localStorage.setItem(k, 'ok-' + Date.now());
      var got = localStorage.getItem(k);
      localStorage.removeItem(k);
      add('localStorage', got && got.indexOf('ok-') === 0, 'bisa tulis/baca/hapus');
      var used = 0;
      for (var i=0;i<localStorage.length;i++){ var kk = localStorage.key(i); used += (kk||'').length + (localStorage.getItem(kk)||'').length; }
      add('Isi localStorage', true, localStorage.length + ' key · ±' + bytes(used*2));
    } catch(e){ add('localStorage', false, e.message); }

    // 2. Kuota penyimpanan
    try {
      if (navigator.storage && navigator.storage.estimate) {
        var est = await navigator.storage.estimate();
        add('Kuota storage', true, 'terpakai ' + bytes(est.usage||0) + ' / ' + bytes(est.quota||0));
      } else add('Kuota storage', false, 'navigator.storage.estimate tidak ada');
    } catch(e){ add('Kuota storage', false, e.message); }

    // 3. IndexedDB dasar
    try {
      var db = await openDb('bunda_diag_db', 1, function(d){ if(!d.objectStoreNames.contains('t')) d.createObjectStore('t'); });
      var val = 'idb-' + Date.now();
      await new Promise(function(resolve, reject){
        var tx = db.transaction('t','readwrite'); tx.objectStore('t').put(val,'k');
        tx.oncomplete = resolve; tx.onerror = function(){ reject(tx.error); };
      });
      var back = await idbGet(db,'t','k');
      add('IndexedDB', back === val, 'bisa tulis/baca');
      db.close();
    } catch(e){ add('IndexedDB', false, e.message); }

    // 4. IndexedDB aplikasi (foto)
    try {
      var appDb = await openDb('bunda_journal_db', 1);
      var idx = await idbGet(appDb,'app_data','bunda_media_index');
      var photos = await idbGet(appDb,'app_data','bunda_photos');
      var photoVal = photos && photos.value ? photos.value : '';
      var list = [];
      try { list = photoVal ? JSON.parse(photoVal) : []; } catch(e){}
      add('DB aplikasi', true, (idx ? 'index media ada' : 'index media belum ada') + ' · foto tersimpan: ' + (Array.isArray(list) ? list.length : 0));
      appDb.close();
    } catch(e){ add('DB aplikasi', false, e.message); }

    // 5. Canvas / foto
    try {
      var c = document.createElement('canvas'); c.width = 200; c.height = 150;
      var ctx = c.getContext('2d'); ctx.fillStyle = '#556b2f'; ctx.fillRect(0,0,200,150);
      var url = c.toDataURL('image/jpeg', 0.8);
      add('Canvas → JPEG', url.indexOf('data:image/jpeg') === 0, bytes(url.length));
    } catch(e){ add('Canvas → JPEG', false, e.message); }

    // 6. API pendukung fitur
    add('Intl.Segmenter (emoji=1)', typeof Intl !== 'undefined' && !!Intl.Segmenter, 'dipakai clamp catatan');
    add('Service Worker', 'serviceWorker' in navigator, ('serviceWorker' in navigator) ? (navigator.serviceWorker.controller ? 'aktif' : 'didukung, belum aktif') : 'tidak didukung');
    add('Print media query', matchMedia('print').media === 'print', 'dukungan CSS cetak');
    try {
      var p = await fetch('/api/google-config', { cache: 'no-store' });
      var j = await p.json();
      add('Endpoint /api/google-config', p.ok, 'clientId: ' + (j.clientId ? 'ADA' : 'KOSONG (Drive belum bisa tes)'));
    } catch(e){ add('/api/google-config', false, e.message); }

    // 7. Data aplikasi di perangkat ini
    try {
      var prof = localStorage.getItem('bunda_profile');
      var week = localStorage.getItem('bunda_week');
      var logged = localStorage.getItem('bunda_isLoggedIn');
      var name = ''; try { name = prof ? (JSON.parse(prof).name || '') : ''; } catch(e){}
      add('Data aplikasi', true, 'profil: ' + (name || 'belum ada') + ' · minggu: ' + (week || '-') + ' · login: ' + (logged || '-'));
    } catch(e){ add('Data aplikasi', false, e.message); }

    results.finishedAt = new Date().toISOString();
    results.pass = results.checks.filter(function(c){ return c.pass; }).length;
    results.fail = results.checks.filter(function(c){ return !c.pass; }).length;
    document.getElementById('raw').textContent = JSON.stringify(results, null, 2);
    try {
      var res = await fetch('/diag-report', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(results) });
      add('Kirim hasil ke laptop', res.ok, res.ok ? 'Terkirim ke laptop' : 'HTTP ' + res.status);
    } catch(e){ add('Kirim hasil ke laptop', false, e.message); }
  }
  run();
})();
</script></body></html>`;

export function diagPlugin() {
  return {
    name: 'bunda-diag',
    configureServer(server: any) {
      server.middlewares.use('/diag-report', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"ok":false}');
          return;
        }
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const dir = path.join(process.cwd(), 'dev', 'diag-results');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, `${Date.now()}.json`), body, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end('{"ok":true}');
          } catch {
            res.statusCode = 500;
            res.end('{"ok":false}');
          }
        });
      });
      server.middlewares.use('/diag', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(DIAG_HTML);
      });
    },
  };
}
