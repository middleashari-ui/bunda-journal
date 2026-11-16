import { useMemo, useState } from 'react';
import { Calculator, Save } from 'lucide-react';
import type { Scenario } from '../types';
import { defaultValues, type CalcContext, type CalcDef, type CalcOutput } from '../lib/calculatorDefs';
import { formatIdr, formatNumber, formatPercent, formatRoas } from '../lib/format';
import { Badge, Button, DecisionBadge, ModalShell } from './ui';

function formatOutput(output: CalcOutput): string {
  if (output.format === 'text') return String(output.value);
  const value = typeof output.value === 'number' ? output.value : Number(output.value);
  if (output.format === 'idr') return formatIdr(value);
  if (output.format === 'pct') return formatPercent(value);
  if (output.format === 'roas') return formatRoas(value);
  return formatNumber(value);
}

export function CalculatorRunner({
  def,
  context,
  onClose,
  onSave,
  initialValues,
}: {
  def: CalcDef;
  context: CalcContext;
  onClose: () => void;
  onSave: (scenario: Scenario) => void;
  initialValues?: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, number>>(() => ({
    ...defaultValues(def),
    ...(initialValues ?? {}),
  }));
  const [name, setName] = useState(`${def.title} — ${new Date().toLocaleDateString('id-ID')}`);
  const [saved, setSaved] = useState(false);

  const errors = useMemo(() => {
    const list: string[] = [];
    def.fields.forEach((field) => {
      const value = values[field.key];
      if (!Number.isFinite(value)) {
        list.push(`${field.label} harus angka.`);
        return;
      }
      if (field.min !== undefined && value < field.min) {
        list.push(`${field.label} minimal ${field.min}${field.suffix ?? ''}.`);
      }
      if (field.max !== undefined && value > field.max) {
        list.push(`${field.label} maksimal ${field.max}${field.suffix ?? ''}.`);
      }
    });
    return list;
  }, [def.fields, values]);

  const computed = useMemo(() => {
    if (errors.length > 0) return null;
    try {
      return def.compute(values, context);
    } catch {
      return null;
    }
  }, [context, def, errors.length, values]);

  const save = () => {
    if (!computed) return;
    onSave({
      id: `scenario_${Date.now()}`,
      calculator: def.id,
      name: name.trim() || def.title,
      inputs: values,
      outputs: computed.outputs.map((output) => ({ label: output.label, value: formatOutput(output) })),
      decision: computed.decision.label,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  return (
    <ModalShell
      title={def.title}
      subtitle={def.question}
      onClose={onClose}
      wide
      testId="calculator-modal"
      footer={
        <div className="ads-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="primary" onClick={save} disabled={!computed || saved}>
            {saved ? <Badge tone="sage">Tersimpan</Badge> : <><Save size={15} /> Simpan skenario</>}
          </Button>
        </div>
      }
    >
      <div className="ads-calc">
        <div className="ads-calc-inputs">
          <div className="ads-calc-head">
            <span className="ads-eyebrow"><Calculator size={13} /> Input</span>
            <Badge tone="neutral">{def.group}</Badge>
          </div>
          <div className="ads-form-grid">
            {def.fields.map((field) => (
              <label className="ads-field" key={field.key}>
                <span>
                  {field.label} {field.suffix ? <em>{field.suffix}</em> : null}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={Number.isFinite(values[field.key]) ? values[field.key] : ''}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  onChange={(event) => {
                    const next = event.target.value === '' ? 0 : Number(event.target.value);
                    setValues((current) => ({ ...current, [field.key]: next }));
                    setSaved(false);
                  }}
                />
                {field.hint ? <small>{field.hint}</small> : null}
              </label>
            ))}
          </div>
          {errors.length > 0 ? (
            <div className="ads-inline-error" role="alert">
              {errors.slice(0, 3).map((error) => <div key={error}>{error}</div>)}
            </div>
          ) : null}
        </div>

        <div className="ads-calc-output" data-testid="calculator-output">
          <div className="ads-calc-head">
            <span className="ads-eyebrow">Hasil</span>
            {computed ? <DecisionBadge status={computed.decision.status} label={computed.decision.label} /> : null}
          </div>
          {computed ? (
            <>
              <div className="ads-output-grid">
                {computed.outputs.map((output) => (
                  <div className="ads-output" key={output.label}>
                    <span>{output.label}</span>
                    <strong className={output.format === 'idr' && typeof output.value === 'number' && output.value < 0 ? 'is-negative' : ''}>
                      {formatOutput(output)}
                    </strong>
                    {output.hint ? <small>{output.hint}</small> : null}
                  </div>
                ))}
              </div>
              <div className={`ads-calc-decision is-${computed.decision.status}`}>
                <strong>{computed.decision.label}</strong>
                <p>{computed.decision.reason}</p>
              </div>
              <div className="ads-assumptions">
                <span className="ads-eyebrow">Asumsi</span>
                <ul>
                  {computed.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </div>
              <label className="ads-field ads-save-name">
                <span>Nama skenario</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              </label>
            </>
          ) : (
            <div className="ads-state ads-empty">
              <h3>Perbaiki input dulu</h3>
              <p>Hasil muncul setelah semua angka valid.</p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
