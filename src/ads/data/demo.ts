import type {
  AccountInfo,
  AlertItem,
  AuditEntry,
  Campaign,
  Creative,
  DailyMetric,
  Order,
  ParameterField,
  ProductEconomics,
  RangeSummary,
} from '../types';
import { productEconomics } from '../lib/calculators';

export const DEMO_TODAY = '2026-11-16';
const DEMO_END = new Date(Date.UTC(2026, 10, 16));
const DAY_MS = 86_400_000;

const roundTo = (value: number, step = 1) => Math.round(value / step) * step;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function isoDay(offsetFromEnd: number): string {
  const date = new Date(DEMO_END.getTime() - offsetFromEnd * DAY_MS);
  return date.toISOString().slice(0, 10);
}

function dayFactor(iso: string): number {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return [0.96, 1.0, 1.01, 1.02, 1.04, 1.1, 1.14][day] ?? 1;
}

export const DEMO_ACCOUNT: AccountInfo = {
  name: 'Bunda Journal',
  adAccountId: 'act_1029384756',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  pageName: 'Bunda Journal',
  pixelId: 'pixel_778899',
  lastSync: '2026-11-16T08:30:00+07:00',
  tokenStatus: 'demo',
};

export const DEMO_PRODUCTS: ProductEconomics[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 49_000,
    cogs: 0,
    shipping: 0,
    feePct: 0.007,
    refundPct: 0.02,
    taxMode: 'none',
    taxPct: 0,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 129_000,
    cogs: 0,
    shipping: 0,
    feePct: 0.007,
    refundPct: 0.02,
    taxMode: 'none',
    taxPct: 0,
  },
  {
    id: 'upgrade_vip',
    name: 'Upgrade VIP',
    price: 80_000,
    cogs: 0,
    shipping: 0,
    feePct: 0.007,
    refundPct: 0.02,
    taxMode: 'none',
    taxPct: 0,
  },
  {
    id: 'hardcover',
    name: 'Hardcover',
    price: 249_000,
    cogs: 120_000,
    shipping: 20_000,
    feePct: 0.007,
    refundPct: 0.02,
    taxMode: 'none',
    taxPct: 0,
    assumption: 'COGS cetak Rp120rb + ongkir Rp20rb masih asumsi.',
  },
];

interface CampaignSeed {
  id: string;
  name: string;
  status: Campaign['status'];
  objective: string;
  productId: string;
  budget: number;
  dailySpend: number;
  ordersPerDay: number;
  cpm: number;
  ctr: number;
  frequency: number;
  createdDaysAgo: number;
}

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  {
    id: 'cmp_vip_interest',
    name: 'VIP-Interest-01',
    status: 'active',
    objective: 'Sales',
    productId: 'vip',
    budget: 250_000,
    dailySpend: 257_000,
    ordersPerDay: 4.4,
    cpm: 45_000,
    ctr: 0.018,
    frequency: 1.8,
    createdDaysAgo: 46,
  },
  {
    id: 'cmp_vip_testimoni',
    name: 'VIP-Testimoni-02',
    status: 'active',
    objective: 'Sales',
    productId: 'vip',
    budget: 180_000,
    dailySpend: 171_000,
    ordersPerDay: 2.6,
    cpm: 48_000,
    ctr: 0.016,
    frequency: 2.1,
    createdDaysAgo: 33,
  },
  {
    id: 'cmp_vip_lookalike',
    name: 'VIP-Lookalike-03',
    status: 'active',
    objective: 'Sales',
    productId: 'vip',
    budget: 150_000,
    dailySpend: 140_000,
    ordersPerDay: 1.7,
    cpm: 52_000,
    ctr: 0.012,
    frequency: 2.3,
    createdDaysAgo: 21,
  },
  {
    id: 'cmp_hc_retarget',
    name: 'HC-Retarget',
    status: 'active',
    objective: 'Sales',
    productId: 'hardcover',
    budget: 75_000,
    dailySpend: 44_000,
    ordersPerDay: 0,
    cpm: 38_000,
    ctr: 0.021,
    frequency: 3.4,
    createdDaysAgo: 17,
  },
  {
    id: 'cmp_static_01',
    name: 'Static-01',
    status: 'active',
    objective: 'Sales',
    productId: 'hardcover',
    budget: 75_000,
    dailySpend: 34_000,
    ordersPerDay: 0.43,
    cpm: 42_000,
    ctr: 0.019,
    frequency: 2.8,
    createdDaysAgo: 58,
  },
  {
    id: 'cmp_hc_interest',
    name: 'HC-Interest-02',
    status: 'active',
    objective: 'Sales',
    productId: 'hardcover',
    budget: 240_000,
    dailySpend: 224_000,
    ordersPerDay: 1.14,
    cpm: 47_000,
    ctr: 0.016,
    frequency: 2.4,
    createdDaysAgo: 29,
  },
];

function buildCampaign(seed: CampaignSeed, rng: () => number): Campaign {
  const product = DEMO_PRODUCTS.find((item) => item.id === seed.productId) ?? DEMO_PRODUCTS[0];
  const econ = productEconomics(product, 0.2);
  const daily: DailyMetric[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const iso = isoDay(offset);
    const factor = dayFactor(iso);
    const trend = 1 + (29 - offset - 14) * 0.004;
    const noise = 0.9 + rng() * 0.2;
    const spend = roundTo(seed.dailySpend * factor * trend * noise, 1000);
    const orders = seed.ordersPerDay <= 0
      ? 0
      : Math.max(0, Math.round(seed.ordersPerDay * factor * trend * (0.72 + rng() * 0.56)));
    const revenue = orders * product.price;
    const platformOrders =
      orders === 0
        ? rng() > 0.82
          ? 1
          : 0
        : orders + Math.round(orders * (0.06 + rng() * 0.12));
    daily.push({
      date: iso,
      spend,
      revenue,
      orders,
      platformOrders,
      profit: orders * econ.contribution - spend,
    });
  }
  const totals = daily.reduce(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      revenue: acc.revenue + row.revenue,
      orders: acc.orders + row.orders,
      platformOrders: acc.platformOrders + row.platformOrders,
    }),
    { spend: 0, revenue: 0, orders: 0, platformOrders: 0 }
  );
  const impressions = Math.round((totals.spend / seed.cpm) * 1000);
  const clicks = Math.round(impressions * seed.ctr * (0.96 + rng() * 0.08));
  const outboundClicks = Math.round(clicks * 0.9);
  const lpv = Math.round(outboundClicks * (0.68 + rng() * 0.06));
  const frequency = seed.frequency * (0.97 + rng() * 0.06);
  const created = new Date(DEMO_END.getTime() - seed.createdDaysAgo * DAY_MS);
  return {
    id: seed.id,
    name: seed.name,
    status: seed.status,
    objective: seed.objective,
    productId: seed.productId,
    budget: seed.budget,
    spend: totals.spend,
    impressions,
    reach: Math.max(1, Math.round(impressions / frequency)),
    frequency,
    clicks,
    outboundClicks,
    lpv,
    orders: totals.orders,
    revenue: totals.revenue,
    platformOrders: totals.platformOrders,
    platformRevenue: totals.platformOrders * product.price,
    createdAt: created.toISOString(),
    daily,
  };
}

export function buildDemoCampaigns(): Campaign[] {
  const rng = mulberry32(20261116);
  return CAMPAIGN_SEEDS.map((seed) => buildCampaign(seed, rng));
}

export function summarizeRange(campaigns: Campaign[], days: number): RangeSummary {
  const slice = Math.max(1, Math.min(30, days));
  const byDate = new Map<string, DailyMetric>();
  let spend = 0;
  let revenue = 0;
  let orders = 0;
  let platformOrders = 0;
  let platformRevenue = 0;
  let profit = 0;
  let impressions = 0;
  let clicks = 0;
  let lpv = 0;
  campaigns.forEach((campaign) => {
    const product = DEMO_PRODUCTS.find((item) => item.id === campaign.productId) ?? DEMO_PRODUCTS[0];
    const recent = campaign.daily.slice(-slice);
    recent.forEach((row) => {
      const current = byDate.get(row.date) ?? {
        date: row.date,
        spend: 0,
        revenue: 0,
        orders: 0,
        platformOrders: 0,
        profit: 0,
      };
      current.spend += row.spend;
      current.revenue += row.revenue;
      current.orders += row.orders;
      current.platformOrders += row.platformOrders;
      current.profit += row.profit;
      byDate.set(row.date, current);
      spend += row.spend;
      revenue += row.revenue;
      orders += row.orders;
      platformOrders += row.platformOrders;
      platformRevenue += row.platformOrders * product.price;
      profit += row.profit;
    });
    impressions += Math.round(campaign.impressions * (recent.length / Math.max(1, campaign.daily.length)));
    clicks += Math.round(campaign.clicks * (recent.length / Math.max(1, campaign.daily.length)));
    lpv += Math.round(campaign.lpv * (recent.length / Math.max(1, campaign.daily.length)));
  });
  const daily = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    days: slice,
    spend,
    revenue,
    orders,
    platformOrders,
    platformRevenue,
    profit,
    impressions,
    clicks,
    lpv,
    daily,
    activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
  };
}

export function summarizePreviousRange(campaigns: Campaign[], days: number): RangeSummary {
  const slice = Math.max(1, Math.min(30, days));
  const previous = campaigns.map((campaign) => ({
    ...campaign,
    daily: campaign.daily.slice(Math.max(0, campaign.daily.length - slice * 2), Math.max(0, campaign.daily.length - slice)),
  }));
  return summarizeRange(previous, slice);
}

export function rangeStart(days: number): string {
  return isoDay(days - 1);
}

export function campaignForRange(campaign: Campaign, days: number): Campaign {
  const slice = Math.max(1, Math.min(days, campaign.daily.length));
  const daily = campaign.daily.slice(-slice);
  const totals = daily.reduce(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      revenue: acc.revenue + row.revenue,
      orders: acc.orders + row.orders,
      platformOrders: acc.platformOrders + row.platformOrders,
    }),
    { spend: 0, revenue: 0, orders: 0, platformOrders: 0 }
  );
  const fraction = slice / Math.max(1, campaign.daily.length);
  const product = DEMO_PRODUCTS.find((item) => item.id === campaign.productId) ?? DEMO_PRODUCTS[0];
  return {
    ...campaign,
    daily,
    spend: totals.spend,
    revenue: totals.revenue,
    orders: totals.orders,
    platformOrders: totals.platformOrders,
    platformRevenue: totals.platformOrders * product.price,
    impressions: Math.round(campaign.impressions * fraction),
    reach: Math.max(1, Math.round(campaign.reach * fraction)),
    clicks: Math.round(campaign.clicks * fraction),
    outboundClicks: Math.round(campaign.outboundClicks * fraction),
    lpv: Math.round(campaign.lpv * fraction),
  };
}

export function buildDemoOrders(campaigns: Campaign[]): Order[] {
  const rng = mulberry32(771122);
  const orders: Order[] = [];
  let sequence = 1;
  campaigns.forEach((campaign) => {
    const product = DEMO_PRODUCTS.find((item) => item.id === campaign.productId) ?? DEMO_PRODUCTS[0];
    campaign.daily.forEach((day) => {
      for (let index = 0; index < day.orders; index += 1) {
        const roll = rng();
        const status: Order['status'] =
          roll < 0.96 ? 'paid' : roll < 0.98 ? 'refunded' : roll < 0.99 ? 'pending' : 'failed';
        const gross = product.price;
        const fee = gross * product.feePct;
        const refund = status === 'refunded' ? gross : 0;
        const net = status === 'paid' ? gross - fee : 0;
        const hour = 8 + Math.floor(rng() * 13);
        const minute = Math.floor(rng() * 60);
        const id = `demo_${sequence}`;
        orders.push({
          id,
          externalOrderId: `BJ-${day.date.replace(/-/g, '')}-${String(sequence).padStart(4, '0')}`,
          source: rng() > 0.18 ? 'midtrans' : 'manual',
          productId: product.id,
          gross,
          fee,
          refund,
          net,
          status,
          paidAt: `${day.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`,
          campaignId: campaign.id,
          matchMethod: rng() > 0.08 ? 'utm' : 'unmatched',
          customerHash: `sha256_demo_${sequence}`,
        });
        sequence += 1;
      }
    });
  });
  return orders;
}

export function filterOrders(orders: Order[], days: number): Order[] {
  const start = rangeStart(days);
  return orders.filter((order) => order.paidAt.slice(0, 10) >= start);
}

function buildCreatives(): Creative[] {
  const rows: Omit<Creative, 'createdAt'>[] = [
    {
      id: 'cr_video_testimoni',
      name: 'Video-Testimoni-02',
      campaignId: 'cmp_vip_testimoni',
      format: 'video',
      angle: 'Testimoni USG',
      spend: 1_200_000,
      impressions: 25_000,
      clicks: 450,
      lpv: 315,
      orders: 18,
      revenue: 2_322_000,
      frequency: 1.9,
      hookRate: 0.34,
      holdRate: 0.22,
    },
    {
      id: 'cr_video_usg',
      name: 'Video-USG-01',
      campaignId: 'cmp_vip_interest',
      format: 'video',
      angle: 'USG',
      spend: 980_000,
      impressions: 20_000,
      clicks: 380,
      lpv: 266,
      orders: 12,
      revenue: 1_548_000,
      frequency: 3.4,
      hookRate: 0.28,
      holdRate: 0.18,
    },
    {
      id: 'cr_static_01',
      name: 'Static-01',
      campaignId: 'cmp_static_01',
      format: 'image',
      angle: 'Hardcover',
      spend: 240_000,
      impressions: 6_000,
      clicks: 120,
      lpv: 84,
      orders: 3,
      revenue: 747_000,
      frequency: 2.8,
      hookRate: 0,
      holdRate: 0,
    },
    {
      id: 'cr_carousel_nama',
      name: 'Carousel-Nama-01',
      campaignId: 'cmp_vip_lookalike',
      format: 'image',
      angle: 'Nama bayi',
      spend: 600_000,
      impressions: 12_000,
      clicks: 210,
      lpv: 147,
      orders: 7,
      revenue: 903_000,
      frequency: 2.1,
      hookRate: 0,
      holdRate: 0,
    },
    {
      id: 'cr_video_hardcover',
      name: 'Video-Hardcover-01',
      campaignId: 'cmp_hc_interest',
      format: 'video',
      angle: 'Hardcover',
      spend: 1_570_000,
      impressions: 31_000,
      clicks: 500,
      lpv: 350,
      orders: 8,
      revenue: 1_992_000,
      frequency: 2.4,
      hookRate: 0.3,
      holdRate: 0.2,
    },
    {
      id: 'cr_hc_retarget',
      name: 'Static-HC-Retarget',
      campaignId: 'cmp_hc_retarget',
      format: 'image',
      angle: 'Retargeting',
      spend: 310_000,
      impressions: 7_000,
      clicks: 140,
      lpv: 98,
      orders: 0,
      revenue: 0,
      frequency: 3.4,
      hookRate: 0,
      holdRate: 0,
    },
    {
      id: 'cr_video_hook',
      name: 'Video-Hook-03',
      campaignId: 'cmp_vip_interest',
      format: 'video',
      angle: 'Hook emosional',
      spend: 420_000,
      impressions: 9_000,
      clicks: 240,
      lpv: 168,
      orders: 2,
      revenue: 258_000,
      frequency: 1.6,
      hookRate: 0.41,
      holdRate: 0.12,
    },
    {
      id: 'cr_static_testimoni',
      name: 'Static-Testimoni-02',
      campaignId: 'cmp_vip_testimoni',
      format: 'image',
      angle: 'Testimoni',
      spend: 300_000,
      impressions: 7_500,
      clicks: 90,
      lpv: 63,
      orders: 4,
      revenue: 516_000,
      frequency: 1.4,
      hookRate: 0,
      holdRate: 0,
    },
  ];
  return rows.map((row, index) => ({
    ...row,
    createdAt: new Date(DEMO_END.getTime() - (12 + index * 3) * DAY_MS).toISOString(),
  }));
}

export const DEMO_CREATIVES: Creative[] = buildCreatives();

export const DEMO_ALERTS: AlertItem[] = [
  {
    id: 'alert_hc_retarget',
    severity: 'critical',
    title: 'HC-Retarget: spend besar tanpa order',
    body: 'Spend 7 hari sudah >3× Max CPA hardcover, nol order bank. Kandidat hentikan.',
    ruleKey: 'spend_without_order',
    createdAt: '2026-11-16T07:45:00+07:00',
    ack: false,
  },
  {
    id: 'alert_freq',
    severity: 'warning',
    title: 'Video-USG-01 frequency 3,4',
    body: 'Frequency di atas 3 dan CTR turun 31% vs 7 hari sebelumnya. Siapkan hook baru.',
    ruleKey: 'frequency_creep',
    createdAt: '2026-11-16T07:40:00+07:00',
    ack: false,
  },
  {
    id: 'alert_gap',
    severity: 'warning',
    title: 'Gap Meta vs bank terdeteksi',
    body: 'Meta melaporkan lebih banyak order daripada bank. Keputusan memakai angka bank.',
    ruleKey: 'tracking_gap',
    createdAt: '2026-11-16T07:30:00+07:00',
    ack: false,
  },
];

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 'audit_1',
    actor: 'system@demo',
    action: 'sync.meta',
    target: 'act_1029384756',
    detail: 'Sync 30 hari sukses. 6 campaign, 300+ order demo.',
    createdAt: '2026-11-16T08:30:00+07:00',
  },
  {
    id: 'audit_2',
    actor: 'demo@bunda',
    action: 'settings.product.update',
    target: 'hardcover',
    detail: 'COGS hardcover diubah ke Rp120.000 (asumsi).',
    createdAt: '2026-11-15T20:12:00+07:00',
  },
  {
    id: 'audit_3',
    actor: 'analis@demo',
    action: 'action.propose',
    target: 'cmp_hc_retarget',
    detail: 'Usul hentikan karena spend >2× Max CPA tanpa order.',
    createdAt: '2026-11-16T07:46:00+07:00',
  },
];

export const DEMO_BREAKDOWNS = {
  age_gender: [
    { value: '25–34 · perempuan', spend: 2_450_000, orders: 31, revenue: 3_999_000, impressions: 54_000 },
    { value: '35–44 · perempuan', spend: 1_780_000, orders: 21, revenue: 2_709_000, impressions: 39_000 },
    { value: '18–24 · perempuan', spend: 1_220_000, orders: 13, revenue: 1_677_000, impressions: 27_000 },
    { value: '45+ · perempuan', spend: 640_000, orders: 7, revenue: 903_000, impressions: 14_000 },
  ],
  placement: [
    { value: 'Facebook Feed', spend: 2_440_000, orders: 30, revenue: 3_870_000, impressions: 52_000 },
    { value: 'Instagram Reels', spend: 2_130_000, orders: 25, revenue: 3_225_000, impressions: 47_000 },
    { value: 'Instagram Feed', spend: 1_060_000, orders: 12, revenue: 1_548_000, impressions: 23_000 },
    { value: 'Stories', spend: 460_000, orders: 5, revenue: 645_000, impressions: 10_000 },
  ],
};

export const DEMO_BREAKDOWN_KEYS = [
  { key: 'age_gender' as const, label: 'Usia & gender' },
  { key: 'placement' as const, label: 'Placement' },
];

export function buildDemoCatalogPlaceholder(): ParameterField[] {
  return [];
}
