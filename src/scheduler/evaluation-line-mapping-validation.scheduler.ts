import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { EvaluationLineMappingBatchValidationService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping-batch-validation.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가라인 매핑 배치 검증 스케줄러
 * 
 * 매 1분마다 활성 평가기간의 평가라인 매핑을 검증하고
 * 무효한 매핑을 자동으로 정리합니다.
 */
@Injectable()
export class EvaluationLineMappingValidationScheduler {
  private readonly logger = new Logger(
    EvaluationLineMappingValidationScheduler.name,
  );
  private readonly isEnabled: boolean;

  constructor(
    private readonly batchValidationService: EvaluationLineMappingBatchValidationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled =
      this.configService.get<string>(
        'ENABLE_EVALUATION_LINE_VALIDATION_SCHEDULER',
      ) !== 'false';
  }

  @Cron('0 * * * * *', {
    name: 'validate-evaluation-line-mappings',
    timeZone: 'Asia/Seoul',
  })
  async validateAndCleanMappings() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('=== 평가라인 매핑 배치 검증 시작 ===');

    try {
      const activePeriods = await this.evaluationPeriodService.필터_조회한다({
        status: EvaluationPeriodStatus.IN_PROGRESS,
      });

      if (activePeriods.length === 0) {
        this.logger.log('활성 평가기간이 없습니다. 배치 검증을 건너뜁니다.');
        return;
      }

      this.logger.log(
        `활성 평가기간 ${activePeriods.length}개에 대해 검증을 시작합니다.`,
      );

      let totalChecked = 0;
      let totalInvalid = 0;
      let totalCleaned = 0;

      for (const period of activePeriods) {
        const periodDto = period.DTO로_변환한다();
        try {
          this.logger.log(
            `평가기간 검증 시작: ${periodDto.name} (ID: ${periodDto.id})`,
          );

          const result =
            await this.batchValidationService.평가라인_매핑을_검증하고_정리한다(
              periodDto.id,
              true,
              'system',
            );

          totalChecked += result.totalChecked;
          totalInvalid += result.invalidCount;
          totalCleaned += result.cleanedCount;

          if (result.invalidCount > 0) {
            this.logger.warn(
              `평가기간 "${periodDto.name}": ${result.totalChecked}개 중 ${result.invalidCount}개 무효 발견, ${result.cleanedCount}개 정리 완료`,
              {
                periodId: periodDto.id,
                periodName: periodDto.name,
                summary: result.summary,
              },
            );
          } else {
            this.logger.log(
              `평가기간 "${periodDto.name}": 모든 매핑이 정상입니다. (${result.totalChecked}개 검증)`,
            );
          }
        } catch (error) {
          this.logger.error(
            `평가기간 "${periodDto.name}" 검증 중 오류 발생: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `=== 평가라인 매핑 배치 검증 완료 ===\n` +
          `  - 검증한 평가기간: ${activePeriods.length}개\n` +
          `  - 검증한 매핑: ${totalChecked}개\n` +
          `  - 무효 매핑: ${totalInvalid}개\n` +
          `  - 정리 완료: ${totalCleaned}개`,
      );
    } catch (error) {
      this.logger.error(
        '평가라인 매핑 배치 검증 중 치명적 오류 발생',
        error.stack,
      );
    }
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.logger.log(
        '✅ 평가라인 매핑 검증 스케줄러가 활성화되었습니다. (매 1분마다 실행)',
      );
    } else {
      this.logger.warn(
        '⚠️  평가라인 매핑 검증 스케줄러가 비활성화되어 있습니다.',
      );
    }
  }
}

