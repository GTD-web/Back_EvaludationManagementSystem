import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import {
  Post,
  Get,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateProjectImportanceDto,
  UpdateProjectImportanceDto,
  ProjectImportanceResponseDto,
  ProjectImportanceListResponseDto,
} from '@interface/common/dto/project/project-importance.dto';

/**
 * 프로젝트 중요도 생성 API 데코레이터
 */
export function CreateProjectImportance() {
  return applyDecorators(
    Post('importances'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '프로젝트 중요도 생성',
      description: '새로운 프로젝트 중요도를 생성합니다.',
    }),
    ApiBody({
      type: CreateProjectImportanceDto,
      description: '프로젝트 중요도 생성 정보',
      examples: {
        example1: {
          summary: '중요도 생성 예시',
          value: {
            code: '1A',
            name: '1A - 최우선',
            displayOrder: 1,
            isActive: true,
          },
        },
      },
    }),
    ApiOkResponse({
      description: '프로젝트 중요도 생성 성공',
      type: ProjectImportanceResponseDto,
    }),
  );
}

/**
 * 프로젝트 중요도 목록 조회 API 데코레이터
 */
export function GetProjectImportances() {
  return applyDecorators(
    Get('importances'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 중요도 목록 조회',
      description: '프로젝트에 설정 가능한 모든 활성 중요도를 조회합니다.',
    }),
    ApiOkResponse({
      description: '프로젝트 중요도 목록 조회 성공',
      type: ProjectImportanceListResponseDto,
    }),
  );
}

/**
 * 프로젝트 중요도 상세 조회 API 데코레이터
 */
export function GetProjectImportanceDetail() {
  return applyDecorators(
    Get('importances/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 중요도 상세 조회',
      description: 'ID로 프로젝트 중요도 상세 정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 중요도 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiOkResponse({
      description: '프로젝트 중요도 상세 조회 성공',
      type: ProjectImportanceResponseDto,
    }),
  );
}

/**
 * 프로젝트 중요도 수정 API 데코레이터
 */
export function UpdateProjectImportance() {
  return applyDecorators(
    Put('importances/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '프로젝트 중요도 수정',
      description: '프로젝트 중요도 정보를 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 중요도 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateProjectImportanceDto,
      description: '프로젝트 중요도 수정 정보',
      examples: {
        example1: {
          summary: '중요도 수정 예시',
          value: {
            name: '1A - 최우선 (수정됨)',
            displayOrder: 1,
            isActive: true,
          },
        },
      },
    }),
    ApiOkResponse({
      description: '프로젝트 중요도 수정 성공',
      type: ProjectImportanceResponseDto,
    }),
  );
}

/**
 * 프로젝트 중요도 삭제 API 데코레이터
 */
export function DeleteProjectImportance() {
  return applyDecorators(
    Delete('importances/:id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '프로젝트 중요도 삭제',
      description: '프로젝트 중요도를 삭제합니다 (소프트 삭제).',
    }),
    ApiParam({
      name: 'id',
      description: '프로젝트 중요도 ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiOkResponse({
      description: '프로젝트 중요도 삭제 성공',
    }),
  );
}

/**
 * 기본 프로젝트 중요도 생성 API 데코레이터
 */
export function InitializeProjectImportances() {
  return applyDecorators(
    Post('importances/initialize'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '기본 프로젝트 중요도 생성',
      description: '기본 중요도 값들(1A, 1B, 2A, 2B, 3A)을 생성합니다. 이미 존재하는 값은 건너뜁니다.',
    }),
    ApiOkResponse({
      description: '기본 중요도 생성 성공',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: '기본 중요도 값들이 생성되었습니다.',
          },
        },
      },
    }),
  );
}

