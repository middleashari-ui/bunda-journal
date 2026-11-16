import { ArrowUpRight, PauseCircle, TrendingUp } from 'lucide-react';
import type { Campaign, Creative, ProductEconomics } from '../types';
import { decide, productEconomics } from '../lib/calculators';
import { formatIdr, formatNumber, formatPercent, formatRoas } from '../lib/format';
import { Badge, Button, DecisionBadge, DrawerShell, MetricTile, SectionHeader, StatusDot } from './ui';
import { PerformanceChart } from './charts';

export function CampaignDrawer({
  campaign,
  creatives,
  product,
  onClose,
  onPause,
  onScale,
}: {
  campaign: Campaign;
  creatives: Creative[];
  product: ProductEconomics;
  onClose: () => void;
  onPause: (campaign: Campaign) => void;
  onScale: (campaign: Campaign) => void;
}) {
  const econ = productEconomics(product, 0.2);
  const cpa = campaign.orders > 0 ? campaign.spend / campaign.orders : null;
  const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
  const decision = decide({
    orders: campaign.orders,
    cpaBank: cpa,
    maxCpa: econ.maxCpa,
    roasBank: roas,
    beRoas: econ.beRoas,
    frequency: campaign.frequency,
    spend: campaign.spend,
  });
  const campaignCreatives = creatives.filter((creative) => creative.campaignId === campaign.id);

  return (
    <DrawerShell
      title={campaign.name}
      subtitle={`${campaign.objective} · budget ${formatIdr(campaign.budget)}/hari · ${formatPercent(econ.marginPct)} margin ${product.name}`}
      onClose={onClose}
      testId="campaign-drawer"
      footer={
        <div className="ads-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          {campaign.status === 'active' ? (
            <>
              <Button variant="danger" onClick={() => onPause(campaign)}>
                <PauseCircle size={15} /> Usul hentikan
              </Button>
              <Button variant="primary" onClick={() => onScale(campaign)}>
                <TrendingUp size={15} /> Usul +20%
              </Button>
            </>
          ) : (
            <Badge tone="neutral">Campaign tidak aktif</Badge>
          )}
        </div>
      }
    >
      <div className="ads-drawer-stack">
        <div className="ads-drawer-status">
          <StatusDot status={campaign.status} />
          <DecisionBadge status={decision.status} label={decision.label} />
          <span className="ads-muted">{decision.reason}</span>
        </div>

        <div className="ads-kpis ads-kpis-2">
          <MetricTile label="Spend" value={formatIdr(campaign.spend)} source="meta" />
          <MetricTile label="Order bank" value={formatNumber(campaign.orders)} source="bank" />
          <MetricTile
            label="CPA bank"
            value={cpa === null ? '—' : formatIdr(cpa)}
            source="bank"
            note={`Max ${formatIdr(econ.maxCpa)}`}
            tone={cpa !== null && cpa > econ.maxCpa ? 'terracotta' : 'sage'}
          />
          <MetricTile label="ROAS bank" value={formatRoas(roas)} source="bank" note={`BE ${formatRoas(econ.beRoas)}`} />
        </div>

        <div className="ads-card ads-card-flat">
          <SectionHeader title={`${Math.min(14, campaign.daily.length)} hari terakhir`} subtitle="Spend, revenue bank, profit." />
          <PerformanceChart data={campaign.daily.slice(-14)} />
        </div>

        <div className="ads-detail-grid">
          <div>
            <span className="ads-eyebrow">Delivery</span>
            <dl className="ads-facts">
              <div><dt>Impressions</dt><dd>{formatNumber(campaign.impressions)}</dd></div>
              <div><dt>Reach</dt><dd>{formatNumber(campaign.reach)}</dd></div>
              <div><dt>Frequency</dt><dd>{formatRoas(campaign.frequency)}</dd></div>
              <div><dt>Klik</dt><dd>{formatNumber(campaign.clicks)}</dd></div>
              <div><dt>LPV</dt><dd>{formatNumber(campaign.lpv)}</dd></div>
              <div><dt>Platform order</dt><dd>{formatNumber(campaign.platformOrders)}</dd></div>
            </dl>
          </div>
          <div>
            <span className="ads-eyebrow">Guardrail</span>
            <div className="ads-guard-list">
              <div>
                <span>Max CPA</span>
                <strong>{formatIdr(econ.maxCpa)}</strong>
              </div>
              <div>
                <span>BE ROAS</span>
                <strong>{formatRoas(econ.beRoas)}</strong>
              </div>
              <div>
                <span>Frequency</span>
                <strong>{formatRoas(campaign.frequency)}</strong>
              </div>
              <div>
                <span>Buffer</span>
                <strong>20%</strong>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Kreatif di campaign ini" subtitle={`${campaignCreatives.length} kreatif`} />
          {campaignCreatives.length === 0 ? (
            <p className="ads-muted">Belum ada kreatif terhubung di data demo.</p>
          ) : (
            <div className="ads-mini-list">
              {campaignCreatives.map((creative) => (
                <div key={creative.id} className="ads-mini-row">
                  <div>
                    <strong>{creative.name}</strong>
                    <span className="ads-muted">{creative.angle} · {creative.format}</span>
                  </div>
                  <div className="ads-mini-metrics">
                    <span>{formatIdr(creative.spend)}</span>
                    <span>{creative.lpv > 0 ? formatPercent(creative.orders / creative.lpv) : '—'} CVR</span>
                    <Badge tone={creative.frequency > 3 ? 'amber' : 'neutral'}>freq {formatRoas(creative.frequency)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ads-note-line">
          <ArrowUpRight size={14} /> Perubahan dari drawer ini selalu berupa proposal, bukan eksekusi
          langsung. Di produksi, server yang memegang token Meta.
        </div>
      </div>
    </DrawerShell>
  );
}
