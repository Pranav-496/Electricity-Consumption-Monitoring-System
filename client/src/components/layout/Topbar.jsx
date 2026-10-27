import React from 'react';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../common/Badge';

const Topbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout, role } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left items with Universal Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse Sidebar Menu" : "Expand Sidebar Menu"}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200/60"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-slate-700" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 text-emerald-600" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={role}>{role ? role.toUpperCase() : 'USER'}</Badge>
          <span className="hidden sm:inline-block text-xs text-slate-400">|</span>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-600">
            {role === 'admin' ? 'Central Utility Operation Center' : 'Consumer Self-Service Portal'}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.full_name || user?.username}</p>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
