import { useState } from 'react';
import { Check, Clipboard, Code2, Terminal, WifiOff } from 'lucide-react';
import type { Campaign, ProductEconomics, RangeSummary } from '../types';
import { copyText, formatIdr, formatNumber } from '../lib/format';
import { Badge, Button, DrawerShell } from './ui';

export function StudioPanel({
  onClose,
  onToast,
  summary,
  campaigns,
  products,
}: {
  onClose: () => void;
  onToast: (message: string) => void;
  summary: RangeSummary;
  campaigns: Campaign[];
  products: ProductEconomics[];
}) {
  const [copied, setCopied] = useState(false);

  const context = [
    'Kamu adalah analis Meta Ads Bunda Journal.',
    `Scope: ${summary.days} hari terakhir, ${summary.orders} order bank, spend ${formatIdr(summary.spend)}.`,
    'Sumber kebenaran: order bank/Midtrans. Metrik Meta hanya pembanding.',
    'Gunakan CALCULATOR-SPEC.md dan META-PARAMETERS.md. Jangan mengarang angka.',
    'Jangan pernah meminta token, email pembeli, atau data pribadi.',
    'Format: Kesimpulan / Bukti / Risiko / Aksi / Data.',
    '',
    'Produk:',
    ...products.map(
      (product) =>
        `- ${product.name}: harga ${formatIdr(product.price)}, COGS ${formatIdr(product.cogs)}, ongkir ${formatIdr(product.shipping)}`
    ),
    '',
    'Campaign:',
    ...campaigns.map(
      (campaign) =>
        `- ${campaign.name}: spend ${formatIdr(campaign.spend)}, order ${formatNumber(campaign.orders)}, revenue ${formatIdr(campaign.revenue)}, status ${campaign.status}`
    ),
    '',
    'Pertanyaan: ',
  ].join('\n');

  const copy = async () => {
    await copyText(context);
    setCopied(true);
    onToast('Context disalin. Tempel di OpenCode TUI.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DrawerShell
      title="Studio OpenCode"
      subtitle="Kerja kode & otomasi dari dashboard."
      onClose={onClose}
      testId="studio-panel"
      footer={
        <div className="ads-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="primary" onClick={copy}>
            {copied ? <Check size={15} /> : <Clipboard size={15} />} Copy context
          </Button>
        </div>
      }
    >
      <div className="ads-studio">
        <div className="ads-studio-status">
          <div className="ads-studio-status-icon">
            <WifiOff size={18} />
          </div>
          <div>
            <strong>Studio offline</strong>
            <p>Bridge lokal belum jalan. Dashboard tetap berfungsi; copy context selalu tersedia.</p>
          </div>
          <Badge tone="neutral">Lokal</Badge>
        </div>

        <div className="ads-studio-block">
          <span className="ads-eyebrow">
            <Terminal size={13} /> Jalankan di laptop
          </span>
          <pre>
            <code>npm run ads:studio</code>
          </pre>
          <p>
            Perintah ini menjalankan bridge di <code>127.0.0.1:4097</code> dan menyambung ke
            OpenCode. Di produksi, akses lewat localhost atau Cloudflare Tunnel — bukan langsung
            dari halaman HTTPS.
          </p>
        </div>

        <div className="ads-studio-block">
          <span className="ads-eyebrow">
            <Code2 size={13} /> Yang bisa dilakukan Studio
          </span>
          <ul className="ads-bullets">
            <li>Baca konteks akun & kalkulator lewat MCP read-only.</li>
            <li>Buat worktree, ubah kode dashboard, jalankan tes.</li>
            <li>Lihat diff dan minta merge — approval tetap di tangan owner.</li>
            <li>Tidak pernah memegang token Meta atau <code className="ads-code">.env</code>.</li>
          </ul>
        </div>

        <div className="ads-studio-block">
          <span className="ads-eyebrow">Tool yang tersedia (rencana)</span>
          <div className="ads-chip-wrap">
            {[
              'ads_get_overview',
              'ads_list_campaigns',
              'ads_query_insights',
              'ads_list_creatives',
              'ads_get_alerts',
              'ads_reconcile',
              'calc_run',
              'calc_compare',
              'action_propose',
              'audit_search',
            ].map((tool) => (
              <code key={tool} className="ads-code-chip">
                {tool}
              </code>
            ))}
          </div>
        </div>

        <div className="ads-connect-note">
          <Code2 size={17} />
          <div>
            <strong>Fallback universal</strong>
            <p>
              Kalau OpenCode tidak terpasang, tombol Copy context menghasilkan prompt + snapshot
              agregat yang bisa ditempel di OpenCode TUI. Tidak ada token atau PII di clipboard.
            </p>
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}
