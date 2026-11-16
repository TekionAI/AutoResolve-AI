import React from 'react';
export default function StatusBadge({ status }) {
  const getStyles = () => {
    const s = status?.toLowerCase() || '';
    if (s.includes('block') || s.includes('shortage')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (s.includes('progress') || s.includes('active')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s.includes('complete') || s.includes('approve')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s.includes('wait') || s.includes('pend')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStyles()}`}>
      {status || 'Unknown'}
    </span>
  );
}