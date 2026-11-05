import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Calendar,
  Lock,
  X,
  AlertTriangle
} from 'lucide-react';

export default function SubmissionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', { page, status, search }],
    queryFn: () => api.getSubmissions({ page, status: status || undefined, search: search || undefined })
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }) => api.approveSubmission(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedSubmission(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.rejectSubmission(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectReason('');
    }
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PUBLISHED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">Published</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">Under Review</span>;
      case 'READY_TO_PUBLISH':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">Ready</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Rejected</span>;
      case 'REMOVED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">Removed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Submissions Library</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Browse, filter, and inspect submitted community questions and safety accounts
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search submission text..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="READY_TO_PUBLISH">Ready to Publish</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading submissions...</div>
        ) : data?.submissions?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No submissions found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Public Preview</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.submissions?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">#{s.submissionNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {s.category?.nameEn}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(s.status)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                      {s.publicContent || s.originalContent}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono">#{selectedSubmission.submissionNumber}</span>
                {getStatusBadge(selectedSubmission.status)}
                <span className="text-xs text-slate-500">{selectedSubmission.category?.nameEn}</span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original content (Restricted to moderator) */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                Original Submitter Text (Confidential Moderator View)
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedSubmission.originalContent || 'Redacted'}
              </p>
            </div>

            {/* Sanitized Public Content */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sanitized Public Preview (Post Version)
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedSubmission.publicContent || selectedSubmission.originalContent}
              </p>
            </div>

            {/* Eligibility Evaluation Details */}
            {selectedSubmission.eligibilityReasons && (
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Eligibility Analysis Notes:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {Array.isArray(selectedSubmission.eligibilityReasons) ? (
                    selectedSubmission.eligibilityReasons.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <li>Manual review required</li>
                  )}
                </ul>
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              {selectedSubmission.status !== 'PUBLISHED' && selectedSubmission.status !== 'REJECTED' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
                  >
                    Reject Submission
                  </button>
                  <button
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate({ id: selectedSubmission.id })}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve & Schedule Publish'}
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reject Submission</h3>
            <p className="text-xs text-slate-500">Provide an internal reason for rejecting this submission:</p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. Contains unverified defamatory accusations or privacy violations"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: selectedSubmission.id, reason: rejectReason })}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
