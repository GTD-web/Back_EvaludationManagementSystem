import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationAlreadyCompletedException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { NotificationHelperService } from '@domain/common/notification/notification-helper.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

/**
 * 피평가자의 모든 하향평가 일괄 제출 커맨드
 */
export class BulkSubmitDownwardEvaluationsCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly evaluationType: DownwardEvaluationType,
    public readonly submittedBy: string = '시스템',
    public readonly forceSubmit: boolean = false, // 강제 제출 옵션 (승인 시 필수 항목 검증 건너뛰기)
  ) {}
}

/**
 * 피평가자의 모든 하향평가 일괄 제출 핸들러
 */
@Injectable()
@CommandHandler(BulkSubmitDownwardEvaluationsCommand)
export class BulkSubmitDownwardEvaluationsHandler
  implements ICommandHandler<BulkSubmitDownwardEvaluationsCommand>
{
  private readonly logger = new Logger(BulkSubmitDownwardEvaluationsHandler.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    private readonly notificationHelper: NotificationHelperService,
    private readonly stepApprovalContext: StepApprovalContextService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly employeeService: EmployeeService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: BulkSubmitDownwardEvaluationsCommand,
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const { evaluatorId, evaluateeId, periodId, evaluationType, submittedBy, forceSubmit } =
      command;

    this.logger.log('피평가자의 모든 하향평가 일괄 제출 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      evaluationType,
      forceSubmit,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 할당된 WBS에 대한 하향평가가 없으면 자동으로 생성
      // forceSubmit이 true인 경우는 승인 처리 메시지를 포함하여 생성
      await this.할당된_WBS에_대한_하향평가를_생성한다(
        evaluatorId,
        evaluateeId,
        periodId,
        evaluationType,
        submittedBy,
        forceSubmit, // 승인 처리 여부 전달
      );

      // 해당 평가자가 담당하는 피평가자의 모든 하향평가 조회
      const evaluations = await this.downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId: evaluateeId,
          periodId,
          evaluationType,
          deletedAt: null as any,
        },
      });

      // 하향평가가 없는 경우 빈 결과 반환 (스킵)
      if (evaluations.length === 0) {
        this.logger.debug(
          `하향평가가 없어 제출을 건너뜀 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`,
        );
        return {
          submittedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          submittedIds: [],
          skippedIds: [],
          failedItems: [],
        };
      }

      const submittedIds: string[] = [];
      const skippedIds: string[] = [];
      const failedItems: Array<{ evaluationId: string; error: string }> = [];

      // 제출자 이름 조회 (기본 메시지 생성용)
      const submitter = await this.employeeRepository.findOne({
        where: { id: submittedBy, deletedAt: IsNull() },
        select: ['id', 'name'],
      });
      const submitterName = submitter?.name || '평가자';

      // 각 평가를 순회하며 제출 처리
      for (const evaluation of evaluations) {
        try {
          // 이미 완료된 평가는 건너뛰기
          if (evaluation.완료되었는가()) {
            skippedIds.push(evaluation.id);
            this.logger.debug(
              `이미 완료된 평가는 건너뜀: ${evaluation.id}`,
            );
            continue;
          }

          // content가 비어있으면 기본 메시지 생성
          const updateData: any = { isCompleted: true };
          if (!evaluation.downwardEvaluationContent?.trim()) {
            updateData.downwardEvaluationContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;
            this.logger.debug(
              `빈 content로 인한 기본 메시지 생성: ${evaluation.id}`,
            );
          }

          // 하향평가 완료 처리
          await this.downwardEvaluationService.수정한다(
            evaluation.id,
            updateData,
            submittedBy,
          );

          submittedIds.push(evaluation.id);
          this.logger.debug(`하향평가 제출 완료: ${evaluation.id}`);
        } catch (error) {
          failedItems.push({
            evaluationId: evaluation.id,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.error(
            `하향평가 제출 실패: ${evaluation.id}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      const result = {
        submittedCount: submittedIds.length,
        skippedCount: skippedIds.length,
        failedCount: failedItems.length,
        submittedIds,
        skippedIds,
        failedItems,
      };

      this.logger.log('피평가자의 모든 하향평가 일괄 제출 완료', {
        totalCount: evaluations.length,
        ...result,
      });

      // 1차 하향평가인 경우 2차 평가자에게 알림 전송 (비동기 처리, 실패해도 제출은 성공)
      // 제출 성공한 평가가 있을 때만 알림 전송
      if (evaluationType === 'primary' && submittedIds.length > 0) {
        this.이차평가자에게_알림을전송한다(
          evaluateeId,
          periodId,
          submittedIds,
          evaluatorId, // 1차 평가자 ID 추가
        ).catch((error) => {
          this.logger.error(
            '1차 하향평가 일괄 제출 알림 전송 실패 (무시됨)',
            error.stack,
          );
        });
      }

      return result;
    });
  }

  /**
   * 할당된 WBS에 대한 하향평가를 생성한다
   * 1차 평가자의 경우: EvaluationWbsAssignment에서 피평가자에게 할당된 전체 WBS 조회
   * 2차 평가자의 경우: EvaluationLineMapping에서 해당 평가자에게 할당된 WBS 목록 조회
   * 각 WBS에 대한 하향평가가 없으면 생성합니다.
   * @param isApprovalMode - true일 경우 승인 처리 메시지를 포함하여 생성
   */
  private async 할당된_WBS에_대한_하향평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    evaluationType: DownwardEvaluationType,
    createdBy: string,
    isApprovalMode: boolean = false,
  ): Promise<void> {
    this.logger.log(
      `할당된 WBS에 대한 하향평가 생성 시작 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가유형: ${evaluationType}, 승인모드: ${isApprovalMode}`,
    );

    // 승인자 정보 조회 (승인 모드일 경우에만)
    let approverName = '시스템';
    if (isApprovalMode) {
      const approver = await this.employeeRepository.findOne({
        where: { id: createdBy, deletedAt: IsNull() },
        select: ['id', 'name'],
      });
      approverName = approver?.name || '관리자';
    }

    let assignedWbsIds: string[] = [];

    if (evaluationType === DownwardEvaluationType.SECONDARY) {
      // 2차 평가자의 경우: EvaluationLineMapping에서 할당된 WBS 조회
      const secondaryLine = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      if (!secondaryLine) {
        this.logger.warn('2차 평가라인을 찾을 수 없습니다.');
        return;
      }

      // 해당 평가자에게 할당된 WBS 매핑 조회
      const assignedMappings = await this.evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .select(['mapping.wbsItemId'])
        .leftJoin(
          EvaluationLine,
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId: periodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId: evaluateeId })
        .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('line.evaluatorType = :evaluatorType', {
          evaluatorType: EvaluatorType.SECONDARY,
        })
        .andWhere('mapping.deletedAt IS NULL')
        .andWhere('mapping.wbsItemId IS NOT NULL')
        .getRawMany();

      assignedWbsIds = assignedMappings
        .map((m) => m.mapping_wbsItemId)
        .filter((id) => id !== null);
    } else {
      // 1차 평가자의 경우: EvaluationWbsAssignment에서 피평가자에게 할당된 전체 WBS 조회
      const wbsAssignments = await this.wbsAssignmentRepository.find({
        where: {
          periodId,
          employeeId: evaluateeId,
          deletedAt: IsNull(),
        },
        select: ['wbsItemId'],
      });

      assignedWbsIds = wbsAssignments
        .map((assignment) => assignment.wbsItemId)
        .filter((id) => id !== null && id !== undefined);
    }

    if (assignedWbsIds.length === 0) {
      this.logger.debug('할당된 WBS가 없습니다.');
      return;
    }

    // 각 WBS에 대한 하향평가가 있는지 확인하고 없으면 생성
    for (const wbsId of assignedWbsIds) {
      const existingEvaluation = await this.downwardEvaluationRepository.findOne({
        where: {
          evaluatorId,
          employeeId: evaluateeId,
          periodId,
          wbsId,
          evaluationType,
          deletedAt: null as any,
        },
      });

      if (!existingEvaluation) {
        try {
          // 하향평가 생성
          // 승인 모드일 경우 승인 처리 메시지를 포함하여 생성
          const evaluationData: any = {
            employeeId: evaluateeId,
            evaluatorId,
            wbsId,
            periodId,
            evaluationType,
            evaluationDate: new Date(),
            isCompleted: false,
            createdBy,
          };

          // 승인 모드일 경우에만 승인 메시지 추가
          if (isApprovalMode) {
            evaluationData.downwardEvaluationContent = `${approverName}님에 따라 하향평가가 승인 처리되었습니다.`;
          }

          await this.downwardEvaluationService.생성한다(evaluationData);

          this.logger.debug(
            `할당된 WBS에 대한 하향평가 생성 완료 - WBS ID: ${wbsId}, 평가유형: ${evaluationType}`,
          );
        } catch (error) {
          // 중복 생성 시도 등의 에러는 무시 (이미 존재할 수 있음)
          this.logger.warn(
            `할당된 WBS에 대한 하향평가 생성 실패 - WBS ID: ${wbsId}, 평가유형: ${evaluationType}`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }

    this.logger.log(
      `할당된 WBS에 대한 하향평가 생성 완료 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가유형: ${evaluationType}`,
    );
  }

  /**
   * 2차 평가자에게 알림을 전송한다
   */
  private async 이차평가자에게_알림을전송한다(
    employeeId: string,
    periodId: string,
    submittedEvaluationIds: string[],
    primaryEvaluatorId: string, // 1차 평가자 ID 추가
  ): Promise<void> {
    try {
      // 평가기간 조회
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`,
        );
        return;
      }

      // 1차 평가자(제출자) 정보 조회
      const primaryEvaluator = await this.employeeService.findById(primaryEvaluatorId);
      if (!primaryEvaluator) {
        this.logger.warn(
          `1차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. primaryEvaluatorId=${primaryEvaluatorId}`,
        );
        return;
      }

      // 제출된 평가의 WBS ID 조회 (첫 번째 평가만 사용하여 2차 평가자 찾기)
      if (submittedEvaluationIds.length === 0) {
        this.logger.warn('제출된 평가가 없어 알림을 전송하지 않습니다.');
        return;
      }

      const firstEvaluation = await this.downwardEvaluationRepository.findOne({
        where: { id: submittedEvaluationIds[0], deletedAt: IsNull() },
      });

      if (!firstEvaluation) {
        this.logger.warn(
          `평가를 찾을 수 없어 알림을 전송하지 않습니다. evaluationId=${submittedEvaluationIds[0]}`,
        );
        return;
      }

      // 2차 평가자 조회 (UUID)
      const secondaryEvaluatorId = await this.stepApprovalContext.이차평가자를_조회한다(
        periodId,
        employeeId,
        firstEvaluation.wbsId,
      );

      if (!secondaryEvaluatorId) {
        this.logger.warn(
          `2차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}, wbsId=${firstEvaluation.wbsId}`,
        );
        return;
      }

      // 2차 평가자의 직원 번호 조회
      const secondaryEvaluator = await this.employeeService.findById(secondaryEvaluatorId);
      
      if (!secondaryEvaluator) {
        this.logger.warn(
          `2차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. secondaryEvaluatorId=${secondaryEvaluatorId}`,
        );
        return;
      }

      // 알림 전송 (employeeNumber 사용)
      await this.notificationHelper.직원에게_알림을_전송한다({
        sender: 'system',
        title: '1차 하향평가 제출 알림',
        content: `${evaluationPeriod.name} 평가기간의 ${primaryEvaluator.name} 1차 평가자가 1차 하향평가를 제출했습니다.`,
        employeeNumber: secondaryEvaluator.employeeNumber, // UUID 대신 employeeNumber 사용
        sourceSystem: 'EMS',
        linkUrl: `${this.configService.get<string>('PORTAL_URL')}/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`,
        metadata: {
          type: 'downward-evaluation-submitted',
          evaluationType: 'primary',
          priority: 'medium',
          employeeId,
          periodId,
          submittedCount: submittedEvaluationIds.length,
          primaryEvaluatorName: primaryEvaluator.name,
        },
      });

      this.logger.log(
        `2차 평가자에게 1차 하향평가 일괄 제출 알림 전송 완료: 1차 평가자=${primaryEvaluator.name}, 2차 평가자=${secondaryEvaluatorId}, 직원번호=${secondaryEvaluator.employeeNumber}, 제출된 평가 수=${submittedEvaluationIds.length}`,
      );
    } catch (error) {
      this.logger.error('2차 평가자 알림 전송 중 오류 발생', error.stack);
      throw error;
    }
  }
}


