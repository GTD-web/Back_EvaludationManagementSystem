import { applyDecorators, HttpStatus } from '@nestjs/common';
import { Get, Post, Put, Delete, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateProjectManagerDto,
  UpdateProjectManagerDto,
  ProjectManagerResponseDto,
  ProjectManagerListResponseDto,
} from '@interface/common/dto/project/project-manager.dto';

/**
 * PM 생성 API 데코레이터
 */
export function CreateProjectManager() {
  return applyDecorators(
    Post('managers'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'PM 추가',
      description: `새로운 PM을 추가합니다.

**동작:**
- SSO의 매니저 ID로 PM을 등록합니다
- PM으로 등록된 직원만 프로젝트 관리자로 지정할 수 있습니다
- 동일한 managerId가 이미 등록된 경우 에러를 반환합니다
- 생성자 정보를 자동으로 기록합니다

**필수 필드:**
- managerId: SSO의 직원 ID
- name: 매니저 이름

**선택 필드:**
- email: 이메일 주소
- employeeNumber: 사번
- departmentName: 부서명
- isActive: 활성 상태 (기본값: true)
- note: 비고

**테스트 케이스:**
- PM 추가 성공: 필수 필드만으로 PM 추가
- 전체 정보 추가: 모든 필드를 포함하여 PM 추가
- 중복 managerId: 동일한 managerId로 추가 시도 시 409 에러
- 필수 필드 누락: managerId 또는 name 누락 시 400 에러`,
    }),
    ApiBody({ type: CreateProjectManagerDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'PM이 성공적으로 추가되었습니다.',
      type: ProjectManagerResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 등록된 매니저 ID입니다.',
    }),
  );
}

/**
 * PM 상세 조회 API 데코레이터
 */
export function GetProjectManagerDetail() {
  return applyDecorators(
    Get('managers/:managerId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'PM 상세 조회',
      description: `특정 PM의 상세 정보를 조회합니다.

**동작:**
- managerId(SSO ID)로 상세 정보를 조회합니다
- 삭제된 PM은 조회되지 않습니다

**테스트 케이스:**
- PM 상세 조회 성공: 유효한 managerId로 조회
- 존재하지 않는 PM: 404 에러`,
    }),
    ApiParam({
      name: 'managerId',
      description: 'PM의 매니저 ID (SSO ID)',
      example: '5befb5cd-9671-4a7b-8138-4f092c18e06c',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'PM 상세 정보가 성공적으로 조회되었습니다.',
      type: ProjectManagerResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'PM을 찾을 수 없습니다.',
    }),
  );
}

/**
 * PM 수정 API 데코레이터
 */
export function UpdateProjectManager() {
  return applyDecorators(
    Put('managers/:managerId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'PM 수정',
      description: `기존 PM의 정보를 수정합니다.

**동작:**
- managerId(SSO ID)로 PM을 식별하여 수정합니다
- soft delete된 PM은 복구 후 수정합니다
- ProjectManager에 등록되지 않은 PM(하드코딩된 기본 PM)은 자동으로 등록 후 수정합니다
- 활성/비활성 상태를 변경할 수 있습니다
- 수정자 정보를 자동으로 기록합니다

**수정 가능 필드:**
- name: 매니저 이름
- email: 이메일
- employeeNumber: 사번
- departmentName: 부서명
- isActive: 활성 상태
- note: 비고

**테스트 케이스:**
- PM 정보 수정: 이름, 이메일 등 기본 정보 수정
- 활성 상태 변경: isActive를 true/false로 변경
- 비활성화: isActive=false로 설정
- 하드코딩 PM 수정: 기본 12명 중 하나를 수정
- 존재하지 않는 PM: 404 에러`,
    }),
    ApiParam({
      name: 'managerId',
      description: 'PM의 매니저 ID (SSO ID)',
      example: '5befb5cd-9671-4a7b-8138-4f092c18e06c',
    }),
    ApiBody({ type: UpdateProjectManagerDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'PM이 성공적으로 수정되었습니다.',
      type: ProjectManagerResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'PM을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
  );
}

/**
 * PM 삭제 API 데코레이터
 */
export function DeleteProjectManager() {
  return applyDecorators(
    Delete('managers/:managerId'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: 'PM 삭제',
      description: `PM을 하드 삭제합니다 (실제 레코드 제거).

**동작:**
- managerId(SSO ID)로 PM을 식별하여 삭제합니다
- DB에서 실제로 레코드를 제거합니다
- ProjectManager에 등록되지 않은 경우 자동 등록 후 즉시 삭제
- 삭제된 PM은 목록 조회에서 제외됩니다

**주의사항:**
- 하드 삭제이므로 데이터가 완전히 제거되어 복구 불가능합니다
- 삭제된 PM도 프로젝트에서 이미 할당된 경우 그대로 유지됩니다

**테스트 케이스:**
- PM 삭제 성공: 유효한 managerId로 삭제
- 존재하지 않는 직원: SSO에 없는 managerId로 삭제 시 404 에러`,
    }),
    ApiParam({
      name: 'managerId',
      description: 'PM의 매니저 ID (SSO ID)',
      example: '5befb5cd-9671-4a7b-8138-4f092c18e06c',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'PM이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'SSO에서 직원을 찾을 수 없습니다.',
    }),
  );
}

/**
 * PM 일괄 등록 API 데코레이터
 */
export function BulkRegisterProjectManagers() {
  return applyDecorators(
    Post('managers/bulk-register'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'PM 일괄 등록',
      description: `하드코딩된 기본 PM 목록을 ProjectManager 테이블에 일괄 등록합니다.

**동작:**
- 하드코딩된 기본 PM 목록의 이름으로 SSO에서 직원 정보를 조회합니다
- 조회된 직원을 ProjectManager 테이블에 등록합니다
- 이미 등록된 PM은 스킵합니다
- 등록 결과 통계를 반환합니다

**등록 대상 PM:**
- 남명용, 김경민, 홍연창, 강남규, 전구영
- 고영훈, 박일수, 모현민, 하태식, 정석화
- 이봉은, 김종식, 김형중

**반환 정보:**
- success: 성공적으로 등록된 PM 수
- skipped: 이미 등록되어 스킵된 PM 수
- failed: 등록 실패한 PM 수
- details: 각 PM별 등록 결과

**테스트 케이스:**
- 최초 등록: 전체 PM 등록 성공
- 재실행: 이미 등록된 PM은 스킵`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'PM이 일괄 등록되었습니다.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'number',
            description: '성공적으로 등록된 PM 수',
            example: 13,
          },
          skipped: {
            type: 'number',
            description: '이미 등록되어 스킵된 PM 수',
            example: 0,
          },
          failed: {
            type: 'number',
            description: '등록 실패한 PM 수',
            example: 0,
          },
          details: {
            type: 'array',
            description: '각 PM별 등록 결과',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: '남명용' },
                status: {
                  type: 'string',
                  enum: ['success', 'skipped', 'failed'],
                  example: 'success',
                },
                reason: { type: 'string', example: '이미 등록됨' },
              },
            },
          },
        },
      },
    }),
  );
}
