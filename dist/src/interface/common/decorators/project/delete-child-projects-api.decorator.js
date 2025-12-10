"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteChildProjects = DeleteChildProjects;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const delete_child_projects_dto_1 = require("../../dto/project/delete-child-projects.dto");
function DeleteChildProjects() {
    return (0, common_1.applyDecorators)((0, common_2.Delete)('children'), (0, common_2.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '하위 프로젝트 일괄 삭제 🗑️',
        description: `자동 생성된 모든 하위 프로젝트를 일괄 삭제합니다.

**삭제 대상:**
- \`parentProjectId\`가 NULL이 아닌 모든 프로젝트
- 프로젝트 코드에 \`-SUB\` 패턴이 포함된 프로젝트
- 이름에 "하위 프로젝트" 또는 "N차" 패턴이 포함된 프로젝트

**삭제 방식:**

1. **Soft Delete (기본값)**
   - \`deletedAt\` 필드만 업데이트
   - 데이터는 보존되며 복구 가능
   - 안전한 방식

2. **Hard Delete**
   - 데이터베이스에서 영구 삭제
   - 복구 불가능
   - ⚠️ 주의 필요

**할당 체크:**

기본적으로 프로젝트에 할당이 있는지 확인합니다:
- 할당이 있으면 삭제 실패
- \`forceDelete=true\` 시 할당 체크 생략 (⚠️ 위험)

**실행 전 확인사항:**

✅ 백업 완료 여부
✅ 삭제할 프로젝트 목록 확인
✅ 할당 데이터 확인
✅ 운영 환경인지 확인

**사용 시나리오:**

1. **테스트 데이터 정리**
   - 개발/테스트 환경에서 생성한 하위 프로젝트 제거
   - Soft Delete 사용 권장

2. **완전 초기화**
   - 데모 후 데이터 완전 제거
   - Hard Delete + Force 사용

3. **재생성 준비**
   - 기존 하위 프로젝트 제거 후 새로 생성
   - Soft Delete 후 확인 뒤 Hard Delete

**주의사항:**

⚠️ **운영 환경에서는 매우 신중하게 사용하세요**
⚠️ Hard Delete는 복구 불가능합니다
⚠️ Force Delete는 데이터 무결성을 위반할 수 있습니다
⚠️ 반드시 백업 후 실행하세요

**예제:**

\`\`\`json
// 안전한 삭제 (기본값)
{
  "forceDelete": false,
  "hardDelete": false
}

// 영구 삭제
{
  "forceDelete": false,
  "hardDelete": true
}

// 강제 영구 삭제 (⚠️ 매우 위험)
{
  "forceDelete": true,
  "hardDelete": true
}
\`\`\``,
    }), (0, swagger_1.ApiBody)({ type: delete_child_projects_dto_1.DeleteChildProjectsDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '하위 프로젝트가 성공적으로 삭제되었습니다.',
        type: delete_child_projects_dto_1.DeleteChildProjectsResultDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '할당이 있는 프로젝트가 포함되어 있어 삭제할 수 없습니다.',
        schema: {
            example: {
                statusCode: 400,
                message: '프로젝트에 할당이 있어 삭제할 수 없습니다',
                error: 'Bad Request',
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '삭제할 하위 프로젝트가 없습니다.',
        schema: {
            example: {
                statusCode: 404,
                message: '삭제할 하위 프로젝트를 찾을 수 없습니다',
                error: 'Not Found',
            },
        },
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 오류가 발생했습니다.',
    }));
}
//# sourceMappingURL=delete-child-projects-api.decorator.js.map