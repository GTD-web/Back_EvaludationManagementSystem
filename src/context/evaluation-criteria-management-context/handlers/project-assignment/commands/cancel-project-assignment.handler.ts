import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';

/**
 * 프로젝트 할당 취소 커맨드
 */
export class CancelProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 프로젝트 할당 취소 커맨드 핸들러
 */
@CommandHandler(CancelProjectAssignmentCommand)
@Injectable()
export class CancelProjectAssignmentHandler
  implements ICommandHandler<CancelProjectAssignmentCommand>
{
  private readonly logger = new Logger(CancelProjectAssignmentHandler.name);

  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly projectService: ProjectService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly lineMappingService: EvaluationLineMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CancelProjectAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 할당 존재 여부 확인 (도메인 서비스 사용)
      const assignment = await this.projectAssignmentService.ID로_조회한다(
        id,
        manager,
      );
      if (!assignment) {
        throw new NotFoundException(
          `프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 프로젝트 존재 여부 확인
      const assignmentDto = assignment.DTO로_변환한다();
      const project = await this.projectService.ID로_조회한다(
        assignmentDto.projectId,
      );
      if (!project) {
        throw new NotFoundException(
          `프로젝트 ID ${assignmentDto.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
        );
      }

      // 평가기간 존재 여부 및 상태 검증 (Context 레벨)
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        assignment.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 취소 불가
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당을 취소할 수 없습니다.',
        );
      }

      // 1. 해당 프로젝트와 직원의 WBS 할당 조회
      const wbsAssignments = await this.wbsAssignmentService.필터_조회한다(
        {
          periodId: assignment.periodId,
          employeeId: assignment.employeeId,
          projectId: assignmentDto.projectId,
        },
        manager,
      );

      this.logger.log(
        `프로젝트 배정 삭제 전 관련 데이터 정리: WBS 할당 ${wbsAssignments.length}개`,
        {
          projectAssignmentId: id,
          projectId: assignmentDto.projectId,
          employeeId: assignment.employeeId,
          periodId: assignment.periodId,
        },
      );

      // 2. WBS 할당별로 관련 데이터 삭제
      for (const wbsAssignment of wbsAssignments) {
        // 2-1. 해당 WBS 항목의 자기평가 조회
        const selfEvaluations =
          await this.wbsSelfEvaluationService.필터_조회한다(
            {
              employeeId: assignment.employeeId,
              periodId: assignment.periodId,
              wbsItemId: wbsAssignment.wbsItemId,
            },
            manager,
          );

        // 2-2. 자기평가 삭제
        for (const evaluation of selfEvaluations) {
          await this.wbsSelfEvaluationService.삭제한다(
            evaluation.id,
            cancelledBy,
            manager,
          );
          this.logger.debug(
            `자기평가 삭제: ${evaluation.id} (WBS: ${wbsAssignment.wbsItemId})`,
          );
        }

        // 2-3. 해당 WBS 항목의 하향평가 조회 및 삭제
        const downwardEvaluations =
          await this.downwardEvaluationService.필터_조회한다({
            periodId: assignment.periodId,
            employeeId: assignment.employeeId,
            wbsId: wbsAssignment.wbsItemId,
          });

        for (const evaluation of downwardEvaluations) {
          await this.downwardEvaluationService.삭제한다(
            evaluation.id,
            cancelledBy,
          );
          this.logger.debug(
            `하향평가 삭제: ${evaluation.id} (WBS: ${wbsAssignment.wbsItemId}, 평가자: ${evaluation.evaluatorId})`,
          );
        }

        // 2-4. 해당 WBS 항목의 평가라인 매핑 삭제
        await this.lineMappingService.WBS항목_맵핑_전체삭제한다(
          wbsAssignment.wbsItemId,
          cancelledBy,
          manager,
        );
        this.logger.debug(
          `평가라인 매핑 삭제: WBS ${wbsAssignment.wbsItemId}의 모든 매핑`,
        );

        // 2-5. WBS 할당 삭제
        await this.wbsAssignmentService.삭제한다(
          wbsAssignment.id,
          cancelledBy,
          manager,
        );
        this.logger.debug(`WBS 할당 삭제: ${wbsAssignment.id}`);
      }

      // 2-6. 모든 WBS가 삭제되었는지 확인 후, 직원-평가자 레벨의 평가라인 매핑도 삭제
      // (wbsItemId = NULL인 1차 평가자 매핑 등)
      const remainingWbsList = await this.wbsAssignmentService.필터_조회한다(
        {
          periodId: assignment.periodId,
          employeeId: assignment.employeeId,
        },
        manager,
      );

      if (remainingWbsList.length === 0) {
        // 해당 직원의 모든 WBS가 삭제되었으므로, 평가라인 매핑도 모두 삭제
        const employeeLineMappings =
          await this.lineMappingService.필터_조회한다(
            {
              evaluationPeriodId: assignment.periodId,
              employeeId: assignment.employeeId,
            },
            manager,
          );

        for (const lineMapping of employeeLineMappings) {
          await this.lineMappingService.삭제한다(
            lineMapping.id,
            cancelledBy,
            manager,
          );
          this.logger.debug(
            `직원 평가라인 매핑 삭제: ${lineMapping.id} (평가자: ${lineMapping.evaluatorId})`,
          );
        }

        this.logger.log(
          `직원의 모든 WBS가 삭제되어 평가라인 매핑 전체 삭제 - 직원: ${assignment.employeeId}, 매핑 수: ${employeeLineMappings.length}`,
        );
      }

      // 3. 프로젝트 배정 삭제
      await this.projectAssignmentService.삭제한다(id, cancelledBy, manager);

      this.logger.log(
        `프로젝트 배정 삭제 완료: ${id} (관련 WBS 할당 ${wbsAssignments.length}개 삭제)`,
      );
    });
  }
}
