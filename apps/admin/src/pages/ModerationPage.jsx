import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit3,
  Lock,
  AlertCircle,
  Clock,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editedText, setEditedText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['moderationQueue'],
    queryFn: () => api.getSubmissions({ status: 'PENDING_REVIEW', limit: 50 }),
    refetchInterval: 15000
  });

  const pendingList = data?.submissions || [];
  const currentItem = pendingList[selectedIndex] || null;

  const approveMutation = useMutation({
    mutationFn: ({ id, editedPublicContent }) =>
      api.approveSubmission(id, { editedPublicContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsEditing(false);
      setEditedText('');
      if (selectedIndex >= pendingList.length - 1) {
        setSelectedIndex(Math.max(0, pendingList.length - 2));
      }
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.rejectSubmission(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectBox(false);
      setRejectReason('');
      if (selectedIndex >= pendingList.length - 1) {
        setSelectedIndex(Math.max(0, pendingList.length - 2));
      }
    }
  });

  const handleSelect = (idx) => {
    setSelectedIndex(idx);
    setIsEditing(false);
    setShowRejectBox(false);
    setEditedText('');
  };

  const handleApprove = () => {
    if (!currentItem) return;
    approveMutation.mutate({
      id: currentItem.id,
      editedPublicContent: isEditing ? editedText : currentItem.publicContent
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Moderation Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active human review queue for sensitive accounts, potential identifiers, and safety claims
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-900">
          {pendingList.length} Awaiting Review
        </span>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading moderation queue...</div>
      ) : pendingList.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Moderation Queue is Clear</h3>
          <p className="text-xs text-slate-500">All submitted content has been evaluated and reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Sidebar */}
          <div className="space-y-2 lg:col-span-1 max-h-[70vh] overflow-y-auto pr-1">
            {pendingList.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(idx)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">#{item.submissionNumber}</span>
                  <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-300 truncate mb-1">
                  {item.category?.nameEn}
                </div>
                <p className="text-slate-500 line-clamp-2">
                  {item.publicContent || item.originalContent}
                </p>
              </div>
            ))}
          </div>

          {/* Active Review Pane */}
          {currentItem && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold font-mono">Submission #{currentItem.submissionNumber}</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentItem.category?.nameEn}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(currentItem.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Reasons flagged */}
              {currentItem.eligibilityReasons && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-amber-800 dark:text-amber-400">⚠️ Flagged For Review Reason:</span>
                  <ul className="list-disc pl-4 text-slate-700 dark:text-slate-300 space-y-0.5">
                    {Array.isArray(currentItem.eligibilityReasons) ? (
                      currentItem.eligibilityReasons.map((r, i) => <li key={i}>{r}</li>)
                    ) : (
                      <li>Manual moderator verification required</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Attached Photos */}
              {currentItem.attachments && currentItem.attachments.length > 0 && (() => {
                const token = localStorage.getItem('taw_admin_token');
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      <ImageIcon className="w-4 h-4" />
                      Attached {currentItem.attachments.length > 1 ? `${currentItem.attachments.length} Photos` : 'Photo'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentItem.attachments.map((att) => (
                        <div key={att.id} className="relative rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 bg-slate-100 dark:bg-slate-800">
                          <img
                            src={api.getAttachmentImageUrl(att.id, token)}
                            alt="Submission attachment"
                            className="h-48 w-auto max-w-[280px] object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div
                            className="h-48 w-48 hidden items-center justify-center text-[10px] text-slate-400 p-2 text-center"
                          >
                            <span>Image unavailable<br /><code className="font-mono">{att.fileKey.slice(0, 12)}…</code></span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {currentItem.attachments.length > 1 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Will be published as a photo album ({currentItem.attachments.length} photos) to Telegram.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Original Content (Private) */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Original Submission (Private)
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {currentItem.originalContent || 'Redacted'}
                </div>
              </div>

              {/* Public Sanitized Version (Editable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Public Post Version (To be published to Telegram)</span>
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (!isEditing) setEditedText(currentItem.publicContent || currentItem.originalContent);
                    }}
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? 'Cancel Edit' : 'Edit Text'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    rows={5}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {currentItem.publicContent || currentItem.originalContent}
                  </div>
                )}
              </div>

              {/* Reject Reason input box */}
              {showRejectBox && (
                <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Reason for Rejection:</p>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Enter reason for rejection..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!rejectReason || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ id: currentItem.id, reason: rejectReason })}
                      className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {!showRejectBox && (
                  <button
                    onClick={() => setShowRejectBox(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                <button
                  disabled={approveMutation.isPending}
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {approveMutation.isPending ? 'Publishing...' : isEditing ? 'Save Edit & Publish' : 'Approve & Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
