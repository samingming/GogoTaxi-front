declare namespace kakao {
  namespace maps {
    type MapOptions = {
      center: LatLng
      level?: number
      draggable?: boolean
    }

    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class LatLngBounds {
      extend(latlng: LatLng): void
    }

    class Map {
      constructor(container: HTMLElement, options?: MapOptions)
      setBounds(bounds: LatLngBounds): void
      setCenter(latlng: LatLng): void
      getCenter(): LatLng
      setDraggable(draggable: boolean): void
      setZoomable(zoomable: boolean): void
    }

    class Marker {
      constructor(options: { position: LatLng; map?: Map; draggable?: boolean; title?: string })
      setMap(map: Map | null): void
      setPosition(latlng: LatLng): void
      getPosition(): LatLng
    }

    class Polyline {
      constructor(options?: { path?: LatLng[] })
      setPath(path: LatLng[]): void
      getLength(): number
    }

    namespace services {
      type Status = 'OK' | 'ZERO_RESULT' | 'ERROR'

      type PlacesSearchResult = {
        id?: string
        place_name: string
        road_address_name?: string
        address_name?: string
        x: string
        y: string
      }

      class Places {
        keywordSearch(
          keyword: string,
          callback: (data: PlacesSearchResult[], status: Status) => void,
          options?: { size?: number },
        ): void
      }

      type GeocoderResult = {
        road_address?: { address_name: string }
        address?: { address_name: string }
      }

      class Geocoder {
        coord2Address(
          lng: number,
          lat: number,
          callback: (result: GeocoderResult[], status: Status) => void,
        ): void
      }
    }

    namespace event {
      type MouseEvent = { latLng: LatLng }
      function addListener(target: any, type: string, handler: (event: MouseEvent) => void): void
    }
  }
}
