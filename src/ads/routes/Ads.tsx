import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Columns3, Filter, PauseCircle, Search, TrendingUp } from 'lucide-react';
import type { Campaign, Creative, ProductEconomics, RangeSummary } from '../types';
import { creativeDiagnosis, decide, productEconomics } from '../lib/calculators';
import { formatDate, formatIdr, formatNumber, formatPercent, formatRoas } from '../lib/format';
import { DEMO_BREAKDOWNS, DEMO_BREAKDOWN_KEYS, campaignForRange } from '../data/demo';
import {
  Badge,
  Button,
  DecisionBadge,
  EmptyState,
  Segmented,
  SourceBadge,
  Sparkline,
  StatusDot,
} from '../components/ui';
import { BreakdownBars, CreativeQuadrant } from '../components/charts';

type SubTab = 'kampanye' | 'kreatif' | 'breakdown';
type SortKey = 'spend' | 'orders' | 'cpa' | 'roas' | 'frequency';

interface CampaignRow {
  campaign: Campaign;
  product: ProductEconomics;
  cpa: number | null;
  roas: number;
  decision: ReturnType<typeof decide>;
  maxCpa: number;
}

interface CreativeRow {
  creative: Creative;
  ctr: number;
  cvr: number;
  cpa: number | null;
  fatigue: number;
  verdict: ReturnType<typeof creativeDiagnosis>['verdict'];
}

export function AdsRoute({
  summary,
  campaigns,
  creatives,
  products,
  onOpenCampaign,
  onOpenConnect,
}: {
  summary: RangeSummary;
  campaigns: Campaign[];
  creatives: Creative[];
  products: ProductEconomics[];
  onOpenCampaign: (campaign: Campaign) => void;
  onOpenConnect: () => void;
}) {
  const [subtab, setSubtab] = useState<SubTab>('kampanye');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showColumns, setShowColumns] = useState(false);
  const [extra, setExtra] = useState({
    frequency: true,
    platform: false,
    impressions: false,
    lpv: false,
    created: false,
  });
  const [breakdownKey, setBreakdownKey] = useState<'age_gender' | 'placement'>('age_gender');

  const breakdownRows = useMemo(() => {
    const base = DEMO_BREAKDOWNS[breakdownKey];
    const spendTotal = base.reduce((sum, row) => sum + row.spend, 0);
    const orderTotal = base.reduce((sum, row) => sum + row.orders, 0);
    const revenueTotal = base.reduce((sum, row) => sum + row.revenue, 0);
    const impressionTotal = base.reduce((sum, row) => sum + row.impressions, 0);
    if (spendTotal <= 0 || orderTotal <= 0 || revenueTotal <= 0) return base;
    return base.map((row) => ({
      ...row,
      spend: (row.spend / spendTotal) * summary.spend,
      orders: Math.max(0, Math.round((row.orders / orderTotal) * summary.orders)),
      revenue: (row.revenue / revenueTotal) * summary.revenue,
      impressions: Math.round((row.impressions / impressionTotal) * summary.impressions),
    }));
  }, [breakdownKey, summary]);

  const rows = useMemo<CampaignRow[]>(() => {
    return campaigns.map((baseCampaign) => {
      const campaign = campaignForRange(baseCampaign, summary.days);
      const product = products.find((item) => item.id === campaign.productId) ?? products[0];
      const econ = productEconomics(product, 0.2);
      const cpa = campaign.orders > 0 ? campaign.spend / campaign.orders : null;
      const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
      return {
        campaign,
        product,
        cpa,
        roas,
        decision: decide({
          orders: campaign.orders,
          cpaBank: cpa,
          maxCpa: econ.maxCpa,
          roasBank: roas,
          beRoas: econ.beRoas,
          frequency: campaign.frequency,
          spend: campaign.spend,
        }),
        maxCpa: econ.maxCpa,
      };
    });
  }, [campaigns, products, summary.days]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (status !== 'all' && row.campaign.status !== status) return false;
      if (text && !row.campaign.name.toLowerCase().includes(text)) return false;
      return true;
    });
    return list.sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1;
      const get = (row: CampaignRow) => {
        if (sortKey === 'spend') return row.campaign.spend;
        if (sortKey === 'orders') return row.campaign.orders;
        if (sortKey === 'cpa') return row.cpa ?? Number.POSITIVE_INFINITY;
        if (sortKey === 'roas') return row.roas;
        return row.campaign.frequency;
      };
      return (get(a) - get(b)) * direction;
    });
  }, [query, rows, sortDir, sortKey, status]);

  const creativeRows = useMemo<CreativeRow[]>(() => {
    const blend = productEconomics(products.find((item) => item.id === 'vip') ?? products[0], 0.2);
    return creatives
      .map((creative) => {
        const ctr = creative.impressions > 0 ? creative.clicks / creative.impressions : 0;
        const cvr = creative.lpv > 0 ? creative.orders / creative.lpv : 0;
        const diagnosis = creativeDiagnosis({
          ctr,
          cvr,
          spend: creative.spend,
          orders: creative.orders,
          frequency: creative.frequency,
          hookRate: creative.hookRate,
          holdRate: creative.holdRate,
          medianCtr: 0.015,
          medianCvr: 0.03,
          maxCpa: blend.maxCpa,
        });
        return {
          creative,
          ctr,
          cvr,
          cpa: creative.orders > 0 ? creative.spend / creative.orders : null,
          fatigue: diagnosis.fatigue,
          verdict: diagnosis.verdict,
        };
      })
      .sort((a, b) => b.creative.spend - a.creative.spend);
  }, [creatives, products]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="Belum ada campaign"
        body="Hubungkan akun Meta untuk menarik campaign. Mode demo tetap bisa dipakai untuk melihat layout."
        action={<Button variant="primary" onClick={onOpenConnect}>Hubungkan Meta</Button>}
      />
    );
  }

  return (
    <div className="ads-page" data-testid="ads-page">
      <div className="ads-page-head">
        <div>
          <span className="ads-eyebrow">Iklan · {summary.days} hari</span>
          <h1>Iklan</h1>
          <p>Kreatif & campaign mana yang kerja, mana yang capek.</p>
        </div>
        <div className="ads-page-head-meta">
          <Badge tone="amber">Mode demo</Badge>
          <SourceBadge source="bank" />
        </div>
      </div>

      <div className="ads-toolbar">
        <Segmented<SubTab>
          ariaLabel="Sub-tab Iklan"
          value={subtab}
          onChange={setSubtab}
          options={[
            { value: 'kampanye', label: 'Kampanye' },
            { value: 'kreatif', label: 'Kreatif' },
            { value: 'breakdown', label: 'Breakdown' },
          ]}
        />
        {subtab === 'kampanye' ? (
          <div className="ads-toolbar-actions">
            <label className="ads-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari campaign…"
                aria-label="Cari campaign"
              />
            </label>
            <div className="ads-select-wrap">
              <Filter size={14} />
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter status">
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="paused">Jeda</option>
              </select>
            </div>
            <div className="ads-colpicker">
              <Button size="sm" variant="secondary" onClick={() => setShowColumns((current) => !current)}>
                <Columns3 size={14} /> Kolom <ChevronDown size={13} />
              </Button>
              {showColumns ? (
                <div className="ads-colpicker-pop">
                  <span className="ads-eyebrow">Kolom tambahan</span>
                  {[
                    ['frequency', 'Frequency'],
                    ['platform', 'Platform order'],
                    ['impressions', 'Impressions'],
                    ['lpv', 'LPV'],
                    ['created', 'Dibuat'],
                  ].map(([key, label]) => (
                    <label key={key} className="ads-check">
                      <input
                        type="checkbox"
                        checked={extra[key as keyof typeof extra]}
                        onChange={(event) =>
                          setExtra((current) => ({ ...current, [key]: event.target.checked }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {subtab === 'kampanye' ? (
        <section className="ads-card ads-card-table">
          <div className="ads-table-meta">
            <span>{filtered.length} campaign</span>
            <span>Klik baris untuk detail · angka keputusan memakai order bank</span>
          </div>
          <div className="ads-table-wrap">
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th className="num">Budget</th>
                  <th className="num">
                    <button type="button" onClick={() => toggleSort('spend')}>Spend</button>
                  </th>
                  <th className="num">
                    <button type="button" onClick={() => toggleSort('orders')}>Order bank</button>
                  </th>
                  <th className="num">
                    <button type="button" onClick={() => toggleSort('cpa')}>CPA</button>
                  </th>
                  <th className="num">
                    <button type="button" onClick={() => toggleSort('roas')}>ROAS</button>
                  </th>
                  {extra.frequency ? <th className="num">Freq</th> : null}
                  {extra.platform ? <th className="num">Meta order</th> : null}
                  {extra.impressions ? <th className="num">Impr</th> : null}
                  {extra.lpv ? <th className="num">LPV</th> : null}
                  {extra.created ? <th>Dibuat</th> : null}
                  <th>7d</th>
                  <th>Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ campaign, cpa, roas, decision }) => (
                  <tr key={campaign.id} onClick={() => onOpenCampaign(campaign)} tabIndex={0} role="button" onKeyDown={(event) => {
                    if (event.key === 'Enter') onOpenCampaign(campaign);
                  }}>
                    <td>
                      <div className="ads-table-name">
                        <StatusDot status={campaign.status} />
                        <div>
                          <strong>{campaign.name}</strong>
                          <span>{campaign.objective} · {campaign.productId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num">{formatIdr(campaign.budget)}</td>
                    <td className="num">{formatIdr(campaign.spend)}</td>
                    <td className="num">{formatNumber(campaign.orders)}</td>
                    <td className="num">{cpa === null ? '—' : formatIdr(cpa)}</td>
                    <td className="num">{formatRoas(roas)}</td>
                    {extra.frequency ? <td className="num">{formatRoas(campaign.frequency)}</td> : null}
                    {extra.platform ? <td className="num">{formatNumber(campaign.platformOrders)}</td> : null}
                    {extra.impressions ? <td className="num">{formatNumber(campaign.impressions)}</td> : null}
                    {extra.lpv ? <td className="num">{formatNumber(campaign.lpv)}</td> : null}
                    {extra.created ? <td>{formatDate(campaign.createdAt)}</td> : null}
                    <td><Sparkline values={campaign.daily.slice(-7).map((day) => day.profit)} tone={decision.status === 'stop' ? 'terracotta' : 'sage'} /></td>
                    <td><DecisionBadge status={decision.status} label={decision.label} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ads-mobile-list">
            {filtered.map(({ campaign, cpa, roas, decision }) => (
              <button key={campaign.id} type="button" className="ads-mobile-card" onClick={() => onOpenCampaign(campaign)}>
                <div className="ads-mobile-card-head">
                  <StatusDot status={campaign.status} />
                  <strong>{campaign.name}</strong>
                  <DecisionBadge status={decision.status} label={decision.label} />
                </div>
                <div className="ads-mobile-card-grid">
                  <span><em>Spend</em>{formatIdr(campaign.spend)}</span>
                  <span><em>Order</em>{formatNumber(campaign.orders)}</span>
                  <span><em>CPA</em>{cpa === null ? '—' : formatIdr(cpa)}</span>
                  <span><em>ROAS</em>{formatRoas(roas)}</span>
                </div>
                <div className="ads-mobile-card-foot">
                  <span>Budget {formatIdr(campaign.budget)}/hari</span>
                  <span>{formatRoas(campaign.frequency)} freq</span>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada hasil" body="Coba ubah pencarian atau filter status." />
          ) : null}
        </section>
      ) : null}

      {subtab === 'kreatif' ? (
        <div className="ads-grid-2 ads-grid-2-charts">
          <section className="ads-card">
            <div className="ads-section-head">
              <div>
                <h2>Kuadran kreatif</h2>
                <p>CTR × CVR LPV, bubble = spend. Garis = median akun.</p>
              </div>
              <Badge tone="neutral">{creativeRows.length} kreatif</Badge>
            </div>
            <CreativeQuadrant creatives={creatives} />
            <div className="ads-quadrant-key">
              <span><i className="dot-sage" /> Winner</span>
              <span><i className="dot-amber" /> Watch / fatigue</span>
              <span><i className="dot-terra" /> Kill / offer</span>
            </div>
          </section>
          <section className="ads-card">
            <div className="ads-section-head">
              <div>
                <h2>Verdict</h2>
                <p>Jangan menilai sebelum sample cukup.</p>
              </div>
            </div>
            <div className="ads-verdict-list">
              {creativeRows.slice(0, 4).map(({ creative, verdict, fatigue }) => (
                <div key={creative.id} className="ads-verdict-row">
                  <div className="ads-creative-thumb" data-format={creative.format}>
                    {creative.format === 'video' ? 'VID' : 'IMG'}
                  </div>
                  <div>
                    <strong>{creative.name}</strong>
                    <span>{creative.angle}</span>
                  </div>
                  <Badge tone={verdict === 'scale' ? 'sage' : verdict === 'kill' ? 'terracotta' : 'amber'}>
                    {verdict} · {formatPercent(fatigue)}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {subtab === 'kreatif' ? (
        <section className="ads-card ads-card-table">
          <div className="ads-table-meta">
            <span>{creativeRows.length} kreatif</span>
            <span>Sample minimum: 5.000 impressions / 300 outbound click / 25 LPV</span>
          </div>
          <div className="ads-table-wrap">
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Kreatif</th>
                  <th className="num">Spend</th>
                  <th className="num">CTR</th>
                  <th className="num">CVR LPV</th>
                  <th className="num">CPA</th>
                  <th className="num">Freq</th>
                  <th className="num">Hook / hold</th>
                  <th>Fatigue</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {creativeRows.map(({ creative, ctr, cvr, cpa, fatigue, verdict }) => (
                  <tr key={creative.id} onClick={() => onOpenCampaign(campaigns.find((campaign) => campaign.id === creative.campaignId) ?? campaigns[0])}>
                    <td>
                      <div className="ads-table-name">
                        <div className="ads-creative-thumb is-small" data-format={creative.format}>
                          {creative.format === 'video' ? 'VID' : 'IMG'}
                        </div>
                        <div>
                          <strong>{creative.name}</strong>
                          <span>{creative.angle} · {creative.format}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num">{formatIdr(creative.spend)}</td>
                    <td className="num">{formatPercent(ctr)}</td>
                    <td className="num">{formatPercent(cvr)}</td>
                    <td className="num">{cpa === null ? '—' : formatIdr(cpa)}</td>
                    <td className="num">{formatRoas(creative.frequency)}</td>
                    <td className="num">{creative.format === 'video' ? `${formatPercent(creative.hookRate)} / ${formatPercent(creative.holdRate)}` : '—'}</td>
                    <td>
                      <div className="ads-fatigue-bar">
                        <span style={{ width: `${Math.round(fatigue * 100)}%` }} className={fatigue > 0.75 ? 'is-bad' : fatigue > 0.5 ? 'is-warn' : ''} />
                      </div>
                      <small>{formatPercent(fatigue)}</small>
                    </td>
                    <td><Badge tone={verdict === 'scale' ? 'sage' : verdict === 'kill' ? 'terracotta' : 'amber'}>{verdict}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ads-mobile-list">
            {creativeRows.map(({ creative, ctr, cvr, cpa, verdict }) => (
              <div key={creative.id} className="ads-mobile-card">
                <div className="ads-mobile-card-head">
                  <div className="ads-creative-thumb is-small" data-format={creative.format}>{creative.format === 'video' ? 'VID' : 'IMG'}</div>
                  <strong>{creative.name}</strong>
                  <Badge tone={verdict === 'scale' ? 'sage' : verdict === 'kill' ? 'terracotta' : 'amber'}>{verdict}</Badge>
                </div>
                <div className="ads-mobile-card-grid">
                  <span><em>Spend</em>{formatIdr(creative.spend)}</span>
                  <span><em>CTR</em>{formatPercent(ctr)}</span>
                  <span><em>CVR</em>{formatPercent(cvr)}</span>
                  <span><em>CPA</em>{cpa === null ? '—' : formatIdr(cpa)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {subtab === 'breakdown' ? (
        <div className="ads-grid-2 ads-grid-2-charts">
          <section className="ads-card">
            <div className="ads-section-head">
              <div>
                <h2>Breakdown</h2>
                <p>On-demand, cache 6 jam. Bukan sync default.</p>
              </div>
              <Segmented<'age_gender' | 'placement'>
                ariaLabel="Jenis breakdown"
                value={breakdownKey}
                onChange={setBreakdownKey}
                options={DEMO_BREAKDOWN_KEYS.map((item) => ({ value: item.key, label: item.label }))}
              />
            </div>
            <BreakdownBars rows={breakdownRows} valueKey="spend" />
          </section>
          <section className="ads-card ads-card-table">
            <div className="ads-table-meta">
              <span>{breakdownKey === 'age_gender' ? 'Usia & gender' : 'Placement'}</span>
              <Badge tone="amber">Estimasi Meta</Badge>
            </div>
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Segmen</th>
                  <th className="num">Spend</th>
                  <th className="num">Order</th>
                  <th className="num">CPA</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map((row) => (
                  <tr key={row.value}>
                    <td>{row.value}</td>
                    <td className="num">{formatIdr(row.spend)}</td>
                    <td className="num">{formatNumber(row.orders)}</td>
                    <td className="num">{row.orders > 0 ? formatIdr(row.spend / row.orders) : '—'}</td>
                    <td className="num">{formatIdr(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ads-note-line">
              Breakdown tidak tersedia untuk semua metrik off-Meta. <code className="ads-code">reach</code> &gt;13 bulan bisa kosong.
            </div>
          </section>
        </div>
      ) : null}

      <div className="ads-toolbar-foot">
        <span><PauseCircle size={13} /> Aksi dari detail campaign = proposal, bukan eksekusi.</span>
        <span><TrendingUp size={13} /> Klik baris untuk chart & kreatif.</span>
        {subtab !== 'kampanye' ? (
          <Button size="sm" variant="quiet" onClick={() => setSubtab('kampanye')}>
            Kembali ke tabel <ArrowRight size={13} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
