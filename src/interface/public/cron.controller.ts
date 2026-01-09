import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import { Public } from '@interface/common/decorators/public.decorator';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';

/**
 * 크론 작업 컨트롤러
 *
 * 크론 작업을 수동으로 실행하기 위한 HTTP 엔드포인트를 제공합니다.
 * 모든 엔드포인트는 Public으로 설정되어 있습니다.
 * 
 * 주의: 일반적으로는 @Cron 데코레이터로 자동 실행되지만,
 * 수동 실행이나 테스트 목적으로 이 엔드포인트를 사용할 수 있습니다.
 */
@ApiTags('Public - 크론 작업')
@Controller('cron')
@Public()
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly employeeSyncService: EmployeeSyncService,
    private readonly departmentSyncService: DepartmentSyncService,
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
   * 평가기간 자동 단계 변경 크론 작업
   * 일반적으로는 @Cron 데코레이터로 매 시간 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('evaluation-period-auto-phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가기간 자동 단계 변경 크론 작업',
    description: '매 시간마다 실행되어 평가기간의 단계를 자동으로 전이합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '평가기간 자동 단계 변경 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerEvaluationPeriodAutoPhase() {
    try {
      // 현재 한국 시간대 기준 시간 로그 출력
      const now = this.koreaTime;
      const koreaNow = this.toKoreaDayjs(now);
      this.logger.log(
        `[평가기간 자동 단계 변경] 현재 한국 시간 (KST): ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')}`,
      );

      // 진행 중인 평가기간 조회 및 정보 로그 출력
      const activePeriods = await this.evaluationPeriodService.전체_조회한다();
      const inProgressPeriods = activePeriods.filter(
        (period) => period.status === EvaluationPeriodStatus.IN_PROGRESS,
      );

      this.logger.log(
        `[평가기간 자동 단계 변경] 진행 중인 평가기간 수: ${inProgressPeriods.length}개`,
      );

      // 각 평가기간의 시간 정보 로그 출력
      for (const period of inProgressPeriods) {
        const periodInfo = {
          id: period.id,
          name: period.name,
          startDate: period.startDate?.toISOString() || 'N/A',
          currentPhase: period.currentPhase || 'N/A',
          evaluationSetupDeadline:
            period.evaluationSetupDeadline?.toISOString() || 'N/A',
          performanceDeadline:
            period.performanceDeadline?.toISOString() || 'N/A',
          selfEvaluationDeadline:
            period.selfEvaluationDeadline?.toISOString() || 'N/A',
          peerEvaluationDeadline:
            period.peerEvaluationDeadline?.toISOString() || 'N/A',
        };

        this.logger.log(
          `[평가기간 자동 단계 변경] 평가기간 정보 - ID: ${periodInfo.id}, 이름: ${periodInfo.name}, 시작일: ${periodInfo.startDate}, 현재 단계: ${periodInfo.currentPhase}, 평가설정 마감일: ${periodInfo.evaluationSetupDeadline}, 업무수행 마감일: ${periodInfo.performanceDeadline}, 자기평가 마감일: ${periodInfo.selfEvaluationDeadline}, 동료평가 마감일: ${periodInfo.peerEvaluationDeadline}`,
        );
      }

      // 단계 전이 실행
      const count =
        await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();

      // 전이 후 상태 로그 출력
      if (count > 0) {
        this.logger.log(
          `[평가기간 자동 단계 변경] ${count}개 평가기간의 단계가 전이되었습니다.`,
        );

        // 전이된 평가기간의 최종 상태 로그 출력
        const updatedPeriods =
          await this.evaluationPeriodService.전체_조회한다();
        const updatedInProgressPeriods = updatedPeriods.filter(
          (period) => period.status === EvaluationPeriodStatus.IN_PROGRESS,
        );

        for (const period of updatedInProgressPeriods) {
          if (
            inProgressPeriods.find((p) => p.id === period.id)?.currentPhase !==
            period.currentPhase
          ) {
            const beforePhase = inProgressPeriods.find(
              (p) => p.id === period.id,
            )?.currentPhase;
            this.logger.log(
              `[평가기간 자동 단계 변경] 평가기간 ${period.id} (${period.name}) 단계 변경됨: ${beforePhase} → ${period.currentPhase}`,
            );
          }
        }
      } else {
        this.logger.log(
          `[평가기간 자동 단계 변경] 전이된 평가기간이 없습니다.`,
        );
      }

      return {
        success: true,
        message: `평가기간 자동 단계 변경 완료: ${count}개 평가기간 전이됨`,
        transitionedCount: count,
      };
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 동기화 크론 작업
   * 일반적으로는 @Cron 데코레이터로 10분마다 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('employee-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '직원 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 직원 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직원 동기화 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerEmployeeSync() {
    try {
      await this.employeeSyncService.scheduledSync();
      return {
        success: true,
        message: '직원 동기화 완료',
      };
    } catch (error) {
      this.logger.error('직원 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 부서 동기화 크론 작업
   * 일반적으로는 @Cron 데코레이터로 10분마다 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('department-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '부서 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 부서 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '부서 동기화 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerDepartmentSync() {
    try {
      await this.departmentSyncService.scheduledSync();
      return {
        success: true,
        message: '부서 동기화 완료',
      };
    } catch (error) {
      this.logger.error('부서 동기화 실패:', error);
      throw error;
    }
  }
}
