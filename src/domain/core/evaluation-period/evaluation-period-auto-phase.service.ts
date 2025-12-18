import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EvaluationPeriod } from './evaluation-period.entity';

// dayjs 플러그인 설정 (TypeScript 타입 인식을 위해 각 파일에서 extend 필요)
dayjs.extend(utc);
dayjs.extend(timezone);
import { EvaluationPeriodService } from './evaluation-period.service';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from './evaluation-period.types';

/**
 * 평가기간 자동 단계 변경 서비스
 *
 * 평가기간의 단계별 마감일을 기반으로 자동으로 단계를 변경합니다.
 */
@Injectable()
export class EvaluationPeriodAutoPhaseService {
  private readonly logger = new Logger(EvaluationPeriodAutoPhaseService.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  /**
   * 한국 시간대 기준 현재 시간을 반환합니다.
   * (main.ts에서 dayjs.tz.setDefault('Asia/Seoul')로 설정됨)
   * @returns 한국 시간대 기준 현재 시간 (Date 객체)
   */
  private get koreaTime(): Date {
    return dayjs.tz().toDate();
  }

  /**
   * Date 객체를 한국 시간대의 dayjs 객체로 변환합니다.
   * (main.ts에서 dayjs.tz.setDefault('Asia/Seoul')로 설정됨)
   * @param date 변환할 Date 객체
   * @returns 한국 시간대의 dayjs 객체
   */
  private toKoreaDayjs(date: Date): dayjs.Dayjs {
    return dayjs.tz(date);
  }

  /**
   * 매 시간마다 실행되는 자동 단계 변경 스케줄러
   */
  // @Cron(CronExpression.EVERY_HOUR)
  async autoPhaseTransition(): Promise<number> {
    this.logger.log('평가기간 자동 단계 변경을 시작합니다...');

    try {
      const now = this.koreaTime;

      // 진행 중인 평가기간과 대기 중인 평가기간을 조회
      const activePeriods = await this.evaluationPeriodRepository.find({
        where: {
          status: In([
            EvaluationPeriodStatus.IN_PROGRESS,
            EvaluationPeriodStatus.WAITING,
          ]),
        },
      });

      this.logger.log(
        `조회된 평가기간 수: ${activePeriods.length}개 (진행 중 + 대기 중)`,
      );

      let transitionedCount = 0;
      for (const period of activePeriods) {
        // 1. WAITING 상태인 경우 시작일 확인 및 상태 변경
        if (period.status === EvaluationPeriodStatus.WAITING) {
          const wasStarted = await this.checkAndStartPeriod(period, now);
          if (wasStarted) {
            transitionedCount++;
            // 상태가 변경되었으므로 업데이트된 평가기간 정보 다시 조회
            const updatedPeriod = await this.evaluationPeriodRepository.findOne(
              {
                where: { id: period.id },
              },
            );
            if (updatedPeriod) {
              // 상태 변경 후 단계 전이 확인
              const wasTransitioned = await this.checkAndTransitionPhase(
                updatedPeriod,
                now,
              );
              if (wasTransitioned) {
                transitionedCount++;
              }
            }
            continue;
          }
        }

        // 2. IN_PROGRESS 상태인 경우 단계 전이 확인
        if (period.status === EvaluationPeriodStatus.IN_PROGRESS) {
          const wasTransitioned = await this.checkAndTransitionPhase(
            period,
            now,
          );
          if (wasTransitioned) {
            transitionedCount++;
          }
        }
      }

      this.logger.log(
        `평가기간 자동 단계 변경이 완료되었습니다. 전이된 평가기간 수: ${transitionedCount}개`,
      );
      return transitionedCount;
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 중 오류 발생:', error);
      return 0;
    }
  }

  /**
   * WAITING 상태인 평가기간의 시작일을 확인하고 IN_PROGRESS로 변경합니다.
   *
   * @param period 평가기간 엔티티
   * @param now 현재 시간
   * @returns 상태 변경 여부
   */
  private async checkAndStartPeriod(
    period: EvaluationPeriod,
    now: Date,
  ): Promise<boolean> {
    if (!period.startDate) {
      this.logger.debug(
        `평가기간 ${period.id}의 시작일이 설정되지 않았습니다.`,
      );
      return false;
    }

    // 한국 시간대 기준으로 시작일 비교
    const koreaNow = this.toKoreaDayjs(now);
    const koreaStartDate = this.toKoreaDayjs(period.startDate);
    const shouldStart =
      koreaNow.isAfter(koreaStartDate) || koreaNow.isSame(koreaStartDate);

    if (shouldStart) {
      try {
        this.logger.log(
          `평가기간 ${period.id} 시작일 도달로 인한 상태 변경: WAITING → IN_PROGRESS (시작일: ${koreaStartDate.format('YYYY-MM-DD HH:mm:ss KST')}, 현재: ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')})`,
        );

        await this.evaluationPeriodService.시작한다(
          period.id,
          'SYSTEM_AUTO_START', // 시스템 자동 시작
        );

        // 현재 단계가 없으면 EVALUATION_SETUP으로 설정
        const updatedPeriod = await this.evaluationPeriodRepository.findOne({
          where: { id: period.id },
        });

        if (updatedPeriod && !updatedPeriod.currentPhase) {
          this.logger.log(
            `평가기간 ${period.id} 단계가 설정되지 않아 EVALUATION_SETUP으로 설정합니다.`,
          );
          await this.evaluationPeriodService.단계_변경한다(
            period.id,
            EvaluationPeriodPhase.EVALUATION_SETUP,
            'SYSTEM_AUTO_START',
          );
        }

        this.logger.log(
          `평가기간 ${period.id} 상태 변경 완료: WAITING → IN_PROGRESS`,
        );
        return true;
      } catch (error) {
        this.logger.error(
          `평가기간 ${period.id} 상태 변경 실패: ${error.message}`,
          error.stack,
        );
        return false;
      }
    }

    return false;
  }

  /**
   * 특정 평가기간의 단계 전이를 확인하고 실행합니다.
   * 중간 마감일이 없는 경우 해당 단계를 건너뛰고 계속 전이합니다.
   *
   * @param period 평가기간 엔티티
   * @param now 현재 시간
   */
  private async checkAndTransitionPhase(
    period: EvaluationPeriod,
    now: Date,
  ): Promise<boolean> {
    let currentPhase = period.currentPhase;
    let transitioned = false;

    if (!currentPhase) {
      this.logger.warn(
        `평가기간 ${period.id}의 현재 단계가 설정되지 않았습니다.`,
      );
      return false;
    }

    // 중간 마감일이 없으면 계속 전이하므로 최대 5번 반복 (무한 루프 방지)
    let maxIterations = 5;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // 다음 단계로 전이해야 하는지 확인
      const nextPhase = this.getNextPhase(currentPhase);
      if (!nextPhase) {
        // 더 이상 전이할 단계가 없음 (CLOSURE 도달)
        break;
      }

      // 다음 단계의 마감일이 지났는지 확인
      const shouldTransition = this.shouldTransitionToNextPhase(
        period,
        currentPhase,
        nextPhase,
        now,
      );

      if (shouldTransition) {
        try {
          this.logger.log(
            `평가기간 ${period.id} 단계 변경: ${currentPhase} → ${nextPhase}`,
          );

          await this.evaluationPeriodService.단계_변경한다(
            period.id,
            nextPhase,
            'SYSTEM_AUTO_PHASE', // 시스템 자동 변경
          );

          this.logger.log(
            `평가기간 ${period.id} 단계 변경 완료: ${currentPhase} → ${nextPhase}`,
          );

          transitioned = true;
          currentPhase = nextPhase;

          // 현재 평가기간 정보를 다시 로드하여 최신 상태 반영
          const updatedPeriod = await this.evaluationPeriodRepository.findOne({
            where: { id: period.id },
          });
          if (updatedPeriod) {
            Object.assign(period, updatedPeriod);
          }
        } catch (error) {
          this.logger.error(
            `평가기간 ${period.id} 단계 변경 실패: ${error.message}`,
            error.stack,
          );
          break; // 에러 발생 시 중단
        }
      } else {
        // 전이 조건이 충족되지 않음 (마감일이 아직 지나지 않음)
        break;
      }
    }

    return transitioned;
  }

  /**
   * 현재 단계에서 다음 단계를 반환합니다.
   *
   * @param currentPhase 현재 단계
   * @returns 다음 단계 또는 null (더 이상 전이할 단계가 없는 경우)
   */
  private getNextPhase(
    currentPhase: EvaluationPeriodPhase,
  ): EvaluationPeriodPhase | null {
    const phaseSequence: Record<
      EvaluationPeriodPhase,
      EvaluationPeriodPhase | null
    > = {
      [EvaluationPeriodPhase.WAITING]: EvaluationPeriodPhase.EVALUATION_SETUP,
      [EvaluationPeriodPhase.EVALUATION_SETUP]:
        EvaluationPeriodPhase.PERFORMANCE,
      [EvaluationPeriodPhase.PERFORMANCE]:
        EvaluationPeriodPhase.SELF_EVALUATION,
      [EvaluationPeriodPhase.SELF_EVALUATION]:
        EvaluationPeriodPhase.PEER_EVALUATION,
      [EvaluationPeriodPhase.PEER_EVALUATION]: EvaluationPeriodPhase.CLOSURE,
      [EvaluationPeriodPhase.CLOSURE]: null, // 종결 단계는 더 이상 전이하지 않음
    };

    return phaseSequence[currentPhase] || null;
  }

  /**
   * 다음 단계로 전이해야 하는지 확인합니다.
   * 중간 마감일이 없으면 즉시 전이하고, peerEvaluationDeadline이 지나면 CLOSURE까지 전이합니다.
   *
   * @param period 평가기간 엔티티
   * @param currentPhase 현재 단계
   * @param nextPhase 다음 단계
   * @param now 현재 시간
   * @returns 전이 여부
   */
  private shouldTransitionToNextPhase(
    period: EvaluationPeriod,
    currentPhase: EvaluationPeriodPhase,
    nextPhase: EvaluationPeriodPhase,
    now: Date,
  ): boolean {
    // 현재 단계의 마감일을 확인 (현재 단계가 끝나야 다음 단계로 전이)
    const currentPhaseDeadline = this.getPhaseDeadline(period, currentPhase);

    if (!currentPhaseDeadline) {
      // 마감일이 설정되지 않은 경우, 즉시 다음 단계로 전이
      this.logger.debug(
        `평가기간 ${period.id}의 ${currentPhase} 단계 마감일이 설정되지 않았습니다. 다음 단계로 즉시 전이합니다.`,
      );
      return true;
    }

    // 한국 시간대 기준으로 비교 (한국 시간 00시가 넘으면 마감일이 지난 것으로 판단)
    const koreaNow = this.toKoreaDayjs(now);
    const koreaDeadline = this.toKoreaDayjs(currentPhaseDeadline);
    this.logger.log('koreaNow', koreaNow.format('YYYY-MM-DD HH:mm:ss KST'));
    this.logger.log(
      'koreaDeadline',
      koreaDeadline.format('YYYY-MM-DD HH:mm:ss KST'),
    );
    const shouldTransition =
      koreaNow.isAfter(koreaDeadline) || koreaNow.isSame(koreaDeadline);

    if (shouldTransition) {
      this.logger.debug(
        `평가기간 ${period.id}: ${currentPhase} 단계 마감일 도달 (마감일: ${koreaDeadline.format('YYYY-MM-DD HH:mm:ss KST')}, 현재: ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')})`,
      );
    }

    return shouldTransition;
  }

  /**
   * 특정 단계의 마감일을 반환합니다.
   *
   * @param period 평가기간 엔티티
   * @param phase 단계
   * @returns 마감일 또는 null
   */
  private getPhaseDeadline(
    period: EvaluationPeriod,
    phase: EvaluationPeriodPhase,
  ): Date | null {
    switch (phase) {
      case EvaluationPeriodPhase.EVALUATION_SETUP:
        return period.evaluationSetupDeadline || null;
      case EvaluationPeriodPhase.PERFORMANCE:
        return period.performanceDeadline || null;
      case EvaluationPeriodPhase.SELF_EVALUATION:
        return period.selfEvaluationDeadline || null;
      case EvaluationPeriodPhase.PEER_EVALUATION:
        return period.peerEvaluationDeadline || null;
      case EvaluationPeriodPhase.CLOSURE:
        return period.peerEvaluationDeadline || null; // 종결은 동료평가 마감일과 동일
      default:
        return null;
    }
  }

  /**
   * 수동으로 단계 전이를 실행합니다.
   *
   * @param periodId 평가기간 ID
   * @returns 전이된 평가기간 정보
   */
  async manualPhaseTransition(
    periodId: string,
  ): Promise<EvaluationPeriod | null> {
    this.logger.log(`평가기간 ${periodId} 수동 단계 전이를 시작합니다...`);

    try {
      const period = await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });

      if (!period) {
        this.logger.warn(`평가기간 ${periodId}를 찾을 수 없습니다.`);
        return null;
      }

      if (period.status !== EvaluationPeriodStatus.IN_PROGRESS) {
        this.logger.warn(
          `평가기간 ${periodId}가 진행 중 상태가 아닙니다. (현재 상태: ${period.status})`,
        );
        return null;
      }

      await this.checkAndTransitionPhase(period, this.koreaTime);

      // 업데이트된 평가기간 정보 반환
      return await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });
    } catch (error) {
      this.logger.error(`평가기간 ${periodId} 수동 단계 전이 실패:`, error);
      throw error;
    }
  }

  /**
   * 모든 진행 중인 평가기간의 단계 전이를 확인합니다.
   *
   * @returns 전이된 평가기간 수
   */
  async checkAllActivePeriods(): Promise<number> {
    this.logger.log('모든 진행 중인 평가기간의 단계 전이를 확인합니다...');

    const now = this.koreaTime;
    const activePeriods = await this.evaluationPeriodRepository.find({
      where: {
        status: EvaluationPeriodStatus.IN_PROGRESS,
      },
    });

    let transitionedCount = 0;

    for (const period of activePeriods) {
      const beforePhase = period.currentPhase;
      await this.checkAndTransitionPhase(period, now);

      // 실제로 전이되었는지 확인
      const updatedPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: period.id },
      });

      if (updatedPeriod && updatedPeriod.currentPhase !== beforePhase) {
        transitionedCount++;
      }
    }

    this.logger.log(
      `총 ${transitionedCount}개의 평가기간이 단계 전이되었습니다.`,
    );
    return transitionedCount;
  }

  /**
   * 일정 수정 후 상태와 단계를 자동으로 조정합니다.
   *
   * - 시작일이 현재 시간보다 이전이고 상태가 WAITING이면 IN_PROGRESS로 변경
   * - 현재 단계에 맞게 마감일을 확인하고 필요시 다음 단계로 전이
   *
   * @param periodId 평가기간 ID
   * @param changedBy 변경자 ID
   * @returns 조정된 평가기간 정보
   */
  async adjustStatusAndPhaseAfterScheduleUpdate(
    periodId: string,
    changedBy: string,
  ): Promise<EvaluationPeriod | null> {
    this.logger.log(
      `평가기간 ${periodId} 일정 수정 후 상태/단계 자동 조정을 시작합니다...`,
    );

    try {
      const period = await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });

      if (!period) {
        this.logger.warn(`평가기간 ${periodId}를 찾을 수 없습니다.`);
        return null;
      }

      const now = this.koreaTime;
      let statusChanged = false;

      // 1. 상태 자동 조정: 시작일이 지났고 상태가 WAITING이면 IN_PROGRESS로 변경
      if (
        period.status === EvaluationPeriodStatus.WAITING &&
        period.startDate &&
        now >= period.startDate
      ) {
        this.logger.log(
          `평가기간 ${periodId} 시작일 도달로 인한 상태 변경: WAITING → IN_PROGRESS`,
        );
        await this.evaluationPeriodService.시작한다(periodId, changedBy);
        statusChanged = true;
      }

      // 2. 업데이트된 평가기간 정보 다시 조회
      const updatedPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: periodId },
      });

      if (!updatedPeriod) {
        return null;
      }

      // 3. 상태가 IN_PROGRESS인 경우 단계 자동 전이 확인 (여러 단계 전이 가능)
      if (updatedPeriod.status === EvaluationPeriodStatus.IN_PROGRESS) {
        // 현재 단계가 없으면 EVALUATION_SETUP으로 설정
        if (!updatedPeriod.currentPhase) {
          this.logger.log(
            `평가기간 ${periodId} 단계가 설정되지 않아 EVALUATION_SETUP으로 설정합니다.`,
          );
          await this.evaluationPeriodService.단계_변경한다(
            periodId,
            EvaluationPeriodPhase.EVALUATION_SETUP,
            changedBy,
          );
        }

        // 여러 단계를 한 번에 전이할 수 있도록 반복적으로 확인
        let maxIterations = 10; // 무한 루프 방지
        let hasTransitioned = true;

        while (hasTransitioned && maxIterations > 0) {
          const currentPeriod = await this.evaluationPeriodRepository.findOne({
            where: { id: periodId },
          });

          if (!currentPeriod || !currentPeriod.currentPhase) {
            break;
          }

          hasTransitioned = await this.checkAndTransitionPhase(
            currentPeriod,
            now,
          );
          maxIterations--;
        }

        // 최종 업데이트된 정보 반환
        return await this.evaluationPeriodRepository.findOne({
          where: { id: periodId },
        });
      }

      return updatedPeriod;
    } catch (error) {
      this.logger.error(
        `평가기간 ${periodId} 일정 수정 후 상태/단계 자동 조정 실패:`,
        error,
      );
      throw error;
    }
  }
}
