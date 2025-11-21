import apiClient from './apiClient';

export interface CreateReviewPayload {
  roomId: string;
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: string;
  roomId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const createReview = async (payload: CreateReviewPayload) => {
  const { data } = await apiClient.post<ReviewResponse>('/api/reviews', payload);
  return data;
};

export const fetchRoomReviews = async (roomId: string) => {
  const { data } = await apiClient.get<ReviewResponse[]>(`/api/reviews/room/${roomId}`);
  return data;
};
