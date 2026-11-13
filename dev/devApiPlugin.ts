// API lokal untuk dev: user/tier/order/userdata disimpan di .dev-db.json, BUKAN D1 produksi.
// Dipasang hanya saat vite dev (configureServer). Tidak ikut ke build production.
import fs from 'node:fs';
import path from 'node:path';

type User = { email: string; name: string; password: string; token: string };
type DB = {
  users: Record<string, User>;
  subs: Record<string, { tier: string; amount: number; is_paid: boolean }>;
  userdata: Record<string, { payload: string; updated_at: string }>;
  orders: { order_id: string; email: string; tier: string; amount: number; created_at: string }[];
};

const empty = (): DB => ({ users: {}, subs: {}, userdata: {}, orders: [] });

export function devApiPlugin() {
  const file = path.resolve(process.cwd(), '.dev-db.json');

  const load = (): DB => {
    try {
      return { ...empty(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {
      return empty();
    }
  };
  const save = (db: DB) => {
    try {
      fs.writeFileSync(file, JSON.stringify(db, null, 2));
    } catch (e) {
      console.warn('[dev-db] gagal simpan:', e);
    }
  };
  const tokenFor = (email: string) => 'dev-' + Buffer.from(email).toString('hex');
  const tierOf = (db: DB, email: string) => db.subs[email]?.tier || 'none';

  return {
    name: 'bunda-dev-api',
    configureServer(server: any) {
      const readBody = (req: any) =>
        new Promise<any>((res) => {
          let b = '';
          req.on('data', (c: any) => { b += c; });
          req.on('end', () => {
            try { res(JSON.parse(b || '{}')); } catch { res({}); }
          });
        });

      const send = (res: any, status: number, obj: any) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
      };

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        const p = url.pathname;
        if (!p.startsWith('/api/')) return next();
        // Auth Google tetap di-proxy ke produksi (bukan data user/tier/order).
        if (p.startsWith('/api/auth/google')) return next();
        // Payment sandbox ditangani middleware terpisah.
        if (p.startsWith('/api/midtrans') || p === '/api/upgrade' || p === '/api/keepalive') return next();

        const db = load();
        const method = (req.method || 'GET').toUpperCase();

        if (p === '/api/dev/reset' && method === 'DELETE') {
          save(empty());
          return send(res, 200, { ok: true, cleared: true });
        }

        if (p === '/api/subscription') {
          const email = String(url.searchParams.get('email') || '').toLowerCase();
          if (method === 'GET') {
            if (!email) return send(res, 400, { error: 'Parameter email wajib disertakan' });
            const s = db.subs[email];
            return send(res, 200, s
              ? { ok: true, exists: true, email, tier: s.tier, amount: s.amount, is_paid: s.is_paid }
              : { ok: true, exists: false, email, tier: 'none', is_paid: false });
          }
          if (method === 'POST') {
            const b = await readBody(req);
            const em = String(b.email || '').toLowerCase();
            if (!em) return send(res, 400, { error: 'email wajib' });

            // Anti-bypass (mirror functions/api/subscription.ts): wajib sesi valid
            // milik email tujuan, dan amount harus harga resmi. Tier diturunkan
            // dari plan/amount di server — bukan dari body client.
            const authHeader = String(req.headers['authorization'] || '');
            const bearer = /^bearer\s+/i.test(authHeader) ? authHeader.replace(/^bearer\s+/i, '').trim() : '';
            const token = String(
              bearer || b.token || b.session_token || b.bunda_session_token || req.headers['x-bunda-session-token'] || ''
            ).trim();
            if (!token) {
              return send(res, 401, { error: 'Sesi wajib disertakan (Authorization: Bearer <token> atau bunda_session_token)' });
            }
            const sess = Object.values(db.users).find((x) => x.token === token);
            if (!sess) return send(res, 401, { error: 'Sesi tidak valid / kedaluwarsa.' });
            if (sess.email !== em) return send(res, 403, { error: 'Sesi tidak cocok dengan email tujuan.' });

            const PLAN_PRICE: Record<string, { amount: number; tier: string }> = {
              essential: { amount: 49000, tier: 'essential' },
              vip: { amount: 129000, tier: 'vip' },
              upgrade_vip: { amount: 80000, tier: 'vip' },
              hardcover: { amount: 249000, tier: 'vip' },
            };
            const AMOUNT_TO_PLAN: Record<number, string> = { 49000: 'essential', 129000: 'vip', 80000: 'upgrade_vip', 249000: 'hardcover' };
            const planKey = String(b.plan || '').trim().toLowerCase();
            const rawAmount = Number(b.amount || b.amount_paid) || 0;
            const plan = planKey && PLAN_PRICE[planKey] ? planKey : AMOUNT_TO_PLAN[rawAmount];
            if (!plan) return send(res, 400, { error: 'Plan tidak dikenal atau amount bukan harga resmi.' });
            if (rawAmount && rawAmount !== PLAN_PRICE[plan].amount) {
              return send(res, 400, { error: 'Amount tidak sesuai harga resmi plan.', expected: PLAN_PRICE[plan].amount });
            }
            // Catatan: bukti pembayaran (order settlement) divalidasi di produksi
            // (functions/api/subscription.ts). Sandbox dev tidak punya webhook.
            const isPaid = b.is_paid !== undefined ? !!b.is_paid : true;
            db.subs[em] = { tier: PLAN_PRICE[plan].tier, amount: PLAN_PRICE[plan].amount, is_paid: isPaid };
            save(db);
            return send(res, 200, { ok: true, email: em, ...db.subs[em] });
          }
        }

        if (p === '/api/auth/register' && method === 'POST') {
          const b = await readBody(req);
          const email = String(b.email || '').toLowerCase();
          if (!email || !b.password) return send(res, 400, { error: 'Email dan password wajib.' });
          if (db.users[email]) return send(res, 409, { error: 'Email sudah terdaftar.' });
          const user: User = { email, name: b.name || 'Bunda', password: String(b.password), token: tokenFor(email) };
          db.users[email] = user;
          save(db);
          return send(res, 200, { email, name: user.name, tier: tierOf(db, email), token: user.token });
        }

        if (p === '/api/auth/login' && method === 'POST') {
          const b = await readBody(req);
          const email = String(b.email || '').toLowerCase();
          const u = db.users[email];
          if (!u || u.password !== String(b.password)) return send(res, 401, { error: 'Email atau password salah.' });
          return send(res, 200, { email, name: u.name, tier: tierOf(db, email), token: u.token });
        }

        if (p === '/api/auth/me' && method === 'GET') {
          const t = url.searchParams.get('token') || '';
          const u = Object.values(db.users).find((x) => x.token === t);
          if (!u) return send(res, 401, { ok: false });
          return send(res, 200, { ok: true, email: u.email, name: u.name, tier: tierOf(db, u.email) });
        }

        if (p === '/api/auth/logout') return send(res, 200, { ok: true });

        // Client ID OAuth publik untuk Google Drive backup (dev).
        if (p === '/api/google-config') {
          const clientId =
            String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
          return send(res, 200, { ok: true, clientId });
        }

        if (p === '/api/userdata') {
          if (method === 'GET') {
            const t = url.searchParams.get('token') || '';
            const u = Object.values(db.users).find((x) => x.token === t);
            if (!u) return send(res, 401, { ok: false });
            const d = db.userdata[u.email];
            return send(res, 200, d
              ? { ok: true, exists: true, payload: d.payload, updated_at: d.updated_at }
              : { ok: true, exists: false, payload: null, updated_at: null });
          }
          if (method === 'POST') {
            const b = await readBody(req);
            const u = Object.values(db.users).find((x) => x.token === b.token);
            if (!u) return send(res, 401, { ok: false });
            db.userdata[u.email] = { payload: String(b.payload || '{}'), updated_at: new Date().toISOString() };
            save(db);
            return send(res, 200, { ok: true });
          }
        }

        return send(res, 404, { error: `Dev API: route ${method} ${p} tidak ada`, dev_db: 'local' });
      });
    },
  };
}
