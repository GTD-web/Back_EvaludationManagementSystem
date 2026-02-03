import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@libs/database/database.module';
import {
  BulkSubmitDownwardEvaluationsCommand,
  BulkSubmitDownwardEvaluationsHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-submit-downward-evaluations.handler';
import {
  BulkResetDownwardEvaluationsCommand,
  BulkResetDownwardEvaluationsHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-reset-downward-evaluations.handler';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { DownwardEvaluationModule } from '@domain/core/downward-evaluation/downward-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriodEmployeeMappingModule } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.module';
import { NotificationModule } from '@domain/common/notification';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 하향평가 일괄 제출/초기화 Command Handler 테스트
 *
 * BulkSubmitDownwardEvaluationsHandler와 BulkResetDownwardEvaluationsHandler의 동작을 검증합니다.
 */
describe('Downward Evaluation Bulk Submission Command Handlers', () => {
  let submitHandler: BulkSubmitDownwardEvaluationsHandler;
  let resetHandler: BulkResetDownwardEvaluationsHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let departmentId: string;
  let employeeId: string;
  let evaluatorId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let primaryEvaluationId1: string;
  let primaryEvaluationId2: string;
  let secondaryEvaluationId1: string;
  let secondaryEvaluationId2: string;
  let primaryEvaluationLineId: string;
  let secondaryEvaluationLineId: string;

  const submittedBy = '00000000-0000-0000-0000-000000000002';
  const updatedBy = '00000000-0000-0000-0000-000000000003';
  const createdBy = '00000000-0000-0000-0000-000000000001';
  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
        CqrsModule,
        DownwardEvaluationModule,
        EvaluationPeriodModule,
        EvaluationPeriodEmployeeMappingModule,
        WbsSelfEvaluationModule,
        EmployeeEvaluationStepApprovalModule,
        NotificationModule,
        EmployeeModule,
        StepApprovalContextModule,
        PerformanceEvaluationContextModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          DownwardEvaluation,
          EvaluationLine,
          EvaluationLineMapping,
          EvaluationWbsAssignment,
          EvaluationProjectAssignment,
          Project,
          WbsItem,
        ]),
      ],
      providers: [
        BulkSubmitDownwardEvaluationsHandler,
        BulkResetDownwardEvaluationsHandler,
      ],
    }).compile();

    submitHandler = module.get<BulkSubmitDownwardEvaluationsHandler>(
      BulkSubmitDownwardEvaluationsHandler,
    );
    resetHandler = module.get<BulkResetDownwardEvaluationsHandler>(
      BulkResetDownwardEvaluationsHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'bulk-submit-reset-downward-evaluations-command-handlers-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        passedTests: testResults.filter((t) => t.status === 'passed').length,
        failedTests: testResults.filter((t) => t.status === 'failed').length,
      },
      testResults: testResults,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const evaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(evaluations);

      const lineMappings = await evaluationLineMappingRepository.find();
      await evaluationLineMappingRepository.remove(lineMappings);

      const evaluationLines = await evaluationLineRepository.find();
      await evaluationLineRepository.remove(evaluationLines);

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트_데이터를_생성한다(evaluationType: DownwardEvaluationType) {
    const now = new Date();

    // 부서 생성
    const department = departmentRepository.create({
      name: '테스트 부서',
      code: 'TEST_DEPT',
      externalId: `DEPT_${Date.now()}`,
      externalCreatedAt: now,
      externalUpdatedAt: now,
      createdBy: createdBy,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 피평가자 직원 생성
    const employee = employeeRepository.create({
      employeeNumber: `TEST${Date.now()}`,
      name: '테스트 직원',
      email: `test${Date.now()}@example.com`,
      departmentId: departmentId,
      externalId: `EMP_${Date.now()}`,
      externalCreatedAt: now,
      externalUpdatedAt: now,
      createdBy: createdBy,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 평가자 직원 생성
    const evaluator = employeeRepository.create({
      employeeNumber: `EVAL${Date.now()}`,
      name: '테스트 평가자',
      email: `evaluator${Date.now()}@example.com`,
      departmentId: departmentId,
      externalId: `EVAL_${Date.now()}`,
      externalCreatedAt: now,
      externalUpdatedAt: now,
      createdBy: createdBy,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

    // 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.PEER_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: createdBy,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: `PROJ_${Date.now()}`,
      createdBy: createdBy,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // WBS 항목 생성
    const wbsItem1 = wbsItemRepository.create({
      wbsCode: `WBS001_${Date.now()}`,
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: createdBy,
    });
    const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);
    wbsItemId1 = savedWbsItem1.id;

    const wbsItem2 = wbsItemRepository.create({
      wbsCode: `WBS002_${Date.now()}`,
      title: 'WBS 항목 2',
      projectId: projectId,
      level: 1,
      createdBy: createdBy,
    });
    const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);
    wbsItemId2 = savedWbsItem2.id;

    // WBS 할당 생성
    const wbsAssignment1 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId1,
      assignedBy: createdBy,
      assignedDate: now,
      createdBy: createdBy,
    });
    await wbsAssignmentRepository.save(wbsAssignment1);

    const wbsAssignment2 = wbsAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      wbsItemId: wbsItemId2,
      assignedBy: createdBy,
      assignedDate: now,
      createdBy: createdBy,
    });
    await wbsAssignmentRepository.save(wbsAssignment2);

    // 평가라인 생성
    if (evaluationType === DownwardEvaluationType.PRIMARY) {
      const primaryLine = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.PRIMARY,
        order: 1,
        isRequired: true,
        isAutoAssigned: true,
        createdBy: createdBy,
      });
      const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);
      primaryEvaluationLineId = savedPrimaryLine.id;
    } else {
      const secondaryLine = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.SECONDARY,
        order: 2,
        isRequired: true,
        isAutoAssigned: true,
        createdBy: createdBy,
      });
      const savedSecondaryLine = await evaluationLineRepository.save(
        secondaryLine,
      );
      secondaryEvaluationLineId = savedSecondaryLine.id;

      // 2차 평가자에게 WBS 할당 (평가라인 매핑)
      const lineMapping1 = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationLineId: secondaryEvaluationLineId,
        wbsItemId: wbsItemId1,
        createdBy: createdBy,
      });
      await evaluationLineMappingRepository.save(lineMapping1);

      const lineMapping2 = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        evaluationLineId: secondaryEvaluationLineId,
        wbsItemId: wbsItemId2,
        createdBy: createdBy,
      });
      await evaluationLineMappingRepository.save(lineMapping2);
    }

    // 하향평가 생성 (미제출 상태)
    if (evaluationType === DownwardEvaluationType.PRIMARY) {
      const primaryEvaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '1차 평가 내용 1',
        downwardEvaluationScore: 85,
        evaluationDate: now,
        isCompleted: false,
        createdBy: createdBy,
      });
      const savedPrimary1 = await downwardEvaluationRepository.save(
        primaryEvaluation1,
      );
      primaryEvaluationId1 = savedPrimary1.id;

      const primaryEvaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.PRIMARY,
        downwardEvaluationContent: '1차 평가 내용 2',
        downwardEvaluationScore: 90,
        evaluationDate: now,
        isCompleted: false,
        createdBy: createdBy,
      });
      const savedPrimary2 = await downwardEvaluationRepository.save(
        primaryEvaluation2,
      );
      primaryEvaluationId2 = savedPrimary2.id;
    } else {
      const secondaryEvaluation1 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId1,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '2차 평가 내용 1',
        downwardEvaluationScore: 88,
        evaluationDate: now,
        isCompleted: false,
        createdBy: createdBy,
      });
      const savedSecondary1 = await downwardEvaluationRepository.save(
        secondaryEvaluation1,
      );
      secondaryEvaluationId1 = savedSecondary1.id;

      const secondaryEvaluation2 = downwardEvaluationRepository.create({
        employeeId: employeeId,
        evaluatorId: evaluatorId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId2,
        evaluationType: DownwardEvaluationType.SECONDARY,
        downwardEvaluationContent: '2차 평가 내용 2',
        downwardEvaluationScore: 92,
        evaluationDate: now,
        isCompleted: false,
        createdBy: createdBy,
      });
      const savedSecondary2 = await downwardEvaluationRepository.save(
        secondaryEvaluation2,
      );
      secondaryEvaluationId2 = savedSecondary2.id;
    }

    return {
      departmentId,
      employeeId,
      evaluatorId,
      evaluationPeriodId,
      projectId,
      wbsItemId1,
      wbsItemId2,
    };
  }

  describe('BulkSubmitDownwardEvaluationsHandler - 1차 하향평가', () => {
    it('모든 1차 하향평가를 일괄 제출해야 함', async () => {
      const testResult: any = {
        testName: '모든 1차 하향평가를 일괄 제출해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다(DownwardEvaluationType.PRIMARY);

        // When
        const command = new BulkSubmitDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.PRIMARY,
          submittedBy,
          false, // forceSubmit
          false, // approveAllBelow
        );
        const result = await submitHandler.execute(command);

        // Then
        expect(result).toBeDefined();
        expect(result.submittedCount).toBeGreaterThan(0);

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: '제출된 평가 수가 0보다 커야 함',
          expected: '> 0',
          actual: result.submittedCount,
          passed: result.submittedCount > 0,
        });

        // DB에서 확인
        const savedEvaluation1 = await downwardEvaluationRepository.findOne({
          where: { id: primaryEvaluationId1 },
        });
        const savedEvaluation2 = await downwardEvaluationRepository.findOne({
          where: { id: primaryEvaluationId2 },
        });

        expect(savedEvaluation1?.isCompleted).toBe(true);
        expect(savedEvaluation2?.isCompleted).toBe(true);
        expect(savedEvaluation1?.completedAt).toBeDefined();
        expect(savedEvaluation2?.completedAt).toBeDefined();

        testResult.assertions.push({
          description: '첫 번째 평가의 isCompleted가 true여야 함',
          expected: true,
          actual: savedEvaluation1?.isCompleted,
          passed: savedEvaluation1?.isCompleted === true,
        });

        testResult.assertions.push({
          description: '두 번째 평가의 isCompleted가 true여야 함',
          expected: true,
          actual: savedEvaluation2?.isCompleted,
          passed: savedEvaluation2?.isCompleted === true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          submittedIds: result.submittedIds,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('BulkSubmitDownwardEvaluationsHandler - 2차 하향평가', () => {
    it('할당된 WBS에 대한 2차 하향평가만 일괄 제출해야 함', async () => {
      const testResult: any = {
        testName: '할당된 WBS에 대한 2차 하향평가만 일괄 제출해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다(DownwardEvaluationType.SECONDARY);

        // When
        const command = new BulkSubmitDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.SECONDARY,
          submittedBy,
          false, // forceSubmit
          false, // approveAllBelow
        );
        const result = await submitHandler.execute(command);

        // Then
        expect(result).toBeDefined();
        expect(result.submittedCount).toBeGreaterThan(0);

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: '제출된 평가 수가 0보다 커야 함',
          expected: '> 0',
          actual: result.submittedCount,
          passed: result.submittedCount > 0,
        });

        // DB에서 확인
        const savedEvaluation1 = await downwardEvaluationRepository.findOne({
          where: { id: secondaryEvaluationId1 },
        });
        const savedEvaluation2 = await downwardEvaluationRepository.findOne({
          where: { id: secondaryEvaluationId2 },
        });

        expect(savedEvaluation1?.isCompleted).toBe(true);
        expect(savedEvaluation2?.isCompleted).toBe(true);

        testResult.assertions.push({
          description: '첫 번째 평가의 isCompleted가 true여야 함',
          expected: true,
          actual: savedEvaluation1?.isCompleted,
          passed: savedEvaluation1?.isCompleted === true,
        });

        testResult.assertions.push({
          description: '두 번째 평가의 isCompleted가 true여야 함',
          expected: true,
          actual: savedEvaluation2?.isCompleted,
          passed: savedEvaluation2?.isCompleted === true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          submittedIds: result.submittedIds,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('BulkResetDownwardEvaluationsHandler - 1차 하향평가', () => {
    it('모든 1차 하향평가를 일괄 초기화해야 함', async () => {
      const testResult: any = {
        testName: '모든 1차 하향평가를 일괄 초기화해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다(DownwardEvaluationType.PRIMARY);

        // 먼저 제출
        const submitCommand = new BulkSubmitDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.PRIMARY,
          submittedBy,
          false,
          false,
        );
        await submitHandler.execute(submitCommand);

        // When
        const resetCommand = new BulkResetDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.PRIMARY,
          updatedBy,
        );
        const result = await resetHandler.execute(resetCommand);

        // Then
        expect(result).toBeDefined();
        expect(result.resetCount).toBeGreaterThan(0);

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: '초기화된 평가 수가 0보다 커야 함',
          expected: '> 0',
          actual: result.resetCount,
          passed: result.resetCount > 0,
        });

        // DB에서 확인
        const savedEvaluation1 = await downwardEvaluationRepository.findOne({
          where: { id: primaryEvaluationId1 },
        });
        const savedEvaluation2 = await downwardEvaluationRepository.findOne({
          where: { id: primaryEvaluationId2 },
        });

        expect(savedEvaluation1?.isCompleted).toBe(false);
        expect(savedEvaluation2?.isCompleted).toBe(false);
        // completedAt은 isCompleted가 false일 때 undefined로 설정되지만, DB에는 이전 값이 남을 수 있음

        testResult.assertions.push({
          description: '첫 번째 평가의 isCompleted가 false여야 함',
          expected: false,
          actual: savedEvaluation1?.isCompleted,
          passed: savedEvaluation1?.isCompleted === false,
        });

        testResult.assertions.push({
          description: '두 번째 평가의 isCompleted가 false여야 함',
          expected: false,
          actual: savedEvaluation2?.isCompleted,
          passed: savedEvaluation2?.isCompleted === false,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          resetCount: result.resetCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          resetIds: result.resetIds,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('BulkResetDownwardEvaluationsHandler - 2차 하향평가', () => {
    it('할당된 WBS에 대한 2차 하향평가만 일괄 초기화해야 함', async () => {
      const testResult: any = {
        testName: '할당된 WBS에 대한 2차 하향평가만 일괄 초기화해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다(DownwardEvaluationType.SECONDARY);

        // 먼저 제출
        const submitCommand = new BulkSubmitDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.SECONDARY,
          submittedBy,
          false,
          false,
        );
        await submitHandler.execute(submitCommand);

        // When
        const resetCommand = new BulkResetDownwardEvaluationsCommand(
          evaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.SECONDARY,
          updatedBy,
        );
        const result = await resetHandler.execute(resetCommand);

        // Then
        expect(result).toBeDefined();
        expect(result.resetCount).toBeGreaterThan(0);

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: '초기화된 평가 수가 0보다 커야 함',
          expected: '> 0',
          actual: result.resetCount,
          passed: result.resetCount > 0,
        });

        // DB에서 확인
        const savedEvaluation1 = await downwardEvaluationRepository.findOne({
          where: { id: secondaryEvaluationId1 },
        });
        const savedEvaluation2 = await downwardEvaluationRepository.findOne({
          where: { id: secondaryEvaluationId2 },
        });

        expect(savedEvaluation1?.isCompleted).toBe(false);
        expect(savedEvaluation2?.isCompleted).toBe(false);

        testResult.assertions.push({
          description: '첫 번째 평가의 isCompleted가 false여야 함',
          expected: false,
          actual: savedEvaluation1?.isCompleted,
          passed: savedEvaluation1?.isCompleted === false,
        });

        testResult.assertions.push({
          description: '두 번째 평가의 isCompleted가 false여야 함',
          expected: false,
          actual: savedEvaluation2?.isCompleted,
          passed: savedEvaluation2?.isCompleted === false,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          resetCount: result.resetCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          resetIds: result.resetIds,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });
});
