# GogoTaxi Frontend

GogoTaxi는 택시 동승자를 모집하고, 좌석 선택부터 호출 상태 공유, 요금 정산, 영수증 기반 결제 확인까지 처리하는 모바일 중심 택시 카풀 웹 애플리케이션입니다. 이 저장소는 Vue 3와 Vite로 구현된 프론트엔드 애플리케이션이며, 사용자 인증, 방 생성/참여, 실시간 방 상태 갱신, 지갑/정산, 영수증 스캔, 소셜 로그인 플로우를 담당합니다.

## 프로젝트 목표

- 택시 동승 모집 과정을 모바일 웹에서 빠르게 처리할 수 있는 사용자 경험 제공
- 출발지/도착지, 출발 시간, 좌석 수, 예상 요금을 기준으로 한 방 생성 및 탐색
- JWT 기반 인증 상태 유지와 토큰 갱신 처리
- Socket.IO 기반 실시간 방 상태 갱신
- Gemini Vision 기반 영수증 분석 결과를 정산 플로우에 연결
- Kakao/Google 소셜 로그인과 추가 동의 플로우 지원
- Vercel, GitHub Pages 환경에서 동작 가능한 SPA 라우팅 구성

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Vue 3 |
| Build Tool | Vite 7 |
| Language | TypeScript |
| Routing | Vue Router 4 |
| HTTP Client | Axios |
| Realtime | Socket.IO client CDN dynamic import |
| Map | Kakao Maps JavaScript SDK |
| Code Quality | ESLint 9, Prettier 3, vue-tsc |
| Deployment | Vercel, GitHub Pages |

## 주요 기능

### 인증 및 사용자 관리

- 일반 회원가입, 로그인, 아이디 중복 확인
- Kakao, Google 소셜 로그인 콜백 처리
- 소셜 로그인 신규 사용자에 대한 약관/개인정보 동의 플로우
- Access Token, Refresh Token을 `localStorage`에 저장하고 Axios interceptor에서 자동 주입
- 401 응답 발생 시 Refresh Token으로 Access Token 재발급 후 원 요청 재시도
- 인증이 필요한 라우트 접근 시 로그인 화면으로 리다이렉트
- 로그인 상태에서 `/login` 접근 시 홈 화면으로 리다이렉트

### 택시 방 생성 및 참여

- 출발지/도착지, 시간, 좌석 수, 우선순위, 예상 요금 기반 방 생성
- 방 목록 조회, 내 방 조회, 방 상세 조회
- 좌석 번호 기반 참여/퇴장 처리
- 백엔드 응답 구조가 달라져도 UI 모델로 흡수할 수 있도록 응답 정규화 계층 구성
- `/rooms/:id` 상세 화면에서 참여자, 택시 상태, 정산 정보를 통합 표시

### 실시간 상태 갱신

- Socket.IO를 CDN ESM 모듈로 동적 로딩해 번들 의존성을 줄임
- 방 상세 화면에서 `room:subscribe`, `room:unsubscribe` 이벤트로 개별 방 채널 구독
- `room:update`, `room:participants`, `rooms:refresh` 이벤트를 수신해 방 상태와 목록을 갱신
- 정산 완료, 방 상태 변경 등 서버 이벤트를 기반으로 지갑/알림 상태를 자동 갱신

### 호출 및 배차 상태 관리

- Uber deeplink 호출 요청
- 방 단위 ride state 조회 및 단계 업데이트
- 배차 스크린샷 분석 결과에서 기사명, 차량 번호, 차량 모델 추출
- 호출 단계 값을 프론트엔드 UI 상태(`pending`, `dispatching`, `accepted`, `approaching`, `onboard`, `completed`, `cancelled`)로 정규화

### 결제, 지갑, 정산

- 사용자 지갑 잔액 조회 및 충전
- 예상 요금 선차감, 실제 요금 확정, 추가 징수/환불 플로우 연동
- 영수증 이미지 업로드 후 총액을 분석하고 정산 확정 요청
- 정산 관련 POST 응답 이후 알림 피드와 사용자 잔액을 자동 새로고침

### 알림, 리뷰, 신고, 이용 내역

- 공지/알림 목록 및 상세 화면
- 탑승 완료 후 리뷰 작성 및 조회
- 문제 사용자 신고 작성 및 조회
- 정산 완료된 탑승 이력 조회

## 화면 구성

| Route | 화면 | 설명 |
| --- | --- | --- |
| `/login` | 로그인 | 일반/소셜 로그인 진입점 |
| `/register` | 회원가입 | 기본 회원정보 및 약관 동의 |
| `/social-consent` | 소셜 동의 | 소셜 신규 가입자의 필수 동의 처리 |
| `/social-login-success` | 소셜 로그인 성공 | 백엔드 OAuth 리다이렉트 결과 처리 |
| `/home` | 메인 | 핵심 메뉴와 서비스 진입 |
| `/create-room` | 방 생성 | 경로, 시간, 좌석, 요금 입력 |
| `/find-room` | 방 찾기 | 참여 가능한 방 검색 |
| `/my-rooms` | 내 방 | 내가 생성/참여한 방 목록 |
| `/rooms/:id` | 방 상세 | 참여자, 좌석, 배차, 정산 상태 |
| `/seat-selection` | 좌석 선택 | 동승 좌석 선택 |
| `/split-payment` | 분할 결제 | 요금 분담 및 정산 |
| `/receipt-scan` | 영수증 스캔 | 이미지 기반 요금 분석 |
| `/ride-review` | 리뷰 | 탑승 리뷰 작성 |
| `/mypage` | 마이페이지 | 사용자 정보, 지갑, 이력 진입 |
| `/mypage/settings` | 프로필 설정 | 프로필 수정 및 비밀번호 변경 |
| `/mypage/history` | 이용 내역 | 정산 완료 탑승 기록 |
| `/mypage/charge` | 지갑 충전 | 충전 및 잔액 확인 |
| `/payment-methods` | 결제수단 | 결제수단 관리 화면 |
| `/notice` | 공지 목록 | 공지/알림 리스트 |
| `/notice/:id` | 공지 상세 | 공지 상세 내용 |

## 디렉터리 구조

```text
src/
  api/                 백엔드 API 호출 함수
  assets/              전역 CSS, 이미지, 아이콘 리소스
  components/          공통 UI 컴포넌트
  composables/         Vue Composition API 기반 재사용 로직
  data/                목 데이터 및 정적 데이터
  router/              Vue Router 라우트 및 인증 가드
  services/            외부 SDK, HTTP, 소켓, 도메인 서비스
  stores/              localStorage 기반 사용자/알림 상태 관리
  types/               공통 타입 정의
  utils/               OAuth, Kakao Maps 유틸리티
  views/               라우트 단위 페이지 컴포넌트
```

## 아키텍처 포인트

### API Client 이원화

프로젝트에는 기존 호환성을 위한 `src/services/http.ts`, `src/api/client.ts` 계열과 인증/갱신 로직이 강화된 `src/services/apiClient.ts`가 함께 존재합니다. 핵심 인증 API와 정산/영수증/호출 관련 기능은 토큰 자동 주입, Refresh Token 재발급, 후속 상태 갱신이 포함된 `apiClient`를 사용합니다.

### 응답 정규화 계층

방 관련 API는 `src/api/rooms.ts`에서 백엔드 응답을 `RoomPreview`, `RoomParticipant` 등 프론트엔드 UI 모델로 정규화합니다. `rooms`, `data`, `result`, `items`, `content` 같은 다양한 래핑 구조와 `seatNumber`, `seat_no`, `seatNo` 같은 필드 변형을 흡수하도록 설계되어 API 변경에 대한 UI 결합도를 낮춥니다.

### 인증 가드

`src/router/index.ts`에서 `requiresAuth`, `hideBottomNav`, `lockScroll`, `flushBottomNav` 같은 route meta를 정의합니다. 인증 여부는 Access/Refresh Token과 저장된 사용자 프로필을 함께 확인해 토큰만 남아 있는 불완전한 상태를 방지합니다.

### 실시간 통신

`src/services/socketLoader.ts`는 `https://cdn.socket.io/4.8.1/socket.io.esm.min.js`를 동적으로 import합니다. 이를 통해 패키지 설치 없이 Socket.IO client를 로드하고, `src/services/roomSocket.ts`에서 방 단위 구독/해제 및 이벤트 핸들러를 캡슐화합니다.

### 외부 SDK 로딩

Kakao Maps와 Kakao Login은 서비스/유틸 계층에서 SDK 로딩을 분리해 페이지 컴포넌트가 외부 스크립트 로딩 방식에 직접 의존하지 않도록 구성했습니다.

## 환경 변수

루트에 `.env` 또는 배포 환경 변수를 설정합니다.

| 변수 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 서버 주소 | `http://localhost:8080` |
| `VITE_API_URL` | `VITE_API_BASE_URL` 대체 변수 | `http://localhost:8080` |
| `VITE_SOCKET_URL` | Socket.IO 서버 주소. 미설정 시 API base URL 사용 | `http://localhost:8080` |
| `VITE_KAKAO_JS_KEY` | Kakao JavaScript SDK 키 | `xxxxxxxx` |
| `VITE_KAKAO_REST_API_KEY` | Kakao REST API 키 | `xxxxxxxx` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `VITE_UBER_CLIENT_ID` | Uber deeplink/client 연동용 ID | `xxxxxxxx` |
| `VITE_ROOMS_PATH` | 방 목록 API 경로 override | `/api/rooms` |
| `VITE_MY_ROOMS_PATH` | 내 방 API 경로 override | `/api/rooms/mine` |
| `VITE_ROOM_DETAIL_PATH` | 방 상세 API 경로 override | `/api/rooms` |
| `VITE_ROOM_JOIN_PATH` | 방 참여 API 경로 override | `/api/rooms/:id/join` |
| `VITE_ROOM_LEAVE_PATH` | 방 퇴장 API 경로 override | `/api/rooms/:id/leave` |
| `VITE_RIDE_REQUEST_PATH` | 호출 요청 API 경로 override | `/api/rooms/:id/ride/request` |
| `VITE_RIDE_STAGE_PATH` | 호출 단계 변경 API 경로 override | `/api/rooms/:id/ride/stage` |
| `VITE_RIDE_STATE_PATH` | 호출 상태 조회 API 경로 override | `/api/rooms/:id/ride-state` |
| `VITE_RIDE_DISPATCH_INFO_PATH` | 배차 정보 분석 API 경로 override | `/api/rooms/:id/ride/dispatch-info` |

## 실행 방법

### 1. 의존성 설치

```sh
npm install
```

### 2. 개발 서버 실행

```sh
npm run dev
```

기본 Vite 개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 3. 타입 체크

```sh
npm run type-check
```

### 4. 린트

```sh
npm run lint
```

### 5. 프로덕션 빌드

```sh
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다. 빌드 스크립트는 SPA 새로고침 대응을 위해 `dist/index.html`을 `dist/404.html`로 복사합니다.

### 6. 빌드 결과 미리보기

```sh
npm run preview
```

## 배포

### Vercel

`vercel.json`에서 모든 요청을 `/`로 rewrite하도록 설정해 Vue Router history mode 새로고침 문제를 해결합니다.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### GitHub Pages

`vite.config.ts`는 Vercel 환경이 아닐 때 base path를 `/GogoTaxi-front/`로 설정합니다.

```ts
base: process.env.VERCEL ? '/' : '/GogoTaxi-front/'
```

배포 명령은 다음과 같습니다.

```sh
npm run deploy
```

## 백엔드 연동 전 확인 사항

- 백엔드 서버가 실행 중인지 확인합니다.
- `VITE_API_BASE_URL`이 `/api`를 포함하지 않는 base URL인지 확인합니다. `apiClient`는 `/api` suffix가 들어온 경우 한 번 정규화합니다.
- 인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더가 자동으로 붙습니다.
- Socket.IO 기능을 사용하려면 `VITE_SOCKET_URL` 또는 `VITE_API_BASE_URL`이 실제 백엔드 서버를 가리켜야 합니다.
- Kakao Maps를 사용하는 화면은 Kakao JavaScript 키와 허용 도메인 설정이 필요합니다.

## 포트폴리오 기술 포인트

- Vue Router meta 기반 인증/레이아웃 제어
- Axios interceptor를 활용한 Access Token 자동 주입 및 Refresh Token 재발급
- 응답 정규화 계층으로 API 스키마 변경에 강한 UI 모델 구성
- Socket.IO 이벤트 구독을 서비스 함수로 캡슐화해 화면 컴포넌트 복잡도 감소
- 영수증 이미지 분석, 호출 상태, 정산 결과를 하나의 사용자 플로우로 연결
- 외부 SDK(Kakao Maps, Kakao Login, Socket.IO CDN)를 지연 로딩해 초기 번들 부담 완화
- Vercel/GitHub Pages 모두 고려한 SPA 라우팅 및 base path 설정
