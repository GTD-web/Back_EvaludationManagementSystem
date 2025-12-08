import { applyDecorators, HttpStatus } from '@nestjs/common';
import { Get, Post, Put, Delete, HttpCode } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateProjectDto,
  CreateProjectsBulkDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  ProjectManagerListResponseDto,
  ProjectsBulkCreateResponseDto,
} from '@interface/common/dto/project/project.dto';

/**
 * 프로젝트 생성 API 데코레이터
 */
export function CreateProject() {
  return applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '프로젝트 생성',
      description: `새로운 프로젝트를 생성합니다.

**동작:**
- 프로젝트 기본 정보를 등록합니다
- 프로젝트 매니저(PM)를 설정할 수 있습니다
- 프로젝트 코드 중복을 검사합니다
- 생성자 정보를 자동으로 기록합니다
- 생성 후 매니저 정보를 포함하여 반환합니다 (managerId, employeeId)

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)

**테스트 케이스:**
- 기본 생성: 필수 정보만으로 프로젝트 생성
- PM 포함 생성: 프로젝트 매니저를 지정하여 생성
- 매니저 정보 확인: 생성된 프로젝트의 managerId와 employeeId 반환
- 프로젝트 코드 포함: 프로젝트 코드를 포함하여 생성
- 날짜 정보 포함: 시작일과 종료일을 포함하여 생성
- 프로젝트 코드 중복: 이미 존재하는 프로젝트 코드 사용 시 400 에러
- 필수 필드 누락: name 누락 시 400 에러
- 잘못된 상태 값: 유효하지 않은 status 값 입력 시 400 에러
- 잘못된 매니저 ID: UUID 형식이 아닌 managerId 입력 시 400 에러`,
    }),
    ApiBody({ type: CreateProjectDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '프로젝트가 성공적으로 생성되었습니다.',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
  );
}

/**
 * 프로젝트 일괄 생성 API 데코레이터
 */
export function CreateProjectsBulk() {
  return applyDecorators(
    Post('bulk'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '프로젝트 일괄 생성',
      description: `여러 프로젝트를 한 번에 생성합니다.

**동작:**
- 여러 프로젝트를 배열로 받아 일괄 생성합니다
- 각 프로젝트별로 PM을 개별 설정할 수 있습니다
- 프로젝트 코드 중복을 사전 검사합니다
- 일부 프로젝트 생성 실패 시에도 성공한 프로젝트는 저장됩니다
- 성공/실패 항목을 구분하여 응답합니다
- 생성자 정보를 자동으로 기록합니다
- 생성 후 각 프로젝트의 매니저 정보를 포함합니다 (managerId, employeeId)

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)

**테스트 케이스:**
- 전체 성공: 모든 프로젝트가 정상적으로 생성됨
- 매니저 정보 포함: 각 프로젝트의 managerId와 employeeId 반환
- 부분 성공: 일부 프로젝트만 생성 성공하고 나머지는 실패
- PM 포함 생성: 각 프로젝트별로 다른 PM 지정
- 프로젝트 코드 중복: 중복된 코드가 있는 프로젝트는 실패 처리
- 빈 배열: 프로젝트 배열이 비어있는 경우
- 필수 필드 누락: 일부 프로젝트의 필수 필드 누락 시 해당 항목만 실패
- 잘못된 데이터: 유효하지 않은 데이터가 있는 경우 해당 항목만 실패`,
    }),
    ApiBody({ type: CreateProjectsBulkDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '프로젝트 일괄 생성 완료 (일부 실패 가능)',
      type: ProjectsBulkCreateResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
  );
}

/**
 * 프로젝트 목록 조회 API 데코레이터
 */
export function GetProjectList() {
  return applyDecorators(
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 목록 조회',
      description: `프로젝트 목록을 페이징과 필터링을 통해 조회합니다.

**동작:**
- 페이징을 지원하여 대량의 프로젝트를 효율적으로 조회합니다
- 다양한 필터 조건으로 프로젝트를 검색할 수 있습니다
- 정렬 기준과 방향을 지정할 수 있습니다
- 소프트 삭제된 프로젝트는 제외됩니다
- 각 프로젝트의 매니저 정보를 포함합니다 (managerId, employeeId)

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)

**테스트 케이스:**
- 기본 목록 조회: 기본 페이징 설정으로 프로젝트 목록 조회
- 매니저 정보 포함: 각 프로젝트에 managerId와 employeeId 포함
- 페이징 적용: 특정 페이지와 항목 수 지정
- 상태 필터: 특정 상태의 프로젝트만 조회
- 매니저 필터: 특정 매니저의 프로젝트만 조회
- 날짜 범위 필터: 시작일/종료일 범위로 필터링
- 정렬 옵션: 다양한 정렬 기준과 방향 적용
- 빈 결과: 조건에 맞는 프로젝트가 없는 경우 빈 배열 반환`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '프로젝트 목록이 성공적으로 조회되었습니다.',
      type: ProjectListResponseDto,
    }),
  );
}

/**
 * 프로젝트 상세 조회 API 데코레이터
 */
export function GetProjectDetail() {
  return applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 상세 조회',
      description: `특정 프로젝트의 상세 정보를 조회합니다.

**동작:**
- 프로젝트 ID로 상세 정보를 조회합니다
- 매니저 정보를 포함하여 반환합니다 (managerId, employeeId)
- 삭제된 프로젝트는 조회되지 않습니다

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)

**테스트 케이스:**
- 기본 조회: 유효한 프로젝트 ID로 상세 정보 조회
- 매니저 정보 포함: managerId와 employeeId가 응답에 포함됨
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 조회 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 ID 입력 시 400 에러
- 삭제된 프로젝트: 삭제된 프로젝트 조회 시 404 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '프로젝트 상세 정보가 성공적으로 조회되었습니다.',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '프로젝트를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 UUID 형식입니다.',
    }),
  );
}

/**
 * 프로젝트 수정 API 데코레이터
 */
export function UpdateProject() {
  return applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 수정',
      description: `기존 프로젝트의 정보를 수정합니다.

**동작:**
- 프로젝트 기본 정보를 수정합니다
- 프로젝트 매니저를 변경할 수 있습니다
- 프로젝트 코드 변경 시 중복을 검사합니다
- 수정자 정보를 자동으로 기록합니다
- 수정 후 매니저 정보를 포함하여 반환합니다 (managerId, employeeId)

**반환 데이터:**
- manager.managerId: SSO의 매니저 ID
- manager.employeeId: 로컬 DB의 직원 ID (Employee 테이블의 id)

**테스트 케이스:**
- 기본 수정: 프로젝트명 등 기본 정보 수정
- PM 변경: 프로젝트 매니저 변경
- 매니저 정보 확인: 수정된 프로젝트의 managerId와 employeeId 반환
- 상태 변경: 프로젝트 상태 변경 (ACTIVE → COMPLETED 등)
- 날짜 정보 수정: 시작일, 종료일 수정
- 부분 수정: 일부 필드만 수정
- 프로젝트 코드 중복: 다른 프로젝트의 코드로 변경 시 400 에러
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 수정 시 404 에러
- 잘못된 데이터: 유효하지 않은 필드 값 입력 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({ type: UpdateProjectDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '프로젝트가 성공적으로 수정되었습니다.',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '프로젝트를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
  );
}

/**
 * 프로젝트 삭제 API 데코레이터
 */
export function DeleteProject() {
  return applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '프로젝트 삭제',
      description: `프로젝트를 소프트 삭제합니다.

**동작:**
- 프로젝트를 소프트 삭제 처리합니다
- 삭제된 프로젝트는 목록 조회에서 제외됩니다
- 삭제자 정보를 자동으로 기록합니다
- 실제 데이터는 유지되어 복구 가능합니다

**테스트 케이스:**
- 기본 삭제: 유효한 프로젝트 ID로 삭제
- 삭제 후 조회: 삭제된 프로젝트 조회 시 404 에러
- 삭제 후 목록: 삭제된 프로젝트가 목록에서 제외됨
- 존재하지 않는 프로젝트: 유효하지 않은 ID로 삭제 시 404 에러
- 이미 삭제된 프로젝트: 이미 삭제된 프로젝트 삭제 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 ID 입력 시 400 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '프로젝트가 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '프로젝트를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 UUID 형식입니다.',
    }),
  );
}

/**
 * PM(프로젝트 매니저) 목록 조회 API 데코레이터
 */
export function GetProjectManagers() {
  return applyDecorators(
    Get('managers'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
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
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'PM 목록이 성공적으로 조회되었습니다.',
      type: ProjectManagerListResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      description: 'SSO 서비스 연결 실패',
    }),
  );
}
