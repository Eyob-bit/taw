import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.js';
import { Settings, Save, CheckCircle, Radio, Shield, Hash } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    channelId: '',
    discussionGroupId: '',
    communityGuidelinesAm: '',
    communityGuidelinesEn: '',
    retentionDays: 365
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        channelId: settings.channelId || '',
        discussionGroupId: settings.discussionGroupId || '',
        communityGuidelinesAm: settings.communityGuidelinesAm || '',
        communityGuidelinesEn: settings.communityGuidelinesEn || '',
        retentionDays: settings.retentionDays || 365
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure Telegram channel targets, bilingual guidelines, and privacy retention policies
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Platform settings updated and applied successfully.</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Telegram Channel Configuration */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              Telegram Channel & Discussion Integration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Public Channel ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.channelId}
                  onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="-1001234567890"
                />
                <p className="text-[10px] text-slate-400 mt-1">Bot must be an Administrator with Post permissions.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Linked Discussion Group ID
                </label>
                <input
                  type="text"
                  value={formData.discussionGroupId}
                  onChange={(e) => setFormData({ ...formData, discussionGroupId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="-1009876543210"
                />
                <p className="text-[10px] text-slate-400 mt-1">For comments and anti-spam moderation.</p>
              </div>
            </div>
          </div>

          {/* Hashtags Management */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-600" />
              Official Category Hashtags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold block text-slate-700 dark:text-slate-300">Are We Dating The Same Guy?</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">#are_we_dating_the_same_guy</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold block text-slate-700 dark:text-slate-300">Relationship Safety Concern</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">#relationship_safety</span>
              </div>
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Community Guidelines & Privacy Notice
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amharic Guidelines (የማህበረሰብ ደንቦች)
                </label>
                <textarea
                  rows={3}
                  value={formData.communityGuidelinesAm}
                  onChange={(e) => setFormData({ ...formData, communityGuidelinesAm: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  English Guidelines
                </label>
                <textarea
                  rows={3}
                  value={formData.communityGuidelinesEn}
                  onChange={(e) => setFormData({ ...formData, communityGuidelinesEn: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
