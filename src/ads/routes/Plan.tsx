import { useMemo, useState } from 'react';
import { ArrowRight, Calculator, Save, Trash2 } from 'lucide-react';
import type { AdsTab, ProductEconomics, Scenario, RangeSummary } from '../types';
import { CALCULATOR_DEFS, buildContext, type CalcDef } from '../lib/calculatorDefs';
import { blendedEconomics, productEconomics } from '../lib/calculators';
import { formatDate, formatIdr, formatNumber } from '../lib/format';
import { Badge, Button, EmptyState, SectionHeader } from '../components/ui';
import { CalculatorRunner } from '../components/CalculatorRunner';

const GROUPS = ['Dasar', 'Perencanaan', 'Skala', 'Diagnosa', 'Uang'] as const;

export function PlanRoute({
  products,
  summary,
  scenarios,
  onSaveScenario,
  onDeleteScenario,
  onOpenAnalyst,
  onNavigate,
}: {
  products: ProductEconomics[];
  summary: RangeSummary;
  scenarios: Scenario[];
  onSaveScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
  onOpenAnalyst: () => void;
  onNavigate: (tab: AdsTab) => void;
}) {
  const [selected, setSelected] = useState<CalcDef | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, number> | undefined>(undefined);
  const context = useMemo(() => buildContext(products, 0.2), [products]);
  const vip = products.find((product) => product.id === 'vip') ?? products[0];
  const vipEcon = productEconomics(vip, 0.2);
  const blended = blendedEconomics(products, { essential: 0.2, vip: 0.6, hardcover: 0.2 }, 0.2);

  const open = (def: CalcDef, values?: Record<string, number>) => {
    setSelected(def);
    setInitialValues(values);
  };

  return (
    <div className="ads-page" data-testid="plan-page">
      <div className="ads-page-head">
        <div>
          <span className="ads-eyebrow">Rencana · {summary.days} hari</span>
          <h1>Rencana</h1>
          <p>Berapa budget untuk target X, dan apa risikonya?</p>
        </div>
        <div className="ads-page-head-meta">
          <Badge tone="amber">Kalkulator deterministik</Badge>
          <Button size="sm" variant="secondary" onClick={onOpenAnalyst}>
            Tanya Analis <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      <div className="ads-plan-hero">
        <div>
          <span className="ads-eyebrow">Starting point</span>
          <h2>Max CPA VIP sekarang</h2>
          <div className="ads-plan-hero-value">{formatIdr(vipEcon.maxCpa)}</div>
          <p>
            Buffer 20% dari kontribusi per order. Untuk campaign satu produk pakai angka ini; untuk
            campuran pakai blended {formatIdr(blended.maxCpa)}.
          </p>
        </div>
        <div className="ads-plan-hero-side">
          <div><span>Order bank</span><strong>{formatNumber(summary.orders)}</strong></div>
          <div><span>Spend</span><strong>{formatIdr(summary.spend)}</strong></div>
          <div><span>Profit</span><strong>{formatIdr(summary.profit)}</strong></div>
          <Button variant="primary" size="sm" onClick={() => open(CALCULATOR_DEFS[4])}>
            <Calculator size={14} /> Budget → hasil
          </Button>
        </div>
      </div>

      <div className="ads-plan-groups">
        {GROUPS.map((group) => {
          const defs = CALCULATOR_DEFS.filter((def) => def.group === group);
          return (
            <section key={group} className="ads-plan-group">
              <div className="ads-plan-group-head">
                <h2>{group}</h2>
                <span>{defs.length} kalkulator</span>
              </div>
              <div className="ads-calc-grid">
                {defs.map((def) => (
                  <button
                    key={def.id}
                    type="button"
                    className="ads-calc-card"
                    data-testid={`calc-${def.id}`}
                    onClick={() => open(def)}
                  >
                    <div className="ads-calc-card-top">
                      <span className="ads-calc-icon"><Calculator size={16} /></span>
                      <Badge tone="neutral">{def.group}</Badge>
                    </div>
                    <strong>{def.title}</strong>
                    <p>{def.question}</p>
                    <span className="ads-calc-open">Buka <ArrowRight size={13} /></span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="ads-card">
        <SectionHeader
          title="Skenario tersimpan"
          subtitle="Bandingkan keputusan, bukan hanya angka."
          action={<Badge tone="neutral">{scenarios.length}</Badge>}
        />
        {scenarios.length === 0 ? (
          <EmptyState
            title="Belum ada skenario"
            body="Buka salah satu kalkulator, isi angka, lalu simpan. Skenario bisa dibuka lagi kapan saja."
            action={<Button variant="secondary" size="sm" onClick={() => open(CALCULATOR_DEFS[4])}>Buat skenario pertama</Button>}
          />
        ) : (
          <div className="ads-scenario-list">
            {scenarios.map((scenario) => {
              const def = CALCULATOR_DEFS.find((item) => item.id === scenario.calculator);
              return (
                <div key={scenario.id} className="ads-scenario-row">
                  <div>
                    <strong>{scenario.name}</strong>
                    <span>{scenario.decision} · {formatDate(scenario.createdAt)}</span>
                  </div>
                  <div className="ads-scenario-outputs">
                    {scenario.outputs.slice(0, 3).map((output) => (
                      <span key={output.label}>{output.label}: <strong>{output.value}</strong></span>
                    ))}
                  </div>
                  <div className="ads-inline-actions">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        if (def) open(def, scenario.inputs);
                      }}
                    >
                      Buka
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => onDeleteScenario(scenario.id)} aria-label={`Hapus ${scenario.name}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="ads-note-line">
        <Save size={14} /> Semua kalkulator memakai satu sumber biaya dari tab Uang. Mengubah COGS/fee
        langsung mengubah hasil di sini.
        <Button size="sm" variant="quiet" onClick={() => onNavigate('money')}>Ubah biaya <ArrowRight size={13} /></Button>
      </div>

      {selected ? (
        <CalculatorRunner
          def={selected}
          context={context}
          initialValues={initialValues}
          onClose={() => setSelected(null)}
          onSave={(scenario) => {
            onSaveScenario(scenario);
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
