import { reactive } from 'vue';
import type { NotificationItem } from '@/services/notificationService';
import { fetchNotifications } from '@/services/notificationService';

const state = reactive({
  notifications: [] as NotificationItem[],
  queue: [] as NotificationItem[],
  isPolling: false,
  pollingTimer: 0 as undefined | number,
  hasInitialLoad: false,
});

const dedupeMap = new Map<string, boolean>();

const pushNotifications = (items: NotificationItem[]) => {
  const fresh = items.filter((item) => {
    if (!item.id || dedupeMap.has(item.id)) return false;
    dedupeMap.set(item.id, true);
    return true;
  });
  if (!fresh.length) return;
  state.notifications.push(...fresh);
  if (state.hasInitialLoad) {
    state.queue.push(...fresh);
  }
};

export const useNotificationStore = () => state;

export const fetchNotificationFeed = async () => {
  const items = await fetchNotifications();
  pushNotifications(items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  if (!state.hasInitialLoad) {
    state.hasInitialLoad = true;
  }
};

export const startNotificationPolling = (interval = 20000) => {
  if (state.isPolling || typeof window === 'undefined') return;
  state.isPolling = true;
  const loop = async () => {
    try {
      await fetchNotificationFeed();
    } catch (error) {
      console.warn('알림을 불러오지 못했습니다.', error);
    } finally {
      state.pollingTimer = window.setTimeout(loop, interval);
    }
  };
  loop();
};

export const stopNotificationPolling = () => {
  state.isPolling = false;
  if (state.pollingTimer && typeof window !== 'undefined') {
    clearTimeout(state.pollingTimer);
    state.pollingTimer = undefined;
  }
};

export const shiftNotificationQueue = () => state.queue.shift();
