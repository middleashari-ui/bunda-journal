import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect } from 'react';
import { X, AlertTriangle, RefreshCw, Check, Info, CircleAlert, Sparkles } from 'lucide-react';
import type { DecisionStatus, Source } from '../types';
import { formatDateTime } from '../lib/format';

export type Tone = 'sage' | 'terracotta' | 'amber' | 'neutral' | 'ink';

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={`ads-badge ads-badge-${tone} ${className}`}>{children}</span>;
}

export function SourceBadge({ source }: { source: Source }) {
  const label =
    source === 'bank' ? 'Bank' : source === 'meta' ? 'Meta' : source === 'calc' ? 'Hitung' : 'Manual';
  const tone: Tone = source === 'bank' ? 'sage' : source === 'meta' ? 'neutral' : 'amber';
  return <Badge tone={tone}>{label}</Badge>;
}

export function AsOf({ value }: { value: string }) {
  return <span className="ads-asof">as-of {formatDateTime(value)} WIB</span>;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      className={`ads-btn ads-btn-${variant} ads-btn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`ads-iconbtn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function MetricTile({
  label,
  value,
  delta,
  source,
  note,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  delta?: string;
  source?: Source;
  note?: string;
  tone?: Tone;
}) {
  return (
    <div className={`ads-metric ads-tone-${tone}`}>
      <div className="ads-metric-top">
        <span className="ads-metric-label">{label}</span>
        {source ? <SourceBadge source={source} /> : null}
      </div>
      <div className="ads-metric-value">{value}</div>
      <div className="ads-metric-bottom">
        {delta ? <span className={`ads-delta ${delta.startsWith('-') ? 'is-down' : 'is-up'}`}>{delta}</span> : null}
        {note ? <span className="ads-metric-note">{note}</span> : null}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ads-section-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="ads-section-action">{action}</div> : null}
    </div>
  );
}

export function DecisionBadge({ status, label }: { status: DecisionStatus; label?: string }) {
  const map: Record<DecisionStatus, { label: string; tone: Tone }> = {
    scale: { label: 'Naikkan', tone: 'sage' },
    hold: { label: 'Tahan', tone: 'amber' },
    stop: { label: 'Hentikan', tone: 'terracotta' },
    insufficient: { label: 'Belum cukup data', tone: 'neutral' },
  };
  const item = map[status];
  return <Badge tone={item.tone}>{label ?? item.label}</Badge>;
}

export function AssumptionBadge({ children = 'Asumsi' }: { children?: ReactNode }) {
  return (
    <Badge tone="amber" className="ads-badge-assumption">
      <AlertTriangle size={12} /> {children}
    </Badge>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="ads-state ads-empty">
      <div className="ads-state-icon">
        <Info size={20} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="ads-state-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Data belum bisa dimuat',
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div className="ads-state ads-errorstate" role="alert">
      <div className="ads-state-icon">
        <CircleAlert size={20} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} /> Coba lagi
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="ads-skeleton" aria-label="Memuat data" role="status">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} style={{ width: `${92 - index * 9}%` }} />
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="ads-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  footer,
  testId,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
  testId?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ads-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        className={`ads-modal ${wide ? 'is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
      >
        <div className="ads-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="ads-modal-body">{children}</div>
        {footer ? <div className="ads-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DrawerShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  testId,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ads-overlay ads-overlay-drawer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="ads-drawer" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
        <div className="ads-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="ads-drawer-body">{children}</div>
        {footer ? <div className="ads-modal-foot">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="ads-toast" role="status" aria-live="polite">
      <Check size={16} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi">
        <X size={14} />
      </button>
    </div>
  );
}

export function Sparkline({ values, tone = 'sage' }: { values: number[]; tone?: Tone }) {
  const width = 92;
  const height = 26;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg className={`ads-spark ads-spark-${tone}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatusDot({ status }: { status: 'active' | 'paused' | 'learning' | 'rejected' }) {
  const map = {
    active: { label: 'Aktif', tone: 'sage' },
    paused: { label: 'Jeda', tone: 'neutral' },
    learning: { label: 'Learning', tone: 'amber' },
    rejected: { label: 'Ditolak', tone: 'terracotta' },
  } as const;
  const item = map[status];
  return (
    <span className={`ads-status ads-status-${item.tone}`}>
      <span className="ads-dot" /> {item.label}
    </span>
  );
}

export function AiMark({ children = 'Analis' }: { children?: ReactNode }) {
  return (
    <span className="ads-ai-mark">
      <Sparkles size={14} /> {children}
    </span>
  );
}
