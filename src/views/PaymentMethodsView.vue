<template>
  <div class="payment-wrapper">
    <div class="payment-container">
      <header class="payment-header">
        <button type="button" class="back-button" :aria-label="labels.back" @click="goBack">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1 class="payment-title">{{ labels.title }}</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </header>

      <section class="password-section" aria-live="polite">
        <div class="password-copy">
          <h2>{{ labels.passwordManageTitle }}</h2>
          <p class="password-description">
            {{
              hasPaymentPassword
                ? labels.passwordManageResetDescription
                : labels.passwordManageSetupDescription
            }}
          </p>
        </div>
        <div class="password-actions">
          <p class="password-status">
            {{ hasPaymentPassword ? labels.passwordStatusSet : labels.passwordStatusUnset }}
          </p>
          <button type="button" class="password-manage-button" @click="openPasswordManager">
            {{ hasPaymentPassword ? labels.passwordResetButton : labels.passwordSetupButton }}
          </button>
        </div>
      </section>

      <main class="payment-content">
        <section
          v-for="section in sections"
          :key="section.id"
          class="method-section"
        >
          <header class="section-header">
            <div class="section-heading">
              <h2>{{ section.title }}</h2>
              <p v-if="section.description" class="section-description">{{ section.description }}</p>
            </div>
          </header>

          <ul v-if="section.items.length" class="method-list">
            <li v-for="item in section.items" :key="item.id" class="method-item">
              <div class="method-summary">
                <div class="method-icon" :data-brand="item.brand" aria-hidden="true">
                  <span>{{ item.iconText }}</span>
                </div>
                <div class="method-texts">
                  <p class="method-name">{{ item.label }}</p>
                  <p v-if="item.description" class="method-description">{{ item.description }}</p>
                </div>
              </div>
              <button
                v-if="item.removable"
                type="button"
                class="remove-button"
                :aria-label="`${item.label} ${labels.remove}`"
                @click="requestRemoval(section.id, item.id)"
              >
                &times;
              </button>
            </li>
          </ul>
          <p v-else class="empty-state">{{ section.emptyLabel ?? labels.empty }}</p>

          <div class="section-footer">
            <div class="add-wrapper">
              <button
                type="button"
                class="add-button"
                :disabled="section.id === 'kakao-pay' && kakaoAddLoading"
                @click="handleAdd(section.id)"
              >
                <span class="add-icon" aria-hidden="true">+</span>
                <span v-if="section.id === 'kakao-pay' && kakaoAddLoading">
                  카카오페이 연결 중...
                </span>
                <span v-else>{{ section.addLabel }}</span>
              </button>
              <span v-if="section.addHint" class="add-hint">{{ section.addHint }}</span>
            </div>
            <button
              v-if="section.manageLabel"
              type="button"
              class="manage-button"
              :disabled="section.id === 'kakao-pay' && kakaoManageLoading"
              @click="handleManage(section.id)"
            >
              <span v-if="section.id === 'kakao-pay' && kakaoManageLoading">
                카카오페이 페이지 여는 중...
              </span>
              <span v-else>{{ section.manageLabel }}</span>
            </button>
          </div>
          <p
            v-if="section.id === 'kakao-pay' && kakaoPayError"
            class="kakaopay-error"
            role="alert"
          >
            {{ kakaoPayError }}
          </p>
        </section>
      </main>
    </div>

    <div v-if="showConfirmModal" class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">{{ labels.confirmTitle }}</h2>
        <p class="modal-message">
          <span class="modal-highlight">{{ pendingRemoval?.label }}</span>
          {{ labels.confirmMessage }}
        </p>
        <div class="modal-actions">
          <button type="button" class="modal-button is-secondary" @click="cancelRemovalFlow">
            {{ labels.cancel }}
          </button>
          <button type="button" class="modal-button is-primary" @click="proceedToPassword">
            {{ labels.confirm }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">{{ labels.passwordTitle }}</h2>
        <p class="modal-message">{{ labels.passwordGuide }}</p>
        <form class="password-form" @submit.prevent="submitPassword">
          <input
            v-model="passwordInput"
            type="password"
            maxlength="6"
            inputmode="numeric"
            :placeholder="labels.passwordPlaceholder"
            class="password-input"
          />
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-button is-secondary" @click="cancelRemovalFlow">
              {{ labels.cancel }}
            </button>
            <button type="submit" class="modal-button is-primary">
              {{ labels.passwordSubmit }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPasswordManagerModal" class="modal-backdrop">
      <div class="modal-card password-manage-card">
        <h2 class="modal-title">
          {{
            hasPaymentPassword ? labels.passwordResetModalTitle : labels.passwordSetupModalTitle
          }}
        </h2>
        <p class="modal-message">
          {{
            hasPaymentPassword
              ? labels.passwordResetModalDescription
              : labels.passwordSetupModalDescription
          }}
        </p>
        <form class="password-manage-form" @submit.prevent="submitPasswordManager">
          <label v-if="hasPaymentPassword" class="password-field">
            <span>{{ labels.currentPasswordLabel }}</span>
            <input
              v-model="passwordForm.current"
              type="password"
              maxlength="6"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="labels.passwordPlaceholder"
            />
          </label>
          <label class="password-field">
            <span>{{ labels.newPasswordLabel }}</span>
            <input
              v-model="passwordForm.next"
              type="password"
              maxlength="6"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="labels.passwordPlaceholder"
            />
          </label>
          <label class="password-field">
            <span>{{ labels.confirmPasswordLabel }}</span>
            <input
              v-model="passwordForm.confirm"
              type="password"
              maxlength="6"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="labels.passwordPlaceholder"
            />
          </label>
          <p v-if="passwordFormError" class="form-error">{{ passwordFormError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-button is-secondary" @click="closePasswordManager">
              {{ labels.cancel }}
            </button>
            <button type="submit" class="modal-button is-primary">
              {{ hasPaymentPassword ? labels.passwordResetSubmit : labels.passwordSetupSubmit }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showAddCardModal" class="modal-backdrop">
      <div class="modal-card add-card-card">
        <h2 class="modal-title">{{ labels.addCardTitle }}</h2>
        <p class="modal-message info-banner">
          <span aria-hidden="true">!</span>
          {{ labels.cardNotice }}
        </p>
        <form class="add-card-form" @submit.prevent="submitNewCard">
          <label class="form-field">
            <span>{{ labels.cardNumber }}</span>
            <input
              v-model="newCard.number"
              type="text"
              maxlength="19"
              inputmode="numeric"
              placeholder="0000 0000 0000 0000"
            />
          </label>
          <div class="form-row">
            <label class="form-field">
              <span>{{ labels.expiry }}</span>
              <input
                v-model="newCard.expiry"
                type="text"
                maxlength="5"
                placeholder="MM/YY"
              />
            </label>
            <label class="form-field">
              <span>{{ labels.cvc }}</span>
              <input
                v-model="newCard.cvc"
                type="text"
                maxlength="3"
                inputmode="numeric"
                placeholder="123"
              />
            </label>
          </div>
          <label class="form-field">
            <span>{{ labels.cardPassword }}</span>
            <input
              v-model="newCard.password"
              type="text"
              maxlength="2"
              inputmode="numeric"
              placeholder="앞 2자리"
            />
          </label>
          <label class="form-field">
            <span>{{ labels.cardAlias }} {{ labels.optional }}</span>
            <input
              v-model="newCard.alias"
              type="text"
              maxlength="10"
              :placeholder="labels.aliasPlaceholder"
            />
          </label>
          <label class="checkbox-field">
            <input type="checkbox" v-model="newCard.isCorporate" />
            <span>{{ labels.corporate }}</span>
          </label>
          <p v-if="cardFormError" class="form-error">{{ cardFormError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-button is-secondary" @click="closeAddCardModal">
              {{ labels.cancel }}
            </button>
            <button type="submit" class="modal-button is-primary" :disabled="addDisabled">
              {{ labels.addCardSubmit }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import arrowBackIcon from '@/assets/arrowback.svg'
import { requestKakaoPayRedirect, type KakaoPayAction } from '@/services/kakaopay'
import { createPaymentSections, type PaymentSection, type SectionId } from '@/data/paymentMethods'

interface RemovalState {
  sectionId: SectionId
  methodId: string
  label: string
}

type PasswordMode = 'setup' | 'reset'

const router = useRouter()

const labels = {
  back: '마이페이지로 돌아가기',
  title: '결제 수단 관리',
  remove: '삭제',
  empty: '등록된 결제 수단이 없습니다.',
  confirmTitle: '카드 삭제',
  confirmMessage: '결제 수단에서 이 카드를 삭제하시겠습니까?',
  cancel: '취소',
  confirm: '확인',
  passwordTitle: '결제 비밀번호 확인',
  passwordGuide: '결제 비밀번호 6자리를 입력하면 삭제가 완료돼요.',
  passwordPlaceholder: '6자리 비밀번호',
  passwordSubmit: '삭제하기',
  passwordError: '비밀번호는 6자리 숫자여야 합니다.',
  passwordManageTitle: '\uacb0\uc81c \ube44\ubc00\ubc88\ud638',
  passwordManageSetupDescription: '\uacb0\uc81c \ubcf4\uc548\uc744 \uc704\ud574 6\uc790\ub9ac \ube44\ubc00\ubc88\ud638\ub97c \uc124\uc815\ud574 \uc8fc\uc138\uc694.',
  passwordManageResetDescription: '\ube44\ubc00\ubc88\ud638\ub97c \ubc14\uafb8\uace0 \uc2f6\uc73c\uc2dc\uba74 \ud604\uc7ac \ube44\ubc00\ubc88\ud638\ub97c \ud655\uc778\ud55c \ud6c4 \uc7ac\uc124\uc815\ud574 \uc8fc\uc138\uc694.',
  passwordStatusSet: '\ube44\ubc00\ubc88\ud638\uac00 \uc124\uc815\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.',
  passwordStatusUnset: '\ube44\ubc00\ubc88\ud638\uac00 \uc544\uc9c1 \uc124\uc815\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',
  passwordSetupButton: '\uc124\uc815',
  passwordResetButton: '\uc7ac\uc124\uc815',
  passwordSetupModalTitle: '\uacb0\uc81c \ube44\ubc00\ubc88\ud638 \uc124\uc815',
  passwordSetupModalDescription: '6\uc790\ub9ac \ube44\ubc00\ubc88\ud638\ub97c \ub450 \ubc88 \uc785\ub825\ud558\uba74 \uc124\uc815\uc774 \uc644\ub8cc\ub429\ub2c8\ub2e4.',
  passwordResetModalTitle: '\uacb0\uc81c \ube44\ubc00\ubc88\ud638 \uc7ac\uc124\uc815',
  passwordResetModalDescription: '\ud604\uc7ac \ube44\ubc00\ubc88\ud638\ub97c \ud655\uc778\ud55c \ud6c4 \uc0c8 \ube44\ubc00\ubc88\ud638\ub97c \uc785\ub825\ud558\uc138\uc694.',
  currentPasswordLabel: '\ud604\uc7ac \ube44\ubc00\ubc88\ud638',
  newPasswordLabel: '\uc0c8 \ube44\ubc00\ubc88\ud638',
  confirmPasswordLabel: '\uc0c8 \ube44\ubc00\ubc88\ud638 \ud655\uc778',
  passwordConfirmMismatch: '\uc0c8 \ube44\ubc00\ubc88\ud638\uac00 \ud655\uc778 \uc785\ub825\uacfc \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',
  passwordCurrentMismatch: '\ud604\uc7ac \ube44\ubc00\ubc88\ud638\uac00 \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',
  passwordCurrentRequired: '\ud604\uc7ac \ube44\ubc00\ubc88\ud638\ub294 6\uc790\ub9ac\ub85c \uc785\ub825\ud574 \uc8fc\uc138\uc694.',
  passwordSetupSubmit: '\uc124\uc815\ud558\uae30',
  passwordResetSubmit: '\ubc14\ubb34\uae30',
  passwordUnsetError: '\uacb0\uc81c \ube44\ubc00\ubc88\ud638\ub97c \uba3c\uc800 \uc124\uc815\ud574 \uc8fc\uc138\uc694.',
  passwordIncorrect: '\ube44\ubc00\ubc88\ud638\uac00 \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',
  addCardTitle: '신용/체크카드 등록',
  cardNotice: '본인 명의의 카드만 등록할 수 있습니다.',
  cardNumber: '카드번호',
  expiry: '유효기간',
  cvc: 'CVC',
  cardPassword: '카드 비밀번호',
  cardAlias: '별명',
  optional: '(선택)',
  aliasPlaceholder: '최대 10자리',
  corporate: '법인카드',
  addCardSubmit: '등록',
}

const sections = ref<PaymentSection[]>(createPaymentSections())

const paymentPassword = ref<string | null>(null)
const hasPaymentPassword = computed(() => Boolean(paymentPassword.value))
const showPasswordManagerModal = ref(false)
const passwordFormMode = ref<PasswordMode>('setup')
const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})
const passwordFormError = ref('')

const showConfirmModal = ref(false)
const showPasswordModal = ref(false)
const pendingRemoval = ref<RemovalState | null>(null)
const passwordInput = ref('')
const passwordError = ref('')

const showAddCardModal = ref(false)
const newCard = reactive({
  number: '',
  expiry: '',
  cvc: '',
  password: '',
  alias: '',
  isCorporate: false,
})
const cardFormError = ref('')
const kakaoPayError = ref('')
const kakaoPayLoading = reactive<Record<KakaoPayAction, boolean>>({
  register: false,
  manage: false,
})

const kakaoAddLoading = computed(() => kakaoPayLoading.register)
const kakaoManageLoading = computed(() => kakaoPayLoading.manage)

watch(
  () => newCard.number,
  (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    if (formatted !== value.trim()) {
      newCard.number = formatted
    }
  },
)

watch(
  () => newCard.expiry,
  (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    let formatted = digits
    if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    } else if (digits.length >= 1 && digits.length <= 2) {
      formatted = digits
    }
    if (formatted !== value) {
      newCard.expiry = formatted
    }
  },
)

const goBack = () => router.back()

const handleManage = async (sectionId: string) => {
  if (sectionId === 'kakao-pay') {
    await startKakaoPayFlow('manage')
    return
  }
  console.info(`[payment] manage clicked: ${sectionId}`)
}

const handleAdd = async (sectionId: SectionId) => {
  if (sectionId === 'credit-card') {
    openAddCardModal()
    return
  }
  if (sectionId === 'kakao-pay') {
    await startKakaoPayFlow('register')
    return
  }
  console.info(`[payment] add clicked: ${sectionId}`)
}

const startKakaoPayFlow = async (action: KakaoPayAction) => {
  kakaoPayError.value = ''
  kakaoPayLoading[action] = true

  try {
    const { redirectUrl, tid } = await requestKakaoPayRedirect(action)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`kakaopay_tid_${action}`, tid)
    }
    window.location.href = redirectUrl
  } catch (error) {
    console.error(`[payment] KakaoPay ${action} error`, error)
    kakaoPayError.value =
      error instanceof Error
        ? error.message
        : '카카오페이 연동에 실패했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    kakaoPayLoading[action] = false
  }
}

const openAddCardModal = () => {
  resetNewCard()
  showAddCardModal.value = true
  cardFormError.value = ''
}

const closeAddCardModal = () => {
  showAddCardModal.value = false
}

const resetNewCard = () => {
  newCard.number = ''
  newCard.expiry = ''
  newCard.cvc = ''
  newCard.password = ''
  newCard.alias = ''
  newCard.isCorporate = false
}

const addDisabled = computed(() =>
  !(
    /^\d{16}$/.test(stripSpaces(newCard.number)) &&
    /^\d{2}\/\d{2}$/.test(newCard.expiry) &&
    /^\d{3}$/.test(newCard.cvc) &&
    /^\d{2}$/.test(newCard.password)
  ),
)

const submitNewCard = () => {
  cardFormError.value = ''

  if (addDisabled.value) {
    cardFormError.value = '모든 필드를 올바르게 입력해 주세요.'
    return
  }

  const creditSection = sections.value.find((section) => section.id === 'credit-card')
  if (!creditSection) return

  const digits = stripSpaces(newCard.number)
  const lastFour = digits.slice(-4)
  const alias = newCard.alias.trim()

  creditSection.items.push({
    id: `card-${Date.now()}`,
    label: alias ? `${alias} (${lastFour})` : `새 카드 (${lastFour})`,
    description: `유효기간 ${newCard.expiry}`,
    brand: 'card',
    iconText: alias ? alias.slice(0, 2).toUpperCase() : lastFour,
    removable: true,
  })

  closeAddCardModal()
}

const stripSpaces = (value: string) => value.replace(/\s+/g, '')
const isSixDigits = (value: string) => /^\d{6}$/.test(value)

const requestRemoval = (sectionId: SectionId, methodId: string) => {
  const section = sections.value.find((section) => section.id === sectionId)
  const method = section?.items.find((item) => item.id === methodId)
  if (!section || !method) return
  if (!method.removable) return

  pendingRemoval.value = { sectionId, methodId, label: method.label }
  showConfirmModal.value = true
}

const cancelRemovalFlow = () => {
  showConfirmModal.value = false
  showPasswordModal.value = false
  pendingRemoval.value = null
  passwordInput.value = ''
  passwordError.value = ''
}

const proceedToPassword = () => {
  showConfirmModal.value = false
  showPasswordModal.value = true
  passwordInput.value = ''
  passwordError.value = ''
}

const resetPasswordForm = () => {
  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
  passwordFormError.value = ''
}

const openPasswordManager = () => {
  passwordFormMode.value = hasPaymentPassword.value ? 'reset' : 'setup'
  resetPasswordForm()
  showPasswordManagerModal.value = true
}

const closePasswordManager = () => {
  showPasswordManagerModal.value = false
  resetPasswordForm()
}

const submitPasswordManager = () => {
  passwordFormError.value = ''

  const nextValue = passwordForm.next.trim()
  const confirmValue = passwordForm.confirm.trim()

  if (!isSixDigits(nextValue)) {
    passwordFormError.value = labels.passwordError
    return
  }

  if (nextValue !== confirmValue) {
    passwordFormError.value = labels.passwordConfirmMismatch
    return
  }

  if (passwordFormMode.value === 'reset') {
    const currentValue = passwordForm.current.trim()

    if (!isSixDigits(currentValue)) {
      passwordFormError.value = labels.passwordCurrentRequired
      return
    }

    if (paymentPassword.value !== currentValue) {
      passwordFormError.value = labels.passwordCurrentMismatch
      return
    }
  }

  paymentPassword.value = nextValue
  closePasswordManager()
}

const submitPassword = () => {
  const enteredValue = passwordInput.value.trim()

  if (!isSixDigits(enteredValue)) {
    passwordError.value = labels.passwordError
    return
  }

  if (!paymentPassword.value) {
    passwordError.value = labels.passwordUnsetError
    return
  }

  if (paymentPassword.value !== enteredValue) {
    passwordError.value = labels.passwordIncorrect
    return
  }

  const state = pendingRemoval.value
  if (!state) {
    cancelRemovalFlow()
    return
  }

  const section = sections.value.find((section) => section.id === state.sectionId)
  if (!section) {
    cancelRemovalFlow()
    return
  }

  section.items = section.items.filter((item) => item.id !== state.methodId)
  cancelRemovalFlow()
}
</script>

<style scoped>
:host {
  display: block;
}

.payment-wrapper {
  min-height: 100vh;
  background: #3a2e20;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  justify-content: center;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

.payment-container {
  width: min(640px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.password-section {
  background: #ffffff;
  border-radius: 24px;
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.password-copy h2 {
  margin: 0;
  font-size: 1.05rem;
}

.password-description {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: #6a6a70;
}

.password-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.password-status {
  margin: 0;
  font-size: 0.9rem;
  color: #3c3c42;
}

.password-manage-button {
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff9c8b 0%, #ff775f 100%);
  color: #ffffff;
  padding: 0.55rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.password-manage-button:hover {
  transform: translateY(-1px);
}

.password-manage-button:focus-visible {
  outline: 2px solid rgba(255, 119, 95, 0.4);
  outline-offset: 2px;
}

.password-manage-card {
  width: min(420px, 100%);
}

.password-manage-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.password-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #4a4a50;
}

.password-field input {
  border-radius: 12px;
  border: 1px solid #d7d7dd;
  padding: 0.75rem;
  font-size: 1.05rem;
  text-align: center;
  letter-spacing: 0.35em;
}

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
}

.back-button {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-button:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  border-radius: 8px;
  outline-offset: 2px;
}

.back-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.payment-title {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 1.2rem;
}

.header-spacer {
  width: 40px;
  height: 40px;
}

.method-section {
  background: #eeeff2;
  border-radius: 24px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.05rem;
}

.section-description {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: #6a6a70;
}

.method-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.method-item {
  background: #ffffff;
  border-radius: 18px;
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.method-summary {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.method-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f5661, #30353d);
  color: #ffffff;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.method-icon[data-brand='kb'] {
  background: linear-gradient(135deg, #b58d4d, #896531);
}

.method-icon[data-brand='kakao'] {
  background: linear-gradient(135deg, #ffc545, #fba600);
  color: #222;
}

.method-texts {
  display: flex;
  flex-direction: column;
}

.method-name {
  margin: 0;
  font-weight: 600;
  color: #2b2b30;
}

.method-description {
  margin: 0;
  font-size: 0.85rem;
  color: #6a6a70;
}

.remove-button {
  border: none;
  background: none;
  font-size: 1.4rem;
  color: #b4b4bc;
  cursor: pointer;
}

.empty-state {
  margin: 0;
  padding: 0.8rem;
  background: #ffffff;
  border-radius: 16px;
  border: 1px dashed #bebfcc;
  text-align: center;
  color: #666672;
}

.section-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.add-wrapper {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
}

.add-button {
  border: none;
  border-radius: 16px;
  background: #fdd651;
  padding: 0.75rem 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.add-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  display: grid;
  place-items: center;
}

.add-hint {
  background: #2b2b30;
  color: #ffffff;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
}

.manage-button {
  border: none;
  background: none;
  color: #6a6a70;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20;
}

.modal-card {
  width: min(420px, 100%);
  background: #ffffff;
  border-radius: 22px;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #262628;
}

.modal-message {
  margin: 0;
  color: #4a4a4f;
}

.modal-highlight {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2b2b30;
}

.modal-actions {
  display: flex;
  gap: 0.7rem;
}

.modal-button {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-button.is-secondary {
  background: #f1f1f4;
  color: #2b2b30;
}

.modal-button.is-primary {
  background: #f26840;
  color: #ffffff;
}

.password-input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #d7d7dd;
  padding: 0.8rem;
  font-size: 1.1rem;
  text-align: center;
  letter-spacing: 0.4em;
}

.form-error {
  margin: 0;
  font-size: 0.85rem;
  color: #d64545;
}

.kakaopay-error {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #d64545;
}

.add-card-card {
  width: min(460px, 100%);
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f6ff;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  color: #27408f;
}

.info-banner span {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #27408f;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.add-card-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #3c3c42;
}

.form-field input {
  border-radius: 12px;
  border: 1px solid #d7d7dd;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-row {
  display: flex;
  gap: 0.8rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #4a4a4f;
}

.card-form-footer {
  display: flex;
  gap: 0.7rem;
}

.card-submit-button {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.card-submit-button.is-secondary {
  background: #f1f1f4;
  color: #2b2b30;
}

.card-submit-button:is(:not(.is-secondary)) {
  background: #2f63ff;
  color: #ffffff;
}

.card-submit-button:disabled {
  background: #d7d7dd;
  color: #9d9daa;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .payment-wrapper {
    padding: 2rem 0.8rem 3.5rem;
  }

  .password-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .password-actions {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .password-manage-button {
    width: 100%;
    text-align: center;
  }

  .method-section {
    padding: 1.1rem;
  }

  .form-row {
    flex-direction: column;
  }

  .modal-card {
    padding: 1.2rem;
  }
}
</style>
