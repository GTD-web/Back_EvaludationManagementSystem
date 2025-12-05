import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationAlreadyCompletedException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { NotificationHelperService } from '@domain/common/notification';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

/**
 * ?�향?��? ?�출 커맨??
 */
export class SubmitDownwardEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * ?�향?��? ?�출 ?�들??
 */
@Injectable()
@CommandHandler(SubmitDownwardEvaluationCommand)
export class SubmitDownwardEvaluationHandler
  implements ICommandHandler<SubmitDownwardEvaluationCommand>
{
  private readonly logger = new Logger(SubmitDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
    private readonly notificationHelper: NotificationHelperService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly stepApprovalContext: StepApprovalContextService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(command: SubmitDownwardEvaluationCommand): Promise<void> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('하향평가 제출 핸들러 실행', { evaluationId });

    await this.transactionManager.executeTransaction(async () => {
      // 하향평가 조회 검증
      const evaluation =
        await this.downwardEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new DownwardEvaluationNotFoundException(evaluationId);
      }

      // 이미 완료된 평가인지 확인
      if (evaluation.완료되었는가()) {
        throw new DownwardEvaluationAlreadyCompletedException(evaluationId);
      }

      // 하향평가 완료 처리
      await this.downwardEvaluationService.수정한다(
        evaluationId,
        { isCompleted: true },
        submittedBy,
      );

      // 단계 승인 상태를 pending으로 변경
      this.logger.debug(
        `단계 승인 상태를 pending으로 변경 시작 - 피평가자: ${evaluation.employeeId}, 평가기간: ${evaluation.periodId}, 평가유형: ${evaluation.evaluationType}`,
      );

      const mapping = await this.mappingRepository.findOne({
        where: {
          evaluationPeriodId: evaluation.periodId,
          employeeId: evaluation.employeeId,
          deletedAt: null as any,
        },
      });

      if (mapping) {
        let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
          mapping.id,
        );

        // 단계 승인이 없으면 생성
        if (!stepApproval) {
          this.logger.log(
            `단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`,
          );
          stepApproval = await this.stepApprovalService.생성한다({
            evaluationPeriodEmployeeMappingId: mapping.id,
            createdBy: submittedBy,
          });
        }

        // 평가 유형에 따라 적절한 단계의 상태를 pending으로 변경
        if (evaluation.evaluationType === 'primary') {
          this.stepApprovalService.단계_상태를_변경한다(
            stepApproval,
            'primary',
            StepApprovalStatus.PENDING,
            submittedBy,
          );
        } else if (evaluation.evaluationType === 'secondary') {
          this.stepApprovalService.단계_상태를_변경한다(
            stepApproval,
            'secondary',
            StepApprovalStatus.PENDING,
            submittedBy,
          );
        }

        await this.stepApprovalService.저장한다(stepApproval);

        this.logger.debug(
          `단계 승인 상태를 pending으로 변경 완료 - 피평가자: ${evaluation.employeeId}, 평가유형: ${evaluation.evaluationType}`,
        );
      }

      // 1차 하향평가인 경우 2차 평가자에게 알림 전송
      if (evaluation.evaluationType === 'primary') {
        // 2차 평가자에게 알림 전송 (비동기 처리, 실패해도 제출은 성공)
        this.이차평가자에게_알림을전송한다(
          evaluation.employeeId,
          evaluation.periodId,
          evaluation.wbsId,
          evaluation.evaluatorId, // 1차 평가자 ID 추가
        ).catch((error) => {
          this.logger.error('2차 평가자 알림 전송 실패 (무시됨)', error.stack);
        });
      }

      this.logger.log('하향평가 제출 완료', { evaluationId });
    });
  }

  /**
   * 2차 평가자에게 알림을 전송한다
   */
  private async 이차평가자에게_알림을전송한다(
    employeeId: string,
    periodId: string,
    wbsId: string,
    primaryEvaluatorId: string, // 1차 평가자 ID 추가
  ): Promise<void> {
    try {
      // 평가기간 조회
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);
      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`,
        );
        return;
      }

      // 1차 평가자(제출자) 정보 조회
      const primaryEvaluator =
        await this.employeeService.findById(primaryEvaluatorId);
      if (!primaryEvaluator) {
        this.logger.warn(
          `1차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. primaryEvaluatorId=${primaryEvaluatorId}`,
        );
        return;
      }

      // 2차 평가자 조회 (UUID)
      const secondaryEvaluatorId =
        await this.stepApprovalContext.이차평가자를_조회한다(
          periodId,
          employeeId,
          wbsId,
        );

      if (!secondaryEvaluatorId) {
        this.logger.warn(
          `2차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}, wbsId=${wbsId}`,
        );
        return;
      }

      // 2차 평가자의 직원 번호 조회
      const secondaryEvaluator =
        await this.employeeService.findById(secondaryEvaluatorId);

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
        linkUrl: `/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`,
        metadata: {
          type: 'downward-evaluation-submitted',
          evaluationType: 'primary',
          priority: 'medium',
          employeeId,
          periodId,
          wbsId,
          primaryEvaluatorName: primaryEvaluator.name,
        },
      });

      this.logger.log(
        `2차 평가자에게 1차 하향평가 제출 알림 전송 완료: 1차 평가자=${primaryEvaluator.name}, 2차 평가자=${secondaryEvaluatorId}, 직원번호=${secondaryEvaluator.employeeNumber}`,
      );
    } catch (error) {
      this.logger.error('2차 평가자 알림 전송 중 오류 발생', error.stack);
      throw error;
    }
  }
}
