
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BrainCircuit,
  Lock,
  Mail,
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col justify-center items-center p-4 relative overflow-hidden">

      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#00C3B4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#007468]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1F2937] rounded-2xl border border-white/10 shadow-2xl p-8 relative z-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00C3B4]/10 rounded-2xl border border-[#00C3B4]/20 mb-5">
            <BrainCircuit size={34} className="text-[#00C3B4]" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            AutoResolve<span className="text-[#00C3B4]">AI</span>
          </h1>

          <p className="text-xs text-slate-500 uppercase tracking-[0.18em] mt-2">
            Service Intelligence
          </p>

          <div className="h-px bg-white/10 my-6" />

          <h2 className="text-xl font-semibold text-white">
            Welcome Back
          </h2>

          <p className="text-slate-400 text-sm mt-2">
            Sign in to your Service Operations Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Work Email
            </label>

            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />

              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="w-full bg-[#111827] border border-white/10 text-white placeholder-slate-600 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-[#00C3B4]/40 focus:border-[#00C3B4] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />

              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#111827] border border-white/10 text-white placeholder-slate-600 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-[#00C3B4]/40 focus:border-[#00C3B4] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00A99D] hover:bg-[#00C3B4] disabled:opacity-60 disabled:cursor-not-allowed text-[#071A19] font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#00C3B4]/10 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        <div className="mt-8 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500">
            Intelligent solutions for modern automotive service operations
          </p>
        </div>

      </div>

      <p className="text-xs text-slate-600 mt-6 relative z-10">
        AutoResolveAI · Service Management Platform
      </p>

    </div>
  );
}
