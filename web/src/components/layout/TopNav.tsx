'use client';
import React, { useState } from 'react';
import { Bell, ShieldCheck, User } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { bus } from '../../events/eventBus';

export function TopNav() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-40 relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">NEXUS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="cursor-pointer text-zinc-400 hover:text-zinc-900 transition-colors relative" onClick={() => setNotifOpen(!notifOpen)}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
          <User size={16} />
        </div>
      </div>

      {notifOpen && (
        <div className="absolute top-14 right-6 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
            <h3 className="font-bold text-zinc-900 text-sm">Notifications</h3>
            <button onClick={markAllRead} className="cursor-pointer text-xs text-blue-600 font-medium hover:underline">Mark all read</button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">No notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-zinc-100 ${!n.read ? 'bg-blue-50/50' : 'bg-white'}`}>
                  <div className="flex gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{n.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{n.message}</p>
                      {n.action && (
                        <button
                          onClick={() => { bus.publish(n.action!.event, n.action!.payload); setNotifOpen(false); }}
                          className="mt-2 cursor-pointer px-3 py-1.5 bg-zinc-900 text-white rounded text-xs font-bold hover:bg-zinc-800 transition-colors"
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
    </div>
  );
}
