import apiClient from './apiClient'

export interface RideHistoryRoom {
  id: string
  title: string
  departureLabel: string
  arrivalLabel: string
  departureTime: string
}

export interface RideHistoryEntry {
  id: string
  roomId: string
  userId: string
  role: string
  deposit: number
  extraCollect: number
  refund: number
  netAmount: number
  actualFare: number
  settledAt: string
  createdAt: string
  room: RideHistoryRoom
}

type RideHistoryResponse = {
  histories: RideHistoryEntry[]
}

export async function fetchRideHistory() {
  const { data } = await apiClient.get<RideHistoryResponse | RideHistoryEntry[]>('/api/rides/history')
  if (Array.isArray(data)) return data
  return data.histories ?? []
}
