<template>
  <section class="find-wrap">
    <div class="card">
      <h1 class="title">아이디 / 비밀번호 찾기</h1>

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'id' }"
          @click="switchMode('id')"
        >
          아이디 찾기
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'pw' }"
          @click="switchMode('pw')"
        >
          비밀번호 재설정
        </button>
      </div>

      <form class="form" @submit.prevent="onSubmit">
        <template v-if="mode === 'id'">
          <label class="field">
            <span>가입자 이름</span>
            <input
              v-model="name"
              type="text"
              placeholder="예: 김고고"
              autocomplete="name"
            />
          </label>
          <p class="guide">회원가입 시 입력했던 이름으로 아이디를 찾아드립니다.</p>
        </template>

        <template v-else>
          <label class="field">
            <span>아이디</span>
            <input
              v-model="id"
              type="text"
              placeholder="예: gogo123"
              autocomplete="username"
            />
          </label>
          <label class="field">
            <span>새 비밀번호</span>
            <input
              v-model="newPassword"
              type="password"
              placeholder="8자 이상 입력"
              autocomplete="new-password"
            />
          </label>
          <label class="field">
            <span>새 비밀번호 확인</span>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="다시 한번 입력"
              autocomplete="new-password"
            />
          </label>
          <p class="guide">임시 비밀번호 대신 직접 새 비밀번호를 설정합니다.</p>
        </template>

        <button class="primary primary-kakao" type="submit">
          {{ mode === 'id' ? '아이디 찾기' : '비밀번호 재설정' }}
        </button>
      </form>

      <transition name="fade">
        <div v-if="resultMessage" class="result-message">
          {{ resultMessage }}
        </div>
      </transition>

      <div class="links">
        <router-link to="/login">로그인으로 돌아가기</router-link>
        <router-link to="/register">신규 회원가입</router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  findUserByName,
  findUserById,
  updateUserPassword,
} from '@/services/auth'

type Mode = 'id' | 'pw'

const mode = ref<Mode>('id')
const name = ref('')
const id = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const resultMessage = ref('')

watch(mode, () => {
  name.value = ''
  id.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  resultMessage.value = ''
})

function switchMode(next: Mode) {
  if (mode.value === next) return
  mode.value = next
}

function ensurePasswordRules(password: string) {
  if (password.length < 4) {
    throw new Error('비밀번호는 4자 이상 입력해 주세요.')
  }
}

function handleFindId() {
  if (!name.value.trim()) {
    alert('이름을 입력해 주세요.')
    return
  }
  const user = findUserByName(name.value.trim())
  resultMessage.value = user
    ? `입력하신 정보와 일치하는 아이디는 "${user.id}" 입니다.`
    : '일치하는 회원 정보를 찾지 못했습니다.'
}

function handleResetPassword() {
  if (!id.value.trim()) {
    alert('아이디를 입력해 주세요.')
    return
  }
  if (!newPassword.value || !confirmPassword.value) {
    alert('새 비밀번호를 모두 입력해 주세요.')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    alert('새 비밀번호가 서로 일치하지 않습니다.')
    return
  }

  try {
    ensurePasswordRules(newPassword.value)
    const user = findUserById(id.value.trim())
    if (!user) {
      resultMessage.value = '입력하신 아이디의 회원 정보가 없습니다.'
      return
    }
    updateUserPassword(user.id, newPassword.value)
    resultMessage.value = '비밀번호가 재설정되었습니다. 새 비밀번호로 다시 로그인해 주세요.'
  } catch (err) {
    const msg = err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.'
    alert(msg)
  }
}

function onSubmit() {
  if (mode.value === 'id') {
    handleFindId()
  } else {
    handleResetPassword()
  }
}
</script>

<style scoped>
.find-wrap {
  min-height: calc(100vh - var(--tab-h, 64px));
  display: grid;
  place-items: start center;
  padding: 32px 16px;
  background: #f6f7f9;
}
.card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  padding: 30px 24px 26px;
  display: grid;
  gap: 18px;
}
.title {
  margin: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: #f0f3ff;
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
}
.tab {
  border: none;
  border-radius: 12px;
  padding: 10px;
  background: transparent;
  font-weight: 600;
  color: #556080;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.tab.active {
  background: #fff;
  color: #1b208a;
  box-shadow: 0 4px 12px rgba(27, 32, 138, 0.12);
}
.form {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
.field span {
  font-size: 13px;
  font-weight: 600;
  color: #3d475c;
}
.field input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #dde1eb;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field input:focus {
  border-color: #8aa8ff;
  box-shadow: 0 0 0 3px rgba(138, 168, 255, 0.2);
}
.guide {
  margin: -6px 0 0;
  font-size: 12px;
  color: #8290a6;
}
.primary {
  margin-top: 4px;
  border: none;
  color: #201a00;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}
.primary-kakao {
  background: #ffcf33;
  box-shadow: 0 8px 18px rgba(255, 207, 51, 0.35);
}
.result-message {
  padding: 14px 16px;
  background: #f4f7ff;
  border: 1px solid #dbe5ff;
  border-radius: 14px;
  font-size: 14px;
  color: #253156;
  line-height: 1.5;
}
.links {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.links a {
  color: #4b65ff;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
