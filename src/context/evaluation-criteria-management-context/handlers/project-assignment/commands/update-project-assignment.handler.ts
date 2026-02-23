import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationProjectAssignmentDto,
  UpdateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 수정 커맨드 (ID 기반)
 */
export class UpdateProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationProjectAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 수정 커맨드 (직원 ID + 프로젝트 ID + 평가기간 ID 기반)
 */
export class UpdateProjectAssignmentByEmployeeAndProjectCommand {
  constructor(
    public readonly employeeId: string,
    public readonly projectId: string,
    public readonly periodId: string,
    public readonly data: UpdateEvaluationProjectAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 수정 커맨드 핸들러
 */
@CommandHandler(UpdateProjectAssignmentCommand)
@Injectable()
export class UpdateProjectAssignmentHandler
  implements ICommandHandler<UpdateProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpdateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { id, data, updatedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 기존 할당 조회
      const existingAssignment = await this.projectAssignmentService.ID로_조회한다(
        id,
        manager,
      );
      if (!existingAssignment) {
        throw new NotFoundException(
          `프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 평가기간 존재 여부 및 상태 검증
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        existingAssignment.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${existingAssignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 수정 불가
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당을 수정할 수 없습니다.',
        );
      }

      // 프로젝트 할당 업데이트
      const updatedAssignment = await this.projectAssignmentService.업데이트한다(
        id,
        data,
        updatedBy,
        manager,
      );
      return updatedAssignment.DTO로_변환한다();
    });
  }
}

/**
 * 프로젝트 할당 수정 커맨드 핸들러 (직원 ID + 프로젝트 ID + 평가기간 ID 기반)
 */
@CommandHandler(UpdateProjectAssignmentByEmployeeAndProjectCommand)
@Injectable()
export class UpdateProjectAssignmentByEmployeeAndProjectHandler
  implements ICommandHandler<UpdateProjectAssignmentByEmployeeAndProjectCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpdateProjectAssignmentByEmployeeAndProjectCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { employeeId, projectId, periodId, data, updatedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 기존 할당 조회
      const existingAssignment =
        await this.projectAssignmentService.직원과_프로젝트와_평가기간으로_조회한다(
          employeeId,
          projectId,
          periodId,
          manager,
        );
      if (!existingAssignment) {
        throw new NotFoundException(
          `직원 ID ${employeeId}, 프로젝트 ID ${projectId}, 평가기간 ID ${periodId}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 평가기간 존재 여부 및 상태 검증
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 수정 불가
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당을 수정할 수 없습니다.',
        );
      }

      // 프로젝트 할당 업데이트
      const updatedAssignment = await this.projectAssignmentService.업데이트한다(
        existingAssignment.id,
        data,
        updatedBy,
        manager,
      );
      return updatedAssignment.DTO로_변환한다();
    });
  }
}
