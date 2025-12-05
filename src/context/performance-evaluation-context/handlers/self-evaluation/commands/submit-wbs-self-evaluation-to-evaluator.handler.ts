import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { NotificationHelperService } from '@domain/common/notification';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

/**
 * WBS 자기평가 제출 커맨드 (피평가자 → 1차 평가자)
 */
export class SubmitWbsSelfEvaluationToEvaluatorCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 제출 핸들러 (피평가자 → 1차 평가자)
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationToEvaluatorCommand)
export class SubmitWbsSelfEvaluationToEvaluatorHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationToEvaluatorCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
    private readonly notificationHelper: NotificationHelperService,
    private readonly stepApprovalContext: StepApprovalContextService,
    private readonly employeeService: EmployeeService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationToEvaluatorCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)', {
      evaluationId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new NotFoundException(
          `자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`,
        );
      }

      // 평가 내용과 점수 검증
      if (
        !evaluation.selfEvaluationContent ||
        !evaluation.selfEvaluationScore
      ) {
        throw new BadRequestException(
          '평가 내용과 점수는 필수 입력 항목입니다.',
        );
      }

      // 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        evaluation.periodId,
      );
      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${evaluation.periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 점수 유효성 검증
      if (!evaluation.점수가_유효한가(maxScore)) {
        throw new BadRequestException(
          `평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`,
        );
      }

      // 자기평가 제출 (피평가자 → 1차 평가자)
      await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
        evaluation,
        submittedBy,
      );

      // 저장 후 최신 상태 조회
      const updatedEvaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!updatedEvaluation) {
        throw new NotFoundException(
          `자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`,
        );
      }

      this.logger.log('WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)', {
        evaluationId,
        submittedToEvaluator: updatedEvaluation.submittedToEvaluator,
      });

      // 1차 평가자에게 알림 전송 (비동기 처리, 실패해도 제출은 성공)
      this.일차평가자에게_알림을전송한다(
        updatedEvaluation.employeeId,
        updatedEvaluation.periodId,
        evaluationPeriod.name,
      ).catch((error) => {
        this.logger.error('1차 평가자 알림 전송 실패 (무시됨)', error.stack);
      });

      return updatedEvaluation.DTO로_변환한다();
    });
  }

  /**
   * 1차 평가자에게 알림을 전송한다
   */
  private async 일차평가자에게_알림을전송한다(
    employeeId: string,
    periodId: string,
    periodName: string,
  ): Promise<void> {
    try {
      // 피평가자(제출자) 정보 조회
      const employee = await this.employeeService.findById(employeeId);
      if (!employee) {
        this.logger.warn(
          `피평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}`,
        );
        return;
      }

      // 1차 평가자 조회 (UUID)
      const evaluatorId = await this.stepApprovalContext.일차평가자를_조회한다(
        periodId,
        employeeId,
      );

      if (!evaluatorId) {
        this.logger.warn(
          `1차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}`,
        );
        return;
      }

      // 1차 평가자의 직원 번호 조회
      const evaluator = await this.employeeService.findById(evaluatorId);

      if (!evaluator) {
        this.logger.warn(
          `1차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. evaluatorId=${evaluatorId}`,
        );
        return;
      }

      // linkUrl 생성
      const linkUrl = `${this.configService.get<string>('PORTAL_URL')}/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`;
      
      this.logger.log(
        `알림 linkUrl 생성: ${linkUrl}`,
      );

      // 알림 전송 (employeeNumber 사용)
      await this.notificationHelper.직원에게_알림을_전송한다({
        sender: 'system',
        title: 'WBS 자기평가 제출 알림',
        content: `${periodName} 평가기간의 ${employee.name} 피평가자가 WBS 자기평가를 제출했습니다.`,
        employeeNumber: evaluator.employeeNumber, // UUID 대신 employeeNumber 사용
        sourceSystem: 'EMS',
        linkUrl,
        metadata: {
          type: 'self-evaluation-submitted',
          priority: 'medium',
          employeeId,
          periodId,
          employeeName: employee.name,
        },
      });

      this.logger.log(
        `1차 평가자에게 WBS 자기평가 제출 알림 전송 완료: 피평가자=${employee.name}, 평가자=${evaluatorId}, 직원번호=${evaluator.employeeNumber}`,
      );
    } catch (error) {
      this.logger.error('1차 평가자 알림 전송 중 오류 발생', error.stack);
      throw error;
    }
  }
}
