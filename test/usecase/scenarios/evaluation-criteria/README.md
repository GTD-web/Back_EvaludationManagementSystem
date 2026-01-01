# WBS 평가기준 isAdditional 필드 E2E 테스트

## 📋 개요

이 테스트는 WBS 평가기준에 추가된 `isAdditional` 필드가 올바르게 저장되고 조회되는지 검증합니다.

## 🎯 테스트 목적

### 저장 기능
- `isAdditional: false`(기본값)로 WBS 평가기준 저장
- `isAdditional: true`로 추가 과제 평가기준 저장
- `isAdditional` 값 업데이트 (false → true, true → false)

### 조회 기능
- **사용자 할당 정보 조회**: `/admin/dashboard/:periodId/employees/:employeeId/assigned-data`
- **나의 할당 정보 조회**: `/user/dashboard/:periodId/my-assigned-data`
- **직원의 평가 현황 및 할당 데이터 통합 조회**: `/admin/dashboard/:periodId/employees/:employeeId/complete-status`
- **WBS 항목별 평가기준 조회**: `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId`
- **WBS 평가기준 상세 조회**: `/admin/evaluation-criteria/wbs-evaluation-criteria/:id`

### 권한별 저장 테스트
- Admin 권한으로 저장
- Evaluator 권한으로 저장
- User 권한으로 저장

## 📁 파일 구조

```
test/usecase/scenarios/evaluation-criteria/
├── wbs-evaluation-criteria-is-additional.e2e-spec.ts  # E2E 테스트
└── README.md                                           # 이 파일
```

## 🔧 사용하는 API 클라이언트

### WbsEvaluationCriteriaApiClient
- `upsertWbsEvaluationCriteria`: 기본 저장 (isAdditional 기본값 사용)
- `upsertWbsEvaluationCriteriaWithIsAdditional`: isAdditional 필드 포함 저장
- `getWbsItemEvaluationCriteria`: WBS 항목별 평가기준 조회
- `getWbsEvaluationCriteriaDetail`: 평가기준 상세 조회

### DashboardApiClient
- `getEmployeeAssignedData`: 사용자 할당 정보 조회
- `getMyAssignedData`: 나의 할당 정보 조회
- `getEmployeeCompleteStatus`: 직원의 평가 현황 및 할당 데이터 통합 조회

## 🧪 테스트 시나리오

### 1. WBS 평가기준 저장 (Upsert)

#### 1-1. 기본값으로 저장
```typescript
it('isAdditional: false로 WBS 평가기준을 저장한다', async () => {
  const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
    wbsItemId: wbsItemIds[0],
    criteria: '일반 과제 평가기준',
    importance: 8,
  });

  expect(result.isAdditional).toBe(false); // ✅ 기본값 false
});
```

#### 1-2. isAdditional: true로 저장
```typescript
it('isAdditional: true로 WBS 평가기준을 저장한다', async () => {
  const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: '추가 과제 평가기준',
    importance: 9,
    isAdditional: true,
  });

  expect(result.isAdditional).toBe(true); // ✅ true 값 저장
});
```

#### 1-3. 업데이트 (false → true)
```typescript
it('isAdditional 값을 업데이트한다 (false → true)', async () => {
  // 1단계: false로 저장
  const createResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: '업데이트 테스트',
    importance: 7,
    isAdditional: false,
  });

  // 2단계: true로 업데이트
  const updateResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: '업데이트 테스트',
    importance: 7,
    isAdditional: true,
  });

  expect(updateResult.id).toBe(createResult.id); // ✅ 같은 ID (업데이트)
  expect(updateResult.isAdditional).toBe(true); // ✅ true로 변경
});
```

### 2. 사용자 할당 정보 조회

```typescript
it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
  // 1단계: 일반 과제와 추가 과제 저장
  await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: '일반 과제 1',
    importance: 8,
    isAdditional: false,
  });

  await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: '추가 과제 1',
    importance: 9,
    isAdditional: true,
  });

  // 2단계: 사용자 할당 정보 조회
  const assignedData = await dashboardApiClient.getEmployeeAssignedData({
    periodId: evaluationPeriodId,
    employeeId: employeeIds[0],
  });

  // 3단계: 검증
  const wbsItem = assignedData.projects[0].wbsItems.find(
    (wbs: any) => wbs.wbsId === wbsItemIds[0],
  );

  const normalCriteria = wbsItem.criteria.find(
    (c: any) => c.criteria === '일반 과제 1',
  );
  expect(normalCriteria.isAdditional).toBe(false); // ✅ 일반 과제

  const additionalCriteria = wbsItem.criteria.find(
    (c: any) => c.criteria === '추가 과제 1',
  );
  expect(additionalCriteria.isAdditional).toBe(true); // ✅ 추가 과제
});
```

### 3. 나의 할당 정보 조회 (현재 로그인 사용자)

```typescript
it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
  // 평가기준 저장
  await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[1],
    criteria: '나의 일반 과제',
    importance: 7,
    isAdditional: false,
  });

  // 나의 할당 정보 조회
  const myAssignedData = await dashboardApiClient.getMyAssignedData(
    evaluationPeriodId,
  );

  // 검증
  // ... isAdditional 필드 확인
});
```

### 4. 직원의 평가 현황 및 할당 데이터 통합 조회

```typescript
it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
  // 평가기준 저장
  await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[2],
    criteria: '통합 조회 일반 과제',
    importance: 6,
    isAdditional: false,
  });

  // 직원의 평가 현황 및 할당 데이터 통합 조회
  const completeStatus = await dashboardApiClient.getEmployeeCompleteStatus({
    periodId: evaluationPeriodId,
    employeeId: employeeIds[0],
  });

  // 검증
  // ... isAdditional 필드 확인
});
```

### 5. WBS 평가기준 조회 API

#### 5-1. WBS 항목별 평가기준 조회
```typescript
it('WBS 항목별 평가기준 조회 시 isAdditional 필드를 반환한다', async () => {
  const savedCriteria = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: 'API 조회 테스트 과제',
    importance: 7,
    isAdditional: true,
  });

  const criteriaList = await wbsEvaluationCriteriaApiClient.getWbsItemEvaluationCriteria(
    wbsItemIds[0],
  );

  const targetCriteria = criteriaList.find(
    (c: any) => c.id === savedCriteria.id,
  );
  expect(targetCriteria.isAdditional).toBe(true); // ✅ isAdditional 반환
});
```

#### 5-2. WBS 평가기준 상세 조회
```typescript
it('WBS 평가기준 상세 조회 시 isAdditional 필드를 반환한다', async () => {
  const savedCriteria = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[1],
    criteria: '상세 조회 테스트 과제',
    importance: 5,
    isAdditional: false,
  });

  const criteriaDetail = await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaDetail(
    savedCriteria.id,
  );

  expect(criteriaDetail.isAdditional).toBe(false); // ✅ isAdditional 반환
});
```

### 6. 권한별 WBS 평가기준 저장 테스트

#### 6-1. Admin 권한
```typescript
it('Admin 권한으로 isAdditional 필드를 저장한다', async () => {
  const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional({
    wbsItemId: wbsItemIds[0],
    criteria: 'Admin 권한 테스트',
    importance: 8,
    isAdditional: true,
  });

  expect(result.isAdditional).toBe(true);
});
```

#### 6-2. Evaluator 권한
```typescript
it('Evaluator 권한으로 isAdditional 필드를 저장한다', async () => {
  const result = await testSuite
    .request()
    .post(`/evaluator/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemIds[1]}`)
    .send({
      criteria: 'Evaluator 권한 테스트',
      importance: 7,
      isAdditional: true,
    })
    .expect(200);

  expect(result.body.isAdditional).toBe(true);
});
```

#### 6-3. User 권한
```typescript
it('User 권한으로 isAdditional 필드를 저장한다', async () => {
  const result = await testSuite
    .request()
    .post(`/user/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemIds[2]}`)
    .send({
      criteria: 'User 권한 테스트',
      importance: 6,
      isAdditional: false,
    })
    .expect(200);

  expect(result.body.isAdditional).toBe(false);
});
```

## 🚀 테스트 실행 방법

### 전체 테스트 실행
```bash
npm run test:e2e -- test/usecase/scenarios/evaluation-criteria/wbs-evaluation-criteria-is-additional.e2e-spec.ts
```

### 특정 테스트 그룹 실행
```bash
# WBS 평가기준 저장 테스트만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-criteria/wbs-evaluation-criteria-is-additional.e2e-spec.ts -t "WBS 평가기준 저장"

# 사용자 할당 정보 조회 테스트만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-criteria/wbs-evaluation-criteria-is-additional.e2e-spec.ts -t "사용자 할당 정보 조회"

# 권한별 저장 테스트만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-criteria/wbs-evaluation-criteria-is-additional.e2e-spec.ts -t "권한별 WBS 평가기준 저장 테스트"
```

### 특정 테스트 케이스 실행
```bash
npm run test:e2e -- test/usecase/scenarios/evaluation-criteria/wbs-evaluation-criteria-is-additional.e2e-spec.ts -t "isAdditional: true로 WBS 평가기준을 저장한다"
```

## ✅ 검증 사항

### 저장 기능
- [ ] `isAdditional: false` 기본값 저장
- [ ] `isAdditional: true` 저장
- [ ] `isAdditional` 값 업데이트 (false → true)
- [ ] `isAdditional` 값 업데이트 (true → false)

### 조회 기능
- [ ] 사용자 할당 정보 조회에서 `isAdditional` 반환
- [ ] 나의 할당 정보 조회에서 `isAdditional` 반환
- [ ] 직원의 평가 현황 및 할당 데이터 통합 조회에서 `isAdditional` 반환
- [ ] WBS 항목별 평가기준 조회에서 `isAdditional` 반환
- [ ] WBS 평가기준 상세 조회에서 `isAdditional` 반환

### 권한별 저장
- [ ] Admin 권한으로 저장 가능
- [ ] Evaluator 권한으로 저장 가능
- [ ] User 권한으로 저장 가능

## 🔍 테스트 데이터 구조

### WBS 평가기준 응답 구조
```typescript
{
  id: string;
  wbsItemId: string;
  criteria: string;
  importance: number;
  subProject?: string | null;
  isAdditional: boolean; // ⭐ 추가된 필드
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

### 할당 정보 조회 응답 구조
```typescript
{
  projects: [
    {
      projectId: string;
      projectName: string;
      wbsItems: [
        {
          wbsId: string;
          wbsName: string;
          criteria: [
            {
              criterionId: string;
              criteria: string;
              importance: number;
              subProject?: string | null;
              isAdditional: boolean; // ⭐ 추가된 필드
              createdAt: Date;
            }
          ];
        }
      ];
    }
  ];
}
```

## 🐛 문제 해결

### 테스트 실패 시 확인 사항
1. **데이터베이스 마이그레이션 확인**
   ```bash
   npm run migration:run
   ```

2. **isAdditional 컬럼 존재 확인**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'wbs_evaluation_criteria' 
   AND column_name = 'isAdditional';
   ```

3. **시드 데이터 정상 생성 확인**
   - `beforeEach`에서 시드 데이터가 정상적으로 생성되었는지 확인
   - `employeeIds`, `wbsItemIds`, `evaluationPeriodId` 값 확인

4. **권한 설정 확인**
   - Admin, Evaluator, User 권한이 올바르게 설정되었는지 확인

## 📚 참고 문서

- [WBS 평가기준 관리 API](../../../src/interface/admin/evaluation-criteria/wbs-evaluation-criteria-management.controller.ts)
- [대시보드 API](../../../src/interface/admin/dashboard/dashboard.controller.ts)
- [WBS 평가기준 엔티티](../../../src/domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity.ts)
- [평가기준 관리 서비스](../../../src/context/evaluation-criteria-management-context/evaluation-criteria-management.service.ts)

---

**작성일**: 2024-12-23
**작성자**: AI Assistant
**버전**: 1.0.0

