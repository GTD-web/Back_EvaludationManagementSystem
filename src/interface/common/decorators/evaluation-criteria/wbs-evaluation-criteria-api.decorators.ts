import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { UpsertWbsEvaluationCriteriaBodyDto } from '../../dto/evaluation-criteria/wbs-evaluation-criteria.dto';

/**
 * WBS 평가기준 목록 조회 API 데코레이터
 */
export const GetWbsEvaluationCriteriaList = () =>
  applyDecorators(
    Get(),
    ApiOperation({
      summary: 'WBS 평가기준 목록 조회',
      description: `필터 조건에 따라 WBS 평가기준 목록을 조회합니다.

**필터 조건:**
- wbsItemId: 특정 WBS 항목의 평가기준만 필터링
- criteriaSearch: 평가기준 내용 부분 검색 (LIKE 검색)
- criteriaExact: 평가기준 내용 완전 일치 검색
- 필터 조건을 조합하여 사용 가능

**응답 특징:**
- 삭제된 평가기준은 목록에 포함되지 않음
- 빈 배열 반환 가능 (평가기준이 없는 경우)
- 생성일시 기준 내림차순 정렬
- 평가기간 수동 설정 상태 정보 포함

**평가기간 수동 설정 상태:**
- criteriaSettingEnabled: 평가 기준 설정 수동 허용 여부
- selfEvaluationSettingEnabled: 자기 평가 설정 수동 허용 여부
- finalEvaluationSettingEnabled: 하향/동료평가 설정 수동 허용 여부

**테스트 케이스:**
- 전체 조회: 모든 WBS 평가기준 조회 성공
- 빈 목록: 평가기준이 없는 경우 빈 배열 반환
- wbsItemId 필터: 특정 WBS 항목의 평가기준만 필터링하여 조회
- criteriaSearch 필터: 평가기준 내용 부분 검색으로 필터링
- criteriaExact 필터: 평가기준 내용 완전 일치 검색으로 필터링
- 복합 필터: 여러 필터 조건 동시 적용 가능
- 삭제된 평가기준 제외: 삭제된 평가기준은 목록에 포함되지 않음
- 대량 조회: 많은 수의 평가기준을 조회 가능
- 잘못된 UUID: 잘못된 UUID 형식의 wbsItemId로 조회 시 400 또는 500 에러
- 존재하지 않는 wbsItemId: 존재하지 않는 wbsItemId로 조회 시 빈 배열 반환
- 빈 문자열 criteriaSearch: 모든 평가기준 반환
- 빈 문자열 criteriaExact: 빈 배열 또는 빈 기준만 반환`,
    }),
    ApiQuery({
      name: 'wbsItemId',
      description: 'WBS 항목 ID (선택사항)',
      required: false,
      type: String,
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiQuery({
      name: 'criteriaSearch',
      description: '기준 내용 검색 (부분 일치, 선택사항)',
      required: false,
      type: String,
      example: '코드',
    }),
    ApiQuery({
      name: 'criteriaExact',
      description: '기준 내용 완전 일치 (선택사항)',
      required: false,
      type: String,
      example: '코드 품질',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          criteria: {
            type: 'array',
            description: 'WBS 평가기준 목록',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                criteria: { type: 'string' },
                importance: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          evaluationPeriodSettings: {
            type: 'object',
            description: '평가기간 수동 설정 상태 정보',
            properties: {
              criteriaSettingEnabled: {
                type: 'boolean',
                description: '평가 기준 설정 수동 허용 여부',
              },
              selfEvaluationSettingEnabled: {
                type: 'boolean',
                description: '자기 평가 설정 수동 허용 여부',
              },
              finalEvaluationSettingEnabled: {
                type: 'boolean',
                description: '하향/동료평가 설정 수동 허용 여부',
              },
            },
          },
        },
        example: {
          criteria: [
            {
              id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
              wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
              criteria: '코드 품질 및 성능 최적화',
              importance: 5,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
          ],
          evaluationPeriodSettings: {
            criteriaSettingEnabled: true,
            selfEvaluationSettingEnabled: false,
            finalEvaluationSettingEnabled: false,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
  );

/**
 * WBS 평가기준 상세 조회 API 데코레이터
 */
export const GetWbsEvaluationCriteriaDetail = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 상세 조회',
      description: `특정 WBS 평가기준의 상세 정보를 조회합니다.

**동작 방식:**
- 평가기준 ID로 상세 정보 조회
- WBS 항목 정보를 함께 반환 (LEFT JOIN)
- WBS 항목이 삭제된 경우 wbsItem은 null
- 삭제된 평가기준 조회 시 빈 객체 반환

**테스트 케이스:**
- 유효한 ID 조회: 평가기준 상세 정보 성공적으로 조회
- WBS 항목 정보 포함: wbsItem 객체가 응답에 포함되며 모든 필드 존재
- 필드 정확성: WBS 항목 정보가 DB 데이터와 일치
- 필수 필드 존재: id, criteria, createdAt, updatedAt, wbsItem 필드 모두 존재
- 필드 null 아님: 모든 반환 데이터가 null이 아님 (wbsItem 제외)
- 여러 평가기준 조회: 각각의 평가기준을 올바르게 구분하여 조회
- WBS 항목 삭제: WBS 항목이 삭제된 경우 wbsItem이 null로 반환
- 존재하지 않는 ID: 존재하지 않는 ID로 조회 시 빈 객체 반환
- 잘못된 UUID: 잘못된 UUID 형식 시 400 또는 500 에러
- 삭제된 평가기준: 삭제된 평가기준 조회 시 빈 객체 반환
- 생성-조회-수정-조회: 전체 라이프사이클 검증
- 생성-조회-삭제-조회: 삭제 후 빈 객체 반환 확인
- 목록-상세 연동: 목록조회 결과로 상세조회 가능
- 데이터 정합성: 생성 시 데이터와 상세조회 데이터 일치
- DB 일치: WBS 항목 정보가 실제 DB 데이터와 일치`,
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
      example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준 상세 정보가 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          wbsItem: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              wbsCode: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'string' },
              level: { type: 'number' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              progressPercentage: { type: 'string' },
            },
          },
        },
        example: {
          id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          criteria: '코드 품질 및 성능 최적화',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          wbsItem: {
            id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            wbsCode: 'WBS-001',
            title: '백엔드 개발',
            status: 'IN_PROGRESS',
            level: 2,
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-03-31T00:00:00.000Z',
            progressPercentage: '65.5',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 항목별 평가기준 조회 API 데코레이터
 */
export const GetWbsItemEvaluationCriteria = () =>
  applyDecorators(
    Get('wbs-item/:wbsItemId'),
    ApiOperation({
      summary: 'WBS 항목별 평가기준 조회',
      description: `특정 WBS 항목의 평가기준을 조회합니다.

**동작 방식:**
- WBS 항목당 하나의 평가기준만 존재
- 평가기준이 없는 경우 빈 배열 반환
- 삭제된 평가기준은 조회에서 제외
- 응답에 항상 wbsItemId 포함

**테스트 케이스:**
- 평가기준 조회: 특정 WBS 항목의 평가기준을 성공적으로 조회
- 빈 배열 반환: 평가기준이 없는 WBS 항목 조회 시 빈 배열 반환
- 삭제된 평가기준 제외: 삭제된 평가기준은 조회 결과에 포함되지 않음
- 단일 평가기준: WBS 항목당 하나의 평가기준만 조회됨 (최신 것)
- 독립성 보장: 여러 WBS 항목의 평가기준은 서로 독립적으로 관리
- wbsItemId 포함: 응답에 항상 wbsItemId가 포함됨
- 잘못된 UUID: 잘못된 UUID 형식의 wbsItemId로 조회 시 400 또는 500 에러
- 존재하지 않는 wbsItemId: 존재하지 않는 wbsItemId로 조회 시 빈 배열 반환
- 빈 문자열 wbsItemId: 빈 문자열로 조회 시 404 또는 500 에러
- 생성-조회-수정-조회: 전체 라이프사이클 테스트
- 생성-조회-삭제-조회: 삭제 후 빈 배열 반환 확인`,
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목별 평가기준이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: '조회한 WBS 항목 ID',
          },
          criteria: {
            type: 'array',
            description: '평가기준 목록 (최대 1개)',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                criteria: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        example: {
          wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          criteria: [
            {
              id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
              wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
              criteria: '코드 품질 및 성능 최적화',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 UUID 형식입니다.',
    }),
    ApiResponse({
      status: 500,
      description: 'DB 레벨 UUID 검증 실패 또는 서버 내부 오류입니다.',
    }),
  );

/**
 * WBS 평가기준 저장 (Upsert) API 데코레이터
 * - WBS 항목당 하나의 평가기준만 존재
 * - wbsItemId를 기준으로 자동으로 생성/수정 결정
 */
export const UpsertWbsEvaluationCriteria = () =>
  applyDecorators(
    Post('wbs-item/:wbsItemId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 평가기준 저장 (Upsert)',
      description: `**중요**: WBS 항목의 평가기준을 생성하거나 수정합니다. WBS 항목당 하나의 평가기준만 존재하므로, wbsItemId를 기준으로 자동으로 생성/수정이 결정됩니다.

**동작 방식:**
- wbsItemId에 평가기준이 없으면: 새로운 평가기준 생성
- wbsItemId에 평가기준이 있으면: 기존 평가기준 수정
- Body에 id 값을 보낼 필요 없음 (내부적으로 wbsItemId로 조회)
- 빈 문자열 criteria 전송 시: 평가기준 내용을 빈 문자열로 초기화
- isAdditional 필드로 추가 과제 여부 설정 가능 (true: 추가 과제, false: 일반 과제)

**사용 사례:**
- 평가기준 최초 작성 시: criteria와 isAdditional 값 전송
- 평가기준 수정 시: criteria와 isAdditional 값 전송 (시스템이 자동으로 기존 평가기준 찾아 수정)
- 평가기준 내용 초기화: 빈 문자열 criteria 전송으로 내용 초기화
- WBS 항목당 단일 평가기준 관리
- 추가 과제 표시: isAdditional=true로 설정하여 추가로 할당된 과제임을 표시

**테스트 케이스:**
- 기본 생성: 새로운 WBS 평가기준을 성공적으로 생성
- actionBy 없이 생성: actionBy 없이도 평가기준 생성 가능 (임시 UUID 자동 생성)
- 같은 WBS 여러 번 저장: 동일 WBS 항목에 여러 번 저장 시 덮어쓰기됨
- 긴 평가기준 내용: 긴 텍스트 평가기준 저장 가능
- 다른 WBS 동일 내용: 다른 WBS 항목에 동일한 평가기준 내용 생성 가능
- 기존 평가기준 자동 수정: 동일 wbsItemId로 재요청 시 자동으로 수정됨
- updatedAt 갱신: 수정 시 updatedAt이 자동으로 갱신됨
- 동일 내용 수정: 동일한 내용으로도 수정 가능
- createdAt 불변: 수정 시 createdAt은 변경되지 않음 (10ms 이내 오차 허용)
- 빈 문자열 허용: 시스템이 빈 문자열 criteria를 허용하여 내용 초기화 가능
- 빈 문자열로 초기화: 기존 내용을 빈 문자열로 덮어쓰기하여 초기화
- criteria 필드 필수: criteria 필드 누락 시 400 에러
- 존재하지 않는 wbsItemId: 존재하지 않는 WBS 항목 ID로 요청 시 400 또는 404 에러
- 잘못된 UUID - wbsItemId: 잘못된 UUID 형식의 wbsItemId 전달 시 400 에러
- 잘못된 UUID - actionBy: 잘못된 UUID 형식의 actionBy로 요청 시 400 에러
- DB 저장 확인: 생성/수정된 평가기준이 DB에 올바르게 저장됨
- DB 수정 확인: 수정된 평가기준이 DB에 올바르게 반영됨
- 특수 문자 지원: 특수 문자가 포함된 평가기준 저장 가능
- 줄바꿈 지원: 줄바꿈이 포함된 평가기준 저장 가능
- 이모지 지원: 이모지가 포함된 평가기준 저장 가능
- 다국어 지원: 한글, 영문, 숫자가 혼합된 평가기준 저장 가능`,
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiBody({
      type: UpsertWbsEvaluationCriteriaBodyDto,
      description:
        'WBS 평가기준 저장 데이터 (wbsItemId를 기준으로 자동 생성/수정)',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 저장되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목 또는 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 생성 API 데코레이터
 */
export const CreateWbsEvaluationCriteria = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'WBS 평가기준 생성',
      description: '새로운 WBS 평가기준을 생성합니다.',
    }),
    ApiBody({
      description: 'WBS 평가기준 생성 데이터',
      schema: {
        type: 'object',
        properties: {
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 항목 ID',
          },
          criteria: {
            type: 'string',
            description: '평가기준 내용',
          },
        },
        required: ['wbsItemId', 'criteria'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'WBS 평가기준이 성공적으로 생성되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 수정 API 데코레이터
 */
export const UpdateWbsEvaluationCriteria = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 수정',
      description: '기존 WBS 평가기준을 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      description: 'WBS 평가기준 수정 데이터',
      schema: {
        type: 'object',
        properties: {
          criteria: {
            type: 'string',
            description: '평가기준 내용',
          },
        },
        required: ['criteria'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 수정되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 삭제 API 데코레이터
 */
export const DeleteWbsEvaluationCriteria = () =>
  applyDecorators(
    Delete(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 삭제',
      description: `WBS 평가기준을 삭제합니다. Soft Delete 방식으로 삭제됩니다.

**동작 방식:**
- 평가기준을 Soft Delete 처리 (deletedAt 설정)
- 삭제된 평가기준은 목록 조회에서 제외됨
- 삭제된 평가기준은 상세 조회 시 null 또는 빈 객체 반환
- 이미 삭제된 평가기준을 다시 삭제해도 에러가 발생하지 않음

**테스트 케이스:**
- 유효한 평가기준 ID로 삭제: 평가기준이 성공적으로 삭제됨
- DB soft delete 확인: deletedAt이 설정되고 데이터는 유지됨
- 목록 조회 제외: 삭제된 평가기준은 목록에서 보이지 않음
- 상세 조회: 삭제된 평가기준은 null 또는 빈 객체 반환
- 중복 삭제 허용: 이미 삭제된 평가기준을 다시 삭제해도 404 또는 200 반환
- 존재하지 않는 ID: 404 또는 500 에러 반환
- 잘못된 UUID 형식: 400 또는 500 에러 반환`,
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
      example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 삭제되었습니다.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: '삭제 성공 여부',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 항목 평가기준 전체 삭제 API 데코레이터
 */
export const DeleteWbsItemEvaluationCriteria = () =>
  applyDecorators(
    Delete('wbs-item/:wbsItemId'),
    ApiOperation({
      summary: 'WBS 항목 평가기준 전체 삭제',
      description: `특정 WBS 항목의 평가기준을 삭제합니다. WBS 항목당 하나의 평가기준만 존재하므로 해당 평가기준을 삭제합니다.

**동작 방식:**
- WBS 항목에 연결된 평가기준을 Soft Delete 처리
- 평가기준이 없는 WBS 항목에 대해서도 에러 없이 처리
- 다른 WBS 항목의 평가기준은 영향받지 않음

**사용 사례:**
- WBS 항목 재설정 시 기존 평가기준 제거
- WBS 항목 삭제 전 평가기준 정리
- 평가기준 초기화

**테스트 케이스:**
- WBS 항목 평가기준 삭제: 평가기준이 성공적으로 삭제됨
- DB soft delete 확인: deletedAt이 설정되고 활성 평가기준이 없음
- 목록 조회 결과: 삭제 후 빈 배열 반환
- 평가기준 없는 경우: 평가기준이 없어도 200 또는 404 반환
- 중복 삭제 허용: 이미 삭제된 평가기준을 다시 삭제해도 에러 없음
- 다른 WBS 항목 보호: 다른 WBS 항목의 평가기준은 영향받지 않음
- 존재하지 않는 WBS 항목: 200 또는 404 반환
- 잘못된 UUID 형식: 400 또는 500 에러 반환
- 재생성 가능: 삭제 후 동일한 WBS 항목에 새 평가기준 생성 가능`,
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목의 평가기준이 성공적으로 삭제되었습니다.',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: '삭제 성공 여부',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목을 찾을 수 없습니다.',
    }),
  );

/**
 * 평가기준 제출 API 데코레이터
 */
export const SubmitEvaluationCriteria = () =>
  applyDecorators(
    Post('submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기준 제출',
      description: `평가기간의 직원 평가기준을 제출합니다.

**동작:**
- 평가기간-직원 맵핑의 평가기준 제출 상태를 true로 변경
- 제출 일시와 제출 처리자 정보 저장
- 이미 제출된 경우에도 성공으로 처리 (멱등성 보장)

**테스트 케이스:**
- 기본 제출: 평가기간과 직원 ID로 평가기준 제출 성공
- 제출 상태 확인: 제출 후 isCriteriaSubmitted가 true로 변경됨
- 제출 일시 확인: 제출 후 criteriaSubmittedAt이 현재 시간으로 설정됨
- 제출 처리자 확인: 제출 후 criteriaSubmittedBy가 요청자 ID로 설정됨
- 중복 제출: 이미 제출된 평가기준을 다시 제출해도 성공 처리
- 존재하지 않는 맵핑: 존재하지 않는 평가기간-직원 맵핑으로 제출 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식의 evaluationPeriodId 또는 employeeId 입력 시 400 에러`,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          evaluationPeriodId: {
            type: 'string',
            format: 'uuid',
            description: '평가기간 ID',
            example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          },
          employeeId: {
            type: 'string',
            format: 'uuid',
            description: '직원 ID',
            example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          },
        },
        required: ['evaluationPeriodId', 'employeeId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: '평가기준이 성공적으로 제출되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          evaluationPeriodId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' },
          isCriteriaSubmitted: { type: 'boolean' },
          criteriaSubmittedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          criteriaSubmittedBy: { type: 'string', nullable: true },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: '평가기간-직원 맵핑을 찾을 수 없습니다.',
    }),
  );

/**
 * 평가기준 제출 초기화 API 데코레이터
 */
export const ResetEvaluationCriteriaSubmission = () =>
  applyDecorators(
    Post('reset-submission'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기준 제출 초기화',
      description: `평가기간의 직원 평가기준 제출 상태를 초기화합니다.

**동작:**
- 평가기간-직원 맵핑의 평가기준 제출 상태를 false로 변경
- 제출 일시와 제출 처리자 정보 초기화
- 제출되지 않은 경우에도 성공으로 처리 (멱등성 보장)

**테스트 케이스:**
- 기본 초기화: 평가기간과 직원 ID로 평가기준 제출 초기화 성공
- 초기화 상태 확인: 초기화 후 isCriteriaSubmitted가 false로 변경됨
- 제출 일시 초기화: 초기화 후 criteriaSubmittedAt이 null로 변경됨
- 제출 처리자 초기화: 초기화 후 criteriaSubmittedBy가 null로 변경됨
- 중복 초기화: 이미 초기화된 평가기준을 다시 초기화해도 성공 처리
- 존재하지 않는 맵핑: 존재하지 않는 평가기간-직원 맵핑으로 초기화 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식의 evaluationPeriodId 또는 employeeId 입력 시 400 에러`,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          evaluationPeriodId: {
            type: 'string',
            format: 'uuid',
            description: '평가기간 ID',
            example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          },
          employeeId: {
            type: 'string',
            format: 'uuid',
            description: '직원 ID',
            example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          },
        },
        required: ['evaluationPeriodId', 'employeeId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: '평가기준 제출이 성공적으로 초기화되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          evaluationPeriodId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' },
          isCriteriaSubmitted: { type: 'boolean' },
          criteriaSubmittedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          criteriaSubmittedBy: { type: 'string', nullable: true },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: '평가기간-직원 맵핑을 찾을 수 없습니다.',
    }),
  );
