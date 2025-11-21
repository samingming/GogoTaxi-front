import apiClient from './apiClient';

export interface WalletBalanceResponse {
  balance: number;
}

export interface WalletTopupResponse {
  transaction: {
    id: string;
    userId: string;
    roomId: string | null;
    amount: number;
    currency: string;
    kind: string;
    status: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
}

export const fetchWalletBalance = async () => {
  const { data } = await apiClient.get<WalletBalanceResponse>('/api/wallet/balance');
  return data.balance;
};

export const topupWallet = async (amount: number) => {
  const { data } = await apiClient.post<WalletTopupResponse>('/api/wallet/topup', { amount });
  return data;
};
