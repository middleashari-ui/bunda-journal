import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Bot,
  Check,
  Code2,
  Database,
  KeyRound,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  WifiOff,
} from 'lucide-react';
import type { AccountInfo, AdsTab, AuditEntry, ParameterField } from '../types';
import { PARAMETER_CATALOG, PARAMETER_GROUPS, PARAMETER_VIEW_DEFAULT } from '../lib/catalog';
import { formatDateTime } from '../lib/format';
import {
  Badge,
  Button,
  ModalShell,
  SectionHeader,
  Segmented,
  SourceBadge,
} from '../components/ui';

type SettingsTab = 'koneksi' | 'sync' | 'guardrail' | 'ai' | 'parameter' | 'audit';

export function SettingsRoute({
  account,
  syncing,
  audit,
  onSync,
  onOpenConnect,
  onOpenStudio,
  onToast,
}: {
  account: AccountInfo;
  syncing: boolean;
  audit: AuditEntry[];
  onSync: () => void;
  onOpenConnect: () => void;
  onOpenStudio: () => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<SettingsTab>('koneksi');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogGroup, setCatalogGroup] = useState('Semua');
  const [visible, setVisible] = useState<Set<string>>(() => new Set(PARAMETER_VIEW_DEFAULT));
  const [synced, setSynced] = useState<Set<string>>(
    () => new Set(PARAMETER_CATALOG.filter((field) => field.sync === 'default').map((field) => field.key))
  );
  const [rawOpen, setRawOpen] = useState(false);
  const [guardrail, setGuardrail] = useState({
    minOrders: 10,
    buffer: 20,
    scalePct: 20,
    frequency: 2.5,
  });
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiBudget, setAiBudget] = useState(25000);

  const filteredCatalog = useMemo(() => {
    const text = catalogQuery.trim().toLowerCase();
    return PARAMETER_CATALOG.filter((field) => {
      if (catalogGroup !== 'Semua' && field.group !== catalogGroup) return false;
      if (!text) return true;
      return field.key.toLowerCase().includes(text) || field.label.toLowerCase().includes(text);
    });
  }, [catalogGroup, catalogQuery]);

  const toggle = (setter: Dispatch<SetStateAction<Set<string>>>, key: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rawJson = JSON.stringify(
    {
      account: {
        name: account.name,
        ad_account_id: account.adAccountId,
        currency: account.currency,
        timezone: account.timezone,
        token: '***redacted***',
        token_last4: 'demo',
      },
      note: 'Raw JSON ini contoh. Di produksi, token tidak pernah ada di response.',
      catalog_version: '2026-11-16',
    },
    null,
    2
  );

  return (
    <div className="ads-page" data-testid="settings-page">
      <div className="ads-page-head">
        <div>
          <span className="ads-eyebrow">Pengaturan</span>
          <h1>Pengaturan</h1>
          <p>Apakah data & akses sehat? Semua perubahan di sini tidak disimpan di browser.</p>
        </div>
        <div className="ads-page-head-meta">
          <Badge tone="amber">Mode demo</Badge>
          <Button size="sm" variant="secondary" onClick={onOpenConnect}>
            <KeyRound size={14} /> Hubungkan Meta
          </Button>
        </div>
      </div>

      <div className="ads-toolbar">
        <Segmented<SettingsTab>
          ariaLabel="Sub-tab Pengaturan"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'koneksi', label: 'Koneksi' },
            { value: 'sync', label: 'Sync' },
            { value: 'guardrail', label: 'Guardrail' },
            { value: 'ai', label: 'AI & Studio' },
            { value: 'parameter', label: 'Parameter' },
            { value: 'audit', label: 'Audit' },
          ]}
        />
      </div>

      {tab === 'koneksi' ? (
        <div className="ads-settings-grid">
          <section className="ads-card">
            <SectionHeader title="Akun Meta" subtitle="Read-only dulu; write action menyusul." action={<Badge tone="amber">Demo</Badge>} />
            <dl className="ads-facts">
              <div><dt>Ad account</dt><dd>{account.adAccountId}</dd></div>
              <div><dt>Nama</dt><dd>{account.name}</dd></div>
              <div><dt>Currency</dt><dd>{account.currency}</dd></div>
              <div><dt>Timezone</dt><dd>{account.timezone}</dd></div>
              <div><dt>Page</dt><dd>{account.pageName}</dd></div>
              <div><dt>Pixel</dt><dd>{account.pixelId}</dd></div>
              <div><dt>Token</dt><dd><Badge tone="terracotta">Belum tersambung</Badge></dd></div>
              <div><dt>Terakhir sync</dt><dd>{formatDateTime(account.lastSync)} WIB</dd></div>
            </dl>
            <div className="ads-inline-actions">
              <Button variant="primary" size="sm" onClick={onOpenConnect}>Tempel System User token</Button>
              <Button variant="secondary" size="sm" onClick={onSync} disabled={syncing}>
                {syncing ? 'Menyinkron…' : 'Sync sekarang'}
              </Button>
            </div>
            <div className="ads-note-line">
              <ShieldCheck size={14} /> Page token tidak bisa membaca Ads Insights. Butuh System User token dari
              Business Manager.
            </div>
          </section>

          <section className="ads-card">
            <SectionHeader title="Jenis koneksi" subtitle="Yang didukung setelah backend aktif." />
            <div className="ads-settings-list">
              <div><strong>System User token</strong><span>Disarankan. Long-lived, read-only.</span><Badge tone="sage">Siap</Badge></div>
              <div><strong>User access token</strong><span>Fallback 60 hari; harus refresh.</span><Badge tone="amber">Fallback</Badge></div>
              <div><strong>Page token</strong><span>Hanya organic Page, bukan Ads.</span><Badge tone="terracotta">Terbatas</Badge></div>
            </div>
            <div className="ads-note-line">
              <KeyRound size={14} /> Token tidak pernah disimpan di localStorage/URL. Di produksi: AES-256-GCM,
              KEK di Worker secret.
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'sync' ? (
        <div className="ads-settings-grid">
          <section className="ads-card">
            <SectionHeader title="Sync & scheduler" subtitle="Data Meta telat 15–30 menit; jangan panik." action={<Badge tone="sage">Aktif (demo)</Badge>} />
            <dl className="ads-facts">
              <div><dt>Mode</dt><dd>Incremental 30 menit</dd></div>
              <div><dt>Sync terakhir</dt><dd>{formatDateTime(account.lastSync)} WIB</dd></div>
              <div><dt>Cron</dt><dd>Worker terpisah · <code className="ads-code">*/30 * * * *</code></dd></div>
              <div><dt>Backfill</dt><dd>30 / 90 / 365 hari, chunk 7 hari</dd></div>
              <div><dt>Retensi</dt><dd>Daily 24 bulan · breakdown 30 hari</dd></div>
              <div><dt>Rate limit</dt><dd>Dev tier 60 score/300 detik</dd></div>
            </dl>
            <div className="ads-inline-actions">
              <Button variant="primary" size="sm" onClick={onSync} disabled={syncing}>{syncing ? 'Menyinkron…' : 'Sync sekarang'}</Button>
              <Button variant="secondary" size="sm" onClick={() => onToast('Backfill 30 hari dimasukkan ke antrean demo.')}>Backfill 30 hari</Button>
              <Button variant="secondary" size="sm" onClick={() => onToast('Backfill 90 hari dimasukkan ke antrean demo.')}>Backfill 90 hari</Button>
            </div>
          </section>
          <section className="ads-card">
            <SectionHeader title="Kesehatan" subtitle="Status yang harus dicek tiap pagi." />
            <div className="ads-health-list">
              <div><span className="ads-dot-sage" /><strong>Token</strong><span>Demo</span></div>
              <div><span className="ads-dot-sage" /><strong>D1</strong><span>OK</span></div>
              <div><span className="ads-dot-amber" /><strong>Cron</strong><span>Belum aktif</span></div>
              <div><span className="ads-dot-sage" /><strong>AI</strong><span>Belum ada key</span></div>
              <div><span className="ads-dot-neutral" /><strong>Studio</strong><span>Offline</span></div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onToast('Health check demo: semua endpoint lokal sehat.')}>Cek health</Button>
          </section>
        </div>
      ) : null}

      {tab === 'guardrail' ? (
        <section className="ads-card">
          <SectionHeader title="Guardrail keputusan" subtitle="AI tidak boleh mengubah ambang ini sendiri." action={<Badge tone="amber">Belum disimpan</Badge>} />
          <div className="ads-form-grid ads-form-grid-4">
            <label className="ads-field"><span>Minimal order</span><input type="number" value={guardrail.minOrders} onChange={(event) => setGuardrail({ ...guardrail, minOrders: Number(event.target.value) })} /></label>
            <label className="ads-field"><span>Buffer Max CPA %</span><input type="number" value={guardrail.buffer} onChange={(event) => setGuardrail({ ...guardrail, buffer: Number(event.target.value) })} /></label>
            <label className="ads-field"><span>Maks scale / aksi %</span><input type="number" value={guardrail.scalePct} onChange={(event) => setGuardrail({ ...guardrail, scalePct: Number(event.target.value) })} /></label>
            <label className="ads-field"><span>Frequency cap</span><input type="number" step="0.1" value={guardrail.frequency} onChange={(event) => setGuardrail({ ...guardrail, frequency: Number(event.target.value) })} /></label>
          </div>
          <div className="ads-guard-summary">
            <div><span>Kill rule</span><strong>Spend &gt;2× Max CPA tanpa order (48 jam)</strong></div>
            <div><span>Scale rule</span><strong>ROAS 7d ≥1,2× BE · CPA ≤ Max · freq &lt;2,5</strong></div>
            <div><span>Scale step</span><strong>+{guardrail.scalePct}% / hari, 48–72 jam</strong></div>
            <div><span>Sample</span><strong>{guardrail.minOrders} order · 5.000 impr · 300 click</strong></div>
          </div>
          <Button variant="primary" size="sm" onClick={() => onToast('Guardrail demo diperbarui (tidak disimpan).')}>Simpan guardrail</Button>
        </section>
      ) : null}

      {tab === 'ai' ? (
        <div className="ads-settings-grid">
          <section className="ads-card">
            <SectionHeader title="Analis" subtitle="Cloud analyst, grounded ke data D1." action={<Badge tone="amber">Belum ada key</Badge>} />
            <div className="ads-form-grid">
              <label className="ads-field">
                <span>Provider</span>
                <select value={aiProvider} onChange={(event) => setAiProvider(event.target.value)}>
                  <option value="gemini">Gemini</option>
                  <option value="muse">Muse</option>
                  <option value="9router">9Router lokal</option>
                </select>
              </label>
              <label className="ads-field">
                <span>Budget harian (Rp)</span>
                <input type="number" value={aiBudget} onChange={(event) => setAiBudget(Number(event.target.value))} />
              </label>
            </div>
            <div className="ads-note-line">
              <Bot size={14} /> Panel Analis saat ini memakai jawaban rule-based dari data demo. Saat key masuk,
              tool contract tetap read-only + sitasi query_id.
            </div>
            <div className="ads-inline-actions">
              <Button variant="secondary" size="sm" onClick={() => onToast('Test prompt: analis demo siap. Cek panel Analis.')}>Test prompt</Button>
              <Button variant="quiet" size="sm" onClick={() => onToast(`Budget AI demo: ${new Intl.NumberFormat('id-ID').format(aiBudget)}/hari.`)}>Cek budget</Button>
            </div>
          </section>

          <section className="ads-card">
            <SectionHeader title="Studio OpenCode" subtitle="Lokal, read-only + proposal." action={<Badge tone="neutral">Offline</Badge>} />
            <div className="ads-studio-status">
              <div className="ads-studio-status-icon"><WifiOff size={18} /></div>
              <div>
                <strong>Bridge belum jalan</strong>
                <p>Jalankan <code className="ads-code">npm run ads:studio</code> di laptop. Dashboard tetap aman.</p>
              </div>
            </div>
            <div className="ads-studio-block">
              <span className="ads-eyebrow"><Terminal size={13} /> Perintah</span>
              <pre><code>npm run ads:studio</code></pre>
            </div>
            <div className="ads-inline-actions">
              <Button variant="primary" size="sm" onClick={onOpenStudio}><Code2 size={14} /> Buka panel Studio</Button>
              <Button variant="secondary" size="sm" onClick={() => onToast('Copy context tersedia di panel Studio.')}>Copy context</Button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'parameter' ? (
        <section className="ads-card ads-card-table">
          <SectionHeader
            title="Katalog parameter"
            subtitle="180+ field. Sync ≠ display; jangan tarik semua sekaligus."
            action={<Badge tone="neutral">{filteredCatalog.length} field</Badge>}
          />
          <div className="ads-toolbar">
            <label className="ads-search">
              <Search size={15} />
              <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Cari field, mis. budget…" aria-label="Cari parameter" />
            </label>
            <div className="ads-toolbar-actions">
              <select className="ads-inline-select" value={catalogGroup} onChange={(event) => setCatalogGroup(event.target.value)} aria-label="Filter grup parameter">
                <option>Semua</option>
                {PARAMETER_GROUPS.map((group) => <option key={group}>{group}</option>)}
              </select>
              <Button variant="secondary" size="sm" onClick={() => setRawOpen(true)}><Database size={14} /> Raw JSON</Button>
            </div>
          </div>
          <div className="ads-table-wrap">
            <table className="ads-table">
              <thead>
                <tr><th>Field</th><th>Grup</th><th>Sync</th><th>Tampil</th><th>Catatan</th></tr>
              </thead>
              <tbody>
                {filteredCatalog.map((field: ParameterField) => (
                  <tr key={field.key}>
                    <td><code className="ads-code">{field.key}</code><div className="ads-muted">{field.label}</div></td>
                    <td><Badge tone="neutral">{field.group}</Badge></td>
                    <td>
                      <label className="ads-check">
                        <input type="checkbox" checked={synced.has(field.key)} onChange={() => toggle(setSynced, field.key)} />
                        <span>{synced.has(field.key) ? 'sync' : '—'}</span>
                      </label>
                    </td>
                    <td>
                      <label className="ads-check">
                        <input type="checkbox" checked={visible.has(field.key)} onChange={() => toggle(setVisible, field.key)} />
                        <span>{visible.has(field.key) ? 'tampil' : 'picker'}</span>
                      </label>
                    </td>
                    <td className="ads-muted">{field.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ads-mobile-list">
            {filteredCatalog.slice(0, 40).map((field) => (
              <div key={field.key} className="ads-mobile-card">
                <div className="ads-mobile-card-head"><code className="ads-code">{field.key}</code><Badge tone="neutral">{field.group}</Badge></div>
                <div className="ads-mobile-card-grid">
                  <span><em>Sync</em>{synced.has(field.key) ? 'ya' : 'tidak'}</span>
                  <span><em>Tampil</em>{visible.has(field.key) ? 'ya' : 'picker'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ads-note-line">
            <SlidersHorizontal size={14} /> Mengubah sync field memicu konfirmasi + re-sync di produksi.
            Raw JSON tidak berisi token.
          </div>
        </section>
      ) : null}

      {tab === 'audit' ? (
        <section className="ads-card">
          <SectionHeader title="Audit log" subtitle="Append-only. Actor, aksi, target, waktu." action={<Badge tone="neutral">{audit.length}</Badge>} />
          <div className="ads-audit-list">
            {audit.map((entry) => (
              <div key={entry.id} className="ads-audit-row">
                <div className="ads-audit-icon"><Check size={14} /></div>
                <div>
                  <strong>{entry.action}</strong>
                  <span>{entry.actor} · {entry.target}</span>
                  <p>{entry.detail}</p>
                </div>
                <time>{formatDateTime(entry.createdAt)}</time>
              </div>
            ))}
          </div>
          <div className="ads-inline-actions">
            <Button variant="secondary" size="sm" onClick={() => onToast('Audit demo: 3 entri. Export belum aktif.')}>Export audit</Button>
            <Button variant="quiet" size="sm" onClick={() => onToast('Audit tidak bisa diedit/dihapus dari UI.')}>Kenapa append-only?</Button>
          </div>
        </section>
      ) : null}

      <div className="ads-note-line">
        <RotateCcw size={14} /> Semua pengaturan di halaman ini hanya untuk demo. Token dan key tidak
        disimpan. <SourceBadge source="manual" />
      </div>

      {rawOpen ? (
        <ModalShell title="Raw JSON" subtitle="Contoh payload tanpa token." onClose={() => setRawOpen(false)} wide>
          <pre className="ads-json"><code>{rawJson}</code></pre>
        </ModalShell>
      ) : null}
    </div>
  );
}
