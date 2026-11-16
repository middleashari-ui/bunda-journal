import type { DecisionStatus, ProductEconomics } from '../types';
import {
  blendedEconomics,
  budgetPacing,
  budgetToResults,
  cashflowPrint,
  creativeDiagnosis,
  decide,
  incrementality,
  ltvCac,
  productEconomics,
  promoBreakEven,
  reconcile,
  scaleSimulator,
  scenarioCompare,
  targetToBudget,
  unitEconomics,
} from './calculators';

export type CalcGroup = 'Dasar' | 'Perencanaan' | 'Skala' | 'Diagnosa' | 'Uang';
export type OutputFormat = 'idr' | 'pct' | 'roas' | 'num' | 'text';

export interface CalcField {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}

export interface CalcOutput {
  label: string;
  value: number | string;
  format: OutputFormat;
  hint?: string;
}

export interface CalcDecision {
  status: DecisionStatus;
  label: string;
  reason: string;
}

export interface CalcContext {
  products: ProductEconomics[];
  bufferPct: number;
}

export interface CalcResult {
  outputs: CalcOutput[];
  decision: CalcDecision;
  assumptions: string[];
}

export interface CalcDef {
  id: string;
  title: string;
  group: CalcGroup;
  question: string;
  fields: CalcField[];
  compute: (values: Record<string, number>, ctx: CalcContext) => CalcResult;
}

const pct = (value: number) => (Number.isFinite(value) ? value / 100 : 0);
const num = (value: number) => (Number.isFinite(value) ? value : 0);
const productById = (ctx: CalcContext, id: string) =>
  ctx.products.find((product) => product.id === id) ?? ctx.products[0];

const ok = (label: string, reason: string): CalcDecision => ({ status: 'scale', label, reason });
const hold = (label: string, reason: string): CalcDecision => ({ status: 'hold', label, reason });
const stop = (label: string, reason: string): CalcDecision => ({ status: 'stop', label, reason });
const insufficient = (reason: string): CalcDecision => ({ status: 'insufficient', label: 'Belum cukup data', reason });

const unitAssumptions = (ctx: CalcContext, productId = 'vip') => {
  const product = productById(ctx, productId);
  return [
    `Fee ${(product.feePct * 100).toFixed(1)}% · refund ${(product.refundPct * 100).toFixed(1)}% · buffer Max CPA ${(ctx.bufferPct * 100).toFixed(0)}%.`,
    product.cogs > 0 ? `COGS ${product.name} masih asumsi; validasi invoice sebelum scale.` : 'COGS digital dianggap 0.',
    'PPN tidak dihitung (mode none). Jika PKP, aktifkan mode pajak di Pengaturan.',
  ];
};

export const CALCULATOR_DEFS: CalcDef[] = [
  {
    id: 'unit_economics',
    title: 'Unit economics',
    group: 'Dasar',
    question: 'Berapa kontribusi, BE ROAS, dan Max CPA produk ini?',
    fields: [
      { key: 'price', label: 'Harga jual', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'cogs', label: 'COGS', default: 0, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'shipping', label: 'Ongkir / packing', default: 0, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'feePct', label: 'Fee pembayaran', default: 0.7, min: 0, max: 10, step: 0.1, suffix: '%' },
      { key: 'refundPct', label: 'Refund', default: 2, min: 0, max: 20, step: 0.1, suffix: '%' },
      { key: 'bufferPct', label: 'Buffer Max CPA', default: 20, min: 0, max: 90, step: 1, suffix: '%' },
    ],
    compute: (v, ctx) => {
      const econ = unitEconomics({
        price: num(v.price),
        cogs: num(v.cogs),
        shipping: num(v.shipping),
        feePct: pct(v.feePct),
        refundPct: pct(v.refundPct),
        taxMode: 'none',
        taxPct: 0,
        bufferPct: pct(v.bufferPct),
      });
      return {
        outputs: [
          { label: 'Kontribusi / order', value: econ.contribution, format: 'idr' },
          { label: 'Margin', value: econ.marginPct, format: 'pct' },
          { label: 'BE ROAS', value: econ.beRoas ?? 0, format: 'roas' },
          { label: 'BE CPA', value: econ.beCpa, format: 'idr' },
          { label: 'Max CPA', value: econ.maxCpa, format: 'idr' },
        ],
        decision:
          econ.contribution <= 0
            ? stop('Tidak layak', 'Kontribusi ≤ 0. Harga tidak menutup COGS, fee, dan refund.')
            : hold('Layak diuji', `Max CPA Rp${Math.round(econ.maxCpa).toLocaleString('id-ID')} — pakai sebagai batas, bukan target.`),
        assumptions: unitAssumptions(ctx),
      };
    },
  },
  {
    id: 'blended',
    title: 'Blended AOV & margin',
    group: 'Dasar',
    question: 'Berapa AOV dan Max CPA akun secara keseluruhan?',
    fields: [
      { key: 'essentialPct', label: 'Mix Essential', default: 20, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'vipPct', label: 'Mix VIP', default: 60, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'hardcoverPct', label: 'Mix Hardcover', default: 20, min: 0, max: 100, step: 1, suffix: '%' },
    ],
    compute: (v, ctx) => {
      const total = num(v.essentialPct) + num(v.vipPct) + num(v.hardcoverPct);
      const mix = {
        essential: total > 0 ? num(v.essentialPct) / total : 0,
        vip: total > 0 ? num(v.vipPct) / total : 0,
        hardcover: total > 0 ? num(v.hardcoverPct) / total : 0,
      };
      const blended = blendedEconomics(ctx.products, mix, ctx.bufferPct);
      return {
        outputs: [
          { label: 'AOV blended', value: blended.aov, format: 'idr' },
          { label: 'Kontribusi / order', value: blended.contribution, format: 'idr' },
          { label: 'Margin', value: blended.marginPct, format: 'pct' },
          { label: 'BE ROAS', value: blended.beRoas ?? 0, format: 'roas' },
          { label: 'Max CPA', value: blended.maxCpa, format: 'idr' },
        ],
        decision:
          blended.contribution <= 0
            ? stop('Tidak layak', 'Kontribusi blended ≤ 0.')
            : hold('Pakai sebagai target akun', 'Untuk campaign satu produk, pakai Max CPA produk — bukan blended.'),
        assumptions: [
          'Mix memakai proporsi yang kamu isi, bukan mix aktual 30 hari.',
          ...unitAssumptions(ctx),
        ],
      };
    },
  },
  {
    id: 'breakeven',
    title: 'Break-even ROAS & CPA',
    group: 'Dasar',
    question: 'Di angka berapa saya tidak untung dan tidak rugi?',
    fields: [
      { key: 'price', label: 'Harga jual', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'cogs', label: 'COGS', default: 0, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'feePct', label: 'Fee', default: 0.7, min: 0, max: 10, step: 0.1, suffix: '%' },
      { key: 'refundPct', label: 'Refund', default: 2, min: 0, max: 20, step: 0.1, suffix: '%' },
    ],
    compute: (v, ctx) => {
      const econ = unitEconomics({
        price: num(v.price),
        cogs: num(v.cogs),
        shipping: 0,
        feePct: pct(v.feePct),
        refundPct: pct(v.refundPct),
        taxMode: 'none',
        taxPct: 0,
        bufferPct: 0,
      });
      return {
        outputs: [
          { label: 'Kontribusi', value: econ.contribution, format: 'idr' },
          { label: 'BE ROAS', value: econ.beRoas ?? 0, format: 'roas' },
          { label: 'BE CPA', value: econ.beCpa, format: 'idr' },
          { label: 'Margin', value: econ.marginPct, format: 'pct' },
        ],
        decision:
          econ.contribution <= 0
            ? stop('Rugi di semua ROAS', 'Kontribusi ≤ 0 — tidak ada ROAS yang menyelamatkan.')
            : hold('Garis merah', `ROAS di bawah ${econ.beRoas?.toFixed(2)}x = rugi. Jangan dipakai sebagai target.`),
        assumptions: unitAssumptions(ctx),
      };
    },
  },
  {
    id: 'max_cpa',
    title: 'Max CPA & target profit',
    group: 'Dasar',
    question: 'Berapa CPA tertinggi yang masih menyisakan laba?',
    fields: [
      { key: 'price', label: 'Harga', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'cogs', label: 'COGS', default: 0, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'feePct', label: 'Fee', default: 0.7, min: 0, max: 10, step: 0.1, suffix: '%' },
      { key: 'refundPct', label: 'Refund', default: 2, min: 0, max: 20, step: 0.1, suffix: '%' },
      { key: 'bufferPct', label: 'Buffer', default: 20, min: 0, max: 90, step: 1, suffix: '%' },
      { key: 'targetProfit', label: 'Target laba / order', default: 25000, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v, ctx) => {
      const econ = unitEconomics({
        price: num(v.price),
        cogs: num(v.cogs),
        shipping: 0,
        feePct: pct(v.feePct),
        refundPct: pct(v.refundPct),
        taxMode: 'none',
        taxPct: 0,
        bufferPct: pct(v.bufferPct),
      });
      const targetCpa = econ.contribution - num(v.targetProfit);
      return {
        outputs: [
          { label: 'Kontribusi', value: econ.contribution, format: 'idr' },
          { label: 'Max CPA', value: econ.maxCpa, format: 'idr' },
          { label: 'Target CPA', value: targetCpa, format: 'idr' },
          { label: 'Laba di Max CPA', value: num(v.targetProfit), format: 'idr', hint: 'Sisa laba per order jika CPA tepat di Max CPA.' },
        ],
        decision:
          targetCpa <= 0
            ? stop('Target tidak realistis', 'Target laba per order lebih besar dari kontribusi.')
            : hold('Pasang sebagai batas', `Jangan biarkan CPA bank di atas Rp${Math.round(econ.maxCpa).toLocaleString('id-ID')}.`),
        assumptions: unitAssumptions(ctx),
      };
    },
  },
  {
    id: 'budget_to_results',
    title: 'Budget → hasil',
    group: 'Perencanaan',
    question: 'Dengan budget Rp X, berapa order, revenue, dan laba?',
    fields: [
      { key: 'spend', label: 'Budget', default: 2100000, min: 0, step: 50000, suffix: 'Rp' },
      { key: 'cpm', label: 'CPM', default: 45000, min: 1000, step: 1000, suffix: 'Rp' },
      { key: 'ctr', label: 'CTR outbound', default: 1.8, min: 0.1, max: 10, step: 0.1, suffix: '%' },
      { key: 'lpvRate', label: 'LPV rate', default: 70, min: 1, max: 100, step: 1, suffix: '%' },
      { key: 'cvr', label: 'CVR dari LPV', default: 3, min: 0.1, max: 20, step: 0.1, suffix: '%' },
      { key: 'aov', label: 'AOV', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi / order', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'maxCpa', label: 'Max CPA', default: 100414, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v, ctx) => {
      const result = budgetToResults({
        spend: num(v.spend),
        cpm: num(v.cpm),
        ctr: pct(v.ctr),
        lpvRate: pct(v.lpvRate),
        cvr: pct(v.cvr),
        aov: num(v.aov),
        contribution: num(v.contribution),
      });
      const decision =
        result.orders < 10
          ? insufficient(`${result.orders.toFixed(1)} order — butuh minimal 10 untuk menilai.`)
          : result.cpa !== null && result.cpa > num(v.maxCpa)
            ? stop('Jangan scale', `CPA Rp${Math.round(result.cpa).toLocaleString('id-ID')} di atas Max CPA.`)
            : ok('Layak diuji', `CPA Rp${Math.round(result.cpa ?? 0).toLocaleString('id-ID')} masih di bawah batas.`);
      return {
        outputs: [
          { label: 'Impressions', value: result.impressions, format: 'num' },
          { label: 'Klik', value: result.clicks, format: 'num' },
          { label: 'LPV', value: result.lpv, format: 'num' },
          { label: 'Order', value: result.orders, format: 'num', hint: 'Desimal untuk perhitungan; display dibulatkan.' },
          { label: 'Revenue', value: result.revenue, format: 'idr' },
          { label: 'CPA', value: result.cpa ?? 0, format: 'idr' },
          { label: 'ROAS', value: result.roas, format: 'roas' },
          { label: 'Profit setelah iklan', value: result.profit, format: 'idr' },
        ],
        decision,
        assumptions: [
          'Funnel linear: impression → klik → LPV → order. Kenyataan bisa lebih bengkok.',
          'CPM/CTR/CVR dianggap stabil selama periode; tidak memperhitungkan fatigue.',
          ...unitAssumptions(ctx),
        ],
      };
    },
  },
  {
    id: 'target_to_budget',
    title: 'Target sales → budget',
    group: 'Perencanaan',
    question: 'Berapa budget untuk 100 sales VIP?',
    fields: [
      { key: 'targetOrders', label: 'Target order', default: 100, min: 1, step: 1, suffix: 'order' },
      { key: 'cpm', label: 'CPM', default: 45000, min: 1000, step: 1000, suffix: 'Rp' },
      { key: 'ctr', label: 'CTR outbound', default: 1.8, min: 0.1, max: 10, step: 0.1, suffix: '%' },
      { key: 'lpvRate', label: 'LPV rate', default: 70, min: 1, max: 100, step: 1, suffix: '%' },
      { key: 'cvr', label: 'CVR dari LPV', default: 3, min: 0.1, max: 20, step: 0.1, suffix: '%' },
      { key: 'aov', label: 'AOV', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi / order', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v, ctx) => {
      const result = targetToBudget({
        targetOrders: num(v.targetOrders),
        cpm: num(v.cpm),
        ctr: pct(v.ctr),
        lpvRate: pct(v.lpvRate),
        cvr: pct(v.cvr),
        aov: num(v.aov),
        contribution: num(v.contribution),
      });
      return {
        outputs: [
          { label: 'Budget dibutuhkan', value: result.impressions > 0 ? (result.impressions / Math.max(1, num(v.cpm))) * 1000 : 0, format: 'idr' },
          { label: 'Impressions', value: result.impressions, format: 'num' },
          { label: 'Klik', value: result.clicks, format: 'num' },
          { label: 'LPV', value: result.lpv, format: 'num' },
          { label: 'Order', value: result.orders, format: 'num' },
          { label: 'Revenue', value: result.revenue, format: 'idr' },
          { label: 'CPA', value: result.cpa ?? 0, format: 'idr' },
          { label: 'Profit setelah iklan', value: result.profit, format: 'idr' },
        ],
        decision:
          result.profit < 0
            ? stop('Target tidak layak', 'Dengan asumsi ini, revenue tidak menutup budget iklan.')
            : hold('Cek kas & kapasitas', 'Pastikan cashflow dan stok cukup sebelum menaikkan budget.'),
        assumptions: [
          'Target dihitung dari CVR dan LPV; bukan janji hasil.',
          'Tampilkan rentang pesimis/base/optimis sebelum eksekusi.',
          ...unitAssumptions(ctx),
        ],
      };
    },
  },
  {
    id: 'scale',
    title: 'Scale simulator',
    group: 'Skala',
    question: 'Kalau budget dinaikkan 2x, apakah laba naik?',
    fields: [
      { key: 'currentBudget', label: 'Budget sekarang', default: 150000, min: 1000, step: 10000, suffix: 'Rp' },
      { key: 'newBudget', label: 'Budget baru', default: 300000, min: 1000, step: 10000, suffix: 'Rp' },
      { key: 'cpm', label: 'CPM', default: 45000, min: 1000, step: 1000, suffix: 'Rp' },
      { key: 'ctr', label: 'CTR outbound', default: 1.8, min: 0.1, max: 10, step: 0.1, suffix: '%' },
      { key: 'lpvRate', label: 'LPV rate', default: 70, min: 1, max: 100, step: 1, suffix: '%' },
      { key: 'cvr', label: 'CVR dari LPV', default: 3, min: 0.1, max: 20, step: 0.1, suffix: '%' },
      { key: 'aov', label: 'AOV', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi / order', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'decayCpm', label: 'CPM naik / 2x', default: 15, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'decayCtr', label: 'CTR turun / 2x', default: 5, min: 0, max: 90, step: 1, suffix: '%' },
      { key: 'decayCvr', label: 'CVR turun / 2x', default: 10, min: 0, max: 90, step: 1, suffix: '%' },
    ],
    compute: (v, ctx) => {
      const current = budgetToResults({
        spend: num(v.currentBudget),
        cpm: num(v.cpm),
        ctr: pct(v.ctr),
        lpvRate: pct(v.lpvRate),
        cvr: pct(v.cvr),
        aov: num(v.aov),
        contribution: num(v.contribution),
      });
      const scaled = scaleSimulator({
        currentBudget: num(v.currentBudget),
        newBudget: num(v.newBudget),
        cpm: num(v.cpm),
        ctr: pct(v.ctr),
        lpvRate: pct(v.lpvRate),
        cvr: pct(v.cvr),
        aov: num(v.aov),
        contribution: num(v.contribution),
        decayCpm: pct(v.decayCpm),
        decayCtr: pct(v.decayCtr),
        decayCvr: pct(v.decayCvr),
      });
      const delta = scaled.result.profit - current.profit;
      return {
        outputs: [
          { label: 'Multiplier', value: scaled.multiplier, format: 'text' },
          { label: 'CPM baru', value: scaled.cpm, format: 'idr' },
          { label: 'CTR baru', value: scaled.ctr, format: 'pct' },
          { label: 'CVR baru', value: scaled.cvr, format: 'pct' },
          { label: 'Order', value: scaled.result.orders, format: 'num' },
          { label: 'Revenue', value: scaled.result.revenue, format: 'idr' },
          { label: 'CPA', value: scaled.result.cpa ?? 0, format: 'idr' },
          { label: 'ROAS', value: scaled.result.roas, format: 'roas' },
          { label: 'Delta profit', value: delta, format: 'idr' },
        ],
        decision:
          delta <= 0
            ? stop('Jangan scale', 'Dengan asumsi degradasi ini, laba tidak naik.')
            : hold('Scale bertahap', `Laba naik Rp${Math.round(delta).toLocaleString('id-ID')}, tapi ini skenario — uji +20–30%, bukan 2x.`),
        assumptions: [
          'Degradasi CPM/CTR/CVR adalah asumsi, bukan prediksi.',
          'Frequency naik seiring budget; pantau saturasi.',
          ...unitAssumptions(ctx),
        ],
      };
    },
  },
  {
    id: 'creative',
    title: 'Creative diagnostics',
    group: 'Diagnosa',
    question: 'Kreatif ini harus di-scale, diperbaiki, atau dimatikan?',
    fields: [
      { key: 'ctr', label: 'CTR outbound', default: 1.8, min: 0, max: 20, step: 0.1, suffix: '%' },
      { key: 'cvr', label: 'CVR dari LPV', default: 3, min: 0, max: 30, step: 0.1, suffix: '%' },
      { key: 'spend', label: 'Spend', default: 500000, min: 0, step: 10000, suffix: 'Rp' },
      { key: 'orders', label: 'Order bank', default: 12, min: 0, step: 1, suffix: 'order' },
      { key: 'frequency', label: 'Frequency', default: 2.4, min: 0, max: 10, step: 0.1, suffix: 'x' },
      { key: 'hookRate', label: 'Hook rate', default: 30, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'holdRate', label: 'Hold rate', default: 20, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'medianCtr', label: 'Median CTR akun', default: 1.5, min: 0, max: 20, step: 0.1, suffix: '%' },
      { key: 'medianCvr', label: 'Median CVR akun', default: 3, min: 0, max: 30, step: 0.1, suffix: '%' },
      { key: 'maxCpa', label: 'Max CPA', default: 100414, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = creativeDiagnosis({
        ctr: pct(v.ctr),
        cvr: pct(v.cvr),
        spend: num(v.spend),
        orders: num(v.orders),
        frequency: num(v.frequency),
        hookRate: pct(v.hookRate),
        holdRate: pct(v.holdRate),
        medianCtr: pct(v.medianCtr),
        medianCvr: pct(v.medianCvr),
        maxCpa: num(v.maxCpa),
      });
      const labels: Record<string, string> = {
        winner: 'Winner',
        offer: 'Offer / LP',
        hook: 'Hook lemah',
        kill: 'Tidak cocok',
      };
      return {
        outputs: [
          { label: 'Kuadran', value: labels[result.quadrant], format: 'text' },
          { label: 'Verdict', value: result.verdict, format: 'text' },
          { label: 'Fatigue score', value: result.fatigue, format: 'pct' },
          { label: 'Alasan', value: result.reasons.join(' ') || 'Belum ada sinyal kuat.', format: 'text' },
        ],
        decision:
          result.verdict === 'kill'
            ? stop('Hentikan / ganti', 'Sinyal fatigue atau performa di bawah median.')
            : result.verdict === 'scale'
              ? ok('Scale + iterasi', 'CTR dan CVR di atas median, fatigue masih rendah.')
              : result.verdict === 'insufficient'
                ? insufficient('Spend masih di bawah 1x Max CPA — jangan vonis dulu.')
                : hold('Pantau / perbaiki', 'Belum cukup kuat untuk kill atau scale.'),
        assumptions: ['Verdict memakai median akun, bukan benchmark industri.', 'Sample minimum: 5.000 impressions / 300 outbound clicks / 25 LPV.'],
      };
    },
  },
  {
    id: 'ltv',
    title: 'LTV / CAC / payback',
    group: 'Diagnosa',
    question: 'Berapa nilai satu pembeli, dan berapa CAC yang boleh?',
    fields: [
      { key: 'cac', label: 'CAC', default: 80000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'aov', label: 'Revenue order pertama', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi order pertama', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'upgradePct', label: 'Chance upgrade', default: 15, min: 0, max: 100, step: 1, suffix: '%' },
      { key: 'upgradePrice', label: 'Harga upgrade', default: 80000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'upgradeContribution', label: 'Kontribusi upgrade', default: 77840, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = ltvCac({
        cac: num(v.cac),
        aov: num(v.aov),
        contribution: num(v.contribution),
        upgradePct: pct(v.upgradePct),
        upgradePrice: num(v.upgradePrice),
        upgradeContribution: num(v.upgradeContribution),
      });
      return {
        outputs: [
          { label: 'LTV revenue', value: result.ltvRevenue, format: 'idr' },
          { label: 'LTV kontribusi', value: result.ltvContribution, format: 'idr' },
          { label: 'LTV : CAC', value: result.ltvCac ?? 0, format: 'text' },
          { label: 'Payback', value: result.paybackDays === null ? '—' : `${result.paybackDays} hari`, format: 'text' },
        ],
        decision:
          result.ltvCac === null
            ? insufficient('CAC 0 / tidak diisi — rasio tidak bisa dihitung.')
            : result.ltvCac < 2
              ? hold('Hati-hati', 'LTV:CAC < 2. Jangan agresif menaikkan CAC.')
              : ok('Sehat', 'LTV:CAC ≥ 2. Tetap pantau refund dan payback.'),
        assumptions: [
          'Window LTV 60–90 hari, bukan 12 bulan.',
          'Upgrade hardcover +Rp120rb tidak dimasukkan karena bisa rugi (COGS > incremental price).',
        ],
      };
    },
  },
  {
    id: 'reconciliation',
    title: 'Rekonsiliasi Meta vs bank',
    group: 'Uang',
    question: 'Apakah angka Meta bisa dipercaya?',
    fields: [
      { key: 'spend', label: 'Spend', default: 2100000, min: 0, step: 50000, suffix: 'Rp' },
      { key: 'metaOrders', label: 'Order Meta', default: 24, min: 0, step: 1, suffix: 'order' },
      { key: 'metaRevenue', label: 'Revenue Meta', default: 3096000, min: 0, step: 50000, suffix: 'Rp' },
      { key: 'bankOrders', label: 'Order bank', default: 18, min: 0, step: 1, suffix: 'order' },
      { key: 'bankRevenue', label: 'Revenue bank', default: 2322000, min: 0, step: 50000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = reconcile({
        spend: num(v.spend),
        metaOrders: num(v.metaOrders),
        metaRevenue: num(v.metaRevenue),
        bankOrders: num(v.bankOrders),
        bankRevenue: num(v.bankRevenue),
      });
      return {
        outputs: [
          { label: 'Gap order', value: result.gapOrdersPct === null ? '—' : `${(result.gapOrdersPct * 100).toFixed(1)}%`, format: 'text' },
          { label: 'Gap revenue', value: result.gapRevenuePct === null ? '—' : `${(result.gapRevenuePct * 100).toFixed(1)}%`, format: 'text' },
          { label: 'CPA bank', value: result.cpaBank ?? 0, format: 'idr' },
          { label: 'MER', value: result.mer, format: 'roas' },
          { label: 'Calibration', value: result.calibration === null ? '—' : result.calibration.toFixed(2), format: 'text' },
        ],
        decision:
          result.gapOrdersPct !== null && result.gapOrdersPct > 0.2
            ? stop('Perbaiki tracking dulu', 'Meta overclaim >20%. Jangan scale dari ROAS platform.')
            : hold('Pakai angka bank', 'CPA keputusan = spend ÷ order bank. Calibration hanya untuk forecast.'),
        assumptions: ['Gap bisa berasal dari atribusi view-through, order WA, refund, atau pixel double-fire.'],
      };
    },
  },
  {
    id: 'incrementality',
    title: 'Atribusi & incrementality',
    group: 'Diagnosa',
    question: 'Berapa penjualan yang benar-benar disebabkan iklan?',
    fields: [
      { key: 'testOrders', label: 'Order test', default: 100, min: 0, step: 1, suffix: 'order' },
      { key: 'controlOrders', label: 'Order control', default: 80, min: 0, step: 1, suffix: 'order' },
      { key: 'testPopulation', label: 'Populasi test', default: 50000, min: 1, step: 1000, suffix: 'orang' },
      { key: 'controlPopulation', label: 'Populasi control', default: 50000, min: 1, step: 1000, suffix: 'orang' },
      { key: 'spend', label: 'Incremental spend', default: 2000000, min: 0, step: 50000, suffix: 'Rp' },
      { key: 'aov', label: 'AOV', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi / order', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = incrementality({
        testOrders: num(v.testOrders),
        controlOrders: num(v.controlOrders),
        testPopulation: num(v.testPopulation),
        controlPopulation: num(v.controlPopulation),
        incrementalSpend: num(v.spend),
        aov: num(v.aov),
        contribution: num(v.contribution),
      });
      return {
        outputs: [
          { label: 'Incremental order', value: result.incrementalOrders, format: 'num' },
          { label: 'Incremental revenue', value: result.incrementalRevenue, format: 'idr' },
          { label: 'iROAS', value: result.iRoas, format: 'roas' },
          { label: 'Incremental profit', value: result.incrementalProfit, format: 'idr' },
        ],
        decision:
          result.iRoas <= 0
            ? stop('Tidak incremental', 'Tidak ada kenaikan order di luar control.')
            : result.incrementalProfit <= 0
              ? hold('Belum profitable', 'iROAS positif tapi incremental profit masih negatif.')
              : ok('Iklan incremental', 'Incremental profit positif; tetap cek holdout berikutnya.'),
        assumptions: ['Butuh holdout/geo test yang valid. Tanpa itu, angka ini hanya skenario.'],
      };
    },
  },
  {
    id: 'cashflow',
    title: 'Cashflow / cetak hardcover',
    group: 'Uang',
    question: 'Berapa batch hardcover yang aman secara kas?',
    fields: [
      { key: 'batch', label: 'Batch cetak', default: 50, min: 0, step: 1, suffix: 'pcs' },
      { key: 'cogs', label: 'COGS / pcs', default: 140000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'price', label: 'Harga jual', default: 249000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'preorders', label: 'Preorder', default: 20, min: 0, step: 1, suffix: 'pcs' },
      { key: 'dailyOrders', label: 'Order / hari', default: 2, min: 0, step: 0.1, suffix: 'order' },
      { key: 'cash', label: 'Kas tersedia', default: 5000000, min: 0, step: 100000, suffix: 'Rp' },
      { key: 'dailyAdSpend', label: 'Ad spend / hari', default: 150000, min: 0, step: 10000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = cashflowPrint({
        batchSize: num(v.batch),
        cogs: num(v.cogs),
        price: num(v.price),
        preorders: num(v.preorders),
        dailyOrders: num(v.dailyOrders),
        cashAvailable: num(v.cash),
        dailyAdSpend: num(v.dailyAdSpend),
      });
      return {
        outputs: [
          { label: 'Kas keluar', value: result.cashOut, format: 'idr' },
          { label: 'Kas preorder', value: result.preorderCashIn, format: 'idr' },
          { label: 'Net cash', value: result.netCash, format: 'idr' },
          { label: 'Hari terjual', value: result.daysToSell === null ? '—' : `${result.daysToSell.toFixed(1)} hari`, format: 'text' },
          { label: 'Runway kas', value: result.runwayDays === null ? '—' : `${result.runwayDays.toFixed(0)} hari`, format: 'text' },
          { label: 'Batch disarankan', value: result.recommendedBatch, format: 'num' },
        ],
        decision:
          result.netCash < 0
            ? stop('Tunda PO', 'Kas preorder belum menutup biaya cetak. Kurangi batch atau kumpulkan preorder.')
            : result.daysToSell !== null && result.daysToSell > 30
              ? hold('Batch terlalu besar', 'Lebih dari 30 hari untuk terjual; risiko stok dan kas.')
              : ok('Batch aman', 'Kas dan run-rate masih dalam batas.'),
        assumptions: ['COGS dan ongkir hardcover masih asumsi; validasi invoice.', 'Iklan dibayar harian, cetak dibayar di muka.'],
      };
    },
  },
  {
    id: 'pacing',
    title: 'Budget pacing',
    group: 'Perencanaan',
    question: 'Apakah spend bulan ini sesuai rencana?',
    fields: [
      { key: 'dailyBudget', label: 'Budget / hari', default: 150000, min: 0, step: 10000, suffix: 'Rp' },
      { key: 'daysElapsed', label: 'Hari berjalan', default: 15, min: 1, step: 1, suffix: 'hari' },
      { key: 'daysInMonth', label: 'Hari dalam bulan', default: 30, min: 1, step: 1, suffix: 'hari' },
      { key: 'actualSpend', label: 'Spend aktual', default: 2100000, min: 0, step: 50000, suffix: 'Rp' },
      { key: 'monthlyBudget', label: 'Budget bulanan', default: 4500000, min: 0, step: 100000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const result = budgetPacing({
        dailyBudget: num(v.dailyBudget),
        daysElapsed: num(v.daysElapsed),
        daysInMonth: num(v.daysInMonth),
        actualSpend: num(v.actualSpend),
        monthlyBudget: num(v.monthlyBudget),
      });
      return {
        outputs: [
          { label: 'Rencana sampai hari ini', value: result.plannedToDate, format: 'idr' },
          { label: 'Pacing', value: result.pacing, format: 'pct' },
          { label: 'Proyeksi bulan ini', value: result.projectedMonthSpend, format: 'idr' },
          { label: 'Sisa budget', value: result.remainingBudget, format: 'idr' },
        ],
        decision:
          result.pacing > 1.1
            ? stop('Terlalu cepat', 'Spend >110% dari rencana. Turunkan atau hentikan yang boncos.')
            : result.pacing < 0.9
              ? hold('Terlalu lambat', 'Spend <90% dari rencana. Cek delivery/learning phase.')
              : ok('Sesuai jalur', 'Pacing 90–110%; pantau CPA bank.'),
        assumptions: ['Hari ini belum selesai; proyeksi memakai run-rate.'],
      };
    },
  },
  {
    id: 'scenario',
    title: 'Scenario compare',
    group: 'Skala',
    question: 'Mana skenario terbaik: pesimis, base, optimis?',
    fields: [
      { key: 'budgetA', label: 'Budget A', default: 150000, min: 0, step: 10000, suffix: 'Rp' },
      { key: 'budgetB', label: 'Budget B', default: 300000, min: 0, step: 10000, suffix: 'Rp' },
      { key: 'budgetC', label: 'Budget C', default: 450000, min: 0, step: 10000, suffix: 'Rp' },
      { key: 'cpm', label: 'CPM', default: 45000, min: 1000, step: 1000, suffix: 'Rp' },
      { key: 'ctr', label: 'CTR', default: 1.8, min: 0.1, max: 10, step: 0.1, suffix: '%' },
      { key: 'lpvRate', label: 'LPV rate', default: 70, min: 1, max: 100, step: 1, suffix: '%' },
      { key: 'cvr', label: 'CVR', default: 3, min: 0.1, max: 20, step: 0.1, suffix: '%' },
      { key: 'aov', label: 'AOV', default: 129000, min: 0, step: 1000, suffix: 'Rp' },
      { key: 'contribution', label: 'Kontribusi', default: 125517, min: 0, step: 1000, suffix: 'Rp' },
    ],
    compute: (v) => {
      const base = {
        cpm: num(v.cpm),
        ctr: pct(v.ctr),
        lpvRate: pct(v.lpvRate),
        cvr: pct(v.cvr),
        aov: num(v.aov),
        contribution: num(v.contribution),
      };
      const results = scenarioCompare([
        { name: 'A', input: { ...base, budget: num(v.budgetA) } },
        { name: 'B', input: { ...base, budget: num(v.budgetB) } },
        { name: 'C', input: { ...base, budget: num(v.budgetC) } },
      ]);
      const best = results.reduce((acc, item) => (item.result.profit > acc.result.profit ? item : acc), results[0]);
      const outputs: CalcOutput[] = [];
      results.forEach((item) => {
        outputs.push({
          label: `${item.name} · ${Math.round(item.result.orders)} order`,
          value: `Profit ${Math.round(item.result.profit).toLocaleString('id-ID')} · ROAS ${item.result.roas.toFixed(2)}x`,
          format: 'text',
        });
      });
      return {
        outputs,
        decision:
          best.result.profit > 0
            ? hold(`Skenario ${best.name} paling tinggi`, 'Pilih profit tertinggi dengan CPA di bawah Max CPA — bukan ROAS tertinggi.')
            : stop('Semua skenario rugi', 'Turunkan CPM atau perbaiki CVR sebelum menaikkan budget.'),
        assumptions: ['Semua skenario memakai CPM/CTR/CVR yang sama; bedanya hanya budget.', 'Tampilkan skenario pesimis secara eksplisit.'],
      };
    },
  },
];

export function getCalculator(id: string): CalcDef | undefined {
  return CALCULATOR_DEFS.find((item) => item.id === id);
}

export function defaultValues(def: CalcDef): Record<string, number> {
  return Object.fromEntries(def.fields.map((field) => [field.key, field.default]));
}

export function buildContext(products: ProductEconomics[], bufferPct = 0.2): CalcContext {
  return { products, bufferPct };
}

export function calcPromo(
  product: ProductEconomics,
  discountPct: number,
  bufferPct: number
) {
  return promoBreakEven(product, pct(discountPct), bufferPct);
}
