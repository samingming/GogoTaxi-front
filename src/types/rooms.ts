export type GeoPoint = {
  lat: number
  lng: number
}

export type RoomLocation = {
  label: string
  position: GeoPoint
}

export type RoomPreview = {
  id: string
  title: string
  departure: RoomLocation
  arrival: RoomLocation
  time: string
  seats: number
  capacity: number
  filled: number
  tags: string[]
  eta?: string
  fare?: number
  status?:
    | 'recruiting'
    | 'requesting'
    | 'matching'
    | 'dispatching'
    | 'driver_assigned'
    | 'arriving'
    | 'aboard'
    | 'success'
    | 'failed'
  taxi?: {
    carNumber?: string
    driverName?: string
    carModel?: string
  }
}

export type RoomParticipant = {
  id: string
  name: string
  seatNumber: number | null
  role?: string
  status?: string
  joinedAt?: string
  email?: string
}
