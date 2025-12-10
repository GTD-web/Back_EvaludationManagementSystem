import { applyDecorators, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CompleteRevisionRequestByEvaluatorDto } from '../../dto/revision-request/complete-revision-request-by-evaluator.dto';
import { CompleteRevisionRequestDto } from '../../dto/revision-request/complete-revision-request.dto';
import { RevisionRequestStepEnum } from '../../dto/revision-request/get-revision-requests-query.dto';
import {
  RevisionRequestResponseDto,
  UnreadCountResponseDto,
} from '../../dto/revision-request/revision-request-response.dto';

/**
 * 전체 재작성 요청 목록 조회 API 데코레이터 (관리자용)
 */
export function GetRevisionRequests() {
  return applyDecorators(
    Get(),
    ApiOperation({
      summary: '전체 재작성 요청 목록 조회',
      description: `**관리자용**: 시스템 내 모든 재작성 요청 목록을 조회합니다.

**동작:**
- 시스템 내 모든 재작성 요청을 수신자별로 조회
- 각 요청의 피평가자, 평가기간, 수신자 정보 포함
- 필터링 옵션을 통해 조건별 조회 가능

**필터링 옵션:**
- \`evaluationPeriodId\`: 특정 평가기간의 요청만 조회
- \`employeeId\`: 특정 피평가자의 요청만 조회
- \`requestedBy\`: 특정 요청자가 생성한 요청만 조회
- \`isRead\`: 읽음/읽지 않음 상태로 필터링
- \`isCompleted\`: 완료/미완료 상태로 필터링
- \`step\`: 특정 단계의 요청만 조회

**사용 시나리오:**
- 관리자가 전체 재작성 요청 현황 확인
- 특정 평가기간 또는 피평가자의 요청 조회
- 읽지 않거나 완료되지 않은 요청 모니터링

**테스트 케이스:**
- 정상 조회: 전체 재작성 요청 목록 반환
- 필터 적용: evaluationPeriodId로 특정 평가기간의 요청만 조회
- employeeId 필터: 특정 피평가자의 요청만 조회
- requestedBy 필터: 특정 요청자가 생성한 요청만 조회
- isRead 필터: isRead=true 또는 isRead=false로 읽음 상태 필터링
- isCompleted 필터: isCompleted=true 또는 isCompleted=false로 완료 상태 필터링
- 파라미터 미지정: isRead, isCompleted 미지정 시 모든 상태의 요청 반환
- 여러 필터 조합: 여러 필터를 동시에 적용하여 조회
- 빈 목록: 조건에 맞는 요청이 없는 경우 빈 배열 반환
- 잘못된 UUID 형식: employeeId가 UUID 형식이 아닌 경우 400 에러
- 잘못된 step 값: 유효하지 않은 step 값 입력 시 400 에러`,
    }),
    ApiQuery({
      name: 'evaluationPeriodId',
      required: false,
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'employeeId',
      required: false,
      description: '피평가자 ID (관리자용)',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'requestedBy',
      required: false,
      description: '요청자 ID (관리자용)',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'isRead',
      required: false,
      description:
        '읽음 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
      type: String,
      example: 'false',
    }),
    ApiQuery({
      name: 'isCompleted',
      required: false,
      description:
        '재작성 완료 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
      type: String,
      example: 'false',
    }),
    ApiQuery({
      name: 'step',
      required: false,
      description: '단계',
      enum: ['criteria', 'self', 'primary', 'secondary'],
    }),
    ApiOkResponse({
      description: '전체 재작성 요청 목록 조회 성공',
      type: [RevisionRequestResponseDto],
    }),
  );
}

/**
 * 내 재작성 요청 목록 조회 API 데코레이터
 */
export function GetMyRevisionRequests() {
  return applyDecorators(
    Get('me'),
    ApiOperation({
      summary: '내 재작성 요청 목록 조회',
      description: `**담당자용**: 내가 수신한 재작성 요청 목록을 조회합니다.

**수신자별 재작성 요청:**
- **피평가자**: 평가기준, 자기평가 재작성 요청
- **1차평가자**: 평가기준, 자기평가, 1차평가 재작성 요청
- **2차평가자**: 2차평가 재작성 요청

**필터링 옵션:**
- \`evaluationPeriodId\`: 특정 평가기간의 요청만 조회
- \`isRead\`: 읽음/읽지 않음 상태로 필터링
- \`isCompleted\`: 완료/미완료 상태로 필터링
- \`step\`: 특정 단계의 요청만 조회

**사용 시나리오:**
- 담당자가 자신의 재작성 요청 목록 확인
- 읽지 않은 요청만 필터링하여 조회
- 완료되지 않은 요청만 조회

**테스트 케이스:**
- 정상 조회: 내가 수신한 재작성 요청 목록 반환
- isRead 필터: isRead=false로 읽지 않은 요청만 조회
- isCompleted 필터: isCompleted=false로 미완료 요청만 조회
- 파라미터 미지정: isRead, isCompleted 미지정 시 모든 상태의 요청 반환
- 여러 필터 조합: isRead와 isCompleted를 동시에 필터링
- 빈 목록: 수신한 요청이 없는 경우 빈 배열 반환`,
    }),
    ApiQuery({
      name: 'evaluationPeriodId',
      required: false,
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'isRead',
      required: false,
      description:
        '읽음 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
      type: String,
      example: 'false',
    }),
    ApiQuery({
      name: 'isCompleted',
      required: false,
      description:
        '재작성 완료 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
      type: String,
      example: 'false',
    }),
    ApiQuery({
      name: 'step',
      required: false,
      description: '단계',
      enum: ['criteria', 'self', 'primary', 'secondary'],
    }),
    ApiOkResponse({
      description: '내 재작성 요청 목록 조회 성공',
      type: [RevisionRequestResponseDto],
    }),
  );
}

/**
 * 읽지 않은 재작성 요청 수 조회 API 데코레이터
 */
export function GetMyUnreadCount() {
  return applyDecorators(
    Get('me/unread-count'),
    ApiOperation({
      summary: '읽지 않은 재작성 요청 수 조회',
      description: `**담당자용**: 내가 수신한 읽지 않은 재작성 요청 수를 조회합니다.

**사용 시나리오:**
- 대시보드에 알림 뱃지 표시
- 읽지 않은 요청이 있는지 빠르게 확인

**테스트 케이스:**
- 정상 조회: 읽지 않은 재작성 요청 수 반환
- 읽지 않은 요청이 없는 경우: 0 반환`,
    }),
    ApiOkResponse({
      description: '읽지 않은 재작성 요청 수 조회 성공',
      type: UnreadCountResponseDto,
    }),
  );
}

/**
 * 재작성 요청 읽음 처리 API 데코레이터
 */
export function MarkRevisionRequestAsRead() {
  return applyDecorators(
    Patch(':id/read'),
    ApiOperation({
      summary: '재작성 요청 읽음 처리',
      description: `**담당자용**: 재작성 요청을 읽음 처리합니다.

**처리 내용:**
- \`isRead\` 상태를 \`true\`로 변경
- \`readAt\` 시간을 현재 시간으로 설정
- 읽지 않은 요청 수가 감소

**권한 확인:**
- 본인이 수신한 요청만 읽음 처리 가능
- 다른 사람의 요청 접근 시 403 에러

**사용 시나리오:**
- 담당자가 재작성 요청 내용 확인
- 읽음 상태로 자동 업데이트

**테스트 케이스:**
- 정상 읽음 처리: isRead=true, readAt 설정
- 이미 읽은 요청 재처리: 중복 처리 방지
- 다른 사람의 요청 읽음 시도: 403 에러
- 존재하지 않는 요청: 404 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '재작성 요청 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOkResponse({
      description: '재작성 요청 읽음 처리 성공',
    }),
    ApiNotFoundResponse({
      description: '재작성 요청을 찾을 수 없음',
    }),
    ApiForbiddenResponse({
      description: '해당 재작성 요청에 접근할 권한이 없음',
    }),
  );
}

/**
 * 재작성 완료 응답 제출 API 데코레이터
 */
export function CompleteRevisionRequest() {
  return applyDecorators(
    Patch(':id/complete'),
    ApiOperation({
      summary: '재작성 완료 응답 제출',
      description: `**담당자용**: 재작성 완료 응답을 제출합니다.

**처리 내용:**
- \`isCompleted\` 상태를 \`true\`로 변경
- \`completedAt\` 시간을 현재 시간으로 설정
- \`responseComment\`에 응답 코멘트 저장

**권한 확인:**
- 본인이 수신한 요청만 응답 가능
- 다른 사람의 요청 접근 시 403 에러

**제약 사항:**
- \`responseComment\`는 필수
- 이미 완료된 요청에는 재응답 불가 (400 에러)

**사용 시나리오:**
- 담당자가 재작성 작업 완료 후 응답 제출
- 관리자가 완료 상태 확인 가능

**테스트 케이스:**
- 정상 응답 제출: isCompleted=true, completedAt, responseComment 설정
- 응답 코멘트 누락: 400 에러
- 이미 완료된 요청에 재응답: 400 에러
- 다른 사람의 요청에 응답: 403 에러
- 존재하지 않는 요청: 404 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '재작성 요청 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: CompleteRevisionRequestDto,
      description: '재작성 완료 응답 정보',
    }),
    ApiOkResponse({
      description: '재작성 완료 응답 제출 성공',
    }),
    ApiNotFoundResponse({
      description: '재작성 요청을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 이미 완료된 요청, 응답 코멘트 누락)',
    }),
    ApiForbiddenResponse({
      description: '해당 재작성 요청에 접근할 권한이 없음',
    }),
  );
}

/**
 * 평가기간, 직원, 평가자 기반 재작성 완료 응답 제출 API 데코레이터 (관리자용)
 */
export function CompleteRevisionRequestByEvaluator() {
  return applyDecorators(
    Patch(':evaluationPeriodId/:employeeId/:evaluatorId/complete'),
    ApiOperation({
      summary: '재작성 완료 응답 제출 (평가기간/직원/평가자 기반)',
      description: `**관리자용**: 평가기간, 직원, 평가자 ID를 기반으로 재작성 완료 응답을 제출합니다.

**처리 내용:**
- 평가기간, 직원, 평가자 ID로 재작성 요청 조회
- 해당 평가자에게 전송된 재작성 요청의 완료 응답 처리
- \`isCompleted\` 상태를 \`true\`로 변경
- \`completedAt\` 시간을 현재 시간으로 설정
- \`responseComment\`에 응답 코멘트 저장

**특징:**
- 2차 평가의 경우, 모든 평가자에게 전송된 모든 재작성 요청이 완료되었을 때만 단계 승인 상태 변경
- 관리자가 특정 평가자의 재작성 요청을 대신 완료 처리 가능

**사용 시나리오:**
- 관리자가 특정 평가기간의 특정 평가자에게 온 재작성 요청을 완료 처리
- 2차 평가자별로 개별 재작성 요청을 관리할 때 유용

**테스트 케이스:**
- 정상 응답 제출: 평가기간, 직원, 평가자 ID로 재작성 요청 찾아 완료 처리
- 2차 평가자별 처리: 여러 2차 평가자 중 특정 평가자만 완료 처리
- 모든 평가자 완료 시: 모든 2차 평가자가 완료되면 단계 승인 상태 변경
- 재작성 요청 없음: 해당 조건의 재작성 요청이 없을 때 404 에러
- 평가자 매칭 실패: 해당 평가자에게 전송된 재작성 요청이 없을 때 404 에러
- 응답 코멘트 누락: 400 에러
- 이미 완료된 요청: 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '피평가자 ID (직원 ID)',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'step',
      description: '재작성 요청 단계',
      enum: RevisionRequestStepEnum,
      required: true,
      example: RevisionRequestStepEnum.SECONDARY,
    }),
    ApiBody({
      type: CompleteRevisionRequestByEvaluatorDto,
      description: '재작성 완료 응답 정보 (responseComment만 포함)',
    }),
    ApiOkResponse({
      description: '재작성 완료 응답 제출 성공',
    }),
    ApiNotFoundResponse({
      description: '재작성 요청을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description:
        '잘못된 요청 (예: 이미 완료된 요청, 응답 코멘트 누락, 잘못된 UUID 형식)',
    }),
  );
}
