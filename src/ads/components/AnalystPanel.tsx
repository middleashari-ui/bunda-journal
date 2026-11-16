import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, CornerDownLeft, Send, Sparkles } from 'lucide-react';
import type { AdsTab, Campaign, Creative, ProductEconomics, RangeSummary } from '../types';
import { blendedEconomics, creativeDiagnosis, decide, productEconomics, targetToBudget } from '../lib/calculators';
import { formatIdr, formatNumber, formatPercent, formatRoas } from '../lib/format';
import { Badge, Button, IconButton } from './ui';

interface Answer {
  title: string;
  conclusion: string;
  evidence: string[];
  risk: string;
  actions?: { label: string; tab: AdsTab }[];
  data: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  answer?: Answer;
}

const SUGGESTIONS = [
  'Kenapa CPA naik minggu ini?',
  'Campaign mana yang boncos?',
  'Budget berapa untuk 100 sales VIP?',
  'Kreatif mana yang harus dihentikan?',
  'Ringkas kondisi hari ini.',
];

export function AnalystPanel({
  onClose,
  summary,
  previous,
  campaigns,
  creatives,
  products,
  onNavigate,
}: {
  onClose: () => void;
  summary: RangeSummary;
  previous: RangeSummary;
  campaigns: Campaign[];
  creatives: Creative[];
  products: ProductEconomics[];
  onNavigate: (tab: AdsTab) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      answer: {
        title: 'Analis demo siap',
        conclusion:
          'Aku membaca data demo yang sama dengan dashboard. Belum ada LLM/API key — jawaban dihitung dari data dan kalkulator, jadi tidak mengarang angka.',
        evidence: [
          `Scope: ${summary.days} hari · ${formatNumber(summary.orders)} order bank · spend ${formatIdr(summary.spend)}.`,
          'Sumber kebenaran: order bank. Metrik Meta hanya pembanding.',
        ],
        risk:
          'Data demo, bukan akun Meta asli. Setelah token dan backend aktif, panel ini akan memakai data nyata + sitasi query_id.',
        actions: [{ label: 'Buka Iklan', tab: 'ads' }],
        data: `as-of 16 Nov 2026 08.30 WIB · ${summary.orders} order`,
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const metrics = useMemo(() => {
    const cpa = summary.orders > 0 ? summary.spend / summary.orders : null;
    const prevCpa = previous.orders > 0 ? previous.spend / previous.orders : null;
    const roas = summary.spend > 0 ? summary.revenue / summary.spend : 0;
    const blended = blendedEconomics(products, { essential: 0.2, vip: 0.6, hardcover: 0.2 }, 0.2);
    const decision = decide({
      orders: summary.orders,
      cpaBank: cpa,
      maxCpa: blended.maxCpa,
      roasBank: roas,
      beRoas: blended.beRoas,
      frequency: 2.1,
      spend: summary.spend,
    });
    return { cpa, prevCpa, roas, blended, decision };
  }, [previous, products, summary]);

  const buildAnswer = (question: string): Answer => {
    const q = question.toLowerCase();
    const vip = products.find((product) => product.id === 'vip') ?? products[0];
    const vipEcon = productEconomics(vip, 0.2);
    if (q.includes('cpa') && (q.includes('naik') || q.includes('kenapa'))) {
      const delta =
        metrics.cpa !== null && metrics.prevCpa !== null && metrics.prevCpa > 0
          ? (metrics.cpa - metrics.prevCpa) / metrics.prevCpa
          : null;
      const worst = [...campaigns]
        .filter((campaign) => campaign.orders > 0)
        .sort((a, b) => b.spend / b.orders - a.spend / a.orders)[0];
      return {
        title: 'Kenapa CPA berubah',
        conclusion:
          delta === null
            ? 'Belum ada pembanding 7 hari sebelumnya yang cukup.'
            : delta > 0
              ? `CPA bank naik ${formatPercent(delta)} dibanding periode sebelumnya. Penyebab utama ada di campaign dengan CPA tertinggi dan kreatif yang frequency-nya naik.`
              : `CPA bank turun ${formatPercent(Math.abs(delta))}. Tidak ada alarm; tetap pantau frequency dan kreatif.`,
        evidence: [
          `CPA bank sekarang ${metrics.cpa === null ? '—' : formatIdr(metrics.cpa)} vs sebelumnya ${metrics.prevCpa === null ? '—' : formatIdr(metrics.prevCpa)}.`,
          worst
            ? `CPA tertinggi: ${worst.name} — ${formatIdr(worst.spend / worst.orders)} (${worst.orders} order, frequency ${formatRoas(worst.frequency)}).`
            : 'Tidak ada campaign dengan order cukup untuk dibandingkan.',
          `ROAS bank ${formatRoas(metrics.roas)} vs BE blended ${formatRoas(metrics.blended.beRoas)}.`,
        ],
        risk: `Sampel ${summary.orders} order; kalau <10, jangan simpulkan. Atribusi Meta bisa overclaim — angka ini memakai bank.`,
        actions: [
          { label: 'Buka Iklan', tab: 'ads' },
          { label: 'Buka Kalkulator', tab: 'plan' },
        ],
        data: `q_demo_cpa · ${summary.orders} order · as-of 16 Nov 08.30 WIB`,
      };
    }
    if (q.includes('boncos') || q.includes('rugi') || q.includes('hentikan')) {
      const bad = campaigns.filter((campaign) => {
        const cpa = campaign.orders > 0 ? campaign.spend / campaign.orders : null;
        return campaign.orders === 0 || (cpa !== null && cpa > vipEcon.maxCpa);
      });
      return {
        title: 'Campaign yang perlu dihentikan',
        conclusion:
          bad.length === 0
            ? 'Tidak ada campaign yang melewati guardrail saat ini.'
            : `${bad.length} campaign perlu ditinjau: ${bad.map((campaign) => campaign.name).join(', ')}.`,
        evidence: bad.length
          ? bad.map(
              (campaign) =>
                `${campaign.name}: spend ${formatIdr(campaign.spend)}, ${campaign.orders} order, CPA ${campaign.orders > 0 ? formatIdr(campaign.spend / campaign.orders) : '—'} (Max ${formatIdr(vipEcon.maxCpa)}).`
            )
          : ['Semua campaign dengan order berada di bawah Max CPA VIP.'],
        risk: 'Hentikan hanya jika spend sudah >2× Max CPA dan tidak ada order; jangan reaktif pada 1 hari.',
        actions: [{ label: 'Buka Iklan', tab: 'ads' }],
        data: `q_demo_bad · ${campaigns.length} campaign · as-of 16 Nov 08.30 WIB`,
      };
    }
    if (q.includes('100') || q.includes('budget') || q.includes('sales') || q.includes('target')) {
      const target = targetToBudget({
        targetOrders: 100,
        cpm: 45000,
        ctr: 0.018,
        lpvRate: 0.7,
        cvr: 0.03,
        aov: vip.price,
        contribution: vipEcon.contribution,
      });
      const spend = (target.impressions / 1000) * 45000;
      return {
        title: 'Budget untuk 100 sales VIP',
        conclusion: `Dengan CPM Rp45rb, CTR 1,8%, LPV 70%, dan CVR 3%, butuh sekitar ${formatIdr(spend)} untuk 100 order VIP.`,
        evidence: [
          `Impressions ${formatNumber(target.impressions)}, klik ${formatNumber(target.clicks)}, LPV ${formatNumber(target.lpv)}.`,
          `Revenue ${formatIdr(target.revenue)}, CPA ${formatIdr(target.cpa ?? 0)}, profit ${formatIdr(target.profit)}.`,
          `Max CPA VIP ${formatIdr(vipEcon.maxCpa)}; CPA proyeksi ${target.cpa !== null && target.cpa <= vipEcon.maxCpa ? 'masih aman' : 'di atas batas'}.`,
        ],
        risk: 'Ini skenario, bukan janji. CPM/CVR bisa berubah; tampilkan rentang pesimis/base/optimis.',
        actions: [{ label: 'Buka Rencana', tab: 'plan' }],
        data: `q_demo_target · calc target_to_budget · 100 order`,
      };
    }
    if (q.includes('kreatif') || q.includes('fatigue') || q.includes('capek')) {
      const ranked = creatives
        .map((creative) => ({
          creative,
          diagnosis: creativeDiagnosis({
            ctr: creative.impressions > 0 ? creative.clicks / creative.impressions : 0,
            cvr: creative.lpv > 0 ? creative.orders / creative.lpv : 0,
            spend: creative.spend,
            orders: creative.orders,
            frequency: creative.frequency,
            hookRate: creative.hookRate,
            holdRate: creative.holdRate,
            medianCtr: 0.015,
            medianCvr: 0.03,
            maxCpa: vipEcon.maxCpa,
          }),
        }))
        .sort((a, b) => b.diagnosis.fatigue - a.diagnosis.fatigue)
        .slice(0, 3);
      return {
        title: 'Kreatif yang capek',
        conclusion: ranked[0]
          ? `${ranked[0].creative.name} paling perlu ditinjau (fatigue ${formatPercent(ranked[0].diagnosis.fatigue)}).`
          : 'Belum ada data kreatif.',
        evidence: ranked.map(
          (item) =>
            `${item.creative.name}: freq ${formatRoas(item.creative.frequency)}, CTR ${formatPercent(item.creative.impressions > 0 ? item.creative.clicks / item.creative.impressions : 0)}, verdict ${item.diagnosis.verdict}.`
        ),
        risk: 'Jangan menilai kreatif dari CTR saja. Cek CVR LPV dan spend sebelum kill.',
        actions: [{ label: 'Buka Iklan', tab: 'ads' }],
        data: `q_demo_creative · ${creatives.length} kreatif · as-of 16 Nov 08.30 WIB`,
      };
    }
    return {
      title: 'Ringkasan hari ini',
      conclusion: metrics.decision.reason,
      evidence: [
        `Laba bersih ${formatIdr(summary.profit)}; spend ${formatIdr(summary.spend)}; revenue bank ${formatIdr(summary.revenue)}.`,
        `CPA bank ${metrics.cpa === null ? '—' : formatIdr(metrics.cpa)} vs Max ${formatIdr(metrics.blended.maxCpa)}; ROAS ${formatRoas(metrics.roas)} vs BE ${formatRoas(metrics.blended.beRoas)}.`,
        `Gap Meta vs bank: ${summary.platformOrders} vs ${summary.orders} order.`,
      ],
      risk: 'Data demo; setelah token aktif, jawaban akan menyertakan query_id dan as-of dari sync nyata.',
      actions: [
        { label: 'Buka Hari Ini', tab: 'pulse' },
        { label: 'Buka Uang', tab: 'money' },
      ],
      data: `q_demo_summary · ${summary.orders} order · as-of 16 Nov 08.30 WIB`,
    };
  };

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    setInput('');
    setBusy(true);
    const userMessage: Message = { id: `u_${Date.now()}`, role: 'user', text: value };
    setMessages((current) => [...current, userMessage]);
    const answer = buildAnswer(value);
    timer.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `a_${Date.now()}`, role: 'assistant', answer },
      ]);
      setBusy(false);
      timer.current = null;
    }, 380);
  };

  return (
    <aside className="ads-ai" data-testid="analyst-panel" aria-label="Panel Analis">
      <div className="ads-ai-head">
        <div className="ads-ai-title">
          <span className="ads-ai-logo"><Bot size={17} /></span>
          <div>
            <h2>Analis</h2>
            <span>demo · rule-based</span>
          </div>
        </div>
        <div className="ads-ai-head-actions">
          <Badge tone="amber">Belum ada key</Badge>
          <IconButton label="Tutup Analis" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
      </div>

      <div className="ads-ai-scope">
        <Badge tone="neutral">{summary.days} hari</Badge>
        <Badge tone="neutral">{summary.orders} order</Badge>
        <span className="ads-muted">as-of 16 Nov 08.30 WIB</span>
      </div>

      <div className="ads-ai-messages" ref={scrollRef} aria-live="polite">
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="ads-ai-user">
              {message.text}
            </div>
          ) : (
            <div key={message.id} className="ads-ai-answer">
              <div className="ads-ai-answer-head">
                <Sparkles size={14} /> <strong>{message.answer?.title}</strong>
              </div>
              <p className="ads-ai-conclusion">{message.answer?.conclusion}</p>
              <div className="ads-ai-section">
                <span className="ads-eyebrow">Bukti</span>
                <ul>
                  {message.answer?.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="ads-ai-risk">
                <span className="ads-eyebrow">Risiko</span>
                <p>{message.answer?.risk}</p>
              </div>
              {message.answer?.actions?.length ? (
                <div className="ads-ai-actions">
                  {message.answer.actions.map((action) => (
                    <Button key={action.label} size="sm" variant="secondary" onClick={() => onNavigate(action.tab)}>
                      {action.label} <ArrowRight size={13} />
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="ads-ai-data">{message.answer?.data}</div>
            </div>
          )
        )}
        {busy ? (
          <div className="ads-ai-thinking">
            <span /> <span /> <span /> Membaca data demo…
          </div>
        ) : null}
      </div>

      <div className="ads-ai-suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => send(suggestion)} disabled={busy}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className="ads-ai-compose">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Tanya soal CPA, budget, kreatif…"
          rows={2}
          aria-label="Pertanyaan untuk analis"
        />
        <Button variant="primary" size="sm" onClick={() => send()} disabled={busy || !input.trim()}>
          <Send size={14} /> Kirim
        </Button>
      </div>
      <div className="ads-ai-foot">
        <CornerDownLeft size={12} /> Enter kirim · Shift+Enter baris baru · jawaban bukan dari LLM
      </div>
    </aside>
  );
}
