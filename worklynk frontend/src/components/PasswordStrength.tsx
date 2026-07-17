import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

const requirements = [
  { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*()_+[\]{};':",./<>?~`|\\-]/.test(p) }
];

const levels = [
  { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-400' },
  { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' },
  { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' },
  { label: 'Good', color: 'bg-yellow-400', text: 'text-yellow-300' },
  { label: 'Strong', color: 'bg-green-500', text: 'text-green-400' },
  { label: 'Very Strong', color: 'bg-green-500', text: 'text-green-400' }
];

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const met = requirements.filter((r) => r.test(password)).length;
  // Bonus point for generous length once all base rules pass.
  const score = met === requirements.length && password.length >= 16 ? 5 : met;
  const level = levels[score];
  const pct = (score / (levels.length - 1)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${level.color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${level.text}`}>
          {level.label}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-1">
        {requirements.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={`flex items-center gap-1.5 text-[10px] font-medium ${ok ? 'text-green-400' : 'text-slate-500'}`}
            >
              <span>{ok ? '✓' : '○'}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
