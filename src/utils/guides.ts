export interface PageGuide {
  page: string
  title: string
  description: string
  tips: string[]
  examples: string[]
}

export const pageGuides: Record<string, PageGuide> = {
  '/': {
    page: '/',
    title: '가계부 목록',
    description: '모든 수입과 지출 내역을 확인하고 관리할 수 있습니다.',
    tips: [
      '필터를 사용하여 수입 또는 지출만 따로 볼 수 있습니다.',
      '날짜순 또는 금액순으로 정렬할 수 있습니다.',
      '각 항목의 작성자 정보를 확인할 수 있습니다.',
      '항목을 클릭하여 상세 정보를 확인하거나 삭제할 수 있습니다.',
    ],
    examples: [
      '오늘 지출한 항목만 보고 싶어',
      '이번 달 가장 큰 지출은 뭐야?',
      '식비 항목만 보여줘',
    ],
  },
  '/statistics': {
    page: '/statistics',
    title: '통계 분석',
    description: '수입과 지출을 카테고리별, 월별로 분석하여 시각적으로 확인할 수 있습니다.',
    tips: [
      '총 수입, 총 지출, 잔액을 한눈에 확인할 수 있습니다.',
      '카테고리별 지출 비율을 파이 차트로 확인할 수 있습니다.',
      '월별 수입과 지출 추이를 막대 그래프로 확인할 수 있습니다.',
      '차트를 클릭하면 상세 정보를 확인할 수 있습니다.',
    ],
    examples: [
      '이번 달 총 지출이 얼마야?',
      '어느 카테고리에 가장 많이 썼어?',
      '월별 수입 추이를 보여줘',
    ],
  },
  '/image': {
    page: '/image',
    title: '이미지 업로드',
    description: '영수증이나 가계부 이미지를 업로드하여 자동으로 데이터를 추출할 수 있습니다.',
    tips: [
      '이미지를 선택하면 미리보기를 확인할 수 있습니다.',
      '업로드 및 추출 버튼을 클릭하면 AI가 이미지를 분석합니다.',
      '여러 항목이 있는 영수증도 자동으로 인식합니다.',
      '이미지가 명확할수록 정확도가 높아집니다.',
    ],
    examples: [
      '이 영수증에서 가계부 항목을 추출해줘',
      '이미지에 있는 모든 항목을 추가해줘',
    ],
  },
  '/manual': {
    page: '/manual',
    title: '수동 입력',
    description: '가계부 항목을 직접 입력하여 추가할 수 있습니다.',
    tips: [
      '유형을 먼저 선택하면 해당 유형의 카테고리만 표시됩니다.',
      '날짜는 기본적으로 오늘 날짜로 설정됩니다.',
      '모든 필수 항목을 입력해야 저장할 수 있습니다.',
      '저장된 항목은 즉시 목록에 반영됩니다.',
    ],
    examples: [
      '오늘 커피 5000원 지출 추가해줘',
      '이번 달 급여 300만원 수입 추가',
    ],
  },
  '/recurring': {
    page: '/recurring',
    title: '고정비 관리',
    description: '반복되는 수입이나 지출을 자동으로 관리할 수 있습니다.',
    tips: [
      '고정비를 추가하면 설정한 주기에 따라 자동으로 항목이 생성됩니다.',
      '반복 유형(매일, 매주, 매월, 매년)을 선택할 수 있습니다.',
      '시작일과 만료일을 설정하여 기간을 제한할 수 있습니다.',
      '지금 처리하기 버튼으로 수동으로 처리할 수도 있습니다.',
    ],
    examples: [
      '매월 1일에 월세 50만원 자동 추가해줘',
      '매주 월요일에 교통비 5만원 추가',
      '활성화된 고정비 목록 보여줘',
    ],
  },
  '/invite': {
    page: '/invite',
    title: '구성원 초대',
    description: '가족 구성원을 초대하여 함께 가계부를 관리할 수 있습니다.',
    tips: [
      '초대 링크는 10분간 유효합니다.',
      '링크는 한 번만 사용할 수 있으며, 사용 후 즉시 만료됩니다.',
      '초대 링크를 복사하여 가족 구성원에게 공유하세요.',
      '초대받은 사용자는 회원가입 후 바로 사용할 수 있습니다.',
    ],
    examples: [
      '초대 링크 만들어줘',
      '초대 링크를 복사해줘',
    ],
  },
  '/profile': {
    page: '/profile',
    title: '프로필 설정',
    description: '닉네임과 프로필 이미지를 설정하여 개인화할 수 있습니다.',
    tips: [
      '닉네임을 설정하면 작성자 표시에 닉네임이 표시됩니다.',
      '프로필 이미지를 업로드하면 작성자 배지에 표시됩니다.',
      '이미지를 선택한 후 업로드 버튼을 클릭해야 저장됩니다.',
      '설정한 프로필은 모든 가계부 항목에 표시됩니다.',
    ],
    examples: [
      '닉네임을 변경하고 싶어',
      '프로필 이미지를 업로드하고 싶어',
    ],
  },
}

export function getGuideForPath(pathname: string): PageGuide | null {
  // 정확한 경로 매칭
  if (pageGuides[pathname]) {
    return pageGuides[pathname]
  }
  
  // 루트 경로 처리
  if (pathname === '' || pathname === '/') {
    return pageGuides['/']
  }
  
  return null
}

export function getContextForPath(pathname: string): string {
  const guide = getGuideForPath(pathname)
  if (!guide) {
    return '현재 페이지에 대한 정보가 없습니다.'
  }
  
  return `${guide.title}: ${guide.description}\n\n주요 기능:\n${guide.tips.map(tip => `- ${tip}`).join('\n')}\n\n예시 질문:\n${guide.examples.map(ex => `- ${ex}`).join('\n')}`
}
