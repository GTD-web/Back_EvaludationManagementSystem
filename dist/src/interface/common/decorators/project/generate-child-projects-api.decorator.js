"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateChildProjects = GenerateChildProjects;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const generate_child_projects_dto_1 = require("../../dto/project/generate-child-projects.dto");
function GenerateChildProjects() {
    return (0, common_1.applyDecorators)((0, common_2.Post)('generate-children'), (0, common_2.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '하위 프로젝트 자동 생성 (재귀 트리) 🚀',
        description: `기존 상위 프로젝트들에 재귀적 트리 구조의 하위 프로젝트를 자동으로 생성합니다.

**동작:**
- 모든 상위 프로젝트를 조회합니다 (parentProjectId가 없는 프로젝트)
- 각 상위 프로젝트에 재귀적 트리 구조의 하위 프로젝트를 생성합니다
- 이미 하위 프로젝트가 있는 경우 건너뜁니다 (skipIfExists=true인 경우)

**재귀 트리 구조:**
- childCountPerProject=5 (기본값): 5단계 깊이
  - 상위 프로젝트
    - 1차 하위 프로젝트
      - 2차 하위 프로젝트
        - 3차 하위 프로젝트
          - 4차 하위 프로젝트
            - 5차 하위 프로젝트

**생성 규칙:**
- 프로젝트명: "{최상위 프로젝트명} - N차 하위 프로젝트"
  - 예: "대박인ㄴ데ㅛㅇ - 1차 하위 프로젝트", "대박인ㄴ데ㅛㅇ - 5차 하위 프로젝트"
- 프로젝트 코드: "{최상위 프로젝트 코드}-SUBN"
  - 예: "PRJ-2025-GDUR-SUB1", "PRJ-2025-GDUR-SUB5"
- 매니저: 최상위 프로젝트와 동일
- 날짜: 최상위 프로젝트와 동일

**사용 시나리오:**
1. 개발/테스트 환경에서 계층 구조 데이터 생성
2. 데모 환경 준비
3. 데이터 마이그레이션 후 하위 프로젝트 일괄 생성

**주의사항:**
- ⚠️ 운영 환경에서는 신중하게 사용하세요
- 백업 후 실행을 권장합니다
- 생성된 데이터는 실제 프로젝트 데이터가 됩니다

**테스트 케이스:**
- 기본 생성 (5단계): 각 상위에 5단계 깊이의 트리 생성
- 3단계 트리: childCountPerProject=3으로 3단계 깊이
- 10단계 트리: childCountPerProject=10으로 10단계 깊이
- 중복 방지: skipIfExists=true로 이미 하위가 있으면 건너뜀
- 강제 추가: skipIfExists=false로 추가 트리 생성
- 결과 확인: 생성된 하위 프로젝트 수와 상세 정보 확인`,
    }), (0, swagger_1.ApiBody)({ type: generate_child_projects_dto_1.GenerateChildProjectsDto }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '하위 프로젝트가 성공적으로 생성되었습니다.',
        type: generate_child_projects_dto_1.GenerateChildProjectsResultDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '서버 오류가 발생했습니다.',
    }));
}
//# sourceMappingURL=generate-child-projects-api.decorator.js.map