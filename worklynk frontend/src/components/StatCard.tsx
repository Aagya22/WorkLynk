import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: 'blue' | 'green' | 'amber' | 'rose' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  variant = 'blue',
}) => {
  const accentClasses = {
    blue: 'hover:border-[#4F8CFF]/30 shadow-[#4F8CFF]/2',
    green: 'hover:border-[#22C55E]/30 shadow-[#22C55E]/2',
    amber: 'hover:border-[#F59E0B]/30 shadow-[#F59E0B]/2',
    rose: 'hover:border-[#EF4444]/30 shadow-[#EF4444]/2',
    indigo: 'hover:border-[#4F8CFF]/30 shadow-[#4F8CFF]/2',
  };

  const topAccentColors = {
    blue: 'bg-[#4F8CFF]',
    green: 'bg-[#22C55E]',
    amber: 'bg-[#F59E0B]',
    rose: 'bg-[#EF4444]',
    indigo: 'bg-[#4F8CFF]',
  };

  const glowClasses = {
    blue: 'bg-[#4F8CFF]/5 text-[#4F8CFF]',
    green: 'bg-[#22C55E]/5 text-[#22C55E]',
    amber: 'bg-[#F59E0B]/5 text-[#F59E0B]',
    rose: 'bg-[#EF4444]/5 text-[#EF4444]',
    indigo: 'bg-[#4F8CFF]/5 text-[#4F8CFF]',
  };

  return (
    <div className={`bg-[#0D1326] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between ${accentClasses[variant]} hover:scale-101 hover:bg-[#0D1326]/90 transition-all duration-300 relative overflow-hidden`}>
      {/* Top Colored Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${topAccentColors[variant]}`} />

      <div className="flex flex-col space-y-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">
          {title}
        </span>
        <div className="flex items-center justify-between">
          <span className="text-[42px] font-extrabold text-[#F8FAFC] tracking-tight leading-none">
            {value}
          </span>
          {icon && (
            <div className={`p-2 rounded-lg border border-white/5 flex items-center justify-center flex-shrink-0 ${glowClasses[variant]}`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'h-4.5 w-4.5' }) : icon}
            </div>
          )}
        </div>
        {description && (
          <span className="text-[12px] text-[#94A3B8] font-medium mt-1">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
