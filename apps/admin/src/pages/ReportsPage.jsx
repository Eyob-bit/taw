import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [removePost, setRemovePost] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', { page }],
    queryFn: () => api.getReports({ page })
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolutionNotes, removePost }) =>
      api.resolveReport(id, { resolutionNotes, removePost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowResolveModal(false);
      setSelectedReport(null);
      setResolutionNotes('');
      setRemovePost(false);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => api.dismissReport(id, 'Dismissed by moderator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Community Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          User reports regarding inaccurate claims, defamation, harassment, or privacy concerns
        </p>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : data?.reports?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No reports in the system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Reported At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Report Reason</th>
                  <th className="px-4 py-3">Referenced Post</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.reports?.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(rep.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {rep.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">Pending</span>
                      ) : rep.status === 'RESOLVED' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">Resolved</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Dismissed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-xs">
                      {rep.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                      #{rep.publication?.submission?.submissionNumber}: {rep.publication?.submission?.publicContent}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {rep.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => { setSelectedReport(rep); setShowResolveModal(true); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                          <button
                            onClick={() => dismissMutation.mutate(rep.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resolve Community Report</h3>
            <p className="text-xs text-slate-500">
              Reason reported: "{selectedReport.reason}"
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resolution Notes:
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="e.g. Investigation completed. Content violates policy and is removed."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="removePostCheck"
                checked={removePost}
                onChange={(e) => setRemovePost(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <label htmlFor="removePostCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Also remove publication from Telegram channel
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate({ id: selectedReport.id, resolutionNotes, removePost })}
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium disabled:opacity-50"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
