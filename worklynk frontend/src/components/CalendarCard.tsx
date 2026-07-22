import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, PartyPopper, CalendarDays, Sun } from 'lucide-react';

interface Holiday {
  _id: string;
  title: string;
  date: string;
  type: 'holiday' | 'event';
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Saturday is the weekly non-working day.
const isWeeklyHoliday = (d: Date) => d.getDay() === 6;

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
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7;

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

  const selectedDate = selectedDay ? new Date(y, m, selectedDay) : null;
  const selectedHoliday = selectedDay ? holidayMap.get(selectedDay) : undefined;
  const selectedIsLeave = selectedDay ? leaveDays.has(selectedDay) : false;
  const selectedIsWeekly = selectedDate ? isWeeklyHoliday(selectedDate) : false;

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
    const cur = new Date(y, m, d);
    const weekly = isWeeklyHoliday(cur);
    const isToday = isCurrentMonth && d === today.getDate();
    const isSelected = selectedDay === d;
    const holiday = holidayMap.get(d);
    const isLeave = leaveDays.has(d);

    const parts = [
      'relative flex h-12 items-center justify-center rounded-xl text-[14px] font-medium',
      'cursor-pointer select-none transition-all duration-200',
    ];

    if (holiday?.type === 'event') parts.push('bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100');
    else if (holiday || weekly) parts.push('bg-red-50 font-semibold text-red-600 hover:bg-red-100');
    else if (isLeave) parts.push('bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100');
    else parts.push('ink hover:bg-[#F2F1ED]');

    if (isSelected) parts.push('ring-2 ring-inset ring-[#14110F]');
    else if (isToday) parts.push('ring-1 ring-inset ring-[#14110F]');
    if (isToday) parts.push('font-bold');
    return parts.join(' ');
  };

  return (
    <section aria-label="Calendar" className="paper overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b hairline px-6 py-5">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[22px] font-bold leading-none ink">
            {viewDate.toLocaleDateString('en-GB', { month: 'long' })}
          </h2>
          <span className="text-[15px] ink-subtle">{y}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {canManage && (
            <button
              onClick={() => openCreate()}
              className="mr-1 inline-flex items-center gap-1.5 rounded-lg bg-[#14110F] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#2B2724]"
            >
              <Plus size={13} /> Add
            </button>
          )}
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-2 ink-muted transition-colors hover:bg-[#F2F1ED] hover:ink">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-2 ink-muted transition-colors hover:bg-[#F2F1ED] hover:ink">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 p-6 lg:flex-row">
        {/* Grid */}
        <div className="flex-1">
          <div className="mb-3 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className={`py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] ${w === 'Sat' ? 'text-red-400' : 'ink-subtle'}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) =>
              d === null ? (
                <div key={i} />
              ) : (
                <button key={i} type="button" onClick={() => { setSelectedDay(d); setDayModalOpen(true); }} className={cellClass(d)}>
                  {d}
                </button>
              )
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t hairline pt-4 text-[11px] ink-muted">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-1 ring-inset ring-[#14110F]" /> Today</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100" /> Holiday</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-100" /> Event</span>
            {leaves.length > 0 && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100" /> Leave</span>}
          </div>
        </div>

        {/* Upcoming */}
        <div className="lg:w-60 lg:border-l lg:hairline lg:pl-8">
          <p className="eyebrow mb-4">Upcoming</p>
          {upcoming.length === 0 ? (
            <p className="text-[13px] ink-subtle">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((h) => (
                <li key={h._id} className="group flex items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${h.type === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    {h.type === 'event' ? <PartyPopper size={14} /> : <Sun size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold ink">{h.title}</p>
                    <p className="text-[11px] ink-subtle">{fmt(h.date)}</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(h)} aria-label="Edit" className="ink-subtle hover:ink"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(h._id)} aria-label="Remove" className="ink-subtle hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Day overlay */}
      <Modal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title={selectedDate ? selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Day'}
      >
        <div className="space-y-4">
          {selectedHoliday ? (
            <div className="flex items-start gap-3 rounded-xl border hairline p-4">
              <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${selectedHoliday.type === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                {selectedHoliday.type === 'event' ? <PartyPopper size={16} /> : <Sun size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold ink">{selectedHoliday.title}</p>
                <p className={`text-xs font-semibold ${selectedHoliday.type === 'event' ? 'text-blue-600' : 'text-red-600'}`}>
                  {selectedHoliday.type === 'event' ? 'Event' : 'Non-working holiday'}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(selectedHoliday)} aria-label="Edit" className="rounded-lg p-1.5 ink-subtle hover:ink"><Pencil size={15} /></button>
                  <button onClick={() => { handleDelete(selectedHoliday._id); setDayModalOpen(false); }} aria-label="Remove" className="rounded-lg p-1.5 ink-subtle hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          ) : selectedIsWeekly ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Saturday is the weekly holiday.</div>
          ) : selectedIsLeave ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">You're on approved leave this day.</div>
          ) : (
            <p className="rounded-xl border hairline p-4 text-sm ink-muted">Nothing scheduled for this day.</p>
          )}

          <div className="flex items-center justify-between border-t hairline pt-4">
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

      {/* Admin: add / edit */}
      {canManage && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Holiday or Event' : 'Add Holiday or Event'}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">{formError}</div>}
            <Input id="event-title" label="Title" type="text" placeholder="e.g. Dashain" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={submitting} />
            <Input id="event-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={submitting} />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'holiday' | 'event')}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-900/60 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="holiday" className="bg-slate-950 text-slate-200">Holiday (non-working day)</option>
                <option value="event" className="bg-slate-950 text-slate-200">Event</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t hairline pt-4">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>
                <span className="flex items-center gap-2"><CalendarDays size={15} /> {editingId ? 'Save changes' : 'Add'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
