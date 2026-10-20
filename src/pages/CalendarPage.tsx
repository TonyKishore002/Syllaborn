import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Swords,
  Clock,
  Filter,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MilestoneModal } from '../components/quests/MilestoneModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Milestone } from '../types';

export const CalendarPage: React.FC = () => {
  const { courses, milestones } = useSyllaborn();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (courseFilter !== 'all' && m.courseId !== courseFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [milestones, courseFilter, statusFilter]);

  // Calendar matrix calculation for Month View
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDayOfMonth.getDate();

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateString: str,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      // Format as YYYY-MM-DD
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(i).padStart(2, '0');
      const str = `${year}-${mm}-${dd}`;
      days.push({
        dateString: str,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Trailing days from next month to fill grid
    const remaining = 42 - days.length; // 6 rows * 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateString: str,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [year, month]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
              Academic Deadline Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track submission deadlines and boss examinations across your semester schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View selector */}
          <div className="flex items-center rounded-xl bg-[#121528] p-1 border border-purple-500/25 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'month' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'list' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upcoming List
            </button>
          </div>

          <Button
            variant="cyan"
            size="sm"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Quest</span>
          </Button>
        </div>
      </div>

      {/* Navigation and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121528]/80 border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-fantasy font-bold text-slate-100 min-w-[180px]">
            {monthName}
          </h2>

          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="bg-[#0b0e1b] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0b0e1b] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="rounded-3xl border border-purple-500/20 bg-[#0d1020]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-purple-500/20 bg-[#12162b] text-center text-xs font-mono font-bold text-slate-400 py-3">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-purple-500/10">
            {calendarDays.map((day, idx) => {
              const dayMilestones = filteredMilestones.filter((m) => m.dueDate === day.dateString);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    day.isCurrentMonth ? 'bg-transparent' : 'bg-black/30 opacity-40'
                  } ${day.isToday ? 'bg-purple-950/25 ring-1 ring-inset ring-purple-500/40' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {dayMilestones.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {dayMilestones.length}
                      </span>
                    )}
                  </div>

                  {/* Day Milestone Badges */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayMilestones.map((m) => {
                      const course = getCourse(m.courseId);
                      const isBoss =
                        m.difficultyCategory === 'boss_fight' ||
                        m.difficultyCategory === 'final_raid';

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMilestone(m);
                            setIsMilestoneModalOpen(true);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-medium truncate cursor-pointer transition-all flex items-center gap-1 ${
                            m.status === 'completed'
                              ? 'bg-slate-800/80 line-through text-slate-400'
                              : isBoss
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40 shadow-sm'
                              : 'bg-[#181d38] text-slate-200 border border-purple-500/25 hover:border-cyan-400'
                          }`}
                          title={`${course?.courseCode}: ${m.title}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: course?.color || '#8b5cf6' }}
                          />
                          <span className="truncate">{m.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredMilestones.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#121528]/50 border border-purple-500/20 text-center text-xs text-slate-400">
              No milestones found matching the selected filters.
            </div>
          ) : (
            filteredMilestones
              .sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate > b.dueDate ? 1 : -1;
              })
              .map((m) => {
                const course = getCourse(m.courseId);
                const isBoss =
                  m.difficultyCategory === 'boss_fight' || m.difficultyCategory === 'final_raid';

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMilestone(m);
                      setIsMilestoneModalOpen(true);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      m.status === 'completed'
                        ? 'bg-[#0f1220]/60 border-slate-800 opacity-60'
                        : isBoss
                        ? 'bg-gradient-to-r from-[#1c1328] to-[#121528] border-rose-500/40 shadow-lg shadow-rose-950/20'
                        : 'bg-[#121528]/80 hover:bg-[#161a32] border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: course?.color || '#8b5cf6' }}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs text-slate-400">
                            {course?.courseCode}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {m.milestoneType}
                          </span>
                        </div>
                        <h4
                          className={`text-sm font-semibold ${
                            m.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {m.title}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs text-slate-300 block">
                        {m.dueDate || 'Date not specified'}
                      </span>
                      <span className="font-mono text-[10px] text-amber-300 font-bold">
                        +{m.xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Milestone Detail Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestoneToEdit={selectedMilestone}
      />
    </div>
  );
};
