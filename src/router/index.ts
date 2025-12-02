import { createRouter, createWebHistory } from 'vue-router'

//page import
import UserLoginView from '@/views/UserLoginView.vue'
import UserRegisterView from '@/views/UserRegisterView.vue'
import FindAccountView from '@/views/FindAccountView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: UserLoginView, meta: { hideBottomNav: true } },
  { path: '/register', name: 'register', component: UserRegisterView, meta: { hideBottomNav: true } },
  {
    path: '/social-consent',
    name: 'social-consent',
    component: UserRegisterView,
    meta: { hideBottomNav: true },
  },
  {
    path: '/social-login-success',
    name: 'social-login-success',
    component: () => import('@/views/SocialLoginSuccessView.vue'),
    meta: { hideBottomNav: true },
  },
  { path: '/find-account', name: 'find-account', component: FindAccountView, meta: { hideBottomNav: true } },
  {
    path: '/create-room',
    name: 'create-room',
    component: () => import('@/views/CreateRoomView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/split-payment',
    name: 'split-payment',
    component: () => import('@/views/SplitPaymentView.vue'),
    meta: { requiresAuth: true, flushBottomNav: true, lockScroll: true },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/MainPageView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/find-room',
    name: 'find-room',
    component: () => import('@/views/FindRoomView.vue'),
    meta: { requiresAuth: true, lockScroll: true, flushBottomNav: true },
  },
  {
    path: '/my-rooms',
    name: 'my-rooms',
    component: () => import('@/views/MyRoomsView.vue'),
    meta: { requiresAuth: true, flushBottomNav: true },
  },
  {
    path: '/mypage',
    name: 'mypage',
    component: () => import('@/views/MyPageView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: "/mypage/settings",
    name: "ProfileSettings",
    component: () => import('@/views/ProfileSettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: "/mypage/history",
    name: "History",
    component: () => import('@/views/HistoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mypage/charge',
    name: 'wallet-charge',
    component: () => import('@/views/WalletChargeView.vue'),
    meta: { requiresAuth: true, lockScroll: true, flushBottomNav: true },
  },
  {
    path: '/notice',
    name: 'notice',
    component: () => import('@/views/NoticeListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/receipt-scan',
    name: 'receipt-scan',
    component: () => import('@/views/ReceiptScanView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notice/:id',
    name: 'notice-detail',
    component: () => import('@/views/NoticeDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ride-review',
    name: 'ride-review',
    component: () => import('@/views/RideReviewView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/seat-selection',
    name: 'seat-selection',
    component: () => import('@/views/SeatSelectionView.vue'),
    meta: { requiresAuth: true, lockScroll: true },
  },
  {
    path: '/rooms/:id',
    name: 'room-detail',
    component: () => import('@/views/RoomDetailView.vue'),
    meta: { requiresAuth: true, flushBottomNav: true },
  },
  {
    path: '/payment-methods',
    name: 'payment-methods',
    component: () => import('@/views/PaymentMethodsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login/kakao/callback',
    name: 'kakao-callback',
    component: () => import('@/views/KakaoCallbackView.vue'),
    meta: { hideBottomNav: true }
  },
  {
    path: '/login/google/callback',
    name: 'google-callback',
    component: () => import('@/views/GoogleCallbackView.vue'),
    meta: { hideBottomNav: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
