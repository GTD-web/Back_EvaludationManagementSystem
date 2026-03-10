import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@libs/database/database.module';
import {
  SubmitAllWbsSelfEvaluationsForApprovalCommand,
  SubmitAllWbsSelfEvaluationsForApprovalHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-all-wbs-self-evaluations-for-approval.handler';
import {
  ResetAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ResetAllWbsSelfEvaluationsByEmployeePeriodHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/reset-all-wbs-self-evaluations.handler';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 자기평가 제출 Command Handler 테스트
 *
 * SubmitAllWbsSelfEvaluationsForApprovalHandler와 ResetAllWbsSelfEvaluationsByEmployeePeriodHandler의 동작을 검증합니다.
 */
describe('Self Evaluation Submission Command Handlers', () => {
  let submitHandler: SubmitAllWbsSelfEvaluationsForApprovalHandler;
  let resetHandler: ResetAllWbsSelfEvaluationsByEmployeePeriodHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let departmentId: string;
  let employeeId: string;
  let mappingId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let selfEvaluationId1: string;
  let selfEvaluationId2: string;

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
        PerformanceEvaluationContextModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          WbsSelfEvaluation,
          Project,
          WbsItem,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
        ]),
      ],
    }).compile();

    submitHandler = module.get<SubmitAllWbsSelfEvaluationsForApprovalHandler>(
      SubmitAllWbsSelfEvaluationsForApprovalHandler,
    );
    resetHandler = module.get<ResetAllWbsSelfEvaluationsByEmployeePeriodHandler>(
      ResetAllWbsSelfEvaluationsByEmployeePeriodHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    projectAssignmentRepository = dataSource.getRepository(
      EvaluationProjectAssignment,
    );
    wbsAssignmentRepository = dataSource.getRepository(
      EvaluationWbsAssignment,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'submit-all-wbs-self-evaluations-for-approval-command-handler-result.json',
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
      const selfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(selfEvaluations);

      const wbsAssignments = await wbsAssignmentRepository.find();
      await wbsAssignmentRepository.remove(wbsAssignments);

      const projectAssignments = await projectAssignmentRepository.find();
      await projectAssignmentRepository.remove(projectAssignments);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

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
  async function 테스트_데이터를_생성한다() {
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

    // 직원 생성
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

    // 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: createdBy,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: createdBy,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    // 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: `PROJ_${Date.now()}`,
      createdBy: createdBy,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 프로젝트 할당 생성
    const projectAssignment = projectAssignmentRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: projectId,
      assignedBy: createdBy,
      assignedDate: now,
      createdBy: createdBy,
    });
    await projectAssignmentRepository.save(projectAssignment);

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

    // 자기평가 생성 (제출 전 상태)
    const selfEvaluation1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId1,
      assignedBy: createdBy,
      assignedDate: now,
      evaluationDate: now,
      selfEvaluationContent: '자기평가 내용 1',
      selfEvaluationScore: 80,
      createdBy: createdBy,
    });
    const savedSelfEvaluation1 = await wbsSelfEvaluationRepository.save(
      selfEvaluation1,
    );
    selfEvaluationId1 = savedSelfEvaluation1.id;

    const selfEvaluation2 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId2,
      assignedBy: createdBy,
      assignedDate: now,
      evaluationDate: now,
      selfEvaluationContent: '자기평가 내용 2',
      selfEvaluationScore: 85,
      createdBy: createdBy,
    });
    const savedSelfEvaluation2 = await wbsSelfEvaluationRepository.save(
      selfEvaluation2,
    );
    selfEvaluationId2 = savedSelfEvaluation2.id;

    return {
      departmentId,
      employeeId,
      evaluationPeriodId,
      mappingId,
      projectId,
      wbsItemId1,
      wbsItemId2,
      selfEvaluationId1,
      selfEvaluationId2,
    };
  }

  describe('SubmitAllWbsSelfEvaluationsForApprovalHandler', () => {
    it('모든 자기평가를 승인 시 제출해야 함', async () => {
      const testResult: any = {
        testName: '모든 자기평가를 승인 시 제출해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();

        // When
        const command = new SubmitAllWbsSelfEvaluationsForApprovalCommand(
          employeeId,
          evaluationPeriodId,
          submittedBy,
        );
        const result = await submitHandler.execute(command);

        // Then
        expect(result).toBeDefined();
        expect(result.submittedCount).toBeGreaterThan(0);
        expect(result.completedEvaluations.length).toBeGreaterThan(0);

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
        const savedEvaluation1 = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluationId1 },
        });
        const savedEvaluation2 = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluationId2 },
        });

        expect(savedEvaluation1?.submittedToEvaluator).toBe(true);
        expect(savedEvaluation1?.submittedToManager).toBe(true);
        expect(savedEvaluation2?.submittedToEvaluator).toBe(true);
        expect(savedEvaluation2?.submittedToManager).toBe(true);

        testResult.assertions.push({
          description: '첫 번째 자기평가의 submittedToEvaluator가 true여야 함',
          expected: true,
          actual: savedEvaluation1?.submittedToEvaluator,
          passed: savedEvaluation1?.submittedToEvaluator === true,
        });

        testResult.assertions.push({
          description: '첫 번째 자기평가의 submittedToManager가 true여야 함',
          expected: true,
          actual: savedEvaluation1?.submittedToManager,
          passed: savedEvaluation1?.submittedToManager === true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          submittedCount: result.submittedCount,
          failedCount: result.failedCount,
          totalCount: result.totalCount,
          completedEvaluationsCount: result.completedEvaluations.length,
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

  describe('ResetAllWbsSelfEvaluationsByEmployeePeriodHandler', () => {
    it('모든 자기평가 제출을 초기화해야 함', async () => {
      const testResult: any = {
        testName: '모든 자기평가 제출을 초기화해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();

        // 먼저 제출
        const submitCommand = new SubmitAllWbsSelfEvaluationsForApprovalCommand(
          employeeId,
          evaluationPeriodId,
          submittedBy,
        );
        await submitHandler.execute(submitCommand);

        // When
        const resetCommand = new ResetAllWbsSelfEvaluationsByEmployeePeriodCommand(
          employeeId,
          evaluationPeriodId,
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
        const savedEvaluation1 = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluationId1 },
        });
        const savedEvaluation2 = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluationId2 },
        });

        expect(savedEvaluation1?.submittedToEvaluator).toBe(false);
        expect(savedEvaluation1?.submittedToManager).toBe(false);
        expect(savedEvaluation2?.submittedToEvaluator).toBe(false);
        expect(savedEvaluation2?.submittedToManager).toBe(false);

        testResult.assertions.push({
          description: '첫 번째 자기평가의 submittedToEvaluator가 false여야 함',
          expected: false,
          actual: savedEvaluation1?.submittedToEvaluator,
          passed: savedEvaluation1?.submittedToEvaluator === false,
        });

        testResult.assertions.push({
          description: '첫 번째 자기평가의 submittedToManager가 false여야 함',
          expected: false,
          actual: savedEvaluation1?.submittedToManager,
          passed: savedEvaluation1?.submittedToManager === false,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          resetCount: result.resetCount,
          failedCount: result.failedCount,
          totalCount: result.totalCount,
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
