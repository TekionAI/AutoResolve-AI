
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  Box,
  Truck,
  MapPin,
  BrainCircuit,
  CalendarClock,
  LineChart,
  Users,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['Manager', 'Service Advisor', 'Technician'] },
  { icon: Wrench, label: 'Repair Orders', path: '/repair-orders', roles: ['Manager', 'Service Advisor', 'Technician'] },
  { icon: Box, label: 'Inventory', path: '/inventory', roles: ['Manager', 'Service Advisor'] },
  { icon: Settings, label: 'Parts Master', path: '/parts', roles: ['Manager', 'Service Advisor'] },
  { icon: MapPin, label: 'Dealerships', path: '/dealerships', roles: ['Manager'] },
  { icon: Truck, label: 'Vendors', path: '/vendors', roles: ['Manager', 'Service Advisor'] },
  { icon: BrainCircuit, label: 'AI Decision Centre', path: '/ai-decision-centre', roles: ['Manager', 'Service Advisor'] },
  { icon: CalendarClock, label: 'Smart Scheduling', path: '/scheduling', roles: ['Manager', 'Service Advisor'] },
  { icon: LineChart, label: 'Analytics', path: '/analytics', roles: ['Manager'] },
  { icon: Users, label: 'Users', path: '/users', roles: ['Manager'] },
];

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role;

  const visibleItems = navItems.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64
          bg-[#111827] border-r border-white/10 flex flex-col
          transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#00C3B4]/10 text-[#00C3B4]">
              <BrainCircuit size={22} />
            </div>

            <div className="flex flex-col">
              <span className="text-white font-bold text-lg tracking-tight leading-tight">
                AutoResolve<span className="text-[#00C3B4]">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase">
                Service Intelligence
              </span>
            </div>
          </Link>

          <button
            onClick={toggle}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em] mb-4 ml-3">
            Operations
          </div>

          {visibleItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggle();
                }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 text-sm font-medium ${
                    active
                      ? 'bg-[#00C3B4]/10 text-[#00C3B4] border border-[#00C3B4]/20'
                      : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-100'
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#00C3B4]" />
                )}

                <Icon
                  size={18}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={active ? 'text-[#00C3B4]' : 'text-slate-500'}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">
            Built for modern automotive service operations
          </p>
        </div>
      </aside>
    </>
  );
}
