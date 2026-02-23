import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ProjectAssignmentResponseDto,
  ProjectAssignmentDetailResponseDto,
  ProjectAssignmentListResponseDto,
  EmployeeProjectsResponseDto,
  ProjectEmployeesResponseDto,
  UnassignedEmployeesResponseDto,
  AvailableProjectsResponseDto,
  CancelProjectAssignmentByProjectDto,
  ChangeProjectAssignmentOrderByProjectDto,
} from '../../dto/evaluation-criteria/project-assignment.dto';

// ==================== GET 엔드포인트 데코레이터 ====================

/**
 * 프로젝트 할당 목록 조회 엔드포인트 데코레이터
 */
export function GetProjectAssignmentList() {
  return applyDecorators(
    Get(''),
    ApiOperation({
      summary: '프로젝트 할당 목록 조회',
      description: `**중요**: 다양한 필터 조건으로 프로젝트 할당 목록을 조회합니다. 취소된 할당은 자동으로 제외되며, 페이징을 지원합니다.

**테스트 케이스:**
- 기본 조회: 필터 없이 모든 활성 할당 목록 조회
- 직원별 필터: 특정 직원의 모든 할당 조회
- 프로젝트별 필터: 특정 프로젝트의 모든 할당 조회
- 평가기간별 필터: 특정 평가기간의 모든 할당 조회
- 복합 필터: 직원+프로젝트+평가기간 조합으로 정확한 할당 조회
- 페이징 처리: page, limit 파라미터로 페이지별 조회
- 빈 결과: 조건에 맞는 할당이 없을 때 빈 배열 반환
- 취소된 할당 제외: 삭제된 할당은 목록에서 자동 제외
- 정렬 순서: 할당일 기준 내림차순 정렬
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 페이징 파라미터 검증: 음수 페이지/limit 값 시 400 에러
- 대용량 데이터: 1000개 이상 할당 조회 성능 테스트
- 동시 조회: 여러 클라이언트 동시 조회 처리`,
    }),
    ApiQuery({
      name: 'employeeId',
      required: false,
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      description: '프로젝트 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'periodId',
      required: false,
      description: '평가기간 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호 (기본값: 1, 최소값: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지 크기 (기본값: 10, 최소값: 1)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 할당 목록이 성공적으로 조회되었습니다.',
      type: ProjectAssignmentListResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식, 음수 페이징 값 등)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 프로젝트 할당 상세 조회 엔드포인트 데코레이터
 */
export function GetProjectAssignmentDetail() {
  return applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: '프로젝트 할당 상세 조회',
      description: `**중요**: 특정 프로젝트 할당의 상세 정보를 관련된 평가기간, 직원, 프로젝트, 할당자 정보와 함께 조회합니다. 취소된 할당은 조회할 수 없습니다.

**테스트 케이스:**
- 기본 조회: 존재하는 할당의 상세 정보 조회 (직원, 프로젝트, 평가기간 정보 포함)
- 할당자 정보: assignedBy, createdBy, updatedBy 정보 포함
- 할당 날짜: assignedDate, createdAt, updatedAt 정보 포함
- 연관 데이터: 직원명, 프로젝트명, 평가기간명 등 연관 정보 조회
- 존재하지 않는 ID: 유효하지 않은 할당 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러
- 취소된 할당: 이미 취소된 할당 조회 시 404 에러
- 특수 문자: 할당 ID에 특수문자 포함 시 400 에러
- SQL 인젝션: 악의적인 SQL 인젝션 시도 시 400 에러
- 대용량 연관 데이터: 복잡한 연관 관계를 가진 할당 조회
- 동시 조회: 동일한 할당에 대한 동시 조회 요청 처리
- 권한 검증: 적절한 권한을 가진 사용자만 조회 가능 (향후 구현)
- 캐싱: 자주 조회되는 할당 정보 캐싱 처리`,
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 할당 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 할당 상세 정보가 성공적으로 조회되었습니다.',
      type: ProjectAssignmentDetailResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 할당을 찾을 수 없습니다. (존재하지 않거나 취소됨)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 직원의 프로젝트 할당 조회 엔드포인트 데코레이터
 */
export function GetEmployeeProjectAssignments() {
  return applyDecorators(
    Get('employees/:employeeId/periods/:periodId'),
    ApiOperation({
      summary: '직원에게 할당한 프로젝트 목록 조회',
      description: `**중요**: 특정 평가기간에 특정 직원에게 할당된 모든 프로젝트를 조회합니다. 취소된 할당은 자동으로 제외됩니다.

**테스트 케이스:**
- 기본 조회: 특정 직원의 특정 평가기간 할당 프로젝트 목록 조회
- 다중 프로젝트: 한 직원에게 여러 프로젝트가 할당된 경우 모두 조회
- 빈 결과: 해당 직원에게 할당된 프로젝트가 없을 때 빈 배열 반환
- 취소된 할당 제외: 취소된 할당은 목록에서 자동 제외
- 프로젝트 정보: 각 프로젝트의 상세 정보 (이름, 설명, 상태 등) 포함
- 할당 정보: 할당일, 할당자 정보 등 할당 관련 정보 포함
- 존재하지 않는 직원: 유효하지 않은 직원 ID로 요청 시 404 에러
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러
- 특수 문자: ID에 특수문자 포함 시 400 에러
- 대용량 할당: 한 직원에게 50개 이상 프로젝트 할당된 경우 조회
- 동시 조회: 동일한 직원-평가기간 조합에 대한 동시 조회 요청 처리
- 성능 테스트: 복잡한 연관 관계를 가진 할당 조회 성능 검증`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174001',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiResponse({
      status: 200,
      description: '직원의 할당된 프로젝트 목록이 성공적으로 조회되었습니다.',
      type: EmployeeProjectsResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({
      status: 404,
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 프로젝트에 할당된 직원 조회 엔드포인트 데코레이터
 */
export function GetProjectAssignedEmployees() {
  return applyDecorators(
    Get('projects/:projectId/periods/:periodId'),
    ApiOperation({
      summary: '프로젝트에 할당된 직원 목록 조회',
      description: `**중요**: 특정 평가기간에 특정 프로젝트에 할당된 모든 직원을 조회합니다. 취소된 할당은 자동으로 제외됩니다.

**테스트 케이스:**
- 기본 조회: 특정 프로젝트의 특정 평가기간 할당 직원 목록 조회
- 다중 직원: 한 프로젝트에 여러 직원이 할당된 경우 모두 조회
- 빈 결과: 해당 프로젝트에 할당된 직원이 없을 때 빈 배열 반환
- 취소된 할당 제외: 취소된 할당은 목록에서 자동 제외
- 직원 정보: 각 직원의 상세 정보 (이름, 부서, 직급 등) 포함
- 할당 정보: 할당일, 할당자 정보 등 할당 관련 정보 포함
- 존재하지 않는 프로젝트: 유효하지 않은 프로젝트 ID로 요청 시 404 에러
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러
- 특수 문자: ID에 특수문자 포함 시 400 에러
- 대용량 할당: 한 프로젝트에 100명 이상 직원 할당된 경우 조회
- 동시 조회: 동일한 프로젝트-평가기간 조합에 대한 동시 조회 요청 처리
- 성능 테스트: 복잡한 연관 관계를 가진 할당 조회 성능 검증
- 정렬 순서: 직원명 또는 할당일 기준 정렬`,
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174001',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트에 할당된 직원 목록이 성공적으로 조회되었습니다.',
      type: ProjectEmployeesResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 할당되지 않은 직원 목록 조회 엔드포인트 데코레이터
 */
export function GetUnassignedEmployees() {
  return applyDecorators(
    Get('unassigned-employees'),
    ApiOperation({
      summary: '할당되지 않은 직원 목록 조회',
      description: `**중요**: 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회합니다. 선택적으로 특정 프로젝트를 제외하고 조회할 수 있습니다.

**테스트 케이스:**
- 기본 조회: 특정 평가기간에 할당되지 않은 모든 직원 조회
- 프로젝트 제외: 특정 프로젝트를 제외하고 할당되지 않은 직원 조회
- 빈 결과: 모든 직원이 할당된 경우 빈 배열 반환
- 직원 정보: 각 직원의 상세 정보 (이름, 부서, 직급, 이메일 등) 포함
- 필수 파라미터: periodId 누락 시 400 에러
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러
- 특수 문자: ID에 특수문자 포함 시 400 에러
- 대용량 직원: 1000명 이상 직원 중 할당되지 않은 직원 조회
- 동시 조회: 동일한 평가기간에 대한 동시 조회 요청 처리
- 성능 테스트: 복잡한 할당 상태를 가진 직원 목록 조회 성능 검증
- 정렬 순서: 직원명 또는 부서명 기준 정렬
- 필터링: 특정 부서나 직급의 할당되지 않은 직원만 조회 (향후 구현)
- 페이징: 대용량 결과에 대한 페이징 처리 (향후 구현)`,
    }),
    ApiQuery({
      name: 'periodId',
      required: true,
      description: '평가기간 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      description: '제외할 프로젝트 ID (UUID 형식, 선택사항)',
      example: '123e4567-e89b-12d3-a456-426614174001',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiResponse({
      status: 200,
      description: '할당되지 않은 직원 목록이 성공적으로 조회되었습니다.',
      type: UnassignedEmployeesResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (필수 파라미터 누락, 잘못된 UUID 형식 등)',
    }),
    ApiResponse({
      status: 404,
      description: '평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 할당 가능한 프로젝트 목록 조회 엔드포인트 데코레이터
 */
export function GetAvailableProjects() {
  return applyDecorators(
    Get('available-projects'),
    ApiOperation({
      summary: '할당 가능한 프로젝트 목록 조회',
      description: `**중요**: 특정 평가기간에 할당 가능한 모든 프로젝트 목록을 조회합니다. 각 프로젝트의 매니저 정보도 함께 반환됩니다.

**동작:**
- 평가기간에 할당 가능한 모든 활성 프로젝트 조회
- 각 프로젝트의 매니저 정보를 직원 테이블에서 조회하여 포함
- 프로젝트 상태 필터링 지원 (기본값: ACTIVE)
- 프로젝트명 기준 오름차순 정렬

**테스트 케이스:**
- 기본 조회: 특정 평가기간의 모든 활성 프로젝트 조회
- 매니저 정보 포함: 각 프로젝트의 매니저 이름, 이메일, 부서명 포함
- 상태 필터: 특정 상태의 프로젝트만 조회 (ACTIVE, INACTIVE 등)
- 빈 결과: 할당 가능한 프로젝트가 없을 때 빈 배열 반환
- 매니저 없는 프로젝트: 매니저가 설정되지 않은 프로젝트도 조회
- 필수 파라미터: periodId 누락 시 400 에러
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: UUID 형식이 올바르지 않을 때 400 에러
- 대용량 프로젝트: 100개 이상 프로젝트 조회 성능 테스트
- 동시 조회: 동일한 평가기간에 대한 동시 조회 요청 처리
- 정렬 순서: 프로젝트명 기준 오름차순 정렬 확인
- 매니저 정보 정확성: 매니저 정보가 올바르게 조회되는지 검증`,
    }),
    ApiQuery({
      name: 'periodId',
      required: true,
      description: '평가기간 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: '프로젝트 상태 필터 (기본값: ACTIVE)',
      example: 'ACTIVE',
      schema: { type: 'string' },
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: '검색어 (프로젝트명, 프로젝트코드, 매니저명으로 검색)',
      example: '루미르',
      schema: { type: 'string' },
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호 (기본값: 1)',
      example: 1,
      schema: { type: 'number', minimum: 1 },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지 크기 (기본값: 20)',
      example: 20,
      schema: { type: 'number', minimum: 1, maximum: 100 },
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: '정렬 기준 (기본값: name)',
      example: 'name',
      enum: ['name', 'projectCode', 'startDate', 'endDate', 'managerName'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: '정렬 방향 (기본값: ASC)',
      example: 'ASC',
      enum: ['ASC', 'DESC'],
    }),
    ApiResponse({
      status: 200,
      description: '할당 가능한 프로젝트 목록이 성공적으로 조회되었습니다.',
      type: AvailableProjectsResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (필수 파라미터 누락, 잘못된 UUID 형식 등)',
    }),
    ApiResponse({
      status: 404,
      description: '평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

// ==================== POST 엔드포인트 데코레이터 ====================

/**
 * 프로젝트 할당 생성 엔드포인트 데코레이터
 */
export function CreateProjectAssignment() {
  return applyDecorators(
    Post(''),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '프로젝트 할당 생성',
      description: `**중요**: 특정 직원을 특정 평가기간의 프로젝트에 할당합니다. 할당 시 중복 검증, 평가기간 상태 검증, 프로젝트 존재 여부 등을 자동으로 확인합니다.

**테스트 케이스:**
- 기본 할당: 유효한 직원, 프로젝트, 평가기간으로 할당 생성
- 할당자 정보: 할당 생성 시 assignedBy, createdBy, updatedBy 정보가 올바르게 설정됨
- 할당 날짜: assignedDate가 현재 시간으로 자동 설정됨
- 감사 정보: 생성일시, 수정일시, 생성자, 수정자 정보 자동 기록
- 중복 할당 방지: 동일한 직원-프로젝트-평가기간 조합 중복 생성 시 409 에러
- 필수 필드 검증: employeeId, projectId, periodId 누락 시 400 에러
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 프로젝트 존재 검증: 존재하지 않는 프로젝트 ID 시 404 에러
- 평가기간 존재 검증: 존재하지 않는 평가기간 ID 시 404 에러
- 완료된 평가기간 제한: 완료된 평가기간에 할당 생성 시 422 에러
- 진행 중 평가기간 허용: 진행 중인 평가기간에는 할당 생성 가능
- 할당 목록 반영: 생성된 할당이 목록 조회에 즉시 반영됨
- 상세 조회 가능: 생성된 할당의 상세 정보 조회 가능`,
    }),
    ApiResponse({
      status: 201,
      description: '프로젝트 할당이 성공적으로 생성되었습니다.',
      type: ProjectAssignmentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (필수 필드 누락, UUID 형식 오류 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description: '중복된 할당입니다. (동일한 직원-프로젝트-평가기간 조합)',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간에 할당 생성 불가 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
    }),
  );
}

/**
 * 프로젝트 대량 할당 엔드포인트 데코레이터
 */
export function BulkCreateProjectAssignments() {
  return applyDecorators(
    Post('bulk'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '프로젝트 대량 할당',
      description: `**중요**: 여러 직원에게 여러 프로젝트를 한 번에 할당합니다. 모든 할당이 성공하거나 모두 실패하는 트랜잭션 방식으로 처리됩니다.

**테스트 케이스:**
- 다중 할당: 여러 직원을 여러 프로젝트에 대량 할당
- 단일 직원 다중 프로젝트: 한 직원을 여러 프로젝트에 할당
- 다중 직원 단일 프로젝트: 여러 직원을 한 프로젝트에 할당
- 트랜잭션 처리: 일부 할당 실패 시 전체 롤백
- 감사 정보: 모든 할당에 assignedBy, createdBy, updatedBy 정보 설정
- 할당 날짜: 모든 할당에 assignedDate 자동 설정
- 빈 배열 검증: 빈 할당 배열로 요청 시 400 에러
- 필수 필드 검증: 각 할당의 필수 필드 누락 시 400 에러
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 존재하지 않는 리소스: 평가기간/프로젝트 미존재 시 404 에러
- 완료된 평가기간 제한: 완료된 평가기간에 할당 생성 시 422 에러
- 중복 할당 방지: 기존 할당과 중복 시 409 에러
- 성능 테스트: 50개 할당을 30초 이내 처리
- 동시성 테스트: 여러 대량 할당 요청 동시 처리
- 최소 1개 검증: 할당 목록은 최소 1개 이상 필수`,
    }),
    ApiResponse({
      status: 201,
      description: '프로젝트 대량 할당이 성공적으로 완료되었습니다.',
      type: [ProjectAssignmentResponseDto],
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (빈 배열, 필수 필드 누락, UUID 형식 오류 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description: '중복된 할당이 포함되어 있습니다.',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간에 할당 생성 불가 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }),
  );
}

// ==================== PATCH 엔드포인트 데코레이터 ====================

/**
 * 프로젝트 할당 수정 엔드포인트 데코레이터
 */
export function UpdateProjectAssignment() {
  return applyDecorators(
    Patch('employees/:employeeId/projects/:projectId'),
    ApiOperation({
      summary: '프로젝트 할당 기간 수정',
      description: `**중요**: 기존 프로젝트 할당의 프로젝트 기간(시작일/종료일)을 수정합니다.

**동작:**
- 직원 ID, 프로젝트 ID, 평가기간 ID로 할당을 찾아 수정
- 프로젝트 시작일과 종료일만 수정 가능
- 부분 수정: 일부 필드만 수정하고 나머지는 기존 값 유지
- 감사 정보: 수정일시, 수정자 정보 자동 업데이트

**테스트 케이스:**
- 기본 수정: 프로젝트 시작일과 종료일 수정
- 부분 수정: 시작일만 수정하거나 종료일만 수정 가능
- 감사 정보: 수정일시, 수정자 정보 자동 업데이트
- 존재하지 않는 할당: 유효하지 않은 직원/프로젝트/평가기간 조합 시 404 에러
- 잘못된 날짜 형식: 날짜 형식이 올바르지 않을 때 400 에러
- 완료된 평가기간 제한: 완료된 평가기간의 할당 수정 시 422 에러
- 취소된 할당 제한: 이미 취소된 할당 수정 시 404 에러`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174001',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식, 필수)',
      example: '123e4567-e89b-12d3-a456-426614174002',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 할당이 성공적으로 수정되었습니다.',
      type: ProjectAssignmentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (필수 필드 누락, UUID 형식 오류 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 할당을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description: '중복된 할당입니다. (수정 후 중복 발생)',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간 수정 불가 등)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

// ==================== DELETE 엔드포인트 데코레이터 ====================


/**
 * 프로젝트 ID 기반 할당 취소 엔드포인트 데코레이터
 */
export function CancelProjectAssignmentByProject() {
  return applyDecorators(
    Delete('project/:projectId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 할당 취소 (프로젝트 ID 기반)',
      description: `프로젝트 ID를 사용하여 기존 프로젝트 할당을 취소(소프트 삭제)합니다. 할당 취소 시 멱등성 보장을 수행합니다.

**동작:**
- employeeId, projectId, periodId로 할당을 찾아 취소
- 소프트 삭제: 실제 레코드 삭제가 아닌 deletedAt 필드를 업데이트
- 멱등성 보장: 이미 취소되었거나 존재하지 않는 할당 조합으로 요청해도 200 OK 반환

**테스트 케이스:**
- 기본 할당 취소: 유효한 조합으로 취소 시 성공
- 소프트 삭제 확인: deletedAt 필드가 설정되고 물리적 삭제는 되지 않음
- 여러 할당 순차 취소: 동일 직원의 여러 할당을 순차적으로 취소 가능
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 필수 필드 누락: employeeId, periodId 누락 시 400 에러
- 존재하지 않는 할당: 유효하지 않은 조합으로 취소 시도 시 200 성공 반환 (멱등성)
- 멱등성 - 이미 취소된 할당: 이미 취소된 할당을 다시 취소 시도 시 200 성공 반환
- 할당 목록 제외: 취소된 할당은 목록 조회에서 제외됨
- 상세 조회 불가: 취소된 할당은 상세 조회 시 404 반환
- 트랜잭션 보장: 할당 취소가 원자적으로 수행됨`,
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiBody({
      type: CancelProjectAssignmentByProjectDto,
      description: '프로젝트 할당 취소 데이터',
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 할당이 성공적으로 취소되었습니다.',
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류, 필수 필드 누락 등)',
    }),
  );
}

/**
 * 프로젝트 ID 기반 할당 순서 변경 엔드포인트 데코레이터
 */
export function ChangeProjectAssignmentOrderByProject() {
  return applyDecorators(
    Patch('project/:projectId/order'),
    ApiOperation({
      summary: '프로젝트 할당 순서 변경 (프로젝트 ID 기반)',
      description: `프로젝트 ID를 사용하여 프로젝트 할당의 표시 순서를 위 또는 아래로 이동합니다. 같은 직원-평가기간 내에서 인접한 항목과 순서를 자동으로 교환합니다.

**동작:**
- employeeId, projectId, periodId로 할당을 찾아 순서 변경
- 위로 이동(up): 현재 항목과 바로 위 항목의 순서를 교환
- 아래로 이동(down): 현재 항목과 바로 아래 항목의 순서를 교환
- 자동 재정렬: 순서 교환 시 두 항목만 업데이트되어 효율적
- 경계 처리: 첫 번째 항목을 위로, 마지막 항목을 아래로 이동 시도시 현재 상태 유지

**테스트 케이스:**
- 위로 이동: 중간 항목을 위로 이동 시 순서 교환 확인
- 아래로 이동: 중간 항목을 아래로 이동 시 순서 교환 확인
- 첫 번째 항목 위로: 이미 첫 번째 항목을 위로 이동 시 순서 변화 없음
- 마지막 항목 아래로: 이미 마지막 항목을 아래로 이동 시 순서 변화 없음
- 단일 항목: 할당이 하나만 있을 때 순서 변경 시도
- 존재하지 않는 할당: 유효하지 않은 조합으로 요청 시 404 에러
- 잘못된 방향: 'up' 또는 'down' 이외의 값 전달 시 400 에러
- 완료된 평가기간: 완료된 평가기간의 할당 순서 변경 시 422 에러
- 다른 직원 항목: 같은 직원-평가기간의 항목들만 영향받음
- 순서 일관성: 이동 후 displayOrder 값의 일관성 유지
- 동시 순서 변경: 동일 할당에 대한 동시 순서 변경 요청 처리
- 트랜잭션 보장: 순서 변경 중 오류 시 롤백 처리`,
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiBody({
      type: ChangeProjectAssignmentOrderByProjectDto,
      description: '프로젝트 할당 순서 변경 데이터',
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 할당 순서가 성공적으로 변경되었습니다.',
      type: ProjectAssignmentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (UUID 형식 오류, 잘못된 direction 값, 필수 필드 누락 등)',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 할당을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간의 순서 변경 제한 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }),
  );
}
