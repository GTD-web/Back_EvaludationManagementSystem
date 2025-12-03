import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { ExcludedEvaluationTargetAccessException } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.exceptions';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EmployeeAssignedDataResult } from './types';
import { getProjectsWithWbs } from './project-wbs.utils';
import {
  calculateSelfEvaluationScore,
  calculatePrimaryDownwardEvaluationScore,
  calculateSecondaryDownwardEvaluationScore,
} from './summary-calculation.utils';
import { IsNull, In } from 'typeorm';

/**
 * 사용자 할당 정보 조회 쿼리
 */
export class GetEmployeeAssignedDataQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly viewerId?: string, // 조회하는 사람의 ID (평가자 확인용)
  ) {}
}

/**
 * 사용자 할당 정보 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEmployeeAssignedDataQuery)
export class GetEmployeeAssignedDataHandler
  implements
    IQueryHandler<GetEmployeeAssignedDataQuery, EmployeeAssignedDataResult>
{
  private readonly logger = new Logger(GetEmployeeAssignedDataHandler.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly criteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly selfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  async execute(
    query: GetEmployeeAssignedDataQuery,
  ): Promise<EmployeeAssignedDataResult> {
    const { evaluationPeriodId, employeeId, viewerId } = query;

    this.logger.log('사용자 할당 정보 조회 시작', {
      evaluationPeriodId,
      employeeId,
      viewerId,
    });

    // 1. 평가기간 조회
    const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });

    if (!evaluationPeriod) {
      throw new NotFoundException(
        `평가기간을 찾을 수 없습니다. (evaluationPeriodId: ${evaluationPeriodId})`,
      );
    }

    // 2. 직원 조회
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `직원을 찾을 수 없습니다. (employeeId: ${employeeId})`,
      );
    }

    // 3. 부서명 조회
    let departmentName: string | undefined;
    if (employee.departmentId) {
      // departmentId가 UUID인지 확인하고 code로 조회 시도
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          employee.departmentId,
        );

      const department = await this.departmentRepository.findOne({
        where: isUUID
          ? { id: employee.departmentId }
          : { code: employee.departmentId },
      });
      departmentName = department?.name;
    }

    // 4. 평가기간-직원 매핑 확인
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간에 등록되지 않은 직원입니다. (evaluationPeriodId: ${evaluationPeriodId}, employeeId: ${employeeId})`,
      );
    }

    // 5. 평가 대상 제외 여부 확인
    if (mapping.isExcluded) {
      throw new ExcludedEvaluationTargetAccessException(
        evaluationPeriodId,
        employeeId,
      );
    }

    // 6. 프로젝트별 할당 정보 조회 (WBS 및 산출물 포함)
    const projects = await getProjectsWithWbs(
      evaluationPeriodId,
      employeeId,
      mapping,
      this.projectAssignmentRepository,
      this.wbsAssignmentRepository,
      this.wbsItemRepository,
      this.criteriaRepository,
      this.selfEvaluationRepository,
      this.downwardEvaluationRepository,
      this.evaluationLineMappingRepository,
      this.deliverableRepository,
      this.employeeRepository,
    );

    // 7. 요약 정보 계산
    let completedPerformances = 0;
    const totalWbs = projects.reduce((sum, project) => {
      project.wbsList.forEach((wbs) => {
        if (wbs.performance?.isCompleted) completedPerformances++;
      });
      return sum + project.wbsList.length;
    }, 0);

    // 전체 자기평가 수 및 제출 상태 조회
    const totalSelfEvaluations = await this.selfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: null as any,
      },
    });

    // 1차 평가자에게 제출된 자기평가 수
    const submittedToEvaluatorCount = await this.selfEvaluationRepository.count(
      {
        where: {
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          submittedToEvaluator: true,
          deletedAt: null as any,
        },
      },
    );

    // 관리자에게 제출된 자기평가 수 (완료된 자기평가)
    const submittedToManagerCount = await this.selfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        submittedToManager: true,
        deletedAt: null as any,
      },
    });

    const completedSelfEvaluations = submittedToManagerCount;

    // 7. 자기평가 점수/등급 계산
    const selfEvaluationScore = await calculateSelfEvaluationScore(
      evaluationPeriodId,
      employeeId,
      completedSelfEvaluations,
      this.selfEvaluationRepository,
      this.wbsAssignmentRepository,
      this.evaluationPeriodRepository,
    );

    // 전체 제출 상태 계산
    const isSubmittedToEvaluator =
      totalSelfEvaluations > 0 &&
      submittedToEvaluatorCount === totalSelfEvaluations;
    const isSubmittedToManager =
      totalSelfEvaluations > 0 &&
      submittedToManagerCount === totalSelfEvaluations;

    const selfEvaluation = {
      ...selfEvaluationScore,
      totalSelfEvaluations,
      submittedToEvaluatorCount,
      submittedToManagerCount,
      isSubmittedToEvaluator,
      isSubmittedToManager,
    };

    // 8. 1차 하향평가 점수/등급 계산
    const primaryDownwardEvaluation =
      await calculatePrimaryDownwardEvaluationScore(
        evaluationPeriodId,
        employeeId,
        this.evaluationLineMappingRepository,
        this.downwardEvaluationRepository,
        this.wbsAssignmentRepository,
        this.evaluationPeriodRepository,
      );

    // 9. 2차 하향평가 점수/등급 계산
    const secondaryDownwardEvaluation =
      await calculateSecondaryDownwardEvaluationScore(
        evaluationPeriodId,
        employeeId,
        this.evaluationLineMappingRepository,
        this.downwardEvaluationRepository,
        this.wbsAssignmentRepository,
        this.evaluationPeriodRepository,
        this.employeeRepository,
      );

    const summary = {
      totalProjects: projects.length,
      totalWbs,
      completedPerformances,
      completedSelfEvaluations,
      selfEvaluation,
      primaryDownwardEvaluation,
      secondaryDownwardEvaluation,
      criteriaSubmission: {
        isSubmitted: mapping.isCriteriaSubmitted || false,
        submittedAt: mapping.criteriaSubmittedAt || null,
        submittedBy: mapping.criteriaSubmittedBy || null,
      },
    };

    // 평가자가 피평가자의 데이터를 조회한 경우 Activity Log 기록
    // viewerId가 있으면 평가자 관계 확인 (자기 자신을 평가하는 경우도 포함)
    if (viewerId) {
      try {
        // 평가자-피평가자 관계 확인
        const evaluationMappings = await this.evaluationLineMappingRepository.find(
          {
            where: {
              evaluationPeriodId,
              evaluatorId: viewerId,
              employeeId,
              deletedAt: IsNull(),
            },
          },
        );

        // 평가자 관계가 있는 경우에만 Activity Log 기록
        // (피평가자가 자신을 평가하는 경우 포함)
        if (evaluationMappings.length > 0) {
          // EvaluationLineMapping에서 evaluationLine을 통해 evaluatorType 추출
          const evaluationLineIds = [
            ...new Set(evaluationMappings.map((m) => m.evaluationLineId)),
          ];
          const evaluationLines = await this.evaluationLineRepository.find({
            where: {
              id: In(evaluationLineIds),
              deletedAt: IsNull(),
            },
          });
          const evaluatorTypes = evaluationLines.map(
            (line) => line.evaluatorType,
          );

          await this.activityLogContextService.활동내역을_기록한다({
            periodId: evaluationPeriodId,
            employeeId,
            activityType: 'downward_evaluation',
            activityAction: 'viewed',
            activityTitle: '피평가자 할당 정보 조회',
            performedBy: viewerId,
            activityDate: new Date(),
            activityMetadata: {
              evaluatorTypes,
            },
          });

          this.logger.log('평가자 활동 로그 기록 완료', {
            evaluatorId: viewerId,
            employeeId,
            evaluatorTypes,
          });
        } else {
          this.logger.log('평가자-피평가자 관계 없음 - Activity Log 기록 생략', {
            viewerId,
            employeeId,
          });
        }
      } catch (error) {
        // 활동 로그 기록 실패 시에도 데이터 조회는 정상 처리
        this.logger.warn('활동 내역 기록 실패', {
          viewerId,
          employeeId,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    return {
      evaluationPeriod: {
        id: evaluationPeriod.id,
        name: evaluationPeriod.name,
        startDate: evaluationPeriod.startDate,
        status: evaluationPeriod.status,
        currentPhase: evaluationPeriod.currentPhase,
        description: evaluationPeriod.description,
        criteriaSettingEnabled: evaluationPeriod.criteriaSettingEnabled,
        selfEvaluationSettingEnabled:
          evaluationPeriod.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          evaluationPeriod.finalEvaluationSettingEnabled,
        maxSelfEvaluationRate: evaluationPeriod.maxSelfEvaluationRate,
      },
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        departmentId: employee.departmentId || '',
        departmentName,
        status: employee.status,
      },
      projects,
      summary,
    };
  }
}
