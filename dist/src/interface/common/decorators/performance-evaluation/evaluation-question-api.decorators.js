"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQuestionGroup = CreateQuestionGroup;
exports.UpdateQuestionGroup = UpdateQuestionGroup;
exports.DeleteQuestionGroup = DeleteQuestionGroup;
exports.GetQuestionGroup = GetQuestionGroup;
exports.GetQuestionGroups = GetQuestionGroups;
exports.GetDefaultQuestionGroup = GetDefaultQuestionGroup;
exports.CreateEvaluationQuestion = CreateEvaluationQuestion;
exports.UpdateEvaluationQuestion = UpdateEvaluationQuestion;
exports.DeleteEvaluationQuestion = DeleteEvaluationQuestion;
exports.GetEvaluationQuestion = GetEvaluationQuestion;
exports.GetEvaluationQuestions = GetEvaluationQuestions;
exports.CopyEvaluationQuestion = CopyEvaluationQuestion;
exports.AddQuestionToGroup = AddQuestionToGroup;
exports.AddMultipleQuestionsToGroup = AddMultipleQuestionsToGroup;
exports.ReorderGroupQuestions = ReorderGroupQuestions;
exports.RemoveQuestionFromGroup = RemoveQuestionFromGroup;
exports.GetGroupQuestions = GetGroupQuestions;
exports.GetQuestionGroupsByQuestion = GetQuestionGroupsByQuestion;
exports.MoveQuestionUp = MoveQuestionUp;
exports.MoveQuestionDown = MoveQuestionDown;
exports.GetPartLeaderQuestionSettings = GetPartLeaderQuestionSettings;
exports.UpdatePartLeaderQuestionSettings = UpdatePartLeaderQuestionSettings;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_question_dto_1 = require("../../dto/performance-evaluation/evaluation-question.dto");
function CreateQuestionGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('question-groups'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '질문 그룹 생성',
        description: `평가 질문을 그룹으로 관리하기 위한 질문 그룹을 생성합니다.

**동작:**
- 새로운 질문 그룹 생성
- 그룹명은 중복될 수 없음
- 기본 그룹 설정 가능

**테스트 케이스:**
- 기본 생성: 그룹명을 지정하여 질문 그룹을 생성할 수 있어야 한다
- 기본 그룹 설정: isDefault를 true로 설정하여 기본 그룹을 생성할 수 있어야 한다
- createdBy 포함: 생성자 ID를 포함하여 생성할 수 있어야 한다
- 응답 구조 검증: 응답에 id와 message 필드가 포함되어야 한다
- 그룹명 중복: 동일한 그룹명으로 생성 시 409 에러가 발생해야 한다
- 그룹명 누락: name 필드 누락 시 400 에러가 발생해야 한다
- 빈 그룹명: 빈 문자열로 생성 시 400 에러가 발생해야 한다
- 공백만 포함된 그룹명: 공백만 포함된 그룹명으로 생성 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.CreateQuestionGroupDto,
        description: '질문 그룹 생성 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '질문 그룹이 성공적으로 생성되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 동일한 그룹명이 존재합니다.',
    }));
}
function UpdateQuestionGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('question-groups/:id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문 그룹 수정',
        description: `질문 그룹 정보를 수정합니다.

**동작:**
- 질문 그룹의 이름 또는 기본 그룹 설정 변경
- 변경된 그룹명이 다른 그룹과 중복되지 않아야 함
- 새로운 기본 그룹 설정 시 기존 기본 그룹 자동 해제

**테스트 케이스:**
- 그룹명 수정: name 필드로 그룹명을 변경할 수 있어야 한다
- 기본 그룹 설정: isDefault를 true로 변경하여 기본 그룹으로 설정할 수 있어야 한다
- 부분 수정: 일부 필드만 포함하여 수정할 수 있어야 한다
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 그룹명 중복: 다른 그룹과 중복되는 이름으로 변경 시 409 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다
- 빈 그룹명으로 수정: 빈 문자열로 수정 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '질문 그룹 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.UpdateQuestionGroupDto,
        description: '질문 그룹 수정 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문 그룹이 성공적으로 수정되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '질문 그룹을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 동일한 그룹명이 존재합니다.',
    }));
}
function DeleteQuestionGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)('question-groups/:id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '질문 그룹 삭제',
        description: `질문 그룹을 삭제합니다.

**동작:**
- 질문 그룹을 Soft Delete 처리
- 기본 그룹은 삭제 불가
- 삭제 불가능으로 설정된 그룹은 삭제 불가

**테스트 케이스:**
- 정상 삭제: 삭제 가능한 그룹을 삭제할 수 있어야 한다
- 기본 그룹 삭제 시도: isDefault가 true인 그룹 삭제 시 403 에러가 발생해야 한다
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '질문 그룹 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '질문 그룹이 성공적으로 삭제되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '삭제할 수 없는 그룹입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '질문 그룹을 찾을 수 없습니다.',
    }));
}
function GetQuestionGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('question-groups/:id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문 그룹 조회',
        description: `질문 그룹 상세 정보를 조회합니다.

**동작:**
- 질문 그룹 ID로 상세 정보 조회

**테스트 케이스:**
- 정상 조회: 유효한 ID로 그룹 정보를 조회할 수 있어야 한다
- 응답 구조 검증: 응답에 id, name, isDefault, isDeletable 등의 필드가 포함되어야 한다
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '질문 그룹 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문 그룹 정보 조회 성공',
        type: evaluation_question_dto_1.QuestionGroupResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '질문 그룹을 찾을 수 없습니다.',
    }));
}
function GetQuestionGroups() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('question-groups'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문 그룹 목록 조회',
        description: `전체 질문 그룹 목록을 조회합니다.

**동작:**
- 삭제되지 않은 모든 질문 그룹 조회
- 생성일시 오름차순으로 정렬

**테스트 케이스:**
- 목록 조회: 모든 질문 그룹을 조회할 수 있어야 한다
- 빈 목록: 그룹이 없을 때 빈 배열을 반환해야 한다
- 응답 구조 검증: 각 그룹 항목에 필수 필드가 포함되어야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문 그룹 목록 조회 성공',
        type: [evaluation_question_dto_1.QuestionGroupResponseDto],
    }));
}
function GetDefaultQuestionGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('question-groups/default'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '기본 질문 그룹 조회',
        description: `기본으로 설정된 질문 그룹을 조회합니다.

**동작:**
- isDefault가 true인 그룹 조회

**테스트 케이스:**
- 기본 그룹 조회: isDefault가 true인 그룹을 조회할 수 있어야 한다
- 응답 구조 검증: 응답에 id, name, isDefault, isDeletable 등의 필드가 포함되어야 한다
- 기본 그룹 없음: 기본 그룹이 설정되지 않은 경우 404 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '기본 질문 그룹 조회 성공',
        type: evaluation_question_dto_1.QuestionGroupResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '기본 질문 그룹이 설정되지 않았습니다.',
    }));
}
function CreateEvaluationQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 생성',
        description: `새로운 평가 질문을 생성합니다.

**동작:**
- 평가에 사용할 질문 생성
- 질문 내용은 중복될 수 없음
- 점수 범위 설정 가능 (최소/최대 점수)
- groupId 제공 시 해당 그룹에 자동으로 추가
- displayOrder 생략 시 그룹의 마지막 순서로 자동 배치

**테스트 케이스:**
- 기본 생성: 질문 내용만 지정하여 생성할 수 있어야 한다
- 점수 범위 포함: minScore, maxScore를 포함하여 생성할 수 있어야 한다
- 그룹 자동 추가: groupId와 displayOrder를 포함하여 생성 시 해당 그룹에 자동 추가되어야 한다
- displayOrder 자동 설정: groupId 포함, displayOrder 생략 시 그룹의 마지막 순서로 자동 배치되어야 한다
- displayOrder 명시: groupId와 displayOrder를 명시하면 해당 순서로 추가되어야 한다
- 그룹 없이 생성: groupId 없이 생성 시 어떤 그룹에도 속하지 않아야 한다
- 응답 구조 검증: 응답에 id와 message 필드가 포함되어야 한다
- 질문 내용 중복: 동일한 질문 내용으로 생성 시 409 에러가 발생해야 한다
- 질문 내용 누락: text 필드 누락 시 400 에러가 발생해야 한다
- 빈 질문 내용: 빈 문자열로 생성 시 400 에러가 발생해야 한다
- 공백만 포함된 질문: 공백만 포함된 질문으로 생성 시 400 에러가 발생해야 한다
- 잘못된 점수 범위: minScore >= maxScore인 경우 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.CreateEvaluationQuestionDto,
        description: '평가 질문 생성 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '평가 질문이 성공적으로 생성되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 동일한 질문 내용이 존재합니다.',
    }));
}
function UpdateEvaluationQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 수정',
        description: `평가 질문 정보를 수정합니다.

**동작:**
- 질문 내용 또는 점수 범위 변경
- 변경된 질문 내용이 다른 질문과 중복되지 않아야 함

**테스트 케이스:**
- 질문 내용 수정: text 필드로 질문 내용을 변경할 수 있어야 한다
- 점수 범위 수정: minScore, maxScore를 변경할 수 있어야 한다
- 부분 수정: 일부 필드만 포함하여 수정할 수 있어야 한다
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 질문 내용 중복: 다른 질문과 중복되는 내용으로 변경 시 409 에러가 발생해야 한다
- 잘못된 점수 범위: minScore >= maxScore인 경우 400 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 질문 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.UpdateEvaluationQuestionDto,
        description: '평가 질문 수정 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가 질문이 성공적으로 수정되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가 질문을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 동일한 질문 내용이 존재합니다.',
    }));
}
function DeleteEvaluationQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 삭제',
        description: `평가 질문을 삭제합니다.

**동작:**
- 평가 질문을 Soft Delete 처리
- 응답이 있는 질문은 삭제 불가

**테스트 케이스:**
- 정상 삭제: 응답이 없는 질문을 삭제할 수 있어야 한다
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 질문 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '평가 질문이 성공적으로 삭제되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '삭제할 수 없는 질문입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가 질문을 찾을 수 없습니다.',
    }));
}
function GetEvaluationQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 조회',
        description: `평가 질문 상세 정보를 조회합니다.

**동작:**
- 평가 질문 ID로 상세 정보 조회

**테스트 케이스:**
- 정상 조회: 유효한 ID로 질문 정보를 조회할 수 있어야 한다
- 응답 구조 검증: 응답에 id, text, minScore, maxScore 등의 필드가 포함되어야 한다
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '평가 질문 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가 질문 정보 조회 성공',
        type: evaluation_question_dto_1.EvaluationQuestionResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '평가 질문을 찾을 수 없습니다.',
    }));
}
function GetEvaluationQuestions() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 목록 조회',
        description: `전체 평가 질문 목록을 조회합니다.

**동작:**
- 삭제되지 않은 모든 평가 질문 조회
- 생성일시 오름차순으로 정렬

**테스트 케이스:**
- 목록 조회: 모든 평가 질문을 조회할 수 있어야 한다
- 빈 목록: 질문이 없을 때 빈 배열을 반환해야 한다
- 응답 구조 검증: 각 질문 항목에 필수 필드가 포함되어야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '평가 질문 목록 조회 성공',
        type: [evaluation_question_dto_1.EvaluationQuestionResponseDto],
    }));
}
function CopyEvaluationQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Post)(':id/copy'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '평가 질문 복사',
        description: `기존 평가 질문을 복사하여 새로운 질문을 생성합니다.

**동작:**
- 기존 질문의 내용과 점수 범위를 복사
- 질문 내용에 "(복사본)" 접미사 추가

**테스트 케이스:**
- 정상 복사: 유효한 ID로 질문을 복사할 수 있어야 한다
- 복사본 표시: 복사된 질문 내용에 "(복사본)"이 포함되어야 한다
- 응답 구조 검증: 응답에 새로운 질문의 id가 포함되어야 한다
- 존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '복사할 평가 질문 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '평가 질문이 성공적으로 복사되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '복사할 평가 질문을 찾을 수 없습니다.',
    }));
}
function AddQuestionToGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('question-group-mappings'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '그룹에 질문 추가',
        description: `질문을 특정 그룹에 추가합니다.

**동작:**
- 질문과 그룹을 매핑하여 추가
- 동일한 질문이 여러 그룹에 속할 수 있음
- displayOrder 생략 시 자동으로 그룹의 마지막 순서로 배치
- displayOrder 지정 시 해당 순서에 배치

**테스트 케이스:**
- 정상 추가: groupId, questionId로 추가할 수 있어야 한다 (displayOrder 자동 설정)
- 순서 지정 추가: displayOrder를 명시적으로 지정하여 추가할 수 있어야 한다
- 자동 순서 배치: displayOrder 생략 시 마지막 순서로 자동 배치되어야 한다
- 응답 구조 검증: 응답에 매핑 id가 포함되어야 한다
- 중복 매핑 방지: 동일한 그룹에 동일한 질문 추가 시 409 에러가 발생해야 한다
- 존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 질문: 유효하지 않은 questionId로 요청 시 404 에러가 발생해야 한다
- 필수 필드 누락: groupId 누락 시 400 에러가 발생해야 한다
- 필수 필드 누락: questionId 누락 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.AddQuestionToGroupDto,
        description: '그룹-질문 매핑 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '그룹에 질문이 성공적으로 추가되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '그룹 또는 질문을 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: '이미 해당 그룹에 질문이 추가되어 있습니다.',
    }));
}
function AddMultipleQuestionsToGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('question-group-mappings/batch'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '그룹에 여러 질문 추가',
        description: `여러 질문을 한 번에 특정 그룹에 추가합니다.

**동작:**
- 여러 질문을 배치로 그룹에 추가
- displayOrder는 startDisplayOrder부터 순차적으로 할당
- 이미 그룹에 추가된 질문은 건너뜀
- 개별 질문 추가 실패 시에도 나머지 질문은 계속 추가

**테스트 케이스:**
- 정상 추가: groupId와 questionIds 배열로 여러 질문을 추가할 수 있어야 한다
- 순차 순서: startDisplayOrder부터 순차적으로 displayOrder가 할당되어야 한다
- 응답 구조 검증: 응답에 ids, successCount, totalCount가 포함되어야 한다
- 중복 건너뛰기: 이미 추가된 질문은 건너뛰고 나머지만 추가해야 한다
- 존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 질문: 일부 questionId가 유효하지 않을 경우 404 에러가 발생해야 한다
- 필수 필드 누락: groupId 누락 시 400 에러가 발생해야 한다
- 필수 필드 누락: questionIds 누락 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.AddMultipleQuestionsToGroupDto,
        description: '여러 질문-그룹 매핑 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '그룹에 여러 질문이 성공적으로 추가되었습니다.',
        type: evaluation_question_dto_1.BatchSuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '그룹 또는 질문을 찾을 수 없습니다.',
    }));
}
function ReorderGroupQuestions() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('question-group-mappings/reorder'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '그룹 내 질문 순서 재정의',
        description: `그룹 내 질문들의 순서를 배열 인덱스 기준으로 재정렬합니다.

**동작:**
- 질문 ID 배열의 순서대로 displayOrder를 0부터 순차 할당
- 그룹의 모든 질문 ID를 제공해야 함
- 제공된 순서가 새로운 표시 순서가 됨

**테스트 케이스:**
- 정상 재정렬: groupId와 모든 questionIds 배열로 순서를 재정의할 수 있어야 한다
- 배열 순서 반영: 배열 인덱스 순서대로 displayOrder가 할당되어야 한다 (0, 1, 2, ...)
- 응답 구조 검증: 응답에 id와 message가 포함되어야 한다
- 일부 질문 누락: 그룹의 모든 질문을 포함하지 않으면 400 에러가 발생해야 한다
- 추가 질문 포함: 그룹에 없는 질문 ID 포함 시 400 에러가 발생해야 한다
- 중복 ID: 중복된 질문 ID 포함 시 400 에러가 발생해야 한다
- 존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.ReorderGroupQuestionsDto,
        description: '질문 순서 재정의 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '그룹 내 질문 순서가 성공적으로 재정의되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '그룹을 찾을 수 없습니다.',
    }));
}
function RemoveQuestionFromGroup() {
    return (0, common_1.applyDecorators)((0, common_1.Delete)('question-group-mappings/:mappingId'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '그룹에서 질문 제거',
        description: `그룹에서 특정 질문을 제거합니다.

**동작:**
- 질문-그룹 매핑을 Soft Delete 처리
- 질문 자체는 삭제되지 않음

**테스트 케이스:**
- 정상 제거: 유효한 매핑 ID로 제거할 수 있어야 한다
- 존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'mappingId',
        description: '질문-그룹 매핑 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '그룹에서 질문이 성공적으로 제거되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '매핑 정보를 찾을 수 없습니다.',
    }));
}
function GetGroupQuestions() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('question-groups/:groupId/questions'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '그룹의 질문 목록 조회',
        description: `특정 그룹에 속한 질문 목록을 조회합니다.

**동작:**
- 그룹에 매핑된 모든 질문 조회
- 질문 정보(text, minScore, maxScore 등)도 함께 반환
- 표시 순서(displayOrder) 오름차순으로 정렬

**테스트 케이스:**
- 정상 조회: 유효한 groupId로 질문 목록을 조회할 수 있어야 한다
- 빈 배열 반환: 질문이 없는 그룹의 경우 빈 배열을 반환해야 한다
- 응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder와 질문 정보(question)가 포함되어야 한다
- 순서 정렬: displayOrder 오름차순으로 정렬되어야 한다
- 존재하지 않는 그룹: 잘못된 ID로 요청 시 빈 배열을 반환해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'groupId',
        description: '질문 그룹 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '그룹의 질문 목록 조회 성공',
        type: [evaluation_question_dto_1.QuestionGroupMappingResponseDto],
    }));
}
function GetQuestionGroupsByQuestion() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('questions/:questionId/groups'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문이 속한 그룹 목록 조회',
        description: `특정 질문이 속한 그룹 목록을 조회합니다.

**동작:**
- 질문에 매핑된 모든 그룹 조회
- 그룹 정보(name, isDefault, isDeletable 등)도 함께 반환
- 한 질문이 여러 그룹에 속할 수 있음

**테스트 케이스:**
- 정상 조회: 유효한 questionId로 그룹 목록을 조회할 수 있어야 한다
- 빈 배열 반환: 어떤 그룹에도 속하지 않은 질문의 경우 빈 배열을 반환해야 한다
- 응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder와 그룹 정보(group)가 포함되어야 한다
- 존재하지 않는 질문: 잘못된 ID로 요청 시 빈 배열을 반환해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'questionId',
        description: '평가 질문 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문이 속한 그룹 목록 조회 성공',
        type: [evaluation_question_dto_1.QuestionGroupMappingResponseDto],
    }));
}
function MoveQuestionUp() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('question-group-mappings/:mappingId/move-up'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문 순서 위로 이동',
        description: `그룹 내 질문의 순서를 한 칸 위로 이동합니다.

**동작:**
- 현재 질문과 바로 위 질문의 순서를 swap
- 이미 첫 번째 위치인 경우 에러 반환

**테스트 케이스:**
- 정상 이동: 두 번째 이상 위치의 질문을 위로 이동할 수 있어야 한다
- 응답 구조 검증: 응답에 id와 message가 포함되어야 한다
- 첫 번째 위치: 이미 첫 번째 위치의 질문 이동 시도 시 400 에러가 발생해야 한다
- 존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'mappingId',
        description: '질문-그룹 매핑 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문 순서가 성공적으로 위로 이동되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '이미 첫 번째 위치입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '매핑 정보를 찾을 수 없습니다.',
    }));
}
function MoveQuestionDown() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)('question-group-mappings/:mappingId/move-down'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '질문 순서 아래로 이동',
        description: `그룹 내 질문의 순서를 한 칸 아래로 이동합니다.

**동작:**
- 현재 질문과 바로 아래 질문의 순서를 swap
- 이미 마지막 위치인 경우 에러 반환

**테스트 케이스:**
- 정상 이동: 마지막 이전 위치의 질문을 아래로 이동할 수 있어야 한다
- 응답 구조 검증: 응답에 id와 message가 포함되어야 한다
- 마지막 위치: 이미 마지막 위치의 질문 이동 시도 시 400 에러가 발생해야 한다
- 존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다
- 잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiParam)({
        name: 'mappingId',
        description: '질문-그룹 매핑 ID',
        type: 'string',
        format: 'uuid',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '질문 순서가 성공적으로 아래로 이동되었습니다.',
        type: evaluation_question_dto_1.SuccessResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '이미 마지막 위치입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '매핑 정보를 찾을 수 없습니다.',
    }));
}
function GetPartLeaderQuestionSettings() {
    return (0, common_1.applyDecorators)((0, common_1.Get)('part-leader-settings'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '파트장 질문 설정 조회',
        description: `파트장 간 동료평가에 사용되는 기본 질문 설정을 조회합니다.

**동작:**
- "파트장 평가 질문" 그룹과 해당 그룹의 질문 목록 조회
- displayOrder 순으로 정렬된 질문 목록 반환

**테스트 케이스:**
- 정상 조회: 파트장 질문 그룹과 질문 목록을 조회할 수 있어야 한다
- 응답 구조 검증: group과 questions 필드가 포함되어야 한다
- 질문 순서: questions가 displayOrder 오름차순으로 정렬되어야 한다
- 그룹 없음: 파트장 질문 그룹이 없는 경우 404 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '파트장 질문 설정 조회 성공',
        type: evaluation_question_dto_1.PartLeaderQuestionSettingsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '파트장 질문 그룹을 찾을 수 없습니다.',
    }));
}
function UpdatePartLeaderQuestionSettings() {
    return (0, common_1.applyDecorators)((0, common_1.Put)('part-leader-settings'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '파트장 질문 설정 업데이트',
        description: `파트장 간 동료평가에 사용되는 기본 질문 설정을 업데이트합니다.

**동작:**
- 기존 "파트장 평가 질문" 그룹의 모든 질문 매핑 제거
- 새로운 질문 ID 목록을 순서대로 그룹에 추가
- displayOrder는 배열의 인덱스 순서로 자동 설정 (0, 1, 2, ...)

**테스트 케이스:**
- 정상 업데이트: questionIds 배열로 질문 설정을 업데이트할 수 있어야 한다
- 순서 적용: 배열 순서대로 displayOrder가 설정되어야 한다
- 기존 질문 제거: 업데이트 시 기존 질문들이 제거되어야 한다
- 응답 구조 검증: 업데이트된 그룹과 질문 목록이 반환되어야 한다
- 빈 배열: 빈 배열로 요청 시 모든 질문이 제거되어야 한다
- 존재하지 않는 질문: 유효하지 않은 questionId 포함 시 404 에러가 발생해야 한다
- 필수 필드 누락: questionIds 누락 시 400 에러가 발생해야 한다`,
    }), (0, swagger_1.ApiBody)({
        type: evaluation_question_dto_1.UpdatePartLeaderQuestionSettingsDto,
        description: '파트장 질문 설정 업데이트 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '파트장 질문 설정이 성공적으로 업데이트되었습니다.',
        type: evaluation_question_dto_1.PartLeaderQuestionSettingsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '파트장 질문 그룹 또는 질문을 찾을 수 없습니다.',
    }));
}
//# sourceMappingURL=evaluation-question-api.decorators.js.map