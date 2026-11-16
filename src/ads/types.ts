export type AdsTab = 'pulse' | 'ads' | 'money' | 'plan' | 'settings';
export type AdsDateRange = 7 | 14 | 30 | 90;
export type TaxMode = 'none' | 'inclusive' | 'exclusive';
export type Source = 'bank' | 'meta' | 'calc' | 'manual';
export type DecisionStatus = 'scale' | 'hold' | 'stop' | 'insufficient';
export type CampaignStatus = 'active' | 'paused' | 'learning' | 'rejected';

export interface ProductEconomics {
  id: string;
  name: string;
  price: number;
  cogs: number;
  shipping: number;
  feePct: number;
  refundPct: number;
  taxMode: TaxMode;
  taxPct: number;
  assumption?: string;
}

export interface DailyMetric {
  date: string;
  spend: number;
  revenue: number;
  orders: number;
  platformOrders: number;
  profit: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  productId: string;
  budget: number;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  outboundClicks: number;
  lpv: number;
  orders: number;
  revenue: number;
  platformOrders: number;
  platformRevenue: number;
  createdAt: string;
  daily: DailyMetric[];
}

export interface Creative {
  id: string;
  name: string;
  campaignId: string;
  format: 'video' | 'image';
  angle: string;
  spend: number;
  impressions: number;
  clicks: number;
  lpv: number;
  orders: number;
  revenue: number;
  frequency: number;
  hookRate: number;
  holdRate: number;
  createdAt: string;
}

export interface Order {
  id: string;
  externalOrderId: string;
  source: 'midtrans' | 'bank' | 'manual' | 'wa';
  productId: string;
  gross: number;
  fee: number;
  refund: number;
  net: number;
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  paidAt: string;
  campaignId?: string;
  matchMethod: 'utm' | 'manual' | 'unmatched';
  customerHash: string;
}

export interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  ruleKey: string;
  createdAt: string;
  ack: boolean;
}

export interface ParameterField {
  key: string;
  group: string;
  label: string;
  sync: 'default' | 'ondemand' | 'manual' | '-';
  display: 'default' | 'picker' | 'advanced' | '-';
  note?: string;
}

export interface Scenario {
  id: string;
  calculator: string;
  name: string;
  inputs: Record<string, number>;
  outputs: { label: string; value: string }[];
  decision: string;
  createdAt: string;
}

export interface ApprovalProposal {
  id: string;
  type: 'pause' | 'resume' | 'budget';
  targetId: string;
  targetName: string;
  beforeLabel: string;
  afterLabel: string;
  reason: string;
  downside: string;
  impactPct: number;
  requestedBy: 'AI' | 'Owner';
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

export interface RangeSummary {
  days: number;
  spend: number;
  revenue: number;
  orders: number;
  platformOrders: number;
  platformRevenue: number;
  profit: number;
  impressions: number;
  clicks: number;
  lpv: number;
  daily: DailyMetric[];
  activeCampaigns: number;
}

export interface AccountInfo {
  name: string;
  adAccountId: string;
  currency: string;
  timezone: string;
  pageName: string;
  pixelId: string;
  lastSync: string;
  tokenStatus: 'demo' | 'valid' | 'invalid' | 'missing';
}
