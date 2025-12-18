import { applyDecorators, HttpStatus } from '@nestjs/common';
import { Get, Post, Put, Delete, HttpCode } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
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
    Get('managers/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'PM 상세 조회',
      description: `특정 PM의 상세 정보를 조회합니다.

**동작:**
- PM ID로 상세 정보를 조회합니다
- 삭제된 PM은 조회되지 않습니다

**테스트 케이스:**
- PM 상세 조회 성공: 유효한 ID로 조회
- 존재하지 않는 PM: 404 에러
- 잘못된 UUID 형식: 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: 'PM ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
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
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 UUID 형식입니다.',
    }),
  );
}

/**
 * PM 수정 API 데코레이터
 */
export function UpdateProjectManager() {
  return applyDecorators(
    Put('managers/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'PM 수정',
      description: `기존 PM의 정보를 수정합니다.

**동작:**
- PM의 기본 정보를 수정합니다
- managerId는 변경할 수 없습니다 (불변)
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
- 존재하지 않는 PM: 404 에러
- 잘못된 UUID 형식: 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: 'PM ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
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
    Delete('managers/:id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: 'PM 삭제',
      description: `PM을 소프트 삭제합니다.

**동작:**
- PM을 소프트 삭제 처리합니다
- 삭제자 정보를 자동으로 기록합니다
- 실제 데이터는 유지되어 복구 가능합니다
- 삭제된 PM은 목록 조회에서 제외됩니다

**주의사항:**
- 소프트 삭제이므로 데이터는 실제로 삭제되지 않습니다
- 삭제된 PM도 프로젝트에서 이미 할당된 경우 그대로 유지됩니다

**테스트 케이스:**
- PM 삭제 성공: 유효한 ID로 삭제
- 삭제 후 조회: 삭제된 PM 조회 시 404 에러
- 존재하지 않는 PM: 404 에러
- 잘못된 UUID 형식: 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: 'PM ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'PM이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'PM을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 UUID 형식입니다.',
    }),
  );
}

