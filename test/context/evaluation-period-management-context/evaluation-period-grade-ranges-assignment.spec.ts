import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { CreateEvaluationPeriodMinimalDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import {
  CreateEvaluationPeriodCommandHandler,
  CreateEvaluationPeriodCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period.handler';
import {
  UpdateEvaluationPeriodGradeRangesCommandHandler,
  UpdateEvaluationPeriodGradeRangesCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-evaluation-period-grade-ranges.handler';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodValidationService } from '@domain/core/evaluation-period/evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { UpdateGradeRangesDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';

/**
 * 평가기간 등급 구간 값 할당 테스트
 *
 * 평가기간 생성 및 수정 시 gradeRanges 값이 정확하게 할당되는지 검증합니다.
 * - 생성 시 등급 구간 값 할당 검증
 * - 수정 시 등급 구간 값 할당 검증
 * - 다양한 등급 구간 설정 검증
 */
describe('평가기간 등급 구간 값 할당 테스트', () => {
  let createHandler: CreateEvaluationPeriodCommandHandler;
  let updateHandler: UpdateEvaluationPeriodGradeRangesCommandHandler;
  let dataSource: DataSource;
  let module: TestingModule;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

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
        UpdateEvaluationPeriodGradeRangesCommandHandler,
      ],
    }).compile();

    createHandler = module.get<CreateEvaluationPeriodCommandHandler>(
      CreateEvaluationPeriodCommandHandler,
    );
    updateHandler = module.get<UpdateEvaluationPeriodGradeRangesCommandHandler>(
      UpdateEvaluationPeriodGradeRangesCommandHandler,
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

  describe('평가기간 생성 시 등급 구간 값 할당 검증', () => {
    it('기본 등급 구간으로 평가기간 생성 시 모든 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const 입력등급구간 = [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '기본 등급 구간 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 입력등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(5);

      // 각 등급 구간의 값을 상세히 검증
      const sGrade = result.gradeRanges.find((g) => g.grade === 'S');
      expect(sGrade).toBeDefined();
      expect(sGrade!.minRange).toBe(95);
      expect(sGrade!.maxRange).toBe(100);

      const aGrade = result.gradeRanges.find((g) => g.grade === 'A');
      expect(aGrade).toBeDefined();
      expect(aGrade!.minRange).toBe(90);
      expect(aGrade!.maxRange).toBe(94);

      const bGrade = result.gradeRanges.find((g) => g.grade === 'B');
      expect(bGrade).toBeDefined();
      expect(bGrade!.minRange).toBe(80);
      expect(bGrade!.maxRange).toBe(89);

      const cGrade = result.gradeRanges.find((g) => g.grade === 'C');
      expect(cGrade).toBeDefined();
      expect(cGrade!.minRange).toBe(70);
      expect(cGrade!.maxRange).toBe(79);

      const dGrade = result.gradeRanges.find((g) => g.grade === 'D');
      expect(dGrade).toBeDefined();
      expect(dGrade!.minRange).toBe(0);
      expect(dGrade!.maxRange).toBe(69);
    });

    it('7단계 등급 구간으로 평가기간 생성 시 모든 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const 입력등급구간 = [
        { grade: 'S+', minRange: 121, maxRange: 1000 },
        { grade: 'S', minRange: 111, maxRange: 120 },
        { grade: 'A+', minRange: 101, maxRange: 110 },
        { grade: 'A', minRange: 91, maxRange: 100 },
        { grade: 'B+', minRange: 81, maxRange: 90 },
        { grade: 'B', minRange: 71, maxRange: 80 },
        { grade: 'C', minRange: 0, maxRange: 70 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 7단계 등급 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '7단계 등급 구간 테스트',
        maxSelfEvaluationRate: 150,
        gradeRanges: 입력등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(7);

      // 모든 등급 구간의 값을 검증
      입력등급구간.forEach((입력) => {
        const 결과등급 = result.gradeRanges.find((g) => g.grade === 입력.grade);
        expect(결과등급).toBeDefined();
        expect(결과등급!.minRange).toBe(입력.minRange);
        expect(결과등급!.maxRange).toBe(입력.maxRange);
      });
    });

    it('넓은 범위의 등급 구간으로 평가기간 생성 시 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const 입력등급구간 = [
        { grade: 'S', minRange: 900, maxRange: 1000 },
        { grade: 'A', minRange: 700, maxRange: 899 },
        { grade: 'B', minRange: 400, maxRange: 699 },
        { grade: 'C', minRange: 0, maxRange: 399 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 넓은 범위 등급 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '넓은 범위 등급 구간 테스트',
        maxSelfEvaluationRate: 200,
        gradeRanges: 입력등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(4);

      // 넓은 범위 등급 구간 검증
      const sGrade = result.gradeRanges.find((g) => g.grade === 'S');
      expect(sGrade!.minRange).toBe(900);
      expect(sGrade!.maxRange).toBe(1000);

      const aGrade = result.gradeRanges.find((g) => g.grade === 'A');
      expect(aGrade!.minRange).toBe(700);
      expect(aGrade!.maxRange).toBe(899);
    });

    it('등급 구간 없이 평가기간 생성 시 빈 배열이 할당되어야 한다', async () => {
      // Given
      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 등급 없는 평가기간',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 없는 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [],
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(0);
    });

    it('단일 등급 구간으로 평가기간 생성 시 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const 입력등급구간 = [{ grade: 'PASS', minRange: 0, maxRange: 100 }];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 단일 등급 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '단일 등급 구간 테스트',
        maxSelfEvaluationRate: 100,
        gradeRanges: 입력등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(1);

      const passGrade = result.gradeRanges[0];
      expect(passGrade.grade).toBe('PASS');
      expect(passGrade.minRange).toBe(0);
      expect(passGrade.maxRange).toBe(100);
    });

    it('특수 문자가 포함된 등급명으로 평가기간 생성 시 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const 입력등급구간 = [
        { grade: 'S++', minRange: 95, maxRange: 100 },
        { grade: 'A#', minRange: 85, maxRange: 94 },
        { grade: 'B-', minRange: 75, maxRange: 84 },
        { grade: 'C+', minRange: 0, maxRange: 74 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 특수문자 등급 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '특수문자 등급 구간 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 입력등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(4);

      입력등급구간.forEach((입력) => {
        const 결과등급 = result.gradeRanges.find((g) => g.grade === 입력.grade);
        expect(결과등급).toBeDefined();
        expect(결과등급!.minRange).toBe(입력.minRange);
        expect(결과등급!.maxRange).toBe(입력.maxRange);
      });
    });
  });

  describe('평가기간 등급 구간 수정 시 값 할당 검증', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성
      const 기본등급구간 = [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '수정 테스트용 평가기간',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 수정 테스트용',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      기존평가기간Id = result.id;
    });

    it('등급 구간 수정 시 모든 값이 정확하게 변경되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 85, maxRange: 89 },
          { grade: 'B+', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 75, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 74 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(7);

      // 수정된 모든 등급 구간 값 검증
      수정할등급구간.gradeRanges.forEach((수정) => {
        const 결과등급 = result.gradeRanges.find((g) => g.grade === 수정.grade);
        expect(결과등급).toBeDefined();
        expect(결과등급!.minRange).toBe(수정.minRange);
        expect(결과등급!.maxRange).toBe(수정.maxRange);
      });
    });

    it('등급 개수를 줄이며 수정 시 새로운 값이 정확하게 반영되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'HIGH', minRange: 80, maxRange: 100 },
          { grade: 'MEDIUM', minRange: 50, maxRange: 79 },
          { grade: 'LOW', minRange: 0, maxRange: 49 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(3);

      const highGrade = result.gradeRanges.find((g) => g.grade === 'HIGH');
      expect(highGrade!.minRange).toBe(80);
      expect(highGrade!.maxRange).toBe(100);

      const mediumGrade = result.gradeRanges.find((g) => g.grade === 'MEDIUM');
      expect(mediumGrade!.minRange).toBe(50);
      expect(mediumGrade!.maxRange).toBe(79);

      const lowGrade = result.gradeRanges.find((g) => g.grade === 'LOW');
      expect(lowGrade!.minRange).toBe(0);
      expect(lowGrade!.maxRange).toBe(49);
    });

    it('동일한 값으로 수정 시에도 정확하게 반영되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 90, maxRange: 94 },
          { grade: 'B', minRange: 80, maxRange: 89 },
          { grade: 'C', minRange: 70, maxRange: 79 },
          { grade: 'D', minRange: 0, maxRange: 69 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(5);

      수정할등급구간.gradeRanges.forEach((수정) => {
        const 결과등급 = result.gradeRanges.find((g) => g.grade === 수정.grade);
        expect(결과등급).toBeDefined();
        expect(결과등급!.minRange).toBe(수정.minRange);
        expect(결과등급!.maxRange).toBe(수정.maxRange);
      });
    });

    it('넓은 점수 범위로 수정 시 정확하게 반영되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 950, maxRange: 1000 },
          { grade: 'A', minRange: 800, maxRange: 949 },
          { grade: 'B', minRange: 500, maxRange: 799 },
          { grade: 'C', minRange: 0, maxRange: 499 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(4);

      const sGrade = result.gradeRanges.find((g) => g.grade === 'S');
      expect(sGrade!.minRange).toBe(950);
      expect(sGrade!.maxRange).toBe(1000);

      const aGrade = result.gradeRanges.find((g) => g.grade === 'A');
      expect(aGrade!.minRange).toBe(800);
      expect(aGrade!.maxRange).toBe(949);

      const bGrade = result.gradeRanges.find((g) => g.grade === 'B');
      expect(bGrade!.minRange).toBe(500);
      expect(bGrade!.maxRange).toBe(799);

      const cGrade = result.gradeRanges.find((g) => g.grade === 'C');
      expect(cGrade!.minRange).toBe(0);
      expect(cGrade!.maxRange).toBe(499);
    });
  });

  describe('데이터 영속성 검증', () => {
    it('평가기간 생성 후 DB에서 조회 시 등급 구간 값이 일치해야 한다', async () => {
      // Given
      const 입력등급구간 = [
        { grade: 'EXCELLENT', minRange: 90, maxRange: 100 },
        { grade: 'GOOD', minRange: 70, maxRange: 89 },
        { grade: 'AVERAGE', minRange: 50, maxRange: 69 },
        { grade: 'POOR', minRange: 0, maxRange: 49 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '영속성 테스트 평가기간',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '영속성 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 입력등급구간,
      };

      // When
      const createResult = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // DB에서 직접 조회
      const dbPeriod = await evaluationPeriodRepository.findOne({
        where: { id: createResult.id },
      });

      // Then
      expect(dbPeriod).toBeDefined();
      expect(dbPeriod!.gradeRanges).toHaveLength(4);

      입력등급구간.forEach((입력) => {
        const db등급 = dbPeriod!.gradeRanges.find((g) => g.grade === 입력.grade);
        expect(db등급).toBeDefined();
        expect(db등급!.minRange).toBe(입력.minRange);
        expect(db등급!.maxRange).toBe(입력.maxRange);
      });
    });

    it('등급 구간 수정 후 DB에서 조회 시 수정된 값이 반영되어야 한다', async () => {
      // Given - 평가기간 생성
      const 초기등급구간 = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 0, maxRange: 89 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '수정 영속성 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '수정 영속성 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 초기등급구간,
      };

      const createResult = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // When - 등급 구간 수정
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S+', minRange: 95, maxRange: 100 },
          { grade: 'S', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 80, maxRange: 89 },
          { grade: 'B', minRange: 0, maxRange: 79 },
        ],
      };

      await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          createResult.id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // DB에서 직접 조회
      const dbPeriod = await evaluationPeriodRepository.findOne({
        where: { id: createResult.id },
      });

      // Then
      expect(dbPeriod).toBeDefined();
      expect(dbPeriod!.gradeRanges).toHaveLength(4);

      수정할등급구간.gradeRanges.forEach((수정) => {
        const db등급 = dbPeriod!.gradeRanges.find((g) => g.grade === 수정.grade);
        expect(db등급).toBeDefined();
        expect(db등급!.minRange).toBe(수정.minRange);
        expect(db등급!.maxRange).toBe(수정.maxRange);
      });
    });
  });
});

