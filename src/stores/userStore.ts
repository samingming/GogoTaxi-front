import { reactive } from "vue";
import { fetchWalletBalance } from "@/services/walletService";

export type GenderValue = "male" | "female" | "M" | "F" | "남성" | "여성" | "";

const state = reactive({
  nickname: "",
  phone: "",
  gender: "" as GenderValue,
  balance: 0,
  isBalanceLoaded: false,
});

export const useUserStore = () => state;

export const setUserBalance = (balance: number) => {
  state.balance = balance;
  state.isBalanceLoaded = true;
};

export const addUserBalance = (amount: number) => {
  state.balance = Math.max(0, state.balance + amount);
  state.isBalanceLoaded = true;
};

export const refreshUserBalance = async () => {
  const hasToken =
    typeof window !== "undefined" &&
    (localStorage.getItem("gogotaxi_access_token") ||
      localStorage.getItem("gogotaxi_token") ||
      localStorage.getItem("auth_token"));
  if (!hasToken) {
    // 로그인 전에는 잔액을 불러오지 않음
    state.isBalanceLoaded = false;
    return 0;
  }
  try {
    const balance = await fetchWalletBalance();
    state.balance = balance;
    state.isBalanceLoaded = true;
    return balance;
  } catch (error) {
    console.error("Failed to refresh wallet balance", error);
    state.isBalanceLoaded = false;
    throw error;
  }
};
