import { applyDecorators, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EvaluationCriteriaSubmissionResponseDto, SubmitEvaluationCriteriaDto } from '../../dto/evaluation-criteria/wbs-evaluation-criteria.dto';
import { UpdateEvaluationSubmissionResponseDto } from '../../dto/evaluation-submission/evaluation-submission-response.dto';
import { UpdateEvaluationSubmissionDto } from '../../dto/evaluation-submission/update-evaluation-submission.dto';
import { SubmitDownwardEvaluationDto } from '../../dto/performance-evaluation/downward-evaluation.dto';
import { SubmitAllWbsSelfEvaluationsResponseDto } from '../../dto/performance-evaluation/wbs-self-evaluation.dto';

/**
 * 평가 제출 여부 변경 API 데코레이터
 * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다.
 */
export function UpdateEvaluationSubmission() {
  return applyDecorators(
    Patch(':evaluationType'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 제출 여부 변경 (Deprecated)',
      deprecated: true,
      description: `**⚠️ Deprecated**: 이 엔드포인트는 더 이상 사용되지 않습니다. 대신 각 평가 타입별 제출 엔드포인트를 사용하세요.

**대체 엔드포인트:**
- 평가기준: \`POST /admin/evaluation-submission/criteria\`
- 자기평가: \`POST /admin/evaluation-submission/self-evaluation/:employeeId/:periodId\`
- 1차 하향평가: \`POST /admin/evaluation-submission/primary-downward/:evaluateeId/:periodId/:wbsId\`
- 2차 하향평가: \`POST /admin/evaluation-submission/secondary-downward/:evaluateeId/:periodId/:wbsId\`

---

**관리자용**: 평가기준, 자기평가, 1차평가, 2차평가의 제출 여부를 변경합니다.

**평가 타입:**
- \`criteria\`: 평가기준 제출 여부 변경
- \`self-evaluation\`: 자기평가 제출 여부 변경 (submittedToEvaluator와 submittedToManager 모두 변경)
- \`primary-downward\`: 1차 하향평가 제출 여부 변경 (모든 WBS 처리)
- \`secondary-downward\`: 2차 하향평가 제출 여부 변경 (해당 평가자가 담당하는 WBS만 처리)

**주의사항:**
- 이 엔드포인트는 제출 여부만 변경하며, 단계 승인 상태는 변경하지 않습니다.
- 평가기준, 자기평가, 1차평가는 모든 WBS에 대해 일괄 처리됩니다.
- 2차 하향평가는 해당 평가자에게 할당된 WBS만 자동으로 처리됩니다.
- 자기평가는 submittedToEvaluator와 submittedToManager를 모두 변경합니다.

**테스트 케이스:**
- 평가기준 제출 여부 변경: isCriteriaSubmitted 필드 변경 확인
- 자기평가 제출 여부 변경: submittedToEvaluator와 submittedToManager 모두 변경 확인
- 1차 하향평가 제출 여부 변경: 모든 WBS의 isCompleted 필드 변경 확인
- 2차 하향평가 제출 여부 변경: 할당된 WBS만 isCompleted 필드 변경 확인
- 잘못된 evaluationType: 유효하지 않은 평가 타입 입력 시 400 에러
- 필수 필드 누락: employeeId, periodId, isSubmitted 누락 시 400 에러
- 2차 하향평가에서 evaluatorId 누락: evaluatorId 누락 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationType',
      description: '평가 타입',
      enum: ['criteria', 'self-evaluation', 'primary-downward', 'secondary-downward'],
      example: 'criteria',
    }),
    ApiBody({
      type: UpdateEvaluationSubmissionDto,
      description: '평가 제출 여부 업데이트 정보',
    }),
    ApiOkResponse({
      description: '평가 제출 여부 변경 성공',
      type: UpdateEvaluationSubmissionResponseDto,
    }),
    ApiNotFoundResponse({
      description: '리소스를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 필수 필드 누락, 잘못된 평가 타입)',
    }),
  );
}

/**
 * 평가기준 제출 API 데코레이터
 */
export function SubmitCriteriaEvaluation() {
  return applyDecorators(
    Post('criteria'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기준 제출',
      description: `**관리자용**: 평가기준을 제출합니다. 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.

**동작:**
- 평가기준 제출 상태를 true로 변경
- 재작성 요청이 있으면 자동 완료 처리
- 단계 승인 상태(criteriaSettingStatus)를 approved로 자동 변경
- 제출 일시와 제출 처리자 정보 저장

**테스트 케이스:**
- 평가기준 제출: 제출 성공 및 승인 상태 변경 확인
- 재작성 요청 자동 완료: 재작성 요청이 있으면 자동 완료 처리 확인
- 승인 상태 자동 변경: criteriaSettingStatus가 approved로 변경 확인
- 잘못된 UUID: 잘못된 UUID 형식의 evaluationPeriodId 또는 employeeId 입력 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }),
    ApiBody({
      type: SubmitEvaluationCriteriaDto,
      description: '평가기준 제출 정보',
    }),
    ApiOkResponse({
      description: '평가기준 제출 성공',
      type: EvaluationCriteriaSubmissionResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 필수 필드 누락)',
    }),
  );
}

/**
 * 자기평가 제출 API 데코레이터
 */
export function SubmitSelfEvaluation() {
  return applyDecorators(
    Post('self-evaluation/:employeeId/:periodId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '자기평가 제출',
      description: `**관리자용**: 특정 직원의 전체 WBS 자기평가를 제출합니다. 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.

**동작:**
- 직원의 모든 WBS 자기평가를 관리자에게 제출
- 재작성 요청이 있으면 자동 완료 처리
- 단계 승인 상태(selfEvaluationStatus)를 approved로 자동 변경
- 제출 일시와 제출 처리자 정보 저장

**테스트 케이스:**
- 자기평가 제출: 제출 성공 및 승인 상태 변경 확인
- 재작성 요청 자동 완료: 재작성 요청이 있으면 자동 완료 처리 확인
- 승인 상태 자동 변경: selfEvaluationStatus가 approved로 변경 확인
- 잘못된 UUID: 잘못된 UUID 형식의 employeeId 또는 periodId 입력 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOkResponse({
      description: '자기평가 제출 성공',
      type: SubmitAllWbsSelfEvaluationsResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 필수 필드 누락)',
    }),
  );
}

/**
 * 1차 하향평가 제출 API 데코레이터
 */
export function SubmitPrimaryDownwardEvaluation() {
  return applyDecorators(
    Post('primary-downward/:evaluateeId/:periodId/:wbsId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 제출',
      description: `**관리자용**: 1차 하향평가를 제출합니다. 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.

**동작:**
- 1차 하향평가 제출 상태를 완료로 변경
- 재작성 요청이 있으면 자동 완료 처리
- 단계 승인 상태(primaryEvaluationStatus)를 approved로 자동 변경
- approveAllBelow=true일 경우 하위 단계(평가기준, 자기평가)도 함께 승인
- 제출 일시와 제출 처리자 정보 저장

**테스트 케이스:**
- 1차 하향평가 제출: 제출 성공 및 승인 상태 변경 확인
- 재작성 요청 자동 완료: 재작성 요청이 있으면 자동 완료 처리 확인
- 승인 상태 자동 변경: primaryEvaluationStatus가 approved로 변경 확인
- 하위 단계 승인: approveAllBelow=true일 경우 평가기준, 자기평가도 승인 확인
- 잘못된 UUID: 잘못된 UUID 형식의 evaluateeId, periodId, wbsId 입력 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'wbsId',
      description: 'WBS ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'approveAllBelow',
      required: false,
      description: '하위 단계 자동 승인 여부 (기본값: false). true일 경우 평가기준, 자기평가도 함께 승인합니다.',
      type: Boolean,
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '1차 하향평가 제출 정보',
    }),
    ApiOkResponse({
      description: '1차 하향평가 제출 성공',
    }),
    ApiNotFoundResponse({
      description: '평가를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 필수 필드 누락)',
    }),
  );
}

/**
 * 2차 하향평가 제출 API 데코레이터
 */
export function SubmitSecondaryDownwardEvaluation() {
  return applyDecorators(
    Post('secondary-downward/:evaluateeId/:periodId/:wbsId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 제출',
      description: `**관리자용**: 2차 하향평가를 제출합니다. 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.

**동작:**
- 2차 하향평가 제출 상태를 완료로 변경
- 재작성 요청이 있으면 자동 완료 처리
- 해당 평가자의 단계 승인 상태(secondaryEvaluationStatus)를 approved로 자동 변경
- approveAllBelow=true일 경우 하위 단계(평가기준, 자기평가, 1차평가)도 함께 승인
- 제출 일시와 제출 처리자 정보 저장

**테스트 케이스:**
- 2차 하향평가 제출: 제출 성공 및 승인 상태 변경 확인
- 재작성 요청 자동 완료: 재작성 요청이 있으면 자동 완료 처리 확인
- 승인 상태 자동 변경: 해당 평가자의 secondaryEvaluationStatus가 approved로 변경 확인
- 하위 단계 승인: approveAllBelow=true일 경우 평가기준, 자기평가, 1차평가도 승인 확인
- 잘못된 UUID: 잘못된 UUID 형식의 evaluateeId, periodId, wbsId 입력 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'wbsId',
      description: 'WBS ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'approveAllBelow',
      required: false,
      description: '하위 단계 자동 승인 여부 (기본값: false). true일 경우 평가기준, 자기평가, 1차평가도 함께 승인합니다.',
      type: Boolean,
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '2차 하향평가 제출 정보',
    }),
    ApiOkResponse({
      description: '2차 하향평가 제출 성공',
    }),
    ApiNotFoundResponse({
      description: '평가를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 필수 필드 누락)',
    }),
  );
}
