// 기능명세서_최종본.md 3.2절 / API명세서.md 4.1절: 고정 5종 카테고리, 고정 3종 보관위치
export const CATEGORIES = ["유제품", "채소", "과일", "육류", "기타"];

// 카테고리별 대표 이모지 (명세서에 없어 화면 표시용으로 새로 정함, 아래 값만 고치면 전체 반영됨)
export const CATEGORY_EMOJI = {
  유제품: "🥛",
  채소: "🥬",
  과일: "🍎",
  육류: "🥩",
  기타: "🍱",
};

export const STORAGE_LOCATIONS = ["냉장", "냉동", "실온"];

export const FOOD_STATUS = {
  KEEPING: "보관중",
  RESCUED: "구조",
  DISCARDED: "폐기",
};

export const SORT_OPTIONS = [
  { value: "expiry_asc", label: "유통기한 임박순" },
  { value: "created_desc", label: "최근 등록순" },
  { value: "name_asc", label: "이름순" },
];

export const NOTIFICATION_FILTERS = [
  { value: "all", label: "전체" },
  { value: "today", label: "오늘 만료" },
  { value: "within_3_days", label: "3일 이내 임박" },
  { value: "expired", label: "이미 지난 음식" },
];

export const STATS_PERIODS = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

// 기능명세서 2.4절: 등록 전 체크 항목 문구.
// 필수 체크 여부는 4.2절 열린 이슈로 명시되어 있어, 음식 등록 화면 구현 시 별도로 확인 후 반영한다.
export const PRE_SUBMIT_CHECKS = [
  "정확한 유통기한을 확인했어요",
  "보관 위치를 미리 정했어요",
  "수량과 상태를 올바르게 입력했어요",
];

// 기능명세서 3.5절: 보관 꿀팁 10개 문구 풀 (서버가 랜덤 1개를 내려주지만, 네트워크 실패 시 폴백용으로 보관)
export const MEMO_MAX_LENGTH = 100; // 기능명세서 2.4절: "길이 제한(예: 100자) 권장"
