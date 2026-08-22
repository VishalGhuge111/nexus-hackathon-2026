import { useState, useEffect } from 'react';
import { bus } from '../events/eventBus';
import { toast } from 'sonner';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    event: string;
    payload?: any;
  };
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = bus.subscribe('NEW_NOTIFICATION', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (notif.type === 'error') toast.error(notif.title, { description: notif.message });
      else if (notif.type === 'warning') toast.warning(notif.title, { description: notif.message });
      else if (notif.type === 'success') toast.success(notif.title, { description: notif.message });
      else toast.info(notif.title, { description: notif.message });
    });

    return unsubscribe;
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAllRead };
}