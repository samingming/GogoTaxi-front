<template>
  <div class="location-picker-backdrop" role="dialog" aria-modal="true">
    <div class="location-picker">
      <header class="location-picker__header">
        <h2>{{ title }}</h2>
        <button type="button" class="location-picker__close" @click="$emit('cancel')">×</button>
      </header>
      <div class="location-picker__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="주소를 입력해 주세요."
          @keydown.enter.prevent="searchAddress"
        />
        <button type="button" :disabled="searching" @click="searchAddress">
          {{ searching ? '검색 중...' : '주소 검색' }}
        </button>
      </div>
      <ul v-if="suggestions.length" class="location-picker__suggestions">
        <li v-for="item in suggestions" :key="item.id">
          <button type="button" @click="selectSuggestion(item)">
            <strong>{{ item.name }}</strong>
            <span>{{ item.address }}</span>
          </button>
        </li>
      </ul>
      <p v-if="searchStatus" class="location-picker__status">{{ searchStatus }}</p>
      <div ref="mapEl" class="location-picker__map" />
      <p class="location-picker__coords">
        {{ selectedLabel || '지도를 움직여 위치를 선택해 주세요.' }}
      </p>
      <div class="location-picker__actions">
        <button type="button" class="picker-btn picker-btn--ghost" @click="$emit('cancel')">취소</button>
        <button type="button" class="picker-btn picker-btn--primary" @click="confirmSelection">위치 선택</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { GeoPoint } from '@/types/rooms'
import { loadKakaoMaps } from '@/utils/kakaoMaps'

type KakaoLatLng = {
  getLat(): number
  getLng(): number
}
type KakaoMapInstance = {
  setCenter(latlng: KakaoLatLng): void
  getCenter(): KakaoLatLng
}
type KakaoMarkerInstance = {
  setPosition(latlng: KakaoLatLng): void
  getPosition(): KakaoLatLng
}
type KakaoMouseClickEvent = {
  latLng: KakaoLatLng
}
type KakaoGeocoderResult = {
  x: string
  y: string
  address?: { address_name?: string }
  road_address?: { address_name?: string }
}
type KakaoGeocoder = {
  addressSearch(
    query: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void,
  ): void
  coord2Address(
    lng: number,
    lat: number,
    callback: (result: KakaoGeocoderResult[], status: string) => void,
  ): void
}
type KakaoPlacesResult = {
  id?: string
  place_name: string
  road_address_name?: string
  address_name?: string
  x?: string
  y?: string
}
type KakaoPlaces = {
  keywordSearch(
    query: string,
    callback: (result: KakaoPlacesResult[], status: string) => void,
    options?: { size?: number },
  ): void
}
type KakaoEventHandler = ((event: KakaoMouseClickEvent) => void) | (() => void)
type KakaoNamespace = {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    Map: new (
      element: HTMLElement | null,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMapInstance
    Marker: new (options: {
      position: KakaoLatLng
      draggable?: boolean
      map?: KakaoMapInstance | null
    }) => KakaoMarkerInstance
    services: {
      Geocoder: new () => KakaoGeocoder
      Places: new () => KakaoPlaces
      Status: { OK: string }
    }
    event: {
      addListener(
        target: KakaoMapInstance | KakaoMarkerInstance,
        type: string,
        handler: KakaoEventHandler,
      ): void
      removeListener(
        target: KakaoMapInstance | KakaoMarkerInstance,
        type: string,
        handler: KakaoEventHandler,
      ): void
    }
  }
}

const props = defineProps<{
  title: string
  initialPosition?: GeoPoint
}>()

const emit = defineEmits<{
  confirm: [{ position: GeoPoint; label: string }]
  cancel: []
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const selectedPosition = ref<GeoPoint>(props.initialPosition ?? { lat: 37.5665, lng: 126.978 })
const searchQuery = ref('')
const searchStatus = ref('')
const searching = ref(false)
const GENERIC_LABEL = '선택한 위치'
const selectedLabel = ref('')
const suggestions = ref<
  Array<{ id: string; name: string; address: string; lat: number; lng: number }>
>([])

let kakaoApi: KakaoNamespace | null = null
let map: KakaoMapInstance | null = null
let marker: KakaoMarkerInstance | null = null
let clickHandler: ((event: KakaoMouseClickEvent) => void) | null = null
let dragEndHandler: (() => void) | null = null
let geocoder: KakaoGeocoder | null = null
let placesService: KakaoPlaces | null = null
let suggestionTimer: ReturnType<typeof setTimeout> | null = null
let suppressAutoSuggest = false

function setMarkerPosition(position: GeoPoint, label?: string) {
  selectedPosition.value = position
  if (label) {
    selectedLabel.value = label
  } else {
    updateLabelFromPosition(position)
  }
  if (!marker || !kakaoApi) return
  const latlng = new kakaoApi.maps.LatLng(position.lat, position.lng) as KakaoLatLng
  marker.setPosition(latlng)
  map?.setCenter(latlng)
}

function updateLabelFromPosition(position: GeoPoint) {
  if (!geocoder || !kakaoApi) {
    selectedLabel.value = GENERIC_LABEL
    return
  }
  geocoder.coord2Address(position.lng, position.lat, (result, status) => {
    if (status === kakaoApi!.maps.services.Status.OK && result[0]) {
      selectedLabel.value =
        result[0].road_address?.address_name ??
        result[0].address?.address_name ??
        GENERIC_LABEL
    } else {
      selectedLabel.value = GENERIC_LABEL
    }
  })
}

function confirmSelection() {
  emit('confirm', {
    position: { ...selectedPosition.value },
    label: selectedLabel.value || GENERIC_LABEL,
  })
}

function searchAddress() {
  const query = searchQuery.value.trim()
  if (!query) {
    searchStatus.value = '주소를 입력해 주세요.'
    return
  }
  if (!geocoder && kakaoApi?.maps?.services) {
    geocoder = new kakaoApi.maps.services.Geocoder() as KakaoGeocoder
  }
  if (!geocoder) {
    searchStatus.value = '카카오 지도 서비스를 사용할 수 없습니다.'
    return
  }
  searching.value = true
  searchStatus.value = '검색 중...'
  geocoder.addressSearch(query, (result: KakaoGeocoderResult[], status: string) => {
    searching.value = false
    if (status !== kakaoApi?.maps?.services?.Status.OK || !result?.length) {
      searchStatus.value = '주소를 찾지 못했어요. 다시 시도해 주세요.'
      return
    }
    const first = result[0]
    if (!first) {
      searchStatus.value = '주소를 찾지 못했어요. 다시 시도해 주세요.'
      return
    }
    const position = {
      lat: Number(first.y),
      lng: Number(first.x),
    }
    const label =
      first.road_address?.address_name ??
      first.address?.address_name ??
      GENERIC_LABEL
    searchStatus.value = `${label}로 이동했어요.`
    setMarkerPosition(position, label)
  })
}

async function initMap() {
  const kakao = await loadKakaoMaps()
  if (!kakao) {
    console.error('[LocationPicker] 카카오 지도를 불러오지 못했습니다.')
    return
  }
  kakaoApi = kakao as unknown as KakaoNamespace
  const center = new kakaoApi.maps.LatLng(
    selectedPosition.value.lat,
    selectedPosition.value.lng,
  ) as KakaoLatLng
  map = new kakaoApi.maps.Map(mapEl.value, {
    center,
    level: 4,
  }) as KakaoMapInstance
  marker = new kakaoApi.maps.Marker({
    position: center,
    draggable: true,
    map,
  }) as KakaoMarkerInstance
  geocoder = new kakaoApi.maps.services.Geocoder() as KakaoGeocoder
  updateLabelFromPosition(selectedPosition.value)
  placesService = new kakaoApi.maps.services.Places() as KakaoPlaces

  kakaoApi.maps.event.addListener(marker as KakaoMarkerInstance, 'dragend', () => {
    const position = marker!.getPosition()
    setMarkerPosition({ lat: position.getLat(), lng: position.getLng() })
  })

  const updateFromMapCenter = () => {
    if (!map) return
    const currentCenter = map.getCenter()
    setMarkerPosition({ lat: currentCenter.getLat(), lng: currentCenter.getLng() })
  }

  dragEndHandler = updateFromMapCenter
  kakaoApi.maps.event.addListener(map, 'dragend', updateFromMapCenter)

  const clickFn = (mouseEvent: KakaoMouseClickEvent) => {
    const latlng = mouseEvent.latLng
    setMarkerPosition({ lat: latlng.getLat(), lng: latlng.getLng() })
  }
  clickHandler = clickFn
  if (map) {
    kakaoApi.maps.event.addListener(map, 'click', clickFn)
  }
}

function runSuggestionSearch(keyword: string) {
  if (!placesService || !kakaoApi) return
  placesService.keywordSearch(
    keyword,
    (result, status) => {
      if (status !== kakaoApi!.maps.services.Status.OK || !Array.isArray(result) || !result.length) {
        suggestions.value = []
        return
      }
      suggestions.value = result.slice(0, 6).map(item => ({
        id: item.id ?? `${item.x}-${item.y}-${item.place_name}`,
        name: item.place_name,
        address: item.road_address_name || item.address_name || '주소 정보를 찾지 못했어요.',
        lat: Number(item.y),
        lng: Number(item.x),
      }))
    },
    { size: 6 },
  )
}

function selectSuggestion(item: { id: string; name: string; address: string; lat: number; lng: number }) {
  suppressAutoSuggest = true
  searchQuery.value = item.name
  suggestions.value = []
  searchStatus.value = ''
  setMarkerPosition({ lat: item.lat, lng: item.lng }, item.address || item.name)
}

watch(searchQuery, value => {
  if (suppressAutoSuggest) {
    suppressAutoSuggest = false
    return
  }
  const keyword = value.trim()
  if (suggestionTimer) {
    clearTimeout(suggestionTimer)
    suggestionTimer = null
  }
  if (keyword.length < 2) {
    suggestions.value = []
    return
  }
  suggestionTimer = setTimeout(() => runSuggestionSearch(keyword), 250)
})

watch(
  () => props.initialPosition,
  newPos => {
    if (newPos) {
      setMarkerPosition(newPos)
    }
  },
  { immediate: true },
)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (kakaoApi && map && clickHandler) {
    kakaoApi.maps.event.removeListener(map, 'click', clickHandler)
  }
  if (kakaoApi && map && dragEndHandler) {
    kakaoApi.maps.event.removeListener(map, 'dragend', dragEndHandler)
  }
  if (suggestionTimer) {
    clearTimeout(suggestionTimer)
  }
  map = null
  kakaoApi = null
})
</script>

<style scoped>
.location-picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}

.location-picker {
  width: min(420px, 90vw);
  border-radius: 24px;
  background: #fffdf5;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  display: grid;
  gap: 12px;
  padding: 18px;
}

.location-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.location-picker__header h2 {
  margin: 0;
  font-size: 18px;
  color: #92400e;
}

.location-picker__close {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: #b45309;
}

.location-picker__map {
  width: 100%;
  height: 260px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.location-picker__search {
  display: flex;
  gap: 8px;
}
.location-picker__suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 16px;
  background: #fffef8;
  max-height: 210px;
  overflow-y: auto;
}
.location-picker__suggestions li + li {
  border-top: 1px solid rgba(148, 81, 9, 0.1);
}
.location-picker__suggestions button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}
.location-picker__suggestions button strong {
  font-size: 14px;
  color: #7c2d12;
}
.location-picker__suggestions button span {
  font-size: 12px;
  color: #92400e;
}
.location-picker__suggestions button:hover {
  background: rgba(251, 191, 36, 0.15);
}

.location-picker__search input {
  flex: 1;
  border: 1px solid rgba(251, 191, 36, 0.6);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 16px;
  line-height: 1.2;
  background: #fffef5;
}

.location-picker__search button {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.4);
  color: #92400e;
  cursor: pointer;
}

.location-picker__search button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.location-picker__status {
  margin: 0;
  font-size: 12px;
  color: #b45309;
}

.location-picker__coords {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
}

.location-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.picker-btn {
  border-radius: 14px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.picker-btn--ghost {
  background: rgba(253, 230, 138, 0.25);
  color: #92400e;
}

.picker-btn--primary {
  background: #fbbf24;
  color: #7c2d12;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
}
</style>
