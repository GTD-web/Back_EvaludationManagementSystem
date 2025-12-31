import type { EvaluationLineMappingDto } from '../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '../../../domain/core/evaluation-line/evaluation-line.types';
import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
  OrderDirection,
} from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  ProjectInfoDto,
  EmployeeInfoDto,
} from '../../../interface/common/dto/evaluation-criteria/project-assignment.dto';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  UpdateEvaluationWbsAssignmentData,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type {
  CreateWbsEvaluationCriteriaData,
  UpdateWbsEvaluationCriteriaData,
  WbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilter,
} from '../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import type { WbsItemDto } from '../../../domain/common/wbs-item/wbs-item.types';
import type { ProjectAssignmentListResult } from '../handlers/project-assignment/queries/get-project-assignment-list.handler';
import type { WbsAssignmentListResult } from '../handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import type { WbsAssignmentDetailResult } from '../handlers/wbs-assignment/queries/get-wbs-assignment-detail.handler';
import { WbsEvaluationCriteriaListResponseDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';

/**
 * 평가기준관리 서비스 인터페이스 (MVP 버전)
 *
 * MVP에서는 핵심 기능만 제공합니다:
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 */
export interface IEvaluationCriteriaManagementService {
  // ============================================================================
  // 프로젝트 할당 관리
  // ============================================================================

  /**
   * 평가기간에 직원에게 프로젝트를 할당한다
   */
  프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 취소한다
   */
  프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * 프로젝트 할당 목록을 조회한다
   */
  프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<ProjectAssignmentListResult>;

  /**
   * 특정 평가기간에 직원에게 할당된 프로젝트를 조회한다
   */
  특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{ projects: ProjectInfoDto[] }>;

  /**
   * 프로젝트 할당 상세를 조회한다
   */
  프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null>;

  /**
   * 특정 평가기간에 프로젝트에 할당된 직원을 조회한다
   */
  특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<{ employees: EmployeeInfoDto[] }>;

  /**
   * 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회한다
   */
  특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<{ employees: EmployeeInfoDto[] }>;

  /**
   * 여러 프로젝트를 대량으로 할당한다
   */
  프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 프로젝트 할당 순서를 변경한다 (위로 이동 또는 아래로 이동)
   */
  프로젝트_할당_순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  // ============================================================================
  // WBS 할당 관리
  // ============================================================================

  /**
   * WBS 항목을 직원에게 할당한다
   */
  WBS를_할당한다(
    data: CreateEvaluationWbsAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당을 취소한다
   */
  WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * WBS 할당 목록을 조회한다
   */
  WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
    page?: number,
    limit?: number,
    orderBy?: string,
    orderDirection?: 'ASC' | 'DESC',
  ): Promise<WbsAssignmentListResult>;

  /**
   * 특정 평가기간에 직원에게 할당된 WBS를 조회한다
   */
  특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 특정 평가기간에 프로젝트의 WBS 할당을 조회한다
   */
  특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * WBS 할당 상세를 조회한다
   */
  WBS_할당_상세를_조회한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<WbsAssignmentDetailResult | null>;

  /**
   * 특정 평가기간에 WBS 항목에 할당된 직원을 조회한다
   */
  특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록을 조회한다
   */
  특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<WbsItemDto[]>;

  /**
   * 여러 WBS를 대량으로 할당한다
   */
  WBS를_대량으로_할당한다(
    assignments: CreateEvaluationWbsAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 평가기간의 모든 WBS 할당을 초기화한다
   */
  평가기간의_WBS_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  /**
   * 프로젝트의 모든 WBS 할당을 초기화한다
   */
  프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  /**
   * 직원의 모든 WBS 할당을 초기화한다
   */
  직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  // ============================================================================
  // 평가라인 조회
  // ============================================================================

  /**
   * 특정 평가자가 평가해야 하는 피평가자 목록을 조회한다
   */
  특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<{
    evaluatorId: string;
    employees: {
      employeeId: string;
      wbsItemId?: string;
      evaluationLineId: string;
      createdBy?: string;
      updatedBy?: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }>;

  /**
   * 평가기간의 평가자 목록을 조회한다
   */
  평가기간의_평가자_목록을_조회한다(
    periodId: string,
    type: 'primary' | 'secondary' | 'all',
  ): Promise<{
    periodId: string;
    type: 'primary' | 'secondary' | 'all';
    evaluators: {
      evaluatorId: string;
      evaluatorName: string;
      departmentName: string;
      evaluatorType: 'primary' | 'secondary';
      evaluateeCount: number;
    }[];
  }>;

  // ============================================================================
  // 평가라인 구성 관리 (핵심 기능)
  // ============================================================================

  /**
   * 직원-WBS별 평가라인을 구성한다
   */
  직원_WBS별_평가라인을_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
  }>;

  // ============================================================================
  // WBS 평가기준 관리
  // ============================================================================

  /**
   * WBS 평가기준을 생성한다
   */
  WBS_평가기준을_생성한다(
    data: CreateWbsEvaluationCriteriaData,
    createdBy: string,
  ): Promise<WbsEvaluationCriteriaDto>;

  /**
   * WBS 평가기준을 수정한다
   */
  WBS_평가기준을_수정한다(
    id: string,
    data: UpdateWbsEvaluationCriteriaData,
    updatedBy: string,
  ): Promise<WbsEvaluationCriteriaDto>;

  /**
   * WBS 평가기준을 삭제한다
   */
  WBS_평가기준을_삭제한다(id: string, deletedBy: string): Promise<boolean>;

  /**
   * WBS 항목의 모든 평가기준을 삭제한다
   */
  WBS_항목의_평가기준을_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
  ): Promise<boolean>;

  /**
   * WBS 평가기준 목록을 조회한다
   */
  WBS_평가기준_목록을_조회한다(
    filter: WbsEvaluationCriteriaFilter,
  ): Promise<WbsEvaluationCriteriaListResponseDto>;

  /**
   * WBS 평가기준 상세를 조회한다 (WBS 항목 정보 포함)
   */
  WBS_평가기준_상세를_조회한다(id: string): Promise<{
    id: string;
    criteria: string;
    createdAt: Date;
    updatedAt: Date;
    wbsItem: {
      id: string;
      wbsCode: string;
      title: string;
      status: string;
      level: number;
      startDate: Date;
      endDate: Date;
      progressPercentage: string;
    } | null;
  } | null>;

  /**
   * 특정 WBS 항목의 평가기준을 조회한다
   */
  특정_WBS항목의_평가기준을_조회한다(
    wbsItemId: string,
  ): Promise<WbsEvaluationCriteriaDto[]>;

  // ============================================================================
  // 통합 관리 기능 (MVP)
  // ============================================================================

  /**
   * 특정 평가기간에 직원의 평가설정을 통합 조회한다 (MVP 버전)
   */
  특정_평가기간에_직원의_평가설정을_통합_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
  }>;

  // ============================================================================
  // 할당 가능한 프로젝트 관리
  // ============================================================================

  /**
   * 할당 가능한 프로젝트 목록을 조회한다 (매니저 정보 포함, 검색/페이징/정렬 지원)
   */
  할당_가능한_프로젝트_목록을_조회한다(
    periodId: string,
    options?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    periodId: string;
    projects: Array<{
      id: string;
      name: string;
      projectCode?: string;
      manager?: {
        managerId: string;
        employeeId?: string;
        name: string;
        email?: string;
        phoneNumber?: string;
        departmentName?: string;
      } | null;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }>;
}
