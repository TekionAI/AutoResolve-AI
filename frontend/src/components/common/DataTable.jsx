import React from 'react';
import Loading from './Loading';

export default function DataTable({ columns, data, loading, emptyMessage = "No data found." }) {
  if (loading) return <Loading />;
  if (!data || data.length === 0) return <div className="text-center py-10 text-slate-400 bg-dark-800 rounded-xl border border-dark-700">{emptyMessage}</div>;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 uppercase border-b border-dark-700 bg-dark-900/50">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 font-semibold tracking-wider">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700">
          {data.map((row, i) => (
            <tr key={row._id || row.id || i} className="hover:bg-dark-700/50 transition-colors">
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap text-slate-200">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}