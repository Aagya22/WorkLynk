import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { ChevronLeft, ChevronRight, Plus, Trash2, PartyPopper, CalendarDays, Plane } from 'lucide-react';

interface Holiday {
  _id: string;
  title: string;
  date: string;
  type: 'holiday' | 'event';
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const CalendarCard: React.FC<{ leaves?: any[]; canManage?: boolean }> = ({ leaves = [], canManage = false }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'holiday' | 'event'>('holiday');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/api/holidays');
      setHolidays(res.data.holidays || []);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    }
  };
  useEffect(() => {
    fetchHolidays();
  }, []);

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first

  // Marked days for the viewed month
  const holidayMap = new Map<number, Holiday>();
  holidays.forEach((h) => {
    const d = new Date(h.date);
    if (d.getFullYear() === y && d.getMonth() === m) holidayMap.set(d.getDate(), h);
  });

  const approved = leaves.filter((l) => l.status === 'approved');
  const leaveDays = new Set<number>();
  approved.forEach((l) => {
    const s = stripTime(new Date(l.startDate));
    const e = stripTime(new Date(l.endDate));
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(y, m, d);
      if (cur >= s && cur <= e) leaveDays.add(d);
    }
  });

  const upcoming = holidays
    .filter((h) => stripTime(new Date(h.date)) >= stripTime(today))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shift = (n: number) => setViewDate(new Date(y, m + n, 1));
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !date) {
      setFormError('A title and date are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/holidays', { title, date, type });
      setTitle('');
      setDate('');
      setType('holiday');
      setModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this calendar entry?')) return;
    try {
      await api.delete(`/api/holidays/${id}`);
      fetchHolidays();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  return (
    <section aria-label="Calendar" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1326] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <ChevronLeft size={17} />
          </button>
          <h2 className="min-w-[130px] text-center text-sm font-bold uppercase tracking-wider">
            {viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <ChevronRight size={17} />
          </button>
        </div>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-white/25">
            <Plus size={13} /> Add event
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        {/* Grid */}
        <div className="flex-1">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const weekday = new Date(y, m, d).getDay();
              const isWeekend = weekday === 0 || weekday === 6;
              const isToday = isCurrentMonth && d === today.getDate();
              const isLeave = leaveDays.has(d);
              const holiday = holidayMap.get(d);

              let cls = 'text-slate-300';
              if (isToday) cls = 'bg-accent-500 font-bold text-white';
              else if (holiday) cls = 'bg-accent-500/[0.14] font-semibold text-accent-500';
              else if (isLeave) cls = 'bg-accent-500/[0.10] font-semibold text-accent-400';
              else if (isWeekend) cls = 'bg-slate-500/[0.06] text-slate-500';

              return (
                <div
                  key={i}
                  title={holiday ? holiday.title : isLeave ? 'Approved leave' : isWeekend ? 'Weekend' : ''}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-[13px] ${cls}`}
                >
                  {d}
                  {holiday && !isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-500" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-accent-500" /> Today</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Holiday / Event</span>
            {leaves.length > 0 && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent-500/[0.14]" /> Leave</span>}
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-500/[0.15]" /> Weekend</span>
          </div>
        </div>

        {/* Upcoming */}
        <div className="lg:w-60 lg:border-l lg:border-white/[0.08] lg:pl-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Upcoming holidays &amp; events</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((h) => (
                <li key={h._id} className="group flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500/[0.10] text-accent-500">
                    {h.type === 'event' ? <PartyPopper size={14} /> : <Plane size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-200">{h.title}</p>
                    <p className="text-[11px] text-slate-500">{fmt(h.date)} · {h.type === 'event' ? 'Event' : 'Holiday'}</p>
                  </div>
                  {canManage && (
                    <button onClick={() => handleDelete(h._id)} aria-label="Remove" className="mt-0.5 text-slate-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Admin: add entry */}
      {canManage && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Holiday or Event">
          <form onSubmit={handleAdd} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">{formError}</div>
            )}
            <Input id="event-title" label="Title" type="text" placeholder="e.g. Christmas Day" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={submitting} />
            <Input id="event-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={submitting} />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'holiday' | 'event')}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-900/60 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-200 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              >
                <option value="holiday" className="bg-slate-950 text-slate-200">Holiday (non-working day)</option>
                <option value="event" className="bg-slate-950 text-slate-200">Event</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>
                <span className="flex items-center gap-2"><CalendarDays size={15} /> Add to calendar</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
