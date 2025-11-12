<template>
  <section class="auth-wrap">
    <div class="card">
      <div class="logo">
        <img src="@/assets/logo_my.png" alt="택시 로고" class="logo-img" />
      </div>
      <h1 class="title">회원가입</h1>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <input v-model.trim="name" type="text" placeholder="이름" />
        </div>

        <div class="field row">
          <input v-model.trim="userid" type="text" placeholder="아이디" />
          <button type="button" class="ghost" @click="checkId">중복확인</button>
        </div>

        <div class="field">
          <input v-model="pw" type="password" placeholder="비밀번호" autocomplete="new-password" />
        </div>
        <div class="field">
          <input v-model="pw2" type="password" placeholder="비밀번호 확인" autocomplete="new-password" />
        </div>

        <div class="field">
          <input
            v-model="phone"
            type="tel"
            inputmode="tel"
            placeholder="010-0000-0000"
            autocomplete="tel-national"
            @input="formatPhoneInput"
          />
        </div>
        <div class="field">
          <input v-model="birthDate" type="date" placeholder="생년월일" />
        </div>

        <div class="gender-group">
          <span class="group-label">성별</span>
          <div class="gender-options">
            <label class="gender-option male">
              <input type="radio" value="M" v-model="gender" />
              <span class="chip">
                <svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 3h6v2h-3.586l2.293 2.293-1.414 1.414L16 6.414V10h-2V4h-4V2h5a1 1 0 0 1 1 1Z" />
                  <path d="M10 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
                <span class="text">남성</span>
              </span>
            </label>
            <label class="gender-option female">
              <input type="radio" value="F" v-model="gender" />
              <span class="chip">
                <svg class="gender-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a6 6 0 0 1 2 11.657V16h2v2h-2v2h-2v-2H8v-2h2v-2.343A6 6 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
                <span class="text">여성</span>
              </span>
            </label>
          </div>
        </div>

        <div class="agreements">
          <label><input type="checkbox" v-model="sms" /> SMS 수신 동의(선택)</label>
          <label><input type="checkbox" v-model="terms" /> 이용약관 동의(필수)</label>
        </div>

        <button class="primary" type="submit">회원가입</button>

        <div class="sub-links center">
          <router-link to="/login">이미 계정이 있으신가요? 로그인</router-link>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 1. 기존 registerUser 임포트 제거
// import { registerUser } from '@/services/auth'
// 2. axios 임포트 추가
import axios from 'axios'

const router = useRouter()

const name = ref('')
const userid = ref('')
const pw = ref('')
const pw2 = ref('')
const phone = ref('')
const birthDate = ref('')
const gender = ref<'M' | 'F' | ''>('')
const sms = ref(false)
const terms = ref(false)

function formatPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digitsOnly = target.value.replace(/\D/g, '').slice(0, 11)

  if (digitsOnly.length <= 3) {
    phone.value = digitsOnly
    return
  }
  if (digitsOnly.length <= 7) {
    phone.value = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`
    return
  }
  phone.value = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`
}

async function checkId() {
  const trimmedId = userid.value.trim()
  if (!trimmedId) {
    alert('아이디를 입력해 주세요.')
    return
  }

  try {
    const response = await axios.get('http://localhost:3000/api/auth/check-id', {
      params: { userid: trimmedId },
    })

    const available =
      (typeof response.data?.available === 'boolean' && response.data.available) ||
      response.data?.status === 'available'

    if (available) {
      alert(`'${trimmedId}' 사용 가능한 아이디입니다.`)
    } else {
      alert(`'${trimmedId}' 사용 중인 아이디입니다.`)
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        alert(`'${trimmedId}' 사용 중인 아이디입니다.`)
        return
      }

      const backendMessage =
        (err.response?.data && typeof err.response.data === 'object' && 'error' in err.response.data
          ? (err.response.data as { error?: string }).error
          : undefined) || err.message

      alert(backendMessage || '아이디 중복 확인 중 오류가 발생했습니다.')
      return
    }

    alert(err instanceof Error ? err.message : '아이디 중복 확인 중 알 수 없는 오류가 발생했습니다.')
  }
}

// 3. submit 함수를 async로 변경
async function submit() {
  const filledAllFields =
    name.value.trim() &&
    userid.value.trim() &&
    phone.value.trim() &&
    birthDate.value &&
    pw.value &&
    pw2.value &&
    gender.value

  if (!filledAllFields) {
    alert('모든 정보를 입력해 주세요.')
    return
  }
  if (pw.value !== pw2.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }
  const normalizedPhone = phone.value.replace(/\D/g, '')
  if (normalizedPhone.length < 9) {
    alert('전화번호 입력은 필수입니다.')
    return
  }
  if (!terms.value) {
    alert('이용약관 동의는 필수입니다.')
    return
  }

  const phoneToSend = phone.value.trim() || null
  const birthDateToSend = birthDate.value || null

  // 4. 기존 try...catch 블록을 API 호출 코드로 변경
  try {
    // ⭐️ 백엔드 회원가입 API 호출
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      name: name.value,
      userid: userid.value,
      pw: pw.value,
      gender: gender.value || null,
      sms: sms.value,
      terms: terms.value,
      phone: phoneToSend,
      birthDate: birthDateToSend,
    })

    console.log('백엔드 응답:', response.data) // 성공 로그
    alert('회원가입이 완료되었습니다!')
    router.push({ name: 'login' })

  } catch (err: unknown) { // 5. 'any' 대신 'unknown' 사용 및 에러 처리
    let msg = '회원가입에 실패했습니다.'
    // 백엔드에서 보낸 에러 메시지(예: "이미 사용 중인 아이디입니다.") 표시
    if (axios.isAxiosError(err) && err.response?.data?.error) {
      msg = err.response.data.error
    } else if (err instanceof Error) {
      msg = err.message
    }
    alert(msg)
  }
}

</script>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - var(--header-h, 56px));
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
  padding: 28px 24px 24px;
}
.logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  background: #fff7d1;
  box-shadow: inset 0 0 0 2px #ffe48e;
}
.logo-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}
.title {
  text-align: center;
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
}
.form {
  display: grid;
  gap: 12px;
}

.field input {
  width: 100%;
  padding: 13px 14px;
  border-radius: 12px;
  border: 1px solid #e3e6ec;
  background: #fafbff;
  outline: none;
  font-size: 14px;
}
.field input:focus {
  border-color: #8aa8ff;
  background: #fff;
}
.field.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.gender-group {
  display: grid;
  gap: 8px;
}
.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #3d475c;
}
.gender-options {
  display: flex;
  gap: 12px;
}
.gender-option {
  flex: 1;
  position: relative;
}
.gender-option input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #e3e6ec;
  background: #fff;
  font-weight: 600;
  color: #4f566b;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s;
}
.gender-option.male .chip {
  color: #3b63ff;
  border-color: #d7e0ff;
  background: #f3f6ff;
}
.gender-option.female .chip {
  color: #ff6fae;
  border-color: #ffd6ec;
  background: #fff3fa;
}
.gender-option input:checked + .chip {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
}
.gender-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.gender-option.male input:checked + .chip {
  border-color: #3b63ff;
  background: #e8eeff;
  color: #1d3dff;
}
.gender-option.female input:checked + .chip {
  border-color: #ff73b5;
  background: #ffe9f4;
  color: #ff3a9a;
}

.agreements {
  display: grid;
  gap: 6px;
  color: #555;
  font-size: 14px;
}

.ghost {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e3e6ec;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  margin-top: 6px;
  background: #ffcf33;
  border: none;
  color: #201a00;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
}
.sub-links.center {
  text-align: center;
  margin-top: 6px;
}
</style>
