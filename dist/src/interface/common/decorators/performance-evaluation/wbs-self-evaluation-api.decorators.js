"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertWbsSelfEvaluation = UpsertWbsSelfEvaluation;
exports.UpdateWbsSelfEvaluation = UpdateWbsSelfEvaluation;
exports.SubmitWbsSelfEvaluation = SubmitWbsSelfEvaluation;
exports.SubmitWbsSelfEvaluationToEvaluator = SubmitWbsSelfEvaluationToEvaluator;
exports.GetEmployeeSelfEvaluations = GetEmployeeSelfEvaluations;
exports.GetWbsSelfEvaluationDetail = GetWbsSelfEvaluationDetail;
exports.SubmitAllWbsSelfEvaluationsByEmployeePeriod = SubmitAllWbsSelfEvaluationsByEmployeePeriod;
exports.SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod = SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod;
exports.ResetWbsSelfEvaluation = ResetWbsSelfEvaluation;
exports.ResetAllWbsSelfEvaluationsByEmployeePeriod = ResetAllWbsSelfEvaluationsByEmployeePeriod;
exports.SubmitWbsSelfEvaluationsByProject = SubmitWbsSelfEvaluationsByProject;
exports.ResetWbsSelfEvaluationsByProject = ResetWbsSelfEvaluationsByProject;
exports.ResetWbsSelfEvaluationToEvaluator = ResetWbsSelfEvaluationToEvaluator;
exports.ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod = ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod;
exports.ResetWbsSelfEvaluationsToEvaluatorByProject = ResetWbsSelfEvaluationsToEvaluatorByProject;
exports.ClearWbsSelfEvaluation = ClearWbsSelfEvaluation;
exports.ClearAllWbsSelfEvaluationsByEmployeePeriod = ClearAllWbsSelfEvaluationsByEmployeePeriod;
exports.SubmitWbsSelfEvaluationsToEvaluatorByProject = SubmitWbsSelfEvaluationsToEvaluatorByProject;
exports.ClearWbsSelfEvaluationsByProject = ClearWbsSelfEvaluationsByProject;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wbs_self_evaluation_dto_1 = require("../../dto/performance-evaluation/wbs-self-evaluation.dto");
function UpsertWbsSelfEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('employee/:employeeId/wbs/:wbsItemId/period/:periodId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 저장',
        description: `**중요**: WBS 자기평가를 저장합니다. 동일한 직원-WBS항목-평가기간 조합으로 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다. Upsert 방식으로 동작하여 중복 생성을 방지하며, 낙관적 잠금(버전 관리)을 통해 동시성을 제어합니다.

**주요 기능:**
- **Upsert 방식**: 동일 조합(직원+WBS항목+평가기간)으로 평가가 존재하면 업데이트, 없으면 신규 생성
- **버전 관리**: 매 수정마다 version 필드 자동 증가로 낙관적 잠금 적용
- **타임스탬프 관리**: createdAt은 최초 생성 시에만 기록되고 이후 변경되지 않음, updatedAt은 매 수정 시 갱신
- **점수 범위**: selfEvaluationScore는 0 ~ 평가기간의 maxSelfEvaluationRate 사이의 값 (달성률 %)
- **선택적 필드**: 모든 필드가 선택사항 (selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy)

**요청 본문 필드:**
- \`selfEvaluationContent\` (선택): 자기평가 내용 (문자열)
- \`selfEvaluationScore\` (선택): 자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate, 기본 최대값 120)
- \`performanceResult\` (선택): 성과 실적 (문자열, 빈 문자열도 허용)
- \`subProject\` (선택): 세부 프로젝트/서브 프로젝트 (문자열)
- \`createdBy\` (선택): 생성자 ID (UUID 형식)

**요청 예시:**
\`\`\`json
{
  "selfEvaluationContent": "이번 분기 목표를 성공적으로 달성했습니다.",
  "selfEvaluationScore": 100,
  "performanceResult": "WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.",
  "subProject": "모바일 앱 개발"
}
\`\`\`

**최소 요청 예시 (모든 필드 선택사항):**
\`\`\`json
{
  "performanceResult": "작업 완료",
  "subProject": "백엔드 API"
}
\`\`\`

**테스트 케이스:**
- 신규 생성: 동일 조합의 평가가 없으면 신규 생성되며 version=1, isCompleted=false로 초기화
- 기존 수정: 동일 조합으로 기존 평가가 있으면 동일한 ID로 수정되며 version 증가
- 점수 범위: 0 ~ 평가기간의 maxSelfEvaluationRate 범위 내 모든 값 저장 가능 (예: 0, 50, 100, 120)
- 여러 번 수정: 동일 평가를 여러 번 수정할 수 있으며 매번 version과 updatedAt 증가
- 선택적 필드: selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy 모두 생략 가능
- performanceResult 빈 문자열: 빈 문자열("")도 유효한 값으로 저장됨
- DB 저장 검증: 저장된 데이터가 DB에 정확히 기록됨
- updatedAt 갱신: 수정 시 updatedAt이 자동으로 업데이트됨
- createdAt 유지: 수정 시 createdAt은 변경되지 않음 (200ms 이내 오차 허용)
- version 증가: 매 수정마다 version이 1씩 증가
- isCompleted 초기값: 신규 생성 시 isCompleted=false, completedAt=null
- 점수 범위 검증: 0 미만 또는 maxSelfEvaluationRate 초과 점수 입력 시 400 에러
- 점수 타입 검증: 점수가 숫자가 아닐 때 400 에러
- 내용 타입 검증: selfEvaluationContent가 문자열이 아닐 때 400 에러
- UUID 형식 검증: employeeId, wbsItemId, periodId, createdBy가 UUID 형식이 아닐 때 400 에러
- 평가기간 존재 검증: 존재하지 않는 periodId로 요청 시 400 에러
- 응답 필드 검증: id, periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, isCompleted, evaluationDate, createdAt, updatedAt, version 포함
- 응답 ID 일치: 응답의 employeeId, wbsItemId, periodId가 요청값과 정확히 일치
- 날짜 형식 검증: evaluationDate, createdAt, updatedAt이 유효한 날짜 형식`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiParam)({
        name: 'wbsItemId',
        description: 'WBS 항목 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiBody)({
        type: wbs_self_evaluation_dto_1.CreateWbsSelfEvaluationBodyDto,
        description: 'WBS 자기평가 저장 정보 (모든 필드 선택사항)',
        examples: {
            full: {
                summary: '전체 필드 포함',
                description: '자기평가 내용, 점수, 성과 실적, 서브 프로젝트를 모두 포함한 예시',
                value: {
                    selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                    selfEvaluationScore: 100,
                    performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                    subProject: '모바일 앱 개발',
                },
            },
            minimal: {
                summary: '최소 필드만',
                description: '필수 항목이 없으므로 일부 필드만 포함 가능',
                value: {
                    performanceResult: '작업 완료',
                    subProject: '백엔드 API',
                },
            },
            withSubProject: {
                summary: '서브 프로젝트 포함',
                description: '서브 프로젝트 정보를 포함한 성과 입력',
                value: {
                    selfEvaluationScore: 95,
                    performanceResult: 'ERD 40개 테이블 설계 완료, 정규화 3단계까지 적용',
                    subProject: '데이터베이스 설계',
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 저장되었습니다. 신규 생성 또는 기존 평가 수정 결과를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터 (UUID 형식 오류, 점수 범위 초과, 잘못된 타입 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '동시성 충돌 (낙관적 잠금 실패, version 불일치)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function UpdateWbsSelfEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Put)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 수정',
        description: '기존 WBS 자기평가를 수정합니다.',
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({
        type: wbs_self_evaluation_dto_1.UpdateWbsSelfEvaluationDto,
        description: 'WBS 자기평가 수정 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 수정되었습니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationBasicDto,
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
        description: '자기평가를 찾을 수 없습니다.',
    }));
}
function SubmitWbsSelfEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 제출 (1차 평가자 → 관리자)',
        description: `**중요**: 1차 평가자가 자기평가를 관리자에게 제출합니다. 피평가자가 1차 평가자에게 먼저 제출했는지 확인한 후, 관리자 제출 상태(submittedToManager)가 true로 설정됩니다.

**제출 가능 조건:**
- 피평가자가 1차 평가자에게 먼저 제출했어야 함 (submittedToEvaluator = true)
- 자기평가가 작성되어 있어야 함 (내용 또는 점수가 입력됨)
- 이미 관리자에게 제출된 경우 멱등성을 보장하며 재제출 시에도 성공 반환

**테스트 케이스:**
- 1차 평가자 → 관리자 제출: 피평가자가 1차 평가자에게 제출한 후 관리자에게 제출
- submittedToManagerAt 설정: 제출 시 관리자 제출일시 자동 기록
- submittedToManager 변경: 관리자 제출 상태가 true로 설정됨
- 피평가자 제출 확인: 피평가자가 1차 평가자에게 먼저 제출하지 않았으면 400 에러
- updatedAt 갱신: 제출 시 수정일시 자동 업데이트
- 멱등성 보장: 이미 관리자에게 제출된 자기평가를 다시 제출해도 성공 (상태 유지)
- 잘못된 UUID: UUID 형식이 아닌 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 자기평가 ID로 요청 시 400 에러
- 응답 필드 검증: id, submittedToManager, submittedToManagerAt, selfEvaluationContent, selfEvaluationScore 등 포함
- 트랜잭션 보장: 제출 중 오류 시 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'WBS 자기평가 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 관리자에게 제출되었습니다. 제출된 자기평가 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 존재하지 않는 자기평가 ID 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function SubmitWbsSelfEvaluationToEvaluator() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/submit-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 제출 (피평가자 → 1차 평가자)',
        description: `**중요**: 피평가자가 자기평가를 1차 평가자에게 제출합니다. 제출된 자기평가는 1차 평가자 제출일시(submittedToEvaluatorAt)가 기록되며, 1차 평가자 제출 상태(submittedToEvaluator)가 true로 설정됩니다.

**제출 가능 조건:**
- 자기평가가 작성되어 있어야 함 (내용 또는 점수가 입력됨)
- 이미 1차 평가자에게 제출된 경우 멱등성을 보장하며 재제출 시에도 성공 반환

**테스트 케이스:**
- 피평가자 → 1차 평가자 제출: 정상적으로 작성된 자기평가를 1차 평가자에게 제출
- submittedToEvaluatorAt 설정: 제출 시 1차 평가자 제출일시 자동 기록
- submittedToEvaluator 변경: 1차 평가자 제출 상태가 true로 설정됨
- updatedAt 갱신: 제출 시 수정일시 자동 업데이트
- 멱등성 보장: 이미 1차 평가자에게 제출된 자기평가를 다시 제출해도 성공 (상태 유지)
- **Activity Log 연동**: 제출 후 1차 평가자가 데이터 조회 시 viewedByPrimaryEvaluator 필드 활성화
- **2차 평가자 제한**: 2차 평가자는 1차 평가가 제출된 후에만 viewedBySecondaryEvaluator 활성화 가능
- 잘못된 UUID: UUID 형식이 아닌 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 자기평가 ID로 요청 시 400 에러
- 평가 내용/점수 필수: 평가 내용과 점수가 입력되지 않았으면 400 에러
- 응답 필드 검증: id, submittedToEvaluator, submittedToEvaluatorAt, selfEvaluationContent, selfEvaluationScore 등 포함
- 트랜잭션 보장: 제출 중 오류 시 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'WBS 자기평가 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 1차 평가자에게 제출되었습니다. 제출된 자기평가 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 존재하지 않는 자기평가 ID, 평가 내용/점수 미입력 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function GetEmployeeSelfEvaluations() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('employee/:employeeId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원의 자기평가 목록 조회',
        description: `**중요**: 특정 직원의 WBS 자기평가 목록을 조회합니다. 평가기간, 프로젝트 필터링 및 페이지네이션을 지원합니다.

**조회 정보:**
- 자기평가 ID, WBS 항목 ID, 평가기간 ID
- 자기평가 내용 및 점수
- 제출 상태 및 제출 일시
- 생성/수정 일시 및 작성자 정보

**필터링 옵션:**
- periodId: 특정 평가기간의 자기평가만 조회
- projectId: 특정 프로젝트의 자기평가만 조회
- 페이지네이션: page, limit 파라미터 지원

**사용 시나리오:**
- 직원 대시보드: 본인의 자기평가 진행 현황 확인
- 관리자 모니터링: 특정 직원의 평가 진행 상황 추적
- 평가 검토: 제출된 자기평가 목록 확인

**테스트 케이스:**
- 기본 조회: 직원의 자기평가 목록을 조회할 수 있어야 한다
- 필드 검증: 반환된 각 자기평가 항목은 모든 필수 필드를 포함해야 한다 (id, wbsItemId, periodId, isCompleted, createdAt, updatedAt 등)
- 필터링: periodId 필터로 특정 평가기간의 자기평가만 조회할 수 있어야 한다
- 페이지네이션: page, limit 파라미터로 페이지네이션이 정상적으로 작동해야 한다
- 빈 결과: 자기평가가 없는 경우 빈 배열을 반환해야 한다
- UUID 검증: 잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다
- 데이터 일관성: 목록 조회 결과와 상세 조회 결과가 일치해야 한다
- 날짜 형식: 모든 날짜 필드는 ISO 8601 형식이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiQuery)({
        name: 'periodId',
        description: '평가기간 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiQuery)({
        name: 'projectId',
        description: '프로젝트 ID',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440004',
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
        description: '직원의 자기평가 목록이 성공적으로 조회되었습니다.',
        type: wbs_self_evaluation_dto_1.EmployeeSelfEvaluationsResponseDto,
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
        description: '직원을 찾을 수 없습니다.',
    }));
}
function GetWbsSelfEvaluationDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 상세정보 조회',
        description: `**중요**: 특정 WBS 자기평가의 상세정보를 조회합니다. 평가기간, 직원, WBS 항목 정보를 포함하여 반환합니다.

**조회 정보:**
- 자기평가 기본 정보: ID, 내용, 점수, 제출 상태
- 평가기간 정보: 평가기간 ID, 이름, 기간, 상태 (evaluationPeriod 객체)
- 직원 정보: 직원 ID, 이름, 이메일, 부서 (employee 객체)
- WBS 항목 정보: WBS ID, 코드, 제목, 상태, 진행률 (wbsItem 객체)
- 메타 정보: 생성/수정 일시, 작성자 정보, 버전

**반환 데이터 특징:**
- 관련 엔티티 정보를 중첩 객체로 반환 (평가기간, 직원, WBS 항목)
- 제출된 평가는 completedAt 필드 포함
- 모든 날짜 필드는 ISO 8601 형식

**사용 시나리오:**
- 평가 상세 확인: 작성된 자기평가의 전체 정보 확인
- 평가 검토: 제출된 평가 내용 검토
- 평가 수정: 기존 평가 내용 확인 후 수정

**테스트 케이스:**
- 기본 조회: 자기평가 상세정보를 조회할 수 있어야 한다
- 필수 필드: 반환된 상세정보는 모든 필수 필드를 포함해야 한다 (id, wbsItemId, periodId, employeeId, isCompleted, createdAt, updatedAt 등)
- 평가기간 정보: evaluationPeriod 객체가 포함되어 있으며 id, name, startDate, endDate, status 등을 포함해야 한다
- 직원 정보: employee 객체가 포함되어 있으며 id, employeeNumber, name, email 등을 포함해야 한다
- WBS 항목 정보: wbsItem 객체가 포함되어 있으며 id, wbsCode, title, status, projectId 등을 포함해야 한다
- 제출 상태: 제출된 자기평가의 경우 isCompleted가 true이고 completedAt이 존재해야 한다
- UUID 검증: 잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다
- 존재하지 않음: 존재하지 않는 자기평가 ID로 조회 시 404 에러가 발생해야 한다
- 데이터 일관성: 목록 조회 결과와 상세 조회 결과의 기본 필드가 일치해야 한다
- 날짜 형식: 모든 날짜 필드는 ISO 8601 형식이어야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가 상세정보가 성공적으로 조회되었습니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationDetailResponseDto,
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
        description: '자기평가를 찾을 수 없습니다.',
    }));
}
function SubmitAllWbsSelfEvaluationsByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/submit-all'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원의 전체 WBS 자기평가 한 번에 제출 (1차 평가자 → 관리자)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 모든 WBS 자기평가를 관리자에게 한 번에 제출합니다. 피평가자가 1차 평가자에게 먼저 제출했는지 확인한 후, 관리자 제출 상태(submittedToManager)가 true로 설정됩니다.

**사용 시나리오:**
- 평가 완료: 직원이 모든 WBS 항목에 대한 자기평가를 작성한 후 일괄 제출
- 부분 제출: 일부만 작성된 경우에도 작성된 항목만 제출 처리
- 평가 진행 상황 추적: 성공/실패 개수를 통해 평가 완료율 확인

**제출 가능 조건:**
- 피평가자가 1차 평가자에게 먼저 제출했어야 함 (submittedToEvaluator = true)
- 자기평가 내용 또는 점수가 입력되어 있어야 함
- 이미 관리자에게 제출된 자기평가도 포함되어 제출 처리 (멱등성)

**테스트 케이스:**
- 모든 자기평가 제출: 직원의 모든 WBS 자기평가를 한 번에 제출
- 제출 개수 반환: submittedCount에 실제 제출된 평가 개수 포함
- 총 개수 반환: totalCount에 전체 자기평가 개수 포함
- 완료 목록 반환: completedEvaluations에 제출된 평가 상세 정보 포함
- 부분 작성: 일부만 작성된 경우 작성된 것만 제출, 나머지는 failedEvaluations에 포함
- 실패 목록: 제출 불가능한 자기평가는 실패 이유와 함께 반환
- 자기평가 없음: 작성된 자기평가가 하나도 없는 경우 400 에러
- 잘못된 UUID: employeeId 또는 periodId가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: submittedCount, failedCount, totalCount, completedEvaluations, failedEvaluations 포함
- 트랜잭션 보장: 일부 실패 시에도 성공한 자기평가는 제출 완료 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '직원의 WBS 자기평가가 성공적으로 관리자에게 제출되었습니다. 제출 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.SubmitAllWbsSelfEvaluationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 제출할 자기평가가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/submit-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원의 전체 WBS 자기평가 한 번에 제출 (피평가자 → 1차 평가자)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 모든 WBS 자기평가를 1차 평가자에게 한 번에 제출합니다. 작성된 자기평가만 제출되며, 미작성된 자기평가는 실패 목록에 포함됩니다.

**사용 시나리오:**
- 평가 완료: 직원이 모든 WBS 항목에 대한 자기평가를 작성한 후 일괄 제출
- 부분 제출: 일부만 작성된 경우에도 작성된 항목만 제출 처리
- 평가 진행 상황 추적: 성공/실패 개수를 통해 평가 완료율 확인

**제출 가능 조건:**
- 자기평가 내용 또는 점수가 입력되어 있어야 함
- 이미 1차 평가자에게 제출된 자기평가도 포함되어 제출 처리 (멱등성)

**테스트 케이스:**
- 모든 자기평가 제출: 직원의 모든 WBS 자기평가를 1차 평가자에게 한 번에 제출
- 제출 개수 반환: submittedCount에 실제 제출된 평가 개수 포함
- 총 개수 반환: totalCount에 전체 자기평가 개수 포함
- 완료 목록 반환: completedEvaluations에 제출된 평가 상세 정보 포함
- 부분 작성: 일부만 작성된 경우 작성된 것만 제출, 나머지는 failedEvaluations에 포함
- 실패 목록: 제출 불가능한 자기평가는 실패 이유와 함께 반환
- 자기평가 없음: 작성된 자기평가가 하나도 없는 경우 400 에러
- 잘못된 UUID: employeeId 또는 periodId가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: submittedCount, failedCount, totalCount, completedEvaluations, failedEvaluations 포함
- 트랜잭션 보장: 일부 실패 시에도 성공한 자기평가는 제출 완료 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '직원의 WBS 자기평가가 성공적으로 1차 평가자에게 제출되었습니다. 제출 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.SubmitAllWbsSelfEvaluationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 제출할 자기평가가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetWbsSelfEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 미제출',
        description: `**중요**: 제출된 WBS 자기평가를 미제출 상태로 되돌립니다. 완료일(completedAt)이 null로 설정되며, 완료 상태(isCompleted)가 false로 변경됩니다.

**미제출 가능 조건:**
- 자기평가가 제출 상태(isCompleted: true)여야 함
- 이미 미제출 상태인 경우 400 에러 반환 (중복 초기화 방지)

**테스트 케이스:**
- 제출된 자기평가 미제출: 제출 상태인 자기평가를 미제출 상태로 변경
- completedAt 초기화: 완료일시가 null로 설정됨
- isCompleted 변경: 완료 상태가 false로 설정됨
- updatedAt 갱신: 미제출 처리 시 수정일시 자동 업데이트
- 이미 미제출 상태: 미제출 상태인 자기평가를 다시 미제출로 변경 시도 시 400 에러
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: UUID 형식이 아닌 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 자기평가 ID로 요청 시 400 에러
- 응답 필드 검증: id, isCompleted, completedAt (null), selfEvaluationContent, selfEvaluationScore 등 포함
- 트랜잭션 보장: 미제출 처리 중 오류 시 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'WBS 자기평가 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 변경된 자기평가 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 존재하지 않는 자기평가 ID, 이미 미제출 상태인 자기평가 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetAllWbsSelfEvaluationsByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원의 전체 WBS 자기평가 한 번에 미제출',
        description: `**중요**: 특정 평가기간 내 특정 직원의 제출된 모든 WBS 자기평가를 한 번에 미제출 상태로 되돌립니다. 제출된 자기평가만 미제출 처리되며, 이미 미제출 상태인 자기평가는 제외됩니다.

**사용 시나리오:**
- 재평가 요청: 평가를 재작성해야 하는 경우 일괄 미제출 처리
- 평가 취소: 관리자가 특정 직원의 평가를 일괄 취소하는 경우
- 평가 기간 연장: 평가 기간 연장으로 인해 제출 상태를 초기화해야 하는 경우

**미제출 가능 조건:**
- 자기평가가 제출 상태(isCompleted: true)여야 함
- 이미 미제출 상태인 자기평가는 처리 대상에서 제외

**테스트 케이스:**
- 모든 제출된 자기평가 미제출: 직원의 모든 제출된 WBS 자기평가를 한 번에 미제출 상태로 변경
- 초기화 개수 반환: resetCount에 실제 미제출 처리된 평가 개수 포함
- 총 개수 반환: totalCount에 전체 자기평가 개수 포함
- 초기화 목록 반환: resetEvaluations에 미제출 처리된 평가 상세 정보 포함
- wasCompleted 플래그: 각 평가가 제출 상태였는지 여부 정보 포함
- 완료된 자기평가 없음: 제출된 자기평가가 하나도 없는 경우 빈 결과 반환 (resetCount: 0)
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: employeeId 또는 periodId가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: resetCount, failedCount, totalCount, resetEvaluations, failedResets 포함
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '직원의 WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 초기화 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ResetAllWbsSelfEvaluationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function SubmitWbsSelfEvaluationsByProject() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/project/:projectId/submit'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트별 WBS 자기평가 제출 (1차 평가자 → 관리자)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 특정 프로젝트에 할당된 모든 WBS 자기평가를 관리자에게 제출합니다. 피평가자가 1차 평가자에게 먼저 제출했는지 확인한 후, 관리자 제출 상태(submittedToManager)가 true로 설정됩니다. 프로젝트 단위로 평가를 관리할 때 유용하며, 해당 프로젝트의 WBS 항목에 대한 자기평가만 제출 처리됩니다.

**사용 시나리오:**
- 프로젝트 완료: 특정 프로젝트가 완료되어 해당 프로젝트의 자기평가를 일괄 제출
- 프로젝트별 평가 관리: 여러 프로젝트를 수행하는 직원의 경우 프로젝트별로 평가 제출
- 단계별 제출: 프로젝트 진행 단계에 따라 순차적으로 평가 제출

**제출 가능 조건:**
- 피평가자가 1차 평가자에게 먼저 제출했어야 함 (submittedToEvaluator = true)
- 해당 프로젝트에 평가기간 내 WBS가 할당되어 있어야 함 (EvaluationWbsAssignment 존재)
- 자기평가 내용 또는 점수가 입력되어 있어야 함
- 이미 관리자에게 제출된 자기평가도 포함되어 제출 처리 (멱등성)

**테스트 케이스:**
- 프로젝트별 제출: 특정 프로젝트의 모든 WBS 자기평가를 제출
- 제출 개수 반환: submittedCount에 실제 제출된 평가 개수 포함
- 총 개수 반환: totalCount에 해당 프로젝트의 전체 자기평가 개수 포함
- 완료 목록 반환: completedEvaluations에 제출된 평가 상세 정보 포함
- WBS 할당 확인: 프로젝트에 할당된 WBS가 없는 경우 400 에러
- 부분 작성: 일부만 작성된 경우 작성된 것만 제출, 나머지는 failedEvaluations에 포함
- 잘못된 UUID: employeeId, periodId, projectId 중 하나라도 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: submittedCount, failedCount, totalCount, completedEvaluations, failedEvaluations 포함
- 트랜잭션 보장: 일부 실패 시에도 성공한 자기평가는 제출 완료 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'projectId',
        description: '프로젝트 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440003',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트의 WBS 자기평가가 성공적으로 관리자에게 제출되었습니다. 제출 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.SubmitWbsSelfEvaluationsByProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 프로젝트에 할당된 WBS가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetWbsSelfEvaluationsByProject() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/project/:projectId/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트별 WBS 자기평가 미제출',
        description: `**중요**: 특정 평가기간 내 특정 직원의 특정 프로젝트에 할당된 제출된 모든 WBS 자기평가를 미제출 상태로 되돌립니다. 프로젝트 단위로 평가를 관리할 때 유용하며, 해당 프로젝트의 WBS 항목에 대한 자기평가만 미제출 처리됩니다.

**사용 시나리오:**
- 프로젝트 재평가: 특정 프로젝트의 평가를 다시 작성해야 하는 경우
- 프로젝트별 평가 취소: 관리자가 특정 프로젝트의 평가를 일괄 취소하는 경우
- 프로젝트 평가 기간 연장: 프로젝트별로 평가 기간을 연장하는 경우

**미제출 가능 조건:**
- 해당 프로젝트에 평가기간 내 WBS가 할당되어 있어야 함 (EvaluationWbsAssignment 존재)
- 자기평가가 제출 상태(isCompleted: true)여야 함
- 이미 미제출 상태인 자기평가는 처리 대상에서 제외

**테스트 케이스:**
- 프로젝트별 미제출: 특정 프로젝트의 모든 제출된 WBS 자기평가를 미제출 상태로 변경
- 초기화 개수 반환: resetCount에 실제 미제출 처리된 평가 개수 포함
- 총 개수 반환: totalCount에 해당 프로젝트의 전체 자기평가 개수 포함
- 초기화 목록 반환: resetEvaluations에 미제출 처리된 평가 상세 정보 포함
- wasCompleted 플래그: 각 평가가 제출 상태였는지 여부 정보 포함
- WBS 할당 확인: 프로젝트에 할당된 WBS가 없는 경우 400 에러
- 완료된 자기평가 없음: 제출된 자기평가가 하나도 없는 경우 빈 결과 반환 (resetCount: 0)
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: employeeId, periodId, projectId 중 하나라도 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: resetCount, failedCount, totalCount, resetEvaluations, failedResets 포함
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'projectId',
        description: '프로젝트 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440003',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트의 WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 초기화 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ResetWbsSelfEvaluationsByProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 프로젝트에 할당된 WBS가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetWbsSelfEvaluationToEvaluator() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/reset-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)',
        description: `**중요**: 피평가자가 1차 평가자에게 제출한 WBS 자기평가를 취소합니다. 1차 평가자 제출일시(submittedToEvaluatorAt)가 null로 설정되며, 1차 평가자 제출 상태(submittedToEvaluator)가 false로 변경됩니다.

**취소 가능 조건:**
- 자기평가가 1차 평가자에게 제출 상태(submittedToEvaluator: true)여야 함
- 이미 미제출 상태인 경우 400 에러 반환 (중복 취소 방지)

**테스트 케이스:**
- 제출된 자기평가 취소: 1차 평가자에게 제출된 자기평가를 취소
- submittedToEvaluatorAt 초기화: 1차 평가자 제출일시가 null로 설정됨
- submittedToEvaluator 변경: 1차 평가자 제출 상태가 false로 설정됨
- updatedAt 갱신: 취소 처리 시 수정일시 자동 업데이트
- 이미 미제출 상태: 미제출 상태인 자기평가를 다시 취소로 변경 시도 시 400 에러
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: UUID 형식이 아닌 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 자기평가 ID로 요청 시 400 에러
- 응답 필드 검증: id, submittedToEvaluator, submittedToEvaluatorAt (null), selfEvaluationContent, selfEvaluationScore 등 포함
- 트랜잭션 보장: 취소 처리 중 오류 시 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'WBS 자기평가 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가가 성공적으로 취소되었습니다. 취소된 자기평가 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 존재하지 않는 자기평가 ID, 이미 미제출 상태 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/reset-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '직원의 전체 WBS 자기평가 한 번에 취소 (피평가자 → 1차 평가자 제출 취소)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 1차 평가자에게 제출된 모든 WBS 자기평가를 한 번에 취소합니다. 제출된 자기평가만 취소 처리되며, 이미 미제출 상태인 자기평가는 제외됩니다.

**사용 시나리오:**
- 재평가 요청: 평가를 재작성해야 하는 경우 일괄 취소 처리
- 평가 취소: 피평가자가 특정 직원의 평가를 일괄 취소하는 경우
- 평가 기간 연장: 평가 기간 연장으로 인해 제출 상태를 초기화해야 하는 경우

**취소 가능 조건:**
- 자기평가가 1차 평가자에게 제출 상태(submittedToEvaluator: true)여야 함
- 이미 미제출 상태인 자기평가는 처리 대상에서 제외

**테스트 케이스:**
- 모든 제출된 자기평가 취소: 직원의 모든 1차 평가자 제출된 WBS 자기평가를 한 번에 취소
- 취소 개수 반환: resetCount에 실제 취소 처리된 평가 개수 포함
- 총 개수 반환: totalCount에 전체 자기평가 개수 포함
- 취소 목록 반환: resetEvaluations에 취소 처리된 평가 상세 정보 포함
- wasSubmittedToEvaluator 플래그: 각 평가가 1차 평가자에게 제출 상태였는지 여부 정보 포함
- 제출된 자기평가 없음: 1차 평가자에게 제출된 자기평가가 하나도 없는 경우 빈 결과 반환 (resetCount: 0)
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: employeeId 또는 periodId가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: resetCount, failedCount, totalCount, resetEvaluations, failedResets 포함
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '직원의 WBS 자기평가가 성공적으로 취소되었습니다. 취소 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ResetAllWbsSelfEvaluationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 취소할 자기평가가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ResetWbsSelfEvaluationsToEvaluatorByProject() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/project/:projectId/reset-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트별 WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 특정 프로젝트에 할당된 1차 평가자에게 제출된 모든 WBS 자기평가를 취소합니다. 프로젝트 단위로 평가를 관리할 때 유용하며, 해당 프로젝트의 WBS 항목에 대한 자기평가만 취소 처리됩니다.

**사용 시나리오:**
- 프로젝트 재평가: 특정 프로젝트의 평가를 다시 작성해야 하는 경우
- 프로젝트별 평가 취소: 피평가자가 특정 프로젝트의 평가를 일괄 취소하는 경우
- 프로젝트 평가 기간 연장: 프로젝트별로 평가 기간을 연장하는 경우

**취소 가능 조건:**
- 해당 프로젝트에 평가기간 내 WBS가 할당되어 있어야 함 (EvaluationWbsAssignment 존재)
- 자기평가가 1차 평가자에게 제출 상태(submittedToEvaluator: true)여야 함
- 이미 미제출 상태인 자기평가는 처리 대상에서 제외

**테스트 케이스:**
- 프로젝트별 취소: 특정 프로젝트의 모든 1차 평가자 제출된 WBS 자기평가를 취소
- 취소 개수 반환: resetCount에 실제 취소 처리된 평가 개수 포함
- 총 개수 반환: totalCount에 해당 프로젝트의 전체 자기평가 개수 포함
- 취소 목록 반환: resetEvaluations에 취소 처리된 평가 상세 정보 포함
- wasSubmittedToEvaluator 플래그: 각 평가가 1차 평가자에게 제출 상태였는지 여부 정보 포함
- WBS 할당 확인: 프로젝트에 할당된 WBS가 없는 경우 400 에러
- 제출된 자기평가 없음: 1차 평가자에게 제출된 자기평가가 하나도 없는 경우 빈 결과 반환 (resetCount: 0)
- 자기평가 내용 유지: 제출 상태만 변경되며 자기평가 내용과 점수는 유지됨
- 잘못된 UUID: employeeId, periodId, projectId 중 하나라도 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: resetCount, failedCount, totalCount, resetEvaluations, failedResets 포함
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'projectId',
        description: '프로젝트 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440003',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트의 WBS 자기평가가 성공적으로 취소되었습니다. 취소 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ResetWbsSelfEvaluationsByProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 프로젝트에 할당된 WBS가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ClearWbsSelfEvaluation() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/clear'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '자기평가 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiOperation)({
        summary: 'WBS 자기평가 내용 초기화 (단일)',
        description: `**중요**: 특정 WBS 자기평가의 내용(selfEvaluationContent, selfEvaluationScore, performanceResult)을 초기화합니다. 제출 상태인 자기평가도 초기화 가능하며, 초기화 시 제출 상태도 함께 초기화됩니다.

**주요 기능:**
- **내용 초기화**: selfEvaluationContent, selfEvaluationScore, performanceResult를 null 또는 기본값으로 초기화
- **제출 상태 초기화**: 제출된 자기평가도 초기화 시 미제출 상태로 변경 (isCompleted=false, completedAt=null)
- **멱등성 보장**: 여러 번 초기화해도 동일한 결과 반환
- **필드 유지**: ID, employeeId, wbsItemId, periodId, createdAt 등 메타데이터는 유지
- **updatedAt 갱신**: 초기화 시 updatedAt 자동 업데이트

**테스트 케이스:**
- 작성된 자기평가 초기화: 내용과 점수가 모두 초기화됨
- 제출된 자기평가 초기화: 내용 초기화와 함께 제출 상태도 미제출로 변경됨
- 멱등성: 여러 번 초기화해도 성공 (동일한 결과)
- 필드 유지: ID, 직원 정보, WBS 정보, createdAt은 변경되지 않음
- updatedAt 갱신: 초기화 시마다 수정 일시 갱신
- 잘못된 UUID: UUID 형식이 아닌 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 자기평가 ID로 요청 시 404 에러`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'WBS 자기평가 내용이 성공적으로 초기화되었습니다. 초기화된 자기평가 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.WbsSelfEvaluationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '자기평가를 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ClearAllWbsSelfEvaluationsByEmployeePeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/clear'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiOperation)({
        summary: '직원의 전체 WBS 자기평가 내용 한 번에 초기화',
        description: `**중요**: 특정 평가기간 내 특정 직원의 모든 WBS 자기평가 내용을 한 번에 초기화합니다. 제출된 자기평가도 함께 초기화되며, 제출 상태도 미제출로 변경됩니다.

**사용 시나리오:**
- 평가 재작성 요청: 평가를 다시 작성해야 하는 경우 모든 내용 일괄 초기화
- 관리자 초기화: 특정 직원의 평가를 전체적으로 초기화해야 하는 경우
- 데이터 정정: 잘못 입력된 데이터를 전체적으로 초기화하는 경우

**주요 기능:**
- **일괄 초기화**: 해당 직원의 평가기간 내 모든 WBS 자기평가 내용을 한 번에 초기화
- **제출 상태 초기화**: 제출된 자기평가도 미제출 상태로 변경
- **초기화 통계 제공**: clearedCount, clearedEvaluations 등 상세 정보 반환
- **자기평가 없는 경우**: 빈 결과 반환 (clearedCount: 0, clearedEvaluations: [])
- **필드 유지**: ID, 직원 정보, WBS 정보 등 메타데이터는 유지

**테스트 케이스:**
- 모든 자기평가 내용 초기화: 여러 WBS 자기평가를 한 번에 초기화
- 제출된 자기평가 초기화: 제출 상태인 자기평가도 내용과 함께 초기화
- 자기평가 없는 경우: 빈 결과 반환 (clearedCount: 0)
- 초기화 통계 반환: clearedCount, clearedEvaluations 배열 포함
- 초기화 상세 정보: 각 자기평가의 ID, WBS 항목 ID 등 포함
- 잘못된 employeeId UUID: UUID 형식이 아닌 경우 400 에러
- 잘못된 periodId UUID: UUID 형식이 아닌 경우 400 에러`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '직원의 WBS 자기평가 내용이 성공적으로 초기화되었습니다. 초기화 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ClearAllWbsSelfEvaluationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function SubmitWbsSelfEvaluationsToEvaluatorByProject() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/project/:projectId/submit-to-evaluator'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트별 WBS 자기평가 제출 (피평가자 → 1차 평가자)',
        description: `**중요**: 특정 평가기간 내 특정 직원의 특정 프로젝트에 할당된 모든 WBS 자기평가를 1차 평가자에게 제출합니다. 프로젝트 단위로 평가를 관리할 때 유용하며, 해당 프로젝트의 WBS 항목에 대한 자기평가만 제출 처리됩니다.

**사용 시나리오:**
- 프로젝트 완료: 특정 프로젝트가 완료되어 해당 프로젝트의 자기평가를 일괄 제출
- 프로젝트별 평가 관리: 여러 프로젝트를 수행하는 직원의 경우 프로젝트별로 평가 제출
- 단계별 제출: 프로젝트 진행 단계에 따라 순차적으로 평가 제출

**제출 가능 조건:**
- 해당 프로젝트에 평가기간 내 WBS가 할당되어 있어야 함 (EvaluationWbsAssignment 존재)
- 자기평가 내용 또는 점수가 입력되어 있어야 함
- 이미 1차 평가자에게 제출된 자기평가도 포함되어 제출 처리 (멱등성)

**테스트 케이스:**
- 프로젝트별 제출: 특정 프로젝트의 모든 WBS 자기평가를 1차 평가자에게 제출
- 제출 개수 반환: submittedCount에 실제 제출된 평가 개수 포함
- 총 개수 반환: totalCount에 해당 프로젝트의 전체 자기평가 개수 포함
- 완료 목록 반환: completedEvaluations에 제출된 평가 상세 정보 포함
- WBS 할당 확인: 프로젝트에 할당된 WBS가 없는 경우 400 에러
- 부분 작성: 일부만 작성된 경우 작성된 것만 제출, 나머지는 failedEvaluations에 포함
- 잘못된 UUID: employeeId, periodId, projectId 중 하나라도 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: submittedCount, failedCount, totalCount, completedEvaluations, failedEvaluations 포함
- 트랜잭션 보장: 일부 실패 시에도 성공한 자기평가는 제출 완료 처리`,
    }), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440002',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'projectId',
        description: '프로젝트 ID (UUID 형식)',
        example: '550e8400-e29b-41d4-a716-446655440003',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트의 WBS 자기평가가 성공적으로 1차 평가자에게 제출되었습니다. 제출 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.SubmitWbsSelfEvaluationsByProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류, 프로젝트에 할당된 WBS가 없음 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
function ClearWbsSelfEvaluationsByProject() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('employee/:employeeId/period/:periodId/project/:projectId/clear'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '직원 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }), (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가기간 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }), (0, swagger_1.ApiParam)({
        name: 'projectId',
        description: '프로젝트 ID (UUID 형식)',
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }), (0, swagger_1.ApiOperation)({
        summary: '프로젝트별 WBS 자기평가 내용 초기화',
        description: `**중요**: 특정 평가기간 내 특정 직원의 특정 프로젝트에 할당된 모든 WBS 자기평가 내용을 초기화합니다. 프로젝트 단위로 평가를 관리할 때 유용하며, 해당 프로젝트의 WBS 항목에 대한 자기평가만 초기화됩니다.

**사용 시나리오:**
- 프로젝트 재평가: 특정 프로젝트의 평가를 다시 작성해야 하는 경우
- 프로젝트별 데이터 정정: 특정 프로젝트의 평가 데이터를 초기화하는 경우
- 프로젝트 평가 취소: 관리자가 특정 프로젝트의 평가를 일괄 초기화하는 경우

**주요 기능:**
- **프로젝트 단위 초기화**: 해당 프로젝트에 연결된 WBS 자기평가만 초기화
- **제출 상태 초기화**: 제출된 자기평가도 미제출 상태로 변경
- **초기화 통계 제공**: clearedCount, clearedEvaluations 등 상세 정보 반환
- **WBS 할당 확인**: 프로젝트에 WBS가 할당되지 않은 경우 빈 결과 반환
- **필드 유지**: ID, 직원 정보, WBS 정보 등 메타데이터는 유지

**테스트 케이스:**
- 프로젝트별 내용 초기화: 특정 프로젝트의 모든 WBS 자기평가 내용을 초기화
- 제출된 프로젝트별 자기평가 초기화: 제출 상태인 자기평가도 내용과 함께 초기화
- WBS 할당 없는 프로젝트: WBS가 할당되지 않은 경우 빈 결과 반환 (clearedCount: 0)
- 초기화 통계 반환: employeeId, periodId, projectId, clearedCount, clearedEvaluations 포함
- 초기화 상세 정보: 각 자기평가의 ID, WBS 항목 ID 등 포함
- 잘못된 employeeId UUID: UUID 형식이 아닌 경우 400 에러
- 잘못된 periodId UUID: UUID 형식이 아닌 경우 400 에러
- 잘못된 projectId UUID: UUID 형식이 아닌 경우 400 에러`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트의 WBS 자기평가 내용이 성공적으로 초기화되었습니다. 초기화 결과 상세 정보를 반환합니다.',
        type: wbs_self_evaluation_dto_1.ClearWbsSelfEvaluationsByProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (UUID 형식 오류 등)',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: '권한이 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }));
}
//# sourceMappingURL=wbs-self-evaluation-api.decorators.js.map