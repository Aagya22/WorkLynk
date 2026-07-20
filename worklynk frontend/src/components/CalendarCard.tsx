import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, PartyPopper, CalendarDays, Plane, CalendarClock } from 'lucide-react';

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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    .slice(0, 5);

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const shift = (n: number) => {
    setViewDate(new Date(y, m + n, 1));
    setSelectedDay(null);
  };

  // Selected-day detail
  const selectedDate = selectedDay ? new Date(y, m, selectedDay) : null;
  const selectedHoliday = selectedDay ? holidayMap.get(selectedDay) : undefined;
  const selectedIsLeave = selectedDay ? leaveDays.has(selectedDay) : false;
  const selectedIsWeekend = selectedDate ? selectedDate.getDay() === 0 || selectedDate.getDay() === 6 : false;

  const openCreate = (prefillDate?: string) => {
    setEditingId(null);
    setTitle('');
    setDate(prefillDate || '');
    setType('holiday');
    setFormError('');
    setDayModalOpen(false);
    setModalOpen(true);
  };
  const openEdit = (h: Holiday) => {
    setEditingId(h._id);
    setTitle(h.title);
    setDate(new Date(h.date).toISOString().slice(0, 10));
    setType(h.type);
    setFormError('');
    setDayModalOpen(false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !date) {
      setFormError('A title and date are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) await api.put(`/api/holidays/${editingId}`, { title, date, type });
      else await api.post('/api/holidays', { title, date, type });
      setModalOpen(false);
      setEditingId(null);
      setTitle('');
      setDate('');
      setType('holiday');
      fetchHolidays();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save entry.');
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

  const cellClass = (d: number) => {
    const weekday = new Date(y, m, d).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isToday = isCurrentMonth && d === today.getDate();
    const isSelected = selectedDay === d;
    const holiday = holidayMap.get(d);
    const isLeave = leaveDays.has(d);

    const parts = ['relative flex h-10 items-center justify-center rounded-lg text-[13px] cursor-pointer transition-all select-none'];
    if (holiday) parts.push(holiday.type === 'event' ? 'bg-blue-500/15 font-semibold text-blue-500' : 'bg-red-500/15 font-semibold text-red-500');
    else if (isLeave) parts.push('bg-emerald-500/15 font-semibold text-emerald-500');
    else if (isWeekend) parts.push('bg-slate-500/[0.06] text-slate-500');
    else parts.push('text-slate-300 hover:bg-slate-500/10');

    if (isSelected) parts.push('ring-2 ring-inset ring-accent-500');
    else if (isToday) parts.push('ring-1 ring-inset ring-accent-500');
    if (isToday) parts.push('font-bold');
    return parts.join(' ');
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
          <button onClick={() => openCreate()} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-white/25">
            <Plus size={13} /> Add event
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        {/* Grid */}
        <div className="flex-1">
          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) =>
              d === null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setSelectedDay(d); setDayModalOpen(true); }}
                  className={cellClass(d)}
                  title={holidayMap.get(d)?.title || (leaveDays.has(d) ? 'Approved leave' : '')}
                >
                  {d}
                </button>
              )
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-inset ring-accent-500" /> Today</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500/25" /> Holiday</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-500/25" /> Event</span>
            {leaves.length > 0 && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/25" /> Leave</span>}
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-500/20" /> Weekend</span>
          </div>
        </div>

        {/* Side panel — upcoming only */}
        <div className="lg:w-64 lg:border-l lg:border-white/[0.08] lg:pl-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((h) => (
                <li key={h._id} className="group flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${h.type === 'event' ? 'bg-blue-500/15 text-blue-500' : 'bg-red-500/15 text-red-500'}`}>
                    {h.type === 'event' ? <PartyPopper size={13} /> : <Plane size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-200">{h.title}</p>
                    <p className="text-[11px] text-slate-500">{fmt(h.date)}</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(h)} aria-label="Edit" className="text-slate-500 hover:text-accent-500"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(h._id)} aria-label="Remove" className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Day detail overlay */}
      <Modal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title={selectedDate ? selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Day'}
      >
        <div className="space-y-4">
          {selectedHoliday ? (
            <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-slate-900/40 p-4">
              <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${selectedHoliday.type === 'event' ? 'bg-blue-500/15 text-blue-500' : 'bg-red-500/15 text-red-500'}`}>
                {selectedHoliday.type === 'event' ? <PartyPopper size={16} /> : <Plane size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-200">{selectedHoliday.title}</p>
                <p className={`text-xs font-semibold ${selectedHoliday.type === 'event' ? 'text-blue-500' : 'text-red-500'}`}>{selectedHoliday.type === 'event' ? 'Event' : 'Holiday (non-working)'}</p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(selectedHoliday)} aria-label="Edit" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-accent-500"><Pencil size={15} /></button>
                  <button onClick={() => { handleDelete(selectedHoliday._id); setDayModalOpen(false); }} aria-label="Remove" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          ) : selectedIsLeave ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <CalendarClock size={18} className="text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-500">You're on approved leave this day.</p>
            </div>
          ) : selectedIsWeekend ? (
            <p className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-4 text-sm text-slate-400">Weekend — non-working day.</p>
          ) : (
            <p className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-4 text-sm text-slate-400">Nothing scheduled for this day.</p>
          )}

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
            {canManage && !selectedHoliday ? (
              <Button variant="primary" onClick={() => openCreate(selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined)}>
                <span className="flex items-center gap-2"><Plus size={15} /> Add event</span>
              </Button>
            ) : (
              <span />
            )}
            <Button variant="secondary" onClick={() => setDayModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Admin: add / edit entry */}
      {canManage && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Holiday or Event' : 'Add Holiday or Event'}>
          <form onSubmit={handleSave} className="space-y-4">
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
                <span className="flex items-center gap-2"><CalendarDays size={15} /> {editingId ? 'Save changes' : 'Add to calendar'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
