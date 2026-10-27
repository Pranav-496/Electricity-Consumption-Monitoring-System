import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gauge,
  Activity,
  Receipt,
  CreditCard,
  Bell,
  FileBarChart,
  Sliders,
  Settings,
  Zap,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin, user } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Consumers', path: '/admin/consumers', icon: Users },
    { name: 'Meters', path: '/admin/meters', icon: Gauge },
    { name: 'Consumption', path: '/admin/consumption', icon: Activity },
    { name: 'Billing', path: '/admin/billing', icon: Receipt },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Alerts', path: '/admin/alerts', icon: Bell },
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart },
    { name: 'Tariffs', path: '/admin/tariffs', icon: Sliders },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const consumerNav = [
    { name: 'Dashboard', path: '/consumer/dashboard', icon: LayoutDashboard },
    { name: 'Consumption', path: '/consumer/consumption', icon: Activity },
    { name: 'Bills', path: '/consumer/bills', icon: Receipt },
    { name: 'Payments', path: '/consumer/payments', icon: CreditCard },
    { name: 'Alerts', path: '/consumer/alerts', icon: Bell },
    { name: 'Reports', path: '/consumer/reports', icon: FileBarChart },
    { name: 'Settings', path: '/consumer/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : consumerNav;

  return (
    <>
      {/* Mobile Backdrop Overlay (only on small screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Docked Aside Navigation (Fixed, independent scrolling, flexible collapse) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Close Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">PowerGrid</span>
              <span className="block text-[10px] text-slate-400 tracking-wider uppercase font-semibold">ECMS Platform</span>
            </div>
          </div>

          {/* Close Sidebar Button (available for desktop and mobile) */}
          <button
            onClick={onClose}
            title="Collapse Sidebar"
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Independently scrollable) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            {isAdmin ? 'Grid Administration' : 'Consumer Portal'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card in Bottom */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-emerald-400 uppercase font-semibold">{user?.role || 'Guest'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
