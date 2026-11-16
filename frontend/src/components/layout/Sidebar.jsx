
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, Box, Truck, MapPin,
  BrainCircuit, CalendarClock, LineChart, Users,
  Settings, X
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

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-dark-700 shrink-0">
          <div className="flex items-center space-x-2 text-blue-500 font-bold text-xl tracking-wide">
            <BrainCircuit size={24} />
            <span className="text-white">
              AutoResolve<span className="text-blue-500">AI</span>
            </span>
          </div>

          <button onClick={toggle} className="lg:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-2 mt-2">
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
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-dark-700 hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
