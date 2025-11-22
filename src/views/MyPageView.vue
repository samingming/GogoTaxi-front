<template>
  <div class="mypage-wrapper">
    <div class="page-container">
      <section class="profile-block">
        <div class="avatar">
          <img :src="profileImage" alt="profile image" />
          <span v-if="genderIconSrc" class="avatar__badge">
            <span class="sr-only">{{ genderIconAlt }}</span>
            <img :src="genderIconSrc" alt="" aria-hidden="true" />
          </span>
        </div>
        <div class="profile-info">
          <span class="profile-name">{{ displayNickname }}</span>
          <span class="profile-meta">{{ displayPhone }}</span>
        </div>
        <button type="button" class="edit-button" @click="openProfileSettings">
          <span class="sr-only">{{ labels.openSettings }}</span>
          <img :src="editIcon" alt="" class="edit-icon" aria-hidden="true" />
        </button>
      </section>

      <section class="menu-block">
        <h2 class="menu-title">{{ labels.quickMenu }}</h2>
        <nav class="menu-list">
          <button type="button" class="menu-item" @click="goTo('history')">
            <span class="menu-label">{{ labels.history }}</span>
            <span class="menu-arrow" aria-hidden="true">&rsaquo;</span>
          </button>
          <button type="button" class="menu-item" @click="goTo('payment')">
            <span class="menu-label">{{ labels.payment }}</span>
            <span class="menu-arrow" aria-hidden="true">&rsaquo;</span>
          </button>
          <button type="button" class="menu-item" @click="goTo('notice')">
            <span class="menu-label">{{ labels.notice }}</span>
            <span class="menu-arrow" aria-hidden="true">&rsaquo;</span>
          </button>
        </nav>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import editIcon from "@/assets/edit.svg";
import profileImage from "@/assets/user.svg";
import maleBadge from "@/assets/male.svg";
import femaleBadge from "@/assets/female.svg";
import { fetchMe } from "@/api/auth";

const router = useRouter();

const labels = {
  quickMenu: "\uBC14\uB85C\uAC00\uAE30",
  history: "\uC774\uC6A9 \uAE30\uB85D",
  payment: "\uACB0\uC81C \uC218\uB2E8 \uAD00\uB9AC",
  notice: "\uACF5\uC9C0\uC0AC\uD56D",
  noNickname: "\uB2C9\uB124\uC784 \uBBF8\uB4F1\uB85D",
  noPhone: "\uC5F0\uB77D\uCC98 \uBBF8\uB4F1\uB85D",
  openSettings: "\uD504\uB85C\uD544 \uC218\uC815 \uD398\uC774\uC9C0 \uC774\uB3D9",
  maleBadge: "\uB0A8\uC131 \uD504\uB85C\uD544",
  femaleBadge: "\uC5EC\uC131 \uD504\uB85C\uD544",
};

type GenderValue = "male" | "female" | "M" | "F" | "\uB0A8\uC131" | "\uC5EC\uC131" | "";

const user = ref({
  nickname: "",
  phone: "",
  gender: "" as GenderValue,
});

const displayNickname = computed(() => {
  const nickname = user.value.nickname?.trim();
  return nickname?.length ? nickname : labels.noNickname;
});

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const displayPhone = computed(() => {
  const phone = user.value.phone?.trim();
  const formatted = phone ? formatPhone(phone) : "";
  return formatted.length ? formatted : labels.noPhone;
});

const genderIconSrc = computed(() => {
  const normalized = user.value.gender?.toString().trim().toLowerCase();
  if (["female", "f", "\uc5ec\uc131"].includes(normalized)) return femaleBadge;
  if (["male", "m", "\ub0a8\uc131"].includes(normalized)) return maleBadge;
  return "";
});

const genderIconAlt = computed(() => {
  const normalized = user.value.gender?.toString().trim().toLowerCase();
  if (["female", "f", "\uc5ec\uc131"].includes(normalized)) return labels.femaleBadge;
  if (["male", "m", "\ub0a8\uc131"].includes(normalized)) return labels.maleBadge;
  return "";
});

const routeNameMap: Record<string, string> = {
  history: "History",
  payment: "payment-methods",
  notice: "notice",
};

const goTo = (page: string) => {
  const routeName = routeNameMap[page];
  if (!routeName) return;
  router.push({ name: routeName });
};

const openProfileSettings = () => {
  router.push("/mypage/settings");
};

const loadProfile = async () => {
  try {
    const me = await fetchMe();
    user.value.nickname = me.name || me.loginId || "";
    user.value.phone = me.phone || "";
    user.value.gender = (me.gender as GenderValue) || "";
  } catch (err) {
    console.error("Failed to load profile", err);
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.mypage-wrapper {
  min-height: max(
    0px,
    calc(100dvh - var(--header-h) - var(--tab-h) - var(--safe-bottom) - var(--browser-ui-bottom))
  );
  background: #3a2e20;
  padding: 3.5rem 1.25rem calc(3rem + var(--safe-bottom));
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

.page-container {
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.profile-block {
  display: flex;
  align-items: center;
  gap: 1.45rem;
  padding: 1.55rem 1.5rem;
  background: #eeeff2;
  border-radius: 28px;
}

.avatar {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  position: relative;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.avatar__badge {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  display: grid;
  place-items: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.avatar__badge img {
  width: 18px;
  height: 18px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  justify-content: center;
  min-height: 84px;
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.42rem;
  font-weight: 700;
  color: #2b2113;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.profile-meta {
  font-size: 1rem;
  color: #574f48;
  line-height: 1.15;
}

.edit-button {
  margin-left: auto;
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.edit-button:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  border-radius: 8px;
  outline-offset: 3px;
}

.edit-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.18s ease;
}

.edit-button:hover .edit-icon {
  transform: scale(1.05);
}

.menu-block {
  background: #eeeff2;
  border-radius: 28px;
  padding: 1.35rem 1.25rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.menu-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #3a3a40;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.menu-item {
  width: 100%;
  border: none;
  border-radius: 18px;
  background: #fdd651;
  padding: 0.95rem 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 600;
  color: #2f2f33;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.menu-item:hover {
  transform: translateY(-2px);
}

.menu-item:focus-visible {
  outline: 3px solid rgba(203, 128, 38, 0.4);
  outline-offset: 3px;
}

.menu-arrow {
  font-size: 1.25rem;
  color: #2f2f33;
  margin-left: 0.75rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 480px) {
  .avatar {
    width: 64px;
    height: 64px;
    align-self: center;
  }

  .avatar__badge {
    width: 24px;
    height: 24px;
    right: -3px;
    bottom: -3px;
  }

  .avatar img {
    width: 100%;
    height: 100%;
  }

  .profile-info {
    min-height: auto;
  }

  .edit-button {
    margin-left: 0;
    align-self: center;
  }
}

@media (min-width: 768px) {
  .mypage-wrapper {
    padding: 4.5rem 2rem calc(4rem + var(--safe-bottom));
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .menu-item {
    font-size: 1.05rem;
  }
}
</style>
