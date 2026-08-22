'use client';

import { useEffect, useMemo, useState } from 'react';
import { bus, type NotificationEvent } from '../events/eventBus';

export interface NotificationItem extends NotificationEvent {
  id: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = bus.subscribe<NotificationItem>('NEW_NOTIFICATION', (payload) => {
      const next = payload as NotificationItem;
      setNotifications((current) => [next, ...current]);
    });

    return unsubscribe;
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
