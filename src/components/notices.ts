export type NoticeType = 'update' | 'info' | 'maintenance'

export interface Notice {
  id: string
  title: string
  summary: string
  content: string[]
  date: string
  type: NoticeType
}

export const notices: Notice[] = [
  {
    id: 'launch-202407',
    title: '꼬꼬택 정식 론칭 안내',
    summary: '모든 준비를 마치고 꼬꼬택이 드디어 정식 오픈합니다.',
    content: [
      '안녕하세요, 꼬꼬택 팀입니다. 기다려 주신 정식 서비스 소식을 전해 드립니다.',
      '2025년 12월 1일부터 꼬꼬택이 정식으로 론칭합니다. 방 만들기, 방 찾기, 나의 방 관리 등 주요 기능을 언제든 이용하실 수 있어요.',
      '앞으로도 안정적인 서비스와 즐거운 이동 경험을 위해 꾸준히 업데이트하겠습니다. 많은 관심과 이용 부탁드려요.',
    ],
    date: '2025-12-01',
    type: 'update',
  },
  {
    id: 'maintenance-202407',
    title: '11월 정기 점검 안내',
    summary: '안정적인 서비스를 위해 11월 5일 새벽에 시스템 점검이 진행됩니다.',
    content: [
      '11월 5일(수) 02:00부터 04:00까지 서버 점검이 진행됩니다.',
      '점검 시간 동안 일부 기능 이용이 제한될 수 있으니 이용에 참고해 주세요. 더 나은 서비스를 위해 최선을 다하겠습니다.',
    ],
    date: '2025-11-05',
    type: 'maintenance',
  },
]
