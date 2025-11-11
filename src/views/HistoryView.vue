<template>
  <div class="history-wrapper">
    <div class="history-container">
      <header class="history-header">
        <button type="button" class="back-button" @click="goBack" :aria-label="labels.back">
          <img :src="arrowBackIcon" alt="" class="back-icon" aria-hidden="true" />
        </button>
        <h1 class="history-title">{{ labels.title }}</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </header>

      <main class="history-list">
        <section v-for="ride in rides" :key="ride.id" class="history-card">
          <header class="card-header">
            <div class="ride-meta">
              <span class="ride-icon" aria-hidden="true">&#128661;</span>
              <div>
                <h2>{{ labels.rideType }}</h2>
                <p class="ride-date">{{ ride.date }}</p>
              </div>
            </div>
          </header>

          <dl class="ride-details">
            <div class="ride-row">
              <dt>{{ labels.duration }}</dt>
              <dd>{{ ride.time }}</dd>
            </div>
            <div class="ride-row">
              <dt>{{ labels.origin }}</dt>
              <dd>{{ ride.origin }}</dd>
            </div>
            <div class="ride-row">
              <dt>{{ labels.destination }}</dt>
              <dd>{{ ride.destination }}</dd>
            </div>
            <div class="ride-row total">
              <dt>{{ labels.fare }}</dt>
              <dd>{{ ride.fare }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <button
              type="button"
              class="action-button action-button--primary"
              @click="goToReview(ride.id)"
            >
              {{ labels.review }}
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import arrowBackIcon from "@/assets/arrowback.svg";

const router = useRouter();

const labels = {
  back: "\uB9C8\uC774\uD398\uC774\uC9C0\uB85C \uB3CC\uC544\uAC00\uAE30",
  title: "\uC774\uC6A9 \uAE30\uB85D",
  rideType: "\uD0DD\uC2DC",
  duration: "\uC6B4\uD589 \uC2DC\uAC04",
  origin: "\uCD9C\uBC1C",
  destination: "\uB3C4\uCC29",
  fare: "\uAE08\uC561",
  review: "\uD3C9\uAC00\uD558\uAE30",
};

const rides = [
  {
    id: 1,
    date: "25.xx.xx (\uC6D4)",
    time: "13:21 - 13:29",
    origin: "\uCD9C\uBC1C\uC9C0",
    destination: "\uB3C4\uCC29\uC9C0",
    fare: "5,700\uC6D0",
  },
  {
    id: 2,
    date: "25.10.14 (\uC6D4)",
    time: "07:10 - 07:17",
    origin: "\uC804\uBD81\uB300 \uC804\uC8FC\uCE74\uD398\uC2A4 \uCC3D\uC758\uAD00",
    destination: "\uC804\uC8FC\uC2DC\uC678\uBC84\uC2A4\uACF5\uC6A9\uD130\uBBF8\uB110",
    fare: "5,000\uC6D0",
  },
  {
    id: 3,
    date: "25.10.06 (\uC77C)",
    time: "10:23 - 10:30",
    origin: "\uC804\uBD81\uB300 \uD55C\uC6B8\uAD00",
    destination: "\uC804\uC8FC\uC5ED \uC11C\uBD80\uAD11\uC7A5",
    fare: "6,200\uC6D0",
  },
];

const goBack = () => {
  router.back();
};

const goToReview = (rideId: number) => {
  router
    .push({ name: "ride-review", query: { rideId } })
    .catch((error) => {
      console.warn("\uB9AC\uBDF0 \uD398\uC774\uC9C0 \uC774\uB3D9 \uC911 \uC624\uB958", error);
    });
};
</script>

<style scoped>
.history-wrapper {
  min-height: 100vh;
  background: #3a2e20;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  justify-content: center;
  width: 100%;
}

.history-container {
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.history-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.history-title {
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-card {
  background: #eeeff2;
  border-radius: 20px;
  padding: 1.5rem 1.45rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ride-meta {
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.ride-icon {
  font-size: 1.7rem;
}

.ride-meta h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #2f2f33;
}

.ride-date {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: #6a6a70;
}

.ride-details {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
}

.ride-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #3a3a40;
}

.ride-row dt {
  font-weight: 600;
  color: #6a6a70;
}

.ride-row.total dt {
  color: #2f2f33;
}

.ride-row.total dd {
  font-weight: 700;
  color: #3a3a40;
}

.ride-row dd {
  margin: 0;
  text-align: right;
  flex: 1;
}

.card-actions {
  display: flex;
  margin-top: 0.4rem;
}

.action-button {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 0.75rem 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.action-button--primary {
  background: #3a2e20;
  color: #ffffff;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:focus-visible {
  outline: 2px solid rgba(255, 119, 95, 0.35);
  outline-offset: 2px;
}

@media (min-width: 768px) {
  .history-wrapper {
    padding: 4rem 2.5rem;
  }

  .history-card {
    padding: 1.6rem 1.8rem 1.4rem;
  }

  .ride-row {
    font-size: 1rem;
  }
}
</style>
