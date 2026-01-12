import { applyDecorators, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateEvaluationSubmissionDto } from '../../dto/evaluation-submission/update-evaluation-submission.dto';
import { UpdateEvaluationSubmissionResponseDto } from '../../dto/evaluation-submission/evaluation-submission-response.dto';

/**
 * 평가 제출 여부 변경 API 데코레이터
 */
export function UpdateEvaluationSubmission() {
  return applyDecorators(
    Patch(':evaluationType'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 제출 여부 변경',
      description: `**관리자용**: 평가기준, 자기평가, 1차평가, 2차평가의 제출 여부를 변경합니다.

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
