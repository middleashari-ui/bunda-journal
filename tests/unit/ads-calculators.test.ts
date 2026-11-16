import { describe, expect, it } from 'vitest';
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
  targetToBudget,
  unitEconomics,
} from '../../src/ads/lib/calculators';
import { DEMO_PRODUCTS } from '../../src/ads/data/demo';

const vip = DEMO_PRODUCTS.find((product) => product.id === 'vip')!;
const hardcover = DEMO_PRODUCTS.find((product) => product.id === 'hardcover')!;
const essential = DEMO_PRODUCTS.find((product) => product.id === 'essential')!;

describe('unit economics', () => {
  it('hitung VIP default', () => {
    const result = productEconomics(vip, 0.2);
    expect(result.contribution).toBeCloseTo(125_517, 0);
    expect(result.marginPct).toBeCloseTo(0.973, 3);
    expect(result.beRoas).toBeCloseTo(1.0277, 3);
    expect(result.maxCpa).toBeCloseTo(100_413.6, 0);
  });

  it('hitung hardcover dengan COGS + ongkir', () => {
    const result = productEconomics(hardcover, 0.2);
    expect(result.contribution).toBeCloseTo(102_277, 0);
    expect(result.marginPct).toBeCloseTo(0.41075, 4);
    expect(result.beRoas).toBeCloseTo(2.4345, 3);
    expect(result.maxCpa).toBeCloseTo(81_821.6, 0);
  });

  it('menolak kontribusi negatif', () => {
    const result = unitEconomics({
      price: 100_000,
      cogs: 150_000,
      shipping: 0,
      feePct: 0.007,
      refundPct: 0.02,
      taxMode: 'none',
      taxPct: 0,
      bufferPct: 0.2,
    });
    expect(result.contribution).toBeLessThan(0);
    expect(result.beRoas).toBeNull();
    expect(result.maxCpa).toBeLessThan(0);
  });

  it('mode PPN inclusive menurunkan kontribusi', () => {
    const result = unitEconomics({
      price: 129_000,
      cogs: 0,
      shipping: 0,
      feePct: 0.007,
      refundPct: 0.02,
      taxMode: 'inclusive',
      taxPct: 0.11,
      bufferPct: 0.2,
    });
    expect(result.contribution).toBeCloseTo(113_078.4, 0);
    expect(result.beRoas).toBeCloseTo(1.1408, 3);
  });
});

describe('blended', () => {
  it('hitung mix 20/60/20', () => {
    const result = blendedEconomics(
      DEMO_PRODUCTS,
      { essential: 0.2, vip: 0.6, hardcover: 0.2 },
      0.2
    );
    expect(result.aov).toBeCloseTo(137_000, 0);
    expect(result.contribution).toBeCloseTo(105_301, 0);
    expect(result.beRoas).toBeCloseTo(1.301, 2);
    expect(result.maxCpa).toBeCloseTo(84_241, 0);
  });
});

describe('funnel', () => {
  it('contoh Rp150rb/hari x14', () => {
    const result = budgetToResults({
      spend: 2_100_000,
      cpm: 45_000,
      ctr: 0.018,
      lpvRate: 0.7,
      cvr: 0.03,
      aov: 120_000,
      contribution: 116_760,
    });
    expect(result.orders).toBeCloseTo(17.64, 2);
    expect(result.cpa).toBeCloseTo(119_047.62, 0);
    expect(result.roas).toBeCloseTo(1.008, 3);
    expect(result.profit).toBeCloseTo(-40_353.6, 0);
  });

  it('target 100 sales menghitung kebutuhan impressions', () => {
    const result = targetToBudget({
      targetOrders: 100,
      cpm: 45_000,
      ctr: 0.018,
      lpvRate: 0.7,
      cvr: 0.03,
      aov: 129_000,
      contribution: 125_517,
    });
    expect(result.orders).toBeCloseTo(100, 0);
    expect(result.impressions).toBeCloseTo(264_550.26, 0);
    expect(result.revenue).toBeCloseTo(12_900_000, 0);
  });

  it('scale simulator menurunkan efisiensi saat budget naik', () => {
    const result = scaleSimulator({
      currentBudget: 150_000,
      newBudget: 300_000,
      cpm: 45_000,
      ctr: 0.018,
      lpvRate: 0.7,
      cvr: 0.03,
      aov: 129_000,
      contribution: 125_517,
      decayCpm: 0.15,
      decayCtr: 0.05,
      decayCvr: 0.1,
    });
    expect(result.multiplier).toBeCloseTo(2, 5);
    expect(result.cpm).toBeCloseTo(51_750, 0);
    expect(result.ctr).toBeCloseTo(0.0171, 4);
    expect(result.cvr).toBeCloseTo(0.027, 4);
  });
});

describe('decisions', () => {
  it('belum cukup data', () => {
    const result = decide({
      orders: 5,
      cpaBank: 50_000,
      maxCpa: 100_000,
      roasBank: 2,
      beRoas: 1,
      frequency: 1.5,
    });
    expect(result.status).toBe('insufficient');
  });

  it('hentikan spend besar tanpa order meski sampel kecil', () => {
    const result = decide({
      orders: 0,
      cpaBank: null,
      maxCpa: 80_000,
      roasBank: 0,
      beRoas: 1.3,
      frequency: 3.4,
      spend: 310_000,
    });
    expect(result.status).toBe('stop');
  });

  it('hentikan jika CPA jauh di atas batas', () => {
    const result = decide({
      orders: 20,
      cpaBank: 150_000,
      maxCpa: 100_000,
      roasBank: 1,
      beRoas: 1.2,
      frequency: 2,
    });
    expect(result.status).toBe('stop');
  });

  it('scale jika ROAS dan CPA sehat', () => {
    const result = decide({
      orders: 20,
      cpaBank: 80_000,
      maxCpa: 100_000,
      roasBank: 1.8,
      beRoas: 1.3,
      frequency: 1.8,
    });
    expect(result.status).toBe('scale');
  });

  it('tahan jika ROAS belum cukup kuat', () => {
    const result = decide({
      orders: 20,
      cpaBank: 90_000,
      maxCpa: 100_000,
      roasBank: 1.4,
      beRoas: 1.3,
      frequency: 2,
    });
    expect(result.status).toBe('hold');
  });
});

describe('creative', () => {
  it('winner dengan fatigue rendah', () => {
    const result = creativeDiagnosis({
      ctr: 0.02,
      cvr: 0.04,
      spend: 500_000,
      orders: 10,
      frequency: 1.5,
      hookRate: 0.35,
      holdRate: 0.25,
      medianCtr: 0.015,
      medianCvr: 0.03,
      maxCpa: 100_000,
    });
    expect(result.quadrant).toBe('winner');
    expect(result.verdict).toBe('scale');
    expect(result.fatigue).toBeLessThan(0.5);
  });

  it('CTR tinggi CVR rendah = offer/LP', () => {
    const result = creativeDiagnosis({
      ctr: 0.03,
      cvr: 0.01,
      spend: 500_000,
      orders: 2,
      frequency: 2,
      hookRate: 0.4,
      holdRate: 0.1,
      medianCtr: 0.015,
      medianCvr: 0.03,
      maxCpa: 100_000,
    });
    expect(result.quadrant).toBe('offer');
    expect(result.reasons.join(' ')).toContain('offer');
  });

  it('frequency tinggi menahan verdict scale', () => {
    const result = creativeDiagnosis({
      ctr: 0.02,
      cvr: 0.04,
      spend: 500_000,
      orders: 10,
      frequency: 3.4,
      hookRate: 0.35,
      holdRate: 0.25,
      medianCtr: 0.015,
      medianCvr: 0.03,
      maxCpa: 100_000,
    });
    expect(result.quadrant).toBe('winner');
    expect(result.verdict).toBe('watch');
  });

  it('spend besar tanpa order = kill', () => {
    const result = creativeDiagnosis({
      ctr: 0.02,
      cvr: 0,
      spend: 310_000,
      orders: 0,
      frequency: 3.4,
      hookRate: 0,
      holdRate: 0,
      medianCtr: 0.015,
      medianCvr: 0.03,
      maxCpa: 100_000,
    });
    expect(result.verdict).toBe('kill');
  });
});

describe('ltv, reconciliation, incrementality', () => {
  it('LTV:CAC dengan upgrade VIP', () => {
    const result = ltvCac({
      cac: 80_000,
      aov: 129_000,
      contribution: 125_517,
      upgradePct: 0.15,
      upgradePrice: 80_000,
      upgradeContribution: 77_840,
    });
    expect(result.ltvRevenue).toBeCloseTo(141_000, 0);
    expect(result.ltvContribution).toBeCloseTo(137_193, 0);
    expect(result.ltvCac).toBeCloseTo(1.7149, 3);
  });

  it('gap Meta vs bank', () => {
    const result = reconcile({
      spend: 2_100_000,
      metaOrders: 24,
      metaRevenue: 3_096_000,
      bankOrders: 18,
      bankRevenue: 2_322_000,
    });
    expect(result.gapOrdersPct).toBeCloseTo(0.3333, 4);
    expect(result.gapRevenuePct).toBeCloseTo(0.3333, 4);
    expect(result.cpaBank).toBeCloseTo(116_666.67, 0);
    expect(result.mer).toBeCloseTo(1.1057, 3);
    expect(result.calibration).toBeCloseTo(0.75, 4);
  });

  it('incrementality menghasilkan iROAS', () => {
    const result = incrementality({
      testOrders: 100,
      controlOrders: 80,
      testPopulation: 50_000,
      controlPopulation: 50_000,
      incrementalSpend: 2_000_000,
      aov: 129_000,
      contribution: 125_517,
    });
    expect(result.incrementalOrders).toBeCloseTo(20, 0);
    expect(result.incrementalRevenue).toBeCloseTo(2_580_000, 0);
    expect(result.iRoas).toBeCloseTo(1.29, 2);
  });
});

describe('cashflow, pacing, promo', () => {
  it('batch hardcover aman', () => {
    const result = cashflowPrint({
      batchSize: 50,
      cogs: 140_000,
      price: 249_000,
      preorders: 20,
      dailyOrders: 2,
      cashAvailable: 5_000_000,
      dailyAdSpend: 150_000,
    });
    expect(result.cashOut).toBe(7_000_000);
    expect(result.preorderCashIn).toBe(4_980_000);
    expect(result.netCash).toBe(-2_020_000);
    expect(result.daysToSell).toBeCloseTo(25, 0);
    expect(result.recommendedBatch).toBe(35);
  });

  it('pacing 93%', () => {
    const result = budgetPacing({
      dailyBudget: 150_000,
      daysElapsed: 15,
      daysInMonth: 30,
      actualSpend: 2_100_000,
      monthlyBudget: 4_500_000,
    });
    expect(result.plannedToDate).toBe(2_250_000);
    expect(result.pacing).toBeCloseTo(0.9333, 4);
    expect(result.projectedMonthSpend).toBe(4_200_000);
    expect(result.remainingBudget).toBe(2_400_000);
  });

  it('promo 10% menurunkan kontribusi', () => {
    const result = promoBreakEven(vip, 0.1, 0.2);
    expect(result.discountedPrice).toBe(116_100);
    expect(result.econ.contribution).toBeCloseTo(112_965, 0);
    expect(result.deltaContribution).toBeCloseTo(-12_552, 0);
  });

  it('Essential lebih kecil dari VIP', () => {
    expect(productEconomics(essential).contribution).toBeLessThan(
      productEconomics(vip).contribution
    );
  });
});
