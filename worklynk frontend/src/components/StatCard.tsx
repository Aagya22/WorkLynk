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
    blue: 'border-l-4 border-primary-500 shadow-primary-500/5',
    green: 'border-l-4 border-green-500 shadow-green-500/5',
    amber: 'border-l-4 border-amber-500 shadow-amber-500/5',
    rose: 'border-l-4 border-rose-500 shadow-rose-500/5',
    indigo: 'border-l-4 border-indigo-500 shadow-indigo-500/5',
  };

  const glowClasses = {
    blue: 'bg-primary-500/5 text-primary-400',
    green: 'bg-green-500/5 text-green-400',
    amber: 'bg-amber-500/5 text-amber-400',
    rose: 'bg-rose-500/5 text-rose-400',
    indigo: 'bg-indigo-500/5 text-indigo-400',
  };

  return (
    <div className={`glassmorphism rounded-2xl p-6 shadow-xl flex items-center justify-between ${accentClasses[variant]} hover:scale-101 transition-transform duration-300`}>
      <div className="flex flex-col space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
          {value}
        </span>
        {description && (
          <span className="text-xs text-slate-400 mt-1 font-medium">{description}</span>
        )}
      </div>
      {icon && (
        <div className={`p-3.5 rounded-xl border border-white/5 flex items-center justify-center ${glowClasses[variant]}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
