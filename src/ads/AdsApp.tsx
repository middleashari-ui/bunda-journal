import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calculator,
  ChevronDown,
  Code2,
  Home,
  Megaphone,
  Moon,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import type {
  AccountInfo,
  AdsDateRange,
  AdsTab,
  AlertItem,
  ApprovalProposal,
  AuditEntry,
  Campaign,
  Order,
  ProductEconomics,
  Scenario,
} from './types';
import {
  DEMO_ACCOUNT,
  DEMO_ALERTS,
  DEMO_AUDIT,
  DEMO_CREATIVES,
  DEMO_PRODUCTS,
  buildDemoCampaigns,
  buildDemoOrders,
  campaignForRange,
  filterOrders,
  summarizePreviousRange,
  summarizeRange,
} from './data/demo';
import { formatDateTime } from './lib/format';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { storageGet, storageSet } from '../lib/storage/appStorage';
import { AdsRoute } from './routes/Ads';
import { MoneyRoute } from './routes/Money';
import { PlanRoute } from './routes/Plan';
import { PulseRoute } from './routes/Pulse';
import { SettingsRoute } from './routes/Settings';
import { AnalystPanel } from './components/AnalystPanel';
import { ApprovalModal } from './components/ApprovalModal';
import { CampaignDrawer } from './components/CampaignDrawer';
import { ConnectModal } from './components/ConnectModal';
import { StudioPanel } from './components/StudioPanel';
import { Badge, Button, IconButton, Toast } from './components/ui';
import './ads.css';

const NAV: { tab: AdsTab; label: string; icon: typeof Home }[] = [
  { tab: 'pulse', label: 'Hari Ini', icon: Home },
  { tab: 'ads', label: 'Iklan', icon: Megaphone },
  { tab: 'money', label: 'Uang', icon: Wallet },
  { tab: 'plan', label: 'Rencana', icon: Calculator },
  { tab: 'settings', label: 'Pengaturan', icon: Settings },
];

const TITLES: Record<AdsTab, string> = {
  pulse: 'Hari Ini',
  ads: 'Iklan',
  money: 'Uang',
  plan: 'Rencana',
  settings: 'Pengaturan',
};

type Theme = 'light' | 'dark';
const THEME_KEY = 'bunda_ads_theme';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  // storageGet sudah menangani localStorage yang diblokir/penuh.
  const saved = storageGet(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readTab(): AdsTab {
  if (typeof window === 'undefined') return 'pulse';
  const path = window.location.pathname.replace(/\/+$/, '');
  const segment = path.split('/')[2];
  if (segment === 'iklan' || segment === 'ads') return 'ads';
  if (segment === 'uang' || segment === 'money') return 'money';
  if (segment === 'rencana' || segment === 'plan') return 'plan';
  if (segment === 'pengaturan' || segment === 'settings') return 'settings';
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab === 'ads' || tab === 'money' || tab === 'plan' || tab === 'settings') return tab;
  return 'pulse';
}

function readRange(): AdsDateRange {
  if (typeof window === 'undefined') return 7;
  const value = Number(new URLSearchParams(window.location.search).get('range'));
  if (value === 14 || value === 30) return value as AdsDateRange;
  return 7;
}

const TAB_PATH: Record<AdsTab, string> = {
  pulse: '/ads',
  ads: '/ads/iklan',
  money: '/ads/uang',
  plan: '/ads/rencana',
  settings: '/ads/pengaturan',
};

function writeUrl(tab: AdsTab, range: AdsDateRange) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const path = TAB_PATH[tab];
  if (range === 7) url.searchParams.delete('range');
  else url.searchParams.set('range', String(range));
  url.searchParams.delete('tab');
  window.history.pushState({ tab, range }, '', `${path}${url.search}`);
}

function buildPauseProposal(campaign: Campaign): ApprovalProposal {
  return {
    id: `act_${campaign.id}_${Date.now()}`,
    type: 'pause',
    targetId: campaign.id,
    targetName: campaign.name,
    beforeLabel: 'Aktif',
    afterLabel: 'Jeda',
    reason:
      campaign.orders === 0
        ? `Spend ${campaign.spend.toLocaleString('id-ID')} tanpa order bank; melewati guardrail 2× Max CPA.`
        : 'Performa di bawah guardrail; hentikan sementara untuk menghentikan kerugian.',
    downside: 'Iklan berhenti; tidak ada order baru dari campaign ini sampai diaktifkan lagi.',
    impactPct: 0,
    requestedBy: 'AI',
  };
}

function buildScaleProposal(campaign: Campaign): ApprovalProposal {
  const next = Math.round((campaign.budget * 1.2) / 1000) * 1000;
  return {
    id: `act_${campaign.id}_${Date.now()}`,
    type: 'budget',
    targetId: campaign.id,
    targetName: campaign.name,
    beforeLabel: `Rp${campaign.budget.toLocaleString('id-ID')}/hari`,
    afterLabel: `Rp${next.toLocaleString('id-ID')}/hari`,
    reason: 'CPA bank di bawah Max CPA dan frequency masih rendah. Uji kenaikan bertahap, bukan 2×.',
    downside: 'Jika CPA naik 20%, laba bisa turun. Pantau 48–72 jam sebelum perubahan berikutnya.',
    impactPct: 20,
    requestedBy: 'AI',
  };
}

export default function AdsApp() {
  const [tab, setTab] = useState<AdsTab>(readTab);
  const [range, setRange] = useState<AdsDateRange>(readRange);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => buildDemoCampaigns());
  const [products, setProducts] = useState<ProductEconomics[]>(DEMO_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(() => buildDemoOrders(buildDemoCampaigns()));
  const [alerts, setAlerts] = useState<AlertItem[]>(DEMO_ALERTS);
  const [audit, setAudit] = useState<AuditEntry[]>(DEMO_AUDIT);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [account, setAccount] = useState<AccountInfo>(DEMO_ACCOUNT);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalProposal | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');
  const syncTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const creatives = DEMO_CREATIVES;
  const summary = useMemo(() => summarizeRange(campaigns, range), [campaigns, range]);
  const previous = useMemo(() => summarizePreviousRange(campaigns, range), [campaigns, range]);
  const rangeCampaigns = useMemo(() => campaigns.map((campaign) => campaignForRange(campaign, range)), [campaigns, range]);
  const rangeOrders = useMemo(() => filterOrders(orders, range), [orders, range]);
  const selectedBaseCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const selectedCampaign = selectedBaseCampaign
    ? campaignForRange(selectedBaseCampaign, range)
    : null;
  const unreadAlerts = alerts.filter((alert) => !alert.ack).length;

  useEffect(() => {
    const onPop = () => {
      setTab(readTab());
      setRange(readRange());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimer.current !== null) window.clearTimeout(syncTimer.current);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setApproval(null);
        setConnectOpen(false);
        setStudioOpen(false);
        setAiOpen(false);
        setSelectedCampaignId(null);
        setBellOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast('');
      toastTimer.current = null;
    }, 3600);
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Kalau gagal (storage diblokir), tema tetap berlaku untuk sesi ini.
    storageSet(THEME_KEY, next);
  };

  const navigate = (next: AdsTab) => {
    setTab(next);
    writeUrl(next, range);
    setAiOpen(false);
    setStudioOpen(false);
    setBellOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeRange = (next: AdsDateRange) => {
    setRange(next);
    writeUrl(tab, next);
  };

  const syncNow = () => {
    if (syncing) return;
    setSyncing(true);
    if (syncTimer.current !== null) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      setSyncing(false);
      const now = new Date().toISOString();
      setAccount((current) => ({ ...current, lastSync: now }));
      setAudit((current) => [
        {
          id: `audit_sync_${Date.now()}`,
          actor: 'system@demo',
          action: 'sync.manual',
          target: account.adAccountId,
          detail: `Sync demo sukses. ${campaigns.length} campaign, ${rangeOrders.length} order.`,
          createdAt: now,
        },
        ...current,
      ]);
      showToast('Sync demo selesai · 6 campaign · 0 error');
      syncTimer.current = null;
    }, 850);
  };

  const openCampaign = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id);
    setAiOpen(false);
  };

  const requestPause = (campaign: Campaign) => setApproval(buildPauseProposal(campaign));
  const requestScale = (campaign: Campaign) => setApproval(buildScaleProposal(campaign));

  const approve = (proposal: ApprovalProposal) => {
    setCampaigns((current) =>
      current.map((campaign) => {
        if (campaign.id !== proposal.targetId) return campaign;
        if (proposal.type === 'pause') return { ...campaign, status: 'paused' };
        if (proposal.type === 'resume') return { ...campaign, status: 'active' };
        const nextBudget = Math.round((campaign.budget * 1.2) / 1000) * 1000;
        return { ...campaign, budget: nextBudget };
      })
    );
    const now = new Date().toISOString();
    setAudit((current) => [
      {
        id: `audit_action_${Date.now()}`,
        actor: 'owner@demo',
        action: proposal.type === 'pause' ? 'action.pause' : 'action.budget',
        target: proposal.targetName,
        detail: `${proposal.beforeLabel} → ${proposal.afterLabel}. ${proposal.reason}`,
        createdAt: now,
      },
      ...current,
    ]);
    setApproval(null);
    showToast(
      proposal.type === 'pause'
        ? 'Demo: campaign dijeda di state lokal. Tidak dikirim ke Meta.'
        : 'Demo: budget +20% di state lokal. Tidak dikirim ke Meta.'
    );
  };

  const importOrders = (next: Order[]) => {
    const existing = new Set(orders.map((order) => order.externalOrderId));
    const fresh = next.filter((order) => !existing.has(order.externalOrderId));
    const duplicates = next.length - fresh.length;
    if (fresh.length > 0) setOrders((current) => [...fresh, ...current]);
    return { added: fresh.length, duplicates };
  };

  const saveScenario = (scenario: Scenario) => {
    setScenarios((current) => [scenario, ...current].slice(0, 20));
    showToast('Skenario disimpan di sesi ini.');
  };

  const page = (() => {
    if (tab === 'pulse') {
      return (
        <PulseRoute
          summary={summary}
          previous={previous}
          campaigns={campaigns}
          creatives={creatives}
          products={products}
          alerts={alerts}
          range={range}
          onNavigate={navigate}
          onOpenCampaign={openCampaign}
          onOpenAnalyst={() => setAiOpen(true)}
          onOpenConnect={() => setConnectOpen(true)}
        />
      );
    }
    if (tab === 'ads') {
      return (
        <AdsRoute
          summary={summary}
          campaigns={campaigns}
          creatives={creatives}
          products={products}
          onOpenCampaign={openCampaign}
          onOpenConnect={() => setConnectOpen(true)}
        />
      );
    }
    if (tab === 'money') {
      return (
        <MoneyRoute
          summary={summary}
          campaigns={campaigns}
          products={products}
          orders={rangeOrders}
          onProductsChange={setProducts}
          onImportOrders={importOrders}
          onNavigate={navigate}
        />
      );
    }
    if (tab === 'plan') {
      return (
        <PlanRoute
          products={products}
          summary={summary}
          scenarios={scenarios}
          onSaveScenario={saveScenario}
          onDeleteScenario={(id) => setScenarios((current) => current.filter((scenario) => scenario.id !== id))}
          onOpenAnalyst={() => setAiOpen(true)}
          onNavigate={navigate}
        />
      );
    }
    return (
      <SettingsRoute
        account={account}
        syncing={syncing}
        audit={audit}
        onSync={syncNow}
        onOpenConnect={() => setConnectOpen(true)}
        onOpenStudio={() => setStudioOpen(true)}
        onToast={showToast}
      />
    );
  })();

  return (
    <div className="ads-root" data-theme={theme}>
      <div className="ads-shell">
        <aside className="ads-sidebar">
          <div className="ads-brand">
            <span className="ads-brand-mark">B</span>
            <div>
              <strong>Ruang Iklan</strong>
              <small>Bunda Journal</small>
            </div>
          </div>

          <nav className="ads-nav" aria-label="Navigasi Ruang Iklan">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  type="button"
                  className={tab === item.tab ? 'is-active' : ''}
                  aria-current={tab === item.tab ? 'page' : undefined}
                  onClick={() => navigate(item.tab)}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.tab === 'pulse' && unreadAlerts > 0 ? <em>{unreadAlerts}</em> : null}
                </button>
              );
            })}
          </nav>

          <div className="ads-sidebar-foot">
            <div className="ads-account-card">
              <div className="ads-account-top">
                <span className="ads-account-dot" />
                <strong>{account.name}</strong>
                <Badge tone="amber">Demo</Badge>
              </div>
              <span>{account.adAccountId}</span>
              <span>Terakhir sync {formatDateTime(account.lastSync)} WIB</span>
              <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}>
                Hubungkan Meta
              </Button>
            </div>
            <div className="ads-sidebar-note">
              <Sparkles size={14} />
              <span>Analis + Studio siap. Key Meta menyusul.</span>
            </div>
          </div>
        </aside>

        <div className="ads-main">
          <header className="ads-topbar">
            <div className="ads-topbar-left">
              <div className="ads-mobile-brand">
                <span className="ads-brand-mark">B</span>
                <strong>Ruang Iklan</strong>
              </div>
              <span className="ads-breadcrumb">Bunda Journal</span>
              <span className="ads-breadcrumb-sep">/</span>
              <strong className="ads-breadcrumb-current">{TITLES[tab]}</strong>
            </div>
            <div className="ads-topbar-right">
              <div className="ads-select-wrap">
                <select
                  value={range}
                  onChange={(event) => changeRange(Number(event.target.value) as AdsDateRange)}
                  aria-label="Rentang tanggal"
                >
                  <option value={7}>7 hari</option>
                  <option value={14}>14 hari</option>
                  <option value={30}>30 hari</option>
                </select>
                <ChevronDown size={13} />
              </div>
              <Button variant="secondary" size="sm" onClick={syncNow} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'is-spinning' : ''} />
                {syncing ? 'Sync…' : 'Sync'}
              </Button>
              <IconButton
                label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
                title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
                onClick={toggleTheme}
                aria-pressed={theme === 'dark'}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </IconButton>
              <div className="ads-bell-wrap">
                <IconButton label="Alert" onClick={() => setBellOpen((current) => !current)}>
                  <Bell size={17} />
                  {unreadAlerts > 0 ? <span className="ads-bell-count">{unreadAlerts}</span> : null}
                </IconButton>
                {bellOpen ? (
                  <div className="ads-bell-pop">
                    <div className="ads-bell-head">
                      <strong>Alert</strong>
                      <span>{unreadAlerts} belum dibaca</span>
                    </div>
                    {alerts.length === 0 ? <p className="ads-muted">Tidak ada alert.</p> : null}
                    {alerts.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        className={`ads-bell-item ${alert.ack ? 'is-ack' : ''}`}
                        onClick={() => {
                          setAlerts((current) => current.map((item) => (item.id === alert.id ? { ...item, ack: true } : item)));
                          setBellOpen(false);
                          setAiOpen(true);
                        }}
                      >
                        <Badge tone={alert.severity === 'critical' ? 'terracotta' : 'amber'}>{alert.severity}</Badge>
                        <span><strong>{alert.title}</strong><small>{alert.body}</small></span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setAiOpen((current) => !current); setStudioOpen(false); }} title="Buka Analis" aria-label="Buka Analis">
                <Sparkles size={14} /> Analis
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setStudioOpen((current) => !current); setAiOpen(false); }} title="Buka Studio OpenCode" aria-label="Buka Studio OpenCode">
                <Code2 size={14} /> Studio
              </Button>
            </div>
          </header>

          <main className="ads-content">
            <ErrorBoundary fallbackTitle="Ruang Iklan mengalami kendala">
              {page}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      <nav className="ads-bottomnav" aria-label="Navigasi mobile">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.tab} type="button" className={tab === item.tab ? 'is-active' : ''} onClick={() => navigate(item.tab)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {aiOpen ? (
        <AnalystPanel
          onClose={() => setAiOpen(false)}
          summary={summary}
          previous={previous}
          campaigns={rangeCampaigns}
          creatives={creatives}
          products={products}
          onNavigate={navigate}
        />
      ) : null}

      {selectedCampaign ? (
        <CampaignDrawer
          campaign={selectedCampaign}
          creatives={creatives}
          product={products.find((product) => product.id === selectedCampaign.productId) ?? products[0]}
          onClose={() => setSelectedCampaignId(null)}
          onPause={requestPause}
          onScale={requestScale}
        />
      ) : null}

      {studioOpen ? (
        <StudioPanel
          onClose={() => setStudioOpen(false)}
          onToast={showToast}
          summary={summary}
          campaigns={rangeCampaigns}
          products={products}
        />
      ) : null}

      {connectOpen ? <ConnectModal onClose={() => setConnectOpen(false)} onToast={showToast} /> : null}

      {approval ? <ApprovalModal proposal={approval} onClose={() => setApproval(null)} onApprove={approve} /> : null}

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
