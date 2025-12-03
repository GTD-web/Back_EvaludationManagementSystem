import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
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

          // 하향평가 완료 처리
          await this.downwardEvaluationService.수정한다(
            evaluation.id,
            { isCompleted: true },
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
}


