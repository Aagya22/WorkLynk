import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: 'blue' | 'green' | 'amber' | 'rose' | 'indigo';
}

const palette = {
  blue: { accent: '#4F8CFF', hover: 'hover:border-[#4F8CFF]/40', glow: 'from-[#4F8CFF]/20' },
  green: { accent: '#22C55E', hover: 'hover:border-[#22C55E]/40', glow: 'from-[#22C55E]/20' },
  amber: { accent: '#F59E0B', hover: 'hover:border-[#F59E0B]/40', glow: 'from-[#F59E0B]/20' },
  rose: { accent: '#EF4444', hover: 'hover:border-[#EF4444]/40', glow: 'from-[#EF4444]/20' },
  indigo: { accent: '#818CF8', hover: 'hover:border-[#818CF8]/40', glow: 'from-[#818CF8]/20' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  variant = 'blue',
}) => {
  const c = palette[variant];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-lg ${c.hover}`}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.accent }} />
      {/* Corner color wash that intensifies on hover */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${c.glow} to-transparent opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />

      <div className="relative flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
            {title}
          </span>
          {icon && (
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${c.accent}1A`, color: c.accent }}
            >
              {icon}
            </div>
          )}
        </div>

        <span className="text-[40px] font-extrabold leading-none tracking-tight text-[#F8FAFC]">
          {value}
        </span>

        {description && (
          <span className="text-[12px] font-medium text-[#94A3B8]">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
