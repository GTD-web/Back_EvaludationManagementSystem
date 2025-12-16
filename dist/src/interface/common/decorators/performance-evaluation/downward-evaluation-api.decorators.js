"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertPrimaryDownwardEvaluation = UpsertPrimaryDownwardEvaluation;
exports.UpsertSecondaryDownwardEvaluation = UpsertSecondaryDownwardEvaluation;
exports.UpdateDownwardEvaluation = UpdateDownwardEvaluation;
exports.SubmitPrimaryDownwardEvaluation = SubmitPrimaryDownwardEvaluation;
exports.SubmitSecondaryDownwardEvaluation = SubmitSecondaryDownwardEvaluation;
exports.SubmitDownwardEvaluation = SubmitDownwardEvaluation;
exports.BulkSubmitDownwardEvaluations = BulkSubmitDownwardEvaluations;
exports.ResetPrimaryDownwardEvaluation = ResetPrimaryDownwardEvaluation;
exports.ResetSecondaryDownwardEvaluation = ResetSecondaryDownwardEvaluation;
exports.BulkResetDownwardEvaluations = BulkResetDownwardEvaluations;
exports.GetEvaluatorDownwardEvaluations = GetEvaluatorDownwardEvaluations;
exports.GetDownwardEvaluationDetail = GetDownwardEvaluationDetail;
const downward_evaluation_types_1 = require("../../../../domain/core/downward-evaluation/downward-evaluation.types");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const downward_evaluation_dto_1 = require("../../dto/performance-evaluation/downward-evaluation.dto");
function UpsertPrimaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '1차 하향평가 저장',
        description: `**중요**: 1차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, wbsId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다.

**동작:**
- 평가자가 피평가자에 대한 1차 하향평가를 작성
- 동일 조건의 평가가 있으면 수정(UPDATE), 없으면 생성(INSERT)
- 평가 내용, 점수, 자기평가 연결 등을 저장
- 신규 생성 시 isCompleted는 false로 초기화
- 평가라인 권한 검증 (1차 평가자만 저장 가능)

**테스트 케이스:**
- 신규 1차 하향평가 생성
- 기존 1차 하향평가 수정 (Upsert)
- 자기평가 ID를 포함하여 생성
- 평가 내용 없이 생성 가능
- 다양한 평가 점수 저장 (1, 5, 10, 50, 100, 120)
- 동일한 평가를 여러 번 수정 가능
- 모든 필드 생략 시 400 에러
- 평가 점수가 숫자가 아닐 때 400 에러
- 평가 점수가 음수일 때 400 에러
- 평가 점수가 0일 때 400 에러
- 평가 점수가 소수일 때 400 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 wbsId로 요청 시 400 에러
- 잘못된 형식의 evaluatorId로 요청 시 400 에러
- 평가 내용이 문자열이 아닐 때 400 에러
- 1차 평가라인에 지정되지 않은 평가자는 저장 불가 (403 에러)
- 응답에 id와 message 필드 포함
- 신규 생성 시 isCompleted는 false
- 하향평가 저장 시 evaluationDate 설정
- 경로 파라미터 정보가 올바르게 저장
- 동일 조건의 중복 평가는 Upsert 방식으로 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.CreatePrimaryDownwardEvaluationBodyDto,
        description: '1차 하향평가 생성 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '1차 하향평가가 성공적으로 저장되었습니다.',
        type: downward_evaluation_dto_1.DownwardEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '피평가자, 평가기간 또는 WBS를 찾을 수 없습니다.',
    }));
}
function UpsertSecondaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '2차 하향평가 저장',
        description: `**중요**: 2차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, wbsId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다. 1차 하향평가와 독립적으로 관리됩니다.

**동작:**
- 평가자가 피평가자에 대한 2차 하향평가를 작성
- 동일 조건의 평가가 있으면 수정(UPDATE), 없으면 생성(INSERT)
- 1차 하향평가와 독립적으로 관리
- 평가 내용, 점수, 자기평가 연결 등을 저장
- 신규 생성 시 isCompleted는 false로 초기화
- 평가라인 권한 검증 (2차 평가자만 저장 가능)

**테스트 케이스:**
- 신규 2차 하향평가 생성
- 기존 2차 하향평가 수정 (Upsert)
- 1차와 2차 하향평가를 별도로 생성 가능
- 자기평가 ID를 포함하여 생성
- 모든 필드 생략 시 400 에러
- 평가 점수가 숫자가 아닐 때 400 에러
- 평가 점수가 음수일 때 400 에러
- 평가 점수가 0일 때 400 에러
- 평가 점수가 소수일 때 400 에러
- 2차 평가라인에 지정되지 않은 평가자는 저장 불가 (403 에러)
- 응답에 id와 message 필드 포함`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.CreateSecondaryDownwardEvaluationBodyDto,
        description: '2차 하향평가 생성 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '2차 하향평가가 성공적으로 저장되었습니다.',
        type: downward_evaluation_dto_1.DownwardEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '피평가자, 평가기간 또는 WBS를 찾을 수 없습니다.',
    }));
}
function UpdateDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Put)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '하향평가 수정',
        description: '기존 하향평가를 수정합니다.',
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.UpdateDownwardEvaluationDto,
        description: '하향평가 수정 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하향평가가 성공적으로 수정되었습니다.',
        type: downward_evaluation_dto_1.DownwardEvaluationBasicDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '하향평가를 찾을 수 없습니다.',
    }));
}
function SubmitPrimaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '1차 하향평가 제출',
        description: `**중요**: 1차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다. **평가가 존재하지 않으면 자동으로 생성한 후 제출합니다.**

**동작:**
- 평가라인 매핑에서 실제 할당된 1차 평가자 ID를 조회하여 사용
- 평가자, 피평가자, 평가기간, WBS로 1차 하향평가 조회
- 평가가 없으면 자동으로 생성
- content가 비어있으면 "[제출자명]님이 미입력 상태에서 제출하였습니다" 기본 메시지 생성
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 제출 후 평가 내용은 변경 불가
- approveAllBelow=true(기본값)일 경우 평가기준, 자기평가, 1차평가를 모두 승인(approved)
- content와 score가 없어도 제출 가능 (기본 메시지로 인사담당자에게 제출됨)

**테스트 케이스:**
- 저장된 1차 하향평가를 제출할 수 있어야 함
- 평가가 없어도 자동 생성 후 제출 가능
- 제출 시 isCompleted가 true로 변경
- 제출 시 단계 승인 상태(primaryEvaluationStatus)가 approved로 변경 (기본값)
- approveAllBelow=false로 명시 시 pending으로 변경됨
- 관리자가 approved로 변경한 후 reset하고 재제출하면 approved로 변경됨
- submittedBy 없이도 제출 가능
- approveAllBelow=true(기본값)일 경우 평가기준, 자기평가도 함께 승인됨
- approveAllBelow=false일 경우 평가기준, 자기평가는 승인되지 않음
- content와 score가 없어도 제출 가능
- content 없이 제출하면 "[제출자명]님이 미입력 상태에서 제출하였습니다" 기본 메시지 생성
- 이미 저장된 평가를 content 없이 제출하면 기본 메시지로 업데이트
- 통합 조회 API에서 미입력 메시지가 정상적으로 조회됨
- 이미 제출된 평가를 재제출하면 409 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 wbsId로 요청 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiQuery)({
        name: 'approveAllBelow',
        required: false,
        description: '하위 단계 자동 승인 여부 (기본값: true). true일 경우 평가기준, 자기평가, 1차평가를 모두 승인합니다.',
        type: String,
        example: 'true',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '1차 하향평가 제출 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '1차 하향평가가 성공적으로 제출되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '1차 하향평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 제출된 1차 하향평가입니다.',
    }));
}
function SubmitSecondaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '2차 하향평가 제출',
        description: `**중요**: 2차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다. 1차 하향평가와 독립적으로 제출됩니다. **평가가 존재하지 않으면 자동으로 생성한 후 제출합니다.**

**동작:**
- 평가라인 매핑에서 실제 할당된 2차 평가자 ID를 조회하여 사용 (WBS별)
- 평가자, 피평가자, 평가기간, WBS로 2차 하향평가 조회
- 평가가 없으면 자동으로 생성
- content가 비어있으면 "[제출자명]님이 미입력 상태에서 제출하였습니다" 기본 메시지 생성
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 1차 하향평가와 독립적으로 제출
- 제출 후 평가 내용은 변경 불가
- approveAllBelow=true(기본값)일 경우 평가기준, 자기평가, 1차평가, 2차평가를 모두 승인(approved)
- content와 score가 없어도 제출 가능 (기본 메시지로 인사담당자에게 제출됨)

**테스트 케이스:**
- 저장된 2차 하향평가를 제출할 수 있어야 함
- 평가가 없어도 자동 생성 후 제출 가능
- 제출 시 단계 승인 상태(secondaryEvaluationStatus)가 approved로 변경 (기본값)
- 1차와 2차 하향평가를 독립적으로 제출 가능
- approveAllBelow=false로 명시 시 pending으로 변경됨
- 관리자가 approved로 변경한 후 reset하고 재제출하면 approved로 변경됨
- approveAllBelow=true(기본값)일 경우 평가기준, 자기평가, 1차평가도 함께 승인됨
- approveAllBelow=false일 경우 평가기준, 자기평가, 1차평가는 승인되지 않음
- content와 score가 없어도 제출 가능
- content 없이 제출하면 "[제출자명]님이 미입력 상태에서 제출하였습니다" 기본 메시지 생성
- 통합 조회 API에서 2차 평가 미입력 메시지가 정상적으로 조회됨
- 이미 제출된 2차 평가를 재제출하면 409 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiQuery)({
        name: 'approveAllBelow',
        required: false,
        description: '하위 단계 자동 승인 여부 (기본값: true). true일 경우 평가기준, 자기평가, 1차평가, 2차평가를 모두 승인합니다.',
        type: String,
        example: 'true',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '2차 하향평가 제출 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '2차 하향평가가 성공적으로 제출되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '2차 하향평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 제출된 2차 하향평가입니다.',
    }));
}
function SubmitDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '하향평가 제출 (ID로 직접)',
        description: `**중요**: 하향평가 ID를 사용하여 직접 제출합니다. 1차/2차 구분 없이 평가 ID만으로 제출할 때 사용하는 간편한 방법입니다. 제출 후에는 평가가 확정되어 수정이 불가능합니다.

**동작:**
- 하향평가 ID로 평가 조회
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 1차/2차 구분 없이 제출 가능
- 제출 후 평가 내용은 변경 불가
- content와 score가 없어도 제출 가능 (인사담당자에게 제출됨)

**테스트 케이스:**
- 1차 하향평가 ID로 직접 제출 가능
- 2차 하향평가 ID로 직접 제출 가능
- 평가 타입에 관계없이 ID만으로 제출 가능
- 제출 시 평가 타입에 따라 단계 승인 상태가 pending으로 변경
- content와 score가 없어도 제출 가능
- 존재하지 않는 ID로 제출 시 404 에러
- 잘못된 UUID 형식으로 제출 시 400 에러
- 이미 제출된 평가를 ID로 재제출 시 409 에러
- 제출 후 평가 내용과 점수는 변경되지 않음
- 제출 후 updatedAt이 갱신
- 제출 후 createdAt은 변경되지 않음`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '하향평가 제출 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하향평가가 성공적으로 제출되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '하향평가를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 제출된 하향평가입니다.',
    }));
}
function BulkSubmitDownwardEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/bulk-submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '피평가자의 모든 하향평가 일괄 제출',
        description: `**중요**: 평가자가 담당하는 특정 피평가자의 모든 하향평가를 한 번에 제출합니다. 평가 유형(1차/2차)별로 일괄 제출할 수 있습니다. **평가가 존재하지 않으면 자동으로 생성한 후 제출합니다.**

**특징:**
- **평가자별 제출**: 요청한 평가자(evaluatorId)가 담당하는 평가만 제출됩니다.
- **2차 평가 지원**: 2차 평가의 경우, 1명의 피평가자에게 여러 2차 평가자가 존재할 수 있으며, 각 평가자는 자신이 담당하는 평가만 일괄 제출할 수 있습니다.
- **1차 평가**: 1차 평가는 일반적으로 1명의 평가자만 존재하므로, 해당 평가자의 모든 평가를 일괄 제출합니다.

**동작:**
- 할당된 WBS에 대한 하향평가가 없으면 자동으로 생성
- 요청한 평가자(evaluatorId)가 담당하는 피평가자의 모든 하향평가 조회
- 평가 유형(primary/secondary)으로 필터링
- 각 평가에 대해 제출 처리 (이미 완료된 평가는 건너뜀)
- 제출 실패한 평가는 결과에 포함하여 반환
- 모든 평가 제출을 하나의 트랜잭션으로 처리
- content와 score가 없어도 제출 가능 (인사담당자에게 제출됨)

**사용 예시:**
- 1차 평가자 A가 피평가자 X의 모든 1차 하향평가를 일괄 제출
- 2차 평가자 B가 피평가자 X의 모든 2차 하향평가를 일괄 제출 (평가자 B가 담당하는 평가만)
- 2차 평가자 C가 피평가자 X의 모든 2차 하향평가를 일괄 제출 (평가자 C가 담당하는 평가만, B와 독립적)

**테스트 케이스:**
- 평가자가 담당하는 피평가자의 모든 1차 하향평가 일괄 제출
- 평가자가 담당하는 피평가자의 모든 2차 하향평가 일괄 제출 (2차 평가자별로 독립적으로 제출 가능)
- 여러 2차 평가자가 동일 피평가자의 평가를 각각 독립적으로 일괄 제출 가능
- 평가가 없어도 자동 생성 후 제출 가능
- 이미 완료된 평가는 건너뛰고 제출되지 않은 평가만 제출
- content와 score가 없어도 제출 가능
- 제출 결과에 제출된 평가 수, 건너뛴 평가 수, 실패한 평가 수 포함
- 제출된 평가 ID 목록 반환
- 실패한 평가의 오류 메시지 반환
- 평가자가 담당하지 않는 피평가자 평가는 제출 불가
- 존재하지 않는 평가기간 조회 시 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 evaluatorId로 요청 시 400 에러
- 잘못된 evaluationType으로 요청 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluationType',
        description: '평가 유형 (primary 또는 secondary)',
        enum: downward_evaluation_types_1.DownwardEvaluationType,
        required: true,
        example: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '하향평가 일괄 제출 정보 (evaluatorId 포함)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하향평가 일괄 제출 결과',
        schema: {
            type: 'object',
            properties: {
                submittedCount: {
                    type: 'number',
                    description: '제출된 평가 수',
                    example: 5,
                },
                skippedCount: {
                    type: 'number',
                    description: '건너뛴 평가 수 (이미 완료된 평가)',
                    example: 2,
                },
                failedCount: {
                    type: 'number',
                    description: '실패한 평가 수',
                    example: 1,
                },
                submittedIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '제출된 평가 ID 목록',
                    example: [
                        '550e8400-e29b-41d4-a716-446655440010',
                        '550e8400-e29b-41d4-a716-446655440011',
                    ],
                },
                skippedIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '건너뛴 평가 ID 목록',
                    example: ['550e8400-e29b-41d4-a716-446655440012'],
                },
                failedItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            evaluationId: { type: 'string' },
                            error: { type: 'string' },
                        },
                    },
                    description: '실패한 평가 목록',
                    example: [
                        {
                            evaluationId: '550e8400-e29b-41d4-a716-446655440013',
                            error: '평가 내용과 점수는 필수 입력 항목입니다.',
                        },
                    ],
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '하향평가를 찾을 수 없습니다.',
    }));
}
function ResetPrimaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '1차 하향평가 미제출 상태 변경',
        description: `**중요**: 제출된 1차 하향평가를 미제출 상태로 되돌립니다. 평가 내용은 유지되며, isCompleted 상태만 false로 변경됩니다. **2차 평가자도 1차 하향평가를 반려(초기화)할 수 있습니다.**

**동작:**
- 피평가자, 평가기간, WBS로 1차 하향평가 조회 (평가자 조건 없이 조회)
- 평가 상태를 미완료(isCompleted: false)로 변경
- 수정 일시(updatedAt) 갱신
- 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능
- **2차 평가자도 1차 하향평가를 반려할 수 있음**

**테스트 케이스:**
- 제출된 1차 하향평가를 미제출 상태로 변경 가능
- 초기화 시 isCompleted가 false로 변경
- 초기화 시 단계 승인 상태(primaryEvaluationStatus)가 pending으로 변경
- 초기화 후에도 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능
- 초기화 후 재제출 시 단계 승인 상태는 pending으로 유지
- 초기화 시 updatedAt이 갱신
- **2차 평가자가 1차 하향평가를 초기화 가능**
- 존재하지 않는 평가를 초기화하려고 하면 404 에러
- 미제출 상태인 평가를 초기화하려고 하면 400 에러
- 잘못된 evaluateeId UUID 형식이면 400 에러
- 잘못된 periodId UUID 형식이면 400 에러
- 잘못된 wbsId UUID 형식이면 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '1차 하향평가 초기화 정보 (evaluatorId 포함)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
        type: downward_evaluation_dto_1.ResetDownwardEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '1차 하향평가를 찾을 수 없습니다.',
    }));
}
function ResetSecondaryDownwardEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '2차 하향평가 미제출 상태 변경',
        description: `**중요**: 제출된 2차 하향평가를 미제출 상태로 되돌립니다. 평가 내용은 유지되며, isCompleted 상태만 false로 변경됩니다. 1차 하향평가와 독립적으로 초기화됩니다.

**동작:**
- 평가자, 피평가자, 평가기간, WBS로 2차 하향평가 조회
- 평가 상태를 미완료(isCompleted: false)로 변경
- 수정 일시(updatedAt) 갱신
- 1차 하향평가와 독립적으로 초기화
- 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능

**테스트 케이스:**
- 제출된 2차 하향평가를 미제출 상태로 변경 가능
- 초기화 시 단계 승인 상태(secondaryEvaluationStatus)가 pending으로 변경
- 2차 하향평가 초기화 후에도 평가 내용과 점수는 유지
- 1차와 2차 하향평가를 독립적으로 초기화 가능
- 2차 하향평가 초기화 후 다시 제출 가능
- 초기화 후 재제출 시 단계 승인 상태는 pending으로 유지
- 1차와 2차를 각각 초기화하고 다시 제출하는 전체 플로우 정상 동작
- 여러 번 초기화와 제출을 반복해도 정상 동작
- 존재하지 않는 2차 평가를 초기화하려고 하면 404 에러
- 미제출 상태인 2차 평가를 초기화하려고 하면 400 에러
- 잘못된 UUID 형식으로 요청하면 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsId',
        description: 'WBS ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '2차 하향평가 초기화 정보 (evaluatorId 포함)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '2차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
        type: downward_evaluation_dto_1.ResetDownwardEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '2차 하향평가를 찾을 수 없습니다.',
    }));
}
function BulkResetDownwardEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('evaluatee/:evaluateeId/period/:periodId/bulk-reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '피평가자의 모든 하향평가 일괄 초기화',
        description: `**중요**: 평가자가 담당하는 특정 피평가자의 모든 하향평가를 한 번에 미제출 상태로 되돌립니다. 평가 유형(1차/2차)별로 일괄 초기화할 수 있습니다.

**특징:**
- **평가자별 초기화**: 요청한 평가자(evaluatorId)가 담당하는 평가만 초기화됩니다.
- **2차 평가 지원**: 2차 평가의 경우, 1명의 피평가자에게 여러 2차 평가자가 존재할 수 있으며, 각 평가자는 자신이 담당하는 평가만 일괄 초기화할 수 있습니다.
- **1차 평가**: 1차 평가는 일반적으로 1명의 평가자만 존재하므로, 해당 평가자의 모든 평가를 일괄 초기화합니다.

**동작:**
- 요청한 평가자(evaluatorId)가 담당하는 피평가자의 모든 하향평가 조회
- 평가 유형(primary/secondary)으로 필터링
- 각 평가에 대해 초기화 처리 (이미 미제출 상태인 평가는 건너뜀)
- 초기화 실패한 평가는 결과에 포함하여 반환
- 모든 평가 초기화를 하나의 트랜잭션으로 처리

**사용 예시:**
- 1차 평가자 A가 피평가자 X의 모든 1차 하향평가를 일괄 초기화
- 2차 평가자 B가 피평가자 X의 모든 2차 하향평가를 일괄 초기화 (평가자 B가 담당하는 평가만)
- 2차 평가자 C가 피평가자 X의 모든 2차 하향평가를 일괄 초기화 (평가자 C가 담당하는 평가만, B와 독립적)

**테스트 케이스:**
- 평가자가 담당하는 피평가자의 모든 1차 하향평가 일괄 초기화
- 평가자가 담당하는 피평가자의 모든 2차 하향평가 일괄 초기화 (2차 평가자별로 독립적으로 초기화 가능)
- 일괄 초기화 시 단계 승인 상태가 평가 타입에 따라 pending으로 변경
- 여러 2차 평가자가 동일 피평가자의 평가를 각각 독립적으로 일괄 초기화 가능
- 이미 미제출 상태인 평가는 건너뛰고 제출된 평가만 초기화
- 초기화 결과에 초기화된 평가 수, 건너뛴 평가 수, 실패한 평가 수 포함
- 초기화된 평가 ID 목록 반환
- 실패한 평가의 오류 메시지 반환
- 평가자가 담당하지 않는 피평가자 평가는 초기화 불가
- 존재하지 않는 평가기간 조회 시 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 evaluatorId로 요청 시 400 에러
- 잘못된 evaluationType으로 요청 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluationType',
        description: '평가 유형 (primary 또는 secondary)',
        enum: downward_evaluation_types_1.DownwardEvaluationType,
        required: true,
        example: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
    }), (0, swagger_1.ApiBody)({
        type: downward_evaluation_dto_1.SubmitDownwardEvaluationDto,
        description: '하향평가 일괄 초기화 정보 (evaluatorId 포함)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하향평가 일괄 초기화 결과',
        schema: {
            type: 'object',
            properties: {
                resetCount: {
                    type: 'number',
                    description: '초기화된 평가 수',
                    example: 5,
                },
                skippedCount: {
                    type: 'number',
                    description: '건너뛴 평가 수 (이미 미제출 상태인 평가)',
                    example: 2,
                },
                failedCount: {
                    type: 'number',
                    description: '실패한 평가 수',
                    example: 1,
                },
                resetIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '초기화된 평가 ID 목록',
                    example: [
                        '550e8400-e29b-41d4-a716-446655440010',
                        '550e8400-e29b-41d4-a716-446655440011',
                    ],
                },
                skippedIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '건너뛴 평가 ID 목록',
                    example: ['550e8400-e29b-41d4-a716-446655440012'],
                },
                failedItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            evaluationId: { type: 'string' },
                            error: { type: 'string' },
                        },
                    },
                    description: '실패한 평가 목록',
                    example: [
                        {
                            evaluationId: '550e8400-e29b-41d4-a716-446655440013',
                            error: '초기화 중 오류가 발생했습니다.',
                        },
                    ],
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '하향평가를 찾을 수 없습니다.',
    }));
}
function GetEvaluatorDownwardEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('evaluator/:evaluatorId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가자의 하향평가 목록 조회',
        description: `**중요**: 특정 평가자가 작성한 하향평가 목록을 조회합니다. 다양한 필터 옵션과 페이지네이션을 지원하여 효율적인 평가 관리가 가능합니다.

**동작:**
- 평가자 ID로 하향평가 목록 조회
- 필터 옵션으로 조건에 맞는 평가만 선택
- 페이지네이션으로 대량 데이터 효율적 처리
- 응답에 평가 목록, 총 개수, 페이지 정보 포함

**테스트 케이스:**
- 평가자의 모든 하향평가를 조회할 수 있어야 함
- evaluateeId 필터로 특정 피평가자의 평가만 조회
- periodId 필터로 특정 평가기간의 평가만 조회
- wbsId 필터로 특정 WBS의 평가만 조회
- evaluationType 필터로 1차 또는 2차 평가만 조회
- isCompleted 필터로 완료/미완료 평가를 구분 조회
- 페이지네이션이 올바르게 동작
- 복합 필터를 사용하여 조회
- 조건에 맞는 평가가 없을 때 빈 배열 반환
- 잘못된 evaluatorId 형식으로 요청 시 400 에러
- 잘못된 evaluateeId 필터로 요청 시 400 에러
- 잘못된 periodId 필터로 요청 시 400 에러
- 잘못된 wbsId 필터로 요청 시 400 에러
- 잘못된 evaluationType 값으로 요청 시 400 에러
- page가 0 이하일 때 400 에러
- limit이 100을 초과할 때 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'evaluatorId',
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluateeId',
        description: '피평가자 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'wbsId',
        description: 'WBS ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440004',
    }), (0, swagger_1.ApiQuery)({
        name: 'evaluationType',
        description: '평가 유형',
        required: false,
        enum: ['primary', 'secondary'],
        example: 'primary',
    }), (0, swagger_1.ApiQuery)({
        name: 'isCompleted',
        description: '완료 여부',
        required: false,
        type: Boolean,
        example: false,
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        description: '페이지 번호 (1부터 시작)',
        required: false,
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: '페이지 크기',
        required: false,
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가자의 하향평가 목록이 성공적으로 조회되었습니다.',
        type: downward_evaluation_dto_1.DownwardEvaluationListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가자를 찾을 수 없습니다.',
    }));
}
function GetDownwardEvaluationDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '하향평가 상세정보 조회',
        description: `**중요**: 하향평가의 상세정보를 조회합니다. 평가 ID를 사용하여 평가 내용, 점수, 제출 상태, 관련 엔티티 정보 등 모든 세부 정보를 확인할 수 있습니다.

**동작:**
- 하향평가 ID로 상세정보 조회
- 평가 내용, 점수, 제출 상태 포함
- 관련 엔티티 정보 포함 (피평가자, 평가자, WBS, 평가기간, 자기평가)
- 타임스탬프 정보 포함 (생성/수정/제출 일시)

**테스트 케이스:**
- 하향평가 ID로 상세정보 조회 가능
- 1차 하향평가의 상세정보 조회
- 2차 하향평가의 상세정보 조회
- 완료된 평가는 completedAt이 포함
- 미완료 평가는 completedAt이 null
- selfEvaluationId가 있는 경우 selfEvaluation 객체가 포함
- 타임스탬프 필드들이 올바르게 반환
- 관련 엔티티 정보 포함 (employee, evaluator, wbsItem, period)
- 존재하지 않는 ID로 조회 시 404 에러
- 잘못된 UUID 형식으로 조회 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하향평가 상세정보가 성공적으로 조회되었습니다.',
        type: downward_evaluation_dto_1.DownwardEvaluationDetailResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 파라미터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '하향평가를 찾을 수 없습니다.',
    }));
}
//# sourceMappingURL=downward-evaluation-api.decorators.js.map