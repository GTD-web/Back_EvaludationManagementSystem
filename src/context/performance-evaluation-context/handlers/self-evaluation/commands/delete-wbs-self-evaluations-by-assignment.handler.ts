import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';

/**
 * WBS 할당에 연결된 자기평가 삭제 커맨드
 */
export class DeleteWbsSelfEvaluationsByAssignmentCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly wbsItemId: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 삭제된 자기평가 상세 정보
 */
export interface DeletedWbsSelfEvaluationDetail {
  evaluationId: string;
  wbsItemId: string;
}

/**
 * WBS 할당 연결 자기평가 삭제 응답
 */
export interface DeleteWbsSelfEvaluationsByAssignmentResponse {
  deletedCount: number;
  deletedEvaluations: DeletedWbsSelfEvaluationDetail[];
}

/**
 * WBS 할당에 연결된 자기평가 삭제 핸들러
 *
 * 특정 직원의 특정 평가기간에 특정 WBS 항목에 대한 자기평가를 삭제합니다.
 * WBS 할당 취소 시 관련 자기평가 데이터를 정리하는 용도로 사용됩니다.
 */
@Injectable()
@CommandHandler(DeleteWbsSelfEvaluationsByAssignmentCommand)
export class DeleteWbsSelfEvaluationsByAssignmentHandler
  implements
    ICommandHandler<
      DeleteWbsSelfEvaluationsByAssignmentCommand,
      DeleteWbsSelfEvaluationsByAssignmentResponse
    >
{
  private readonly logger = new Logger(
    DeleteWbsSelfEvaluationsByAssignmentHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
  ) {}

  async execute(
    command: DeleteWbsSelfEvaluationsByAssignmentCommand,
  ): Promise<DeleteWbsSelfEvaluationsByAssignmentResponse> {
    this.logger.log('WBS 할당 연결 자기평가 삭제 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      wbsItemId: command.wbsItemId,
    });

    // 1. 조건에 해당하는 자기평가 조회
    const selfEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
      employeeId: command.employeeId,
      periodId: command.periodId,
      wbsItemId: command.wbsItemId,
    });

    if (selfEvaluations.length === 0) {
      this.logger.log('삭제할 자기평가가 없습니다', {
        employeeId: command.employeeId,
        periodId: command.periodId,
        wbsItemId: command.wbsItemId,
      });

      return {
        deletedCount: 0,
        deletedEvaluations: [],
      };
    }

    // 2. 각 자기평가 삭제
    const deletedEvaluations: DeletedWbsSelfEvaluationDetail[] = [];

    for (const evaluation of selfEvaluations) {
      const evaluationDto = evaluation.DTO로_변환한다();

      await this.wbsSelfEvaluationService.삭제한다(
        evaluationDto.id,
        command.deletedBy,
      );

      deletedEvaluations.push({
        evaluationId: evaluationDto.id,
        wbsItemId: evaluationDto.wbsItemId,
      });

      this.logger.debug('자기평가 삭제 완료', {
        evaluationId: evaluationDto.id,
        wbsItemId: evaluationDto.wbsItemId,
      });
    }

    this.logger.log('WBS 할당 연결 자기평가 삭제 완료', {
      deletedCount: deletedEvaluations.length,
      wbsItemId: command.wbsItemId,
    });

    return {
      deletedCount: deletedEvaluations.length,
      deletedEvaluations,
    };
  }
}
