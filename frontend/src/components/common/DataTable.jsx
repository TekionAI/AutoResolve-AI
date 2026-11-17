
import React from 'react';
import Loading from './Loading';

export default function DataTable({
  columns,
  data,
  loading,
  emptyMessage = "No data found."
}) {
  if (loading) return <Loading />;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 bg-[#1F2937] rounded-xl border border-white/10">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] border border-white/10 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] text-slate-400 uppercase border-b border-white/10 bg-[#111827]/70">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-6 py-4 font-semibold tracking-wider whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {data.map((row, i) => (
            <tr
              key={row._id || row.id || i}
              className="hover:bg-white/[0.03] transition-colors duration-150"
            >
              {columns.map((col, j) => (
                <td
                  key={j}
                  className="px-6 py-4 whitespace-nowrap text-slate-200"
                >
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
