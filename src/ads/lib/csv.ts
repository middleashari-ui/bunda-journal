import type { Order } from '../types';

const PRODUCT_ALIASES: Record<string, string> = {
  essential: 'essential',
  'essential access': 'essential',
  vip: 'vip',
  'vip bundle': 'vip',
  upgrade: 'upgrade_vip',
  'upgrade vip': 'upgrade_vip',
  hardcover: 'hardcover',
  'hardcover cetak': 'hardcover',
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseMoney(raw: string): number {
  const cleaned = String(raw ?? '').replace(/[^0-9,.-]/g, '');
  if (!cleaned) return 0;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\./g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function normalizeStatus(raw: string): Order['status'] {
  const value = raw.trim().toLowerCase();
  if (['settlement', 'capture', 'paid', 'success', 'sukses'].includes(value)) return 'paid';
  if (['pending', 'menunggu'].includes(value)) return 'pending';
  if (['refund', 'refunded', 'partial_refund'].includes(value)) return 'refunded';
  return 'failed';
}

export interface CsvParseResult {
  orders: Order[];
  errors: string[];
}

export function parseOrdersCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    return { orders: [], errors: ['CSV kosong atau tidak punya baris data.'] };
  }
  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/\s+/g, '_'));
  const indexOf = (name: string) => header.indexOf(name);
  const required = ['order_id', 'product', 'gross', 'status', 'paid_at'];
  const missing = required.filter((name) => indexOf(name) === -1);
  if (missing.length > 0) {
    return { orders: [], errors: [`Kolom wajib hilang: ${missing.join(', ')}.`] };
  }
  const orders: Order[] = [];
  const errors: string[] = [];
  for (let row = 1; row < lines.length && row <= 5000; row += 1) {
    const cells = parseCsvLine(lines[row]);
    const get = (name: string) => cells[indexOf(name)] ?? '';
    const orderId = get('order_id');
    const productRaw = get('product');
    const productId = PRODUCT_ALIASES[productRaw.trim().toLowerCase()];
    const gross = parseMoney(get('gross'));
    const status = normalizeStatus(get('status'));
    const paidAt = get('paid_at');
    if (!orderId) {
      errors.push(`Baris ${row + 1}: order_id kosong.`);
      continue;
    }
    if (!productId) {
      errors.push(`Baris ${row + 1}: produk "${productRaw}" tidak dikenal.`);
      continue;
    }
    if (gross <= 0) {
      errors.push(`Baris ${row + 1}: gross harus > 0.`);
      continue;
    }
    if (!paidAt) {
      errors.push(`Baris ${row + 1}: paid_at kosong.`);
      continue;
    }
    const fee = get('fee') ? parseMoney(get('fee')) : gross * 0.007;
    const refund = get('refund') ? parseMoney(get('refund')) : status === 'refunded' ? gross : 0;
    const net = status === 'paid' ? gross - fee : 0;
    orders.push({
      id: `import_${orderId}`,
      externalOrderId: orderId,
      source: 'bank',
      productId,
      gross,
      fee,
      refund,
      net,
      status,
      paidAt,
      campaignId: get('campaign_id') || undefined,
      matchMethod: get('campaign_id') ? 'manual' : 'unmatched',
      customerHash: 'csv_import',
    });
  }
  if (lines.length > 5001) errors.push('Maksimal 5.000 baris per import.');
  if (orders.length === 0 && errors.length === 0) errors.push('Tidak ada baris valid.');
  return { orders, errors };
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    'order_id',
    'product',
    'gross',
    'fee',
    'refund',
    'net',
    'status',
    'paid_at',
    'campaign_id',
    'source',
  ];
  const rows = orders.map((order) =>
    [
      order.externalOrderId,
      order.productId,
      order.gross,
      order.fee,
      order.refund,
      order.net,
      order.status,
      order.paidAt,
      order.campaignId ?? '',
      order.source,
    ]
      .map((value) => {
        const text = String(value ?? '');
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      })
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
