import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import * as fs from 'fs';
import * as path from 'path';
import { CreateEvaluationPeriodMinimalDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import {
  CreateEvaluationPeriodCommandHandler,
  CreateEvaluationPeriodCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period.handler';
import {
  UpdateEvaluationPeriodScheduleCommandHandler,
  UpdateEvaluationPeriodScheduleCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-evaluation-period-schedule.handler';
import {
  UpdateEvaluationPeriodStartDateCommandHandler,
  UpdateEvaluationPeriodStartDateCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-evaluation-period-start-date.handler';
import {
  UpdateEvaluationSetupDeadlineCommandHandler,
  UpdateEvaluationSetupDeadlineCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-evaluation-setup-deadline.handler';
import {
  UpdatePerformanceDeadlineCommandHandler,
  UpdatePerformanceDeadlineCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-performance-deadline.handler';
import {
  UpdateSelfEvaluationDeadlineCommandHandler,
  UpdateSelfEvaluationDeadlineCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-self-evaluation-deadline.handler';
import {
  UpdatePeerEvaluationDeadlineCommandHandler,
  UpdatePeerEvaluationDeadlineCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-peer-evaluation-deadline.handler';
import {
  StartEvaluationPeriodCommandHandler,
  StartEvaluationPeriodCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/start-evaluation-period.handler';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodValidationService } from '@domain/core/evaluation-period/evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  UpdateEvaluationPeriodScheduleDto,
  UpdateEvaluationPeriodStartDateDto,
  UpdateEvaluationSetupDeadlineDto,
  UpdatePerformanceDeadlineDto,
  UpdateSelfEvaluationDeadlineDto,
  UpdatePeerEvaluationDeadlineDto,
} from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';

/**
 * 평가기간 일정 수정 후 자동 조정 테스트
 *
 * 일정 수정 시 상태와 단계가 자동으로 조정되는지 검증합니다.
 * - 시작일 수정 시 상태 자동 변경 (WAITING → IN_PROGRESS)
 * - 마감일 수정 시 단계 자동 전이
 * - 일정 수정 시 상태와 단계 모두 자동 조정
 */
describe('평가기간 일정 수정 후 자동 조정', () => {
  let createHandler: CreateEvaluationPeriodCommandHandler;
  let startHandler: StartEvaluationPeriodCommandHandler;
  let scheduleHandler: UpdateEvaluationPeriodScheduleCommandHandler;
  let startDateHandler: UpdateEvaluationPeriodStartDateCommandHandler;
  let evaluationSetupHandler: UpdateEvaluationSetupDeadlineCommandHandler;
  let performanceHandler: UpdatePerformanceDeadlineCommandHandler;
  let selfEvaluationHandler: UpdateSelfEvaluationDeadlineCommandHandler;
  let peerEvaluationHandler: UpdatePeerEvaluationDeadlineCommandHandler;
  let dataSource: DataSource;
  let module: TestingModule;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트용 기본 등급 구간
  const 기본등급구간 = [
    { grade: 'S', minRange: 95, maxRange: 100 },
    { grade: 'A', minRange: 90, maxRange: 94 },
    { grade: 'B', minRange: 80, maxRange: 89 },
    { grade: 'C', minRange: 70, maxRange: 79 },
    { grade: 'D', minRange: 0, maxRange: 69 },
  ];

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        TypeOrmModule.forFeature([EvaluationPeriod, Employee]),
      ],
      providers: [
        // 서비스
        EvaluationPeriodService,
        EvaluationPeriodValidationService,
        EvaluationPeriodAutoPhaseService,
        EmployeeService,
        TransactionManagerService,
        // 핸들러
        CreateEvaluationPeriodCommandHandler,
        StartEvaluationPeriodCommandHandler,
        UpdateEvaluationPeriodScheduleCommandHandler,
        UpdateEvaluationPeriodStartDateCommandHandler,
        UpdateEvaluationSetupDeadlineCommandHandler,
        UpdatePerformanceDeadlineCommandHandler,
        UpdateSelfEvaluationDeadlineCommandHandler,
        UpdatePeerEvaluationDeadlineCommandHandler,
      ],
    }).compile();

    createHandler = module.get<CreateEvaluationPeriodCommandHandler>(
      CreateEvaluationPeriodCommandHandler,
    );
    startHandler = module.get<StartEvaluationPeriodCommandHandler>(
      StartEvaluationPeriodCommandHandler,
    );
    scheduleHandler = module.get<UpdateEvaluationPeriodScheduleCommandHandler>(
      UpdateEvaluationPeriodScheduleCommandHandler,
    );
    startDateHandler = module.get<UpdateEvaluationPeriodStartDateCommandHandler>(
      UpdateEvaluationPeriodStartDateCommandHandler,
    );
    evaluationSetupHandler = module.get<UpdateEvaluationSetupDeadlineCommandHandler>(
      UpdateEvaluationSetupDeadlineCommandHandler,
    );
    performanceHandler = module.get<UpdatePerformanceDeadlineCommandHandler>(
      UpdatePerformanceDeadlineCommandHandler,
    );
    selfEvaluationHandler = module.get<UpdateSelfEvaluationDeadlineCommandHandler>(
      UpdateSelfEvaluationDeadlineCommandHandler,
    );
    peerEvaluationHandler = module.get<UpdatePeerEvaluationDeadlineCommandHandler>(
      UpdatePeerEvaluationDeadlineCommandHandler,
    );
    dataSource = module.get<DataSource>(DataSource);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('시작일 수정 시 상태 자동 변경', () => {
    it('시작일을 과거 날짜로 수정하면 상태가 WAITING에서 IN_PROGRESS로 자동 변경되어야 한다', async () => {
      // Given - WAITING 상태의 평가기간 생성
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전
      const 미래평가설정마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
      const 미래업무수행마감일 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
      const 미래자기평가마감일 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60일 후
      const 미래동료평가마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        peerEvaluationDeadline: 미래동료평가마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      expect(createdPeriod.status).toBe(EvaluationPeriodStatus.WAITING);
      expect(createdPeriod.currentPhase).toBe(EvaluationPeriodPhase.WAITING);

      // When - 시작일을 과거 날짜로 수정하고, 동시에 마감일도 설정
      // 시작일과 마감일을 함께 수정하면 검증 오류를 피할 수 있음
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        startDate: 과거시작일,
        evaluationSetupDeadline: 미래평가설정마감일,
        performanceDeadline: 미래업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      const result = await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      // Then - 상태가 자동으로 IN_PROGRESS로 변경되고 단계가 EVALUATION_SETUP으로 설정되어야 함
      // (마감일이 미래로 설정되어 있어서 EVALUATION_SETUP 단계 유지)
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // 테스트 결과 저장
      testResults.push({
        testName: '시작일을 과거 날짜로 수정하면 상태가 WAITING에서 IN_PROGRESS로 자동 변경되어야 한다',
        result: {
          periodId: createdPeriod.id,
          beforeStatus: EvaluationPeriodStatus.WAITING,
          afterStatus: result.status,
          beforePhase: EvaluationPeriodPhase.WAITING,
          afterPhase: result.currentPhase,
          startDate: 과거시작일.toISOString(),
        },
      });
    });

    it('시작일을 미래 날짜로 수정하면 상태가 WAITING으로 유지되어야 한다', async () => {
      // Given - WAITING 상태의 평가기간 생성
      const now = new Date();
      const 미래시작일 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
      const 미래마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 하반기 평가',
        startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60일 후
        peerEvaluationDeadline: 미래마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      expect(createdPeriod.status).toBe(EvaluationPeriodStatus.WAITING);

      // When - 시작일을 미래 날짜로 수정 (종료일보다 이전이어야 함)
      const startDateData: UpdateEvaluationPeriodStartDateDto = {
        startDate: 미래시작일,
      };

      const result = await startDateHandler.execute(
        new UpdateEvaluationPeriodStartDateCommand(
          createdPeriod.id,
          startDateData,
          systemAdminId,
        ),
      );

      // Then - 상태가 WAITING으로 유지되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.WAITING);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.WAITING);

      // 테스트 결과 저장
      testResults.push({
        testName: '시작일을 미래 날짜로 수정하면 상태가 WAITING으로 유지되어야 한다',
        result: {
          periodId: createdPeriod.id,
          status: result.status,
          phase: result.currentPhase,
          startDate: 미래시작일.toISOString(),
        },
      });
    });
  });

  describe('일정 수정 시 상태와 단계 자동 조정', () => {
    it('전체 일정을 수정할 때 시작일이 지났으면 상태와 단계가 자동으로 조정되어야 한다', async () => {
      // Given - WAITING 상태의 평가기간 생성
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2일 전 (시작일은 00:00:00)
      // 마감일은 "해당 날짜까지"를 의미하므로, 어제 날짜로 설정해야 어제 23:59:59가 지났으므로 전이됨
      // 시작일보다 이후여야 하므로 1일 전으로 설정
      const 과거평가설정마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전 (어제 날짜, 23:59:59까지)
      const 미래업무수행마감일 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60일 후
      const 미래자기평가마감일 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90일 후
      const 미래동료평가마감일 = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // 120일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 전체 일정 수정 테스트',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        peerEvaluationDeadline: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 180일 후
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      expect(createdPeriod.status).toBe(EvaluationPeriodStatus.WAITING);

      // When - 전체 일정을 수정 (시작일과 평가설정 마감일이 과거)
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        startDate: 과거시작일,
        evaluationSetupDeadline: 과거평가설정마감일,
        performanceDeadline: 미래업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      const result = await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      // Then - 상태가 IN_PROGRESS로 변경되고, 평가설정 마감일이 지났으므로 PERFORMANCE 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      // 테스트 결과 저장
      testResults.push({
        testName: '전체 일정을 수정할 때 시작일이 지났으면 상태와 단계가 자동으로 조정되어야 한다',
        result: {
          periodId: createdPeriod.id,
          beforeStatus: EvaluationPeriodStatus.WAITING,
          afterStatus: result.status,
          afterPhase: result.currentPhase,
          scheduleData: {
            startDate: 과거시작일.toISOString(),
            evaluationSetupDeadline: 과거평가설정마감일.toISOString(),
          },
        },
      });
    });
  });

  describe('평가설정 마감일 수정 시 단계 자동 전이', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성 및 시작
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
      const 미래평가설정마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후 (EVALUATION_SETUP 단계 유지용)
      const 미래업무수행마감일 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
      const 미래자기평가마감일 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60일 후
      const 미래동료평가마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '평가설정 마감일 수정 테스트용',
        startDate: 과거시작일,
        peerEvaluationDeadline: 미래동료평가마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // 평가기간 시작
      await startHandler.execute(
        new StartEvaluationPeriodCommand(createdPeriod.id, systemAdminId),
      );

      // 모든 마감일을 미래로 설정하여 EVALUATION_SETUP 단계 유지
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        evaluationSetupDeadline: 미래평가설정마감일,
        performanceDeadline: 미래업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      기존평가기간Id = createdPeriod.id;
    });

    it('평가설정 마감일을 과거 날짜로 수정하면 PERFORMANCE 단계로 자동 전이되어야 한다', async () => {
      // Given
      const now = new Date();
      const 과거평가설정마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전

      const deadlineData: UpdateEvaluationSetupDeadlineDto = {
        evaluationSetupDeadline: 과거평가설정마감일,
      };

      // When
      const result = await evaluationSetupHandler.execute(
        new UpdateEvaluationSetupDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 평가설정 마감일이 지났으므로 PERFORMANCE 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      // 테스트 결과 저장
      testResults.push({
        testName: '평가설정 마감일을 과거 날짜로 수정하면 PERFORMANCE 단계로 자동 전이되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          beforePhase: EvaluationPeriodPhase.EVALUATION_SETUP,
          afterPhase: result.currentPhase,
          deadline: 과거평가설정마감일.toISOString(),
        },
      });
    });

    it('평가설정 마감일을 미래 날짜로 수정하면 현재 단계가 유지되어야 한다', async () => {
      // Given
      const now = new Date();
      const 미래평가설정마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후

      const deadlineData: UpdateEvaluationSetupDeadlineDto = {
        evaluationSetupDeadline: 미래평가설정마감일,
      };

      // When
      const result = await evaluationSetupHandler.execute(
        new UpdateEvaluationSetupDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 마감일이 아직 지나지 않았으므로 EVALUATION_SETUP 단계 유지
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // 테스트 결과 저장
      testResults.push({
        testName: '평가설정 마감일을 미래 날짜로 수정하면 현재 단계가 유지되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          phase: result.currentPhase,
          deadline: 미래평가설정마감일.toISOString(),
        },
      });
    });

    it('평가설정 마감일을 오늘 날짜로 수정하면 오늘 23:59:59까지는 현재 단계가 유지되어야 한다', async () => {
      // Given - 마감일은 "해당 날짜까지"를 의미하므로, 오늘 날짜로 설정하면 오늘 23:59:59까지 유지
      const now = new Date();
      // 오늘 날짜의 00:00:00으로 설정 (마감일은 해당 날짜의 23:59:59까지 유지)
      const 오늘날짜 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const deadlineData: UpdateEvaluationSetupDeadlineDto = {
        evaluationSetupDeadline: 오늘날짜,
      };

      // When
      const result = await evaluationSetupHandler.execute(
        new UpdateEvaluationSetupDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 오늘 날짜의 23:59:59까지는 유지되므로, 현재 시간이 오늘 23:59:59 이전이면 EVALUATION_SETUP 단계 유지
      // (다음 날 00:00:00 이후에 크론이 실행되면 전이됨)
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // 테스트 결과 저장
      testResults.push({
        testName: '평가설정 마감일을 오늘 날짜로 수정하면 오늘 23:59:59까지는 현재 단계가 유지되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          phase: result.currentPhase,
          deadline: 오늘날짜.toISOString(),
          note: '마감일은 해당 날짜의 23:59:59까지 유지되며, 다음 날 00:00:00 이후에 전이됨',
        },
      });
    });
  });

  describe('업무 수행 마감일 수정 시 단계 자동 전이', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성 및 시작, 평가설정 단계 완료
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14일 전
      const 과거평가설정마감일 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
      const 미래업무수행마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후 (PERFORMANCE 단계 유지용)
      const 미래자기평가마감일 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
      const 미래동료평가마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '업무 수행 마감일 수정 테스트용',
        startDate: 과거시작일,
        peerEvaluationDeadline: 미래동료평가마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // 평가기간 시작
      await startHandler.execute(
        new StartEvaluationPeriodCommand(createdPeriod.id, systemAdminId),
      );

      // 평가설정 마감일을 과거로 설정하여 PERFORMANCE 단계로 전이
      // 다른 마감일은 미래로 설정하여 PERFORMANCE 단계 유지
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        evaluationSetupDeadline: 과거평가설정마감일,
        performanceDeadline: 미래업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      기존평가기간Id = createdPeriod.id;
    });

    it('업무 수행 마감일을 과거 날짜로 수정하면 SELF_EVALUATION 단계로 자동 전이되어야 한다', async () => {
      // Given
      const now = new Date();
      const 과거업무수행마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전

      const deadlineData: UpdatePerformanceDeadlineDto = {
        performanceDeadline: 과거업무수행마감일,
      };

      // When
      const result = await performanceHandler.execute(
        new UpdatePerformanceDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 업무 수행 마감일이 지났으므로 SELF_EVALUATION 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.SELF_EVALUATION);

      // 테스트 결과 저장
      testResults.push({
        testName: '업무 수행 마감일을 과거 날짜로 수정하면 SELF_EVALUATION 단계로 자동 전이되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          beforePhase: EvaluationPeriodPhase.PERFORMANCE,
          afterPhase: result.currentPhase,
          deadline: 과거업무수행마감일.toISOString(),
        },
      });
    });
  });

  describe('자기 평가 마감일 수정 시 단계 자동 전이', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성 및 시작, SELF_EVALUATION 단계까지 진행
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000); // 21일 전
      const 과거평가설정마감일 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14일 전
      const 과거업무수행마감일 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
      const 미래자기평가마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
      const 미래마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '자기 평가 마감일 수정 테스트용',
        startDate: 과거시작일,
        peerEvaluationDeadline: 미래마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // 평가기간 시작
      await startHandler.execute(
        new StartEvaluationPeriodCommand(createdPeriod.id, systemAdminId),
      );

      // 단계별 마감일 설정 및 단계 전이 (SELF_EVALUATION 단계까지)
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        evaluationSetupDeadline: 과거평가설정마감일,
        performanceDeadline: 과거업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
      };

      await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      // 현재 단계 확인
      const beforeUpdate = await evaluationPeriodRepository.findOne({
        where: { id: createdPeriod.id },
      });
      expect(beforeUpdate?.currentPhase).toBe(
        EvaluationPeriodPhase.SELF_EVALUATION,
      );

      기존평가기간Id = createdPeriod.id;
    });

    it('자기 평가 마감일을 과거 날짜로 수정하면 PEER_EVALUATION 단계로 자동 전이되어야 한다', async () => {
      // Given
      const now = new Date();
      const 과거자기평가마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전

      const deadlineData: UpdateSelfEvaluationDeadlineDto = {
        selfEvaluationDeadline: 과거자기평가마감일,
      };

      // When
      const result = await selfEvaluationHandler.execute(
        new UpdateSelfEvaluationDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 자기 평가 마감일이 지났으므로 PEER_EVALUATION 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.PEER_EVALUATION);

      // 테스트 결과 저장
      testResults.push({
        testName: '자기 평가 마감일을 과거 날짜로 수정하면 PEER_EVALUATION 단계로 자동 전이되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          beforePhase: EvaluationPeriodPhase.SELF_EVALUATION,
          afterPhase: result.currentPhase,
          deadline: 과거자기평가마감일.toISOString(),
        },
      });
    });
  });

  describe('하향/동료평가 마감일 수정 시 단계 자동 전이', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성 및 시작, PEER_EVALUATION 단계까지 진행
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 28일 전
      const 과거평가설정마감일 = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000); // 21일 전
      const 과거업무수행마감일 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14일 전
      const 과거자기평가마감일 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
      const 미래동료평가마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '하향/동료평가 마감일 수정 테스트용',
        startDate: 과거시작일,
        peerEvaluationDeadline: 미래동료평가마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // 평가기간 시작
      await startHandler.execute(
        new StartEvaluationPeriodCommand(createdPeriod.id, systemAdminId),
      );

      // 단계별 마감일 설정 및 단계 전이 (PEER_EVALUATION 단계까지)
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        evaluationSetupDeadline: 과거평가설정마감일,
        performanceDeadline: 과거업무수행마감일,
        selfEvaluationDeadline: 과거자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      // 현재 단계 확인
      const beforeUpdate = await evaluationPeriodRepository.findOne({
        where: { id: createdPeriod.id },
      });
      expect(beforeUpdate?.currentPhase).toBe(
        EvaluationPeriodPhase.PEER_EVALUATION,
      );

      기존평가기간Id = createdPeriod.id;
    });

    it('하향/동료평가 마감일을 과거 날짜로 수정하면 CLOSURE 단계로 자동 전이되어야 한다', async () => {
      // Given
      const now = new Date();
      const 과거동료평가마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전

      const deadlineData: UpdatePeerEvaluationDeadlineDto = {
        peerEvaluationDeadline: 과거동료평가마감일,
      };

      // When
      const result = await peerEvaluationHandler.execute(
        new UpdatePeerEvaluationDeadlineCommand(
          기존평가기간Id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 하향/동료평가 마감일이 지났으므로 CLOSURE 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);

      // 테스트 결과 저장
      testResults.push({
        testName: '하향/동료평가 마감일을 과거 날짜로 수정하면 CLOSURE 단계로 자동 전이되어야 한다',
        result: {
          periodId: 기존평가기간Id,
          beforePhase: EvaluationPeriodPhase.PEER_EVALUATION,
          afterPhase: result.currentPhase,
          deadline: 과거동료평가마감일.toISOString(),
        },
      });
    });
  });

  describe('복합 시나리오', () => {
    it('WAITING 상태에서 시작일과 모든 마감일을 과거로 수정하면 최종 단계로 자동 전이되어야 한다', async () => {
      // Given - WAITING 상태의 평가기간 생성
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30일 전
      const 과거평가설정마감일 = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000); // 25일 전
      const 과거업무수행마감일 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20일 전
      const 과거자기평가마감일 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15일 전
      const 과거동료평가마감일 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10일 전

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '복합 시나리오 테스트',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        peerEvaluationDeadline: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 180일 후
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      expect(createdPeriod.status).toBe(EvaluationPeriodStatus.WAITING);

      // When - 모든 일정을 과거로 수정
      const scheduleData: UpdateEvaluationPeriodScheduleDto = {
        startDate: 과거시작일,
        evaluationSetupDeadline: 과거평가설정마감일,
        performanceDeadline: 과거업무수행마감일,
        selfEvaluationDeadline: 과거자기평가마감일,
        peerEvaluationDeadline: 과거동료평가마감일,
      };

      const result = await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData,
          systemAdminId,
        ),
      );

      // Then - 상태가 IN_PROGRESS로 변경되고, 모든 마감일이 지났으므로 CLOSURE 단계로 전이되어야 함
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);

      // 테스트 결과 저장
      testResults.push({
        testName: 'WAITING 상태에서 시작일과 모든 마감일을 과거로 수정하면 최종 단계로 자동 전이되어야 한다',
        result: {
          periodId: createdPeriod.id,
          beforeStatus: EvaluationPeriodStatus.WAITING,
          afterStatus: result.status,
          afterPhase: result.currentPhase,
          scheduleData: {
            startDate: 과거시작일.toISOString(),
            evaluationSetupDeadline: 과거평가설정마감일.toISOString(),
            performanceDeadline: 과거업무수행마감일.toISOString(),
            selfEvaluationDeadline: 과거자기평가마감일.toISOString(),
            peerEvaluationDeadline: 과거동료평가마감일.toISOString(),
          },
        },
      });
    });

    it('이미 진행 중인 평가기간의 마감일을 과거로 수정하면 해당 단계로 자동 전이되어야 한다', async () => {
      // Given - 진행 중인 평가기간 (EVALUATION_SETUP 단계)
      const now = new Date();
      const 과거시작일 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7일 전
      const 미래평가설정마감일 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
      const 미래업무수행마감일 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
      const 미래자기평가마감일 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60일 후
      const 미래동료평가마감일 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180일 후

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '진행 중 평가기간 마감일 수정 테스트',
        startDate: 과거시작일,
        peerEvaluationDeadline: 미래동료평가마감일,
        description: '테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const createdPeriod = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // 평가기간 시작
      await startHandler.execute(
        new StartEvaluationPeriodCommand(createdPeriod.id, systemAdminId),
      );

      // 평가설정 마감일을 미래로 설정하고, 다른 마감일도 미래로 설정하여 EVALUATION_SETUP 단계 유지
      const scheduleData1: UpdateEvaluationPeriodScheduleDto = {
        evaluationSetupDeadline: 미래평가설정마감일,
        performanceDeadline: 미래업무수행마감일,
        selfEvaluationDeadline: 미래자기평가마감일,
        peerEvaluationDeadline: 미래동료평가마감일,
      };

      await scheduleHandler.execute(
        new UpdateEvaluationPeriodScheduleCommand(
          createdPeriod.id,
          scheduleData1,
          systemAdminId,
        ),
      );

      // 현재 상태 확인
      const beforeUpdate = await evaluationPeriodRepository.findOne({
        where: { id: createdPeriod.id },
      });
      expect(beforeUpdate?.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // When - 평가설정 마감일을 과거로 수정
      const 과거평가설정마감일 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전
      const deadlineData: UpdateEvaluationSetupDeadlineDto = {
        evaluationSetupDeadline: 과거평가설정마감일,
      };

      const result = await evaluationSetupHandler.execute(
        new UpdateEvaluationSetupDeadlineCommand(
          createdPeriod.id,
          deadlineData,
          systemAdminId,
        ),
      );

      // Then - 평가설정 마감일이 지났으므로 PERFORMANCE 단계로 전이되어야 함
      // (다른 마감일은 미래로 설정되어 있어서 PERFORMANCE 단계에서 멈춰야 함)
      expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(result.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      // 테스트 결과 저장
      testResults.push({
        testName: '이미 진행 중인 평가기간의 마감일을 과거로 수정하면 해당 단계로 자동 전이되어야 한다',
        result: {
          periodId: createdPeriod.id,
          beforePhase: EvaluationPeriodPhase.EVALUATION_SETUP,
          afterPhase: result.currentPhase,
          deadline: 과거평가설정마감일.toISOString(),
        },
      });
    });
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'evaluation-period-schedule-update-auto-adjustment-result.json',
    );
    
    const output = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      testResults: testResults,
      summary: {
        total: testResults.length,
        byCategory: {
          시작일수정: testResults.filter((r) => r.testName.includes('시작일')).length,
          마감일수정: testResults.filter((r) => r.testName.includes('마감일')).length,
          일정수정: testResults.filter((r) => r.testName.includes('일정')).length,
          복합시나리오: testResults.filter((r) => r.testName.includes('복합') || r.testName.includes('진행 중')).length,
        },
      },
    };

    try {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(
        `✅ 테스트 결과가 저장되었습니다: ${outputPath}`,
      );
      console.log(`   총 ${testResults.length}개의 테스트 결과가 저장되었습니다.`);
    } catch (error) {
      console.error('❌ 테스트 결과 저장 실패:', error);
    }
  });
});

