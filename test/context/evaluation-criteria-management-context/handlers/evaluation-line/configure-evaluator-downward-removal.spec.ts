import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurePrimaryEvaluatorHandler, ConfigurePrimaryEvaluatorCommand } from '../../../../../src/context/evaluation-criteria-management-context/handlers/evaluation-line/commands/configure-primary-evaluator.handler';
import { ConfigureSecondaryEvaluatorHandler, ConfigureSecondaryEvaluatorCommand } from '../../../../../src/context/evaluation-criteria-management-context/handlers/evaluation-line/commands/configure-secondary-evaluator.handler';
import { EvaluationLineService } from '../../../../../src/domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../src/domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DownwardEvaluationService } from '../../../../../src/domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationType } from '../../../../../src/domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 평가자 구성 시 기존 하향평가 삭제 로직 테스트
 */
describe('평가자 구성 시 기존 하향평가 삭제', () => {
  describe('ConfigurePrimaryEvaluatorHandler', () => {
    let handler: ConfigurePrimaryEvaluatorHandler;
    let evaluationLineService: jest.Mocked<EvaluationLineService>;
    let evaluationLineMappingService: jest.Mocked<EvaluationLineMappingService>;
    let downwardEvaluationService: jest.Mocked<DownwardEvaluationService>;

    const mockEvaluationLine = {
      DTO로_변환한다: () => ({ id: 'eval-line-id' }),
    };

    const mockExistingMapping = {
      evaluatorId: 'old-evaluator-id',
      DTO로_변환한다: () => ({
        id: 'mapping-id',
        employeeId: 'employee-id',
        evaluatorId: 'old-evaluator-id',
        wbsItemId: null,
        evaluationLineId: 'eval-line-id',
      }),
    };

    const mockNewMapping = {
      DTO로_변환한다: () => ({
        id: 'mapping-id',
        employeeId: 'employee-id',
        evaluatorId: 'new-evaluator-id',
        wbsItemId: null,
        evaluationLineId: 'eval-line-id',
      }),
    };

    const mockDownwardEvaluation = {
      id: 'downward-eval-id',
      wbsId: 'wbs-id',
      deletedAt: null,
    };

    beforeEach(async () => {
      evaluationLineService = {
        필터_조회한다: jest.fn(),
        생성한다: jest.fn(),
      } as any;

      evaluationLineMappingService = {
        필터_조회한다: jest.fn(),
        업데이트한다: jest.fn(),
        생성한다: jest.fn(),
      } as any;

      downwardEvaluationService = {
        필터_조회한다: jest.fn(),
        삭제한다: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConfigurePrimaryEvaluatorHandler,
          { provide: EvaluationLineService, useValue: evaluationLineService },
          { provide: EvaluationLineMappingService, useValue: evaluationLineMappingService },
          { provide: DownwardEvaluationService, useValue: downwardEvaluationService },
        ],
      }).compile();

      handler = module.get<ConfigurePrimaryEvaluatorHandler>(ConfigurePrimaryEvaluatorHandler);
    });

    it('1차 평가자 변경 시 기존 평가자의 하향평가를 삭제해야 한다', async () => {
      // Given
      const command = new ConfigurePrimaryEvaluatorCommand(
        'employee-id',
        'period-id',
        'new-evaluator-id',
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([mockExistingMapping]);
      evaluationLineMappingService.업데이트한다.mockResolvedValue(mockNewMapping);
      downwardEvaluationService.필터_조회한다.mockResolvedValue([mockDownwardEvaluation]);
      downwardEvaluationService.삭제한다.mockResolvedValue(undefined);

      // When
      await handler.execute(command);

      // Then
      // 기존 평가자의 하향평가 조회가 호출되어야 함
      expect(downwardEvaluationService.필터_조회한다).toHaveBeenCalledWith({
        employeeId: 'employee-id',
        evaluatorId: 'old-evaluator-id',
        periodId: 'period-id',
        evaluationType: DownwardEvaluationType.PRIMARY,
      });

      // 하향평가 삭제가 호출되어야 함
      expect(downwardEvaluationService.삭제한다).toHaveBeenCalledWith(
        'downward-eval-id',
        expect.any(String),
      );
    });

    it('동일한 평가자로 구성 시 하향평가를 삭제하지 않아야 한다', async () => {
      // Given
      const command = new ConfigurePrimaryEvaluatorCommand(
        'employee-id',
        'period-id',
        'old-evaluator-id', // 동일한 평가자
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([mockExistingMapping]);
      evaluationLineMappingService.업데이트한다.mockResolvedValue({
        DTO로_변환한다: () => ({
          id: 'mapping-id',
          employeeId: 'employee-id',
          evaluatorId: 'old-evaluator-id',
          wbsItemId: null,
          evaluationLineId: 'eval-line-id',
        }),
      });

      // When
      await handler.execute(command);

      // Then
      // 하향평가 조회가 호출되지 않아야 함
      expect(downwardEvaluationService.필터_조회한다).not.toHaveBeenCalled();
      // 하향평가 삭제가 호출되지 않아야 함
      expect(downwardEvaluationService.삭제한다).not.toHaveBeenCalled();
    });

    it('기존 매핑이 없는 경우 (신규 생성) 하향평가 삭제가 호출되지 않아야 한다', async () => {
      // Given
      const command = new ConfigurePrimaryEvaluatorCommand(
        'employee-id',
        'period-id',
        'new-evaluator-id',
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([]); // 기존 매핑 없음
      evaluationLineMappingService.생성한다.mockResolvedValue(mockNewMapping);

      // When
      await handler.execute(command);

      // Then
      // 하향평가 조회가 호출되지 않아야 함
      expect(downwardEvaluationService.필터_조회한다).not.toHaveBeenCalled();
      // 하향평가 삭제가 호출되지 않아야 함
      expect(downwardEvaluationService.삭제한다).not.toHaveBeenCalled();
    });
  });

  describe('ConfigureSecondaryEvaluatorHandler', () => {
    let handler: ConfigureSecondaryEvaluatorHandler;
    let evaluationLineService: jest.Mocked<EvaluationLineService>;
    let evaluationLineMappingService: jest.Mocked<EvaluationLineMappingService>;
    let downwardEvaluationService: jest.Mocked<DownwardEvaluationService>;

    const mockEvaluationLine = {
      DTO로_변환한다: () => ({ id: 'eval-line-id' }),
    };

    const mockExistingMapping = {
      evaluatorId: 'old-evaluator-id',
      DTO로_변환한다: () => ({
        id: 'mapping-id',
        employeeId: 'employee-id',
        evaluatorId: 'old-evaluator-id',
        wbsItemId: 'wbs-item-id',
        evaluationLineId: 'eval-line-id',
      }),
    };

    const mockNewMapping = {
      DTO로_변환한다: () => ({
        id: 'new-mapping-id',
        employeeId: 'employee-id',
        evaluatorId: 'new-evaluator-id',
        wbsItemId: 'wbs-item-id',
        evaluationLineId: 'eval-line-id',
      }),
    };

    const mockDownwardEvaluation = {
      id: 'downward-eval-id',
      wbsId: 'wbs-item-id',
      deletedAt: null,
    };

    beforeEach(async () => {
      evaluationLineService = {
        필터_조회한다: jest.fn(),
        생성한다: jest.fn(),
      } as any;

      evaluationLineMappingService = {
        필터_조회한다: jest.fn(),
        삭제한다: jest.fn(),
        생성한다: jest.fn(),
      } as any;

      downwardEvaluationService = {
        필터_조회한다: jest.fn(),
        삭제한다: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConfigureSecondaryEvaluatorHandler,
          { provide: EvaluationLineService, useValue: evaluationLineService },
          { provide: EvaluationLineMappingService, useValue: evaluationLineMappingService },
          { provide: DownwardEvaluationService, useValue: downwardEvaluationService },
        ],
      }).compile();

      handler = module.get<ConfigureSecondaryEvaluatorHandler>(ConfigureSecondaryEvaluatorHandler);
    });

    it('2차 평가자 변경 시 기존 평가자의 해당 WBS 하향평가를 삭제해야 한다', async () => {
      // Given
      const command = new ConfigureSecondaryEvaluatorCommand(
        'employee-id',
        'wbs-item-id',
        'period-id',
        'new-evaluator-id',
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([mockExistingMapping]);
      evaluationLineMappingService.삭제한다.mockResolvedValue(undefined);
      evaluationLineMappingService.생성한다.mockResolvedValue(mockNewMapping);
      downwardEvaluationService.필터_조회한다.mockResolvedValue([mockDownwardEvaluation]);
      downwardEvaluationService.삭제한다.mockResolvedValue(undefined);

      // When
      await handler.execute(command);

      // Then
      // 기존 평가자의 해당 WBS 하향평가 조회가 호출되어야 함
      expect(downwardEvaluationService.필터_조회한다).toHaveBeenCalledWith({
        employeeId: 'employee-id',
        evaluatorId: 'old-evaluator-id',
        periodId: 'period-id',
        wbsId: 'wbs-item-id',
        evaluationType: DownwardEvaluationType.SECONDARY,
      });

      // 하향평가 삭제가 호출되어야 함
      expect(downwardEvaluationService.삭제한다).toHaveBeenCalledWith(
        'downward-eval-id',
        expect.any(String),
      );
    });

    it('동일한 평가자로 구성 시 하향평가를 삭제하지 않아야 한다', async () => {
      // Given
      const command = new ConfigureSecondaryEvaluatorCommand(
        'employee-id',
        'wbs-item-id',
        'period-id',
        'old-evaluator-id', // 동일한 평가자
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([mockExistingMapping]);
      evaluationLineMappingService.삭제한다.mockResolvedValue(undefined);
      evaluationLineMappingService.생성한다.mockResolvedValue({
        DTO로_변환한다: () => ({
          id: 'new-mapping-id',
          employeeId: 'employee-id',
          evaluatorId: 'old-evaluator-id',
          wbsItemId: 'wbs-item-id',
          evaluationLineId: 'eval-line-id',
        }),
      });

      // When
      await handler.execute(command);

      // Then
      // 하향평가 조회가 호출되지 않아야 함
      expect(downwardEvaluationService.필터_조회한다).not.toHaveBeenCalled();
      // 하향평가 삭제가 호출되지 않아야 함
      expect(downwardEvaluationService.삭제한다).not.toHaveBeenCalled();
    });

    it('기존 매핑이 없는 경우 (신규 생성) 하향평가 삭제가 호출되지 않아야 한다', async () => {
      // Given
      const command = new ConfigureSecondaryEvaluatorCommand(
        'employee-id',
        'wbs-item-id',
        'period-id',
        'new-evaluator-id',
        'created-by',
      );

      evaluationLineService.필터_조회한다.mockResolvedValue([mockEvaluationLine]);
      evaluationLineMappingService.필터_조회한다.mockResolvedValue([]); // 기존 매핑 없음
      evaluationLineMappingService.생성한다.mockResolvedValue(mockNewMapping);

      // When
      await handler.execute(command);

      // Then
      // 하향평가 조회가 호출되지 않아야 함
      expect(downwardEvaluationService.필터_조회한다).not.toHaveBeenCalled();
      // 하향평가 삭제가 호출되지 않아야 함
      expect(downwardEvaluationService.삭제한다).not.toHaveBeenCalled();
    });
  });
});

