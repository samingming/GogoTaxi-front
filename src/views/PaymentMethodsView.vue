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
  passwordManageTitle: '결제 비밀번호',
  passwordManageSetupDescription: '결제 보안을 위해 6자리 비밀번호를 설정해 주세요.',
  passwordManageResetDescription: '비밀번호를 바꾸고 싶으시면 현재 비밀번호를 확인한 후 재설정해 주세요.',
  passwordStatusSet: '비밀번호가 설정되어 있습니다.',
  passwordStatusUnset: '비밀번호가 아직 설정되지 않았습니다.',
  passwordSetupButton: '설정',
  passwordResetButton: '재설정',
  passwordSetupModalTitle: '결제 비밀번호 설정',
  passwordSetupModalDescription: '6자리 비밀번호를 두 번 입력하면 설정이 완료됩니다.',
  passwordResetModalTitle: '결제 비밀번호 재설정',
  passwordResetModalDescription: '현재 비밀번호를 확인한 후 새 비밀번호를 입력하세요.',
  currentPasswordLabel: '현재 비밀번호',
  newPasswordLabel: '새 비밀번호',
  confirmPasswordLabel: '새 비밀번호 확인',
  passwordConfirmMismatch: '새 비밀번호가 확인 입력과 일치하지 않습니다.',
  passwordCurrentMismatch: '현재 비밀번호가 일치하지 않습니다.',
  passwordCurrentRequired: '현재 비밀번호는 6자리로 입력해 주세요.',
  passwordSetupSubmit: '설정하기',
  passwordResetSubmit: '바꾸기',
  passwordUnsetError: '결제 비밀번호를 먼저 설정해 주세요.',
  passwordIncorrect: '비밀번호가 일치하지 않습니다.',
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
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  background: #fff7e1;
  padding: clamp(28px, 6vw, 60px) clamp(18px, 5vw, 54px) clamp(28px, 5vh, 48px);
  display: flex;
  justify-content: center;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
  color: #3b2600;
}

.payment-container {
  width: min(720px, 100%);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.payment-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  justify-items: center;
}

.payment-title {
  margin: 0;
  font-size: clamp(24px, 5vw, 28px);
  font-weight: 800;
  color: #2b1400;
}

.header-spacer {
  width: 24px;
  height: 24px;
  display: block;
  justify-self: end;
}

.back-button {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  justify-self: start;
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

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-section {
  background: #ffffff;
  border: 1px solid #f3d193;
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
  color: #2b1400;
}

.password-description {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: #a16207;
}

.password-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.password-status {
  margin: 0;
  font-size: 0.9rem;
  color: #a16207;
  font-weight: 600;
}

.password-manage-button {
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.password-manage-button:hover {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.password-manage-button:focus-visible {
  outline: 2px solid rgba(250, 204, 21, 0.5);
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
  color: #4a2c08;
}

.password-field input {
  border-radius: 12px;
  border: 1px solid #f3d193;
  padding: 0.75rem;
  font-size: 1.05rem;
  text-align: center;
  letter-spacing: 0.35em;
  background: #fffdf6;
  color: #3b2600;
}

.method-section {
  background: #ffffff;
  border: 1px solid #f3d193;
  border-radius: 24px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.05rem;
  color: #2b1400;
}

.section-description {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: #a16207;
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
  border: 1px solid #f3d193;
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
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.method-icon[data-brand='kb'] {
  background: rgba(250, 204, 21, 0.28);
}

.method-icon[data-brand='kakao'] {
  background: rgba(250, 204, 21, 0.4);
  color: #2b1400;
}

.method-texts {
  display: flex;
  flex-direction: column;
}

.method-name {
  margin: 0;
  font-weight: 600;
  color: #3b2600;
}

.method-description {
  margin: 0;
  font-size: 0.85rem;
  color: #a16207;
}

.remove-button {
  border: none;
  background: none;
  font-size: 1.4rem;
  color: #a16207;
  cursor: pointer;
}

.empty-state {
  margin: 0;
  padding: 0.8rem;
  background: #ffffff;
  border-radius: 16px;
  border: 1px dashed #f3d193;
  text-align: center;
  color: #a16207;
  font-weight: 600;
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
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 16px;
  background: rgba(250, 204, 21, 0.18);
  padding: 0.75rem 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 700;
  color: #a16207;
  transition: background 0.2s ease, color 0.2s ease;
}

.add-button:hover {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.add-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(250, 204, 21, 0.25);
  display: grid;
  place-items: center;
}

.add-hint {
  background: #fef3c7;
  color: #92400e;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  border: 1px solid #f3d193;
}

.manage-button {
  border: 1px solid rgba(250, 204, 21, 0.45);
  background: transparent;
  color: #a16207;
  font-weight: 700;
  cursor: pointer;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
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
  border: 1px solid #f3d193;
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
  color: #2b1400;
}

.modal-message {
  margin: 0;
  color: #3b2600;
}

.modal-highlight {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #a16207;
}

.modal-actions {
  display: flex;
  gap: 0.7rem;
}

.modal-button {
  flex: 1;
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 14px;
  padding: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  transition: background 0.2s ease, color 0.2s ease;
}

.modal-button.is-secondary {
  background: #fffdf6;
  color: #7c2d12;
}

.modal-button.is-primary {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.password-input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #f3d193;
  padding: 0.8rem;
  font-size: 1.1rem;
  text-align: center;
  letter-spacing: 0.4em;
  background: #fffdf6;
  color: #3b2600;
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
  background: #fff7e1;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  color: #a16207;
  border: 1px solid #f3d193;
}

.info-banner span {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(250, 204, 21, 0.3);
  color: #92400e;
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
  color: #3b2600;
}

.form-field input {
  border-radius: 12px;
  border: 1px solid #f3d193;
  padding: 0.75rem;
  font-size: 0.95rem;
  background: #fffdf6;
  color: #3b2600;
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
  color: #3b2600;
}

.card-form-footer {
  display: flex;
  gap: 0.7rem;
}

.card-submit-button {
  flex: 1;
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 14px;
  padding: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  transition: background 0.2s ease, color 0.2s ease;
}

.card-submit-button.is-secondary {
  background: #fffdf6;
  color: #7c2d12;
}

.card-submit-button:is(:not(.is-secondary)) {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.card-submit-button:disabled {
  background: #f3d193;
  color: #a16207;
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
