<template>
  <div class="settings-wrapper">
    <div class="settings-container">
      <header class="settings-header">
        <button type="button" class="back-button" @click="goBack" :aria-label="labels.back">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1 class="settings-title">{{ labels.title }}</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </header>

      <main class="settings-card">
        <section class="info-section">
          <h2 class="section-title">{{ labels.basicSection }}</h2>
          <div class="info-list">
            <article class="info-item" :class="{ 'info-item--editing': editingField === 'nickname' }">
              <span class="info-label">{{ labels.nickname }}</span>
              <div v-if="editingField === 'nickname'" class="info-editor">
                <input
                  v-model.trim="editForm.nickname"
                  type="text"
                  class="info-input"
                  maxlength="16"
                  :placeholder="placeholders.nickname"
                  @keyup.enter="saveNickname"
                />
                <p v-if="errors.nickname" class="info-error">{{ errors.nickname }}</p>
                <div class="editor-actions">
                  <button type="button" class="editor-button editor-button--primary" @click="saveNickname">{{ labels.save }}</button>
                  <button type="button" class="editor-button" @click="cancelEdit">{{ labels.cancel }}</button>
                </div>
              </div>
              <div v-else class="info-content">
                <span class="info-text">{{ account.nickname }}</span>
                <button type="button" class="info-action" @click="startEdit('nickname')">{{ labels.edit }}</button>
              </div>
            </article>

            <article class="info-item" :class="{ 'info-item--editing': editingField === 'phone' }">
              <span class="info-label">{{ labels.phone }}</span>
              <div v-if="editingField === 'phone'" class="info-editor">
                <input
                  v-model.trim="editForm.phone"
                  type="tel"
                  class="info-input"
                  :placeholder="placeholders.phone"
                  @keyup.enter="savePhone"
                />
                <p v-if="errors.phone" class="info-error">{{ errors.phone }}</p>
                <div class="editor-actions">
                  <button type="button" class="editor-button editor-button--primary" @click="savePhone">{{ labels.save }}</button>
                  <button type="button" class="editor-button" @click="cancelEdit">{{ labels.cancel }}</button>
                </div>
              </div>
              <div v-else class="info-content">
                <span class="info-text">{{ account.phone }}</span>
                <button type="button" class="info-action" @click="startEdit('phone')">{{ labels.edit }}</button>
              </div>
            </article>

            <article class="info-item">
              <span class="info-label">{{ labels.username }}</span>
              <div class="info-content">
                <span class="info-text">{{ account.username }}</span>
                <button type="button" class="info-action info-action--ghost" @click="copyUsername">{{ labels.copy }}</button>
              </div>
            </article>
            <p v-if="copyFeedback" class="copy-feedback">{{ copyFeedback }}</p>

            <article class="info-item" :class="{ 'info-item--editing': editingField === 'password' }">
              <span class="info-label">{{ labels.password }}</span>
              <div v-if="editingField === 'password'" class="info-editor">
                <input
                  v-model="editForm.password"
                  type="password"
                  class="info-input"
                  :placeholder="placeholders.password"
                />
                <input
                  v-model="editForm.passwordConfirm"
                  type="password"
                  class="info-input"
                  :placeholder="placeholders.passwordConfirm"
                  @keyup.enter="savePassword"
                />
                <p v-if="errors.password" class="info-error">{{ errors.password }}</p>
                <div class="editor-actions">
                  <button type="button" class="editor-button editor-button--primary" @click="savePassword">{{ labels.save }}</button>
                  <button type="button" class="editor-button" @click="cancelEdit">{{ labels.cancel }}</button>
                </div>
              </div>
              <div v-else class="info-content">
                <span class="info-text">{{ passwordMask }}</span>
                <button type="button" class="info-action" @click="startEdit('password')">{{ labels.reset }}</button>
              </div>
            </article>
          </div>
        </section>

        <section class="info-section">
          <h2 class="section-title">{{ labels.extraSection }}</h2>
          <div class="info-list">
            <article class="info-item info-item--static">
              <span class="info-label">{{ labels.gender }}</span>
              <div class="info-content info-content--static">
                <span class="info-text">{{ account.gender }}</span>
              </div>
            </article>
            <article class="info-item info-item--static">
              <span class="info-label">{{ labels.birth }}</span>
              <div class="info-content info-content--static">
                <span class="info-text">{{ account.birthDate }}</span>
              </div>
            </article>
          </div>
        </section>

        <button type="button" class="logout-button" @click="requestLogout">{{ labels.logout }}</button>
      </main>

      <transition name="fade">
        <div
          v-if="showLogoutConfirm"
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div class="alert-card">
            <h3 id="logout-modal-title">{{ labels.logoutConfirm }}</h3>
            <p>{{ labels.logoutGuide }}</p>
            <div class="alert-actions">
              <button type="button" class="alert-button alert-button--primary" @click="confirmLogout">{{ labels.confirm }}</button>
              <button type="button" class="alert-button" @click="cancelLogout">{{ labels.cancel }}</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import arrowBackIcon from "@/assets/arrowback.svg";
import axios from "axios";

const router = useRouter();

const labels = {
  back: "\uB9C8\uC774\uD398\uC774\uC9C0\uB85C \uB3CC\uC544\uAC00\uAE30",
  title: "\uD504\uB85C\uD544 \uC218\uC815",
  basicSection: "\uAE30\uBCF8 \uC815\uBCF4",
  extraSection: "\uBD80\uAC00 \uC815\uBCF4",
  nickname: "\uB2C9\uB124\uC784",
  phone: "\uC804\uD654\uBC88\uD638",
  username: "\uC544\uC774\uB514",
  password: "\uBE44\uBC00\uBC88\uD638",
  gender: "\uC131\uBCC4",
  birth: "\uC0DD\uB144\uC6D4\uC77C",
  save: "\uC800\uC7A5",
  cancel: "\uCDE8\uC18C",
  edit: "\uBCC0\uACBD",
  reset: "\uC7AC\uC124\uC815",
  copy: "\uBCF5\uC0AC",
  logout: "\uB85C\uADF8\uC544\uC6C3",
  logoutConfirm: "\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
  logoutGuide: "\uD604\uC7AC \uAE30\uAE30\uC5D0\uC11C \uB85C\uADF8\uC544\uC6C3\uB418\uACE0 \uB85C\uADF8\uC778 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
  confirm: "\uD655\uC778",
  openSettings: "\uD504\uB85C\uD544 \uC218\uC815 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9",
};

const placeholders = {
  nickname: "\uC0C8 \uB2C9\uB124\uC784\uC744 \uC785\uB825\uD558\uC138\uC694",
  phone: "010-0000-0000",
  password: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694",
  passwordConfirm: "\uBE44\uBC00\uBC88\uD638\uB97C \uD55C \uBC88 \uB354 \uC785\uB825\uD558\uC138\uC694",
};

const PHONE_FALLBACK_TEXT = '???? ???';

function formatPhoneNumber(raw?: string | null) {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const account = reactive({
  nickname: "로딩 중...",
  phone: "로딩 중...",
  username: "로딩 중...",
  password: "••••••••",
  gender: "로딩 중...",
  birthDate: "로딩 중...",
});

type EditableField = "nickname" | "phone" | "password";

const editingField = ref<EditableField | null>(null);
const showLogoutConfirm = ref(false);

const editForm = reactive({
  nickname: "",
  phone: "",
  password: "",
  passwordConfirm: "",
});

const errors = reactive({
  nickname: "",
  phone: "",
  password: "",
});

const copyFeedback = ref("");
let copyTimeout: number | null = null;

const passwordMask = computed(() => "••••••••");

// 백엔드에서 받아올 데이터의 타입을 미리 정의합니다.
type UserProfileData = {
  name?: string | null;
  phone?: string | null;
  userid?: string | null; // 백엔드 API가 userid를 반환한다고 가정
  gender?: 'M' | 'F' | null;
  birthDate?: string | null; // YYYY-MM-DDTHH:mm:ss.sssZ 형식의 문자열
};

async function fetchUserProfile() {
  try {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) {
      throw new Error('로그인 정보가 없습니다. 다시 로그인해주세요.');
    }

    const loggedInUser = JSON.parse(userJson) as { userid?: string };

    if (!loggedInUser || !loggedInUser.userid) {
       throw new Error('사용자 ID를 찾을 수 없습니다.');
    }

    const userid = loggedInUser.userid;

    const response = await axios.get<UserProfileData>(`http://localhost:3000/api/profile/${userid}`);

    const data = response.data;

    account.nickname = data.name || '닉네임 미설정';
    account.phone = formatPhoneNumber(data.phone) || PHONE_FALLBACK_TEXT;

    account.username = (typeof data.userid === 'string' && data.userid)
      ? data.userid
      : '아이디 없음';

    account.gender = data.gender === 'M' ? '남성' : (data.gender === 'F' ? '여성' : '미설정');

    if (typeof data.birthDate === 'string' && data.birthDate) {
      const parsedBirthDate = new Date(data.birthDate);
      if (Number.isNaN(parsedBirthDate.getTime())) {
        account.birthDate = '미설정';
      } else {
        account.birthDate = parsedBirthDate.toISOString().slice(0, 10);
      }
    } else {
      account.birthDate = '미설정';
    }

  } catch (error: unknown) { // [오류 수정 3] 'S'가 아닌 'unknown' 사용
    console.error('프로필 로딩 실패:', error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
    } else {
      alert('프로필 정보를 불러오는 데 실패했습니다.');
    }
    router.push('/login');
  }
}

// 페이지가 마운트(로드)될 때 fetchUserProfile 함수 실행
onMounted(() => {
  fetchUserProfile();
});


const resetErrors = () => {
  errors.nickname = "";
  errors.phone = "";
  errors.password = "";
};

const resetForm = () => {
  editForm.nickname = "";
  editForm.phone = "";
  editForm.password = "";
  editForm.passwordConfirm = "";
};

const startEdit = (field: EditableField) => {
  resetErrors();
  editingField.value = field;
  if (field === "nickname") {
    editForm.nickname = account.nickname;
  } else if (field === "phone") {
    editForm.phone = account.phone === PHONE_FALLBACK_TEXT ? '' : account.phone;
  } else {
    editForm.password = "";
    editForm.passwordConfirm = "";
  }
};

const cancelEdit = () => {
  resetErrors();
  resetForm();
  editingField.value = null;
};

// (TODO: 이 함수들도 나중에는 백엔드 API를 호출하도록 바꿔야 합니다.)
const saveNickname = () => {
  const nextNickname = editForm.nickname.trim();
  if (!nextNickname) {
    errors.nickname = "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD558\uC138\uC694.";
    return;
  }
  account.nickname = nextNickname;
  cancelEdit();
};

const savePhone = () => {
  const nextPhone = formatPhoneNumber(editForm.phone);
  if (!nextPhone) {
    errors.phone = "\uC804\uD654\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694.";
    return;
  }
  account.phone = nextPhone;
  cancelEdit();
};

const savePassword = () => {
  const nextPassword = editForm.password;
  const confirmPassword = editForm.passwordConfirm;
  if (nextPassword.length < 8) {
    errors.password = "8\uC790 \uC774\uC0C1 \uC785\uB825\uD558\uC138\uC694.";
    return;
  }
  if (nextPassword !== confirmPassword) {
    errors.password = "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
    return;
  }
  // account.password = nextPassword; // 실제 비밀번호를 저장하지 않음
  cancelEdit();
};

const copyUsername = async () => {
  resetCopyFeedback();
  try {
    await navigator.clipboard.writeText(account.username);
    copyFeedback.value = "\uC544\uC774\uB514\uB97C \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.";
    copyTimeout = window.setTimeout(() => {
      copyFeedback.value = "";
      copyTimeout = null;
    }, 2000);
  } catch {
    copyFeedback.value = "\uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
  }
};

const resetCopyFeedback = () => {
  if (copyTimeout) {
    window.clearTimeout(copyTimeout);
    copyTimeout = null;
  }
  copyFeedback.value = "";
};

const requestLogout = () => {
  showLogoutConfirm.value = true;
};

const cancelLogout = () => {
  showLogoutConfirm.value = false;
};

const confirmLogout = () => {
  showLogoutConfirm.value = false;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');

  router.push({ name: "login" }).catch((error) => {
    console.warn("\uB85C\uADF8\uC544\uC6C3 \uD6C4 \uC774\uB3D9 \uC911 \uC624\uB958", error);
  });
};

const goBack = () => {
  router.back();
};

onBeforeUnmount(() => {
  resetCopyFeedback();
});
</script>

<style scoped>
.settings-wrapper {
  min-height: 100vh;
  background: #3a2e20;
  padding: 2rem 1.25rem 4rem;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  display: flex;
  justify-content: center;
  width: 100%;
}

.settings-container {
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.settings-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
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

.settings-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #eeeff2;
  justify-self: center;
  text-align: center;
}

.header-spacer {
  width: 24px;
  height: 24px;
  display: block;
}

.settings-card {
  width: 100%;
  background: #eeeff2;
  border-radius: 24px;
  padding: 2.05rem 1.8rem 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.section-title {
  font-size: 1.06rem;
  font-weight: 700;
  color: #3f3d48;
  margin: 0;
}

.info-list {
  background: #eeeff2;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 51, 0.05);
  padding: 1.4rem 1.4rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.1rem;
  font-size: 0.98rem;
  color: #2f2f33;
  padding: 0.35rem 0;
}

.info-label {
  flex-basis: 95px;
  font-weight: 600;
  color: #5d5a66;
}

.info-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.info-content--static {
  justify-content: flex-end;
}

.info-text {
  flex: 1;
  text-align: right;
  font-weight: 700;
  color: #2f2f33;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-action {
  border: none;
  border-radius: 999px;
  background: #fdd651;
  color: #4e2d04;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.info-action--ghost {
  background: #fdd651;
  color: #4e2d04;
  border: none;
}

.info-action:hover {
  transform: translateY(-1px);
}

.info-action:focus-visible {
  outline: 2px solid rgba(203, 128, 38, 0.35);
  outline-offset: 2px;
}

.info-item--editing {
  background: rgba(255, 241, 216, 0.6);
  border-radius: 14px;
  padding: 1rem 0.75rem;
}

.info-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-input {
  width: 100%;
  border: 1px solid rgba(203, 128, 38, 0.3);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  font-size: 0.95rem;
  background: #fff;
  color: #2f2f33;
  transition: border 0.2s ease;
}

.info-input:focus {
  outline: none;
  border-color: #f0a545;
}

.info-error {
  margin: -0.35rem 0 0;
  font-size: 0.82rem;
  color: #d64545;
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
}

.editor-button {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: #fdd651;
  color: #4e2d04;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.editor-button--primary {
  background: #fdd651;
  color: #4e2d04;
}

.editor-button:hover {
  transform: translateY(-1px);
}

.editor-button:focus-visible {
  outline: 2px solid rgba(203, 128, 38, 0.35);
  outline-offset: 2px;
}

.logout-button {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 1rem 1.2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #ff9c8b 0%, #ff775f 100%);
  cursor: pointer;
  transition: transform 0.18s ease;
}

.logout-button:hover {
  transform: translateY(-2px);
}

.logout-button:focus-visible {
  outline: 3px solid rgba(255, 119, 95, 0.45);
  outline-offset: 3px;
}

.copy-feedback {
  margin: -0.35rem 0 0.35rem;
  font-size: 0.82rem;
  color: #a0641b;
  text-align: right;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(47, 47, 51, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 50;
}

.alert-card {
  width: min(320px, 100%);
  background: #ffffff;
  border-radius: 24px;
  padding: 1.8rem 1.6rem 1.4rem;
  text-align: center;
}

.alert-card h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #2f2f33;
}

.alert-card p {
  margin: 0.9rem 0 1.6rem;
  font-size: 0.96rem;
  line-height: 1.5;
  color: #5a5a5f;
}

.alert-actions {
  display: flex;
  gap: 0.8rem;
}

.alert-button {
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 0.65rem 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: #fdd651;
  color: #4e2d04;
  transition: transform 0.18s ease;
}

.alert-button--primary {
  background: #fdd651;
  color: #4e2d04;
}

.alert-button:hover {
  transform: translateY(-1px);
}

.alert-button:focus-visible {
  outline: 2px solid rgba(203, 128, 38, 0.35);
  outline-offset: 2px;
}

@media (max-width: 360px) {
  .settings-header {
    gap: 0.75rem;
  }

  .back-button {
    padding: 2px;
  }

  .back-icon {
    width: 20px;
    height: 20px;
  }

  .settings-card {
    padding: 2rem 1.2rem;
  }

  .info-label {
    flex-basis: 74px;
    font-size: 0.92rem;
  }

  .info-action {
    padding: 0.3rem 0.6rem;
    font-size: 0.78rem;
  }

  .editor-button {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .settings-wrapper {
    padding: 4.5rem 2rem;
  }

  .settings-container {
    width: min(640px, 100%);
  }

  .settings-card {
    padding: 2.6rem 2.4rem 2.7rem;
  }

  .info-label {
    flex-basis: 102px;
  }
}
</style>
