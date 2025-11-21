import { reactive } from "vue";
import { fetchWalletBalance } from "@/services/walletService";

export type GenderValue = "male" | "female" | "M" | "F" | "남성" | "여성" | "";

const state = reactive({
  nickname: "김예은",
  phone: "010-1234-5678",
  gender: "여성" as GenderValue,
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
