import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Settings, Server } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@ethiopia-awareness.org');
  const [password, setPassword] = useState('AdminSecurePassword123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [showConfig, setShowConfig] = useState(false);
  const [apiSaveMsg, setApiSaveMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      setError(msg);
      // Auto-open API configuration box if network failed or points to localhost
      if (msg.toLowerCase().includes('network error') || msg.toLowerCase().includes('refused') || isLocalhost) {
        setShowConfig(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    if (!apiUrl.trim()) return;
    let target = apiUrl.trim();
    if (!target.endsWith('/api') && !target.endsWith('/api/')) {
      target = `${target.replace(/\/+$/, '')}/api`;
      setApiUrl(target);
    }
    setApiBaseUrl(target);
    setApiSaveMsg('✅ API URL saved! Click Sign In to connect.');
    setError('');
    setTimeout(() => setApiSaveMsg(''), 5000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-emerald-600 text-white rounded-xl mb-3 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Control Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ethiopian Relationship Awareness & Community Platform
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span className="font-medium">{error}</span>
              {error.toLowerCase().includes('network error') && (
                <p className="mt-1 text-[11px] opacity-90">
                  The dashboard could not connect to <code>{apiUrl}</code>. Check your Render backend URL below.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Backend API Configuration Box */}
        {(showConfig || isLocalhost) && (
          <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300 mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>Backend API Connection</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2.5">
              Enter your live Render backend URL (e.g. <code>https://taw.onrender.com/api</code>):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://taw.onrender.com/api"
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveApiUrl}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors shrink-0 shadow-sm"
              >
                Save
              </button>
            </div>
            {apiSaveMsg && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
                {apiSaveMsg}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="admin@ethiopia-awareness.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle API configuration manually */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            {showConfig ? 'Hide Backend Connection' : 'Configure Backend Connection'}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            🔒 Authorized moderator & admin access only. All actions are cryptographically signed and audit-logged.
          </p>
        </div>
      </div>
    </div>
  );
}
