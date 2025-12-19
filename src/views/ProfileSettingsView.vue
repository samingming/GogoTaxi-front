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
                  @input="handlePhoneInput"
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
import { reactive, ref, computed, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import arrowBackIcon from "@/assets/arrowback.svg";
import { fetchMe, updateProfile, changePassword } from "@/api/auth";

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

const account = reactive({
  nickname: "",
  phone: "",
  username: "",
  password: "********",
  gender: "",
  birthDate: "",
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

const passwordMask = computed(() => "*".repeat(account.password.length));

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

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  target.value = formatPhone(target.value);
  editForm.phone = target.value;
};

const startEdit = (field: EditableField) => {
  resetErrors();
  editingField.value = field;
  if (field === "nickname") {
    editForm.nickname = account.nickname;
  } else if (field === "phone") {
    editForm.phone = account.phone;
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

const saveNickname = () => {
  const nextNickname = editForm.nickname.trim();
  if (!nextNickname) {
    errors.nickname = "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD558\uC138\uC694.";
    return;
  }
  updateProfile({ name: nextNickname })
    .then((me) => {
      const safeName = (me.name ?? '').trim() || (me.loginId ?? '').trim() || nextNickname
      account.nickname = safeName
      cancelEdit();
    })
    .catch((err) => {
      console.error(err);
      errors.nickname = "저장에 실패했습니다.";
    });
};

const savePhone = () => {
  const nextPhone = formatPhone(editForm.phone.trim());
  const digits = normalizePhone(nextPhone);
  if (!digits) {
    errors.phone = "전화번호를 입력해 주세요.";
    return;
  }
  if (digits.length < 9) {
    errors.phone = "전화번호를 확인해 주세요.";
    return;
  }
  updateProfile({ phone: digits })
    .then((me) => {
      account.phone = formatPhone(me.phone || digits);
      cancelEdit();
    })
    .catch((err) => {
      console.error(err);
      errors.phone = "저장에 실패했습니다.";
    });
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
  changePassword({ currentPassword: editForm.password, newPassword: nextPassword })
    .then(() => {
      account.password = "********";
      cancelEdit();
    })
    .catch((err) => {
      console.error(err);
      errors.password = "비밀번호 변경에 실패했습니다.";
    });
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
  import("@/services/auth")
    .then(mod => mod.logout?.())
    .catch(error => {
      console.warn("\uB85C\uADF8\uC544\uC6C3 \uCC98\uB9AC \uC911 \uC624\uB958", error);
    })
    .finally(() => {
      router.push({ name: "login" }).catch((error) => {
        console.warn("\uB85C\uADF8\uC544\uC6C3 \uD6C4 \uC774\uB3D9 \uC911 \uC624\uB958", error);
      });
    });
};

const goBack = () => {
  router.back();
};

onBeforeUnmount(() => {
  resetCopyFeedback();
});

const loadProfile = async () => {
  try {
    const me = await fetchMe();
    const safeName = (me.name ?? "").trim() || (me.loginId ?? "").trim();
    account.nickname = safeName;
    account.phone = formatPhone(me.phone ?? "");
    account.username = me.loginId ?? "";
    account.gender = me.gender === "F" ? "\uC5EC\uC131" : me.gender === "M" ? "\uB0A8\uC131" : "";
    const safeBirth =
      typeof me.birthDate === "string" && me.birthDate.trim() ? me.birthDate.split("T")[0] : "";
    account.birthDate = safeBirth ?? "";
  } catch (err) {
    console.error("Failed to load profile", err);
    account.nickname = "";
    account.phone = "";
    account.username = "";
    account.gender = "";
    account.birthDate = "";
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.settings-wrapper {
  min-height: calc(100dvh - var(--header-h, 0px) - var(--tab-h, 64px));
  background: #fff7e1;
  color: #3b2600;
  padding: clamp(18px, 5vw, 38px) clamp(14px, 5vw, 32px) clamp(18px, 4vh, 32px);
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  display: flex;
  justify-content: center;
  width: 100%;
}

.settings-container {
  width: min(720px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
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
  font-size: clamp(24px, 5vw, 28px);
  font-weight: 800;
  color: #2b1400;
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
  background: #ffffff;
  border: 1px solid #f3d193;
  border-radius: 24px;
  padding: clamp(18px, 4vw, 24px) clamp(16px, 4vw, 22px) clamp(20px, 4vw, 26px);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(255, 202, 104, 0.18);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.section-title {
  font-size: 1.06rem;
  font-weight: 700;
  color: #a16207;
  margin: 0;
}

.info-list {
  background: #fffdf6;
  border-radius: 18px;
  border: 1px solid rgba(234, 179, 8, 0.28);
  padding: 1.1rem 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.1rem;
  font-size: 0.98rem;
  color: #3b2600;
  padding: 0.2rem 0;
}

.info-label {
  flex-basis: 92px;
  font-weight: 700;
  color: #c2410c;
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
  text-align: left;
  font-weight: 700;
  color: #3b2600;
  white-space: normal;
  word-break: keep-all;
  line-height: 1.35;
  min-width: 0;
}

.info-action {
  border: none;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
}

.info-action--ghost {
  background: rgba(250, 204, 21, 0.12);
  color: #a16207;
  border: 1px solid rgba(234, 179, 8, 0.35);
}

.info-action:hover {
  transform: translateY(-1px);
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.info-action:focus-visible {
  outline: 2px solid rgba(203, 128, 38, 0.35);
  outline-offset: 2px;
}

.info-item--editing {
  background: rgba(255, 241, 216, 0.9);
  border-radius: 14px;
  padding: 0.8rem 0.7rem;
  border: 1px solid rgba(234, 179, 8, 0.35);
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
  color: #3b2600;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.info-input:focus {
  outline: none;
  border-color: #f0a545;
  box-shadow: 0 0 0 3px rgba(240, 165, 69, 0.2);
}

.info-error {
  margin: -0.35rem 0 0;
  font-size: 0.82rem;
  color: #d64545;
}

.editor-actions {
  display: flex;
  gap: 0.6rem;
}

.editor-button {
  flex: 1;
  border: 1px solid rgba(234, 179, 8, 0.35);
  border-radius: 10px;
  padding: 0.5rem 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
}

.editor-button--primary {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
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
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: #2b1400;
  background: rgba(250, 204, 21, 0.18);
  border: 1px solid rgba(234, 179, 8, 0.45);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
}

.logout-button:hover {
  transform: translateY(-2px);
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
}

.logout-button:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  outline-offset: 3px;
}

.copy-feedback {
  margin: -0.35rem 0 0.35rem;
  font-size: 0.82rem;
  color: #a16207;
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
  background: rgba(59, 38, 0, 0.35);
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
  padding: 1.5rem 1.4rem 1.2rem;
  text-align: center;
  border: 1px solid #f3d193;
}

.alert-card h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #2b1400;
}

.alert-card p {
  margin: 0.9rem 0 1.6rem;
  font-size: 0.96rem;
  line-height: 1.5;
  color: #5a3a0c;
}

.alert-actions {
  display: flex;
  gap: 0.8rem;
}

.alert-button {
  flex: 1;
  border: 1px solid rgba(234, 179, 8, 0.35);
  border-radius: 999px;
  padding: 0.65rem 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
  transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
}

.alert-button--primary {
  background: rgba(250, 204, 21, 0.32);
  color: #7c2d12;
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
    width: min(720px, 100%);
  }

  .settings-card {
    padding: 2rem 1.8rem 2.2rem;
  }

  .info-label {
    flex-basis: 102px;
  }
}
</style>
