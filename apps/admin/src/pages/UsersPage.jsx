import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import { Users, ShieldAlert, UserX, UserCheck, Search } from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => api.getUsers({ page, search: search || undefined })
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }) => api.blockUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockReason('');
    }
  });

  const unblockMutation = useMutation({
    mutationFn: (id) => api.unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Community User Registry
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage submitters and enforce abuse restrictions. Identifiable Telegram IDs are strictly restricted to backend operations.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by first name, last name, or username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading users...</div>
        ) : data?.users?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Submissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.users?.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {u.firstName || u.telegramUsername ? `${u.firstName || ''} (${u.telegramUsername ? '@' + u.telegramUsername : 'Anonymous'})` : 'Anonymous Submitter'}
                    </td>
                    <td className="px-4 py-3 font-mono uppercase">{u.languageCode}</td>
                    <td className="px-4 py-3 font-semibold">{u._count?.submissions || 0}</td>
                    <td className="px-4 py-3">
                      {u.isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                          Restricted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isBlocked ? (
                        <button
                          onClick={() => unblockMutation.mutate(u.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedUser(u); setShowBlockModal(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Restrict
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

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Restrict Abusive User</h3>
            <p className="text-xs text-slate-500">
              Restricting will prevent this user from submitting questions or reports through the Telegram bot.
            </p>
            <textarea
              rows={3}
              required
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. Repeated spam or false claims submitted"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={!blockReason || blockMutation.isPending}
                onClick={() => blockMutation.mutate({ id: selectedUser.id, reason: blockReason })}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
              >
                {blockMutation.isPending ? 'Restricting...' : 'Confirm Restriction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
