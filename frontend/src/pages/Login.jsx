import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Lock, Mail, Loader2 } from 'lucide-react';

export default function Login() {
 const [email, setEmail] = useState('manager@autoresolve.ai');
const [password, setPassword] = useState('Manager@123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl"></div>
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 mb-4">
            <BrainCircuit size={32} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">AutoResolve<span className="text-blue-500">AI</span></h2>
          <p className="text-slate-400 text-sm mt-2">Sign in to Service Operations Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full bg-dark-900 border border-dark-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                className="w-full bg-dark-900 border border-dark-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center shadow-lg shadow-blue-900/20 mt-6">
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}