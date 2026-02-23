import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateRevisionRequestDto } from '../../dto/step-approval/create-revision-request.dto';

/**
 * 평가기준 설정 재작성 요청 API 데코레이터
 */
export function RequestCriteriaRevision() {
  return applyDecorators(
    Post(':evaluationPeriodId/employees/:employeeId/criteria'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기준 설정 재작성 요청',
      description: `**관리자용**: 특정 직원의 평가기준 설정에 대한 재작성 요청을 생성합니다.

**동작:**
- 평가기준 설정 단계에 대한 재작성 요청을 생성합니다
- 재작성 요청은 피평가자 + 1차평가자에게 전송됩니다
- 평가기준 제출 상태가 초기화됩니다
- 재작성 요청 생성 시 알림은 전송되지 않습니다

**테스트 케이스:**
- 평가기준 재작성 요청 생성: 재작성 요청 생성 및 제출 상태 초기화 확인
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- revisionComment 누락: revisionComment 필드 누락 시 400 에러
- revisionComment 빈 문자열: revisionComment가 빈 문자열인 경우 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: CreateRevisionRequestDto,
      description: '재작성 요청 정보',
    }),
    ApiOkResponse({
      description: '평가기준 설정 재작성 요청 생성 성공',
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 재작성 요청 코멘트 누락)',
    }),
  );
}

/**
 * 자기평가 재작성 요청 API 데코레이터
 */
export function RequestSelfRevision() {
  return applyDecorators(
    Post(':evaluationPeriodId/employees/:employeeId/self'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '자기평가 재작성 요청',
      description: `**관리자용**: 특정 직원의 자기평가에 대한 재작성 요청을 생성합니다.

**동작:**
- 자기평가 단계에 대한 재작성 요청을 생성합니다
- 재작성 요청은 피평가자 + 1차평가자에게 전송됩니다
- 자기평가 제출 상태가 초기화됩니다
- 재작성 요청 생성 시 알림은 전송되지 않습니다

**테스트 케이스:**
- 자기평가 재작성 요청 생성: 재작성 요청 생성 및 제출 상태 초기화 확인
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- revisionComment 누락: revisionComment 필드 누락 시 400 에러
- revisionComment 빈 문자열: revisionComment가 빈 문자열인 경우 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: CreateRevisionRequestDto,
      description: '재작성 요청 정보',
    }),
    ApiOkResponse({
      description: '자기평가 재작성 요청 생성 성공',
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 재작성 요청 코멘트 누락)',
    }),
  );
}

/**
 * 1차 하향평가 재작성 요청 API 데코레이터
 */
export function RequestPrimaryRevision() {
  return applyDecorators(
    Post(':evaluationPeriodId/employees/:employeeId/primary'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 재작성 요청',
      description: `**관리자용**: 특정 직원의 1차 하향평가에 대한 재작성 요청을 생성합니다.

**동작:**
- 1차 하향평가 단계에 대한 재작성 요청을 생성합니다
- 재작성 요청은 1차평가자에게 전송됩니다
- 1차 하향평가 제출 상태가 초기화됩니다
- 재작성 요청 생성 시 알림은 전송되지 않습니다

**테스트 케이스:**
- 1차 하향평가 재작성 요청 생성: 재작성 요청 생성 및 제출 상태 초기화 확인
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- revisionComment 누락: revisionComment 필드 누락 시 400 에러
- revisionComment 빈 문자열: revisionComment가 빈 문자열인 경우 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: CreateRevisionRequestDto,
      description: '재작성 요청 정보',
    }),
    ApiOkResponse({
      description: '1차 하향평가 재작성 요청 생성 성공',
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 재작성 요청 코멘트 누락)',
    }),
  );
}

/**
 * 2차 하향평가 재작성 요청 API 데코레이터 (평가자별)
 */
export function RequestSecondaryRevision() {
  return applyDecorators(
    Post(':evaluationPeriodId/employees/:employeeId/secondary/:evaluatorId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 재작성 요청 (평가자별)',
      description: `**관리자용**: 특정 직원의 2차 하향평가에 대한 재작성 요청을 특정 평가자 기준으로 생성합니다.

**동작:**
- 2차 하향평가 단계에 대한 재작성 요청을 특정 평가자 기준으로 생성합니다
- 재작성 요청은 지정된 평가자에게만 전송됩니다 (평가자별 부분 처리)
- 해당 평가자의 2차 하향평가 제출 상태가 초기화됩니다
- 재작성 요청 생성 시 알림은 전송되지 않습니다

**테스트 케이스:**
- 2차 하향평가 재작성 요청 생성: 재작성 요청 생성 및 제출 상태 초기화 확인 (특정 평가자에게만)
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- 잘못된 evaluatorId UUID 형식: UUID 형식이 아닌 평가자 ID 입력 시 400 에러
- revisionComment 누락: revisionComment 필드 누락 시 400 에러
- revisionComment 빈 문자열: revisionComment가 빈 문자열인 경우 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러
- 존재하지 않는 평가자: 존재하지 않는 평가자 ID로 요청 시 404 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: CreateRevisionRequestDto,
      description: '재작성 요청 정보',
    }),
    ApiOkResponse({
      description: '2차 하향평가 재작성 요청 생성 성공',
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑 또는 평가자를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 재작성 요청 코멘트 누락)',
    }),
  );
}
