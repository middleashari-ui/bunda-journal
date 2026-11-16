import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, FileSpreadsheet, Info, Upload, Wallet } from 'lucide-react';
import type { AdsTab, Campaign, Order, ProductEconomics, RangeSummary } from '../types';
import { productEconomics, reconcile } from '../lib/calculators';
import { formatDate, formatDateTime, formatIdr, formatNumber, formatPercent, formatRoas } from '../lib/format';
import { ordersToCsv, parseOrdersCsv } from '../lib/csv';
import { campaignForRange } from '../data/demo';
import {
  Badge,
  Button,
  EmptyState,
  MetricTile,
  Segmented,
  SourceBadge,
  StatusDot,
} from '../components/ui';

type SubTab = 'produk' | 'order' | 'rekonsiliasi';

const PRODUCT_NAMES: Record<string, string> = {
  essential: 'Essential',
  vip: 'VIP',
  upgrade_vip: 'Upgrade VIP',
  hardcover: 'Hardcover',
};

function statusTone(status: Order['status']): 'sage' | 'amber' | 'terracotta' | 'neutral' {
  if (status === 'paid') return 'sage';
  if (status === 'pending') return 'amber';
  if (status === 'refunded') return 'terracotta';
  return 'neutral';
}

export function MoneyRoute({
  summary,
  campaigns,
  products,
  orders,
  onProductsChange,
  onImportOrders,
  onNavigate,
}: {
  summary: RangeSummary;
  campaigns: Campaign[];
  products: ProductEconomics[];
  orders: Order[];
  onProductsChange: (products: ProductEconomics[]) => void;
  onImportOrders: (orders: Order[]) => { added: number; duplicates: number };
  onNavigate: (tab: AdsTab) => void;
}) {
  const [subtab, setSubtab] = useState<SubTab>('produk');
  const [importError, setImportError] = useState('');
  const [importNote, setImportNote] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<'all' | Order['status']>('all');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const updateProduct = (id: string, patch: Partial<ProductEconomics>) => {
    onProductsChange(products.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  };

  const rangeOrders = useMemo(() => {
    const text = orderQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderStatus !== 'all' && order.status !== orderStatus) return false;
      if (!text) return true;
      return (
        order.externalOrderId.toLowerCase().includes(text) ||
        (PRODUCT_NAMES[order.productId] ?? order.productId).toLowerCase().includes(text) ||
        (order.campaignId ?? '').toLowerCase().includes(text)
      );
    });
  }, [orderQuery, orderStatus, orders]);

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.count += 1;
        if (order.status === 'paid') {
          acc.paid += 1;
          acc.gross += order.gross;
          acc.net += order.net;
        }
        if (order.status === 'refunded') acc.refunded += 1;
        return acc;
      },
      { count: 0, paid: 0, refunded: 0, gross: 0, net: 0 }
    );
  }, [orders]);

  const metaRevenue = summary.platformRevenue;
  const bankRevenue = orders
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + order.gross, 0);
  const bankOrders = orders.filter((order) => order.status === 'paid').length;
  const recon = reconcile({
    spend: summary.spend,
    metaOrders: summary.platformOrders,
    metaRevenue,
    bankOrders,
    bankRevenue,
  });

  const byDay = summary.daily.map((day) => {
    const bank = orders.filter(
      (order) => order.paidAt.slice(0, 10) === day.date && order.status === 'paid'
    );
    return {
      date: day.date,
      meta: day.platformOrders,
      bank: bank.length,
      gap: bank.length > 0 ? (day.platformOrders - bank.length) / bank.length : null,
    };
  });

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError('');
    setImportNote('');
    try {
      const text = await file.text();
      const parsed = parseOrdersCsv(text);
      if (parsed.errors.length > 0) {
        setImportError(parsed.errors.slice(0, 4).join(' '));
        return;
      }
      const result = onImportOrders(parsed.orders);
      setImportNote(
        `Berhasil import ${result.added} order${result.duplicates > 0 ? `, ${result.duplicates} duplikat dilewati` : ''}.`
      );
    } catch {
      setImportError('File tidak bisa dibaca. Pastikan CSV UTF-8 dan tidak terkunci.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadOrders = () => {
    const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bunda-journal-orders-${summary.days}d.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ads-page" data-testid="money-page">
      <div className="ads-page-head">
        <div>
          <span className="ads-eyebrow">Uang · {summary.days} hari</span>
          <h1>Uang</h1>
          <p>Berapa CPA yang masih boleh saya bayar, dan apakah uangnya cocok?</p>
        </div>
        <div className="ads-page-head-meta">
          <Badge tone="amber">Mode demo</Badge>
          <SourceBadge source="bank" />
        </div>
      </div>

      <div className="ads-toolbar">
        <Segmented<SubTab>
          ariaLabel="Sub-tab Uang"
          value={subtab}
          onChange={setSubtab}
          options={[
            { value: 'produk', label: 'Produk' },
            { value: 'order', label: 'Order' },
            { value: 'rekonsiliasi', label: 'Rekonsiliasi' },
          ]}
        />
      </div>

      {subtab === 'produk' ? (
        <>
          <div className="ads-kpis">
            {products.slice(0, 4).map((product) => {
              const econ = productEconomics(product, 0.2);
              return (
                <MetricTile
                  key={product.id}
                  label={`${product.name} · Max CPA`}
                  value={formatIdr(econ.maxCpa)}
                  note={`BE ROAS ${formatRoas(econ.beRoas)} · margin ${formatPercent(econ.marginPct)}`}
                  tone={econ.contribution > 0 ? 'sage' : 'terracotta'}
                />
              );
            })}
          </div>

          <section className="ads-card ads-card-table">
            <div className="ads-table-meta">
              <span>Unit economics per produk</span>
              <span>Ubah angka di sini → semua kalkulator ikut berubah.</span>
            </div>
            <div className="ads-table-wrap">
              <table className="ads-table ads-product-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className="num">Harga</th>
                    <th className="num">COGS</th>
                    <th className="num">Ongkir</th>
                    <th className="num">Fee %</th>
                    <th className="num">Refund %</th>
                    <th>Pajak</th>
                    <th className="num">Kontribusi</th>
                    <th className="num">BE ROAS</th>
                    <th className="num">Max CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const econ = productEconomics(product, 0.2);
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="ads-table-name">
                            <strong>{product.name}</strong>
                            {product.assumption ? <span className="ads-assumption-inline">{product.assumption}</span> : null}
                          </div>
                        </td>
                        <td className="num"><input className="ads-inline-input" type="number" aria-label={`Harga ${product.name}`} value={product.price} onChange={(event) => updateProduct(product.id, { price: Number(event.target.value) })} /></td>
                        <td className="num"><input className="ads-inline-input" type="number" aria-label={`COGS ${product.name}`} value={product.cogs} onChange={(event) => updateProduct(product.id, { cogs: Number(event.target.value) })} /></td>
                        <td className="num"><input className="ads-inline-input" type="number" aria-label={`Ongkir ${product.name}`} value={product.shipping} onChange={(event) => updateProduct(product.id, { shipping: Number(event.target.value) })} /></td>
                        <td className="num"><input className="ads-inline-input" type="number" aria-label={`Fee persen ${product.name}`} step="0.1" value={(product.feePct * 100).toFixed(1)} onChange={(event) => updateProduct(product.id, { feePct: Number(event.target.value) / 100 })} /></td>
                        <td className="num"><input className="ads-inline-input" type="number" aria-label={`Refund persen ${product.name}`} step="0.1" value={(product.refundPct * 100).toFixed(1)} onChange={(event) => updateProduct(product.id, { refundPct: Number(event.target.value) / 100 })} /></td>
                        <td>
                          <select className="ads-inline-select" aria-label={`Mode pajak ${product.name}`} value={product.taxMode} onChange={(event) => updateProduct(product.id, { taxMode: event.target.value as ProductEconomics['taxMode'] })}>
                            <option value="none">Non-PKP</option>
                            <option value="inclusive">Incl PPN</option>
                            <option value="exclusive">Excl PPN</option>
                          </select>
                        </td>
                        <td className={`num ${econ.contribution <= 0 ? 'is-negative' : ''}`}>{formatIdr(econ.contribution)}</td>
                        <td className="num">{formatRoas(econ.beRoas)}</td>
                        <td className="num"><strong>{formatIdr(econ.maxCpa)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ads-note-line">
              <Info size={14} /> COGS hardcover Rp120rb + ongkir Rp20rb masih asumsi. Upgrade VIP → hardcover
              +Rp120rb bisa rugi Rp23.240/order — validasi sebelum dijual.
            </div>
          </section>
        </>
      ) : null}

      {subtab === 'order' ? (
        <>
          <div className="ads-kpis">
            <MetricTile label="Order di data" value={formatNumber(totals.count)} source="bank" />
            <MetricTile label="Paid" value={formatNumber(totals.paid)} source="bank" tone="sage" />
            <MetricTile label="Refunded" value={formatNumber(totals.refunded)} source="bank" tone={totals.refunded > 0 ? 'terracotta' : 'neutral'} />
            <MetricTile label="Revenue paid" value={formatIdr(totals.gross)} source="bank" note={`Net ${formatIdr(totals.net)}`} />
          </div>

          <section className="ads-card ads-card-table">
            <div className="ads-toolbar">
              <label className="ads-search">
                <FileSpreadsheet size={15} />
                <input value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Cari order / produk…" aria-label="Cari order" />
              </label>
              <div className="ads-toolbar-actions">
                <select className="ads-inline-select" value={orderStatus} onChange={(event) => setOrderStatus(event.target.value as typeof orderStatus)} aria-label="Filter status order">
                  <option value="all">Semua status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => importFile(event.target.files?.[0])} />
                <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload size={14} /> Import CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={downloadOrders}>
                  <Download size={14} /> Export
                </Button>
              </div>
            </div>
            {importError ? <div className="ads-inline-error" role="alert">{importError}</div> : null}
            {importNote ? <div className="ads-inline-success" role="status">{importNote}</div> : null}
            <div className="ads-table-meta">
              <span>{rangeOrders.length} baris</span>
              <span>CSV minimal: order_id, product, gross, status, paid_at</span>
            </div>
            {rangeOrders.length === 0 ? (
              <EmptyState title="Tidak ada order" body="Ubah filter atau import CSV Midtrans/bank." />
            ) : (
              <>
                <div className="ads-table-wrap">
                  <table className="ads-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Produk</th>
                        <th>Status</th>
                        <th className="num">Gross</th>
                        <th className="num">Fee</th>
                        <th className="num">Net</th>
                        <th>Sumber</th>
                        <th>Match</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangeOrders.slice(0, 60).map((order) => (
                        <tr key={order.id}>
                          <td><code className="ads-code">{order.externalOrderId}</code></td>
                          <td>{PRODUCT_NAMES[order.productId] ?? order.productId}</td>
                          <td><Badge tone={statusTone(order.status)}>{order.status}</Badge></td>
                          <td className="num">{formatIdr(order.gross)}</td>
                          <td className="num">{formatIdr(order.fee)}</td>
                          <td className="num">{formatIdr(order.net)}</td>
                          <td><Badge tone="neutral">{order.source}</Badge></td>
                          <td><Badge tone={order.matchMethod === 'utm' ? 'sage' : 'amber'}>{order.matchMethod}</Badge></td>
                          <td>{formatDateTime(order.paidAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ads-mobile-list">
                  {rangeOrders.slice(0, 30).map((order) => (
                    <div key={order.id} className="ads-mobile-card">
                      <div className="ads-mobile-card-head">
                        <code className="ads-code">{order.externalOrderId}</code>
                        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      </div>
                      <div className="ads-mobile-card-grid">
                        <span><em>Produk</em>{PRODUCT_NAMES[order.productId] ?? order.productId}</span>
                        <span><em>Gross</em>{formatIdr(order.gross)}</span>
                        <span><em>Net</em>{formatIdr(order.net)}</span>
                        <span><em>Match</em>{order.matchMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ads-note-line">Menampilkan 60 baris pertama. Export CSV untuk semua.</div>
              </>
            )}
          </section>
        </>
      ) : null}

      {subtab === 'rekonsiliasi' ? (
        <>
          <div className="ads-kpis">
            <MetricTile label="Meta order" value={formatNumber(summary.platformOrders)} source="meta" note={formatIdr(metaRevenue)} />
            <MetricTile label="Bank order" value={formatNumber(bankOrders)} source="bank" note={formatIdr(bankRevenue)} />
            <MetricTile
              label="Gap order"
              value={recon.gapOrdersPct === null ? '—' : formatPercent(recon.gapOrdersPct)}
              tone={recon.gapOrdersPct !== null && recon.gapOrdersPct > 0.2 ? 'terracotta' : 'sage'}
              note="Meta vs bank"
            />
            <MetricTile label="CPA bank" value={recon.cpaBank === null ? '—' : formatIdr(recon.cpaBank)} source="bank" note={`MER ${formatRoas(recon.mer)}`} />
          </div>

          <div className="ads-grid-2">
            <section className="ads-card">
              <div className="ads-section-head">
                <div>
                  <h2>Gap harian</h2>
                  <p>Kalau gap &gt;20%, perbaiki tracking sebelum scale.</p>
                </div>
                <Badge tone={recon.gapOrdersPct !== null && recon.gapOrdersPct > 0.2 ? 'terracotta' : 'sage'}>
                  {recon.gapOrdersPct === null ? '—' : formatPercent(recon.gapOrdersPct)}
                </Badge>
              </div>
              <div className="ads-gap-table">
                {byDay.slice(-10).map((day) => (
                  <div key={day.date} className="ads-gap-row">
                    <span>{formatDate(day.date)}</span>
                    <span>Meta {day.meta}</span>
                    <span>Bank {day.bank}</span>
                    <strong className={day.gap !== null && day.gap > 0.2 ? 'is-negative' : ''}>
                      {day.gap === null ? '—' : formatPercent(day.gap)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="ads-card">
              <div className="ads-section-head">
                <div>
                  <h2>Yang belum cocok</h2>
                  <p>Jangan menimpa angka bank dengan Meta.</p>
                </div>
              </div>
              <div className="ads-unmatched">
                <div>
                  <Wallet size={16} />
                  <div>
                    <strong>{orders.filter((order) => order.matchMethod === 'unmatched').length} order bank belum match</strong>
                    <p>Gunakan UTM/fbclid atau match manual. Order WA bisa ditandai organic.</p>
                  </div>
                </div>
                <div>
                  <Info size={16} />
                  <div>
                    <strong>Calibration {recon.calibration === null ? '—' : recon.calibration.toFixed(2)}</strong>
                    <p>Hanya untuk forecast, bukan koreksi data. Jangan dipakai untuk CPA aktual.</p>
                  </div>
                </div>
              </div>
              <div className="ads-recon-note">
                {recon.gapOrdersPct !== null && recon.gapOrdersPct > 0.2
                  ? 'Meta overclaim >20%. Cek CAPI, view-through, dan order WA sebelum menaikkan budget.'
                  : 'Gap dalam toleransi. Tetap pakai CPA bank untuk keputusan.'}
              </div>
              <div className="ads-inline-actions">
                <Button variant="secondary" size="sm" onClick={() => setSubtab('order')}>
                  Import order <ArrowRight size={13} />
                </Button>
                <Button variant="quiet" size="sm" onClick={() => onNavigate('plan')}>
                  Buka cashflow <ArrowRight size={13} />
                </Button>
              </div>
            </section>
          </div>

          <section className="ads-card">
            <div className="ads-section-head">
              <div>
                <h2>Per campaign</h2>
                <p>Bandingkan order bank vs platform; CPA bank jadi dasar keputusan.</p>
              </div>
            </div>
            <div className="ads-table-wrap">
              <table className="ads-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th className="num">Spend</th>
                    <th className="num">Meta order</th>
                    <th className="num">Bank order</th>
                    <th className="num">Gap</th>
                    <th className="num">CPA bank</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const ranged = campaignForRange(campaign, summary.days);
                    const campaignBank = orders.filter((order) => order.campaignId === campaign.id && order.status === 'paid').length;
                    const gap = campaignBank > 0 ? (ranged.platformOrders - campaignBank) / campaignBank : null;
                    return (
                      <tr key={campaign.id}>
                        <td><div className="ads-table-name"><StatusDot status={campaign.status} /><strong>{campaign.name}</strong></div></td>
                        <td className="num">{formatIdr(ranged.spend)}</td>
                        <td className="num">{formatNumber(ranged.platformOrders)}</td>
                        <td className="num">{formatNumber(campaignBank)}</td>
                        <td className={`num ${gap !== null && gap > 0.2 ? 'is-negative' : ''}`}>{gap === null ? '—' : formatPercent(gap)}</td>
                        <td className="num">{campaignBank > 0 ? formatIdr(ranged.spend / campaignBank) : '—'}</td>
                        <td><Badge tone={gap !== null && gap > 0.2 ? 'terracotta' : 'sage'}>{gap !== null && gap > 0.2 ? 'Cek tracking' : 'OK'}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
