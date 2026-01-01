import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * 평가기간 전체 직원 가중치 재계산 커맨드
 */
export class RecalculateAllEmployeesWeightForPeriodCommand {
  constructor(public readonly periodId: string) {}
}

/**
 * 평가기간 전체 직원 가중치 재계산 핸들러
 *
 * 평가기간의 maxSelfEvaluationRate가 변경되었을 때
 * 해당 평가기간에 할당된 모든 직원의 WBS 가중치를 재계산합니다.
 */
@CommandHandler(RecalculateAllEmployeesWeightForPeriodCommand)
@Injectable()
export class RecalculateAllEmployeesWeightForPeriodHandler
  implements
    ICommandHandler<
      RecalculateAllEmployeesWeightForPeriodCommand,
      { totalEmployees: number; successCount: number; errorCount: number }
    >
{
  private readonly logger = new Logger(
    RecalculateAllEmployeesWeightForPeriodHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(
    command: RecalculateAllEmployeesWeightForPeriodCommand,
  ): Promise<{ totalEmployees: number; successCount: number; errorCount: number }> {
    const { periodId } = command;

    this.logger.log(
      `평가기간 전체 직원 가중치 재계산 시작 - 평가기간: ${periodId}`,
    );

    // 평가기간에 할당된 모든 직원 ID 조회 (DISTINCT)
    const employeeIdsResult = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select('DISTINCT assignment.employeeId', 'employeeId')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getRawMany();

    const employeeIds = employeeIdsResult.map((row) => row.employeeId);
    const totalEmployees = employeeIds.length;

    if (totalEmployees === 0) {
      this.logger.log(
        `평가기간 전체 직원 가중치 재계산 완료 - 평가기간: ${periodId}, 할당된 직원 없음`,
      );
      return {
        totalEmployees: 0,
        successCount: 0,
        errorCount: 0,
      };
    }

    this.logger.log(
      `평가기간 전체 직원 가중치 재계산 진행 - 평가기간: ${periodId}, 직원 수: ${totalEmployees}명`,
    );

    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ employeeId: string; error: string }> = [];

    // 각 직원별로 가중치 재계산
    for (const employeeId of employeeIds) {
      try {
        await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
          employeeId,
          periodId,
        );
        successCount++;
      } catch (error: any) {
        errorCount++;
        const errorMessage = error?.message || String(error);
        errorDetails.push({ employeeId, error: errorMessage });
        this.logger.warn(
          `직원 가중치 재계산 실패 - 평가기간: ${periodId}, 직원: ${employeeId}, 오류: ${errorMessage}`,
        );
      }
    }

    this.logger.log(
      `평가기간 전체 직원 가중치 재계산 완료 - 평가기간: ${periodId}, ` +
        `총 직원: ${totalEmployees}명, 성공: ${successCount}명, 실패: ${errorCount}명`,
    );

    if (errorCount > 0) {
      this.logger.warn(
        `평가기간 전체 직원 가중치 재계산 일부 실패 - 평가기간: ${periodId}, ` +
          `실패 상세: ${JSON.stringify(errorDetails)}`,
      );
    }

    return {
      totalEmployees,
      successCount,
      errorCount,
    };
  }
}

