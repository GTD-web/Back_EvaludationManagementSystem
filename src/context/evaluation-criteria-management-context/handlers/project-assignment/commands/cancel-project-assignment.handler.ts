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

      // 2. WBS 할당별로 관련 자기평가 삭제
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

        // 2-3. WBS 할당 삭제
        await this.wbsAssignmentService.삭제한다(
          wbsAssignment.id,
          cancelledBy,
          manager,
        );
        this.logger.debug(`WBS 할당 삭제: ${wbsAssignment.id}`);
      }

      // 3. 프로젝트 배정 삭제
      await this.projectAssignmentService.삭제한다(id, cancelledBy, manager);

      this.logger.log(
        `프로젝트 배정 삭제 완료: ${id} (관련 WBS 할당 ${wbsAssignments.length}개 삭제)`,
      );
    });
  }
}
