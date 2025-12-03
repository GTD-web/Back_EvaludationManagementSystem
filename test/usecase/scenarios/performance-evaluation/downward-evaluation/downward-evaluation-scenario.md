# 하향평가 시나리오

## 개요

하향평가의 저장(생성/수정), 제출, 초기화 프로세스를 검증하는 시나리오입니다.
- 1차 평가자 → 피평가자 하향평가
- 2차 평가자 → 피평가자 하향평가
- 하향평가 제출 및 초기화

사용되는 컨트롤러
- performance-evaluation (하향평가 관리)
- evaluation-period (평가기간 관리)
- evaluation-criteria (프로젝트/WBS 할당)
- dashboard (대시보드 조회)

---

## 시나리오 작성 가이드

모든 시나리오는 다음 순서로 선행 조건을 설정해야 합니다:
1. **평가기간 생성**: `POST /admin/evaluation-periods`
2. **평가기간 시작**: `POST /admin/evaluation-periods/{id}/start`
3. **프로젝트 할당**: `POST /admin/evaluation-criteria/project-assignments`
4. **WBS 할당**: `POST /admin/evaluation-criteria/wbs-assignments`
5. **평가라인 매핑 생성**: 
   - `POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/primary-evaluator` (1차 평가자 구성)
   - `POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}/secondary-evaluator` (2차 평가자 구성)
6. **자기평가 작성**: `POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}`
7. **자기평가 제출**: `PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit` (1차 평가자 → 관리자 제출)

위 선행 조건이 완료된 후 하향평가 관련 시나리오를 검증합니다.

---

## 하향평가 프로세스

### 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/period/{periodId}/primary-evaluator (1차 평가자 구성)
- POST /admin/evaluation-criteria/evaluation-lines/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}/secondary-evaluator (2차 평가자 구성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 작성)
- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 제출 - 1차 평가자 → 관리자)

### 시나리오 1: 1차 하향평가 저장 및 제출

#### 1-1. 1차 하향평가 작성 및 저장

- PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary (1차 하향평가 저장)
    - **저장 검증**
        - evaluateeId, periodId, wbsId로 1차 하향평가 저장
        - evaluatorId (1차 평가자 ID) 입력
        - downwardEvaluationContent (하향평가 내용) 입력
        - downwardEvaluationScore (하향평가 점수) 입력
        - selfEvaluationId (자기평가 ID, 선택) 입력
        - 저장된 하향평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.primary 객체 검증**
                - downwardEvaluation.primary.status가 'in_progress'로 변경되는지 확인 (일부만 작성된 경우)
                - downwardEvaluation.primary.assignedWbsCount 확인 (전체 WBS 할당 수)
                - downwardEvaluation.primary.completedEvaluationCount 확인 (제출 전이므로 변경 없음)
                - downwardEvaluation.primary.isSubmitted가 false인지 확인 (미제출 상태)
                - downwardEvaluation.primary.totalScore가 null인지 확인 (모든 하향평가 제출 전)
                - downwardEvaluation.primary.grade가 null인지 확인 (모든 하향평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 primaryDownwardEvaluation 검증**
                - wbsList[].primaryDownwardEvaluation.downwardEvaluationId가 생성되는지 확인
                - wbsList[].primaryDownwardEvaluation.evaluationContent가 반영되는지 확인
                - wbsList[].primaryDownwardEvaluation.score가 반영되는지 확인
                - wbsList[].primaryDownwardEvaluation.isCompleted가 false인지 확인 (미제출 상태)
            - **summary.primaryDownwardEvaluation 검증**
                - summary.primaryDownwardEvaluation.totalScore가 null인지 확인 (모든 하향평가 제출 전)
                - summary.primaryDownwardEvaluation.grade가 null인지 확인 (모든 하향평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data (평가자 관점 할당 데이터 조회)
            - evaluatorId, employeeId 확인
            - evaluatee.projects 구조 확인 (평가자 관점 응답은 evaluatee 안에 projects 포함)
            - 위와 동일한 검증 수행
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.primary 객체 검증**
                - downwardEvaluation.primary.status가 'in_progress'인지 확인
                - downwardEvaluation.primary.completedEvaluationCount가 변경되지 않는지 확인 (제출 전)
                - downwardEvaluation.primary.isSubmitted가 false인지 확인

#### 1-2. 1차 하향평가 제출

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary/submit (1차 하향평가 제출)
    - **제출 전 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - downwardEvaluation.primary.isSubmitted = false 확인
            - downwardEvaluation.primary.completedEvaluationCount = 0 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - wbsList[].primaryDownwardEvaluation.isCompleted = false 확인
    - **제출 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 1차 하향평가 제출
        - HTTP 200 응답 확인
        - 재작성 요청 자동 완료 처리 확인
    - **대시보드 API 제출 후 검증 (제출 전후 비교)**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.primary 객체 검증 (제출 전후 비교)**
                - 제출 전: downwardEvaluation.primary.isSubmitted = false
                - 제출 후: downwardEvaluation.primary.isSubmitted = true (false → true 변경 확인)
                - 제출 전: downwardEvaluation.primary.completedEvaluationCount = 0
                - 제출 후: downwardEvaluation.primary.completedEvaluationCount = 1 (1 증가 확인)
                - downwardEvaluation.primary.status 확인
                    - 모든 하향평가 제출 완료 시: 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
                    - 일부만 제출된 경우: 'in_progress'
                - downwardEvaluation.primary.totalScore 확인
                    - 모든 하향평가 제출 완료 시: 계산된 점수 (가중치 기반)
                    - 일부만 제출된 경우: null
                - downwardEvaluation.primary.grade 확인
                    - 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 primaryDownwardEvaluation 검증 (제출 전후 비교)**
                - 제출 전: wbsList[].primaryDownwardEvaluation.isCompleted = false
                - 제출 후: wbsList[].primaryDownwardEvaluation.isCompleted = true (false → true 변경 확인)
            - **summary.primaryDownwardEvaluation 검증**
                - summary.primaryDownwardEvaluation.totalScore 확인
                    - 모든 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - summary.primaryDownwardEvaluation.grade 확인
                    - 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data (평가자 관점 할당 데이터 조회)
            - 위와 동일한 검증 수행
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.primary 객체 검증**
                - downwardEvaluation.primary.isSubmitted가 true로 변경되는지 확인
                - downwardEvaluation.primary.completedEvaluationCount가 1 증가하는지 확인
                - downwardEvaluation.primary.status 확인
                    - 모든 하향평가 제출 완료 시: 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
                    - 일부만 제출된 경우: 'in_progress'
                - downwardEvaluation.primary.totalScore 확인
                    - 모든 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - downwardEvaluation.primary.grade 확인
                    - 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null

---

### 시나리오 2: 1차 하향평가 초기화 (원복)

#### 2-1. 1차 하향평가 초기화

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary/reset (1차 하향평가 초기화)
    - **초기화 전 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - downwardEvaluation.primary.isSubmitted = true 확인
            - downwardEvaluation.primary.completedEvaluationCount > 0 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - wbsList[].primaryDownwardEvaluation.isCompleted = true 확인
    - **초기화 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 1차 하향평가 초기화
        - HTTP 200 응답 확인
    - **대시보드 API 초기화 후 검증 (초기화 전후 비교)**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.primary 객체 검증 (초기화 전후 비교)**
                - 초기화 전: downwardEvaluation.primary.isSubmitted = true
                - 초기화 후: downwardEvaluation.primary.isSubmitted = false (true → false 변경 확인)
                - 초기화 전: downwardEvaluation.primary.completedEvaluationCount > 0
                - 초기화 후: downwardEvaluation.primary.completedEvaluationCount = 초기화전값 - 1 (1 감소 확인)
                - downwardEvaluation.primary.status가 'in_progress'로 변경되는지 확인
                - downwardEvaluation.primary.totalScore가 null로 변경되는지 확인 (모든 하향평가 완료되지 않으면)
                - downwardEvaluation.primary.grade가 null로 변경되는지 확인 (모든 하향평가 완료되지 않으면)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 primaryDownwardEvaluation 검증 (초기화 전후 비교)**
                - 초기화 전: wbsList[].primaryDownwardEvaluation.isCompleted = true
                - 초기화 후: wbsList[].primaryDownwardEvaluation.isCompleted = false (true → false 변경 확인)
            - **summary.primaryDownwardEvaluation 검증**
                - summary.primaryDownwardEvaluation.totalScore가 null로 변경되는지 확인
                - summary.primaryDownwardEvaluation.grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.primary 객체 검증**
                - downwardEvaluation.primary.isSubmitted가 false로 변경되는지 확인
                - downwardEvaluation.primary.completedEvaluationCount가 1 감소하는지 확인
                - downwardEvaluation.primary.status가 'in_progress'로 변경되는지 확인

---

### 시나리오 3: 2차 하향평가 저장 및 제출

#### 3-1. 2차 하향평가 작성 및 저장

- PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary (2차 하향평가 저장)
    - **저장 검증**
        - evaluateeId, periodId, wbsId로 2차 하향평가 저장
        - evaluatorId (2차 평가자 ID) 입력
        - downwardEvaluationContent (하향평가 내용) 입력
        - downwardEvaluationScore (하향평가 점수) 입력
        - selfEvaluationId (자기평가 ID, 선택) 입력
        - 저장된 하향평가 ID 반환 확인
        - HTTP 200 응답 확인
    - **대시보드 API 저장 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.secondary 객체 검증**
                - downwardEvaluation.secondary.status가 'in_progress'로 변경되는지 확인 (일부만 작성된 경우)
                - downwardEvaluation.secondary.evaluators 배열 확인 (다중 평가자 지원)
                - 각 평가자별 assignedWbsCount 확인
                - 각 평가자별 completedEvaluationCount 확인 (제출 전이므로 변경 없음)
                - 각 평가자별 isSubmitted가 false인지 확인 (미제출 상태)
                - downwardEvaluation.secondary.isSubmitted가 false인지 확인 (모든 평가자 제출 전)
                - downwardEvaluation.secondary.totalScore가 null인지 확인 (모든 하향평가 제출 전)
                - downwardEvaluation.secondary.grade가 null인지 확인 (모든 하향평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 secondaryDownwardEvaluation 검증**
                - wbsList[].secondaryDownwardEvaluation.downwardEvaluationId가 생성되는지 확인
                - wbsList[].secondaryDownwardEvaluation.evaluationContent가 반영되는지 확인
                - wbsList[].secondaryDownwardEvaluation.score가 반영되는지 확인
                - wbsList[].secondaryDownwardEvaluation.isCompleted가 false인지 확인 (미제출 상태)
            - **summary.secondaryDownwardEvaluation 검증**
                - summary.secondaryDownwardEvaluation.totalScore가 null인지 확인 (모든 하향평가 제출 전)
                - summary.secondaryDownwardEvaluation.grade가 null인지 확인 (모든 하향평가 제출 전)
        - GET /admin/dashboard/{evaluationPeriodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data (평가자 관점 할당 데이터 조회)
            - evaluatorId, employeeId 확인
            - evaluatee.projects 구조 확인 (평가자 관점 응답은 evaluatee 안에 projects 포함)
            - 위와 동일한 검증 수행
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.secondary 객체 검증**
                - downwardEvaluation.secondary.status가 'in_progress'인지 확인
                - downwardEvaluation.secondary.evaluators 배열 확인
                - 각 평가자별 completedEvaluationCount가 변경되지 않는지 확인 (제출 전)
                - 각 평가자별 isSubmitted가 false인지 확인

#### 3-2. 2차 하향평가 제출

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary/submit (2차 하향평가 제출)
    - **제출 전 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - downwardEvaluation.secondary.isSubmitted = false 확인
            - downwardEvaluation.secondary.evaluators[].isSubmitted = false 확인
            - downwardEvaluation.secondary.evaluators[].completedEvaluationCount = 0 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - wbsList[].secondaryDownwardEvaluation.isCompleted = false 확인
    - **제출 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 2차 하향평가 제출
        - HTTP 200 응답 확인
        - 재작성 요청 자동 완료 처리 확인
    - **대시보드 API 제출 후 검증 (제출 전후 비교)**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.secondary 객체 검증 (제출 전후 비교)**
                - 제출 전: downwardEvaluation.secondary.evaluators[].isSubmitted = false
                - 제출 후: downwardEvaluation.secondary.evaluators[].isSubmitted = true (false → true 변경 확인)
                - 제출 전: downwardEvaluation.secondary.evaluators[].completedEvaluationCount = 0
                - 제출 후: downwardEvaluation.secondary.evaluators[].completedEvaluationCount > 0 (증가 확인)
                - downwardEvaluation.secondary.isSubmitted 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: true
                    - 일부만 제출된 경우: false
                - downwardEvaluation.secondary.status 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
                    - 일부만 제출된 경우: 'in_progress'
                - downwardEvaluation.secondary.totalScore 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 점수 (평균)
                    - 일부만 제출된 경우: null
                - downwardEvaluation.secondary.grade 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 secondaryDownwardEvaluation 검증 (제출 전후 비교)**
                - 제출 전: wbsList[].secondaryDownwardEvaluation.isCompleted = false
                - 제출 후: wbsList[].secondaryDownwardEvaluation.isCompleted = true (false → true 변경 확인)
            - **summary.secondaryDownwardEvaluation 검증**
                - summary.secondaryDownwardEvaluation.totalScore 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - summary.secondaryDownwardEvaluation.grade 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.secondary 객체 검증**
                - 해당 평가자의 isSubmitted가 true로 변경되는지 확인
                - 해당 평가자의 completedEvaluationCount가 1 증가하는지 확인
                - downwardEvaluation.secondary.isSubmitted 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: true
                    - 일부만 제출된 경우: false
                - downwardEvaluation.secondary.status 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
                    - 일부만 제출된 경우: 'in_progress'
                - downwardEvaluation.secondary.totalScore 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 점수
                    - 일부만 제출된 경우: null
                - downwardEvaluation.secondary.grade 확인
                    - 모든 평가자가 모든 하향평가 제출 완료 시: 계산된 등급
                    - 일부만 제출된 경우: null

---

### 시나리오 4: 2차 하향평가 초기화 (원복)

#### 4-1. 2차 하향평가 초기화

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary/reset (2차 하향평가 초기화)
    - **초기화 전 상태 확인**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - downwardEvaluation.secondary.evaluators[].isSubmitted = true 확인
            - downwardEvaluation.secondary.evaluators[].completedEvaluationCount > 0 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - wbsList[].secondaryDownwardEvaluation.isCompleted = true 확인
    - **초기화 검증**
        - evaluateeId, periodId, wbsId, evaluatorId로 2차 하향평가 초기화
        - HTTP 200 응답 확인
    - **대시보드 API 초기화 후 검증 (초기화 전후 비교)**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status (개별 직원 평가기간 현황 조회)
            - employeeId 확인
            - **downwardEvaluation.secondary 객체 검증 (초기화 전후 비교)**
                - 초기화 전: downwardEvaluation.secondary.evaluators[].isSubmitted = true
                - 초기화 후: downwardEvaluation.secondary.evaluators[].isSubmitted = false (true → false 변경 확인)
                - 초기화 전: downwardEvaluation.secondary.evaluators[].completedEvaluationCount > 0
                - 초기화 후: downwardEvaluation.secondary.evaluators[].completedEvaluationCount = 0 (감소 확인)
                - downwardEvaluation.secondary.isSubmitted가 false로 변경되는지 확인 (모든 평가자 제출 전)
                - downwardEvaluation.secondary.status가 'in_progress'로 변경되는지 확인
                - downwardEvaluation.secondary.totalScore가 null로 변경되는지 확인 (모든 하향평가 완료되지 않으면)
                - downwardEvaluation.secondary.grade가 null로 변경되는지 확인 (모든 하향평가 완료되지 않으면)
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data (직원 할당 데이터 조회)
            - employeeId 확인
            - **wbsList 내 secondaryDownwardEvaluation 검증 (초기화 전후 비교)**
                - 초기화 전: wbsList[].secondaryDownwardEvaluation.isCompleted = true
                - 초기화 후: wbsList[].secondaryDownwardEvaluation.isCompleted = false (true → false 변경 확인)
            - **summary.secondaryDownwardEvaluation 검증**
                - summary.secondaryDownwardEvaluation.totalScore가 null로 변경되는지 확인
                - summary.secondaryDownwardEvaluation.grade가 null로 변경되는지 확인
        - GET /admin/dashboard/{evaluationPeriodId}/employees/status (대시보드 전체 직원 현황 조회)
            - 응답 배열에서 해당 직원 정보 조회
            - **downwardEvaluation.secondary 객체 검증**
                - 해당 평가자의 isSubmitted가 false로 변경되는지 확인
                - 해당 평가자의 completedEvaluationCount가 1 감소하는지 확인
                - downwardEvaluation.secondary.isSubmitted가 false로 변경되는지 확인
                - downwardEvaluation.secondary.status가 'in_progress'로 변경되는지 확인

---

### 시나리오 5: 하향평가 일괄 제출 및 초기화

#### 5-1. 피평가자의 모든 하향평가 일괄 제출

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/bulk-submit (일괄 제출)
    - **제출 검증**
        - evaluateeId, periodId, evaluatorId, evaluationType으로 일괄 제출
        - HTTP 200 응답 확인
        - 응답에서 submittedCount, skippedCount, failedCount 확인
        - 응답에서 submittedIds, skippedIds, failedItems 확인
    - **대시보드 API 제출 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status
            - downwardEvaluation.primary 또는 secondary.completedEvaluationCount가 증가하는지 확인
            - 모든 하향평가 제출 완료 시 status가 'complete'로 변경되는지 확인
            - 모든 하향평가 제출 완료 시 totalScore와 grade가 계산되는지 확인

#### 5-2. 피평가자의 모든 하향평가 일괄 초기화

- POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/bulk-reset (일괄 초기화)
    - **초기화 검증**
        - evaluateeId, periodId, evaluatorId, evaluationType으로 일괄 초기화
        - HTTP 200 응답 확인
        - 응답에서 resetCount, skippedCount, failedCount 확인
        - 응답에서 resetIds, skippedIds, failedItems 확인
    - **대시보드 API 초기화 후 검증**
        - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status
            - downwardEvaluation.primary 또는 secondary.completedEvaluationCount가 감소하는지 확인
            - status가 'in_progress'로 변경되는지 확인
            - totalScore와 grade가 null로 변경되는지 확인

---

## 종합 검증 시나리오

### 시나리오 6: 전체 하향평가 프로세스 통합 검증

#### 6-1. 선행 조건 설정
- POST /admin/evaluation-periods (평가기간 생성)
- POST /admin/evaluation-periods/{id}/start (평가기간 시작)
- POST /admin/evaluation-criteria/project-assignments (프로젝트 할당 생성)
- POST /admin/evaluation-criteria/wbs-assignments (WBS 할당 생성)
- POST /admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId} (자기평가 작성)
- PATCH /admin/performance-evaluation/wbs-self-evaluations/{id}/submit (자기평가 제출)

#### 6-2. 하향평가 작성 및 제출 전체 프로세스

1. **1차 하향평가 작성**
    - PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary
        - evaluatorId: 1차 평가자 ID
        - downwardEvaluationContent: "1차 하향평가 내용"
        - downwardEvaluationScore: 85
        - selfEvaluationId: 자기평가 ID (선택)
    - **검증**: isCompleted = false, status = 'in_progress'

2. **1차 하향평가 제출**
    - POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary/submit
    - **검증**: isCompleted = true, status = 'complete' (모든 하향평가 제출 완료 시), totalScore와 grade 계산

3. **2차 하향평가 작성**
    - PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary
        - evaluatorId: 2차 평가자 ID
        - downwardEvaluationContent: "2차 하향평가 내용"
        - downwardEvaluationScore: 90
        - selfEvaluationId: 자기평가 ID (선택)
    - **검증**: isCompleted = false, status = 'in_progress'

4. **2차 하향평가 제출**
    - POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary/submit
    - **검증**: isCompleted = true, status = 'complete' (모든 평가자가 모든 하향평가 제출 완료 시), totalScore와 grade 계산 (평균)

5. **대시보드 API 통합 검증**
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/status
        - downwardEvaluation.primary.completedEvaluationCount = 할당된 WBS 수
        - downwardEvaluation.primary.isSubmitted = true
        - downwardEvaluation.primary.status = 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
        - downwardEvaluation.primary.totalScore 계산됨 (모든 하향평가 제출 완료 시)
        - downwardEvaluation.primary.grade 계산됨 (모든 하향평가 제출 완료 시)
        - downwardEvaluation.secondary.isSubmitted = true (모든 평가자가 모든 하향평가 제출 완료 시)
        - downwardEvaluation.secondary.status = 'complete' (모든 평가자가 모든 하향평가 제출 완료 시)
        - downwardEvaluation.secondary.totalScore 계산됨 (모든 평가자가 모든 하향평가 제출 완료 시)
        - downwardEvaluation.secondary.grade 계산됨 (모든 평가자가 모든 하향평가 제출 완료 시)
    - GET /admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data
        - wbsList[].primaryDownwardEvaluation.isCompleted = true
        - wbsList[].secondaryDownwardEvaluation.isCompleted = true
        - summary.primaryDownwardEvaluation.totalScore 계산됨
        - summary.primaryDownwardEvaluation.grade 계산됨
        - summary.secondaryDownwardEvaluation.totalScore 계산됨
        - summary.secondaryDownwardEvaluation.grade 계산됨
    - GET /admin/dashboard/{evaluationPeriodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data
        - 평가자 관점에서 위와 동일한 검증 수행

---

## 주의사항 및 검증 포인트

### 1. 선행 조건
- **자기평가 제출 필수**: 하향평가를 진행하기 전에 자기평가가 관리자에게 제출되어야 함
- 자기평가가 제출되지 않은 상태에서 하향평가 저장 시도 시 에러 발생 가능성 확인

### 2. 평가라인 검증
- **1차 평가자 권한**: 1차 하향평가 저장 시 1차 평가자 권한 확인
- **2차 평가자 권한**: 2차 하향평가 저장 시 2차 평가자 권한 확인
- 평가라인에 등록되지 않은 평가자는 하향평가 저장 불가
- **평가라인 매핑 명시적 생성**: 테스트 시 평가라인 매핑을 명시적으로 생성해야 함
  - 1차 평가자: 직원별 고정 담당자 (wbsItemId IS NULL)
  - 2차 평가자: WBS별 평가자 (wbsItemId IS NOT NULL)

### 3. 제출 프로세스
- **필수 항목 검증 제거**: 제출 시 downwardEvaluationContent와 downwardEvaluationScore가 없어도 제출 가능 (인사담당자에게 제출됨)
- **재작성 요청 자동 완료**: 제출 시 해당 평가기간에 발생한 재작성 요청 자동 완료 처리
- **중복 제출 방지**: 이미 완료된 평가는 재제출 불가

### 4. 초기화 프로세스
- **완료된 평가만 초기화 가능**: 완료되지 않은 평가는 초기화 불가
- **점수/등급 초기화**: 초기화 시 모든 하향평가가 완료되지 않으면 totalScore와 grade가 null로 변경

### 5. 점수 및 등급 계산 조건
- **1차 하향평가**: 모든 할당된 WBS에 대한 평가가 완료되어야 계산 (`assignedWbsCount === completedEvaluationCount`)
  - 1차 평가자는 직원별 고정 담당자이므로, 할당된 WBS 목록은 WBS 할당 테이블에서 조회
- **2차 하향평가**: 모든 2차 평가자가 할당된 모든 WBS에 대한 평가를 완료해야 계산
- 가중치(`weight`)를 기반으로 계산되므로 WBS 할당 정보도 중요
- 등급은 평가기간의 `gradeRanges` 설정에 따라 결정됨

### 6. 상태 전환 규칙
- `status: 'none'` → `'in_progress'` → `'complete'` (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
- `'complete'`는 모든 할당된 WBS에 대한 평가가 완료된 상태
- 일부만 완료된 경우 `'in_progress'`
- 승인 상태와 통합하여 최종 상태 결정

### 7. 2차 평가자 다중 지원
- 2차 하향평가는 여러 평가자를 지원
- 각 평가자별로 상태, 할당된 WBS 수, 완료 수를 개별 관리
- 전체 상태는 모든 평가자의 상태를 통합하여 계산
- 점수/등급은 모든 평가자가 완료했을 때만 계산 (평균)

### 8. 데이터 일관성
- 여러 엔드포인트에서 동일한 필드의 값이 일치해야 함
- `getEmployeeCompleteStatus`는 `getEmployeeEvaluationPeriodStatus`와 `getEmployeeAssignedData`를 통합한 결과이므로 일관성 확인 필수
- 평가자 관점 조회와 피평가자 관점 조회의 데이터 일관성 확인

### 9. 피평가자 조회 시 하향평가 정보 제거
- `GET /admin/dashboard/{evaluationPeriodId}/my/assigned-data` (내 할당 정보 조회)에서는:
  - 피평가자가 자신의 할당 정보를 조회할 때
  - 상위 평가자의 하향평가 정보는 제거됨
  - `primaryDownwardEvaluation: null`, `secondaryDownwardEvaluation: null`
  - Summary의 하향평가 점수/등급도 `null`로 설정

---

## 테스트 작성 가이드

1. **Before/After 비교**: 저장/제출/초기화 전후로 각 엔드포인트를 호출하여 비교
2. **단계별 검증**: 저장 → 제출 → 초기화 순서로 전체 프로세스 검증
3. **원복 검증**: 초기화 시 상태가 올바르게 원복되는지 확인
4. **다중 엔드포인트 검증**: 하나의 저장/제출/초기화에 대해 여러 엔드포인트를 모두 검증
5. **엣지 케이스**: 모든 하향평가 제출 완료, 일부만 제출, 초기화 등의 케이스 검증
6. **데이터 정합성**: `summary`의 집계 값과 개별 WBS 데이터의 일관성 확인
7. **평가자 다중 지원**: 2차 평가자 여러 명의 경우 각 평가자별 상태 및 통합 상태 검증
8. **재작성 요청 연동**: 제출 시 재작성 요청 자동 완료 처리 확인

