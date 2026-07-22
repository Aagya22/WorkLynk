import React from 'react';

export const PageHeader: React.FC<{
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, action }) => (
  <header className="animate-slide-up">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1 className="font-display mt-2 text-[42px] font-bold leading-[1.02] tracking-[-0.03em] ink">{title}</h1>}
        {subtitle && (
          <p className={`max-w-xl leading-relaxed ink-muted ${title ? 'mt-3 text-[15px]' : 'mt-2 text-[16px]'}`}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 pb-1">{action}</div>}
    </div>
    <div className="rule mt-7" />
  </header>
);

export const Panel: React.FC<{
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, icon, action, className = '', bodyClassName = 'p-5', children }) => (
  <section className={`paper paper-hover overflow-hidden rounded-2xl ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between border-b hairline px-5 py-4">
        <h2 className="flex items-center gap-2 text-[13px] font-bold ink">
          {icon}
          {title}
        </h2>
        {action}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

type Tone = 'default' | 'positive' | 'warning' | 'critical' | 'info' | 'violet';

const TONES: Record<Tone, { surface: string; border: string; chip: string; value: string; accent: string }> = {
  default: { surface: '#FBFAF8', border: 'rgba(28,25,23,0.08)', chip: '#F2F1ED', value: '#1C1917', accent: '#57534E' },
  positive: { surface: '#F2F8F4', border: 'rgba(21,128,61,0.14)', chip: '#DCEFE3', value: '#15803D', accent: '#15803D' },
  warning: { surface: '#FDF8EF', border: 'rgba(180,83,9,0.14)', chip: '#F7E9D2', value: '#B45309', accent: '#B45309' },
  critical: { surface: '#FDF3F3', border: 'rgba(185,28,28,0.14)', chip: '#F8DEDE', value: '#B91C1C', accent: '#B91C1C' },
  info: { surface: '#F3F6FC', border: 'rgba(29,78,216,0.14)', chip: '#DEE8F9', value: '#1D4ED8', accent: '#1D4ED8' },
  violet: { surface: '#F7F4FC', border: 'rgba(109,40,217,0.14)', chip: '#E8E0F8', value: '#6D28D9', accent: '#6D28D9' },
};

export const toneAccent = (tone: Tone) => TONES[tone].accent;

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}> = ({ label, value, hint, icon, tone = 'default', className = '' }) => {
  const t = TONES[tone];
  return (
    <div
      className={`paper-hover rounded-2xl p-5 transition-shadow ${className}`}
      style={{ background: t.surface, border: `1px solid ${t.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && (
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: t.chip, color: t.accent }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-3 text-[34px] font-bold leading-none" style={{ color: t.value }}>
        {value}
      </p>
      {hint && <p className="mt-2 text-[13px] ink-muted">{hint}</p>}
    </div>
  );
};

export const Donut: React.FC<{
  items: Array<{ label: string; value: number; tone: string }>;
  centerLabel?: string;
}> = ({ items, centerLabel }) => {
  const total = items.reduce((s, i) => s + i.value, 0);
  let offset = 0;
  const segments = items.map((i) => {
    const pct = total ? (i.value / total) * 100 : 0;
    const seg = { ...i, pct, from: offset };
    offset += pct;
    return seg;
  });
  const gradient = total
    ? `conic-gradient(${segments.map((s) => `${s.tone} ${s.from}% ${s.from + s.pct}%`).join(', ')})`
    : '#F2F1ED';

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[116px] w-[116px] flex-shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="font-display text-[22px] font-bold leading-none ink">{total}</span>
          {centerLabel && <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide ink-subtle">{centerLabel}</span>}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: i.tone }} />
            <span className="flex-1 truncate text-[13px] ink-muted">{i.label}</span>
            <span className="font-display text-[14px] font-bold ink">{i.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BarList: React.FC<{ items: Array<{ label: string; value: number; tone?: string }> }> = ({ items }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] ink-muted">{i.label}</span>
            <span className="font-display text-[15px] font-bold ink">{i.value}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F2F1ED]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(i.value / max) * 100}%`, background: i.tone || '#14110F' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const Meter: React.FC<{ label: string; used: number; total: number; unit?: string }> = ({ label, used, total, unit = 'days' }) => {
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="font-display mt-2 text-[40px] font-bold leading-none ink">
            {total - used}
            <span className="ml-2 text-[15px] font-medium ink-subtle">{unit} left</span>
          </p>
        </div>
        <p className="text-[13px] ink-subtle">{pct}% used</p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#F2F1ED]">
        <div className="h-full rounded-full bg-[#14110F] transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] ink-subtle">
        {used} of {total} {unit} used
      </p>
    </div>
  );
};

export const ListRow: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
}> = ({ icon, title, meta, trailing }) => (
  <div className="flex items-start gap-3 border-b hairline px-5 py-3.5 last:border-b-0">
    {icon && <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#F2F1ED]">{icon}</span>}
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-semibold ink">{title}</div>
      {meta && <div className="mt-0.5 text-[11px] ink-subtle">{meta}</div>}
    </div>
    {trailing && <div className="flex-shrink-0">{trailing}</div>}
  </div>
);
