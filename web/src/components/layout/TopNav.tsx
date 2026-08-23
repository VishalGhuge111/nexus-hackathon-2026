'use client';
import React, { useState } from 'react';
import { Bell, ShieldCheck, User, Search, CheckCircle2, Activity } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { bus } from '../../events/eventBus';

export function TopNav() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
    document.dispatchEvent(event);
  };

  return (
    <header className="h-14 bg-white border-b border-zinc-200/80 flex items-center justify-between px-6 shrink-0 z-40 relative select-none">
      {/* Brand & System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">NEXUS</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-200/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-zinc-600 tracking-tight">Autonomous Engine Active</span>
        </div>
      </div>

      {/* Global Quick Search Shortcut */}
      <div className="hidden md:flex items-center">
        <button
          onClick={openCommandPalette}
          className="flex cursor-pointer items-center gap-3 px-3.5 py-1.5 rounded-lg bg-zinc-100/80 hover:bg-zinc-100 text-zinc-500 border border-zinc-200/70 text-xs transition-colors shadow-2xs"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search size={14} className="text-zinc-400" />
          <span className="font-medium text-zinc-600">Quick search or actions...</span>
          <kbd className="font-mono text-[10px] font-semibold bg-white text-zinc-500 border border-zinc-200 px-1.5 py-0.5 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions: Notifications & Profile */}
      <div className="flex items-center gap-3">
        <button
          className="relative cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          onClick={() => setNotifOpen(!notifOpen)}
          aria-label="View notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute 1.5 top-1.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200/80">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-600">
            <User size={15} />
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-semibold text-zinc-800">Operator Console</p>
            <p className="text-[10px] text-zinc-400">Plant 1 · Alpha Line</p>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {notifOpen && (
        <div className="absolute top-14 right-6 w-84 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="cursor-pointer text-xs text-blue-600 font-medium hover:underline hover:text-blue-700"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 scroll-thin">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-zinc-800">All clear</p>
                <p className="text-xs text-zinc-400 mt-0.5">No unread notifications or active alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 transition-colors ${!n.read ? 'bg-blue-50/40' : 'bg-white hover:bg-zinc-50/50'}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">{n.title}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          {n.timestamp ? n.timestamp.slice(11, 16) : 'now'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.message}</p>
                      {n.action && (
                        <button
                          onClick={() => {
                            bus.publish(n.action!.event, n.action!.payload);
                            setNotifOpen(false);
                          }}
                          className="mt-2 cursor-pointer px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
                        >
                          {n.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}