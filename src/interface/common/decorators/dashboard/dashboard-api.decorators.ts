import { applyDecorators, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeeEvaluationPeriodStatusResponseDto } from '../../dto/dashboard/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from '../../dto/dashboard/my-evaluation-targets-status.dto';
import {
  EmployeeAssignedDataResponseDto,
  EvaluatorAssignedEmployeesDataResponseDto,
} from '../../dto/dashboard/employee-assigned-data.dto';
import { DashboardFinalEvaluationsByPeriodResponseDto } from '../../dto/dashboard/final-evaluation-list.dto';
import { EmployeeFinalEvaluationListResponseDto } from '../../dto/dashboard/employee-final-evaluation-list.dto';
import { AllEmployeesFinalEvaluationsResponseDto } from '../../dto/dashboard/all-employees-final-evaluations.dto';
import { EmployeeCompleteStatusResponseDto } from '../../dto/dashboard/employee-complete-status.dto';

/**
 * 직원의 평가기간 현황 조회 API 데코레이터
 */
export function GetEmployeeEvaluationPeriodStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/status'),
    ApiOperation({
      summary: '직원의 평가기간 현황 조회',
      description: `특정 평가기간에서 특정 직원의 평가 참여 현황을 조회합니다.

**동작:**
- 평가기간 정보와 직원 기본 정보 반환
- 평가 대상 여부 및 제외 정보 포함 (isEvaluationTarget, exclusionInfo)
- 평가항목 설정 상태 조회 (프로젝트/WBS 할당 개수 및 상태)
  * **취소된 프로젝트 할당(소프트 딜리트)은 개수에서 제외됨**
- WBS 평가기준 설정 상태 조회 (평가기준이 있는 WBS 개수 및 상태)
  * **취소된 프로젝트 할당에 속한 WBS는 개수에서 제외됨**
- 평가라인 지정 상태 조회 (PRIMARY/SECONDARY 평가자 지정 여부 및 상태)
- 등록되지 않은 직원이나 존재하지 않는 평가기간 조회 시 null 반환
- 상태 값: complete(완료), in_progress(설정중), none(미존재)

**테스트 케이스:**
- 유효한 평가기간ID와 직원ID로 현황을 조회할 수 있어야 한다
- 응답에 모든 필수 필드가 포함되어야 한다
- 평가기간 정보가 올바르게 반환되어야 한다
- 직원 정보가 올바르게 반환되어야 한다
- 제외되지 않은 직원은 isEvaluationTarget이 true여야 한다
- 평가항목 상태가 none이어야 한다 (배정 없음)
- 프로젝트만 배정된 경우 평가항목 상태가 in_progress여야 한다
- WBS만 배정된 경우 평가항목 상태가 in_progress여야 한다
- 프로젝트와 WBS 모두 배정된 경우 평가항목 상태가 complete여야 한다
- WBS 평가기준 상태가 none이어야 한다 (WBS 배정 없음)
- WBS 배정되었지만 평가기준이 삭제된 경우 상태가 none이어야 한다
- WBS 여러 개 중 일부만 평가기준이 있는 경우 상태가 in_progress여야 한다
- WBS와 평가기준 모두 있는 경우 상태가 complete여야 한다
- 평가라인 상태가 none이어야 한다 (평가자 미지정)
- PRIMARY 평가자만 지정된 경우 상태가 in_progress여야 한다
- PRIMARY와 SECONDARY 평가자 모두 지정된 경우 상태가 complete여야 한다
- 제외된 직원은 isEvaluationTarget이 false여야 한다
- 등록되지 않은 직원 조회 시 null을 반환해야 한다
- 존재하지 않는 평가기간 조회 시 null을 반환해야 한다
- 잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다
- 잘못된 직원 UUID 형식으로 요청 시 에러가 발생해야 한다
- 직원 추가 → 현황 조회 → 프로젝트 배정 → 현황 재조회 흐름이 정상 동작해야 한다
- 완전한 설정 흐름: 직원 추가 → 프로젝트/WBS 배정 → 평가기준 설정 → 평가자 지정
- 직원 제외 → 현황 조회 → 제외 복원 → 현황 재조회 흐름이 정상 동작해야 한다
- 여러 직원의 현황을 조회해도 각각 올바른 데이터를 반환해야 한다
- 반환된 카운트가 실제 배정 개수와 일치해야 한다
- 상태 값이 예상된 enum 값 중 하나여야 한다`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '직원의 평가기간 현황 조회 성공',
      type: EmployeeEvaluationPeriodStatusResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간에 등록되지 않은 직원',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 평가기간의 모든 직원 현황 조회 API 데코레이터
 */
export function GetAllEmployeesEvaluationPeriodStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/status'),
    ApiOperation({
      summary: '평가기간의 모든 직원 현황 조회',
      description: `특정 평가기간에 등록된 모든 직원의 평가 참여 현황을 배열로 조회합니다.

**동작:**
- 평가기간에 등록된 모든 직원의 현황을 배열로 반환
- 각 직원의 평가 대상 여부, 평가항목 설정 상태, WBS 평가기준 설정 상태, 평가라인 지정 상태 포함
  * **프로젝트/WBS 할당 개수는 취소된 프로젝트 할당(소프트 딜리트) 제외**
- **조회하지 않기로 한 직원(isExcludedFromList=true)은 결과에서 자동 제외됨**
- 등록된 직원이 없으면 빈 배열 반환
- 상태 값: complete(완료), in_progress(설정중), none(미존재)

**테스트 케이스:**
- 등록된 모든 직원의 현황을 조회할 수 있어야 한다
- 실제처럼 다양한 설정 상태를 가진 직원들을 조회할 수 있어야 한다 (none, in_progress, complete)
- **조회하지 않기로 한 직원은 결과에 포함되지 않아야 한다**
- 응답에 모든 필수 필드가 포함되어야 한다 (평가기간, 직원, 제외정보, 평가항목, WBS기준, 평가라인)
- 등록된 직원이 없으면 빈 배열을 반환해야 한다
- 여러 프로젝트와 WBS가 배정된 직원의 현황이 정확해야 한다 (카운트 정확성)
- 존재하지 않는 평가기간 조회 시 빈 배열을 반환해야 한다
- 잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다
- 여러 직원을 조회해도 각 직원의 데이터가 섞이지 않아야 한다
- 상태 값이 예상된 enum 값 중 하나여야 한다
- 평가기간 시작 후 직원들의 설정 진행 상황을 단계별로 확인할 수 있어야 한다

**성능 (직원 수별 측정 결과):**

직원 수별 평균 응답 시간 (목표: 3000ms 이내):
- 100명: 709ms (처리량: 141 직원/초, 직원당 7.09ms)
- 200명: 1420ms (처리량: 141 직원/초, 직원당 7.10ms)
- 300명: 2133ms (처리량: 141 직원/초, 직원당 7.11ms)

추가 성능 지표 (100명 기준):
- 연속 조회 성능: 평균 741ms (안정적인 응답 속도 유지)
- 병렬 조회 성능: 5개 동시 요청 시 평균 715ms/요청
- 메모리 효율성: 20회 반복 조회 시 메모리 감소 (-207MB, 가비지 컬렉션 효과)
- 데이터 정합성: 대량 데이터 환경에서도 모든 필드가 올바르게 반환됨
- 선형 확장성: 직원 수 증가에 비례하여 선형적으로 응답 시간 증가 (일관된 처리량)`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: '모든 직원의 평가기간 현황 조회 성공',
      type: [EmployeeEvaluationPeriodStatusResponseDto],
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 평가기간의 모든 직원 현황 엑셀 다운로드 API 데코레이터
 */
export function ExportAllEmployeesEvaluationPeriodStatusToExcel() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/status/export/excel'),
    ApiOperation({
      summary: '평가기간의 모든 직원 현황 엑셀 다운로드',
      description: `특정 평가기간에 등록된 모든 직원의 평가 참여 현황을 엑셀 파일로 다운로드합니다.

**동작:**
- 평가기간에 등록된 모든 직원의 현황을 엑셀 파일로 생성하여 다운로드
- 엑셀 파일 최상단에 "{평가기간명} 평가 결과" 제목 포함
- 직원 정보(이름, 사번, 부서, 직급), 평가자 정보 포함
- 자기평가/1차/2차평가: 점수와 등급만 표시 (상태는 표시하지 않음)
- 동료평가: 완료수/전체수만 표시 (상태는 표시하지 않음)
- 최종평가: 평가등급과 직무등급 표시
- **조회하지 않기로 한 직원(isExcludedFromList=true)은 엑셀 파일에 자동 제외됨**
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="평가결과_{평가기간명}_{날짜}.xlsx"

**엑셀 컬럼:**
- 부서 (부서별로 세로 병합되어 표시)
- 이름
- 직급
- 1차 평가자
- 2차 평가자
- 재임여부
- 평가선정
- 자기평가 (점수 / 등급)
- 1차평가 (점수 / 등급)
- 2차평가 (점수 / 등급)
- 동료평가 (완료수/전체수)
- 최종평가 (평가등급(직무등급))

**정렬 순서:**
- SSO 부서 하이라키 API에서 조회한 부서 순서(order)대로 자동 정렬
- 같은 부서 내에서는 직원 이름순 정렬`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'includeUnregistered',
      description: '등록 해제된 직원 포함 여부',
      required: false,
      type: 'boolean',
      example: false,
    }),
    ApiOkResponse({
      description: '엑셀 파일 다운로드 성공',
      schema: {
        type: 'string',
        format: 'binary',
      },
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 내가 담당하는 평가 대상자 현황 조회 API 데코레이터
 */
export function GetMyEvaluationTargetsStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/my-evaluation-targets/:evaluatorId/status'),
    ApiOperation({
      summary: '내가 담당하는 평가 대상자 현황 조회',
      description: `지정한 평가자가 담당하는 피평가자들의 평가 현황을 배열로 조회합니다.

**동작:**
- 지정한 평가자 ID로 담당하는 피평가자 목록 조회
- 내가 PRIMARY 또는 SECONDARY 평가자로 지정된 피평가자 목록 반환
- **평가자에게 할당된 피평가자는 WBS 할당 여부와 관계없이 모두 조회됨**
  * WBS가 할당되지 않은 경우 status는 'none'으로 표시
  * 피평가자가 내용을 작성하지 않아도 목록에 표시됨
- 각 피평가자에 대한 내 평가자 유형 제공 (PRIMARY/SECONDARY)
- 피평가자가 1차 평가자에게 자기평가를 제출했는지 여부 제공 (전체 자기평가 수, 제출된 수, 제출 완료 여부)
- **자기평가 조회 관련 필드 (평가자 유형에 따라 제공):**
  * **1차 평가자인 경우**: viewedByPrimaryEvaluator 필드만 제공 (자기평가 제출 시에만)
  * **2차 평가자인 경우**: viewedBySecondaryEvaluator 필드만 제공 (1차 평가 제출 시에만)
  * **평가자가 아닌 경우**: viewedBy 관련 필드는 응답에 포함되지 않음
  * **자기평가 미제출 시 (1차 평가자)**: viewedByPrimaryEvaluator 필드는 응답에 포함되지 않음
  * **1차 평가 미제출 시 (2차 평가자)**: viewedBySecondaryEvaluator 필드는 응답에 포함되지 않음
- 내가 담당하는 하향평가 현황 제공 (평가 대상 WBS 수, 완료 수, 평균 점수, 수정 가능 여부)
- **1차 평가 조회 관련 필드 (평가자 유형에 따라 제공):**
  * **2차 평가자인 경우**: secondaryStatus.primaryEvaluationViewed 필드 제공 (1차 평가 제출 시에만)
  * **1차 평가자인 경우**: primaryEvaluationViewed 필드는 응답에 포함되지 않음
  * **1차 평가 미제출 시**: primaryEvaluationViewed 필드는 응답에 포함되지 않음
  * **평가 대상 WBS 수는 취소된 프로젝트 할당(소프트 딜리트)의 WBS 제외**
  * **취소된 프로젝트 할당에 속한 WBS의 하향평가는 카운트에서 제외됨**
- 피평가자별 평가 대상 여부, 평가항목 설정 상태, WBS 평가기준 설정 상태, 평가라인 지정 상태, 성과 입력 상태 포함
- 1차/2차 평가자로 동시에 지정된 경우 두 평가 현황 모두 표시
- 담당하는 평가 대상자가 없으면 빈 배열 반환

**성능:**
- 소규모 (4명): 평균 ~60ms, 병렬 처리 시 35ms/요청
- 대규모 (100명): 평균 ~1,226ms (목표 2,000ms 대비 38% 빠름)
- 확장성: 직원당 처리 시간 12.3ms (100명 기준, 규모가 커질수록 효율 향상)
- 병렬 처리: 5개 동시 요청 시 44% 성능 향상 (686ms/요청)
- 메모리 안정성: 20회 연속 조회 시 메모리 감소 (-25MB, 누수 없음)
- 안정성: 연속 조회 시 일관된 응답 시간 유지 (~1,150ms)

**테스트 케이스:**
- 기능 테스트: 평가자가 담당하는 평가 대상자 현황을 조회할 수 있어야 한다
- 기능 테스트: **WBS 할당이 없는 피평가자도 목록에 포함되어야 한다** (status: 'none')
- 기능 테스트: **피평가자가 내용을 작성하지 않아도 목록에 표시되어야 한다**
- 기능 테스트: PRIMARY와 SECONDARY 평가자 구분이 정확해야 한다
- 기능 테스트: 제외된 피평가자도 조회되어야 한다 (제외 여부 정보 포함)
- 기능 테스트: 응답에 모든 필수 필드가 포함되어야 한다 (제외정보, 평가항목, WBS기준, 평가라인, 성과입력, 자기평가제출상태, 하향평가)
- 기능 테스트: 담당하는 평가 대상자가 없으면 빈 배열을 반환해야 한다
- 기능 테스트: 여러 피평가자를 담당하는 경우 모두 조회되어야 한다
- 기능 테스트: 성과 입력 상태가 정확해야 한다
- 기능 테스트: 자기평가 미제출 시 1차 평가자의 viewedByPrimaryEvaluator 필드가 포함되지 않아야 한다
- 기능 테스트: 자기평가 제출 시 1차 평가자의 viewedByPrimaryEvaluator 필드가 포함되어야 한다
- 기능 테스트: 1차 평가자가 피평가자 데이터를 조회하면 viewedByPrimaryEvaluator가 true로 변경되어야 한다
- 기능 테스트: 1차 평가 미제출 시 2차 평가자의 viewedBySecondaryEvaluator 필드가 포함되지 않아야 한다
- 기능 테스트: 1차 평가 제출 시 2차 평가자의 viewedBySecondaryEvaluator 필드가 포함되어야 한다
- 기능 테스트: 2차 평가자가 피평가자 데이터를 조회하면 viewedBySecondaryEvaluator와 primaryEvaluationViewed가 true로 변경되어야 한다
- 실패 케이스: 존재하지 않는 평가기간 조회 시 빈 배열을 반환해야 한다
- 실패 케이스: 존재하지 않는 평가자 조회 시 빈 배열을 반환해야 한다
- 실패 케이스: 잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다
- 실패 케이스: 잘못된 평가자 UUID 형식으로 요청 시 에러가 발생해야 한다
- 정합성 테스트: 여러 피평가자의 데이터가 섞이지 않아야 한다
- 정합성 테스트: 상태 값이 예상된 enum 값 중 하나여야 한다
- 성능 테스트 (소규모): 4명 피평가자 환경에서 60ms 평균 응답 시간
- 성능 테스트 (대규모): 100명 피평가자 환경에서 1,226ms 평균 응답 시간 (목표 2초 이내)
- 성능 테스트: 연속 조회 시 안정적인 성능 유지 (변동 폭 3% 이내)
- 성능 테스트: 병렬 조회 시 44% 성능 향상 확인
- 성능 테스트: 100명 조회 시 데이터 정합성 100% 검증 완료
- 성능 테스트: 평가자 유형과 하향평가 정보 100% 일치
- 성능 테스트: 20회 연속 조회 시 메모리 누수 없음 (오히려 감소)`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '내가 담당하는 평가 대상자 현황 조회 성공',
      type: [MyEvaluationTargetStatusResponseDto],
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 사용자 할당 정보 조회 API 데코레이터
 */
export function GetEmployeeAssignedData() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/assigned-data'),
    ApiOperation({
      summary: '사용자 할당 정보 조회',
      description: `특정 직원의 평가기간 내 할당된 모든 정보를 조회합니다.

**중요: 평가자가 다른 직원의 데이터를 조회하면 Activity Log에 'viewed' 활동이 자동으로 기록됩니다.**

**동작:**
- 평가기간 정보 반환 (평가기간명, 시작/종료일, 상태, 설정 허용 여부)
  * maxSelfEvaluationRate: 자기평가 달성률 최대값 (%) - 자기평가 입력 시 사용
- 직원 기본 정보 반환 (직원명, 직원번호, 이메일, 부서, 상태)
- 할당된 프로젝트 목록을 프로젝트별로 그룹화하여 반환
  * **취소된 프로젝트 할당(소프트 딜리트)은 자동으로 제외됨**
- 각 프로젝트에 속한 WBS 목록 반환 (WBS 정보, 평가기준, 성과, 자기평가, 하향평가 포함)
  * **취소된 프로젝트 할당에 속한 WBS는 자동으로 제외됨**
  * **WBS 평가기준의 isAdditional 필드 포함 (추가 과제 여부)**
- 데이터 요약 정보 제공 (총 프로젝트 수, 총 WBS 수, 완료된 성과 수, 완료된 자기평가 수, 평가 점수 및 등급)
  * **summary의 평가자별 assignedWbsCount는 취소된 프로젝트 할당의 WBS 제외**
- 할당이 없는 경우에도 빈 배열로 정상 응답
- 등록되지 않은 직원이나 존재하지 않는 평가기간 조회 시 404 에러 반환
- **평가자가 조회 시**: JWT 토큰의 사용자 ID가 조회 대상 직원 ID와 다르면 Activity Log 기록

**Activity Log 기록 조건:**
- 조회하는 사람(viewerId)이 조회 대상 직원(employeeId)과 다른 경우
- 조회하는 사람이 해당 직원의 평가자(PRIMARY/SECONDARY)인 경우

**테스트 케이스:**
- 유효한 평가기간과 직원ID로 할당 정보를 조회할 수 있어야 한다
- 응답에 모든 필수 필드가 포함되어야 한다 (evaluationPeriod, employee, projects, summary)
- 프로젝트와 WBS가 할당된 경우 조회 성공해야 한다
- 평가기간 정보가 올바르게 반환되어야 한다
- 직원 정보가 올바르게 반환되어야 한다
- summary 카운트가 정확해야 한다
- 할당이 없는 직원도 조회 성공해야 한다 (빈 배열)
- WBS별 평가기준이 올바르게 반환되어야 한다
- 프로젝트별로 WBS가 올바르게 그룹화되어야 한다
- 여러 직원의 할당 정보를 조회해도 데이터가 섞이지 않아야 한다
- 평가자가 피평가자 정보 조회 시 Activity Log에 viewed 활동 기록
- 등록되지 않은 직원 조회 시 404 에러가 발생해야 한다
- 존재하지 않는 평가기간 조회 시 404 에러가 발생해야 한다
- 잘못된 평가기간 UUID 형식으로 요청 시 400 에러가 발생해야 한다
- 잘못된 직원 UUID 형식으로 요청 시 400 에러가 발생해야 한다

**성능:**
- 소규모 데이터 (직원당 WBS ~11개): 평균 ~18ms, 병렬 처리 시 11ms/요청
- 대용량 데이터 (직원당 WBS ~119개): 평균 ~252ms (목표 2,000ms 대비 87% 빠름)
- 확장성: WBS당 처리 시간 2.1ms (119개 기준, 선형 확장 가능)
- 연속 조회: 평균 245ms로 안정적인 응답 속도 유지 (대용량 기준)
- 병렬 조회: 5명 동시 조회 시 42% 성능 향상 (146ms/요청, 대용량 기준)
- 메모리 효율성: 30회 반복 조회 후 메모리 감소 (-33MB, 가비지 컬렉션 효과적)
- 데이터 정합성: 프로젝트 및 WBS 정보가 올바르게 그룹화되어 반환됨
- 테스트 환경 (소규모): 직원 5명, 프로젝트 12개, WBS 11개, 평가기준 45건, 자기평가 55건
- 테스트 환경 (대용량): 직원 5명, 프로젝트 6개/명, WBS 119개/명, 평가기준 ~864개/명`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '사용자 할당 정보 조회 성공',
      type: EmployeeAssignedDataResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간에 등록되지 않은 직원 또는 평가기간을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 내 할당 정보 조회 API 데코레이터
 */
export function GetMyAssignedData() {
  return applyDecorators(
    Get(':evaluationPeriodId/my-assigned-data'),
    ApiOperation({
      summary: '나의 할당 정보 조회 (현재 로그인 사용자)',
      description: `현재 로그인한 사용자(피평가자)의 평가기간 내 할당된 모든 정보를 조회합니다.

**중요: 피평가자는 상위 평가자의 하향평가 내용(점수, 코멘트)을 볼 수 없지만, 평가자 정보는 확인할 수 있습니다.**

**동작:**
- JWT 토큰에서 현재 로그인한 사용자 정보 추출
- 평가기간 정보 반환 (평가기간명, 시작/종료일, 상태, 설정 허용 여부)
  * maxSelfEvaluationRate: 자기평가 달성률 최대값 (%) - 자기평가 입력 시 사용
- 직원 기본 정보 반환 (직원명, 직원번호, 이메일, 부서, 상태)
- 할당된 프로젝트 목록을 프로젝트별로 그룹화하여 반환
  * **취소된 프로젝트 할당(소프트 딜리트)은 자동으로 제외됨**
- 각 프로젝트에 속한 WBS 목록 반환 (WBS 정보, 평가기준, 성과, 자기평가)
  * **취소된 프로젝트 할당에 속한 WBS는 자동으로 제외됨**
  * **WBS 평가기준의 isAdditional 필드 포함 (추가 과제 여부)**
  * **2차 하향평가 정보는 평가자 정보만 제공 (evaluatorId, evaluatorName, isCompleted)**
  * **2차 하향평가 내용은 제거됨 (evaluationContent, score, submittedAt)**
- 데이터 요약 정보 제공 (총 프로젝트 수, 총 WBS 수, 완료된 성과 수, 완료된 자기평가 수)
  * **하향평가 점수/등급은 제거됨 (primaryDownwardEvaluation.totalScore/grade = null, secondaryDownwardEvaluation.totalScore/grade = null)**
  * **2차 평가자 목록은 제공됨 (secondaryDownwardEvaluation.evaluators)**
- 할당이 없는 경우에도 빈 배열로 정상 응답

**employees/:employeeId/assigned-data와의 차이점:**
- JWT 토큰에서 자동으로 employeeId 추출 (URL 파라미터 불필요)
- 피평가자가 자신의 정보만 조회 가능
- 2차 하향평가의 평가 내용은 제거되지만 평가자 정보는 제공됨

**테스트 케이스:**
- 정상 조회: 유효한 JWT 토큰으로 자신의 할당 정보 조회 성공 (200)
- 응답 필드 포함: evaluationPeriod, employee, projects, summary 필드 반환
- 프로젝트/WBS 할당: 할당된 프로젝트와 WBS 정보 조회 성공
- 평가기준 포함: WBS별 평가기준이 올바르게 반환됨
- 성과 포함: 등록된 성과 정보가 포함됨
- 자기평가 포함: 등록된 자기평가 정보가 포함됨
- **2차 평가자 정보 포함: WBS별 secondaryDownwardEvaluation에 evaluatorId, evaluatorName, isCompleted 포함**
- **2차 평가 내용 제거: evaluationContent, score, submittedAt은 제거됨**
- **하향평가 점수/등급 제거: summary의 primaryDownwardEvaluation, secondaryDownwardEvaluation의 totalScore, grade가 모두 null**
- **2차 평가자 목록 포함: summary.secondaryDownwardEvaluation.evaluators 제공**
- 요약 정보 정확성: summary 카운트가 실제 데이터와 일치
- 할당 없음: 할당이 없는 경우 빈 배열 반환 (200)
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- 존재하지 않는 평가기간: 404 에러
- 잘못된 UUID: 잘못된 평가기간 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: `나의 할당 정보 조회 성공

**주의:** 응답 구조는 EmployeeAssignedDataResponseDto와 동일하지만, 
피평가자 보호를 위해 다음 필드들은 제한됩니다:
- wbs.primaryDownwardEvaluation: 전체 정보 제공
- wbs.secondaryDownwardEvaluation: { evaluatorId, evaluatorName, isCompleted } 만 제공
- summary.primaryDownwardEvaluation: { totalScore: null, grade: null }
- summary.secondaryDownwardEvaluation: { totalScore: null, grade: null, evaluators: [...] }`,
      type: EmployeeAssignedDataResponseDto,
    }),
    ApiNotFoundResponse({
      description:
        '평가기간에 등록되지 않은 사용자 또는 평가기간을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 담당자의 피평가자 할당 정보 조회 API 데코레이터
 */
export function GetEvaluatorAssignedEmployeesData() {
  return applyDecorators(
    Get(
      ':evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data',
    ),
    ApiOperation({
      summary: '담당자의 피평가자 할당 정보 조회',
      description: `평가자가 담당하는 특정 피평가자의 평가기간 내 할당된 모든 정보를 조회합니다.

**동작:**
- 평가자-피평가자 관계를 EvaluationLineMapping 테이블에서 확인 (WBS별 평가자 매핑)
- 평가자가 피평가자를 담당하는 경우에만 조회 가능
- 평가기간 정보 반환 (평가기간명, 시작/종료일, 상태, 설정 허용 여부)
  * maxSelfEvaluationRate: 자기평가 달성률 최대값 (%) - 자기평가 입력 시 사용
- 평가자 기본 정보 반환 (직원명, 직원번호, 이메일, 부서, 상태)
- 피평가자의 할당된 프로젝트 목록을 프로젝트별로 그룹화하여 반환
  * **취소된 프로젝트 할당(소프트 딜리트)은 자동으로 제외됨**
- 각 프로젝트에 속한 WBS 목록 반환 (WBS 정보, 평가기준, 성과, 자기평가, 하향평가 포함)
  * **취소된 프로젝트 할당에 속한 WBS는 자동으로 제외됨**
- 데이터 요약 정보 제공 (총 프로젝트 수, 총 WBS 수, 완료된 성과 수, 완료된 자기평가 수, 평가 점수 및 등급)
  * **summary의 평가자별 assignedWbsCount는 취소된 프로젝트 할당의 WBS 제외**
- 평가자가 담당하지 않는 피평가자 조회 시 404 에러 반환
- 등록되지 않은 직원이나 존재하지 않는 평가기간 조회 시 404 에러 반환

**테스트 케이스:**
- 담당자의 피평가자 할당 정보 조회 성공
- 응답에 모든 필수 필드 포함 (evaluationPeriod, evaluator, evaluatee)
- 평가자가 PRIMARY 평가자로 지정된 경우 조회 성공
- 평가자가 SECONDARY 평가자로 지정된 경우 조회 성공
- WBS별 평가기준 확인 (criteria 배열)
- WBS별 가중치 확인 (0-100% 범위)
- 성과 및 자기평가 완료 현황 확인 (isCompleted 필드)
- 하향평가 정보 확인 (1차/2차 평가)
- 프로젝트 매니저 정보 검증
- 일반 조회와 평가자별 조회 데이터 일관성 확인
- 존재하지 않는 평가기간 조회 시 404 에러
- 존재하지 않는 평가자 조회 시 404 에러
- 존재하지 않는 피평가자 조회 시 404 에러
- 잘못된 평가기간 UUID 형식으로 요청 시 400 에러
- 잘못된 평가자 UUID 형식으로 요청 시 400 에러
- 잘못된 피평가자 UUID 형식으로 요청 시 400 에러
- 평가자가 담당하지 않는 피평가자 조회 시 404 에러
- 응답 속도 측정 (3회 반복, 평균 500ms 이내)

**성능:**
- 평균 응답 시간: ~100ms (목표: 1500ms 이내)
- 연속 조회 성능: 평균 98ms로 안정적인 응답 속도 유지
- 병렬 조회 성능: 4명 동시 조회 시 평균 65ms로 효율적인 처리
- 메모리 효율성: 50회 반복 조회 후 메모리 누수 없음 (오히려 -36MB 감소)
- 데이터 정합성: 대량 데이터 환경에서도 모든 필드가 올바르게 반환됨
- 테스트 환경: 직원 5명, 프로젝트 12개, WBS 11개, 평가라인 매핑 44건`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiParam({
      name: 'employeeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    ApiOkResponse({
      description: '담당자의 피평가자 할당 정보 조회 성공',
      type: EvaluatorAssignedEmployeesDataResponseDto,
    }),
    ApiNotFoundResponse({
      description:
        '평가자가 해당 피평가자를 담당하지 않음, 평가기간에 등록되지 않은 직원, 평가기간을 찾을 수 없음, 평가자를 찾을 수 없음, 피평가자를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 평가기간별 최종평가 목록 조회 API 데코레이터
 */
export function GetFinalEvaluationsByPeriod() {
  return applyDecorators(
    Get(':evaluationPeriodId/final-evaluations'),
    ApiOperation({
      summary: '평가기간별 최종평가 목록 조회',
      description: `특정 평가기간에 등록된 모든 직원의 최종평가를 조회합니다.

**동작:**
- 평가기간 정보를 최상단에 한 번만 제공
- 각 직원별 최종평가 정보를 배열로 제공
- 직원 사번 오름차순으로 정렬
- **조회하지 않기로 한 직원(isExcludedFromList=true)은 결과에서 자동 제외됨**
- 삭제된 최종평가는 조회되지 않음


**테스트 케이스:**
- 첫 번째 평가기간의 최종평가 목록 조회 성공
- 열 번째 평가기간의 최종평가 목록 조회 성공
- 평가기간 정보 검증 (id, name, startDate, endDate)
- 직원 정보 검증 (id, name, employeeNumber, email, departmentName, rankName)
- 최종평가 정보 검증 (id, evaluationGrade, jobGrade, jobDetailedGrade, isConfirmed, createdAt, updatedAt)
- 직원 사번 오름차순 정렬 확인
- 존재하지 않는 평가기간 조회 시 404 에러
- 잘못된 UUID 형식으로 요청 시 400 에러
- 응답 구조 검증 (period와 evaluations 필드 포함)

**성능:**
- 대용량 데이터 (100명): 평균 ~25ms (목표 2,000ms 대비 98.8% 빠름, 1.2% 달성) 🚀
- 연속 조회: 평균 14ms로 매우 안정적인 응답 속도 유지
- 병렬 조회: 5건 동시 조회 시 평균 11ms/요청으로 효율적 처리 (56% 성능 향상)
- 메모리 효율성: 30회 반복 조회 후 메모리 감소 (-41MB, 가비지 컬렉션 효과적)
- 데이터 정합성: 100명의 직원 최종평가를 정확히 조회 및 정렬
- 테스트 환경: 직원 100명, 최종평가 100건 (확정 77%, 미확정 23%)`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: '평가기간별 최종평가 목록 조회 성공',
      type: DashboardFinalEvaluationsByPeriodResponseDto,
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
    ApiNotFoundResponse({
      description: '평가기간을 찾을 수 없음',
    }),
  );
}

/**
 * 직원별 최종평가 목록 조회 API 데코레이터
 */
export function GetFinalEvaluationsByEmployee() {
  return applyDecorators(
    Get('employees/:employeeId/final-evaluations'),
    ApiOperation({
      summary: '직원별 최종평가 목록 조회',
      description: `특정 직원의 모든 평가기간에 대한 최종평가를 조회합니다.

**동작:**
- 직원 정보를 최상단에 한 번만 제공
- 각 평가기간별 최종평가 정보를 배열로 제공 (평가기간 정보 포함)
- 평가기간 시작일 내림차순으로 정렬 (최신순)
- startDate, endDate로 날짜 범위 필터링 가능 (평가기간 시작일 기준)
- 날짜 범위를 지정하지 않으면 모든 평가기간의 최종평가 조회



**테스트 케이스:**
- 직원의 모든 평가기간 최종평가 조회 성공
- 여러 직원의 최종평가 조회 (데이터 일관성 확인)
- 최종평가 시간순 정렬 확인 (평가기간 시작일 내림차순)
- startDate 필터: 특정 날짜 이후 평가만 조회
- endDate 필터: 특정 날짜 이전 평가만 조회
- startDate & endDate 필터: 특정 기간 내 평가만 조회
- 미래 날짜 필터: 빈 배열 반환
- 최종평가가 하나도 없는 직원 조회 (빈 배열 반환)
- 여러 평가기간에 걸친 평가 등급 분포 확인
- 평가 확정 상태 확인 (isConfirmed 필드)
- 존재하지 않는 직원 조회 시 404 에러
- 잘못된 UUID 형식으로 요청 시 400 에러
- 잘못된 날짜 형식으로 요청 시 400 에러
- 동시에 여러 직원 조회 성능 테스트 (5명, 2초 이내)`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: '조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD 형식)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: '조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD 형식)',
      type: String,
      example: '2024-12-31',
    }),
    ApiOkResponse({
      description: '직원별 최종평가 목록 조회 성공',
      type: EmployeeFinalEvaluationListResponseDto,
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
    ApiNotFoundResponse({
      description: '직원을 찾을 수 없음',
    }),
  );
}

/**
 * 전체 직원별 최종평가 목록 조회 API 데코레이터
 */
export function GetAllEmployeesFinalEvaluations() {
  return applyDecorators(
    Get('final-evaluations'),
    ApiOperation({
      summary: '전체 직원별 최종평가 목록 조회',
      description: `지정한 날짜 범위 내 평가기간의 모든 직원 최종평가를 조회합니다.

**동작:**
- 날짜 범위로 필터링된 평가기간 목록을 최상단에 제공 (시작일 내림차순)
- 각 직원별로 평가기간 순서에 맞는 최종평가 배열 제공 (사번 오름차순)
- 평가기간 배열과 최종평가 배열의 인덱스가 일치 (특정 평가기간에 평가 없으면 null)
- **조회하지 않기로 한 직원(isExcludedFromList=true)은 결과에서 자동 제외됨**
- 삭제된 최종평가는 조회되지 않음

**참고:** finalEvaluations 배열의 인덱스는 evaluationPeriods 배열의 인덱스와 일치합니다. 특정 평가기간에 평가가 없으면 해당 위치에 null이 들어갑니다.

**테스트 케이스:**
- 기본 조회: 모든 직원의 모든 평가기간 최종평가 조회 성공
- 기간 필터: startDate만 지정하여 해당 날짜 이후 평가기간 조회
- 기간 필터: endDate만 지정하여 해당 날짜 이전 평가기간 조회
- 기간 필터: startDate와 endDate 모두 지정하여 기간 범위 내 조회
- 평가기간 검증 (id, name, startDate, endDate 필드 포함)
- 직원 검증 (id, name, employeeNumber, email 필드 포함)
- 최종평가 정보 검증 (id, evaluationGrade, jobGrade, isConfirmed 등)
- 평가기간 시작일 내림차순 정렬 확인 (최신순)
- 직원 사번 오름차순 정렬 확인
- 배열 길이 일치 확인 (finalEvaluations 배열 길이 = evaluationPeriods 배열 길이)
- null 처리 확인 (평가가 없는 평가기간은 null)
- 전체 조회와 평가기간별 조회 결과 일관성 확인
- 직원별 조회와 전체 조회 결과 일관성 확인
- 잘못된 날짜 형식으로 요청 시 400 에러
- 응답 구조 검증 (evaluationPeriods와 employees 필드 포함)

**성능:**
- 초대용량 데이터 (100명 x 10개 평가기간): 평균 ~55ms (목표 5,000ms 대비 98.9% 빠름, 1.1% 달성) 🚀
- 연속 조회: 평균 48ms로 매우 안정적인 응답 속도 유지 (변동폭 8.3%)
- 병렬 조회: 5건 동시 조회 시 평균 29ms/요청으로 효율적 처리 (40% 성능 향상)
- 날짜 필터링: 31ms로 매우 빠른 응답 (1개 평가기간, 85명 조회)
- 메모리 효율성: 30회 반복 조회 후 66MB 증가로 안정적 (초대용량 데이터)
- 데이터 정합성: 100명 x 10개 평가기간 = 1,000건의 복잡한 매트릭스 정확히 조회
- 확장성: 평가기간 3개→10개 (3.3배) 증가 시 응답 시간 27ms→55ms (2배) 로 선형 이하 확장
- 테스트 환경: 직원 100명, 평가기간 10개 (2015-2024년), 매핑 1,000건, 최종평가 800건 (확정 71%, 미확정 29%, null 20%)`,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: '조회 시작일 (평가기간 시작일 기준, YYYY-MM-DD 형식)',
      type: String,
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: '조회 종료일 (평가기간 시작일 기준, YYYY-MM-DD 형식)',
      type: String,
      example: '2024-12-31',
    }),
    ApiOkResponse({
      description: '전체 직원별 최종평가 목록 조회 성공',
      type: AllEmployeesFinalEvaluationsResponseDto,
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (날짜 형식 오류 등)',
    }),
  );
}

/**
 * 직원의 평가 현황 및 할당 데이터 통합 조회 API 데코레이터
 */
export function GetEmployeeCompleteStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/complete-status'),
    ApiOperation({
      summary: '직원의 평가 현황 및 할당 데이터 통합 조회',
      description: `직원의 평가 진행 현황과 실제 할당 데이터를 한 번에 조회합니다.

**동작:**
- 평가기간 및 직원 기본 정보 제공
- 평가 대상 여부 및 제외 정보
- 평가라인, WBS 평가기준, 성과, 자기평가, 하향평가, 동료평가, 최종평가 상태
- 프로젝트별 WBS 목록 (평가기준, 성과, 자기평가, 하향평가 상세 내용 포함)
  * **취소된 프로젝트 할당(소프트 딜리트)은 자동으로 제외됨**
  * **취소된 프로젝트 할당에 속한 WBS는 자동으로 제외됨**
  * **WBS 평가기준의 isAdditional 필드 포함 (추가 과제 여부)**
- 중복 필드 제거로 최적화된 구조 제공

**기존 엔드포인트와의 차이:**
- /status + /assigned-data 두 엔드포인트를 하나로 통합
- 중복 필드 제거 (summary, editableStatus)
- 일관된 데이터 구조 (모든 평가 항목이 동일한 패턴)

**테스트 케이스:**
- 정상 조회: 유효한 평가기간과 직원ID로 통합 현황 조회
- 응답 구조 검증: 모든 필수 필드 포함 확인
- 데이터 일관성: status와 assigned-data 정보가 올바르게 통합됨
- 평가라인 정보: 평가자 정보가 포함되어 반환됨
- 프로젝트 카운트: totalCount와 items 배열 길이 일치
- 점수/등급 통합: 각 평가 항목에 점수와 등급이 포함됨
- 중복 제거 확인: summary, editableStatus 필드가 없음
- 미입력 제출 메시지 확인: content 없이 제출한 1차 하향평가의 "미입력 상태에서 제출하였습니다" 메시지 조회
- 미입력 제출 메시지 확인: content 없이 제출한 2차 하향평가의 "미입력 상태에서 제출하였습니다" 메시지 조회
- 404 에러: 존재하지 않는 평가기간/직원 조회
- 400 에러: 잘못된 UUID 형식`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '직원의 평가 현황 및 할당 데이터 통합 조회 성공',
      type: EmployeeCompleteStatusResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간에 등록되지 않은 직원 또는 평가기간을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}
