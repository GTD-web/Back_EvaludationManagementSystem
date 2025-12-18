import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';

/**
 * Audit 로그 생성 DTO
 */
export interface CreateAuditLogDto {
  requestMethod: string;
  requestUrl: string;
  requestPath?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  requestQuery?: Record<string, any>;
  requestIp?: string;
  responseStatusCode: number;
  responseBody?: any;
  userId?: string;
  userEmail?: string;
  userName?: string;
  employeeNumber?: string;
  requestStartTime: Date;
  requestEndTime: Date;
  duration: number;
  requestId?: string;
}

/**
 * Audit 로그 생성 결과
 */
export interface CreateAuditLogResult {
  id: string;
  createdAt: Date;
}

/**
 * Audit 로그 필터
 */
export interface AuditLogFilter {
  userId?: string;
  userEmail?: string;
  employeeNumber?: string;
  requestMethod?: string;
  requestUrl?: string;
  responseStatusCode?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Audit 로그 목록 결과
 */
export interface AuditLogListResult {
  items: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Audit 로그 통계 아이템
 */
export interface AuditLogStatsItem {
  time: string;
  timestamp: number;
  success: number;
  errors: number;
  total: number;
}

/**
 * Audit 로그 통계 결과
 */
export interface AuditLogStatsResult {
  stats: AuditLogStatsItem[];
}

