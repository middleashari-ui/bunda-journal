import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, KeyRound, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, Button, ModalShell } from './ui';

const GUIDE_URL = 'https://business.facebook.com/settings/system-users';

export function ConnectModal({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const value = token.trim();
    setSuccess(false);
    setWarning('');
    if (!value) {
      setError('Tempel token terlebih dahulu. Token bukan password Facebook.');
      return;
    }
    if (value.length < 20) {
      setError('Token terlalu pendek. System User token biasanya jauh lebih panjang.');
      return;
    }
    if (!value.startsWith('EAA')) {
      setError('Format tidak dikenali. Token Meta biasanya diawali EAA… Salin ulang dari Business Settings.');
      return;
    }
    setError('');
    if (value.startsWith('EAAG')) {
      setWarning('Token ini bisa jadi Page token. Page token tidak bisa membaca Ads Insights — pastikan ini System User token.');
    }
    setSuccess(true);
    onToast('Format token valid. Backend belum aktif — token tidak disimpan.');
  };

  return (
    <ModalShell
      title="Hubungkan Meta"
      subtitle="Satu token System User, read-only dulu."
      onClose={onClose}
      testId="connect-modal"
      footer={
        <div className="ads-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="primary" onClick={validate}>
            <KeyRound size={15} /> Validasi token
          </Button>
        </div>
      }
    >
      <div className="ads-connect">
        <div className="ads-connect-note">
          <ShieldCheck size={18} />
          <div>
            <strong>Token tidak pernah disimpan di browser.</strong>
            <p>
              Di produksi, token dikirim ke server, dienkripsi AES-256-GCM, dan tidak pernah
              dikembalikan ke UI. Untuk sekarang backend belum aktif — form ini memvalidasi format
              saja.
            </p>
          </div>
        </div>

        <label className="ads-field">
          <span>System User token</span>
          <input
            data-testid="token-input"
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setError('');
              setSuccess(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                validate();
              }
            }}
            placeholder="EAAB…"
            autoComplete="off"
            spellCheck={false}
          />
          <small>Jangan tempel password Facebook. Hanya token dari Business Settings.</small>
        </label>

        {error ? (
          <div className="ads-inline-error" role="alert" data-testid="token-error">
            <XCircle size={15} /> {error}
          </div>
        ) : null}
        {success ? (
          <div className="ads-inline-success" role="status" data-testid="token-success">
            <ShieldCheck size={15} /> Format token valid (…{token.trim().slice(-4)}). Backend belum
            aktif; token tidak disimpan.
          </div>
        ) : null}
        {warning ? (
          <div className="ads-inline-warning" role="status">
            <AlertTriangle size={15} /> {warning}
          </div>
        ) : null}

        <div className="ads-steps">
          <div className="ads-step">
            <span>1</span>
            <div>
              <strong>Business Settings → System Users</strong>
              <p>Buat user “Bunda Journal Dashboard”, role Admin.</p>
            </div>
          </div>
          <div className="ads-step">
            <span>2</span>
            <div>
              <strong>Assign aset</strong>
              <p>Ad account (View Performance), Page (View), Pixel (View).</p>
            </div>
          </div>
          <div className="ads-step">
            <span>3</span>
            <div>
              <strong>Generate token</strong>
              <p>Scope <code className="ads-code">ads_read</code>, <code className="ads-code">business_management</code>, <code className="ads-code">pages_read_engagement</code>.</p>
            </div>
          </div>
        </div>

        <div className="ads-connect-warning">
          <Badge tone="amber">Penting</Badge>
          <p>
            Page token hanya membaca Halaman, bukan iklan. Kalau belum punya Business Manager,
            dashboard tetap bisa dipakai dalam mode demo.
          </p>
        </div>

        <a className="ads-link" href={GUIDE_URL} target="_blank" rel="noreferrer">
          Buka Business Settings <ArrowUpRight size={14} />
        </a>
      </div>
    </ModalShell>
  );
}
