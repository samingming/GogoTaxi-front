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

const RECEIPT_AMOUNT_PATH =
  import.meta.env.VITE_WALLET_RECEIPT_OCR_PATH?.trim() || '/api/wallet/receipt/amount';

export type ReceiptAmountResponse = {
  amount?: number;
  currency?: string;
  reason?: string;
  rawText?: string;
};

export const extractAmountFromReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await apiClient.post<ReceiptAmountResponse>(RECEIPT_AMOUNT_PATH, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};
