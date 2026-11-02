import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  const midtransDevPlugin = {
    name: 'midtrans-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/api/midtrans/charge', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const grossAmount = data.amount || 49000;
            const orderId = `BJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const serverKey = env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-g.HZr8yP-y7EU4bK0e2uRtgm';
            const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

            const payload = {
              transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
              },
              enabled_payments: ['gopay'],
              gopay: {
                enable_callback: false
              },
              customer_details: {
                first_name: data.customer_name || 'Bunda',
                email: data.customer_email || 'bunda@bundajournal.my.id'
              }
            };

            const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify(payload)
            });

            const resJson = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = response.status;
            res.end(JSON.stringify(resJson));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };

  return {
    plugins: [react(), tailwindcss(), midtransDevPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
