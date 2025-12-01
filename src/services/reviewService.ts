import apiClient from './apiClient'
import type { RoomPreview } from '@/types/rooms'

export interface CreateReviewPayload {
  roomId: string;
  rating: number;
  comment: string;
}

export type ReviewRoomSnapshot = Partial<RoomPreview> & {
  departureLabel?: string
  arrivalLabel?: string
  departureName?: string
  arrivalName?: string
}

export interface ReviewResponse {
  id: string
  roomId: string
  rating: number
  comment: string
  createdAt: string
  room?: ReviewRoomSnapshot
  roomSnapshot?: ReviewRoomSnapshot
}

export const createReview = async (payload: CreateReviewPayload) => {
  const { data } = await apiClient.post<ReviewResponse>('/api/reviews', payload)
  return data
}

export const fetchRoomReviews = async (roomId: string) => {
  const { data } = await apiClient.get<ReviewResponse[]>(`/api/reviews/room/${roomId}`)
  return data
}

export const fetchMyReviews = async () => {
  const { data } = await apiClient.get<ReviewResponse[] | { reviews: ReviewResponse[] }>(
    '/api/reviews/me',
  )
  if (Array.isArray(data)) return data
  return data.reviews ?? []
}
