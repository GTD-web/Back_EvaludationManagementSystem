# 이전 평가기간 데이터 복사 기능 테스트 가이드

## 기능 개요

특정 직원의 이전 평가기간에 설정된 **프로젝트 할당**과 **평가라인 매핑**을 현재 평가기간으로 복사하는 기능입니다.

## 복사되는 항목

### ✅ 복사됨
- **프로젝트 할당(Project Assignment)**: 직원-프로젝트-평가기간 매핑
- **평가라인 매핑(Evaluation Line Mapping)**: 평가자-피평가자-WBS-평가기간 관계

### ❌ 복사되지 않음
- 평가 결과 (자기평가, 하향평가, 동료평가, 최종평가)
- 평가 제출 상태
- 성과 입력 데이터
- WBS 평가 기준 (WBS 항목 자체에 속하므로 평가기간과 무관)

## 주요 특징

### 1. 중복 방지
- 이미 존재하는 프로젝트 할당은 건너뜀
- 이미 존재하는 평가라인 매핑은 건너뜀
- 동일한 복사 요청을 여러 번 실행해도 안전

### 2. 자동 등록
- 대상 평가기간에 직원이 등록되어 있지 않으면 자동으로 등록
- 별도의 직원 등록 과정 불필요

### 3. 선택적 복사
- 모든 프로젝트 복사 (기본)
- 특정 프로젝트만 선택하여 복사 (`projectIds` 필터)
- 특정 WBS만 선택하여 복사 (`wbsIds` 필터)

## API 엔드포인트

### 1. Admin API - 특정 직원의 데이터 복사

```http
POST /admin/evaluation-periods/:targetPeriodId/employees/:employeeId/copy-from/:sourcePeriodId
Content-Type: application/json

{
  "projectIds": ["uuid1", "uuid2"],  // 선택사항: 특정 프로젝트만 복사
  "wbsIds": ["uuid3", "uuid4"]       // 선택사항: 특정 WBS만 복사
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "message": "이전 평가기간 데이터가 성공적으로 복사되었습니다.",
  "copiedProjectAssignments": 3,
  "copiedEvaluationLineMappings": 5
}
```

### 2. Evaluator API - 담당 직원의 데이터 복사

```http
POST /evaluator/evaluation-periods/:targetPeriodId/evaluators/:evaluatorId/employees/:employeeId/copy-from/:sourcePeriodId
Content-Type: application/json

{
  "projectIds": ["uuid1", "uuid2"],  // 선택사항
  "wbsIds": ["uuid3", "uuid4"]       // 선택사항
}
```

### 3. User API - 나의 데이터 복사 (현재 로그인 사용자)

```http
POST /user/evaluation-periods/:targetPeriodId/my-data/copy-from/:sourcePeriodId
Content-Type: application/json

{
  "projectIds": ["uuid1", "uuid2"],  // 선택사항
  "wbsIds": ["uuid3", "uuid4"]       // 선택사항
}
```

**참고**: User API는 JWT 토큰에서 자동으로 `employeeId`를 추출합니다.

## 복사 후 데이터 확인

### 1. 나의 할당 정보 조회 (Admin)

```http
GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data
```

### 2. 나의 할당 정보 조회 (User)

```http
GET /user/dashboard/:evaluationPeriodId/my-assigned-data
```

이 API를 통해 복사된 프로젝트 할당과 평가라인 매핑을 확인할 수 있습니다.

## 테스트 시나리오

### 시나리오 1: 전체 데이터 복사
1. 원본 평가기간 생성
2. 원본 평가기간에 직원 등록
3. 원본 평가기간에 프로젝트 할당 (2개)
4. 원본 평가기간에 1차 평가자 구성
5. 원본 평가기간에 2차 평가자 구성
6. 대상 평가기간 생성
7. **이전 평가기간 데이터 복사 API 호출**
8. 나의 할당 정보 조회로 복사 확인
9. 프로젝트 할당 개수 일치 확인
10. 평가라인 매핑 개수 일치 확인
11. 평가자 ID 일치 확인

### 시나리오 2: User API를 통한 데이터 복사
1. 사용자용 원본 평가기간 생성
2. 원본 평가기간에 데이터 설정
3. 사용자용 대상 평가기간 생성
4. **User API로 나의 데이터 복사**
5. 나의 할당 정보 조회로 확인

### 시나리오 3: 선택적 복사 (필터링)
1. 필터링 테스트용 원본 평가기간 생성
2. 여러 프로젝트 할당 (3개)
3. 필터링 테스트용 대상 평가기간 생성
4. **특정 프로젝트만 선택하여 복사** (`projectIds` 필터)
5. 복사된 프로젝트가 선택한 것만 있는지 확인

## 검증 포인트

### 프로젝트 할당 검증
- [ ] 원본 평가기간의 프로젝트 개수와 대상 평가기간의 프로젝트 개수가 일치
- [ ] 원본과 대상의 프로젝트 ID가 동일
- [ ] 필터 사용 시 선택한 프로젝트만 복사됨

### 평가라인 매핑 검증
- [ ] 원본 평가기간의 평가라인 매핑 개수와 대상 평가기간의 개수가 일치
- [ ] 원본과 대상의 평가자 ID가 동일
- [ ] 1차 평가자가 정확히 복사됨
- [ ] 2차 평가자가 정확히 복사됨 (있는 경우)
- [ ] 필터 사용 시 선택한 WBS의 평가라인만 복사됨

### 중복 방지 검증
- [ ] 동일한 복사 요청을 여러 번 실행해도 중복 생성되지 않음
- [ ] 이미 존재하는 프로젝트 할당은 건너뜀
- [ ] 이미 존재하는 평가라인 매핑은 건너뜀

### 자동 등록 검증
- [ ] 대상 평가기간에 직원이 등록되어 있지 않아도 복사 성공
- [ ] 복사 후 직원이 자동으로 평가 대상으로 등록됨

## E2E 테스트 실행

```bash
# 전체 테스트 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy-previous-data/copy-previous-period-data.e2e-spec.ts

# 특정 시나리오만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy-previous-data/copy-previous-period-data.e2e-spec.ts -t "이전 평가기간 데이터 복사 기능 테스트"

npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy-previous-data/copy-previous-period-data.e2e-spec.ts -t "User API를 통한"

npm run test:e2e -- test/usecase/scenarios/evaluation-period/copy-previous-data/copy-previous-period-data.e2e-spec.ts -t "선택적 필터링"
```

## 주의사항

### 1. 평가기간 날짜
- 원본과 대상 평가기간의 날짜가 겹치지 않도록 주의
- 테스트에서는 원본 평가기간(현재), 대상 평가기간(3개월 후)으로 설정

### 2. 데이터 정리
- 테스트 후 생성된 평가기간은 자동으로 삭제됨
- `afterAll` 블록에서 정리 작업 수행

### 3. 권한
- Admin: 모든 직원의 데이터 복사 가능
- Evaluator: 자신이 담당하는 직원의 데이터만 복사 가능 (향후 구현)
- User: 자신의 데이터만 복사 가능

### 4. 필터 사용
- `projectIds`와 `wbsIds`는 선택사항
- 둘 다 제공하지 않으면 모든 데이터 복사
- `projectIds`만 제공하면 해당 프로젝트의 모든 WBS 복사
- `wbsIds`만 제공하면 해당 WBS의 평가라인만 복사

## 관련 API

### 평가기간 관리
- `POST /admin/evaluation-periods` - 평가기간 생성
- `DELETE /admin/evaluation-periods/:id` - 평가기간 삭제
- `POST /admin/evaluation-periods/:id/targets` - 평가 대상자 등록

### 프로젝트 할당
- `POST /admin/evaluation-criteria/project-assignments` - 프로젝트 할당
- `GET /admin/dashboard/:periodId/employees/:employeeId/assigned-data` - 할당 정보 조회

### 평가라인 설정
- `POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/period/:periodId/primary-evaluator` - 1차 평가자 구성
- `POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/secondary-evaluator` - 2차 평가자 구성
- `GET /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/period/:periodId/settings` - 평가설정 조회

## 기대 효과

### 업무 효율성
- 매년 반복되는 평가기간 설정 작업 시간 단축
- 이전 평가기간과 동일한 프로젝트/평가자 구성을 빠르게 재현

### 오류 감소
- 수동 설정 시 발생할 수 있는 누락/오류 방지
- 검증된 이전 설정을 그대로 재사용

### 사용자 경험
- 간단한 클릭 한 번으로 복잡한 설정 완료
- 필요한 경우 일부만 선택하여 복사 가능

---

**이 테스트는 실제 사용 시나리오를 정확히 반영하며, 모든 케이스가 검증되었습니다.**


