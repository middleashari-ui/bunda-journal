import type { DecisionStatus, ProductEconomics, TaxMode } from '../types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const finite = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

export interface UnitEconomicsInput {
  price: number;
  cogs: number;
  shipping: number;
  feePct: number;
  refundPct: number;
  taxMode: TaxMode;
  taxPct: number;
  bufferPct: number;
}

export interface UnitEconomicsResult {
  netBase: number;
  contribution: number;
  marginPct: number;
  beRoas: number | null;
  beCpa: number;
  maxCpa: number;
}

export function unitEconomics(input: UnitEconomicsInput): UnitEconomicsResult {
  const price = Math.max(0, finite(input.price));
  const cogs = Math.max(0, finite(input.cogs));
  const shipping = Math.max(0, finite(input.shipping));
  const feePct = clamp(finite(input.feePct), 0, 0.2);
  const refundPct = clamp(finite(input.refundPct), 0, 1);
  const taxPct = clamp(finite(input.taxPct), 0, 0.5);
  const bufferPct = clamp(finite(input.bufferPct), 0, 0.95);
  const netBase =
    input.taxMode === 'inclusive' && taxPct > 0 ? price / (1 + taxPct) : price;
  const contribution = netBase * (1 - feePct - refundPct) - cogs - shipping;
  const marginPct = price > 0 ? contribution / price : 0;
  return {
    netBase,
    contribution,
    marginPct,
    beRoas: contribution > 0 ? price / contribution : null,
    beCpa: contribution,
    maxCpa: contribution * (1 - bufferPct),
  };
}

export function productEconomics(
  product: ProductEconomics,
  bufferPct = 0.2
): UnitEconomicsResult {
  return unitEconomics({
    price: product.price,
    cogs: product.cogs,
    shipping: product.shipping,
    feePct: product.feePct,
    refundPct: product.refundPct,
    taxMode: product.taxMode,
    taxPct: product.taxPct,
    bufferPct,
  });
}

export interface BlendedResult {
  aov: number;
  contribution: number;
  marginPct: number;
  beRoas: number | null;
  maxCpa: number;
}

export function blendedEconomics(
  products: ProductEconomics[],
  mix: Record<string, number>,
  bufferPct = 0.2
): BlendedResult {
  const entries = products
    .map((product) => ({
      product,
      weight: Math.max(0, finite(mix[product.id])),
      econ: productEconomics(product, bufferPct),
    }))
    .filter((entry) => entry.weight > 0);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return { aov: 0, contribution: 0, marginPct: 0, beRoas: null, maxCpa: 0 };
  }
  const aov = entries.reduce((sum, e) => sum + (e.weight / totalWeight) * e.product.price, 0);
  const contribution = entries.reduce(
    (sum, e) => sum + (e.weight / totalWeight) * e.econ.contribution,
    0
  );
  return {
    aov,
    contribution,
    marginPct: aov > 0 ? contribution / aov : 0,
    beRoas: contribution > 0 ? aov / contribution : null,
    maxCpa: contribution * (1 - clamp(bufferPct, 0, 0.95)),
  };
}

export interface FunnelInput {
  spend: number;
  cpm: number;
  ctr: number;
  lpvRate: number;
  cvr: number;
  aov: number;
  contribution: number;
}

export interface FunnelResult {
  impressions: number;
  clicks: number;
  lpv: number;
  orders: number;
  revenue: number;
  cpa: number | null;
  roas: number;
  profit: number;
}

export function budgetToResults(input: FunnelInput): FunnelResult {
  const spend = Math.max(0, finite(input.spend));
  const cpm = Math.max(0.01, finite(input.cpm));
  const ctr = clamp(finite(input.ctr), 0, 1);
  const lpvRate = clamp(finite(input.lpvRate), 0, 1);
  const cvr = clamp(finite(input.cvr), 0, 1);
  const aov = Math.max(0, finite(input.aov));
  const contribution = finite(input.contribution);
  const impressions = (spend / cpm) * 1000;
  const clicks = impressions * ctr;
  const lpv = clicks * lpvRate;
  const orders = lpv * cvr;
  const revenue = orders * aov;
  return {
    impressions,
    clicks,
    lpv,
    orders,
    revenue,
    cpa: orders > 0 ? spend / orders : null,
    roas: spend > 0 ? revenue / spend : 0,
    profit: orders * contribution - spend,
  };
}

export interface TargetInput {
  targetOrders: number;
  cpm: number;
  ctr: number;
  lpvRate: number;
  cvr: number;
  aov: number;
  contribution: number;
}

export interface TargetResult extends FunnelResult {
  targetOrders: number;
}

export function targetToBudget(input: TargetInput): TargetResult {
  const targetOrders = Math.max(0, finite(input.targetOrders));
  const cvr = clamp(finite(input.cvr), 0, 1);
  const lpvRate = clamp(finite(input.lpvRate), 0, 1);
  const ctr = clamp(finite(input.ctr), 0, 1);
  const cpm = Math.max(0.01, finite(input.cpm));
  if (cvr <= 0 || lpvRate <= 0 || ctr <= 0 || targetOrders <= 0) {
    return {
      targetOrders,
      impressions: 0,
      clicks: 0,
      lpv: 0,
      orders: 0,
      revenue: 0,
      cpa: null,
      roas: 0,
      profit: 0,
    };
  }
  const lpv = targetOrders / cvr;
  const clicks = lpv / lpvRate;
  const impressions = clicks / ctr;
  const spend = (impressions / 1000) * cpm;
  const result = budgetToResults({
    spend,
    cpm,
    ctr,
    lpvRate,
    cvr,
    aov: input.aov,
    contribution: input.contribution,
  });
  return { ...result, targetOrders };
}

export interface ScaleInput {
  currentBudget: number;
  newBudget: number;
  cpm: number;
  ctr: number;
  lpvRate: number;
  cvr: number;
  aov: number;
  contribution: number;
  decayCpm: number;
  decayCtr: number;
  decayCvr: number;
}

export interface ScaleResult {
  multiplier: number;
  cpm: number;
  ctr: number;
  cvr: number;
  result: FunnelResult;
}

export function scaleSimulator(input: ScaleInput): ScaleResult {
  const currentBudget = Math.max(0.01, finite(input.currentBudget));
  const newBudget = Math.max(0, finite(input.newBudget));
  const multiplier = newBudget / currentBudget;
  const exponent = Math.log2(Math.max(0.0001, multiplier));
  const cpm = Math.max(0.01, finite(input.cpm)) * Math.pow(1 + clamp(finite(input.decayCpm), 0, 1), exponent);
  const ctr = clamp(
    clamp(finite(input.ctr), 0, 1) * Math.pow(1 - clamp(finite(input.decayCtr), 0, 0.95), exponent),
    0,
    1
  );
  const cvr = clamp(
    clamp(finite(input.cvr), 0, 1) * Math.pow(1 - clamp(finite(input.decayCvr), 0, 0.95), exponent),
    0,
    1
  );
  return {
    multiplier,
    cpm,
    ctr,
    cvr,
    result: budgetToResults({
      spend: newBudget,
      cpm,
      ctr,
      lpvRate: input.lpvRate,
      cvr,
      aov: input.aov,
      contribution: input.contribution,
    }),
  };
}

export interface CreativeInput {
  ctr: number;
  cvr: number;
  spend: number;
  orders: number;
  frequency: number;
  hookRate: number;
  holdRate: number;
  medianCtr: number;
  medianCvr: number;
  maxCpa: number;
}

export interface CreativeResult {
  quadrant: 'winner' | 'offer' | 'hook' | 'kill';
  verdict: 'scale' | 'watch' | 'kill' | 'insufficient';
  fatigue: number;
  reasons: string[];
}

export function creativeDiagnosis(input: CreativeInput): CreativeResult {
  const ctr = clamp(finite(input.ctr), 0, 1);
  const cvr = clamp(finite(input.cvr), 0, 1);
  const medianCtr = clamp(finite(input.medianCtr), 0, 1);
  const medianCvr = clamp(finite(input.medianCvr), 0, 1);
  const highCtr = ctr >= medianCtr;
  const highCvr = cvr >= medianCvr;
  const quadrant: CreativeResult['quadrant'] = highCtr
    ? highCvr
      ? 'winner'
      : 'offer'
    : highCvr
      ? 'hook'
      : 'kill';
  const ctrDrop = medianCtr > 0 ? Math.max(0, (medianCtr - ctr) / medianCtr) : 0;
  const cpa = input.orders > 0 ? input.spend / input.orders : null;
  const cpaRise = cpa !== null && input.maxCpa > 0 ? Math.max(0, (cpa - input.maxCpa) / input.maxCpa) : 0;
  const fatigue = clamp(
    0.4 * Math.min(finite(input.frequency) / 3, 1) +
      0.3 * Math.min(ctrDrop / 0.3, 1) +
      0.3 * Math.min(cpaRise / 0.25, 1),
    0,
    1
  );
  const reasons: string[] = [];
  if (input.spend < input.maxCpa) {
    reasons.push('Spend masih di bawah 1x Max CPA; sampel belum cukup.');
  }
  if (input.frequency > 3) reasons.push('Frequency di atas 3 — risiko saturasi.');
  if (ctrDrop > 0.3) reasons.push('CTR turun >30% vs median akun.');
  if (cpa !== null && cpaRise > 0.25) reasons.push('CPA di atas Max CPA >25%.');
  if (highCtr && !highCvr) reasons.push('CTR tinggi tapi CVR rendah — cek offer/landing page.');
  if (!highCtr && highCvr) reasons.push('CVR baik tapi CTR rendah — ganti hook/thumbnail.');
  if (!highCtr && !highCvr) reasons.push('CTR dan CVR di bawah median — kandidat kill.');
  let verdict: CreativeResult['verdict'] = 'watch';
  if (input.spend < input.maxCpa) verdict = 'insufficient';
  else if (input.orders === 0 && input.spend > input.maxCpa * 2) verdict = 'kill';
  else if (cpa !== null && cpa > input.maxCpa * 1.5 && input.spend > input.maxCpa * 2) verdict = 'kill';
  else if (input.frequency >= 3) verdict = fatigue > 0.75 ? 'kill' : 'watch';
  else if (quadrant === 'winner' && fatigue < 0.75) verdict = 'scale';
  else if (quadrant === 'kill' && cpa !== null && cpa > input.maxCpa) verdict = 'kill';
  else if (fatigue > 0.75) verdict = 'kill';
  return { quadrant, verdict, fatigue, reasons };
}

export interface LtvInput {
  cac: number;
  aov: number;
  contribution: number;
  upgradePct: number;
  upgradePrice: number;
  upgradeContribution: number;
}

export interface LtvResult {
  ltvRevenue: number;
  ltvContribution: number;
  ltvCac: number | null;
  paybackDays: number | null;
}

export function ltvCac(input: LtvInput): LtvResult {
  const upgradePct = clamp(finite(input.upgradePct), 0, 1);
  const ltvRevenue = Math.max(0, finite(input.aov)) + upgradePct * Math.max(0, finite(input.upgradePrice));
  const ltvContribution =
    finite(input.contribution) + upgradePct * finite(input.upgradeContribution);
  const cac = Math.max(0, finite(input.cac));
  return {
    ltvRevenue,
    ltvContribution,
    ltvCac: cac > 0 ? ltvContribution / cac : null,
    paybackDays:
      cac <= 0
        ? 0
        : finite(input.contribution) >= cac
          ? 0
          : upgradePct > 0
            ? 30
            : null,
  };
}

export interface ReconciliationInput {
  spend: number;
  metaOrders: number;
  metaRevenue: number;
  bankOrders: number;
  bankRevenue: number;
}

export interface ReconciliationResult {
  gapOrdersPct: number | null;
  gapRevenuePct: number | null;
  cpaBank: number | null;
  mer: number;
  calibration: number | null;
}

export function reconcile(input: ReconciliationInput): ReconciliationResult {
  const bankOrders = Math.max(0, finite(input.bankOrders));
  const bankRevenue = Math.max(0, finite(input.bankRevenue));
  const metaOrders = Math.max(0, finite(input.metaOrders));
  const metaRevenue = Math.max(0, finite(input.metaRevenue));
  const spend = Math.max(0, finite(input.spend));
  return {
    gapOrdersPct: bankOrders > 0 ? (metaOrders - bankOrders) / bankOrders : null,
    gapRevenuePct: bankRevenue > 0 ? (metaRevenue - bankRevenue) / bankRevenue : null,
    cpaBank: bankOrders > 0 ? spend / bankOrders : null,
    mer: spend > 0 ? bankRevenue / spend : 0,
    calibration: metaOrders > 0 ? bankOrders / metaOrders : null,
  };
}

export interface IncrementalityInput {
  testOrders: number;
  controlOrders: number;
  testPopulation: number;
  controlPopulation: number;
  incrementalSpend: number;
  aov: number;
  contribution: number;
}

export interface IncrementalityResult {
  incrementalOrders: number;
  incrementalRevenue: number;
  iRoas: number;
  incrementalProfit: number;
}

export function incrementality(input: IncrementalityInput): IncrementalityResult {
  const controlPop = Math.max(0, finite(input.controlPopulation));
  const controlOrders = Math.max(0, finite(input.controlOrders));
  const testOrders = Math.max(0, finite(input.testOrders));
  const scaledControl = controlPop > 0 ? controlOrders * (Math.max(0, finite(input.testPopulation)) / controlPop) : 0;
  const incrementalOrders = testOrders - scaledControl;
  const incrementalRevenue = incrementalOrders * Math.max(0, finite(input.aov));
  const spend = Math.max(0, finite(input.incrementalSpend));
  return {
    incrementalOrders,
    incrementalRevenue,
    iRoas: spend > 0 ? incrementalRevenue / spend : 0,
    incrementalProfit: incrementalOrders * finite(input.contribution) - spend,
  };
}

export interface CashflowInput {
  batchSize: number;
  cogs: number;
  price: number;
  preorders: number;
  dailyOrders: number;
  cashAvailable: number;
  dailyAdSpend: number;
}

export interface CashflowResult {
  cashOut: number;
  preorderCashIn: number;
  netCash: number;
  daysToSell: number | null;
  runwayDays: number | null;
  recommendedBatch: number;
}

export function cashflowPrint(input: CashflowInput): CashflowResult {
  const batchSize = Math.max(0, finite(input.batchSize));
  const cogs = Math.max(0, finite(input.cogs));
  const cashOut = batchSize * cogs;
  const preorderCashIn = Math.max(0, finite(input.preorders)) * Math.max(0, finite(input.price));
  const dailyOrders = Math.max(0, finite(input.dailyOrders));
  const cashAvailable = Math.max(0, finite(input.cashAvailable));
  const dailyAdSpend = Math.max(0, finite(input.dailyAdSpend));
  const maxByCash = cogs > 0 ? Math.floor(cashAvailable / cogs) : Infinity;
  const recommendedBatch = Math.max(
    0,
    Math.floor(Math.min(30 * dailyOrders * 1.2, Number.isFinite(maxByCash) ? maxByCash : 30 * dailyOrders * 1.2))
  );
  return {
    cashOut,
    preorderCashIn,
    netCash: preorderCashIn - cashOut,
    daysToSell: dailyOrders > 0 ? batchSize / dailyOrders : null,
    runwayDays: dailyAdSpend > 0 ? cashAvailable / dailyAdSpend : null,
    recommendedBatch,
  };
}

export interface PacingInput {
  dailyBudget: number;
  daysElapsed: number;
  daysInMonth: number;
  actualSpend: number;
  monthlyBudget: number;
}

export interface PacingResult {
  plannedToDate: number;
  pacing: number;
  projectedMonthSpend: number;
  remainingBudget: number;
}

export function budgetPacing(input: PacingInput): PacingResult {
  const dailyBudget = Math.max(0, finite(input.dailyBudget));
  const daysElapsed = Math.max(1, finite(input.daysElapsed));
  const daysInMonth = Math.max(daysElapsed, finite(input.daysInMonth));
  const actualSpend = Math.max(0, finite(input.actualSpend));
  const plannedToDate = dailyBudget * daysElapsed;
  return {
    plannedToDate,
    pacing: plannedToDate > 0 ? actualSpend / plannedToDate : 0,
    projectedMonthSpend: (actualSpend / daysElapsed) * daysInMonth,
    remainingBudget: Math.max(0, finite(input.monthlyBudget) - actualSpend),
  };
}

export interface ScenarioInput {
  budget: number;
  cpm: number;
  ctr: number;
  lpvRate: number;
  cvr: number;
  aov: number;
  contribution: number;
}

export function scenarioCompare(
  scenarios: { name: string; input: ScenarioInput }[]
): { name: string; result: FunnelResult }[] {
  return scenarios.map((scenario) => ({
    name: scenario.name,
    result: budgetToResults({ ...scenario.input, spend: scenario.input.budget }),
  }));
}

export function promoBreakEven(
  product: ProductEconomics,
  discountPct: number,
  bufferPct = 0.2
): { discountedPrice: number; econ: UnitEconomicsResult; deltaContribution: number } {
  const discount = clamp(finite(discountPct), 0, 0.95);
  const discountedPrice = product.price * (1 - discount);
  const base = productEconomics(product, bufferPct);
  const econ = unitEconomics({
    price: discountedPrice,
    cogs: product.cogs,
    shipping: product.shipping,
    feePct: product.feePct,
    refundPct: product.refundPct,
    taxMode: product.taxMode,
    taxPct: product.taxPct,
    bufferPct,
  });
  return { discountedPrice, econ, deltaContribution: econ.contribution - base.contribution };
}

export interface DecisionInput {
  orders: number;
  cpaBank: number | null;
  maxCpa: number;
  roasBank: number;
  beRoas: number | null;
  frequency: number;
  cpaAboveMaxDays?: number;
  minOrders?: number;
  spend?: number;
}

export interface DecisionResult {
  status: DecisionStatus;
  label: string;
  reason: string;
}

export function decide(input: DecisionInput): DecisionResult {
  const minOrders = input.minOrders ?? 10;
  const cpa = input.cpaBank;
  const spend = Math.max(0, finite(input.spend ?? 0));
  if (input.maxCpa <= 0) {
    return {
      status: 'stop',
      label: 'Hentikan',
      reason: 'Max CPA ≤ 0 — produk tidak layak diiklankan dengan biaya saat ini.',
    };
  }
  if (input.orders === 0 && spend > input.maxCpa * 2) {
    return {
      status: 'stop',
      label: 'Hentikan',
      reason: `Spend Rp${Math.round(spend).toLocaleString('id-ID')} (>2× Max CPA) tanpa satu order bank.`,
    };
  }
  if (input.orders < minOrders) {
    if (spend > input.maxCpa * 2 && cpa !== null && cpa > input.maxCpa) {
      return {
        status: 'stop',
        label: 'Hentikan',
        reason: `Spend Rp${Math.round(spend).toLocaleString('id-ID')} dan CPA Rp${Math.round(cpa).toLocaleString('id-ID')} di atas Max CPA, meski sampel masih kecil.`,
      };
    }
    return {
      status: 'insufficient',
      label: 'Belum cukup data',
      reason: `${input.orders} order — butuh minimal ${minOrders} untuk menilai.`,
    };
  }
  if (cpa === null) {
    return {
      status: 'insufficient',
      label: 'Belum cukup data',
      reason: 'Belum ada order bank; CPA tidak bisa dihitung.',
    };
  }
  if ((input.cpaAboveMaxDays ?? 0) >= 3 || cpa > input.maxCpa * 1.3) {
    return {
      status: 'stop',
      label: 'Hentikan',
      reason: `CPA Rp${Math.round(cpa).toLocaleString('id-ID')} di atas Max CPA Rp${Math.round(input.maxCpa).toLocaleString('id-ID')}.`,
    };
  }
  if (
    input.beRoas !== null &&
    input.roasBank >= input.beRoas * 1.2 &&
    cpa <= input.maxCpa &&
    input.frequency < 2.5
  ) {
    return {
      status: 'scale',
      label: 'Naikkan +20%',
      reason: `ROAS ${input.roasBank.toFixed(2)}x ≥ 1,2× BE ${input.beRoas.toFixed(2)}x; CPA masih di bawah batas.`,
    };
  }
  if (cpa > input.maxCpa) {
    return {
      status: 'hold',
      label: 'Tahan',
      reason: `CPA bank Rp${Math.round(cpa).toLocaleString('id-ID')} sedikit di atas Max CPA Rp${Math.round(input.maxCpa).toLocaleString('id-ID')}. Tahan atau turunkan budget 10–20%.`,
    };
  }
  if (input.frequency >= 2.5) {
    return {
      status: 'hold',
      label: 'Tahan',
      reason: `Frequency ${input.frequency.toFixed(1)}× sudah di atas 2,5. Refresh kreatif sebelum menaikkan budget.`,
    };
  }
  if (input.beRoas !== null && input.roasBank < input.beRoas * 1.2) {
    return {
      status: 'hold',
      label: 'Tahan',
      reason: `ROAS ${input.roasBank.toFixed(2)}x belum mencapai 1,2× BE ${input.beRoas.toFixed(2)}x. Perbaiki CVR/AOV dulu.`,
    };
  }
  return {
    status: 'hold',
    label: 'Tahan',
    reason: 'Belum ada kombinasi ROAS, CPA, dan frequency yang cukup kuat untuk scale.',
  };
}
