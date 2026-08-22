export type EventPayloadMap = {
  NEW_NOTIFICATION: NotificationEvent;
  SCENARIO_CHANGED: { scenario: string };
  [key: string]: unknown;
};

export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    event: string;
    payload: Record<string, unknown>;
  };
}

export type EventHandler<T = unknown> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const set = this.listeners.get(event) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.listeners.set(event, set);

    return () => {
      const current = this.listeners.get(event);
      if (!current) return;
      current.delete(handler as EventHandler);
      if (current.size === 0) this.listeners.delete(event);
    };
  }

  publish<T = unknown>(event: string, payload: T): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of Array.from(listeners)) {
      listener(payload);
    }
  }
}

export const bus = new EventBus();
