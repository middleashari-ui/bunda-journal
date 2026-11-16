import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Gauge,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  AdsDateRange,
  AdsTab,
  AlertItem,
  Campaign,
  Creative,
  ProductEconomics,
  RangeSummary,
} from '../types';
import { blendedEconomics, creativeDiagnosis, decide, productEconomics } from '../lib/calculators';
import { campaignForRange } from '../data/demo';
import { formatDate, formatIdr, formatIdrCompact, formatNumber, formatPercent, formatRoas } from '../lib/format';
import {
  AsOf,
  Badge,
  Button,
  DecisionBadge,
  EmptyState,
  MetricTile,
  SectionHeader,
  SourceBadge,
  StatusDot,
} from '../components/ui';
import { PerformanceChart } from '../components/charts';

function delta(current: number, previous: number): string {
  if (!previous) return '—';
  return formatPercent((current - previous) / previous);
}

function creativeFatigue(creative: Creative, maxCpa: number) {
  return creativeDiagnosis({
    ctr: creative.impressions > 0 ? creative.clicks / creative.impressions : 0,
    cvr: creative.lpv > 0 ? creative.orders / creative.lpv : 0,
    spend: creative.spend,
    orders: creative.orders,
    frequency: creative.frequency,
    hookRate: creative.hookRate,
    holdRate: creative.holdRate,
    medianCtr: 0.015,
    medianCvr: 0.03,
    maxCpa,
  });
}

export function PulseRoute({
  summary,
  previous,
  campaigns,
  creatives,
  products,
  alerts,
  range,
  onNavigate,
  onOpenCampaign,
  onOpenAnalyst,
  onOpenConnect,
}: {
  summary: RangeSummary;
  previous: RangeSummary;
  campaigns: Campaign[];
  creatives: Creative[];
  products: ProductEconomics[];
  alerts: AlertItem[];
  range: AdsDateRange;
  onNavigate: (tab: AdsTab) => void;
  onOpenCampaign: (campaign: Campaign) => void;
  onOpenAnalyst: () => void;
  onOpenConnect: () => void;
}) {
  const blend = blendedEconomics(products, { essential: 0.2, vip: 0.6, hardcover: 0.2 }, 0.2);
  const cpa = summary.orders > 0 ? summary.spend / summary.orders : null;
  const roas = summary.spend > 0 ? summary.revenue / summary.spend : 0;
  const decision = decide({
    orders: summary.orders,
    cpaBank: cpa,
    maxCpa: blend.maxCpa,
    roasBank: roas,
    beRoas: blend.beRoas,
    frequency: 2.1,
    spend: summary.spend,
  });
  const activeAlerts = alerts.filter((alert) => !alert.ack).slice(0, 3);
  const riskCampaigns = campaigns
    .map((baseCampaign) => {
      const campaign = campaignForRange(baseCampaign, summary.days);
      const product = products.find((item) => item.id === campaign.productId) ?? products[0];
      const econ = productEconomics(product, 0.2);
      const campaignCpa = campaign.orders > 0 ? campaign.spend / campaign.orders : null;
      const campaignRoas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
      return {
        campaign,
        econ,
        cpa: campaignCpa,
        roas: campaignRoas,
        decision: decide({
          orders: campaign.orders,
          cpaBank: campaignCpa,
          maxCpa: econ.maxCpa,
          roasBank: campaignRoas,
          beRoas: econ.beRoas,
          frequency: campaign.frequency,
          spend: campaign.spend,
        }),
      };
    })
    .filter((item) => item.decision.status === 'stop' || item.decision.status === 'insufficient')
    .sort((a, b) => {
      if (a.decision.status === 'stop' && b.decision.status !== 'stop') return -1;
      if (b.decision.status === 'stop' && a.decision.status !== 'stop') return 1;
      return b.campaign.spend - a.campaign.spend;
    })
    .slice(0, 3);

  const fatigue = creatives
    .map((creative) => ({ creative, result: creativeFatigue(creative, blend.maxCpa) }))
    .sort((a, b) => b.result.fatigue - a.result.fatigue)
    .slice(0, 3);

  const gap =
    summary.orders > 0 ? (summary.platformOrders - summary.orders) / summary.orders : null;

  if (summary.orders === 0 && summary.spend === 0) {
    return (
      <EmptyState
        title="Belum ada data Meta"
        body="Hubungkan akun Meta untuk mulai. Kalau key belum ada, dashboard tetap menampilkan mode demo."
        action={<Button variant="primary" onClick={onOpenConnect}>Hubungkan Meta</Button>}
      />
    );
  }

  return (
    <div className="ads-page" data-testid="pulse-page">
      <div className="ads-page-head">
        <div>
          <span className="ads-eyebrow">Ruang keputusan · {range} hari</span>
          <h1>Hari Ini</h1>
          <p>Apakah saya aman spend hari ini? Satu keputusan, lalu bukti.</p>
        </div>
        <div className="ads-page-head-meta">
          <Badge tone="amber">Mode demo</Badge>
          <AsOf value="2026-11-16T08:30:00+07:00" />
        </div>
      </div>

      <section className={`ads-decision-card is-${decision.status}`} data-testid="decision-card">
        <div className="ads-decision-main">
          <div className="ads-decision-kicker">
            <Gauge size={16} />
            <span>Keputusan hari ini</span>
          </div>
          <div className="ads-decision-status">{decision.label}</div>
          <p className="ads-decision-reason">{decision.reason}</p>
          <div className="ads-decision-evidence">
            <Badge tone={cpa !== null && cpa <= blend.maxCpa ? 'sage' : 'terracotta'}>
              CPA bank {cpa === null ? '—' : formatIdr(cpa)}
            </Badge>
            <Badge tone={roas >= (blend.beRoas ?? 0) ? 'sage' : 'terracotta'}>
              ROAS {formatRoas(roas)} · BE {formatRoas(blend.beRoas)}
            </Badge>
            <Badge tone={summary.orders >= 10 ? 'neutral' : 'amber'}>
              {summary.orders} order
            </Badge>
          </div>
        </div>
        <div className="ads-decision-side">
          <div className="ads-decision-side-label">
            <ShieldCheck size={15} /> Batas aman
          </div>
          <div className="ads-decision-side-value">{formatIdr(blend.maxCpa)}</div>
          <span>Max CPA blended · buffer 20%</span>
          <div className="ads-decision-actions">
            <Button variant="primary" size="sm" onClick={() => onNavigate('plan')}>
              Buat skenario <ArrowRight size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('ads')}>
              Lihat Iklan
            </Button>
          </div>
        </div>
      </section>

      <div className="ads-kpis">
        <MetricTile
          label="Laba bersih"
          value={formatIdr(summary.profit)}
          delta={delta(summary.profit, previous.profit)}
          source="bank"
          note={`${range} hari`}
          tone={summary.profit >= 0 ? 'sage' : 'terracotta'}
        />
        <MetricTile
          label="Spend"
          value={formatIdr(summary.spend)}
          delta={delta(summary.spend, previous.spend)}
          source="meta"
          note="Meta reported"
        />
        <MetricTile
          label="CPA bank vs Max"
          value={cpa === null ? '—' : formatIdr(cpa)}
          delta={delta(cpa ?? 0, previous.orders > 0 ? previous.spend / previous.orders : 0)}
          source="bank"
          note={`Max ${formatIdr(blend.maxCpa)}`}
          tone={cpa !== null && cpa <= blend.maxCpa ? 'sage' : 'terracotta'}
        />
        <MetricTile
          label="Order bank"
          value={formatNumber(summary.orders)}
          delta={delta(summary.orders, previous.orders)}
          source="bank"
          note={`Meta ${formatNumber(summary.platformOrders)}`}
        />
      </div>

      {activeAlerts.length > 0 ? (
        <div className="ads-alert-strip" role="region" aria-label="Alert aktif">
          <div className="ads-alert-strip-head">
            <CircleAlert size={16} />
            <strong>{activeAlerts.length} hal perlu dicek</strong>
          </div>
          <div className="ads-alert-strip-list">
            {activeAlerts.map((alert) => (
              <button key={alert.id} type="button" className={`ads-alert ads-alert-${alert.severity}`} onClick={() => onOpenAnalyst()}>
                <span>{alert.title}</span>
                <small>{alert.body}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ads-grid-2">
        <section className="ads-card">
          <SectionHeader
            title="Spend vs revenue bank"
            subtitle={`${range} hari · garis putus-putus = profit setelah iklan`}
            action={<Button variant="quiet" size="sm" onClick={() => onNavigate('ads')}>Detail <ArrowUpRight size={13} /></Button>}
          />
          <PerformanceChart data={summary.daily} />
          <div className="ads-legend">
            <span><i className="dot-sage" /> Revenue bank</span>
            <span><i className="dot-terra" /> Spend</span>
            <span><i className="dot-amber" /> Profit</span>
            <span className="ads-legend-note">Sumber: demo · as-of 08.30 WIB</span>
          </div>
        </section>

        <section className="ads-card">
          <SectionHeader title="Uang vs Meta" subtitle="Jangan pakai ROAS platform sebagai kebenaran." />
          <div className="ads-recon">
            <div>
              <span>Order Meta</span>
              <strong>{formatNumber(summary.platformOrders)}</strong>
              <SourceBadge source="meta" />
            </div>
            <div>
              <span>Order bank</span>
              <strong>{formatNumber(summary.orders)}</strong>
              <SourceBadge source="bank" />
            </div>
            <div className={gap !== null && gap > 0.2 ? 'is-bad' : ''}>
              <span>Gap</span>
              <strong>{gap === null ? '—' : formatPercent(gap)}</strong>
              <small>{gap !== null && gap > 0.2 ? 'Meta overclaim >20%' : 'Dalam toleransi'}</small>
            </div>
          </div>
          <div className="ads-recon-note">
            {gap !== null && gap > 0.2
              ? 'Perbaiki tracking sebelum scale. Keputusan CPA memakai order bank.'
              : 'Angka bank dipakai untuk CPA dan profit; Meta untuk diagnosis kreatif.'}
          </div>
          <Button variant="secondary" size="sm" onClick={() => onNavigate('money')}>
            Buka rekonsiliasi <ArrowRight size={14} />
          </Button>
        </section>
      </div>

      <div className="ads-grid-2">
        <section className="ads-card">
          <SectionHeader
            title="Perlu keputusan"
            subtitle="Campaign yang melewati guardrail atau sampelnya belum cukup."
            action={<Badge tone="neutral">{riskCampaigns.length}</Badge>}
          />
          {riskCampaigns.length === 0 ? (
            <p className="ads-muted">Tidak ada campaign yang melewati guardrail saat ini.</p>
          ) : (
            <div className="ads-decision-list">
              {riskCampaigns.map(({ campaign, cpa: campaignCpa, decision: campaignDecision }) => (
                <div key={campaign.id} className="ads-decision-row">
                  <div className="ads-decision-row-main">
                    <div className="ads-decision-row-title">
                      <StatusDot status={campaign.status} />
                      <strong>{campaign.name}</strong>
                    </div>
                    <span>
                      Spend {formatIdr(campaign.spend)} · {campaign.orders} order · CPA{' '}
                      {campaignCpa === null ? '—' : formatIdr(campaignCpa)}
                    </span>
                  </div>
                  <div className="ads-decision-row-side">
                    <DecisionBadge status={campaignDecision.status} label={campaignDecision.label} />
                    <Button variant="quiet" size="sm" onClick={() => onOpenCampaign(campaign)}>
                      Detail <ArrowRight size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ads-card">
          <SectionHeader
            title="Kreatif capek"
            subtitle="Frequency, CTR, dan CPA — bukan hanya views."
            action={<Button variant="quiet" size="sm" onClick={() => onNavigate('ads')}>Semua <ArrowRight size={13} /></Button>}
          />
          <div className="ads-fatigue-list">
            {fatigue.map(({ creative, result }) => (
              <div key={creative.id} className="ads-fatigue-row">
                <div className="ads-creative-thumb" data-format={creative.format}>
                  {creative.format === 'video' ? 'VID' : 'IMG'}
                </div>
                <div className="ads-fatigue-main">
                  <strong>{creative.name}</strong>
                  <span>{creative.angle} · freq {formatRoas(creative.frequency)}</span>
                </div>
                <div className="ads-fatigue-side">
                  <Badge tone={result.fatigue > 0.75 ? 'terracotta' : result.fatigue > 0.5 ? 'amber' : 'sage'}>
                    {formatPercent(result.fatigue)} fatigue
                  </Badge>
                  <span>{formatIdrCompact(creative.spend)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="ads-footnote">
        <span><TrendingUp size={14} /> Profit dihitung setelah fee, refund, dan COGS.</span>
        <span><TrendingDown size={14} /> Data demo; token Meta menyusul.</span>
        <span><Gauge size={14} /> Sample minimum: 10 order sebelum verdict.</span>
        <span>Terakhir sync 16 Nov 2026 08.30 WIB · {formatDate('2026-11-16')}</span>
      </div>
    </div>
  );
}
