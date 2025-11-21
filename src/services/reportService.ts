import apiClient from './apiClient';

export interface CreateReportPayload {
  roomId: string;
  reportedSeatNumber: number;
  message: string;
}

export interface ReportResponse {
  id: string;
  roomId: string;
  reportedSeatNumber: number;
  message: string;
  status: string;
  createdAt: string;
}

export const createReport = async (payload: CreateReportPayload) => {
  const { data } = await apiClient.post<ReportResponse>('/api/reports', payload);
  return data;
};

export const fetchMyReports = async () => {
  const { data } = await apiClient.get<ReportResponse[]>('/api/reports/me');
  return data;
};
