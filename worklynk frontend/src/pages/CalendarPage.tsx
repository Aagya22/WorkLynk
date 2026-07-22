import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { CalendarCard } from '../components/CalendarCard';
import { StatTile } from '../components/Bento';
import { PartyPopper, CalendarDays, CalendarClock, CalendarCheck } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const load = async () => {
      try {
        const res = await api.get('/api/leaves/me');
        setLeaves(res.data.leaves || []);
      } catch (err) {
        console.error('Failed to load leaves for calendar:', err);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/holidays');
        setEntries(res.data.holidays || []);
      } catch (err) {
        console.error('Failed to load holidays for calendar:', err);
      }
    };
    load();
  }, []);

  const isAdmin = user?.role === 'admin';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const holidaysThisMonth = entries.filter(
    (e) => e.type === 'holiday' && new Date(e.date) >= startOfToday && new Date(e.date) <= monthEnd,
  ).length;
  const eventsThisMonth = entries.filter(
    (e) => e.type === 'event' && new Date(e.date) >= startOfToday && new Date(e.date) <= monthEnd,
  ).length;
  const nextUp = entries
    .filter((e) => new Date(e.date) >= startOfToday)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const upcomingLeave = leaves.filter((l) => l.status === 'approved' && new Date(l.startDate) >= startOfToday).length;

  return (
    <>
      <div className="space-y-8">

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up stagger-1">
            <StatTile label="Holidays left" value={holidaysThisMonth} tone="critical" hint="Remaining this month" icon={<PartyPopper size={16} />} />
          </div>
          <div className="animate-slide-up stagger-2">
            <StatTile label="Events left" value={eventsThisMonth} tone="info" hint="Remaining this month" icon={<CalendarDays size={16} />} />
          </div>
          <div className="animate-slide-up stagger-3">
            <StatTile
              label="Next up"
              value={nextUp ? new Date(nextUp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
              tone="violet"
              hint={nextUp ? nextUp.title : 'Nothing scheduled'}
              icon={<CalendarClock size={16} />}
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <StatTile
              label={isAdmin ? 'Weekly holiday' : 'Your time off'}
              value={isAdmin ? 'Saturday' : upcomingLeave}
              tone="positive"
              hint={isAdmin ? 'Recurring every week' : 'Approved & upcoming'}
              icon={<CalendarCheck size={16} />}
            />
          </div>
        </div>

        <CalendarCard leaves={leaves} canManage={isAdmin} />
      </div>
    </>
  );
};
