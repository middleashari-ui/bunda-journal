import { useState } from 'react';
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import type { ApprovalProposal } from '../types';
import { Badge, Button, ModalShell } from './ui';

export function ApprovalModal({
  proposal,
  onClose,
  onApprove,
}: {
  proposal: ApprovalProposal;
  onClose: () => void;
  onApprove: (proposal: ApprovalProposal) => void;
}) {
  const [risk, setRisk] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const needsTyped = proposal.impactPct > 30;
  const canApprove = risk && (!needsTyped || confirmText.trim().toUpperCase() === 'SETUJU');

  return (
    <ModalShell
      title="Setujui perubahan"
      subtitle="Proposal ini belum dikirim ke Meta."
      onClose={onClose}
      testId="approval-modal"
      footer={
        <div className="ads-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Tolak
          </Button>
          <Button
            variant={proposal.type === 'pause' ? 'danger' : 'primary'}
            disabled={!canApprove}
            onClick={() => onApprove(proposal)}
          >
            <Check size={15} /> {proposal.type === 'pause' ? 'Setujui & hentikan' : 'Setujui'}
          </Button>
        </div>
      }
    >
      <div className="ads-approval">
        <div className="ads-approval-target">
          <div>
            <span className="ads-eyebrow">{proposal.requestedBy === 'AI' ? 'Diusulkan Analis' : 'Diusulkan Owner'}</span>
            <h3>{proposal.targetName}</h3>
          </div>
          <Badge tone="amber">Demo · tidak dikirim ke Meta</Badge>
        </div>
        <div className="ads-approval-change">
          <div>
            <span>Sebelum</span>
            <strong>{proposal.beforeLabel}</strong>
          </div>
          <span className="ads-approval-arrow">→</span>
          <div>
            <span>Sesudah</span>
            <strong>{proposal.afterLabel}</strong>
          </div>
        </div>
        <div className="ads-approval-block">
          <span className="ads-eyebrow">Alasan</span>
          <p>{proposal.reason}</p>
        </div>
        <div className="ads-approval-block ads-approval-risk">
          <span className="ads-eyebrow">
            <AlertTriangle size={13} /> Downside
          </span>
          <p>{proposal.downside}</p>
        </div>
        <div className="ads-approval-guard">
          <ShieldAlert size={16} />
          <div>
            <strong>Guardrail</strong>
            <p>
              Budget maksimal +30% per aksi · 4 perubahan/jam per adset · re-validate nilai terbaru
              sebelum eksekusi · audit wajib.
            </p>
          </div>
        </div>
        <label className="ads-check">
          <input type="checkbox" checked={risk} onChange={(event) => setRisk(event.target.checked)} />
          <span>Saya paham risiko dan ingin melanjutkan.</span>
        </label>
        {needsTyped ? (
          <label className="ads-field">
            <span>Ketik SETUJU untuk perubahan &gt;30%</span>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="SETUJU"
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>
    </ModalShell>
  );
}
