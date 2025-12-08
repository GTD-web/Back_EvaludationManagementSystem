# 평가기간 복사 기능 테스트 가이드

## 기능 개요

평가기간 생성 시 `sourcePeriodId` 필드에 기존 평가기간 ID를 입력하면, 해당 평가기간의 **평가항목(WBS 평가 기준)**과 **평가라인(평가자-피평가자 매핑)**이 자동으로 복사됩니다.

## 복사되는 항목

### ✅ 복사됨
- **평가라인 매핑**: 평가자-피평가자-WBS 관계 (EvaluationLineMapping)
- **WBS 평가 기준**: 각 WBS의 평가 기준과 중요도 (WbsEvaluationCriteria)

### ❌ 복사되지 않음
- 평가 결과 (자기평가, 하향평가, 동료평가, 최종평가)
- 평가 제출 상태
- 날짜 정보 (새 평가기간의 날짜 사용)

## API 엔드포인트

### 1. 평가기간 생성 (복사 포함)

```http
POST /admin/evaluation-periods
Content-Type: application/json

{
  "name": "2025년 상반기 평가",
  "startDate": "2025-01-01",
  "peerEvaluationDeadline": "2025-06-30",
  "description": "2025년 상반기 직원 평가",
  "maxSelfEvaluationRate": 120,
  "sourcePeriodId": "ed9b3d74-b0a0-41ba-8205-10ebfa79513b"  // ← 복사할 원본 평가기간 ID
}
```

**응답 (201 Created)**:
```json
{
  "id": "새로운-평가기간-ID",
  "name": "2025년 상반기 평가",
  "status": "waiting",
  "currentPhase": "waiting",
  ...
}
```

### 2. 복제용 데이터 조회 (참고용)

```http
GET /admin/evaluation-periods/:id/for-copy
```

**응답 (200 OK)**:
```json
{
  "evaluationPeriod": {
    "id": "...",
    "name": "...",
    "description": "...",
    "gradeRanges": [...],
    ...
  },
  "evaluationCriteria": [
    {
      "id": "...",
      "wbsItemId": "...",
      "criteria": "업무 완성도 및 품질",
      "importance": 5
    }
  ],
  "evaluationLines": {
    "lines": [
      {
        "id": "...",
        "evaluatorType": "PRIMARY",
        "order": 1,
        "isRequired": true
      }
    ],
    "mappings": [
      {
        "id": "...",
        "evaluationPeriodId": "...",
        "evaluationLineId": "...",
        "employeeId": "...",
        "evaluatorId": "...",
        "wbsItemId": "..."
      }
    ]
  }
}
```

## 수동 테스트 절차

### 1단계: 원본 평가기간 준비

```bash
# 1. 원본 평가기간 생성
curl -X POST http://localhost:3000/admin/evaluation-periods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "원본 평가기간",
    "startDate": "2024-12-01",
    "peerEvaluationDeadline": "2024-12-31"
  }'

# 응답에서 ID 저장: SOURCE_PERIOD_ID=...
```

### 2단계: 평가대상자 등록

```bash
# 2. 평가기간에 평가대상자 등록
curl -X POST http://localhost:3000/admin/evaluation-periods/${SOURCE_PERIOD_ID}/targets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeIds": ["EMPLOYEE_ID_1", "EMPLOYEE_ID_2"]
  }'
```

### 3단계: 1차 평가자 구성

```bash
# 3. 1차 평가자 구성
curl -X POST "http://localhost:3000/admin/evaluation-criteria/evaluation-lines/employee/${EMPLOYEE_ID_2}/period/${SOURCE_PERIOD_ID}/primary-evaluator" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "evaluatorId": "EMPLOYEE_ID_1"
  }'
```

### 4단계: WBS 평가 기준 추가

```bash
# 4. WBS에 평가 기준 추가
curl -X POST "http://localhost:3000/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${WBS_ITEM_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "criteria": "업무 완성도 및 품질",
    "importance": 5
  }'
```

### 5단계: 복사하여 새 평가기간 생성

```bash
# 5. sourcePeriodId를 포함하여 새 평가기간 생성
curl -X POST http://localhost:3000/admin/evaluation-periods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "복사된 평가기간",
    "startDate": "2025-01-01",
    "peerEvaluationDeadline": "2025-06-30",
    "sourcePeriodId": "'"${SOURCE_PERIOD_ID}"'"
  }'

# 응답에서 ID 저장: TARGET_PERIOD_ID=...
```

### 6단계: 복사 결과 확인

```bash
# 6-1. 원본 평가기간의 평가설정 조회
curl "http://localhost:3000/admin/evaluation-criteria/evaluation-lines/employee/${EMPLOYEE_ID_2}/period/${SOURCE_PERIOD_ID}/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6-2. 새 평가기간의 평가설정 조회 (같은 평가자가 있어야 함)
curl "http://localhost:3000/admin/evaluation-criteria/evaluation-lines/employee/${EMPLOYEE_ID_2}/period/${TARGET_PERIOD_ID}/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6-3. WBS 평가 기준 확인 (개수가 2배가 되어야 함)
curl "http://localhost:3000/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${WBS_ITEM_ID}" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6-4. 복제용 데이터 조회 API
curl "http://localhost:3000/admin/evaluation-periods/${SOURCE_PERIOD_ID}/for-copy" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 검증 포인트

### 평가라인 매핑 검증
- [ ] 원본 평가기간의 1차 평가자가 새 평가기간에도 동일하게 설정됨
- [ ] 원본 평가기간의 2차 평가자가 새 평가기간에도 동일하게 설정됨 (있는 경우)
- [ ] 평가자-피평가자-WBS 관계가 정확히 복사됨

### WBS 평가 기준 검증
- [ ] 원본 WBS의 평가 기준이 새 평가기간에도 복사됨
- [ ] 평가 기준 내용(criteria)과 중요도(importance)가 동일함
- [ ] 복사본은 새로운 ID를 가짐 (원본 ID와 다름)
- [ ] WBS는 공유되므로, 같은 WBS ID에 평가 기준이 추가됨

### 복제용 데이터 조회 검증
- [ ] `evaluationPeriod` 객체에 기본 정보가 포함됨
- [ ] `evaluationCriteria` 배열에 WBS 평가 기준 목록이 포함됨
- [ ] `evaluationLines.lines` 배열에 평가라인 정보가 포함됨
- [ ] `evaluationLines.mappings` 배열에 평가라인 매핑 정보가 포함됨

## E2E 테스트 실행

```bash
# 전체 테스트 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy/evaluation-period-copy.e2e-spec.ts

# 특정 테스트만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy/evaluation-period-copy.e2e-spec.ts -t "1단계"
```

## 예상 결과

### 성공 시
```
✅ 원본 평가기간 생성 완료: ed9b3d74-...
✅ 1차 평가자 구성 완료: 평가자=..., 피평가자=...
✅ WBS 평가 기준 추가 완료: WBS=..., 기준="업무 완성도 및 품질"
✅ 새 평가기간 생성 완료 (복사): a1b2c3d4-...
✅ 평가라인 매핑 복사 확인: 1차 평가자=홍길동
✅ WBS 평가 기준 복사 확인: "업무 완성도 및 품질" (importance: 5)
   총 평가 기준 개수: 1개 → 2개
✅ 복제용 데이터 조회 완료: 평가항목 2개, 평가라인 매핑 1개
```

## 트러블슈팅

### 문제: 평가라인이 복사되지 않음
- **원인**: 원본 평가기간에 평가라인 매핑이 없음
- **해결**: 1차/2차 평가자를 먼저 구성한 후 복사

### 문제: WBS 평가 기준이 복사되지 않음
- **원인**: 원본 평가기간의 평가라인 매핑에 WBS가 포함되지 않음
- **해결**: WBS 할당 및 평가 기준을 먼저 설정한 후 복사

### 문제: 중복 데이터 생성
- **원인**: WBS는 공유되므로, 복사하면 평가 기준이 추가됨
- **참고**: 이것은 정상 동작입니다. WBS 평가 기준은 중복 생성됩니다.

