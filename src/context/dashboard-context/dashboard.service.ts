import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  IDashboardContext,
  EmployeeEvaluationPeriodStatusDto,
  MyEvaluationTargetStatusDto,
} from './interfaces/dashboard-context.interface';
import {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetAllEmployeesEvaluationPeriodStatusQuery,
  GetMyEvaluationTargetsStatusQuery,
  GetEmployeeAssignedDataQuery,
  EmployeeAssignedDataResult,
  GetEvaluatorAssignedEmployeesDataQuery,
  EvaluatorAssignedEmployeesDataResult,
  GetFinalEvaluationsByPeriodQuery,
  FinalEvaluationByPeriodResult,
  GetFinalEvaluationsByEmployeeQuery,
  FinalEvaluationByEmployeeResult,
  GetAllEmployeesFinalEvaluationsQuery,
  AllEmployeesFinalEvaluationResult,
} from './handlers/queries';

/**
 * 대시보드 서비스
 *
 * 평가 관련 대시보드 정보를 제공하는 서비스입니다.
 * CQRS 패턴을 사용하여 쿼리를 처리합니다.
 */
@Injectable()
export class DashboardService implements IDashboardContext {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null> {
    const query = new GetEmployeeEvaluationPeriodStatusQuery(
      evaluationPeriodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간의 모든 피평가자 현황을 조회한다
   */
  async 평가기간의_모든_피평가자_현황을_조회한다(
    evaluationPeriodId: string,
    includeUnregistered: boolean = false,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]> {
    const query = new GetAllEmployeesEvaluationPeriodStatusQuery(
      evaluationPeriodId,
      includeUnregistered,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 내가 담당하는 평가 대상자 현황을 조회한다
   */
  async 내가_담당하는_평가대상자_현황을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusDto[]> {
    const query = new GetMyEvaluationTargetsStatusQuery(
      evaluationPeriodId,
      evaluatorId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 사용자 할당 정보를 조회한다
   *
   * 특정 직원의 평가기간 내 할당된 프로젝트, WBS, 평가기준, 성과, 자기평가 정보를 조회합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 조회할 직원 ID (피평가자)
   * @param viewerId 조회하는 사람의 ID (평가자 확인용, optional)
   */
  async 사용자_할당_정보를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    viewerId?: string,
  ): Promise<EmployeeAssignedDataResult> {
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
      viewerId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 담당자의 피평가자 할당 정보를 조회한다
   *
   * 평가자가 담당하는 특정 피평가자의 평가기간 내 할당된 프로젝트, WBS, 평가기준, 성과, 자기평가, 하향평가 정보를 조회합니다.
   */
  async 담당자의_피평가자_할당_정보를_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
    employeeId: string,
  ): Promise<EvaluatorAssignedEmployeesDataResult> {
    const query = new GetEvaluatorAssignedEmployeesDataQuery(
      evaluationPeriodId,
      evaluatorId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간별 최종평가 목록을 조회한다
   *
   * 특정 평가기간에 등록된 모든 직원의 최종평가를 조회합니다.
   * 제외된 직원은 결과에서 제외됩니다.
   */
  async 평가기간별_최종평가_목록을_조회한다(
    evaluationPeriodId: string,
  ): Promise<FinalEvaluationByPeriodResult[]> {
    const query = new GetFinalEvaluationsByPeriodQuery(evaluationPeriodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 직원별 최종평가 목록을 조회한다
   *
   * 특정 직원의 모든 평가기간에 대한 최종평가를 조회합니다.
   * 날짜 범위를 지정하여 특정 기간의 평가만 조회할 수 있습니다.
   */
  async 직원별_최종평가_목록을_조회한다(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<FinalEvaluationByEmployeeResult[]> {
    const query = new GetFinalEvaluationsByEmployeeQuery(
      employeeId,
      startDate,
      endDate,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 전체_직원별_최종평가_목록을_조회한다
   *
   * 모든 직원의 최종평가를 조회합니다.
   * 날짜 범위를 지정하여 특정 기간의 평가만 조회할 수 있습니다.
   * 제외된 직원은 결과에서 자동으로 제외됩니다.
   */
  async 전체_직원별_최종평가_목록을_조회한다(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AllEmployeesFinalEvaluationResult[]> {
    const query = new GetAllEmployeesFinalEvaluationsQuery(startDate, endDate);
    return await this.queryBus.execute(query);
  }
}
