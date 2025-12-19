<template>
  <section class="create-room">
    <div class="create-room__container">
      <header class="create-room__hero">
        <h1>방 만들기</h1>
      </header>

      <form class="form" @submit.prevent="submitForm">
        <div class="form-grid">
          <label class="field">
            <span>방 이름</span>
            <input
              v-model.trim="form.title"
              type="text"
              maxlength="25"
              placeholder="꼬꼬택과 고고 택시~"
              :class="{ 'is-empty': !form.title }"
            />
          </label>

          <label class="field field--autocomplete">
            <span>출발지</span>
            <div class="input-with-action">
              <input
                v-model="departureQuery"
                type="text"
                placeholder="예) 강남역 5번 출구"
                autocomplete="off"
                :class="{ 'is-empty': !departureQuery }"
                @focus="setActiveField('departure')"
                @blur="handleBlur('departure')"
              />
              <button
                type="button"
                class="pin-button"
                @mousedown.prevent
                @click="openMapPicker('departure')"
                aria-label="지도에서 출발지 선택"
              >
                <span class="pin-button__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                    <path
                      d="M12 21c-4.8-5.4-7.2-9.3-7.2-12.2A7.2 7.2 0 1 1 19.2 8.8c0 2.9-2.4 6.8-7.2 12.2Z"
                      fill="currentColor"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#fff7e6" />
                  </svg>
                </span>
              </button>
            </div>
            <p v-if="isSearching.departure" class="hint">검색 중...</p>
            <ul
              v-if="activeField === 'departure' && departureSuggestions.length"
              class="suggestion-list"
            >
              <li v-for="place in departureSuggestions" :key="place.id">
                <button type="button" @mousedown.prevent="selectPlace('departure', place)">
                  <strong>{{ place.name }}</strong>
                  <span>{{ place.address }}</span>
                </button>
              </li>
            </ul>
          </label>

          <label class="field field--autocomplete">
            <span>도착지</span>
            <div class="input-with-action">
              <input
                v-model="arrivalQuery"
                type="text"
                placeholder="예) 인천국제공항 T1"
                autocomplete="off"
                :class="{ 'is-empty': !arrivalQuery }"
                @focus="setActiveField('arrival')"
                @blur="handleBlur('arrival')"
              />
              <button
                type="button"
                class="pin-button"
                @mousedown.prevent
                @click="openMapPicker('arrival')"
                aria-label="지도에서 도착지 선택"
              >
                <span class="pin-button__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                    <path
                      d="M12 21c-4.8-5.4-7.2-9.3-7.2-12.2A7.2 7.2 0 1 1 19.2 8.8c0 2.9-2.4 6.8-7.2 12.2Z"
                      fill="currentColor"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#fff7e6" />
                  </svg>
                </span>
              </button>
            </div>
            <p v-if="isSearching.arrival" class="hint">검색 중...</p>
            <ul
              v-if="activeField === 'arrival' && arrivalSuggestions.length"
              class="suggestion-list"
            >
              <li v-for="place in arrivalSuggestions" :key="place.id">
                <button type="button" @mousedown.prevent="selectPlace('arrival', place)">
                  <strong>{{ place.name }}</strong>
                  <span>{{ place.address }}</span>
                </button>
              </li>
            </ul>
          </label>

          <label class="field">
            <span>출발 시간</span>
            <button
              type="button"
              class="time-trigger"
              :class="{ 'is-placeholder': !form.departureTime }"
              @click="openTimePicker"
            >
              <span class="time-trigger__value">
                {{ displayDepartureTime }}
              </span>
            </button>
            <input type="hidden" :value="form.departureTime" />
          </label>
        </div>

        <div class="fare-upload">
          <FareInfoCard
            :pending="farePending || recognizedFare === null"
            :total-fare="recognizedFare ?? undefined"
            :per-person-fare="null"
            :allow-upload="true"
            :upload-action-link="uberDeepLink"
            upload-action-label="Uber 앱 열기"
            @fare-recognized="handleFareRecognized"
            @fare-pending="farePending = true"
          />
        </div>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <footer class="actions">
          <button type="button" class="ghost-button reset-button" @click="resetForm">초기화</button>
          <button type="submit" class="primary-button" :disabled="!isValid || isSubmitting">
            방 생성하기
          </button>
        </footer>

        <p v-if="successMessage" class="form-success">{{ successMessage }}</p>
      </form>
    </div>

    <div v-if="mapPickerVisible" class="map-picker">
      <div class="map-picker__backdrop" @click="closeMapPicker" aria-hidden="true"></div>
      <div class="map-picker__panel" role="dialog" aria-modal="true">
        <header class="map-picker__header">
          <h3>
            {{ mapPickerTarget === 'arrival' ? '도착지' : '출발지' }} 위치를 지도에서 선택하세요.
          </h3>
          <p>지도나 핀을 드래그해 위치를 조정하세요.</p>
        </header>
        <div class="map-picker__canvas" ref="mapPickerCanvas" style="touch-action: none; overscroll-behavior: none"></div>
        <footer class="map-picker__actions">
          <button type="button" class="ghost-button" @click="closeMapPicker">취소</button>
          <button type="button" class="primary-button" @click="confirmMapPicker">
            확인
          </button>
        </footer>
      </div>
    </div>

    <TimePicker
      v-if="timePickerVisible"
      :period="timePickerPeriod === '오전' ? 'AM' : 'PM'"
      :hour="timePickerHour"
      :minute="timePickerMinute"
      @cancel="closeTimePicker"
      @confirm="handleEmbeddedTimeConfirm"
    />
  </section>
</template>


<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TimePicker from '@/components/TimePicker.vue'
import FareInfoCard from '@/components/FareInfoCard.vue'
import { loadKakaoMaps, type KakaoNamespace } from '@/services/kakaoMaps'
import { createRoom, type CreateRoomPayload } from '@/api/rooms'
import { useRoomMembership } from '@/composables/useRoomMembership'

type FieldKind = 'departure' | 'arrival'

type SelectedPlace = {
  id: string
  name: string
  address: string
  position: { lat: number; lng: number }
}

function getCurrentSeoulTime() {
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
    const parts = formatter.formatToParts(new Date())
    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
    return `${hour}:${minute}`
  } catch {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const seoul = new Date(utc + 9 * 60 * 60000)
    const hour = seoul.getUTCHours().toString().padStart(2, '0')
    const minute = seoul.getUTCMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  }
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ROOM_CAPACITY = 4
const minuteOptions = ['00', '10', '20', '30', '40', '50'] as const
type MinuteOption = (typeof minuteOptions)[number]
function isMinuteOption(value: string): value is MinuteOption {
  return (minuteOptions as readonly string[]).includes(value)
}
const router = useRouter()
const { joinRoom: rememberRoom } = useRoomMembership()
const STORAGE_KEY = 'create-room-draft-v1'

const form = reactive({
  title: '',
  departure: null as SelectedPlace | null,
  arrival: null as SelectedPlace | null,
  departureTime: getCurrentSeoulTime(),
})

const uberClientId = import.meta.env.VITE_UBER_CLIENT_ID
const uberDeepLink = computed(() => buildUberDeepLinkFromSelection())

const departureQuery = ref('')
const arrivalQuery = ref('')
const departureSuggestions = ref<SelectedPlace[]>([])
const arrivalSuggestions = ref<SelectedPlace[]>([])
const activeField = ref<FieldKind | null>(null)
const isSearching = reactive<Record<FieldKind, boolean>>({
  departure: false,
  arrival: false,
})
const mapPickerVisible = ref(false)
const mapPickerTarget = ref<FieldKind | null>(null)
const mapPickerCanvas = ref<HTMLDivElement | null>(null)
const mapPickerPosition = reactive({ ...DEFAULT_CENTER })
const timePickerVisible = ref(false)
const timePickerPeriod = ref<'오전' | '오후'>('오전')
const timePickerHour = ref('08')
const timePickerMinute = ref<MinuteOption>('00')
setTimePickerState(form.departureTime)

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const recognizedFare = ref<number | null>(null)
const farePending = ref(true)

const hasRouteAndTime = computed(() => {
  return (
    Boolean(form.departure) &&
    Boolean(form.arrival) &&
    Boolean(form.departureTime) &&
    form.departure?.id !== form.arrival?.id
  )
})

const isFareDetermined = computed(
  () => recognizedFare.value !== null && !farePending.value,
)

const isValid = computed(() => hasRouteAndTime.value && isFareDetermined.value)

type DraftPayload = {
  title: string
  departure: SelectedPlace | null
  arrival: SelectedPlace | null
  departureQuery: string
  arrivalQuery: string
  departureTime: string
  recognizedFare: number | null
  farePending: boolean
}

function serializeDraft(): DraftPayload {
  return {
    title: form.title,
    departure: form.departure,
    arrival: form.arrival,
    departureQuery: departureQuery.value,
    arrivalQuery: arrivalQuery.value,
    departureTime: form.departureTime,
    recognizedFare: recognizedFare.value,
    farePending: farePending.value,
  }
}

function isValidPosition(value: unknown): value is { lat: number; lng: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { lat?: unknown }).lat === 'number' &&
    typeof (value as { lng?: unknown }).lng === 'number'
  )
}

function normalizePlace(value: unknown): SelectedPlace | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<SelectedPlace>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.address !== 'string' ||
    !isValidPosition((candidate as { position?: unknown }).position)
  ) {
    return null
  }
  return {
    id: candidate.id,
    name: candidate.name,
    address: candidate.address,
    position: {
      lat: (candidate.position as { lat: number }).lat,
      lng: (candidate.position as { lng: number }).lng,
    },
  }
}

function saveDraft() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeDraft()))
  } catch (error) {
    console.warn('Failed to persist create-room draft', error)
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear create-room draft', error)
  }
}

function restoreDraft() {
  if (typeof window === 'undefined') return
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<DraftPayload>
    form.title = typeof parsed.title === 'string' ? parsed.title : form.title
    const storedDeparture = normalizePlace(parsed.departure)
    const storedArrival = normalizePlace(parsed.arrival)
    if (storedDeparture) {
      form.departure = storedDeparture
      suppressSearch.departure = true
      departureQuery.value = storedDeparture.name
    }
    if (storedArrival) {
      form.arrival = storedArrival
      suppressSearch.arrival = true
      arrivalQuery.value = storedArrival.name
    }
    if (typeof parsed.departureQuery === 'string') {
      departureQuery.value = parsed.departureQuery
    }
    if (typeof parsed.arrivalQuery === 'string') {
      arrivalQuery.value = parsed.arrivalQuery
    }
    if (typeof parsed.departureTime === 'string' && parsed.departureTime.includes(':')) {
      form.departureTime = parsed.departureTime
      setTimePickerState(parsed.departureTime)
    }
    if (typeof parsed.recognizedFare === 'number' && Number.isFinite(parsed.recognizedFare)) {
      recognizedFare.value = parsed.recognizedFare
    }
    if (typeof parsed.farePending === 'boolean') {
      farePending.value = parsed.farePending
    }
  } catch (error) {
    console.warn('Failed to restore create-room draft', error, raw)
  }
}

watch(
  [
    () => form.title,
    () => form.departure,
    () => form.arrival,
    () => form.departureTime,
    departureQuery,
    arrivalQuery,
    recognizedFare,
    farePending,
  ],
  saveDraft,
  { deep: true },
)

const preview = computed(() => ({
  title: form.title.trim() || '꼬꼬택과 고고 택시~',
  subtitle: `${form.departure?.name ?? '출발지 미정'} → ${form.arrival?.name ?? '도착지 미정'}`,
  departure: form.departure?.address ?? '출발지',
  arrival: form.arrival?.address ?? '도착지',
  time: form.departureTime ? formatDate(form.departureTime) : '출발 시간',
}))

function formatShortTime(value: string) {
  const [hourToken, minuteToken] = value.split(':')
  const hours = Number(hourToken)
  if (Number.isNaN(hours)) return value
  const period = hours >= 12 ? '오후' : '오전'
  let hour12 = hours % 12
  if (hour12 === 0) hour12 = 12
  return `${period} ${hour12.toString().padStart(2, '0')}:${minuteToken ?? '00'}`
}

function setTimePickerState(value: string) {
  const safeValue = value && value.includes(':') ? value : getCurrentSeoulTime()
  const [hourToken, minuteToken] = safeValue.split(':')
  const hours = Number(hourToken)
  if (Number.isNaN(hours)) {
    return setTimePickerState(getCurrentSeoulTime())
  }
  const period = hours >= 12 ? '오후' : '오전'
  let hour12 = hours % 12
  if (hour12 === 0) hour12 = 12
  timePickerPeriod.value = period
  timePickerHour.value = hour12.toString().padStart(2, '0')
  const minuteCandidate = (minuteToken ?? '00').padStart(2, '0')
  timePickerMinute.value = isMinuteOption(minuteCandidate) ? minuteCandidate : '00'
}

const displayDepartureTime = computed(() => {
  if (!form.departureTime) return '출발 시간을 선택해 주세요.'
  return formatShortTime(form.departureTime)
})

let kakaoApi: KakaoNamespace | null = null
let placesService: kakao.maps.services.Places | null = null
let geocoder: kakao.maps.services.Geocoder | null = null
let mapPickerMap: kakao.maps.Map | null = null
let mapPickerMarker: kakao.maps.Marker | null = null

loadKakaoMaps().then((kakao) => {
  if (!kakao) return
  kakaoApi = kakao
  placesService = new kakao.maps.services.Places()
  geocoder = new kakao.maps.services.Geocoder()
})

onMounted(() => {
  restoreDraft()
})

const searchTimers: Record<FieldKind, ReturnType<typeof setTimeout> | null> = {
  departure: null,
  arrival: null,
}
const suppressSearch: Record<FieldKind, boolean> = {
  departure: false,
  arrival: false,
}

function buildUberDeepLinkFromSelection() {
  if (!form.departure?.position || !form.arrival?.position) return ''
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': String(form.departure.position.lat),
    'pickup[longitude]': String(form.departure.position.lng),
    'dropoff[latitude]': String(form.arrival.position.lat),
    'dropoff[longitude]': String(form.arrival.position.lng),
  })
  if (form.departure.name) params.set('pickup[nickname]', form.departure.name)
  if (form.arrival.name) params.set('dropoff[nickname]', form.arrival.name)
  if (uberClientId) params.set('client_id', uberClientId)
  return `https://m.uber.com/ul/?${params.toString()}`
}

function isKakaoStatusOk(status: unknown) {
  const services = kakaoApi?.maps?.services as unknown
  const statusMap =
    services && typeof services === 'object' && 'Status' in services
      ? (services as { Status?: { OK?: string } }).Status
      : undefined
  const ok = typeof statusMap?.OK === 'string' ? statusMap.OK : 'OK'
  return status === ok || status === 'OK'
}

watch(departureQuery, (value) => scheduleSearch('departure', value))
watch(arrivalQuery, (value) => scheduleSearch('arrival', value))

function scheduleSearch(kind: FieldKind, keyword: string) {
  if (suppressSearch[kind]) {
    suppressSearch[kind] = false
    return
  }
  const trimmed = keyword.trim()
  if (trimmed.length < 2 || !placesService) {
    setSuggestions(kind, [])
    return
  }
  if (searchTimers[kind]) {
    clearTimeout(searchTimers[kind]!)
  }
  searchTimers[kind] = setTimeout(() => runSearch(kind, trimmed), 250)
}

function runSearch(kind: FieldKind, keyword: string) {
  const service = placesService
  if (!service || !kakaoApi) return
  isSearching[kind] = true
  service.keywordSearch(
    keyword,
    (data, status) => {
      isSearching[kind] = false
      if (!isKakaoStatusOk(status) || !Array.isArray(data)) {
        setSuggestions(kind, [])
        return
      }
      const mapped: SelectedPlace[] = data.slice(0, 6).map((item) => ({
        id: item.id ?? `${item.x}-${item.y}`,
        name: item.place_name,
        address: item.road_address_name || item.address_name || '자세한 주소 정보를 찾지 못했어요.',
        position: { lat: Number(item.y), lng: Number(item.x) },
      }))
      setSuggestions(kind, mapped)
    },
    { size: 6 },
  )
}

function setSuggestions(kind: FieldKind, items: SelectedPlace[]) {
  if (kind === 'departure') {
    departureSuggestions.value = items
  } else {
    arrivalSuggestions.value = items
  }
}

function selectPlace(kind: FieldKind, place: SelectedPlace) {
  suppressSearch[kind] = true
  if (kind === 'departure') {
    form.departure = place
    departureQuery.value = place.name
    departureSuggestions.value = []
  } else {
    form.arrival = place
    arrivalQuery.value = place.name
    arrivalSuggestions.value = []
  }
  activeField.value = null
}

function setActiveField(kind: FieldKind) {
  activeField.value = kind
}

function handleBlur(kind: FieldKind) {
  setTimeout(() => {
    if (kind === 'departure') {
      departureSuggestions.value = []
    } else {
      arrivalSuggestions.value = []
    }
    if (activeField.value === kind) {
      activeField.value = null
    }
  }, 120)
}

async function ensurePlaceSelected(kind: FieldKind) {
  // If user only typed text, pick the first Kakao search result to fill lat/lng.
  if (form[kind]) return
  const query = (kind === 'departure' ? departureQuery.value : arrivalQuery.value).trim()
  if (!query || query.length < 2 || !placesService || !kakaoApi) return
  const service = placesService
  if (!service) return

  await new Promise<void>((resolve) => {
    service.keywordSearch(
      query,
      (data, status) => {
        if (isKakaoStatusOk(status) && Array.isArray(data) && data[0]) {
          const item = data[0]
          const place: SelectedPlace = {
            id: item.id ?? `${item.x}-${item.y}`,
            name: item.place_name || query,
            address: item.road_address_name || item.address_name || query,
            position: { lat: Number(item.y), lng: Number(item.x) },
          }
          selectPlace(kind, place)
        }
        resolve()
      },
      { size: 1 },
    )
  })
}

function openMapPicker(kind: FieldKind) {
  mapPickerTarget.value = kind
  const base = form[kind]?.position ?? DEFAULT_CENTER
  mapPickerPosition.lat = base.lat
  mapPickerPosition.lng = base.lng
  mapPickerVisible.value = true
  loadKakaoMaps().then(() => {
    nextTick(() => {
      setupMapPicker()
    })
  })
}

function closeMapPicker() {
  mapPickerVisible.value = false
  mapPickerTarget.value = null
  destroyMapPicker()
}

async function setupMapPicker() {
  if (!mapPickerVisible.value || !kakaoApi || !mapPickerCanvas.value) return
  const canvas = mapPickerCanvas.value
  canvas.style.touchAction = 'none'
  canvas.style.overscrollBehavior = 'none'
  canvas.style.setProperty('-ms-touch-action', 'none')
  canvas.style.pointerEvents = 'auto'
  const center = new kakaoApi.maps.LatLng(mapPickerPosition.lat, mapPickerPosition.lng)
  const pickerMap = new kakaoApi.maps.Map(mapPickerCanvas.value, {
    center,
    level: 4,
    draggable: true,
  })
  pickerMap.setDraggable(true)
  pickerMap.setZoomable(true)
  mapPickerMap = pickerMap
  mapPickerMarker = new kakaoApi.maps.Marker({
    position: center,
    map: mapPickerMap,
    draggable: true,
  })

  kakaoApi.maps.event.addListener(mapPickerMarker, 'dragend', () => {
    if (!mapPickerMarker) return
    const position = mapPickerMarker.getPosition()
    mapPickerPosition.lat = position.getLat()
    mapPickerPosition.lng = position.getLng()
    mapPickerMap?.setCenter(position)
  })

  kakaoApi.maps.event.addListener(mapPickerMap, 'dragend', () => {
    if (!mapPickerMap || !mapPickerMarker) return
    const center = mapPickerMap.getCenter()
    mapPickerMarker.setPosition(center)
    mapPickerPosition.lat = center.getLat()
    mapPickerPosition.lng = center.getLng()
  })

  kakaoApi.maps.event.addListener(mapPickerMap, 'click', (event: kakao.maps.event.MouseEvent) => {
    if (!mapPickerMarker) return
    mapPickerMarker.setPosition(event.latLng)
    mapPickerMap?.setCenter(event.latLng)
    mapPickerPosition.lat = event.latLng.getLat()
    mapPickerPosition.lng = event.latLng.getLng()
  })
}

function destroyMapPicker() {
  if (mapPickerMarker) {
    mapPickerMarker.setMap(null)
    mapPickerMarker = null
  }
  mapPickerMap = null
}

async function confirmMapPicker() {
  const target = mapPickerTarget.value
  if (!target) {
    closeMapPicker()
    return
  }
  const info = await reverseGeocode(mapPickerPosition)
  const place: SelectedPlace = {
    id: `custom-${target}-${Date.now()}`,
    name: info.name,
    address: info.address,
    position: { lat: mapPickerPosition.lat, lng: mapPickerPosition.lng },
  }
  selectPlace(target, place)
  closeMapPicker()
}

function handleFareRecognized(amount: number) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return
  recognizedFare.value = Math.max(0, Math.round(amount))
  farePending.value = false
}

function openTimePicker() {
  setTimePickerState(form.departureTime || getCurrentSeoulTime())
  timePickerVisible.value = true
}

function closeTimePicker() {
  timePickerVisible.value = false
}

function confirmTimePicker() {
  let hour = Number(timePickerHour.value)
  if (timePickerPeriod.value === '오후' && hour !== 12) hour += 12
  if (timePickerPeriod.value === '오전' && hour === 12) hour = 0
  const hourString = hour.toString().padStart(2, '0')
  form.departureTime = `${hourString}:${timePickerMinute.value}`
  timePickerVisible.value = false
}

function handleEmbeddedTimeConfirm(payload: { period: 'AM' | 'PM'; hour: string; minute: string }) {
  timePickerPeriod.value = payload.period === 'AM' ? '오전' : '오후'
  timePickerHour.value = payload.hour
  timePickerMinute.value = isMinuteOption(payload.minute) ? payload.minute : '00'
  confirmTimePicker()
}

function reverseGeocode(position: { lat: number; lng: number }) {
  return new Promise<{ name: string; address: string }>((resolve) => {
    if (!geocoder || !kakaoApi) {
      resolve({
        name: '사용자 지정 위치',
        address: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
      })
      return
    }
    geocoder.coord2Address(position.lng, position.lat, (result, status) => {
      if (isKakaoStatusOk(status) && result[0]) {
        const road = result[0].road_address?.address_name
        const lot = result[0].address?.address_name
        resolve({
          name: lot ?? road ?? '사용자 지정 위치',
          address: road ?? lot ?? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
        })
      } else {
        resolve({
          name: '사용자 지정 위치',
          address: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
        })
      }
    })
  })
}

function formatDate(value: string) {
  const [hourToken, minuteToken] = value.split(':')
  const hours = Number(hourToken)
  const minutes = Number(minuteToken)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '유효한 시간을 선택해 주세요.'
  const period = hours >= 12 ? '오후' : '오전'
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12
  const paddedMinutes = minuteToken?.padStart(2, '0') ?? '00'
  return `${period} ${normalizedHour}시 ${paddedMinutes}분`
}

function resetForm() {
  form.title = ''
  form.departure = null
  form.arrival = null
  form.departureTime = getCurrentSeoulTime()
  setTimePickerState(form.departureTime)
  departureQuery.value = ''
  arrivalQuery.value = ''
  recognizedFare.value = null
  farePending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  clearDraft()
}

function toLocationPayload(place: SelectedPlace) {
  return {
    label: place.name,
    name: place.name,
    address: place.address,
    lat: place.position.lat,
    lng: place.position.lng,
    position: { ...place.position },
  }
}

function safeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function buildDepartureTimeIsoString(value: string) {
  if (!value) return undefined
  const [hourToken, minuteToken] = value.split(':')
  const hours = Number(hourToken)
  const minutes = Number(minuteToken)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMilliseconds(0)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function buildCreateRoomPayload(): CreateRoomPayload {
  if (!form.departure || !form.arrival) {
    throw new Error('출발지와 도착지를 모두 선택해 주세요.')
  }
  const departureLocation = toLocationPayload(form.departure)
  const arrivalLocation = toLocationPayload(form.arrival)
  const remainingSeats = 2
  const capacity = DEFAULT_ROOM_CAPACITY
  const filled = Math.max(0, capacity - remainingSeats)

  return {
    title: form.title.trim() || '꼬꼬택과 고고 택시~',
    departure: departureLocation,
    arrival: arrivalLocation,
    departureLabel: departureLocation.label || departureLocation.name,
    departureLat: safeNumber(departureLocation.lat ?? departureLocation.position?.lat),
    departureLng: safeNumber(departureLocation.lng ?? departureLocation.position?.lng),
    arrivalLabel: arrivalLocation.label || arrivalLocation.name,
    arrivalLat: safeNumber(arrivalLocation.lat ?? arrivalLocation.position?.lat),
    arrivalLng: safeNumber(arrivalLocation.lng ?? arrivalLocation.position?.lng),
    departureTime: buildDepartureTimeIsoString(form.departureTime),
    time: preview.value.time,
    seats: remainingSeats,
    capacity,
    filled,
    fare: recognizedFare.value ?? undefined,
  }
}

async function submitForm() {

  errorMessage.value = ''

  successMessage.value = ''

  await Promise.all([ensurePlaceSelected('departure'), ensurePlaceSelected('arrival')])



  if (!hasRouteAndTime.value) {

    errorMessage.value = '필수 정보를 모두 입력해 주세요.'

    return

  }

  if (!isFareDetermined.value) {
    errorMessage.value = '요금 책정까지 완료하면 방을 생성할 수 있어요. 영수증을 업로드해 주세요.'
    return
  }



  if (isSubmitting.value) return



  let payload: CreateRoomPayload

  try {

    payload = buildCreateRoomPayload()

  } catch (buildError) {

    errorMessage.value =

      buildError instanceof Error && buildError.message

        ? buildError.message

        : '방 정보를 처리하는 중 오류가 발생했어요.'

    return

  }



  try {

    isSubmitting.value = true

    const createdRoom = await createRoom(payload)
    if (createdRoom && recognizedFare.value != null) {
      createdRoom.fare = recognizedFare.value
    }
    if (createdRoom) {
      rememberRoom(createdRoom, 'host')
    }

    successMessage.value = '방이 생성되었어요! 곧 이동합니다.'

    setTimeout(() => {

      if (createdRoom?.id) {

        router.push({ name: 'room-detail', params: { id: createdRoom.id } })

      } else {

        router.push({ name: 'find-room' })

      }

      clearDraft()
      resetForm()

    }, 500)

  } catch (error) {

    errorMessage.value =

      error instanceof Error && error.message

        ? error.message

        : '방 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'

  } finally {

    isSubmitting.value = false

  }

}

</script>

<style scoped>
.create-room {
  --color-background: #fff8dc;
  --color-surface: #eeeff2;
  --color-border: #d7d8de;
  --color-accent-border: #f4c145;
  --color-text-strong: #2f1c03;
  --color-text-muted: #6a5f4d;
  --color-button: #fdd651;
  --color-button-text: #3b2600;

  min-height: 100dvh;
  background: var(--color-background);
  color: var(--color-text-strong);
  overflow-x: hidden;
}

.create-room__container {
  width: min(920px, 100%);
  margin: 0 auto;
  padding: clamp(32px, 5vw, 72px) clamp(16px, 4vw, 48px) clamp(48px, 6vw, 80px);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 3vw, 32px);
  overflow-x: hidden;
}

.create-room__hero {
  display: grid;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(228, 180, 97, 0.55);
}

.create-room__hero h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 36px);
  color: #2b1400;
}

.form,
fieldset.field,
.map-picker__panel {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 32px;
}

.form {
  padding: clamp(20px, 3.6vw, 28px);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.92rem;
  color: var(--color-text-strong);
  position: relative;
}

.field > span {
  color: #7c2d12;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  border-radius: 18px;
  border: 1px solid rgba(234, 179, 8, 0.45);
  padding: 0.85rem 1rem;
  background: #ffffff;
  color: #a16207;
  font-size: 0.92rem;
  font-family: inherit;
  transition: border 0.2s ease;
}

.field input.is-empty,
.field select.is-empty,
.field textarea.is-empty {
  color: #c4c4c4;
}

.field input::placeholder,
.field select::placeholder,
.field textarea::placeholder {
  color: rgba(0, 0, 0, 0.28);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-button);
}

.field--autocomplete .suggestion-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  list-style: none;
  margin: 0;
  padding: 0.4rem 0;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 5;
}

.suggestion-list li button {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.65rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  cursor: pointer;
}

.suggestion-list li button:hover {
  background: rgba(253, 214, 81, 0.15);
}

.input-with-action {
  display: flex;
  align-items: center;
  position: relative;
}

.input-with-action input {
  flex: 1;
  padding-right: 2.5rem;
}

.pin-button {
  position: absolute;
  right: 0.5rem;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #a16207;
  font-weight: 600;
  cursor: pointer;
}
.pin-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.pin-button__icon svg {
  width: 20px;
  height: 20px;
  display: block;
}

.time-trigger {
  width: 100%;
  border-radius: 18px;
  border: 1.5px solid rgba(234, 179, 8, 0.45);
  background: #fffdf6;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: #7c2d12;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.time-trigger.is-placeholder {
  color: var(--color-text-muted);
  font-weight: 500;
}

.time-trigger:hover {
  transform: translateY(-1px);
}

.time-trigger__value {
  width: 100%;
  text-align: center;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.primary-button,
.ghost-button {
  border-radius: 999px;
  padding: 0.52rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.primary-button {
  background: rgba(250, 204, 21, 0.18);
  color: #7c2d12;
  border: 1px solid rgba(250, 204, 21, 0.45);
  box-shadow: none;
}

.ghost-button {
  background: #ffffff;
  color: var(--color-text-strong);
  border: 1px solid var(--color-border);
}

.reset-button {
  background: #ff6b6b;
  border-color: #ff6b6b;
  color: #ffffff;
}

.reset-button:not(:disabled):hover {
  transform: none;
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.primary-button:not(:disabled):hover,
.ghost-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.map-picker {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.map-picker__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.map-picker__panel {
  width: min(720px, 94vw);
  padding: 1.6rem;
  border-radius: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  position: relative;
  z-index: 1;
}

.map-picker__header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.map-picker__header p {
  margin: 0.4rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.map-picker__canvas {
  width: 100%;
  height: 360px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.map-picker__canvas:active {
  cursor: grabbing;
}

.map-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.fare-upload {
  margin-top: 1rem;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
