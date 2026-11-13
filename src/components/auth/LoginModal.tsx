import React, { useState } from 'react';
import { Shield, Lock, Mail, X, AlertCircle, Loader2 } from 'lucide-react';
import { useSOC } from '../../context/SOCContext';
import morOfficialLogo from '../../assets/images/mor_official_logo.jpg';

export const LoginModal: React.FC = () => {
  const { loginModalOpen, setLoginModalOpen, loginWithPassword, dataMode } = useSOC();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Corporate email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await loginWithPassword(email.trim(), password);
      setPassword('');
      setLoginModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-sky-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-[#004e8c] via-[#0077c8] to-[#005a9e] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-white/80 shrink-0 overflow-hidden">
              <img
                src={morOfficialLogo}
                alt="Ministry of Revenues Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">SOC Backend Authentication</h3>
              <p className="text-[11px] text-sky-100">Ministry of Revenues · Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={() => setLoginModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            aria-label="Close Sign In Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-slate-700 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#0077c8] mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Connect to Live Production Telemetry</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Sign in with your provisioned SOC operator credentials to access live PostgreSQL telemetry, Windows endpoint agents, enrollment tokens, and real-time SSE alerts.
              {dataMode === 'demo' && ' Closing this window keeps the offline Demo Fallback active.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="operator@revenue.gov.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f8fbff] border border-sky-200 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f8fbff] border border-sky-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
            <button
              type="button"
              onClick={() => setLoginModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Continue in Demo Mode
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0077c8] hover:bg-[#0066b3] disabled:opacity-60 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Authenticating...' : 'Sign In to Live SOC'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
