<template>
  <div class="route-map">
    <div ref="canvas" class="route-map__canvas" />
    <div v-if="errorMessage" class="route-map__fallback route-map__fallback--error">
      <strong>지도를 불러오지 못했어요.</strong>
      <p>{{ errorMessage }}</p>
    </div>
    <div v-else-if="!ready" class="route-map__fallback">
      <strong>경로 지도를 불러오는 중입니다.</strong>
      <p>네트워크 상태를 확인하거나 잠시만 기다려 주세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RoomLocation } from '@/types/rooms'
import { loadKakaoMaps } from '@/utils/kakaoMaps'

type KakaoNamespace = typeof window.kakao

const props = defineProps<{
  departure: RoomLocation
  arrival: RoomLocation
  title?: string
}>()

const ready = ref(false)
const errorMessage = ref<string | null>(null)
const canvas = ref<HTMLDivElement | null>(null)

let kakaoApi: KakaoNamespace | null = null
let map: any = null
let polyline: any = null
const markers: any[] = []
let resizeHandler: (() => void) | null = null

function setError(message: string, detail?: unknown) {
  ready.value = false
  errorMessage.value = message
   
  console.error('[RouteMapBox]', message, detail)
}

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null))
  markers.splice(0, markers.length)
}

function clearPolyline() {
  if (polyline) {
    polyline.setMap(null)
    polyline = null
  }
}

function renderStraightRoute() {
  if (!map || !kakaoApi) return
  clearMarkers()
  clearPolyline()

  const departure = new kakaoApi.maps.LatLng(props.departure.position.lat, props.departure.position.lng)
  const arrival = new kakaoApi.maps.LatLng(props.arrival.position.lat, props.arrival.position.lng)

  const departureMarker = new kakaoApi.maps.Marker({
    position: departure,
    map,
    title: `${props.title ?? '방'} 출발`,
  })
  const arrivalMarker = new kakaoApi.maps.Marker({
    position: arrival,
    map,
    title: `${props.title ?? '방'} 도착`,
  })

  markers.push(departureMarker, arrivalMarker)

  polyline = new kakaoApi.maps.Polyline({
    map,
    path: [departure, arrival],
    strokeWeight: 5,
    strokeColor: '#f97316',
    strokeOpacity: 0.85,
    strokeStyle: 'solid',
  })

  const bounds = new kakaoApi.maps.LatLngBounds()
  bounds.extend(departure)
  bounds.extend(arrival)
  map.setBounds(bounds)
}

function initializeMap(kakao: KakaoNamespace) {
  if (!canvas.value) return
  kakaoApi = kakao
  map = new kakao.maps.Map(canvas.value, {
    center: new kakao.maps.LatLng(props.departure.position.lat, props.departure.position.lng),
    level: 4,
  })
  ready.value = true
  errorMessage.value = null
  renderStraightRoute()

  resizeHandler = () => {
    if (!map) return
    if (typeof map.relayout === 'function') {
      map.relayout()
    }
    renderStraightRoute()
  }
  window.addEventListener('resize', resizeHandler)
  requestAnimationFrame(() => resizeHandler && resizeHandler())
}

onMounted(async () => {
  const kakao = await loadKakaoMaps()
  if (!kakao) {
    setError('카카오 지도 SDK를 사용할 수 없습니다.')
    return
  }
  initializeMap(kakao)
})

watch(
  () => [
    props.departure.position.lat,
    props.departure.position.lng,
    props.arrival.position.lat,
    props.arrival.position.lng,
  ],
  () => {
    if (map && kakaoApi) {
      renderStraightRoute()
    }
  },
)

onBeforeUnmount(() => {
  clearMarkers()
  clearPolyline()
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  map = null
  kakaoApi = null
})
</script>

<style scoped>
.route-map {
  position: relative;
  width: 100%;
  height: clamp(220px, 36vh, 340px);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.route-map__canvas {
  width: 100%;
  height: 100%;
  background: #eceff7;
}

.route-map__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
  color: #7c2d12;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 247, 237, 0.85));
  gap: 8px;
  font-size: 14px;
}

.route-map__fallback strong {
  font-size: 16px;
}

.route-map__fallback--error {
  color: #b91c1c;
  background: linear-gradient(180deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.04));
}
</style>
