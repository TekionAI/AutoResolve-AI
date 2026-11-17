
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-full w-full py-12 gap-3">
      <Loader2
        className="animate-spin text-[#00C3B4]"
        size={36}
        strokeWidth={2}
      />
      <p className="text-xs font-medium text-slate-500 tracking-wide">
        Loading...
      </p>
    </div>
  );
}
