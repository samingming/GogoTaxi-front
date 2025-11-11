// src/services/kakaopay.ts
// Helper for initiating KakaoPay flows (payment method registration / management).

const READY_ENDPOINT = 'https://kapi.kakao.com/v1/payment/ready'

export type KakaoPayAction = 'register' | 'manage'

type KakaoPayReadyResponse = {
  tid: string
  next_redirect_app_url?: string
  next_redirect_mobile_url?: string
  next_redirect_pc_url?: string
  msg?: string
}

type ReadyPayload = {
  cid: string
  partner_order_id: string
  partner_user_id: string
  item_name: string
  quantity: number
  total_amount: number
  vat_amount: number
  tax_free_amount: number
  approval_url: string
  cancel_url: string
  fail_url: string
}

export type KakaoPayReadyResult = { redirectUrl: string; tid: string }

const DEFAULT_TOTAL_AMOUNT = 100

export async function requestKakaoPayRedirect(
  action: KakaoPayAction,
  overrides?: Partial<ReadyPayload>,
): Promise<KakaoPayReadyResult> {
  if (typeof window === 'undefined') {
    throw new Error('카카오페이 연동은 브라우저 환경에서만 동작합니다.')
  }

  const adminKey = import.meta.env.VITE_KAKAOPAY_ADMIN_KEY
  if (!adminKey) {
    throw new Error('VITE_KAKAOPAY_ADMIN_KEY 환경 변수가 설정되지 않았습니다.')
  }

  const cid = overrides?.cid ?? import.meta.env.VITE_KAKAOPAY_CID ?? 'TC0ONETIME'
  const redirectBase =
    import.meta.env.VITE_KAKAOPAY_REDIRECT_BASE ?? window.location.origin

  const payload: ReadyPayload = {
    cid,
    partner_order_id:
      overrides?.partner_order_id ?? `gogotaxi-${action}-${Date.now().toString(36)}`,
    partner_user_id: overrides?.partner_user_id ?? getCurrentUserId(),
    item_name:
      overrides?.item_name ??
      (action === 'register' ? '카카오페이 결제수단 등록' : '카카오페이 결제수단 관리'),
    quantity: overrides?.quantity ?? 1,
    total_amount: overrides?.total_amount ?? DEFAULT_TOTAL_AMOUNT,
    vat_amount: overrides?.vat_amount ?? 0,
    tax_free_amount: overrides?.tax_free_amount ?? 0,
    approval_url:
      overrides?.approval_url ?? `${redirectBase}/kakaopay/${action}/success`,
    cancel_url: overrides?.cancel_url ?? `${redirectBase}/kakaopay/${action}/cancel`,
    fail_url: overrides?.fail_url ?? `${redirectBase}/kakaopay/${action}/fail`,
  }

  const response = await fetch(READY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `KakaoAK ${adminKey}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: toFormBody(payload),
  })

  const data = (await response.json()) as KakaoPayReadyResponse
  if (!response.ok) {
    throw new Error(data?.msg ?? '카카오페이 연동을 준비하지 못했습니다.')
  }

  const redirectUrl = pickRedirectUrl(data)
  if (!redirectUrl) {
    throw new Error('카카오페이 이동 URL을 받지 못했습니다.')
  }

  return { redirectUrl, tid: data.tid }
}

function pickRedirectUrl(result: KakaoPayReadyResponse) {
  if (isMobile()) {
    return (
      result.next_redirect_mobile_url ??
      result.next_redirect_app_url ??
      result.next_redirect_pc_url
    )
  }
  return (
    result.next_redirect_pc_url ??
    result.next_redirect_app_url ??
    result.next_redirect_mobile_url
  )
}

function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function toFormBody(payload: ReadyPayload) {
  const params = new URLSearchParams()
  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, String(value))
  })
  return params.toString()
}

function getCurrentUserId() {
  try {
    const raw = window.localStorage.getItem('auth_user')
    if (!raw) return 'guest'
    const parsed = JSON.parse(raw) as { id?: string }
    return parsed?.id ?? 'guest'
  } catch {
    return 'guest'
  }
}

export function assertKakaoPayEnv() {
  const adminKey = import.meta.env.VITE_KAKAOPAY_ADMIN_KEY
  const cid = import.meta.env.VITE_KAKAOPAY_CID
  if (!adminKey || !cid) {
    throw new Error('카카오페이 연동 환경 변수가 누락되었습니다.')
  }
}

