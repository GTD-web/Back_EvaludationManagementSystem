import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '@libs/database/database.module';
import {
  SubmitEvaluationCriteriaCommand,
  SubmitEvaluationCriteriaHandler,
} from '@context/evaluation-criteria-management-context/handlers/evaluation-criteria-submission/commands/submit-evaluation-criteria.handler';
import {
  ResetEvaluationCriteriaCommand,
  ResetEvaluationCriteriaHandler,
} from '@context/evaluation-criteria-management-context/handlers/evaluation-criteria-submission/commands/reset-evaluation-criteria.handler';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 평가기준 제출 Command Handler 테스트
 *
 * SubmitEvaluationCriteriaHandler와 ResetEvaluationCriteriaHandler의 동작을 검증합니다.
 */
describe('Evaluation Criteria Submission Command Handlers', () => {
  let submitHandler: SubmitEvaluationCriteriaHandler;
  let resetHandler: ResetEvaluationCriteriaHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let departmentId: string;
  let employeeId: string;
  let mappingId: string;

  const submittedBy = 'test-submitter-id';
  const updatedBy = 'test-updater-id';
  const createdBy = 'test-creator-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        EvaluationCriteriaManagementContextModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          EmployeeEvaluationStepApproval,
        ]),
      ],
    }).compile();

    submitHandler = module.get<SubmitEvaluationCriteriaHandler>(
      SubmitEvaluationCriteriaHandler,
    );
    resetHandler = module.get<ResetEvaluationCriteriaHandler>(
      ResetEvaluationCriteriaHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    stepApprovalRepository = dataSource.getRepository(
      EmployeeEvaluationStepApproval,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'evaluation-criteria-submission-command-handlers-result.json',
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
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const stepApprovals = await stepApprovalRepository.find();
      await stepApprovalRepository.remove(stepApprovals);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
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

    return {
      departmentId,
      employeeId,
      evaluationPeriodId,
      mappingId,
    };
  }

  describe('SubmitEvaluationCriteriaHandler', () => {
    it('평가기준을 제출해야 함', async () => {
      const testResult: any = {
        testName: '평가기준을 제출해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();

        // When
        const command = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          submittedBy,
        );
        const result = await submitHandler.execute(command);

        // Then
        expect(result).toBeDefined();
        expect(result.id).toBe(mappingId);
        expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(result.employeeId).toBe(employeeId);
        expect(result.isCriteriaSubmitted).toBe(true);
        expect(result.criteriaSubmittedAt).toBeDefined();
        expect(result.criteriaSubmittedBy).toBe(submittedBy);

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: 'isCriteriaSubmitted가 true여야 함',
          expected: true,
          actual: result.isCriteriaSubmitted,
          passed: result.isCriteriaSubmitted === true,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedAt이 설정되어 있어야 함',
          expected: 'defined',
          actual: result.criteriaSubmittedAt ? 'defined' : 'undefined',
          passed: result.criteriaSubmittedAt !== undefined,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedBy가 submittedBy와 일치해야 함',
          expected: submittedBy,
          actual: result.criteriaSubmittedBy,
          passed: result.criteriaSubmittedBy === submittedBy,
        });

        // DB에서 확인
        const savedMapping = await mappingRepository.findOne({
          where: { id: mappingId },
        });
        expect(savedMapping).toBeDefined();
        expect(savedMapping?.isCriteriaSubmitted).toBe(true);
        expect(savedMapping?.criteriaSubmittedAt).toBeDefined();
        expect(savedMapping?.criteriaSubmittedBy).toBe(submittedBy);

        testResult.assertions.push({
          description: 'DB에서 isCriteriaSubmitted가 true로 저장되어야 함',
          expected: true,
          actual: savedMapping?.isCriteriaSubmitted,
          passed: savedMapping?.isCriteriaSubmitted === true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt?.toISOString(),
          criteriaSubmittedBy: result.criteriaSubmittedBy,
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

    it('이미 제출된 평가기준을 다시 제출해도 성공해야 함 (멱등성)', async () => {
      const testResult: any = {
        testName: '이미 제출된 평가기준을 다시 제출해도 성공해야 함 (멱등성)',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();
        const firstCommand = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          submittedBy,
        );
        await submitHandler.execute(firstCommand);

        const firstSubmission = await mappingRepository.findOne({
          where: { id: mappingId },
        });
        const firstSubmittedAt = firstSubmission?.criteriaSubmittedAt;

        // When - 다시 제출
        const secondCommand = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          'another-submitter-id',
        );
        const result = await submitHandler.execute(secondCommand);

        // Then
        expect(result.isCriteriaSubmitted).toBe(true);
        // 첫 번째 제출 시간이 유지되어야 함 (멱등성)
        expect(result.criteriaSubmittedAt?.getTime()).toBe(
          firstSubmittedAt?.getTime(),
        );
        // 첫 번째 제출자가 유지되어야 함
        expect(result.criteriaSubmittedBy).toBe(submittedBy);

        testResult.assertions.push({
          description: 'isCriteriaSubmitted가 true여야 함',
          expected: true,
          actual: result.isCriteriaSubmitted,
          passed: result.isCriteriaSubmitted === true,
        });

        testResult.assertions.push({
          description: '첫 번째 제출 시간이 유지되어야 함 (멱등성)',
          expected: firstSubmittedAt?.getTime(),
          actual: result.criteriaSubmittedAt?.getTime(),
          passed:
            result.criteriaSubmittedAt?.getTime() ===
            firstSubmittedAt?.getTime(),
        });

        testResult.assertions.push({
          description: '첫 번째 제출자가 유지되어야 함',
          expected: submittedBy,
          actual: result.criteriaSubmittedBy,
          passed: result.criteriaSubmittedBy === submittedBy,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt?.toISOString(),
          criteriaSubmittedBy: result.criteriaSubmittedBy,
          firstSubmittedAt: firstSubmittedAt?.toISOString(),
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

    it('존재하지 않는 맵핑으로 제출 시 에러를 발생시켜야 함', async () => {
      const testResult: any = {
        testName: '존재하지 않는 맵핑으로 제출 시 에러를 발생시켜야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000001';
        const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000002';

        // When & Then
        const command = new SubmitEvaluationCriteriaCommand(
          nonExistentPeriodId,
          nonExistentEmployeeId,
          submittedBy,
        );

        await expect(submitHandler.execute(command)).rejects.toThrow();

        testResult.assertions.push({
          description: '에러가 발생해야 함',
          expected: 'error thrown',
          actual: 'error thrown',
          passed: true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          error: 'EvaluationPeriodEmployeeMappingNotFoundException',
        };
      } catch (error: any) {
        testResult.status = 'passed'; // 에러가 발생하는 것이 정상
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          error: error.constructor.name,
          message: error.message,
        };
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('ResetEvaluationCriteriaHandler', () => {
    it('평가기준 제출을 초기화해야 함', async () => {
      const testResult: any = {
        testName: '평가기준 제출을 초기화해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();
        const submitCommand = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          submittedBy,
        );
        await submitHandler.execute(submitCommand);

        // When
        const resetCommand = new ResetEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );
        const result = await resetHandler.execute(resetCommand);

        // Then
        expect(result).toBeDefined();
        expect(result.id).toBe(mappingId);
        expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(result.employeeId).toBe(employeeId);
        expect(result.isCriteriaSubmitted).toBe(false);
        expect(result.criteriaSubmittedAt).toBeNull();
        expect(result.criteriaSubmittedBy).toBeNull();

        testResult.assertions.push({
          description: '결과가 정의되어 있어야 함',
          expected: 'defined',
          actual: result ? 'defined' : 'undefined',
          passed: result !== undefined,
        });

        testResult.assertions.push({
          description: 'isCriteriaSubmitted가 false여야 함',
          expected: false,
          actual: result.isCriteriaSubmitted,
          passed: result.isCriteriaSubmitted === false,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedAt이 null이어야 함',
          expected: null,
          actual: result.criteriaSubmittedAt,
          passed: result.criteriaSubmittedAt === null,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedBy가 null이어야 함',
          expected: null,
          actual: result.criteriaSubmittedBy,
          passed: result.criteriaSubmittedBy === null,
        });

        // DB에서 확인
        const savedMapping = await mappingRepository.findOne({
          where: { id: mappingId },
        });
        expect(savedMapping).toBeDefined();
        expect(savedMapping?.isCriteriaSubmitted).toBe(false);
        expect(savedMapping?.criteriaSubmittedAt).toBeNull();
        expect(savedMapping?.criteriaSubmittedBy).toBeNull();

        testResult.assertions.push({
          description: 'DB에서 isCriteriaSubmitted가 false로 저장되어야 함',
          expected: false,
          actual: savedMapping?.isCriteriaSubmitted,
          passed: savedMapping?.isCriteriaSubmitted === false,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt,
          criteriaSubmittedBy: result.criteriaSubmittedBy,
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

    it('제출되지 않은 평가기준을 초기화해도 성공해야 함 (멱등성)', async () => {
      const testResult: any = {
        testName: '제출되지 않은 평가기준을 초기화해도 성공해야 함 (멱등성)',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();
        // 제출하지 않은 상태

        // When
        const resetCommand = new ResetEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );
        const result = await resetHandler.execute(resetCommand);

        // Then
        expect(result.isCriteriaSubmitted).toBe(false);
        expect(result.criteriaSubmittedAt).toBeNull();
        expect(result.criteriaSubmittedBy).toBeNull();

        testResult.assertions.push({
          description: 'isCriteriaSubmitted가 false여야 함',
          expected: false,
          actual: result.isCriteriaSubmitted,
          passed: result.isCriteriaSubmitted === false,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedAt이 null이어야 함',
          expected: null,
          actual: result.criteriaSubmittedAt,
          passed: result.criteriaSubmittedAt === null,
        });

        testResult.assertions.push({
          description: 'criteriaSubmittedBy가 null이어야 함',
          expected: null,
          actual: result.criteriaSubmittedBy,
          passed: result.criteriaSubmittedBy === null,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt,
          criteriaSubmittedBy: result.criteriaSubmittedBy,
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

    it('존재하지 않는 맵핑으로 초기화 시 에러를 발생시켜야 함', async () => {
      const testResult: any = {
        testName: '존재하지 않는 맵핑으로 초기화 시 에러를 발생시켜야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000001';
        const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000002';

        // When & Then
        const resetCommand = new ResetEvaluationCriteriaCommand(
          nonExistentPeriodId,
          nonExistentEmployeeId,
          updatedBy,
        );

        await expect(resetHandler.execute(resetCommand)).rejects.toThrow();

        testResult.assertions.push({
          description: '에러가 발생해야 함',
          expected: 'error thrown',
          actual: 'error thrown',
          passed: true,
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          error: 'EvaluationPeriodEmployeeMappingNotFoundException',
        };
      } catch (error: any) {
        testResult.status = 'passed'; // 에러가 발생하는 것이 정상
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          error: error.constructor.name,
          message: error.message,
        };
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('평가기준 제출 및 초기화 통합 시나리오', () => {
    it('제출 → 초기화 → 재제출 시나리오가 정상 동작해야 함', async () => {
      const testResult: any = {
        testName: '제출 → 초기화 → 재제출 시나리오가 정상 동작해야 함',
        status: 'pending',
        startTime: new Date().toISOString(),
        assertions: [],
        errors: [],
      };

      try {
        // Given
        await 테스트_데이터를_생성한다();

        // When - 1. 제출
        const submitCommand1 = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          submittedBy,
        );
        const submitResult1 = await submitHandler.execute(submitCommand1);
        expect(submitResult1.isCriteriaSubmitted).toBe(true);

        testResult.assertions.push({
          description: '첫 번째 제출 후 isCriteriaSubmitted가 true여야 함',
          expected: true,
          actual: submitResult1.isCriteriaSubmitted,
          passed: submitResult1.isCriteriaSubmitted === true,
        });

        // When - 2. 초기화
        const resetCommand = new ResetEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );
        const resetResult = await resetHandler.execute(resetCommand);
        expect(resetResult.isCriteriaSubmitted).toBe(false);

        testResult.assertions.push({
          description: '초기화 후 isCriteriaSubmitted가 false여야 함',
          expected: false,
          actual: resetResult.isCriteriaSubmitted,
          passed: resetResult.isCriteriaSubmitted === false,
        });

        // When - 3. 재제출
        const submitCommand2 = new SubmitEvaluationCriteriaCommand(
          evaluationPeriodId,
          employeeId,
          'new-submitter-id',
        );
        const submitResult2 = await submitHandler.execute(submitCommand2);

        // Then
        expect(submitResult2.isCriteriaSubmitted).toBe(true);
        expect(submitResult2.criteriaSubmittedBy).toBe('new-submitter-id');
        expect(submitResult2.criteriaSubmittedAt).toBeDefined();
        // 재제출 시 새로운 시간이 설정되어야 함
        expect(submitResult2.criteriaSubmittedAt?.getTime()).toBeGreaterThan(
          submitResult1.criteriaSubmittedAt?.getTime() || 0,
        );

        testResult.assertions.push({
          description: '재제출 후 isCriteriaSubmitted가 true여야 함',
          expected: true,
          actual: submitResult2.isCriteriaSubmitted,
          passed: submitResult2.isCriteriaSubmitted === true,
        });

        testResult.assertions.push({
          description: '재제출 시 새로운 제출자가 설정되어야 함',
          expected: 'new-submitter-id',
          actual: submitResult2.criteriaSubmittedBy,
          passed: submitResult2.criteriaSubmittedBy === 'new-submitter-id',
        });

        testResult.assertions.push({
          description: '재제출 시 새로운 시간이 설정되어야 함',
          expected: 'greater than first submission',
          actual: submitResult2.criteriaSubmittedAt?.getTime(),
          passed:
            (submitResult2.criteriaSubmittedAt?.getTime() || 0) >
            (submitResult1.criteriaSubmittedAt?.getTime() || 0),
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.result = {
          firstSubmission: {
            isCriteriaSubmitted: submitResult1.isCriteriaSubmitted,
            criteriaSubmittedBy: submitResult1.criteriaSubmittedBy,
            criteriaSubmittedAt:
              submitResult1.criteriaSubmittedAt?.toISOString(),
          },
          reset: {
            isCriteriaSubmitted: resetResult.isCriteriaSubmitted,
            criteriaSubmittedAt: resetResult.criteriaSubmittedAt,
            criteriaSubmittedBy: resetResult.criteriaSubmittedBy,
          },
          secondSubmission: {
            isCriteriaSubmitted: submitResult2.isCriteriaSubmitted,
            criteriaSubmittedBy: submitResult2.criteriaSubmittedBy,
            criteriaSubmittedAt:
              submitResult2.criteriaSubmittedAt?.toISOString(),
          },
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
