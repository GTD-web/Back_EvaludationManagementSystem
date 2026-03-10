import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodValidationService } from '@domain/core/evaluation-period/evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 평가기간 자동 단계 변경 - 마감일 "해당 날짜까지" 로직 테스트
 *
 * 변경된 로직 검증:
 * - 마감일이 "해당 날짜까지"를 의미하므로, 해당 날짜의 23:59:59.999까지는 현재 단계 유지
 * - 다음 날 00:00:00 이후에 다음 단계로 전이
 */
describe('평가기간 자동 단계 변경 - 마감일 "해당 날짜까지" 로직', () => {
  let autoPhaseService: EvaluationPeriodAutoPhaseService;
  let evaluationPeriodService: EvaluationPeriodService;
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

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([EvaluationPeriod, Employee]),
      ],
      providers: [
        EvaluationPeriodService,
        EvaluationPeriodValidationService,
        EvaluationPeriodAutoPhaseService,
      ],
    }).compile();

    autoPhaseService = module.get<EvaluationPeriodAutoPhaseService>(
      EvaluationPeriodAutoPhaseService,
    );
    evaluationPeriodService = module.get<EvaluationPeriodService>(
      EvaluationPeriodService,
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

  describe('마감일 "해당 날짜까지" 로직 검증', () => {
    it('마감일이 어제로 설정된 경우 즉시 다음 단계로 전이되어야 한다', async () => {
      // Given - EVALUATION_SETUP 단계의 평가기간 생성
      const now = dayjs.tz().toDate();
      const 어제날짜 = dayjs.tz(now).subtract(1, 'day').startOf('day').toDate();
      const 미래마감일 = dayjs.tz(now).add(30, 'day').toDate();

      const 평가기간 = evaluationPeriodRepository.create({
        name: '마감일 어제 테스트',
        startDate: dayjs.tz(now).subtract(7, 'day').toDate(),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
        evaluationSetupDeadline: 어제날짜, // 어제 날짜로 설정
        peerEvaluationDeadline: 미래마감일,
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
        createdBy: systemAdminId,
      });
      await evaluationPeriodRepository.save(평가기간);

      // When - 자동 단계 전이 실행
      const transitionedCount = await autoPhaseService.autoPhaseTransition();

      // Then - 어제 날짜의 23:59:59가 이미 지났으므로 즉시 PERFORMANCE 단계로 전이되어야 함
      const updatedPeriod = await evaluationPeriodRepository.findOne({
        where: { id: 평가기간.id },
      });

      expect(transitionedCount).toBeGreaterThan(0);
      expect(updatedPeriod?.currentPhase).toBe(
        EvaluationPeriodPhase.PERFORMANCE,
      );
    });

    it('마감일이 오늘로 설정된 경우 오늘 23:59:59까지는 현재 단계가 유지되어야 한다', async () => {
      // Given - EVALUATION_SETUP 단계의 평가기간 생성
      const now = dayjs.tz().toDate();
      const 오늘날짜 = dayjs.tz(now).startOf('day').toDate(); // 오늘 00:00:00
      const 미래마감일 = dayjs.tz(now).add(30, 'day').toDate();

      const 평가기간 = evaluationPeriodRepository.create({
        name: '마감일 오늘 테스트',
        startDate: dayjs.tz(now).subtract(7, 'day').toDate(),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
        evaluationSetupDeadline: 오늘날짜, // 오늘 날짜로 설정
        peerEvaluationDeadline: 미래마감일,
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
        createdBy: systemAdminId,
      });
      await evaluationPeriodRepository.save(평가기간);

      // When - 자동 단계 전이 실행 (현재 시간이 오늘 23:59:59 이전)
      const transitionedCount = await autoPhaseService.autoPhaseTransition();

      // Then - 오늘 날짜의 23:59:59까지는 유지되므로, 현재 시간이 오늘 23:59:59 이전이면 EVALUATION_SETUP 단계 유지
      const updatedPeriod = await evaluationPeriodRepository.findOne({
        where: { id: 평가기간.id },
      });

      // 현재 시간이 오늘 23:59:59 이전이면 전이되지 않아야 함
      const 오늘끝 = dayjs.tz(now).endOf('day');
      const 현재시간 = dayjs.tz(now);

      if (현재시간.isBefore(오늘끝)) {
        expect(transitionedCount).toBe(0);
        expect(updatedPeriod?.currentPhase).toBe(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );
      } else {
        // 이미 오늘 23:59:59를 지났다면 전이되어야 함
        expect(transitionedCount).toBeGreaterThan(0);
        expect(updatedPeriod?.currentPhase).toBe(
          EvaluationPeriodPhase.PERFORMANCE,
        );
      }
    });

    it('마감일이 내일로 설정된 경우 전이되지 않아야 한다', async () => {
      // Given - EVALUATION_SETUP 단계의 평가기간 생성
      const now = dayjs.tz().toDate();
      const 내일날짜 = dayjs.tz(now).add(1, 'day').startOf('day').toDate();
      const 미래마감일 = dayjs.tz(now).add(30, 'day').toDate();

      const 평가기간 = evaluationPeriodRepository.create({
        name: '마감일 내일 테스트',
        startDate: dayjs.tz(now).subtract(7, 'day').toDate(),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
        evaluationSetupDeadline: 내일날짜, // 내일 날짜로 설정
        peerEvaluationDeadline: 미래마감일,
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
        createdBy: systemAdminId,
      });
      await evaluationPeriodRepository.save(평가기간);

      // When - 자동 단계 전이 실행
      const transitionedCount = await autoPhaseService.autoPhaseTransition();

      // Then - 내일 날짜의 23:59:59까지는 유지되므로 전이되지 않아야 함
      const updatedPeriod = await evaluationPeriodRepository.findOne({
        where: { id: 평가기간.id },
      });

      expect(transitionedCount).toBe(0);
      expect(updatedPeriod?.currentPhase).toBe(
        EvaluationPeriodPhase.EVALUATION_SETUP,
      );
    });

    it('마감일이 어제 23:59:59로 설정된 경우 즉시 다음 단계로 전이되어야 한다', async () => {
      // Given - EVALUATION_SETUP 단계의 평가기간 생성
      const now = dayjs.tz().toDate();
      const 어제끝 = dayjs.tz(now).subtract(1, 'day').endOf('day').toDate(); // 어제 23:59:59.999
      const 미래마감일 = dayjs.tz(now).add(30, 'day').toDate();

      const 평가기간 = evaluationPeriodRepository.create({
        name: '마감일 어제 끝 테스트',
        startDate: dayjs.tz(now).subtract(7, 'day').toDate(),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
        evaluationSetupDeadline: 어제끝, // 어제 23:59:59.999로 설정
        peerEvaluationDeadline: 미래마감일,
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
        createdBy: systemAdminId,
      });
      await evaluationPeriodRepository.save(평가기간);

      // When - 자동 단계 전이 실행
      const transitionedCount = await autoPhaseService.autoPhaseTransition();

      // Then - 어제 23:59:59.999가 이미 지났으므로 즉시 PERFORMANCE 단계로 전이되어야 함
      const updatedPeriod = await evaluationPeriodRepository.findOne({
        where: { id: 평가기간.id },
      });

      expect(transitionedCount).toBeGreaterThan(0);
      expect(updatedPeriod?.currentPhase).toBe(
        EvaluationPeriodPhase.PERFORMANCE,
      );
    });
  });
});

