<!-- src/pages/Home/MainPage.vue -->
<template>
  <section class="main">
    <div class="hero">
      <div
        v-if="latestNotice"
        class="notice-banner"
        role="button"
        tabindex="0"
        :aria-label="`최신 공지 ${latestNotice.title} 바로가기`"
        @click="goLatestNotice"
        @keydown.enter.prevent="goLatestNotice"
        @keydown.space.prevent="goLatestNotice"
      >
        <div class="notice-banner__glass">
          <span class="notice-banner__label">최신 공지</span>
          <div class="notice-banner__marquee">
            <span class="notice-banner__track">
              {{ marqueeText }}
            </span>
          </div>
        </div>
      </div>
      <div class="map-board">
        <div class="board-header">
          <h2>꼬꼬택 주요 메뉴</h2>
          <p>GogoTaxi Main Menu Guide</p>
        </div>
        <div class="board-body">
          <svg
            class="map-svg"
            viewBox="0 0 800 520"
            aria-hidden="true"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          >
            <defs>
              <linearGradient id="map-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#c6eb9e" />
                <stop offset="40%" stop-color="#9cd976" />
                <stop offset="100%" stop-color="#66c166" />
              </linearGradient>
              <linearGradient id="map-shadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(31, 63, 36, 0.45)" />
                <stop offset="60%" stop-color="rgba(31, 63, 36, 0)" />
              </linearGradient>
              <radialGradient id="map-water" cx="0.5" cy="0.5" r="0.7">
                <stop offset="0%" stop-color="#8de6ff" />
                <stop offset="100%" stop-color="#3aa1d3" />
              </radialGradient>
            </defs>

            <rect width="800" height="520" fill="none" rx="40" ry="40" />

            <g class="map-illustration" transform="translate(-20 -85) scale(1.08)">
              <path
                class="map-land"
                d=" M 120 470 C 70 380 90 270 210 220 C 260 200 250 150 320 120 C 410 80 520 120 600 180 C 705 260 720 340 670 400 C 628 450 572 478 530 508 C 470 550 390 538 315 540 C 230 542 170 530 120 470 Z "
              />
              <path
                class="map-shadow"
                d=" M 150 500 C 120 420 160 340 250 300 C 310 270 310 220 360 200 C 430 170 500 200 550 240 C 620 295 640 350 610 395 C 570 455 480 470 430 500 C 360 540 250 540 180 520 Z "
              />

              <path
                class="map-border"
                d=" M 120 470 C 70 380 90 270 210 220 C 260 200 250 150 320 120 C 410 80 520 120 600 180 C 705 260 720 340 670 400 C 628 450 572 478 530 508 C 470 550 390 538 315 540 C 230 542 170 530 120 470 "
              />

              <path
                class="map-trail"
                d=" M 170 440 C 212 402 232 352 288 320 C 332 294 352 252 392 236 C 432 220 468 236 500 256 C 536 278 560 272 585 246 C 600 230 602 236 598 258 C 592 300 560 326 528 350 C 492 376 472 398 456 424 C 432 462 380 472 330 466 C 284 461 240 466 206 456 C 186 450 176 446 170 440 "
              />

              <path
                class="map-water"
                d=" M 468 374 C 482 354 514 350 540 360 C 564 370 576 390 566 408 C 552 432 518 440 488 430 C 464 422 450 400 456 384 C 460 376 462 378 468 374 Z "
              />
              <path
                class="map-water-highlight"
                d=" M 482 380 C 496 370 520 370 534 378 C 542 382 546 392 536 398 C 522 408 500 408 488 398 C 480 392 476 386 482 380 Z "
              />

              <g class="map-ornaments" aria-hidden="true">
                <g class="map-pebbles map-pebbles--northwest">
                  <ellipse class="map-pebble" cx="235" cy="235" rx="12" ry="8" />
                  <ellipse class="map-pebble" cx="252" cy="225" rx="7" ry="5" />
                  <ellipse class="map-pebble" cx="244" cy="250" rx="5" ry="4" />
                </g>
                <g class="map-pebbles map-pebbles--southwest">
                  <ellipse class="map-pebble" cx="250" cy="420" rx="10" ry="7" />
                  <ellipse class="map-pebble" cx="266" cy="408" rx="6" ry="4" />
                  <ellipse class="map-pebble" cx="258" cy="428" rx="4" ry="3" />
                </g>
                <g class="map-house" transform="translate(560 300)">
                  <image
                    class="map-house-image"
                    :href="houseImage"
                    :xlink:href="houseImage"
                    x="-48"
                    y="-52"
                    width="112"
                    height="112"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              </g>

              <g
                class="menu-point menu-point--make"
                role="button"
                tabindex="0"
                aria-label="방 만들기 바로가기"
                @click="goCreate"
                @keydown.enter.prevent="goCreate"
                @keydown.space.prevent="goCreate"
              >
                <image
                  :href="logoFind"
                  :xlink:href="logoFind"
                  x="188"
                  y="278"
                  width="92"
                  height="92"
                  class="menu-logo"
                />
              </g>
              <g
                class="menu-point menu-point--find"
                role="button"
                tabindex="0"
                aria-label="방 찾기 바로가기"
                @click="goSearch"
                @keydown.enter.prevent="goSearch"
                @keydown.space.prevent="goSearch"
              >
                <image
                  :href="logoMake"
                  :xlink:href="logoMake"
                  x="415"
                  y="148"
                  width="92"
                  height="92"
                  class="menu-logo"
                />
              </g>
              <g
                class="menu-point menu-point--my"
                role="button"
                tabindex="0"
                aria-label="나의 방 바로가기"
                @click="goMyRooms"
                @keydown.enter.prevent="goMyRooms"
                @keydown.space.prevent="goMyRooms"
              >
                <image
                  :href="logoMy"
                  :xlink:href="logoMy"
                  x="270"
                  y="365"
                  width="120"
                  height="120"
                  class="menu-logo"
                />
              </g>
            </g>
          </svg>
        </div>
        <ul class="legend legend--menus">
          <li>
            <img :src="logoFind" alt="방 만들기" class="legend-logo legend-logo--make" />
            <span>방 만들기</span>
          </li>
          <li>
            <img :src="logoMake" alt="방 찾기" class="legend-logo legend-logo--find" />
            <span>방 찾기</span>
          </li>
          <li>
            <img :src="logoMy" alt="나의 방" class="legend-logo legend-logo--my" />
            <span>나의 방</span>
          </li>
        </ul>
      </div>

      <section class="gateway">
        <header class="gateway-header">
          <h3>서비스 바로가기</h3>
          <p>업데이트된 공지와 결제 관리를 빠르게 확인해 보세요.</p>
        </header>
        <div class="gateway-grid">
          <article class="gateway-card gateway-card--notice">
            <div class="card-body">
              <h4>공지사항 센터</h4>
              <p>운영팀에서 전하는 최신 소식, 서비스 공지, 점검 안내를 한곳에서 확인할 수 있어요.</p>
            </div>
            <footer>
              <button class="card-btn" type="button" @click="goNotice">
                공지사항 바로가기
              </button>
            </footer>
          </article>
          <article class="gateway-card gateway-card--payment">
            <div class="card-body">
              <h4>결제 수단 관리</h4>
              <p>등록된 카드와 계좌를 손쉽게 관리하고, 결제 이력을 확인할 수 있도록 준비 중이에요.</p>
            </div>
            <footer>
              <button class="card-btn" type="button" @click="goPayment">
                결제 관리 준비 알림
              </button>
            </footer>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import logoMake from '@/assets/logo_make.png'
import logoFind from '@/assets/logo_find.png'
import logoMy from '@/assets/logo_my.png'
import houseImage from '@/assets/house.png'
import { notices } from '@/components/notices'

const router = useRouter()

function goCreate() { router.push({ name: 'create-room' }) }
function goSearch() { router.push({ name: 'find-room' }) }
function goMyRooms() { router.push({ name: 'my-rooms' }) }
function goNotice() { router.push({ name: 'notice' }) }
function goPayment() { router.push({ name: 'payment-methods' }) }

const latestNotice = computed(() => {
  if (!notices.length) return null
  return [...notices].sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null
})

const marqueeText = computed(() => latestNotice.value?.title.trim() ?? '')

function goLatestNotice() {
  if (!latestNotice.value) return
  router.push({ name: 'notice-detail', params: { id: latestNotice.value.id } })
}
</script>

<style scoped>
.main {
  min-height: calc(100dvh - var(--tab-h));
  padding-bottom: 0;
  background: #fff7e1;
}

.hero {
  position: relative;
  width: 100%;
  /* ⬇️ 갈색 여백 줄이기: 최소 높이/하단 패딩 축소 */
  min-height: clamp(640px, 92dvh, 1100px);
  padding: clamp(36px, 6vh, 84px) 0 clamp(16px, 4vh, 36px);
  overflow: hidden;
  background: #fff7e1;
  background-size: cover;
  background-position: center top;
  background-attachment: fixed; /* 필요 없으면 주석 처리해도 됨 */
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: none;
  pointer-events: none;
}

.map-board {
  position: relative;
  width: min(92%, 980px);
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  padding: clamp(18px, 3vw, 28px);
  border-radius: 36px;
  background: #fffdf6;
  border: 1px solid rgba(250, 204, 21, 0.45);
  z-index: 0;
  margin-bottom: clamp(12px, 2vh, 24px);
}
.board-header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  color: #3b2600;
}
.board-header h2 {
  margin: 0;
  font-size: clamp(20px, 4vw, 28px);
  font-weight: 700;
}
.board-header p {
  margin: 0;
  font-size: clamp(12px, 2vw, 14px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(58, 32, 0, 0.6);
}
.board-body {
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 800 / 520;
  border-radius: 24px;
  border: 1px solid rgba(250, 204, 21, 0.35);
  overflow: hidden;
}
.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.map-land { fill: url(#map-land); stroke: rgba(64,108,55,.3); stroke-width: 8; stroke-linejoin: round; }
.map-shadow { fill: url(#map-shadow); }
.map-border { fill: none; stroke: rgba(38,72,39,.35); stroke-width: 10; stroke-linejoin: round; }
.map-trail { fill: none; stroke: #f6f2e8; stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 3px 6px rgba(0,0,0,.15)); }
.map-water { fill: url(#map-water); stroke: #4fa1c7; stroke-width: 3; opacity: 1; }
.map-water-highlight { fill: rgba(255,255,255,.28); stroke: none; filter: blur(.5px); }
.map-ornaments { fill: none; pointer-events: none; }
.map-pebble { fill: #d9cec0; stroke: rgba(64,49,32,.35); stroke-width: 2; }
.map-house-image { filter: drop-shadow(0 6px 12px rgba(0,0,0,.3)); }
.menu-point { cursor: pointer; }
.menu-logo { filter: drop-shadow(0 16px 28px rgba(0,0,0,.35)); transition: transform .2s ease, filter .2s ease; }
.menu-point:hover .menu-logo { transform: translateY(-4px); filter: drop-shadow(0 22px 32px rgba(0,0,0,.4)); }
.menu-point:focus-visible .menu-logo { transform: translateY(-4px) scale(1.02); filter: drop-shadow(0 24px 36px rgba(0,0,0,.45)); }

.legend {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #4a4339;
}
.legend li {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  border: 1px solid rgba(250, 204, 21, 0.22);
  backdrop-filter: blur(2px);
}
.legend-logo { width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,.2)); }
.legend--menus span:last-child { font-weight: 600; color: #a16207; }

.gateway {
  width: min(94%, 940px);
  margin: clamp(0px, 1vh, 10px) auto clamp(0px, 1vh, 10px);
  padding: 0 clamp(18px, 6vw, 32px);
  display: grid;
  gap: clamp(16px, 2.5vw, 24px);
}
.gateway-header { text-align: center; color: #7c2d12; }
.gateway-header h3 { margin: 0 0 8px; font-size: clamp(20px, 4vw, 26px); font-weight: 700; }
.gateway-header p { margin: 0; font-size: clamp(13px, 3vw, 15px); color: rgba(122, 45, 18, 0.7); }
.gateway-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: clamp(18px,3vw,26px); }
.gateway-card {
  position: relative; display: flex; flex-direction: column; gap: 22px;
  padding: clamp(22px, 4vw, 30px); border-radius: 24px; background: #fff;
  border: 1px solid rgba(250, 204, 21, 0.45);
  backdrop-filter: blur(8px); transform: translateY(0); transition: transform .22s ease, background .22s ease;
}
.gateway-card:hover { transform: translateY(-6px); background: #fffdf6; }
.gateway-card::after { content:''; position:absolute; inset:0; border-radius:24px; background: transparent; opacity:.16; pointer-events:none; }
.gateway-card--notice, .gateway-card--payment { --card-accent: transparent; }
.gateway-card h4 { margin: 0 0 12px; font-size: 18px; color:#7c2d12; }
.gateway-card p { margin:0; line-height:1.6; color:#a16207; font-size:14px; }
.card-btn {
  align-self:flex-start; padding:10px 18px; border-radius:999px; border:1px solid transparent; background:#fbbf24; color:#7c2d12;
  font-size:14px; font-weight:700; cursor:pointer; transition: transform .18s ease, background .18s ease, color .18s ease;
}
.card-btn:hover { transform: translateY(-2px); background:#fcd34d; color:#5c1b0a; }

.notice-banner {
  width: min(92%, 980px);
  margin: clamp(-48px, -6vh, -24px) auto clamp(10px, 2vh, 20px);
  border-radius: 999px;
  border: 1px solid rgba(250,204,21,.4);
  background: rgba(255,255,255,.8);
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  position: relative;
  z-index: 2;
}
.notice-banner:focus-visible {
  outline: none;
  transform: translateY(-1px);
}
.notice-banner:hover {
  transform: translateY(-2px);
}
.notice-banner__glass {
  display:flex; align-items:center; gap: clamp(8px,2vw,16px);
  padding: clamp(6px,2vw,10px) clamp(14px,3vw,22px);
  border-radius: 999px;
  background: rgba(255, 247, 231, 0.9);
  backdrop-filter: blur(10px);
  color:#a16207;
}
.notice-banner__label {
  display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px;
  background: rgba(251, 191, 36, 0.85); font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#4a1d05;
}
.notice-banner__marquee { position: relative; flex:1; overflow: hidden; height:20px; }
.notice-banner__track {
  display:inline-block; min-width:100%; white-space:nowrap; font-size:14px; font-weight:600; color: #7c2d12;
  padding-left:100%; animation: notice-marquee 18s linear infinite; will-change: transform;
}

@media (min-width: 1024px) {
  .hero { padding-top: clamp(72px, 9vh, 124px); }
  .notice-banner { margin: clamp(-32px, -4vh, -18px) auto clamp(14px, 2.2vh, 26px); }
  .map-board { margin-bottom: clamp(20px, 3vh, 36px); }
  .gateway { margin: clamp(16px, 2.6vh, 32px) auto 0; }
}

@keyframes notice-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@media (max-width: 820px) {
  /* ⬇️ 지도 섹션 아래 간격 축소 */
  .map-board { margin-bottom: clamp(16px, 3vh, 36px); }
  .notice-banner {
    width: min(96%, 860px);
    margin: 0 auto clamp(24px, 4vh, 36px);
  }
}

@media (max-width: 600px) {
  /* ⬇️ 과도한 하단 패딩 제거 */
  .hero { padding-bottom: clamp(16px, 4vh, 56px); }
  .map-board { gap: 14px; padding: 18px; border-radius: 26px; }
  .board-body { border-radius: 20px; }
  .info-panel { width: calc(100% - 32px); }
  .notice-banner__glass { flex-direction: column; align-items: stretch; text-align: center; gap: 6px; }
  .notice-banner__label { justify-content: center; width: 100%; }
  .notice-banner__marquee { width: 100%; }
}
</style>
