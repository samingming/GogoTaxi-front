import apiClient from './apiClient'

export type ReceiptAnalysis = {
  totalAmount: number | null
  currency: string | null
  summary?: string
  items?: { label: string; amount: number | null }[]
  rawText?: string
  modelLatencyMs?: number
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}

export async function analyzeReceipt(file: File) {
  const base64 = await fileToBase64(file)
  const cleanBase64 = base64.includes(',') ? base64.split(',').pop() ?? base64 : base64
  try {
    const { data } = await apiClient.post<{ analysis: ReceiptAnalysis }>('/api/receipts/analyze', {
      imageBase64: cleanBase64,
      mimeType: file.type || 'image/png',
    })
    return data.analysis
  } catch (error) {
    const message =
      (error as any)?.response?.data?.message ??
      (error instanceof Error ? error.message : '영수증 분석에 실패했습니다.')
    throw new Error(message)
  }
}
