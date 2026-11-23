export function conflictValue(value) {
  if (Array.isArray(value)) return value.map(item => Array.isArray(item) ? item.join('–') : String(item)).join(' · ');
  return value == null ? '미확인' : String(value);
}

export function conflictView(conflict) {
  const labels = {
    'kvl-asian26-bronze-sets': ['2026 아시아선수권 한국–호주 3위 결정전 세트별 점수', '공식 경기 페이지로 확인한 점수를 로드맵에 사용하며, 기존 자료와의 차이를 보존합니다.'],
    'avc-cup-2018-mislabeled-history-row': ['2018 AVC컵 대한민국 최종 순위', '잘못 연결된 2022년 결과를 분리하고, 2018년 공식 연차 보고서와 역대 순위표에 따라 8위로 정정했습니다.']
  };
  const [title, note] = labels[conflict.id] || [conflict.field || '기록 정정', '기존 값과 공식 확인 값을 함께 보존합니다.'];
  return { title, note, before: conflictValue(conflict.reportedExistingKvlValue), after: conflictValue(conflict.officialVerifiedValue) };
}
