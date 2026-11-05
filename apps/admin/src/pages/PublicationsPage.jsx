import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import { Send, Trash2, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function PublicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedPub, setSelectedPub] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['publications', { page }],
    queryFn: () => api.getPublications({ page })
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }) => api.removePublication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRemoveModal(false);
      setSelectedPub(null);
      setRemoveReason('');
    }
  });

  const retryMutation = useMutation({
    mutationFn: (id) => api.retryPublication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-600" />
          Channel Publications
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          History of all public broadcasts to the configured Ethiopian Telegram channel
        </p>
      </div>

      {/* Publications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading publications...</div>
        ) : data?.publications?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No channel publications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Message Ref</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Broadcast Text</th>
                  <th className="px-4 py-3">Reports</th>
                  <th className="px-4 py-3">Published At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.publications?.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono">
                      <span className="text-slate-700 dark:text-slate-300">ID: {pub.messageId}</span>
                      <span className="block text-[10px] text-slate-400">{pub.channelId}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      #{pub.submission?.submissionNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {pub.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">Removed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                      {pub.postText}
                    </td>
                    <td className="px-4 py-3">
                      {pub._count?.reports > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {pub._count.reports} Flagged
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(pub.publishedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {pub.status === 'ACTIVE' && (
                        <button
                          onClick={() => { setSelectedPub(pub); setShowRemoveModal(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      {showRemoveModal && selectedPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Channel Publication</h3>
            <p className="text-xs text-slate-500">
              Removing this publication will mark it as REMOVED and attempt to delete the message on Telegram.
            </p>
            <textarea
              rows={3}
              required
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Reason for removing this publication..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={!removeReason || removeMutation.isPending}
                onClick={() => removeMutation.mutate({ id: selectedPub.id, reason: removeReason })}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
              >
                {removeMutation.isPending ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
