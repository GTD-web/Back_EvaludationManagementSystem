import { Injectable, Logger } from '@nestjs/common';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import type {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 비즈니스 서비스
 *
 * 프로젝트 할당 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 프로젝트 할당 생성
 * - 프로젝트 할당 취소
 * - 프로젝트 대량 할당
 * - 활동 내역 자동 기록
 */
@Injectable()
export class ProjectAssignmentBusinessService {
  private readonly logger = new Logger(ProjectAssignmentBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  /**
   * 프로젝트를 할당한다 (활동 내역 기록 포함)
   */
  async 프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    this.logger.log('프로젝트 할당 시작', {
      employeeId: data.employeeId,
      projectId: data.projectId,
      periodId: data.periodId,
    });

    // 프로젝트 할당 생성
    const assignment = await this.evaluationCriteriaManagementService.프로젝트를_할당한다(
      data,
      assignedBy,
    );

    // 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId: data.periodId,
        employeeId: data.employeeId,
        activityType: 'project_assignment',
        activityAction: 'created',
        activityTitle: '프로젝트 할당',
        relatedEntityType: 'project_assignment',
        relatedEntityId: assignment.id,
        performedBy: assignedBy,
        activityMetadata: {
          projectId: data.projectId,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 프로젝트 할당은 정상 처리
      this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
        assignmentId: assignment.id,
        error: error.message,
      });
    }

    this.logger.log('프로젝트 할당 완료', { assignmentId: assignment.id });

    return assignment;
  }

  /**
   * 프로젝트를 대량으로 할당한다 (활동 내역 기록 포함)
   */
  async 프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    this.logger.log('프로젝트 대량 할당 시작', {
      count: assignments.length,
    });

    // 프로젝트 대량 할당 생성
    const results =
      await this.evaluationCriteriaManagementService.프로젝트를_대량으로_할당한다(
        assignments,
        assignedBy,
      );

    // 각 할당에 대해 활동 내역 기록
    for (const assignment of results) {
      try {
        const assignmentData = assignments.find(
          (a) =>
            a.employeeId === assignment.employeeId &&
            a.projectId === assignment.projectId &&
            a.periodId === assignment.periodId,
        );

        if (assignmentData) {
          await this.activityLogContextService.활동내역을_기록한다({
            periodId: assignmentData.periodId,
            employeeId: assignmentData.employeeId,
            activityType: 'project_assignment',
            activityAction: 'created',
            activityTitle: '프로젝트 할당',
            relatedEntityType: 'project_assignment',
            relatedEntityId: assignment.id,
            performedBy: assignedBy,
            activityMetadata: {
              projectId: assignmentData.projectId,
            },
          });
        }
      } catch (error) {
        // 활동 내역 기록 실패 시에도 프로젝트 할당은 정상 처리
        this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
          assignmentId: assignment.id,
          error: error.message,
        });
      }
    }

    this.logger.log('프로젝트 대량 할당 완료', {
      count: results.length,
    });

    return results;
  }

  /**
   * 프로젝트 할당을 취소한다 (활동 내역 기록 포함)
   */
  async 프로젝트_할당을_취소한다(
    id: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log('프로젝트 할당 취소 시작', { assignmentId: id });

    // 할당 정보 조회 (활동 내역 기록을 위해 취소 전에 조회)
    const assignment =
      await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(
        id,
      );

    if (!assignment) {
      throw new Error(`프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`);
    }

    // 프로젝트 할당 취소
    await this.evaluationCriteriaManagementService.프로젝트_할당을_취소한다(
      id,
      cancelledBy,
    );

    // 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId: assignment.periodId,
        employeeId: assignment.employeeId,
        activityType: 'project_assignment',
        activityAction: 'cancelled',
        activityTitle: '프로젝트 할당 취소',
        relatedEntityType: 'project_assignment',
        relatedEntityId: id,
        performedBy: cancelledBy,
        activityMetadata: {
          projectId: assignment.projectId,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 프로젝트 할당 취소는 정상 처리
      this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
        assignmentId: id,
        error: error.message,
      });
    }

    this.logger.log('프로젝트 할당 취소 완료', { assignmentId: id });
  }

  /**
   * 프로젝트 할당을 프로젝트 ID로 취소한다 (활동 내역 기록 포함)
   */
  async 프로젝트_할당을_프로젝트_ID로_취소한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log('프로젝트 할당 취소 시작 (프로젝트 ID 기반)', {
      employeeId,
      projectId,
      periodId,
    });

    // 할당 목록 조회하여 할당 ID 찾기 (활동 내역 기록을 위해 취소 전에 조회)
    let assignmentList =
      await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다({
        employeeId,
        projectId,
        periodId,
        page: 1,
        limit: 1,
      });

    let targetAssignment =
      assignmentList.assignments && assignmentList.assignments.length > 0
        ? assignmentList.assignments[0]
        : null;

    // my-assigned-data 조회 시 employeeId는 현재 로그인 사용자와 동일. 요청 body의 employeeId가
    // 본인과 다를 경우 cancelledBy로 fallback 조회 (본인 할당 취소 시도)
    if (!targetAssignment && cancelledBy !== employeeId) {
      this.logger.log(
        '프로젝트 할당 취소: 요청 employeeId로 할당 없음, cancelledBy(본인)로 fallback 조회',
        { requestEmployeeId: employeeId, fallbackEmployeeId: cancelledBy },
      );
      assignmentList =
        await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다({
          employeeId: cancelledBy,
          projectId,
          periodId,
          page: 1,
          limit: 1,
        });
      targetAssignment =
        assignmentList.assignments && assignmentList.assignments.length > 0
          ? assignmentList.assignments[0]
          : null;
      if (targetAssignment) {
        employeeId = cancelledBy;
      }
    }

    const assignmentId = targetAssignment?.id ?? null;

    // employeeId/periodId 검증: 조회된 할당과 요청 파라미터 일치 여부 확인
    if (targetAssignment) {
      const employeeIdMatches = targetAssignment.employeeId === employeeId;
      const periodIdMatches = targetAssignment.periodId === periodId;
      const isSelfCancellation = cancelledBy === employeeId;

      if (!employeeIdMatches || !periodIdMatches) {
        this.logger.warn(
          '프로젝트 할당 취소 검증 불일치 - my-assigned-data와 요청 파라미터 불일치 가능성',
          {
            assignmentEmployeeId: targetAssignment.employeeId,
            requestEmployeeId: employeeId,
            assignmentPeriodId: targetAssignment.periodId,
            requestPeriodId: periodId,
          },
        );
      } else if (!isSelfCancellation) {
        this.logger.log(
          '프로젝트 할당 취소: 타인(관리자 대신) 취소 - my-assigned-data는 취소자 본인 기준으로 조회됨',
          { cancelledBy, targetEmployeeId: employeeId },
        );
      }
    }

    this.logger.log('프로젝트 할당 취소 대상 확인', {
      assignmentId,
      employeeId,
      projectId,
      periodId,
      cancelledBy,
      isSelfCancellation: cancelledBy === employeeId,
    });

    // 프로젝트 할당 취소
    await this.evaluationCriteriaManagementService.프로젝트_할당을_프로젝트_ID로_취소한다(
      employeeId,
      projectId,
      periodId,
      cancelledBy,
    );

    // 활동 내역 기록 (할당이 있었던 경우에만)
    if (assignmentId) {
      try {
        await this.activityLogContextService.활동내역을_기록한다({
          periodId,
          employeeId,
          activityType: 'project_assignment',
          activityAction: 'cancelled',
          activityTitle: '프로젝트 할당 취소',
          relatedEntityType: 'project_assignment',
          relatedEntityId: assignmentId,
          performedBy: cancelledBy,
          activityMetadata: {
            projectId,
          },
        });
      } catch (error) {
        // 활동 내역 기록 실패 시에도 프로젝트 할당 취소는 정상 처리
        this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
          assignmentId,
          error: error.message,
        });
      }
    }

    this.logger.log('프로젝트 할당 취소 완료 (프로젝트 ID 기반)', {
      assignmentId,
      employeeId,
      projectId,
      periodId,
    });
  }
}

