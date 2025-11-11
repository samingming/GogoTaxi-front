export type SectionId = 'credit-card' | 'kakao-pay'

export type PaymentMethod = {
  id: string
  label: string
  description?: string
  brand?: string
  iconText: string
  removable?: boolean
}

export type PaymentSection = {
  id: SectionId
  title: string
  description?: string
  items: PaymentMethod[]
  addLabel: string
  addHint?: string
  manageLabel?: string
  emptyLabel?: string
}

const baseSections: PaymentSection[] = [
  {
    id: 'credit-card',
    title: '신용/체크카드',
    items: [
      {
        id: 'shinhan-card',
        label: '신한 THE LADY 카드 (5123)',
        description: '최근 이용 2025.10.12',
        brand: 'card',
        iconText: 'SH',
        removable: true,
      },
      {
        id: 'kb-signature',
        label: 'KB 국민 SIGNATURE (8844)',
        description: '최근 이용 2025.11.04',
        brand: 'kb',
        iconText: 'KB',
        removable: true,
      },
    ],
    addLabel: '추가',
    emptyLabel: '등록된 카드가 없습니다.',
  },
  {
    id: 'kakao-pay',
    title: '카카오페이',
    items: [
      { id: 'toss', label: '토스카드 플래티넘', brand: 'card', iconText: 'TP' },
      { id: 'kb', label: 'KB국민 nori 체크카드(RF)', brand: 'kb', iconText: 'KB' },
      { id: 'money', label: '카카오페이머니카드', brand: 'kakao', iconText: 'KP' },
    ],
    addLabel: '추가',
    manageLabel: '카카오페이 관리',
  },
]

function deepCloneSections(sections: PaymentSection[]): PaymentSection[] {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({ ...item })),
  }))
}

export function createPaymentSections(): PaymentSection[] {
  return deepCloneSections(baseSections)
}

export function getUserPaymentMethods(sectionId: SectionId = 'credit-card'): PaymentMethod[] {
  const section = baseSections.find(entry => entry.id === sectionId)
  return section ? section.items.map(item => ({ ...item })) : []
}

