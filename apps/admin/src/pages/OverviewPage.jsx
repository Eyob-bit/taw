import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
    refetchInterval: 15000
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboardActivity'],
    queryFn: api.getDashboardActivity,
    refetchInterval: 15000
  });

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-4 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg">
        Failed to load statistics: {statsError.message}
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Submissions', value: stats?.totalSubmissions || 0, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Pending Reviews', value: stats?.pendingReviews || 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Published Posts', value: stats?.publishedCount || 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Rejected', value: stats?.rejectedCount || 0, icon: XCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'Open Reports', value: stats?.openReports || 0, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time metrics, submission activity, and safety operations
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{m.label}</span>
                <div className={`p-1.5 rounded-lg ${m.bg}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trends Area Chart */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Submissions (Last 14 Days)</h2>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Submissions" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Categories</h2>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.categoryDistribution || []}
                  dataKey="count"
                  nameKey="nameEn"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {(stats?.categoryDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Moderation & System Activity</h2>
        </div>

        {activityLoading ? (
          <p className="text-xs text-slate-400">Loading activity...</p>
        ) : activity?.moderationActions?.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No moderation actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2 rounded-l">Time</th>
                  <th className="px-3 py-2">Moderator</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Submission</th>
                  <th className="px-3 py-2 rounded-r">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activity?.moderationActions?.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 text-slate-500">{new Date(act.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{act.admin?.fullName || act.admin?.email}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {act.actionType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">#{act.submission?.submissionNumber || 'N/A'}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-xs">{act.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
