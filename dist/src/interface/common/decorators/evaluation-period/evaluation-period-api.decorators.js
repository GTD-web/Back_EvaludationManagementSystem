"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDefaultGradeRanges = GetDefaultGradeRanges;
exports.GetActiveEvaluationPeriods = GetActiveEvaluationPeriods;
exports.GetEvaluationPeriods = GetEvaluationPeriods;
exports.GetEvaluationPeriodDetail = GetEvaluationPeriodDetail;
exports.UpdateDefaultGradeRanges = UpdateDefaultGradeRanges;
exports.CreateEvaluationPeriod = CreateEvaluationPeriod;
exports.StartEvaluationPeriod = StartEvaluationPeriod;
exports.CompleteEvaluationPeriod = CompleteEvaluationPeriod;
exports.UpdateEvaluationPeriodBasicInfo = UpdateEvaluationPeriodBasicInfo;
exports.UpdateEvaluationPeriodSchedule = UpdateEvaluationPeriodSchedule;
exports.UpdateEvaluationPeriodStartDate = UpdateEvaluationPeriodStartDate;
exports.UpdateEvaluationSetupDeadline = UpdateEvaluationSetupDeadline;
exports.UpdatePerformanceDeadline = UpdatePerformanceDeadline;
exports.UpdateSelfEvaluationDeadline = UpdateSelfEvaluationDeadline;
exports.UpdatePeerEvaluationDeadline = UpdatePeerEvaluationDeadline;
exports.UpdateEvaluationPeriodGradeRanges = UpdateEvaluationPeriodGradeRanges;
exports.UpdateCriteriaSettingPermission = UpdateCriteriaSettingPermission;
exports.UpdateSelfEvaluationSettingPermission = UpdateSelfEvaluationSettingPermission;
exports.UpdateFinalEvaluationSettingPermission = UpdateFinalEvaluationSettingPermission;
exports.UpdateManualSettingPermissions = UpdateManualSettingPermissions;
exports.CopyEvaluationPeriod = CopyEvaluationPeriod;
exports.ChangeEvaluationPeriodPhase = ChangeEvaluationPeriodPhase;
exports.DeleteEvaluationPeriod = DeleteEvaluationPeriod;
exports.GetEvaluationPeriodForCopy = GetEvaluationPeriodForCopy;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_response_dto_1 = require("../../dto/evaluation-period/evaluation-period-response.dto");
const evaluation_management_dto_1 = require("../../dto/evaluation-period/evaluation-management.dto");
function GetDefaultGradeRanges() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('default-grade-ranges'), (0, swagger_1.ApiOperation)({
        summary: '기본 등급 구간 조회',
        description: `평가 기간 생성 시 참고할 수 있는 기본 등급 구간 설정을 조회합니다.

**동작:**
- 설정된 등급의 기본 점수 구간을 반환합니다.
- 프론트엔드에서 평가 기간 생성 시 이 값을 기본값으로 사용할 수 있습니다.

**등급 구간 예시:**
- S: 121점 이상
- A+: 111-120점
- A: 101-110점
- B+: 91-100점
- B: 81-90점
- C: 71-80점
- D: 70점 이하

**테스트 케이스:**
- 기본 조회: 등급 구간을 올바른 순서로 반환
- 구간 겹침 없음: 모든 등급 구간이 겹치지 않음
- 유연한 범위: 사용자가 설정한 범위에 따라 다양한 등급 구간 지원`,
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '기본 등급 구간 설정',
        type: [evaluation_period_response_dto_1.GradeRangeResponseDto],
    }));
}
function GetActiveEvaluationPeriods() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('active'), (0, swagger_1.ApiOperation)({
        summary: '활성 평가 기간 조회',
        description: `**중요**: 오직 상태가 'in-progress'인 평가 기간만 반환됩니다. 대기 중('waiting')이나 완료된('completed') 평가 기간은 포함되지 않습니다.

**테스트 케이스:**
- 빈 상태: 활성 평가 기간이 없을 때 빈 배열 반환
- 다중 활성 기간: 여러 평가 기간 중 'in-progress' 상태인 기간만 필터링하여 반환
- 상태 확인: 반환된 평가 기간의 상태가 'in-progress'로 설정됨
- 완료된 기간 제외: 완료된('completed') 평가 기간은 활성 목록에서 제외됨
- 대기 중 기간 제외: 대기 중('waiting') 평가 기간은 활성 목록에 포함되지 않음
- 부분 완료: 여러 활성 기간 중 일부만 완료해도 나머지는 활성 목록에 유지됨`,
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '활성 평가 기간 목록',
        type: [evaluation_period_response_dto_1.EvaluationPeriodResponseDto],
    }));
}
function GetEvaluationPeriods() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(''), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 목록 조회',
        description: `**중요**: 모든 상태('waiting', 'in-progress', 'completed')의 평가 기간이 포함됩니다. 삭제된 평가 기간은 제외됩니다.

**테스트 케이스:**
- 빈 목록: 평가 기간이 없을 때 빈 배열과 페이징 정보 반환
- 다양한 평가 기간: 7개의 서로 다른 평가 기간을 3페이지로 나누어 조회
- 페이징 검증: 각 페이지의 항목들이 중복되지 않고 전체 개수가 일치함
- 페이지 범위 초과: 존재하지 않는 페이지 요청 시 빈 목록 반환
- 다양한 페이지 크기: 1, 2, 10개 등 다양한 limit 값으로 조회
- 모든 상태 포함: 대기, 진행 중, 완료된 평가 기간이 모두 목록에 포함됨
- 삭제된 기간 제외: 삭제된 평가 기간은 목록에서 제외됨
- 특수 이름: 특수문자, 한글, 영문이 포함된 이름의 평가 기간 조회
- 에러 처리: 잘못된 페이지/limit 값(음수, 0, 문자열 등)에 대한 적절한 응답`,
    }), (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: '페이지 번호 (기본값: 1, 최소값: 1)',
        example: 1,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: '페이지 크기 (기본값: 10, 최소값: 1)',
        example: 10,
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 목록 (페이징 정보 포함)',
        type: evaluation_period_response_dto_1.EvaluationPeriodListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 페이징 파라미터 (음수, 문자열 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function GetEvaluationPeriodDetail() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 상세 조회',
        description: `**테스트 케이스:**
- 기본 조회: 존재하는 평가 기간의 상세 정보 조회 (등급 구간, 날짜 필드 포함)
- 존재하지 않는 ID: null 반환 (404가 아닌 200 상태로 null 반환)
- 다양한 상태: 대기('waiting'), 활성('in-progress'), 완료('completed') 상태별 조회
- 복잡한 등급 구간: 7개 등급(S+, S, A+, A, B+, B, C) 구간을 가진 평가 기간 조회
- 삭제된 평가 기간: 삭제된 평가 기간 조회 시 null 반환
- 에러 처리: 잘못된 UUID 형식, 특수문자, SQL 인젝션 시도 등에 대한 적절한 에러 응답`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID (UUID 형식)' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 상세 정보 (존재하지 않을 경우 null 반환)',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdateDefaultGradeRanges() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('default-grade-ranges'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '기본 등급 구간 변경',
        description: `평가 기간 생성 시 사용되는 기본 등급 구간 설정을 변경합니다.

**동작:**
- 기본 등급 구간 설정을 사용자가 지정한 값으로 변경합니다.
- 변경된 설정은 이후 생성되는 평가 기간의 기본값으로 사용됩니다.
- 기존에 생성된 평가 기간에는 영향을 주지 않습니다.

**테스트 케이스:**
- 기본 변경: 유효한 등급 구간 배열로 기본값 변경
- 변경 후 조회: 변경된 기본값이 조회 API에서 반환됨
- 유효성 검증: 등급 구간의 유효성 검증 (중복, 겹침, 범위 등)
- 필수 필드 검증: gradeRanges 필드 누락 시 400 에러
- 잘못된 데이터: 빈 배열, 중복 등급, 범위 겹침 등 시 400 에러
- 범위 검증: minRange, maxRange가 0-1000 범위를 벗어날 시 400 에러
- 유연한 범위 설정: 사용자가 원하는 범위로 등급 구간 설정 가능`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_management_dto_1.UpdateDefaultGradeRangesApiDto,
        description: '기본 등급 구간 설정',
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '기본 등급 구간이 성공적으로 변경되었습니다.',
        type: [evaluation_period_response_dto_1.GradeRangeResponseDto],
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function CreateEvaluationPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(''), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 생성',
        description: `**테스트 케이스:**
- 기본 생성: 필수 필드로 평가 기간 생성 (name, startDate, peerEvaluationDeadline)
- 복잡한 등급 구간: 다양한 등급(S+, S, A+, A, B+, B, C+, C, D) 구간 설정
- 최소 데이터: 필수 필드만으로 생성 (기본값 자동 적용)
- 필수 필드 누락: name, startDate, peerEvaluationDeadline 누락 시 400 에러
- 중복 이름: 동일한 평가 기간명으로 생성 시 409 에러
- 겹치는 날짜: 기존 평가 기간과 날짜 범위 겹침 시 409 에러
- 잘못된 데이터: 음수 비율, 잘못된 등급 구간 범위 등 검증 에러`,
    }), (0, swagger_1.ApiResponse)({
        status: 201,
        description: '평가 기간이 성공적으로 생성되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({ status: 400, description: '잘못된 요청 데이터입니다.' }), (0, swagger_1.ApiResponse)({
        status: 409,
        description: '중복된 평가 기간명 또는 겹치는 날짜 범위입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류 (도메인 검증 실패 등)',
    }));
}
function StartEvaluationPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/start'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 시작',
        description: `**테스트 케이스:**
- 기본 시작: 대기 중인 평가 기간을 성공적으로 시작하여 'in-progress' 상태로 변경
- 활성 목록 반영: 시작된 평가 기간이 활성 목록에 즉시 나타남
- 복잡한 등급 구간: 다양한 등급 구간을 가진 평가 기간도 정상 시작
- 최소 데이터: 필수 필드만으로 생성된 평가 기간도 시작 가능
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 중복 시작: 이미 시작된 평가 기간 재시작 시 422 에러`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간이 성공적으로 시작되었습니다.',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '평가 기간을 시작할 수 없는 상태입니다. (이미 시작됨 또는 완료됨)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function CompleteEvaluationPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/complete'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 완료',
        description: `**테스트 케이스:**
- 기본 완료: 진행 중인 평가 기간을 성공적으로 완료하여 'completed' 상태로 변경
- 활성 목록 제거: 완료된 평가 기간이 활성 목록에서 즉시 제거됨
- 복잡한 등급 구간: 다양한 등급 구간을 가진 평가 기간도 정상 완료
- 최소 데이터: 필수 필드만으로 생성된 평가 기간도 완료 가능
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 대기 상태 완료: 시작되지 않은 평가 기간 완료 시 422 에러
- 중복 완료: 이미 완료된 평가 기간 재완료 시 422 에러
- 전체 시퀀스: 생성 -> 시작 -> 완료 전체 라이프사이클 정상 작동`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간이 성공적으로 완료되었습니다.',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '평가 기간을 완료할 수 없는 상태입니다. (대기 중이거나 이미 완료됨)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdateEvaluationPeriodBasicInfo() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/basic-info'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 기본 정보 부분 수정',
        description: `**테스트 케이스:**
- 개별 필드 수정: 이름, 설명, 자기평가 달성률을 각각 개별적으로 수정
- 전체 필드 수정: 모든 기본 정보를 동시에 수정
- 부분 수정: 일부 필드만 제공 시 나머지 필드는 기존 값 유지
- 빈 객체: 빈 객체 요청 시 모든 기존 값 유지
- 특수 문자: 특수 문자와 줄바꿈이 포함된 이름/설명 수정
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 빈 문자열: 빈 이름/설명으로 수정 시 400 에러
- 잘못된 타입: 숫자/배열 등 잘못된 타입으로 수정 시 400 에러
- 달성률 검증: 100% 미만, 200% 초과, 문자열 등 잘못된 달성률 시 400 에러
- 달성률 경계값: 100%, 200% 경계값 정상 처리
- 중복 이름: 다른 평가 기간과 중복된 이름으로 수정 시 409 에러
- 상태별 수정: 대기/진행 중 상태에서는 수정 가능, 완료 상태에서는 422 에러`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 기본 정보가 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터 (빈 문자열, 잘못된 타입, 달성률 범위 오류 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 409,
        description: '중복된 평가 기간명입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류 (완료된 평가 기간은 수정 불가 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdateEvaluationPeriodSchedule() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/schedule'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 일정 부분 수정',
        description: `**테스트 케이스:**
- 개별 날짜 수정: 시작일, 종료일, 각 단계별 마감일을 개별적으로 수정
- 전체 일정 수정: 모든 날짜 필드를 한 번에 수정
- 부분 수정: 일부 날짜만 제공 시 나머지는 기존 값 유지
- 빈 객체: 빈 객체 요청 시 모든 기존 값 유지
- 올바른 순서: 시작일 → 평가설정 → 업무수행 → 자기평가 → 하향동료평가 순서 검증
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 잘못된 날짜 형식: 400 에러 반환
- 잘못된 데이터 타입: 숫자/배열 등으로 요청 시 400 에러
- 날짜 순서 위반: 논리적 순서를 위반하는 날짜 설정 시 400 에러
- 완료된 평가 기간: 완료된 평가 기간 수정 시 422 에러
- 특수 날짜: 윤년, 타임존, 먼 미래 날짜 등 특수한 경우 처리`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 일정이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터 (날짜 형식 오류, 데이터 타입 오류, 날짜 순서 위반 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류 (완료된 평가 기간 수정 불가 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdateEvaluationPeriodStartDate() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/start-date'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 시작일 수정',
        description: `**테스트 케이스:**
- 기본 수정: 평가 기간의 시작일을 성공적으로 수정
- 적절한 날짜: 기존 종료일보다 이전 날짜로 수정
- 윤년 처리: 윤년 날짜(2월 29일)로 수정
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 잘못된 날짜 형식: 'invalid-date', '2024-13-01', '2024-02-30' 등으로 요청 시 400 에러
- 잘못된 데이터 타입: 숫자/불린/배열/객체 등으로 요청 시 400 에러
- 빈 요청 데이터: 빈 객체로 요청 시 400 에러
- 날짜 순서 위반: 시작일이 기존 종료일보다 늦을 때 400 에러
- 마감일 순서 위반: 시작일이 기존 마감일들보다 늦을 때 400 에러
- 완료된 평가 기간: 완료된 평가 기간 수정 시 422 에러
- 타임존 처리: 다양한 타임존 형식을 UTC로 정규화
- 먼 미래 날짜: 매우 먼 미래 날짜로 수정 가능`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 시작일이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터 (날짜 형식 오류, 데이터 타입 오류, 빈 요청, 날짜 순서 위반 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류 (완료된 평가 기간 수정 불가 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdateEvaluationSetupDeadline() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/evaluation-setup-deadline'), (0, swagger_1.ApiOperation)({
        summary: '평가설정 단계 마감일 수정',
        description: `**테스트 케이스:**
- 기본 수정: 평가설정 단계 마감일을 성공적으로 수정
- 시작일 이후 날짜: 시작일 이후 날짜로 마감일 수정
- 윤년 처리: 윤년 날짜(2월 29일)로 마감일 수정
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 잘못된 날짜 형식: 'invalid-date', '2024-13-01', '2024-02-30' 등으로 요청 시 400 에러
- 잘못된 데이터 타입: 숫자/불린/배열/객체 등으로 요청 시 400 에러 (일부 허용될 수 있음)
- 빈 요청 데이터: 빈 객체로 요청 시 400 에러
- 시작일 이전 날짜: 마감일이 시작일보다 이전일 때 400 에러 (부분적 구현)
- 종료일 이후 날짜: 마감일이 종료일보다 늦을 때 400 에러 (부분적 구현)
- 다른 마감일 순서 위반: 업무수행 마감일보다 늦을 때 400 에러 (부분적 구현)
- 완료된 평가 기간: 완료된 평가 기간 수정 시 422 에러 (부분적 구현)
- 타임존 처리: 다양한 타임존 형식을 UTC로 정규화
- 먼 미래 날짜: 매우 먼 미래 날짜로 수정 가능
- 월말 날짜: 다양한 월말 날짜(1월 31일, 윤년 2월 29일, 4월 30일 등) 처리`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가설정 단계 마감일이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터 (날짜 형식 오류, 데이터 타입 오류, 빈 요청, 날짜 순서 위반 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류 (완료된 평가 기간 수정 불가 등)',
    }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
function UpdatePerformanceDeadline() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/performance-deadline'), (0, swagger_1.ApiOperation)({
        summary: '업무 수행 단계 마감일 수정',
        description: `**중요**: 업무 수행 단계 마감일만 개별적으로 수정합니다. 다른 마감일과의 순서 관계를 자동으로 검증합니다.

**테스트 케이스:**
- 기본 수정: 유효한 날짜로 업무 수행 마감일 수정
- 순서 검증: 다른 마감일들과의 논리적 순서 준수
- 상태별 제한: WAITING(수정 가능), ACTIVE(제한적), COMPLETED(불가)
- 날짜 형식: 다양한 ISO 8601 형식 지원 (YYYY-MM-DD, UTC)
- 필수 필드 누락: performanceDeadline 누락 시 400 에러
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 순서 위반: 시작일보다 이전 날짜 설정 시 400 에러
- 논리적 순서 위반: 평가설정 마감일보다 이전 날짜 설정 시 400 에러
- 완료된 평가 기간: 수정 시도 시 422 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '업무 수행 단계 마감일이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateSelfEvaluationDeadline() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/self-evaluation-deadline'), (0, swagger_1.ApiOperation)({
        summary: '자기 평가 단계 마감일 수정',
        description: `**중요**: 자기 평가 단계 마감일만 개별적으로 수정합니다. 다른 마감일과의 순서 관계를 자동으로 검증합니다.

**테스트 케이스:**
- 기본 수정: 유효한 날짜로 자기 평가 마감일 수정
- 다양한 날짜 형식: ISO 8601 형식 지원 (YYYY-MM-DD, UTC)
- 윤년 처리: 윤년 날짜(2월 29일) 정상 처리
- 필수 필드 누락: selfEvaluationDeadline 누락 시 400 에러
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 잘못된 날짜 형식: 'invalid-date', '2024-13-01', '2024-02-30' 등 시 400 에러
- 잘못된 데이터 타입: 숫자/불린/배열/객체 등으로 요청 시 400 에러
- 시작일 이전 날짜: 시작일보다 이전 날짜 설정 시 400 에러
- 업무 수행 마감일 이전: 업무 수행 마감일보다 이전 날짜 설정 시 400 에러
- 하향/동료평가 마감일 이후: 하향/동료평가 마감일보다 늦은 날짜 설정 시 400 에러
- 상태별 제한: WAITING(수정 가능), ACTIVE(제한적), COMPLETED(422 에러)
- 월말/연말 날짜: 다양한 월말, 연말 날짜 정상 처리
- 긴 기간: 장기간 평가 기간에서 마감일 설정 가능
`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '자기 평가 단계 마감일이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdatePeerEvaluationDeadline() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/peer-evaluation-deadline'), (0, swagger_1.ApiOperation)({
        summary: '하향/동료평가 단계 마감일 수정',
        description: `**중요**: 하향/동료평가 단계 마감일만 개별적으로 수정합니다. 평가 프로세스의 최종 단계로서 다른 마감일과의 순서 관계를 자동으로 검증합니다.

**테스트 케이스:**
- 기본 수정: 유효한 날짜로 하향/동료평가 마감일 수정
- 다양한 날짜 형식: ISO 8601 형식 지원 (YYYY-MM-DD, UTC)
- 윤년 처리: 윤년 날짜(2월 29일) 정상 처리
- 필수 필드 누락: peerEvaluationDeadline 누락 시 400 에러
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 잘못된 날짜 형식: 'invalid-date', '2024-13-01', '2024-02-30' 등 시 400 에러
- 잘못된 데이터 타입: 숫자/불린/배열/객체 등으로 요청 시 400 에러
- 시작일 이전 날짜: 시작일보다 이전 날짜 설정 시 400 에러 (시작일과 같은 날은 허용)
- 자기 평가 마감일 이전: 자기 평가 마감일보다 이전 날짜 설정 시 400 에러
- 올바른 순서: 평가설정 → 업무수행 → 자기평가 → 하향/동료평가 순서 준수
- 최종 단계: 평가 프로세스의 마지막 단계로 설정 가능
- 상태별 제한: WAITING(수정 가능), ACTIVE(제한적), COMPLETED(422 에러)
- 월말/연말 날짜: 다양한 월말, 연말 날짜 정상 처리
- 긴 기간: 장기간 평가 기간에서 마감일 설정 가능
- 시작일과 동일: 시작일과 같은 날짜로 설정 가능 (특수 케이스)
- 데이터 무결성: 수정 후 다른 필드는 변경되지 않음
- 여러 번 수정: 동일 마감일을 여러 번 수정해도 무결성 유지`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '하향/동료평가 단계 마감일이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateEvaluationPeriodGradeRanges() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/grade-ranges'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 등급 구간 수정',
        description: `**중요**: 평가 기간의 등급 구간 설정을 전체 교체합니다. 기존 등급 구간은 모두 삭제되고 새로운 등급 구간으로 대체됩니다.

**테스트 케이스:**
- 기본 수정: 유효한 등급 구간 배열로 전체 교체
- 완전 교체: 기존과 완전히 다른 등급 구간으로 변경
- 단일 등급: 하나의 등급 구간만 설정 가능
- 경계값 처리: 0-100 범위 내 모든 값 지원
- 필수 필드 검증: grade, minRange, maxRange 모두 필수
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 빈 배열: 등급 구간 최소 1개 이상 필수
- 데이터 타입 검증: 문자열/숫자 타입 강제
- 범위 검증: minRange(0-1000), maxRange(0-1000)
- 중복 등급: 동일한 등급명 중복 시 422 에러
- 범위 순서: minRange < maxRange 필수
- 범위 겹침: 등급 구간 간 점수 범위 겹침 금지
- 상태별 제한: COMPLETED 상태 평가 기간 수정 제한
- 특수 문자: 등급명에 특수 문자 사용 가능
- 긴 등급명: 긴 등급명 지원
- 많은 등급: 다수의 등급 구간 설정 가능
- 반복 수정: 동일 데이터로 여러 번 수정 가능
`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 등급 구간이 성공적으로 수정되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateCriteriaSettingPermission() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/settings/criteria-permission'), (0, swagger_1.ApiOperation)({
        summary: '평가 기준 설정 수동 허용 부분 수정',
        description: `**중요**: 평가 기준 설정의 수동 허용 여부만 개별적으로 수정합니다. 다른 설정 필드는 변경되지 않습니다.

**테스트 케이스:**
- 기본 수정: allowManualSetting을 true/false로 변경
- 반복 수정: 동일한 값으로 여러 번 수정 가능
- 연속 변경: true → false → true 연속 변경 가능
- 필수 필드 검증: allowManualSetting 필드 누락 시 400 에러
- 데이터 타입 검증: 불린 값 외 모든 타입 거부 (문자열, 숫자, 배열, 객체, null)
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 상태별 제한: COMPLETED 상태 평가 기간 수정 제한
- 추가 필드: 요청에 추가 필드 포함되어도 정상 처리
- 빈 객체: 빈 객체 요청 시 400 에러
`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기준 설정 수동 허용이 성공적으로 변경되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateSelfEvaluationSettingPermission() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/settings/self-evaluation-permission'), (0, swagger_1.ApiOperation)({
        summary: '자기 평가 설정 수동 허용 부분 수정',
        description: `**중요**: 자기 평가 설정의 수동 허용 여부만 개별적으로 수정합니다. 다른 설정 필드는 변경되지 않으며, 평가 기준 설정 및 최종 평가 설정과 독립적으로 동작합니다.

**테스트 케이스:**
- allowManualSetting 필드를 true/false로 변경
- 필수 필드 검증: allowManualSetting 필드 누락 시 400 에러
- 데이터 타입 검증: 불린 값만 허용, 다른 타입 거부
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 상태별 제한: COMPLETED 상태 평가 기간 수정 제한
- 독립성: 다른 설정과 독립적으로 동작`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '자기 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateFinalEvaluationSettingPermission() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/settings/final-evaluation-permission'), (0, swagger_1.ApiOperation)({
        summary: '최종 평가 설정 수동 허용 부분 수정',
        description: `**중요**: 최종 평가 설정의 수동 허용 여부만 개별적으로 수정합니다. 다른 설정 필드는 변경되지 않으며, 평가 기준 설정 및 자기 평가 설정과 완전히 독립적으로 동작합니다.

**테스트 케이스:**
- allowManualSetting 필드를 true/false로 변경
- 필수 필드 검증: allowManualSetting 필드 누락 시 400 에러
- 데이터 타입 검증: 불린 값만 허용, 다른 타입 거부
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 상태별 제한: COMPLETED 상태 평가 기간 수정 제한
- 독립성: 다른 설정과 완전히 독립적으로 동작`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '최종 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function UpdateManualSettingPermissions() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id/settings/manual-permissions'), (0, swagger_1.ApiOperation)({
        summary: '전체 수동 허용 설정 부분 수정',
        description: `**중요**: 3개 수동 허용 설정(평가 기준, 자기 평가, 최종 평가)을 부분적으로 수정합니다. 모든 필드가 선택적이며, 요청에 포함된 필드만 변경되고 나머지는 기존 값을 유지합니다.

**테스트 케이스:**
- 전체 또는 부분 수정: 모든 설정 일괄 변경 또는 개별 설정만 변경
- 필드 검증: 각 필드는 불린 값(true/false)만 허용
- 선택적 필드: 모든 필드가 선택적이며, 빈 객체 요청도 허용
- 잘못된 UUID: 평가 기간 ID 형식 오류 시 400 에러
- 존재하지 않는 리소스: 평가 기간 미존재 시 404 에러
- 상태별 제한: COMPLETED 상태 평가 기간 수정 제한`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '전체 수동 허용 설정이 성공적으로 변경되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function CopyEvaluationPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':targetId/duplicate/:sourceId'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 복제',
        description: `소스 평가기간의 설정을 타겟 평가기간으로 복사합니다.

**동작:**
- 타겟 평가기간(URL의 :targetId)에 소스 평가기간(URL의 :sourceId)의 설정을 복사
- 기간(시작일, 마감일 등)은 유지하고 설정만 복사
- 복사되는 항목: 설명, 자기평가 달성률 최대값, 등급 구간, 수동 허용 설정

**복사되는 항목:**
- description (평가기간 설명)
- maxSelfEvaluationRate (자기평가 달성률 최대값)
- gradeRanges (등급 구간 설정)
- criteriaSettingEnabled (평가기준 설정 수동 허용)
- selfEvaluationSettingEnabled (자기평가 설정 수동 허용)
- finalEvaluationSettingEnabled (최종평가 설정 수동 허용)

**유지되는 항목 (복사되지 않음):**
- name (평가기간명)
- startDate (시작일)
- evaluationSetupDeadline (평가설정 마감일)
- performanceDeadline (업무수행 마감일)
- selfEvaluationDeadline (자기평가 마감일)
- peerEvaluationDeadline (하향동료평가 마감일)
- status (평가기간 상태)
- currentPhase (현재 단계)

**테스트 케이스:**
- 기본 복제: 소스 평가기간의 설정이 타겟 평가기간에 정상 복사됨
- 등급 구간 복제: 소스의 등급 구간 설정이 타겟에 정확히 복사됨
- 수동 허용 설정 복제: 소스의 수동 허용 설정이 타겟에 정확히 복사됨
- 기간 정보 유지: 타겟의 기간 정보(시작일, 마감일 등)는 변경되지 않음
- 존재하지 않는 소스: 소스 평가기간 ID가 잘못된 경우 404 에러
- 존재하지 않는 타겟: 타겟 평가기간 ID가 잘못된 경우 404 에러
- 잘못된 UUID: UUID 형식이 잘못된 경우 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'targetId',
        description: '타겟 평가기간 ID (복사 대상)',
        example: '123e4567-e89b-12d3-a456-426614174001',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiParam)({
        name: 'sourceId',
        description: '소스 평가기간 ID (복사할 원본)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 설정이 성공적으로 복사되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 처리할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function ChangeEvaluationPeriodPhase() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/phase-change'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가기간 단계 변경',
        description: `**중요**: 평가기간의 현재 단계를 다음 단계로 변경합니다. 단계는 순차적으로만 변경 가능하며, 건너뛰기나 역방향 변경은 허용되지 않습니다.

**단계 순서:**
1. waiting → evaluation-setup
2. evaluation-setup → performance  
3. performance → self-evaluation
4. self-evaluation → peer-evaluation
5. peer-evaluation → closure

**테스트 케이스:**
- 정상 단계 변경: 유효한 단계 순서로 변경 시 성공
- 순차적 변경: 다음 단계로만 변경 가능 (건너뛰기 불가)
- 역방향 변경: 이전 단계로 되돌리기 불가
- 잘못된 단계: 지원하지 않는 단계로 변경 시 400 에러
- 존재하지 않는 ID: 유효하지 않은 평가기간 ID 시 404 에러
- 비활성 상태: 대기 중이거나 완료된 평가기간은 단계 변경 불가
- 권한 확인: 관리자 권한이 필요한 작업`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '단계가 성공적으로 변경되었습니다.',
        type: evaluation_period_response_dto_1.EvaluationPeriodResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: '잘못된 단계 변경 요청입니다.' },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 403,
        description: '단계 변경 권한이 없습니다.',
    }));
}
function DeleteEvaluationPeriod() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 삭제',
        description: `**중요**: 평가 기간을 완전히 삭제합니다. 이 작업은 되돌릴 수 없으므로 신중하게 사용해야 합니다. 삭제된 평가 기간은 목록과 상세 조회에서 제외됩니다.

**테스트 케이스:**
- 기본 삭제: 대기 중이거나 완료된 평가 기간 삭제 가능
- 삭제 후 제외: 삭제된 평가 기간은 목록 및 상세 조회에서 제외됨
- 잘못된 UUID: 형식이 올바르지 않은 ID로 요청 시 400 에러
- 존재하지 않는 ID: 유효하지만 존재하지 않는 ID로 요청 시 404 에러
- 중복 삭제: 이미 삭제된 평가 기간 재삭제 시 404 에러
- 활성 상태 제한: 진행 중인 평가 기간은 삭제 제한 적용`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 기간 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        schema: { type: 'string', format: 'uuid' },
    }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간이 성공적으로 삭제되었습니다.',
        schema: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    example: true,
                    description: '삭제 성공 여부',
                },
            },
            example: { success: true },
        },
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 404,
        description: '평가 기간을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 422,
        description: '비즈니스 로직 오류로 삭제할 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: 500,
        description: '서버 내부 오류',
    }));
}
function GetEvaluationPeriodForCopy() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id/for-copy'), (0, swagger_1.ApiOperation)({
        summary: '평가 기간 복제용 데이터 조회',
        description: `이전 평가 기간의 설정을 새 평가 기간에 복사하기 위한 데이터를 조회합니다.

**동작:**
- 평가 기간의 기본 정보, 평가항목, 평가라인을 조회합니다.
- 복사 시 제외되는 정보 (평가 기간명, 날짜 정보, 상태 및 진행 단계)는 포함하지 않습니다.

**반환 데이터:**
- evaluationPeriod: 평가 기간의 기본 정보 (설명, 자기평가 달성률, 등급 구간, 수동 허용 설정)
- evaluationCriteria: 평가 기간에 연결된 모든 WBS의 평가 기준 목록
- evaluationLines: 평가 기간에 연결된 모든 평가 라인 및 매핑 정보

**테스트 케이스:**
- 기본 조회: 존재하는 평가 기간의 복제용 데이터를 성공적으로 조회
- 평가항목 포함: WBS 평가 기준 목록이 올바르게 포함됨
- 평가라인 포함: 평가 라인 및 매핑 정보가 올바르게 포함됨
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환`,
    }), (0, swagger_1.ApiParam)({ name: 'id', description: '평가 기간 ID (UUID 형식)' }), (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가 기간 복제용 데이터',
        schema: {
            type: 'object',
            properties: {
                evaluationPeriod: { type: 'object' },
                evaluationCriteria: {
                    type: 'array',
                    items: { type: 'object' },
                },
                evaluationLines: {
                    type: 'object',
                    properties: {
                        lines: {
                            type: 'array',
                            items: { type: 'object' },
                        },
                        mappings: {
                            type: 'array',
                            items: { type: 'object' },
                        },
                    },
                },
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }), (0, swagger_1.ApiResponse)({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }), (0, swagger_1.ApiResponse)({ status: 500, description: '서버 내부 오류' }));
}
//# sourceMappingURL=evaluation-period-api.decorators.js.map