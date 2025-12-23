/**
 * 프로젝트 중요도 관련 타입 정의
 */

/**
 * 프로젝트 중요도 DTO
 */
export interface ProjectImportanceDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 중요도 코드 (예: 1A, 1B, 2A, 2B, 3A) */
  code: string;
  /** 중요도 이름 (설명) */
  name?: string;
  /** 표시 순서 */
  displayOrder: number;
  /** 활성 여부 */
  isActive: boolean;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;
}

/**
 * 프로젝트 중요도 생성 DTO
 */
export interface CreateProjectImportanceDto {
  /** 중요도 코드 */
  code: string;
  /** 중요도 이름 (설명) */
  name?: string;
  /** 표시 순서 */
  displayOrder?: number;
  /** 활성 여부 */
  isActive?: boolean;
}

/**
 * 프로젝트 중요도 수정 DTO
 */
export interface UpdateProjectImportanceDto {
  /** 중요도 코드 */
  code?: string;
  /** 중요도 이름 (설명) */
  name?: string;
  /** 표시 순서 */
  displayOrder?: number;
  /** 활성 여부 */
  isActive?: boolean;
}

