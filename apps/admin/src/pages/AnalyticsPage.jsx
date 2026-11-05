import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.js';
import { BarChart3, TrendingUp, CheckCircle, ShieldCheck, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats
  });

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading analytics...</div>;
  }

  const categoryBarData = stats?.categoryDistribution?.map((c) => ({
    name: c.nameEn,
    submissions: c.count
  })) || [];

  const total = stats?.totalSubmissions || 1;
  const publishedRate = Math.round(((stats?.publishedCount || 0) / total) * 100);
  const rejectionRate = Math.round(((stats?.rejectedCount || 0) / total) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Platform Analytics & Health
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Metrics on submission flow, moderation approval ratios, and community volume
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Publication Approval Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{publishedRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Percentage of eligible community questions published</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Moderation Rejection Rate</span>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{rejectionRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Submissions rejected for policy or privacy violations</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Community Safety Inquiries</span>
            <Filter className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.pendingReviews || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Currently protected in human moderation review</p>
        </div>
      </div>

      {/* Chart: Category Breakdown */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Volume by Category</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="submissions" name="Submissions" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
