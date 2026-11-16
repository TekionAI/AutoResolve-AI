import React from 'react';
import { Loader2 } from 'lucide-react';
export default function Loading() {
  return (
    <div className="flex justify-center items-center h-full w-full py-12">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );
}