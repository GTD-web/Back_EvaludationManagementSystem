"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCriteriaStepApproval = UpdateCriteriaStepApproval;
exports.UpdateSelfStepApproval = UpdateSelfStepApproval;
exports.UpdatePrimaryStepApproval = UpdatePrimaryStepApproval;
exports.UpdateSecondaryStepApproval = UpdateSecondaryStepApproval;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const update_step_approval_dto_1 = require("../../dto/step-approval/update-step-approval.dto");
const update_secondary_step_approval_dto_1 = require("../../dto/step-approval/update-secondary-step-approval.dto");
const update_secondary_step_approval_response_dto_1 = require("../../dto/step-approval/update-secondary-step-approval-response.dto");
function UpdateCriteriaStepApproval() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/employees/:employeeId/criteria'), (0, swagger_1.ApiOperation)({
        summary: '평가기준 설정 단계 승인 상태 변경',
        description: `**관리자용**: 특정 직원의 평가기준 설정 단계 승인 상태를 변경합니다.

**동작:**
- 평가기준 설정 단계의 승인 상태를 변경합니다
- 상태가 \`revision_requested\`인 경우 평가기준 설정에 대한 재작성 요청만 생성됩니다
- 재작성 요청은 피평가자 + 1차평가자에게 전송됩니다
- 다른 평가 단계(자기평가, 1차/2차 하향평가)에는 영향을 주지 않습니다

**승인 상태:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)
- \`revision_completed\`: 재작성 완료 (재작성 완료 응답 제출 시 자동 변경, 이 API로 직접 설정 불가)

**테스트 케이스:**
- 평가기준 설정을 approved로 변경: 평가기준 설정 상태가 approved로 변경됨
- 평가기준 설정을 revision_requested로 변경하고 재작성 요청 생성: 상태 변경 및 재작성 요청 생성 확인 (평가기준만)
- 평가기준 설정을 pending으로 변경: 평가기준 설정 상태가 pending으로 변경됨
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- 필수 필드 status 누락: status 필드 누락 시 400 에러
- 잘못된 status 값: 유효하지 않은 status 값 입력 시 400 에러
- revisionComment 누락: revision_requested 상태인데 revisionComment 누락 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluationPeriodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: update_step_approval_dto_1.UpdateStepApprovalDto,
        description: '평가기준 설정 단계 승인 상태 업데이트 정보',
    }), (0, swagger_1.ApiOkResponse)({
        description: '평가기준 설정 단계 승인 상태 변경 성공',
    }), (0, swagger_1.ApiNotFoundResponse)({
        description: '평가기간-직원 맵핑을 찾을 수 없음',
    }), (0, swagger_1.ApiBadRequestResponse)({
        description: '잘못된 요청 (예: 재작성 요청 시 코멘트 누락)',
    }));
}
function UpdateSelfStepApproval() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/employees/:employeeId/self'), (0, swagger_1.ApiOperation)({
        summary: '자기평가 단계 승인 상태 변경',
        description: `**관리자용**: 특정 직원의 자기평가 단계 승인 상태를 변경합니다.

**동작:**
- 자기평가 단계의 승인 상태를 변경합니다
- 상태가 \`revision_requested\`인 경우 재작성 요청이 자동으로 생성됩니다
- 재작성 요청은 피평가자 + 1차평가자에게 전송됩니다

**승인 상태:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)
- \`revision_completed\`: 재작성 완료 (재작성 완료 응답 제출 시 자동 변경, 이 API로 직접 설정 불가)

**테스트 케이스:**
- 자기평가를 approved로 변경: 자기평가 상태가 approved로 변경됨
- 자기평가를 revision_requested로 변경: 자기평가 상태가 revision_requested로 변경됨
- 자기평가를 pending으로 변경: 자기평가 상태가 pending으로 변경됨
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- 필수 필드 status 누락: status 필드 누락 시 400 에러
- 잘못된 status 값: 유효하지 않은 status 값 입력 시 400 에러
- revisionComment 누락: revision_requested 상태인데 revisionComment 누락 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluationPeriodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: update_step_approval_dto_1.UpdateStepApprovalDto,
        description: '자기평가 단계 승인 상태 업데이트 정보',
    }), (0, swagger_1.ApiOkResponse)({
        description: '자기평가 단계 승인 상태 변경 성공',
    }), (0, swagger_1.ApiNotFoundResponse)({
        description: '평가기간-직원 맵핑을 찾을 수 없음',
    }), (0, swagger_1.ApiBadRequestResponse)({
        description: '잘못된 요청 (예: 재작성 요청 시 코멘트 누락)',
    }));
}
function UpdatePrimaryStepApproval() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/employees/:employeeId/primary'), (0, swagger_1.ApiOperation)({
        summary: '1차 하향평가 단계 승인 상태 변경',
        description: `**관리자용**: 특정 직원의 1차 하향평가 단계 승인 상태를 변경합니다.

**동작:**
- 1차 하향평가 단계의 승인 상태를 변경합니다
- 상태가 \`revision_requested\`인 경우 재작성 요청이 자동으로 생성됩니다
- 재작성 요청은 1차평가자에게 전송됩니다

**승인 상태:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)
- \`revision_completed\`: 재작성 완료 (재작성 완료 응답 제출 시 자동 변경, 이 API로 직접 설정 불가)

**테스트 케이스:**
- 1차 하향평가를 approved로 변경: 1차 하향평가 상태가 approved로 변경됨
- 1차 하향평가를 revision_requested로 변경: 1차 하향평가 상태가 revision_requested로 변경됨
- 1차 하향평가를 pending으로 변경: 1차 하향평가 상태가 pending으로 변경됨
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- 필수 필드 status 누락: status 필드 누락 시 400 에러
- 잘못된 status 값: 유효하지 않은 status 값 입력 시 400 에러
- revisionComment 누락: revision_requested 상태인데 revisionComment 누락 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluationPeriodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: update_step_approval_dto_1.UpdateStepApprovalDto,
        description: '1차 하향평가 단계 승인 상태 업데이트 정보',
    }), (0, swagger_1.ApiOkResponse)({
        description: '1차 하향평가 단계 승인 상태 변경 성공',
    }), (0, swagger_1.ApiNotFoundResponse)({
        description: '평가기간-직원 맵핑을 찾을 수 없음',
    }), (0, swagger_1.ApiBadRequestResponse)({
        description: '잘못된 요청 (예: 재작성 요청 시 코멘트 누락)',
    }));
}
function UpdateSecondaryStepApproval() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':evaluationPeriodId/employees/:employeeId/secondary/:evaluatorId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '2차 하향평가 단계 승인 상태 변경 (평가자별)',
        description: `**관리자용**: 특정 직원의 2차 하향평가 단계 승인 상태를 특정 평가자 기준으로 변경합니다.

**동작:**
- 2차 하향평가 단계의 승인 상태를 특정 평가자 기준으로 변경합니다
- 상태가 \`revision_requested\`인 경우 재작성 요청이 자동으로 생성됩니다
- 재작성 요청은 지정된 평가자에게만 전송됩니다 (평가자별 부분 처리)

**승인 상태:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)
- \`revision_completed\`: 재작성 완료 (재작성 완료 응답 제출 시 자동 변경, 이 API로 직접 설정 불가)

**테스트 케이스:**
- 2차 하향평가를 approved로 변경: 2차 하향평가 상태가 approved로 변경됨
- 2차 하향평가를 revision_requested로 변경: 2차 하향평가 상태가 revision_requested로 변경됨 (특정 평가자에게만 재작성 요청 전송)
- 2차 하향평가를 pending으로 변경: 2차 하향평가 상태가 pending으로 변경됨
- 잘못된 evaluationPeriodId UUID 형식: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 employeeId UUID 형식: UUID 형식이 아닌 직원 ID 입력 시 400 에러
- 잘못된 evaluatorId UUID 형식: UUID 형식이 아닌 평가자 ID 입력 시 400 에러
- 필수 필드 status 누락: status 필드 누락 시 400 에러
- 잘못된 status 값: 유효하지 않은 status 값 입력 시 400 에러
- revisionComment 누락: revision_requested 상태인데 revisionComment 누락 시 400 에러
- 존재하지 않는 리소스: 존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러
- 존재하지 않는 평가자: 존재하지 않는 평가자 ID로 요청 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluationPeriodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiParam)({
        name: 'evaluatorId',
        description: '평가자 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: update_secondary_step_approval_dto_1.UpdateSecondaryStepApprovalDto,
        description: '2차 하향평가 단계 승인 상태 업데이트 정보',
    }), (0, swagger_1.ApiOkResponse)({
        description: '2차 하향평가 단계 승인 상태 변경 성공',
        type: update_secondary_step_approval_response_dto_1.UpdateSecondaryStepApprovalResponseDto,
    }), (0, swagger_1.ApiNotFoundResponse)({
        description: '평가기간-직원 맵핑 또는 평가자를 찾을 수 없음',
    }), (0, swagger_1.ApiBadRequestResponse)({
        description: '잘못된 요청 (예: 재작성 요청 시 코멘트 누락)',
    }));
}
//# sourceMappingURL=step-approval-api.decorators.js.map