
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggle = () => setSidebarOpen(prev => !prev);

  return (
    <div className="flex h-screen bg-[#111827] overflow-hidden font-sans text-slate-100">
      <Sidebar isOpen={sidebarOpen} toggle={toggle} />

      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-[#111827]">
        <Topbar toggleSidebar={toggle} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
