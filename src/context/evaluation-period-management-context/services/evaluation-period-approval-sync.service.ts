import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { ApprovalStatus } from '@domain/core/evaluation-period/evaluation-period.types';
import { ApprovalSystemService } from '@domain/common/approval-system';

/**
 * 평가기간 결재 상태 동기화 서비스
 *
 * LIAS 결재관리시스템과 주기적으로 통신하여 평가기간의 결재 상태를 동기화합니다.
 * 이 서비스는 컨텍스트 레이어에서 도메인 로직과 외부 시스템 연동을 조율합니다.
 */
@Injectable()
export class EvaluationPeriodApprovalSyncService {
  private readonly logger = new Logger(
    EvaluationPeriodApprovalSyncService.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    private readonly approvalSystemService: ApprovalSystemService,
  ) {}

  /**
   * 1분마다 결재 상태를 동기화합니다.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async 결재상태_동기화한다(): Promise<void> {
    try {
      // 결재 대기 중(pending)인 평가기간만 조회
      const pendingPeriods = await this.evaluationPeriodRepository.find({
        where: {
          approvalStatus: ApprovalStatus.PENDING,
          deletedAt: IsNull(),
        },
      });

      if (pendingPeriods.length === 0) {
        this.logger.debug('결재 대기 중인 평가기간이 없습니다.');
        return;
      }

      this.logger.log(
        `결재 대기 중인 평가기간 ${pendingPeriods.length}개 발견, 동기화를 시작합니다.`,
      );

      for (const period of pendingPeriods) {
        try {
          await this.평가기간_결재상태_확인한다(period);
        } catch (error) {
          this.logger.error(
            `평가기간 ${period.id} (${period.name}) 결재 상태 확인 실패: ${error.message}`,
            error.stack,
          );
          // 개별 평가기간의 동기화 실패가 전체를 멈추지 않도록 continue
          continue;
        }
      }

      this.logger.log('결재 상태 동기화 완료');
    } catch (error) {
      this.logger.error(
        `결재 상태 동기화 중 오류 발생: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 개별 평가기간의 결재 상태를 LIAS 서버에서 확인하고 업데이트합니다.
   */
  private async 평가기간_결재상태_확인한다(
    period: EvaluationPeriod,
  ): Promise<void> {
    if (!period.approvalDocumentId) {
      this.logger.warn(
        `평가기간 ${period.id} (${period.name})에 결재문서ID가 없습니다. 스킵합니다.`,
      );
      return;
    }

    try {
      // LIAS 서버에 결재 상태 조회
      const documentData =
        await this.approvalSystemService.결재문서_상태를_조회한다(
          period.approvalDocumentId,
        );

      const documentStatus = documentData.status;

      this.logger.log(
        `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - LIAS 결재 상태: ${documentStatus}`,
      );

      // documentStatus를 approvalStatus로 매핑
      const newApprovalStatus =
        this.LIAS상태를_ApprovalStatus로_변환한다(documentStatus);

      // 상태가 변경되었을 경우에만 업데이트
      if (period.approvalStatus !== newApprovalStatus) {
        this.logger.log(
          `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - 결재 상태 변경: ${period.approvalStatus} → ${newApprovalStatus}`,
        );

        period.결재상태_변경한다(newApprovalStatus, 'system'); // system이 변경 주체

        // 결재가 승인되면 평가기간도 완료 처리
        if (newApprovalStatus === ApprovalStatus.APPROVED) {
          try {
            period.평가기간_완료한다('system');
            this.logger.log(
              `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - 결재 승인으로 인해 평가기간 완료 처리됨`,
            );
          } catch (error) {
            // 이미 완료된 경우 등의 에러는 무시
            this.logger.debug(
              `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - 평가기간 완료 처리 실패 (이미 완료됨): ${error.message}`,
            );
          }
        }

        await this.evaluationPeriodRepository.save(period);

        this.logger.log(
          `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - 결재 상태 업데이트 완료`,
        );
      } else {
        this.logger.debug(
          `평가기간 ${period.id.substring(0, 8)}... (${period.name}) - 결재 상태 변경 없음 (${period.approvalStatus})`,
        );
      }
    } catch (error) {
      // 에러는 상위로 전파
      throw error;
    }
  }

  /**
   * LIAS 서버의 documentStatus를 ApprovalStatus로 변환합니다.
   */
  private LIAS상태를_ApprovalStatus로_변환한다(
    documentStatus: string,
  ): ApprovalStatus {
    switch (documentStatus) {
      case 'DRAFT':
        return ApprovalStatus.NONE;
      case 'PENDING':
        return ApprovalStatus.PENDING;
      case 'APPROVED':
        return ApprovalStatus.APPROVED;
      case 'REJECTED':
        return ApprovalStatus.REJECTED;
      case 'CANCELLED':
        return ApprovalStatus.CANCELLED;
      case 'IMPLEMENTED':
        return ApprovalStatus.IMPLEMENTED;
      default:
        this.logger.warn(
          `알 수 없는 LIAS documentStatus: ${documentStatus}. NONE으로 처리합니다.`,
        );
        return ApprovalStatus.NONE;
    }
  }
}
