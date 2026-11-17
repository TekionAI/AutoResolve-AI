
import React from 'react';

export default function StatCard({
  title,
  value,
  colorClass = "text-white"
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#1F2937] p-6 rounded-xl border border-white/10 shadow-sm
        transition-all duration-200 hover:-translate-y-1
        hover:shadow-lg hover:border-[#00C3B4]/40 ${colorClass}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-[#00C3B4]/70 rounded-l-xl" />

      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">
          {title}
        </p>

        <span className="w-2 h-2 rounded-full bg-[#00C3B4]" />
      </div>

      <h3 className="text-3xl font-bold tracking-tight">
        {value}
      </h3>
    </div>
  );
}
