
import React from 'react';

export default function StatusBadge({ status }) {
  const getStyles = () => {
    const s = status?.toLowerCase() || '';

    if (
      s.includes('block') ||
      s.includes('shortage') ||
      s.includes('reject') ||
      s.includes('fail')
    ) {
      return {
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        dot: 'bg-red-400'
      };
    }

    if (s.includes('progress') || s.includes('active')) {
      return {
        badge: 'bg-[#00C3B4]/10 text-[#00C3B4] border-[#00C3B4]/20',
        dot: 'bg-[#00C3B4]'
      };
    }

    if (
      s.includes('complete') ||
      s.includes('approve') ||
      s.includes('success')
    ) {
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400'
      };
    }

    if (
      s.includes('wait') ||
      s.includes('pend') ||
      s.includes('hold')
    ) {
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400'
      };
    }

    return {
      badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      dot: 'bg-slate-400'
    };
  };

  const styles = getStyles();

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${styles.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {status || 'Unknown'}
    </span>
  );
}
