import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BookOpen,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useSyllaborn } from '../hooks/useSyllaborn';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export const AnalyticsPage: React.FC = () => {
  const { courses, milestones, data, levelInfo } = useSyllaborn();

  const totalQuests = milestones.length;
  const completedQuests = useMemo(() => milestones.filter((m) => m.status === 'completed'), [milestones]);
  const pendingQuests = useMemo(() => milestones.filter((m) => m.status === 'pending'), [milestones]);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueQuests = useMemo(() => {
    return pendingQuests.filter((m) => m.dueDate && m.dueDate < todayStr);
  }, [pendingQuests, todayStr]);

  const completionRate = totalQuests > 0 ? Math.round((completedQuests.length / totalQuests) * 100) : 0;

  // 1. Course-wise completion data for BarChart
  const courseCompletionData = useMemo(() => {
    return courses.map((course) => {
      const courseMilestones = milestones.filter((m) => m.courseId === course.id);
      const done = courseMilestones.filter((m) => m.status === 'completed').length;
      const pending = courseMilestones.length - done;

      return {
        name: course.courseCode,
        completed: done,
        pending,
        total: courseMilestones.length,
      };
    });
  }, [courses, milestones]);

  // 2. Assessment Type Breakdown for PieChart
  const typeBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    milestones.forEach((m) => {
      counts[m.milestoneType] = (counts[m.milestoneType] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  }, [milestones]);

  // 3. XP Progression Over Time from actual transactions
  const xpTimelineData = useMemo(() => {
    const sorted = [...data.xpTransactions].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    let runningTotal = 0;
    return sorted.map((t, idx) => {
      runningTotal += t.amount;
      return {
        step: idx + 1,
        date: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        xp: runningTotal,
      };
    });
  }, [data.xpTransactions]);

  // 4. Assessment Weight Distribution by Course
  const courseWeightData = useMemo(() => {
    return courses.map((c) => {
      const cMilestones = milestones.filter((m) => m.courseId === c.id);
      const totalWeight = cMilestones.reduce((acc, m) => acc + (m.weightPercent || 0), 0);
      return {
        name: c.courseCode,
        weight: totalWeight,
      };
    });
  }, [courses, milestones]);

  if (milestones.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
            Academic Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual statistics and completion velocity computed strictly from your local quest records.
          </p>
        </div>
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-cyan-400" />}
          title="No Academic Data Recorded Yet"
          description="Analytics will populate automatically as soon as you inscribe courses and upload syllabi."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
            Academic Performance Analytics
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Visual metrics derived strictly from canonical local courses, milestones, and XP transactions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Overall Completion
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{completionRate}%</div>
          <span className="text-[11px] text-slate-500">
            {completedQuests.length} of {totalQuests} quests
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Pending Quests
          </span>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {pendingQuests.length}
          </div>
          <span className="text-[11px] text-slate-500">Awaiting submission</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Overdue Tasks
          </span>
          <div
            className={`text-2xl font-bold font-mono ${
              overdueQuests.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {overdueQuests.length}
          </div>
          <span className="text-[11px] text-slate-500">
            {overdueQuests.length === 0 ? 'Zero overdue! Great pace.' : 'Past deadline'}
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Total Academic XP
          </span>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {levelInfo.totalXp}
          </div>
          <span className="text-[11px] text-slate-500">Level {levelInfo.level} Scholar</span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course-wise Completion */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-fantasy font-bold text-sm text-slate-100">
              Quests Completed vs Pending by Course
            </h3>
            <Badge variant="purple">Course Comparison</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseCompletionData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1020',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Milestone Type Distribution */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-fantasy font-bold text-sm text-slate-100">
              Assessment Types Breakdown
            </h3>
            <Badge variant="cyan">Distribution</Badge>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {typeBreakdownData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1020',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* XP Progression Over Time */}
        <Card className="p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="font-fantasy font-bold text-sm text-slate-100">
                Experience Progression Velocity Over Time
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {data.xpTransactions.length} XP Events Recorded
            </span>
          </div>

          {xpTimelineData.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center italic">
              No XP transactions recorded yet. Complete your first quest to begin tracking progression!
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={xpTimelineData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1020',
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xp"
                    name="Total XP"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
