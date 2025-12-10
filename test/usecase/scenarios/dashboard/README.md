# 대시보드 평가 확인 여부 테스트

## 개요

평가자가 피평가자의 평가를 조회할 때 확인 여부가 올바르게 기록되고 조회되는지 검증하는 E2E 테스트입니다.

## 테스트 시나리오

### 1. 1차 평가자 자기평가 확인 여부

#### 1.1 자기평가 제출 후 확인 여부 초기 상태 검증
- **목적**: 피평가자가 자기평가를 제출하면 1차 평가자의 확인 여부가 `false`로 초기화되어야 함
- **전제 조건**:
  - 평가기간이 시작됨
  - 피평가자가 평가 대상으로 등록됨
  - 1차 평가자가 할당됨
  - 프로젝트 및 WBS가 배정됨
- **검증 단계**:
  1. 피평가자가 WBS 자기평가 저장
  2. 피평가자가 자기평가 제출
  3. 1차 평가자가 평가 대상자 현황 조회
  4. `isSelfEvaluationViewedByPrimaryEvaluator`가 `false`인지 확인

#### 1.2 피평가자 데이터 조회 후 확인 여부 변경 검증
- **목적**: 1차 평가자가 피평가자의 할당 데이터를 조회하면 확인 여부가 `true`로 변경되어야 함
- **검증 단계**:
  1. 1차 평가자가 피평가자의 할당 데이터 조회
  2. 활동 내역에 `viewed` 액션이 기록되었는지 확인
  3. 1차 평가자가 평가 대상자 현황 다시 조회
  4. `isSelfEvaluationViewedByPrimaryEvaluator`가 `true`인지 확인

### 2. 2차 평가자 자기평가 및 1차평가 확인 여부

#### 2.1 1차평가 제출 후 2차 평가자 확인 여부 초기 상태 검증
- **목적**: 1차 평가자가 1차평가를 제출하면 2차 평가자의 확인 여부가 `false`로 초기화되어야 함
- **전제 조건**:
  - 피평가자가 자기평가를 제출함
  - 2차 평가자가 할당됨
- **검증 단계**:
  1. 1차 평가자가 1차 하향평가 저장
  2. 1차 평가자가 1차 하향평가 제출
  3. 2차 평가자가 평가 대상자 현황 조회
  4. `isSelfEvaluationViewedBySecondaryEvaluator`가 `false`인지 확인

#### 2.2 2차 평가자 피평가자 데이터 조회 후 확인 여부 변경 검증
- **목적**: 2차 평가자가 피평가자의 할당 데이터를 조회하면 자기평가 확인 여부가 `true`로 변경되어야 함
- **검증 단계**:
  1. 2차 평가자가 피평가자의 할당 데이터 조회
  2. 활동 내역에 `viewed` 액션이 기록되었는지 확인
  3. 2차 평가자가 평가 대상자 현황 다시 조회
  4. `isSelfEvaluationViewedBySecondaryEvaluator`가 `true`인지 확인

### 3. 여러 피평가자의 확인 여부 독립성

#### 3.1 피평가자별 확인 여부 독립성 검증
- **목적**: 평가자가 특정 피평가자를 조회해도 다른 피평가자의 확인 여부에 영향을 주지 않아야 함
- **전제 조건**:
  - 동일한 1차 평가자가 여러 피평가자를 담당함
  - 모든 피평가자가 자기평가를 제출함
- **검증 단계**:
  1. 1차 평가자가 첫 번째 피평가자의 할당 데이터 조회 (이전 테스트에서 이미 조회됨)
  2. 두 번째 피평가자의 자기평가 제출
  3. 1차 평가자가 평가 대상자 현황 조회
  4. 첫 번째 피평가자의 `isSelfEvaluationViewedByPrimaryEvaluator`는 `true`
  5. 두 번째 피평가자의 `isSelfEvaluationViewedByPrimaryEvaluator`는 `false`

#### 3.2 두 번째 피평가자 조회 후 확인 여부 변경 검증
- **목적**: 두 번째 피평가자를 조회하면 해당 피평가자의 확인 여부만 변경되어야 함
- **검증 단계**:
  1. 1차 평가자가 두 번째 피평가자의 할당 데이터 조회
  2. 1차 평가자가 평가 대상자 현황 조회
  3. 첫 번째 피평가자의 `isSelfEvaluationViewedByPrimaryEvaluator`는 여전히 `true`
  4. 두 번째 피평가자의 `isSelfEvaluationViewedByPrimaryEvaluator`는 `true`

## API 엔드포인트

### 1. 평가자 평가 대상자 현황 조회
- **엔드포인트**: `GET /admin/dashboard/:periodId/my-evaluation-targets/:evaluatorId/status`
- **설명**: 평가자가 담당하는 피평가자들의 평가 현황을 조회합니다.
- **응답 필드**:
  - `selfEvaluation.isSelfEvaluationViewedByPrimaryEvaluator`: 1차 평가자가 자기평가를 확인했는지 여부
  - `selfEvaluation.isSelfEvaluationViewedBySecondaryEvaluator`: 2차 평가자가 자기평가를 확인했는지 여부
  - `downwardEvaluation.primaryStatus.isPrimaryEvaluationViewedByPrimaryEvaluator`: 1차 평가자가 1차 하향평가를 확인했는지 여부
  - `downwardEvaluation.secondaryStatus.isSecondaryEvaluationViewedBySecondaryEvaluator`: 2차 평가자가 2차 하향평가를 확인했는지 여부

### 2. 평가자 피평가자 할당 데이터 조회
- **엔드포인트**: `GET /admin/dashboard/:periodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data`
- **설명**: 평가자가 특정 피평가자의 할당 데이터를 조회합니다. 이 API를 호출하면 활동 내역에 `viewed` 액션이 기록됩니다.

### 3. 활동 내역 조회
- **엔드포인트**: `GET /admin/evaluation-activity-logs/:periodId/employees/:employeeId`
- **설명**: 특정 피평가자의 평가 활동 내역을 조회합니다.
- **활동 액션**:
  - `viewed`: 평가자가 피평가자의 할당 데이터를 조회한 액션

## 주요 검증 사항

### 1. 확인 여부 초기값
- 자기평가 제출 직후: `false`
- 1차평가 제출 직후 (2차 평가자 관점): `false`

### 2. 확인 여부 변경 조건
- 평가자가 피평가자의 할당 데이터 조회 API를 호출하면 `true`로 변경
- 활동 내역에 `viewed` 액션 기록

### 3. 평가자별 독립성
- 1차 평가자와 2차 평가자의 확인 여부는 독립적으로 관리됨
- 1차 평가자가 조회해도 2차 평가자의 확인 여부는 `false`로 유지

### 4. 피평가자별 독립성
- 평가자가 특정 피평가자를 조회해도 다른 피평가자의 확인 여부에 영향 없음
- 각 피평가자별로 확인 여부가 독립적으로 관리됨

## 실행 방법

```bash
# 전체 테스트 실행
npm run test:e2e -- test/usecase/scenarios/dashboard/evaluation-viewed-status.e2e-spec.ts

# 특정 describe 블록만 실행
npm run test:e2e -- test/usecase/scenarios/dashboard/evaluation-viewed-status.e2e-spec.ts -t "1차 평가자 자기평가 확인 여부"

# 특정 테스트만 실행
npm run test:e2e -- test/usecase/scenarios/dashboard/evaluation-viewed-status.e2e-spec.ts -t "피평가자가 자기평가를 제출하면 1차 평가자 확인 여부가 false여야 한다"
```

## 의존성

- `SeedDataScenario`: 테스트 데이터 생성 및 정리
- `EvaluationPeriodScenario`: 평가기간 관리
- `DashboardScenario`: 대시보드 현황 조회
- `SelfEvaluationScenario`: 자기평가 관리
- `DownwardEvaluationScenario`: 하향평가 관리
- `EvaluationActivityLogScenario`: 활동 내역 조회 및 검증

## 테스트 데이터

- 평가기간: 2024년 하반기
- 피평가자: 최소 2명
- 평가자:
  - 1차 평가자: 1명 (여러 피평가자 담당)
  - 2차 평가자: 1명
- 프로젝트: 최소 1개
- WBS 항목: 최소 2개

## 예상 소요 시간

- 전체 테스트 실행: 약 10-15초

## 참고 사항

- 이 테스트는 실제 HTTP 엔드포인트를 통해 데이터를 조작하고 조회합니다.
- 데이터베이스는 각 테스트 suite 전후에 정리됩니다.
- 활동 내역은 평가자가 피평가자의 할당 데이터를 조회할 때 자동으로 기록됩니다.

