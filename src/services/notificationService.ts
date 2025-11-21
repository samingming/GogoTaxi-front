import apiClient from './apiClient';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type?: string;
  data?: Record<string, unknown> | null;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
}

export interface NotificationRequest {
  title: string;
  body: string;
}

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await apiClient.get<NotificationListResponse | NotificationItem[]>(
    '/api/notifications'
  );
  if (Array.isArray(data)) return data;
  return data.notifications ?? [];
};

export const sendTestNotification = async (payload: NotificationRequest) => {
  const { data } = await apiClient.post('/api/notifications/test', payload);
  return data;
};
