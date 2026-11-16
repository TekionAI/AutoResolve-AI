import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  
  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-md border-b border-dark-700 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 sticky top-0">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 text-slate-400 hover:text-white"><Menu size={24} /></button>
        <h2 className="text-sm font-semibold text-slate-400 tracking-wider">SERVICE OPERATIONS PLATFORM</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-6 w-px bg-dark-700 mx-2"></div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-white leading-none">{user?.name || 'Authorized User'}</p>
            <p className="text-xs text-blue-400 mt-1 capitalize">{user?.role || 'Service Advisor'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-slate-300">
             <User size={18} />
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors ml-2">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}