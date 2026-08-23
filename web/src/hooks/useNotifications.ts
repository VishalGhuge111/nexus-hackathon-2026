'use client';

import { useEffect, useMemo, useState } from 'react';
import { bus, type NotificationEvent } from '../events/eventBus';
import { fetchDashboardSummary, fetchAllAuditEvents } from '../lib/api-client';

export interface NotificationItem extends NotificationEvent {
  id: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // 1. Subscribe to event bus for instant real-time pushes
    const unsubscribe = bus.subscribe<NotificationItem>('NEW_NOTIFICATION', (payload) => {
      const next = payload as NotificationItem;
      setNotifications((current) => {
        if (current.some((n) => n.id === next.id)) return current;
        return [next, ...current];
      });
    });

    // 2. Initial fetch & live sync from backend audit & case states
    let cancelled = false;

    async function syncBackendAlerts() {
      try {
        const [summary, auditEvents] = await Promise.all([
          fetchDashboardSummary().catch(() => null),
          fetchAllAuditEvents().catch(() => null)
        ]);

        if (cancelled) return;

        const dynamicAlerts: NotificationItem[] = [];

        // Add pending approval alerts
        if (summary?.cases) {
          for (const c of summary.cases) {
            if (c.status === 'HUMAN_ESCALATED_AWAITING_DECISION') {
              dynamicAlerts.push({
                id: `notif-approval-${c.id}`,
                title: 'Human Governance Approval Required',
                message: `Emergency recovery order for case ${c.id.slice(0, 12)}... exceeds ₹10,000 policy threshold and requires sign-off.`,
                type: 'warning',
                timestamp: new Date().toISOString(),
                read: false,
                action: {
                  label: 'Review Decision',
                  event: 'OPEN_CASE_MODAL',
                  payload: { caseId: c.id }
                }
              });
            } else if (c.status === 'NO_FEASIBLE_RECOVERY') {
              dynamicAlerts.push({
                id: `notif-infeasible-${c.id}`,
                title: 'Infeasible Recovery Exception',
                message: `No eligible supplier can meet deadline constraints for case ${c.id.slice(0, 12)}...`,
                type: 'error',
                timestamp: new Date().toISOString(),
                read: false
              });
            }
          }
        }

        // Add recent audit event alerts
        if (auditEvents && auditEvents.length > 0) {
          const recent = auditEvents.slice(0, 4);
          for (const a of recent) {
            dynamicAlerts.push({
              id: `notif-audit-${a.id}`,
              title: `${a.actor} · ${a.type.replace(/_/g, ' ')}`,
              message: a.summary,
              type: a.actor === 'HUMAN' ? 'info' : a.summary.includes('Rejected') ? 'warning' : 'info',
              timestamp: a.timestamp,
              read: true
            });
          }
        }

        if (dynamicAlerts.length > 0) {
          setNotifications((current) => {
            const existingIds = new Set(current.map((n) => n.id));
            const fresh = dynamicAlerts.filter((d) => !existingIds.has(d.id));
            return [...fresh, ...current];
          });
        }
      } catch {
        // Continue silently
      }
    }

    syncBackendAlerts();
    const interval = setInterval(syncBackendAlerts, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  return { notifications, unreadCount, markAllRead };
}