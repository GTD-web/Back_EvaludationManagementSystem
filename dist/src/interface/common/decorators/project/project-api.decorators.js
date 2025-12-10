"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProject = CreateProject;
exports.CreateProjectsBulk = CreateProjectsBulk;
exports.GetProjectList = GetProjectList;
exports.GetProjectDetail = GetProjectDetail;
exports.UpdateProject = UpdateProject;
exports.DeleteProject = DeleteProject;
exports.GetProjectManagers = GetProjectManagers;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const project_dto_1 = require("../../dto/project/project.dto");
__exportStar(require("./generate-child-projects-api.decorator"), exports);
function CreateProject() {
    return (0, common_1.applyDecorators)((0, common_2.Post)(), (0, common_2.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 생성 (하위 프로젝트 자동 생성 포함)',
        description: `새로운 프로젝트를 생성합니다. 하위 프로젝트를 함께 생성할 수 있습니다.

**동작:**
- 프로젝트 기본 정보를 등록합니다
- 상위 프로젝트: PM(Project Manager)을 설정할 수 있습니다
- childProjects 배열로 하위 프로젝트를 함께 생성할 수 있습니다
- ⭐ **모든 하위 프로젝트는 최상위 프로젝트의 PM으로 자동 설정됩니다**
- orderLevel 순서대로 재귀 체인 구조를 만듭니다
- 프로젝트 코드 중복을 검사합니다
- 생성자 정보를 자동으로 기록합니다

**하위 프로젝트 자동 생성 (트리 구조):**
\`\`\`json
{
  "name": "EMS 프로젝트",
  "managerId": "pm-top",
  "childProjects": [
    { "orderLevel": 1, "name": "1차 A" },
    { "orderLevel": 1, "name": "1차 B" },
    { "orderLevel": 1, "name": "1차 C" },
    { "orderLevel": 2, "name": "2차 A" },
    { "orderLevel": 2, "name": "2차 B" }
  ]
}
\`\`\`
**결과 구조 (모든 하위가 pm-top 상속):**
\`\`\`
EMS 프로젝트 (pm-top)
  ├─ 1차 A (pm-top) ← 최상위 PM 상속
  ├─ 1차 B (pm-top) ← 최상위 PM 상속
  └─ 1차 C (pm-top) ← 최상위 PM 상속
      ├─ 2차 A (pm-top) ← 최상위 PM 상속
      └─ 2차 B (pm-top) ← 최상위 PM 상속
\`\`\`
• 같은 orderLevel은 형제 관계
• 다음 레벨은 이전 레벨의 마지막 프로젝트 아래
• 하위 프로젝트의 managerId는 입력해도 무시됨

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID
- childProjects: 생성된 하위 프로젝트 (재귀 구조, 모두 동일한 PM)

**테스트 케이스:**
- 단일 프로젝트 생성: childProjects 없이 생성
- 하위 포함 생성: childProjects 배열로 재귀 체인 생성
- PM 자동 상속: 모든 하위가 최상위 PM으로 설정됨
- orderLevel 자동 정렬: 순서 상관없이 orderLevel로 정렬됨
- 프로젝트 코드 자동 생성: 하위 코드 미입력 시 자동 생성
- 프로젝트 코드 중복: 중복 코드 사용 시 400 에러
- 필수 필드 누락: name 누락 시 400 에러`,
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.CreateProjectDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '프로젝트가 성공적으로 생성되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function CreateProjectsBulk() {
    return (0, common_1.applyDecorators)((0, common_2.Post)('bulk'), (0, common_2.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 일괄 생성 (하위 프로젝트 자동 생성 포함)',
        description: `여러 프로젝트를 한 번에 생성합니다. 각 프로젝트마다 하위 프로젝트를 함께 생성할 수 있습니다.

**동작:**
- 여러 프로젝트를 배열로 받아 일괄 생성합니다
- 각 최상위 프로젝트별로 PM을 개별 설정할 수 있습니다
- 각 프로젝트마다 childProjects 배열로 하위 프로젝트를 함께 생성할 수 있습니다
- ⭐ **모든 하위 프로젝트는 해당 최상위 프로젝트의 PM으로 자동 설정됩니다**
- orderLevel 순서대로 재귀 체인 구조를 만듭니다
- 프로젝트 코드 중복을 사전 검사합니다
- 일부 프로젝트 생성 실패 시에도 성공한 프로젝트는 저장됩니다
- 성공/실패 항목을 구분하여 응답합니다
- 생성자 정보를 자동으로 기록합니다
- 생성 후 각 프로젝트의 매니저 정보를 포함합니다 (managerId, employeeId)

**하위 프로젝트 자동 생성 (트리 구조):**
\`\`\`json
{
  "projects": [
    {
      "name": "EMS 프로젝트",
      "managerId": "pm-ems",
      "childProjects": [
        { "orderLevel": 1, "name": "1차 A" },
        { "orderLevel": 1, "name": "1차 B" },
        { "orderLevel": 2, "name": "2차 A" }
      ]
    },
    {
      "name": "HRM 프로젝트",
      "managerId": "pm-hrm",
      "childProjects": [
        { "orderLevel": 1, "name": "인사" },
        { "orderLevel": 1, "name": "급여" }
      ]
    }
  ]
}
\`\`\`
**결과 구조 (하위는 각 최상위 PM 상속):**
\`\`\`
EMS 프로젝트 (pm-ems)
  ├─ 1차 A (pm-ems) ← 최상위 PM 상속
  └─ 1차 B (pm-ems) ← 최상위 PM 상속
      └─ 2차 A (pm-ems) ← 최상위 PM 상속

HRM 프로젝트 (pm-hrm)
  ├─ 인사 (pm-hrm) ← 최상위 PM 상속
  └─ 급여 (pm-hrm) ← 최상위 PM 상속
\`\`\`
• 같은 orderLevel은 형제 관계
• 다음 레벨은 이전 레벨의 마지막 프로젝트 아래
• 하위 프로젝트의 managerId는 입력해도 무시됨

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)
- childProjects: 생성된 하위 프로젝트 (재귀 구조, 각 트리마다 동일한 PM)

**테스트 케이스:**
- 전체 성공: 모든 프로젝트가 정상적으로 생성됨
- 매니저 정보 포함: 각 프로젝트의 managerId와 employeeId 반환
- 하위 포함 일괄 생성: 각 프로젝트마다 childProjects로 재귀 체인 생성
- PM 자동 상속: 각 트리의 하위들이 최상위 PM으로 설정됨
- orderLevel 자동 정렬: 순서 상관없이 orderLevel로 정렬됨
- 프로젝트 코드 자동 생성: 하위 코드 미입력 시 자동 생성
- 부분 성공: 일부 프로젝트만 생성 성공하고 나머지는 실패
- 최상위별 PM: 각 최상위 프로젝트별로 다른 PM 지정
- 프로젝트 코드 중복: 중복된 코드가 있는 프로젝트는 실패 처리
- 빈 배열: 프로젝트 배열이 비어있는 경우
- 필수 필드 누락: 일부 프로젝트의 필수 필드 누락 시 해당 항목만 실패
- 잘못된 데이터: 유효하지 않은 데이터가 있는 경우 해당 항목만 실패`,
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.CreateProjectsBulkDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '프로젝트 일괄 생성 완료 (일부 실패 가능)',
        type: project_dto_1.ProjectsBulkCreateResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function GetProjectList() {
    return (0, common_1.applyDecorators)((0, common_2.Get)(), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 목록 조회 (계층 구조)',
        description: `프로젝트 목록을 계층 구조로 조회합니다. 상위 프로젝트 안에 하위 프로젝트들이 nested됩니다.

**동작:**
- **기본 동작**: 상위 프로젝트들을 조회하고, 각 상위 안에 하위 프로젝트들을 포함 (계층 구조)
- 페이징을 지원하여 대량의 프로젝트를 효율적으로 조회합니다
- 다양한 필터 조건으로 프로젝트를 검색할 수 있습니다
- 정렬 기준과 방향을 지정할 수 있습니다
- 소프트 삭제된 프로젝트는 제외됩니다
- 각 프로젝트의 매니저 정보와 계층 정보를 포함합니다

**계층 구조 동작:**
- **파라미터 없음 또는 hierarchyLevel=parent**: 계층 구조로 반환 (상위 + 하위 nested)
- **hierarchyLevel=child**: Flat 구조로 하위 프로젝트만 반환
- **parentProjectId 지정**: Flat 구조로 특정 상위의 하위만 반환

**반환 형식 (계층 구조):**
\`\`\`json
{
  "projects": [
    {
      "id": "parent-1-id",
      "name": "상위 프로젝트 1",
      "manager": { "managerId": "...", "name": "PM 이름" },
      "childProjects": [
        { "id": "child-1-id", "name": "하위 1", "manager": {...} },
        { "id": "child-2-id", "name": "하위 2", "manager": {...} }
      ],
      "childProjectCount": 2
    }
  ]
}
\`\`\`

**계층 구조 필터:**
- hierarchyLevel=parent (또는 생략): 상위 프로젝트 + 하위 nested
- hierarchyLevel=child: 하위 프로젝트만 flat
- parentProjectId: 특정 상위의 하위만 flat

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID (PM 또는 DPM)
- manager.employeeId: 로컬 DB의 직원 ID
- childProjects: 하위 프로젝트 배열 (계층 구조인 경우)
- childProjectCount: 하위 프로젝트 수
- parentProjectId: 하위 프로젝트인 경우 상위 프로젝트 ID

**테스트 케이스:**
- 기본 조회 (계층 구조): 파라미터 없이 조회 → 상위 + 하위 nested
- 상위만 조회: hierarchyLevel=parent → 계층 구조
- 하위만 조회: hierarchyLevel=child → flat 구조
- 특정 상위의 하위: parentProjectId=xxx → flat 구조
- 매니저 필터: PM으로 필터링 (하위도 포함)
- 프로젝트명 검색: search=EMS → 이름에 "EMS" 포함된 프로젝트
- 페이징: 상위 프로젝트 기준 페이징`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 목록이 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectListResponseDto,
    }));
}
function GetProjectDetail() {
    return (0, common_1.applyDecorators)((0, common_2.Get)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 상세 조회',
        description: `특정 프로젝트의 상세 정보를 조회합니다. 하위 프로젝트 목록을 포함합니다.

**동작:**
- 프로젝트 ID로 상세 정보를 조회합니다
- 매니저 정보를 포함하여 반환합니다 (managerId, employeeId)
- 상위 프로젝트인 경우 하위 프로젝트 목록을 포함합니다
- 하위 프로젝트인 경우 상위 프로젝트 정보를 포함합니다
- 삭제된 프로젝트는 조회되지 않습니다

**계층 구조 정보:**
- childProjects: 하위 프로젝트 목록 (상위 프로젝트인 경우)
- childProjectCount: 하위 프로젝트 수
- parentProjectId: 상위 프로젝트 ID (하위 프로젝트인 경우)

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID (PM 또는 DPM)
- manager.employeeId: 로컬 DB의 직원 ID
- childProjects: 하위 프로젝트 간단 정보 배열
- parentProjectId: 상위 프로젝트 ID

**테스트 케이스:**
- 상위 프로젝트 조회: 하위 프로젝트 목록 포함
- 하위 프로젝트 조회: parentProjectId 포함
- 매니저 정보 포함: PM 또는 DPM 정보 포함
- 존재하지 않는 프로젝트: 404 에러
- 삭제된 프로젝트: 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 상세 정보가 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 UUID 형식입니다.',
    }));
}
function UpdateProject() {
    return (0, common_1.applyDecorators)((0, common_2.Put)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 수정 (하위 프로젝트 재생성 포함)',
        description: `기존 프로젝트의 정보를 수정합니다. 하위 프로젝트를 재생성할 수 있습니다.

**동작:**
- 프로젝트 기본 정보를 수정합니다
- 프로젝트 매니저를 변경할 수 있습니다
- ⭐ **PM 변경 시 모든 하위 프로젝트의 PM도 함께 변경됩니다**
- childProjects를 제공하면 기존 하위를 삭제하고 새로 생성합니다
- childProjects를 생략하면 기존 하위 프로젝트는 유지됩니다
- 프로젝트 코드 변경 시 중복을 검사합니다
- 수정자 정보를 자동으로 기록합니다

**하위 프로젝트 재생성 (트리 구조):**
\`\`\`json
{
  "name": "수정된 프로젝트명",
  "managerId": "pm-new",
  "childProjects": [
    { "orderLevel": 1, "name": "새 1차 A" },
    { "orderLevel": 1, "name": "새 1차 B" },
    { "orderLevel": 2, "name": "새 2차" }
  ]
}
\`\`\`
**결과:** 기존 하위 삭제 → 새 트리 생성 (모두 pm-new로 설정)
• 하위 프로젝트의 managerId는 입력해도 무시됨

**주의사항:**
- childProjects=[] (빈 배열): 모든 하위 프로젝트 삭제
- childProjects 생략: 하위 프로젝트 변경 없음

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID
- childProjects: 재생성된 하위 프로젝트 (모두 동일한 PM)

**테스트 케이스:**
- 기본 정보만 수정: childProjects 생략
- PM 변경: 모든 하위의 PM도 함께 변경
- 하위 재생성: childProjects로 새 하위 생성
- 하위 삭제: childProjects=[]로 모두 삭제
- 프로젝트 코드 중복: 400 에러
- 존재하지 않는 프로젝트: 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiBody)({ type: project_dto_1.UpdateProjectDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트가 성공적으로 수정되었습니다.',
        type: project_dto_1.ProjectResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }));
}
function DeleteProject() {
    return (0, common_1.applyDecorators)((0, common_2.Delete)(':id'), (0, common_2.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({
        summary: '프로젝트 삭제 (하위 프로젝트 CASCADE)',
        description: `프로젝트를 소프트 삭제합니다. 하위 프로젝트도 함께 삭제됩니다.

**동작:**
- 프로젝트와 모든 하위 프로젝트를 소프트 삭제 처리합니다
- 자신과 모든 하위의 평가 할당을 체크합니다
- 할당이 하나라도 있으면 삭제가 거부됩니다 (400 에러)
- 삭제자 정보를 자동으로 기록합니다
- 실제 데이터는 유지되어 복구 가능합니다

**CASCADE 삭제:**
- 상위 프로젝트 삭제 시 모든 하위도 함께 삭제됩니다
- 삭제 전 각 프로젝트의 할당 여부를 체크합니다
- 하위 중 하나라도 할당이 있으면 전체 삭제가 실패합니다

**예시:**
\`\`\`
상위 프로젝트 삭제 시도
  → 1차 하위 할당 체크 ✅
  → 2차 하위 할당 체크 ✅
  → 3차 하위 할당 체크 ❌ (할당 있음)
  → 전체 삭제 실패 (400 에러)
\`\`\`

**테스트 케이스:**
- 단일 프로젝트 삭제: 하위 없는 프로젝트 삭제
- 하위 포함 삭제: 상위 삭제 시 모든 하위도 삭제
- 할당 있는 경우: 자신 또는 하위에 할당이 있으면 400 에러
- 삭제 후 조회: 삭제된 프로젝트 조회 시 404 에러
- 존재하지 않는 프로젝트: 404 에러
- 잘못된 UUID 형식: 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: '프로젝트가 성공적으로 삭제되었습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '프로젝트를 찾을 수 없습니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 UUID 형식입니다.',
    }));
}
function GetProjectManagers() {
    return (0, common_1.applyDecorators)((0, common_2.Get)('managers'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: 'PM(프로젝트 매니저) 목록 조회',
        description: `SSO에서 PM으로 지정 가능한 직원 목록을 조회합니다.

**동작:**
- SSO 서비스에서 전체 직원 정보를 조회합니다
- 관리 권한이 있는 직원들을 필터링합니다
- 로컬 Employee 테이블과 매핑하여 employeeId를 포함합니다
- 부서, 직책, 직급 정보를 포함하여 반환합니다
- 검색어로 이름, 사번, 이메일 필터링이 가능합니다
- 부서 ID로 특정 부서의 PM만 조회 가능합니다

**반환 데이터:**
- managerId: SSO의 매니저 ID
- employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)
- 기타 직원 정보 (사번, 이름, 이메일, 부서, 직책 등)

**테스트 케이스:**
- 전체 PM 목록 조회: 필터 없이 모든 PM 목록 조회
- employeeId 매핑 확인: 각 PM의 employeeId가 올바르게 매핑됨
- 부서별 PM 조회: 특정 부서의 PM만 조회
- 검색어로 필터링: 이름, 사번, 이메일로 검색
- 관리 권한 보유자만 조회: hasManagementAuthority가 true인 직원만 포함
- 빈 결과: 조건에 맞는 PM이 없는 경우 빈 배열 반환`,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'PM 목록이 성공적으로 조회되었습니다.',
        type: project_dto_1.ProjectManagerListResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        description: 'SSO 서비스 연결 실패',
    }));
}
//# sourceMappingURL=project-api.decorators.js.map