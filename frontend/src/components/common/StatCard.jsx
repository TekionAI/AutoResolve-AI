import React from 'react';
export default function StatCard({ title, value, colorClass = "border-dark-700 text-white" }) {
  return (
    <div className={`bg-dark-800 p-6 rounded-xl border shadow-sm transition-all hover:border-dark-600 ${colorClass}`}>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
    </div>
  );
}