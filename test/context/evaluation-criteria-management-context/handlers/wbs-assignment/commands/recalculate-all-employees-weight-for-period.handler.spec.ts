import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DatabaseModule } from '@libs/database/database.module';
import {
  RecalculateAllEmployeesWeightForPeriodCommand,
  RecalculateAllEmployeesWeightForPeriodHandler,
} from '@context/evaluation-criteria-management-context/handlers/wbs-assignment/commands/recalculate-all-employees-weight-for-period.handler';
import { WbsAssignmentWeightCalculationService } from '@context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectGrade } from '@domain/common/project/project.types';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';

function createTestResult(testName: string) {
  return {
    testName,
    status: 'running' as 'running' | 'passed' | 'failed',
    startTime: new Date().toISOString(),
    endTime: '' as string,
    errors: [] as any[],
    assertions: [] as any[],
    data: {} as any,
  };
}

describe('RecalculateAllEmployeesWeightForPeriodHandler - 평가기간 전체 직원 가중치 재계산', () => {
  let handler: RecalculateAllEmployeesWeightForPeriodHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employee1Id: string;
  let employee2Id: string;
  let employee3Id: string;
  let departmentId: string;
  let project1Id: string;
  let project2Id: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const maxSelfEvaluationRate = 120;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          Project,
          WbsItem,
          WbsSelfEvaluation,
        ]),
        WbsSelfEvaluationModule,
      ],
      providers: [
        RecalculateAllEmployeesWeightForPeriodHandler,
        WbsAssignmentWeightCalculationService,
        TransactionManagerService,
      ],
    }).compile();

    handler = module.get<RecalculateAllEmployeesWeightForPeriodHandler>(
      RecalculateAllEmployeesWeightForPeriodHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(EvaluationPeriodEmployeeMapping);
    projectAssignmentRepository = dataSource.getRepository(EvaluationProjectAssignment);
    wbsAssignmentRepository = dataSource.getRepository(EvaluationWbsAssignment);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);

    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'recalculate-all-employees-weight-for-period-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.length,
        passed: testResults.filter((r) => r.status === 'passed').length,
        failed: testResults.filter((r) => r.status === 'failed').length,
      },
      testResults: testResults,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    await module.close();
  });

  beforeEach(async () => {
    // 테이블 초기화
    await dataSource.query('TRUNCATE TABLE "wbs_self_evaluation" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_wbs_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_project_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_period_employee_mapping" CASCADE');
    await dataSource.query('TRUNCATE TABLE "wbs_item" CASCADE');
    await dataSource.query('TRUNCATE TABLE "project" CASCADE');
    await dataSource.query('TRUNCATE TABLE "employee" CASCADE');
    await dataSource.query('TRUNCATE TABLE "department" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_period" CASCADE');

    // 부서 생성
    const department = departmentRepository.create({
      id: randomUUID(),
      name: '테스트 부서',
      code: 'DEPT001',
      externalId: 'EXT_DEPT001',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 직원 생성
    const employee1 = employeeRepository.create({
      id: randomUUID(),
      employeeNumber: 'E001',
      name: '테스트 직원 1',
      email: 'test1@example.com',
      externalId: 'EXT_EMP001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee1 = await employeeRepository.save(employee1);
    employee1Id = savedEmployee1.id;

    const employee2 = employeeRepository.create({
      id: randomUUID(),
      employeeNumber: 'E002',
      name: '테스트 직원 2',
      email: 'test2@example.com',
      externalId: 'EXT_EMP002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee2 = await employeeRepository.save(employee2);
    employee2Id = savedEmployee2.id;

    const employee3 = employeeRepository.create({
      id: randomUUID(),
      employeeNumber: 'E003',
      name: '테스트 직원 3',
      email: 'test3@example.com',
      externalId: 'EXT_EMP003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee3 = await employeeRepository.save(employee3);
    employee3Id = savedEmployee3.id;

    // 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      id: randomUUID(),
      name: '2024년 상반기 평가',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      maxSelfEvaluationRate: maxSelfEvaluationRate,
      gradeRanges: [
        { grade: 'S', minRange: 96, maxRange: 120 },
        { grade: 'A', minRange: 90, maxRange: 95 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ],
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 평가기간-직원 매핑 생성
    const mapping1 = mappingRepository.create({
      id: randomUUID(),
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employee1Id,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping1);

    const mapping2 = mappingRepository.create({
      id: randomUUID(),
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employee2Id,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping2);

    const mapping3 = mappingRepository.create({
      id: randomUUID(),
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employee3Id,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping3);
  });

  describe('평가기간 전체 직원 가중치 재계산', () => {
    it('여러 직원의 가중치가 올바르게 재계산되어야 한다', async () => {
      const testResult = createTestResult('여러 직원의 가중치가 올바르게 재계산되어야 한다');
      try {
        // 프로젝트 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const project2 = Project.생성한다(
          {
            name: '프로젝트 2A',
            projectCode: 'P2A',
            grade: ProjectGrade.GRADE_2A,
          },
          systemAdminId,
        );
        const savedProject2 = await projectRepository.save(project2);
        project2Id = savedProject2.id;

        // WBS 아이템 생성
        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        const wbsItem2 = WbsItem.생성한다(
          {
            wbsCode: 'W2-1',
            title: 'WBS 2-1',
            projectId: project2Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);

        // 직원1: 프로젝트1에 WBS 1개 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1);

        // 직원2: 프로젝트1에 WBS 1개 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee2Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment2 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee2Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment2);

        // 직원3: 프로젝트2에 WBS 1개 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee3Id,
            projectId: project2Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment3 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee3Id,
          projectId: project2Id,
          wbsItemId: savedWbsItem2.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment3);

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        testResult.assertions.push({
          description: '총 직원 수가 올바르게 반환되어야 함',
          expected: 3,
          actual: result.totalEmployees,
          passed: result.totalEmployees === 3,
        });

        testResult.assertions.push({
          description: '성공한 직원 수가 올바르게 반환되어야 함',
          expected: 3,
          actual: result.successCount,
          passed: result.successCount === 3,
        });

        testResult.assertions.push({
          description: '실패한 직원 수가 0이어야 함',
          expected: 0,
          actual: result.errorCount,
          passed: result.errorCount === 0,
        });

        expect(result.totalEmployees).toBe(3);
        expect(result.successCount).toBe(3);
        expect(result.errorCount).toBe(0);

        // 가중치 검증
        const updatedAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId },
          order: { displayOrder: 'ASC' },
        });

        // 직원1: 1A 등급(우선순위 6), WBS 1개 -> 가중치 120
        // 직원2: 1A 등급(우선순위 6), WBS 1개 -> 가중치 120
        // 직원3: 2A 등급(우선순위 4), WBS 1개 -> 가중치 120
        const employee1Assignment = updatedAssignments.find(
          (a) => a.employeeId === employee1Id,
        );
        const employee2Assignment = updatedAssignments.find(
          (a) => a.employeeId === employee2Id,
        );
        const employee3Assignment = updatedAssignments.find(
          (a) => a.employeeId === employee3Id,
        );

        testResult.assertions.push({
          description: '직원1의 가중치가 올바르게 계산되어야 함',
          expected: 120,
          actual: employee1Assignment?.weight,
          passed: employee1Assignment?.weight === 120,
        });

        testResult.assertions.push({
          description: '직원2의 가중치가 올바르게 계산되어야 함',
          expected: 120,
          actual: employee2Assignment?.weight,
          passed: employee2Assignment?.weight === 120,
        });

        testResult.assertions.push({
          description: '직원3의 가중치가 올바르게 계산되어야 함',
          expected: 120,
          actual: employee3Assignment?.weight,
          passed: employee3Assignment?.weight === 120,
        });

        expect(employee1Assignment?.weight).toBe(120);
        expect(employee2Assignment?.weight).toBe(120);
        expect(employee3Assignment?.weight).toBe(120);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          weights: {
            employee1: employee1Assignment?.weight,
            employee2: employee2Assignment?.weight,
            employee3: employee3Assignment?.weight,
          },
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('할당된 직원이 없을 때 올바르게 처리되어야 한다', async () => {
      const testResult = createTestResult('할당된 직원이 없을 때 올바르게 처리되어야 한다');
      try {
        // 빈 평가기간에 대한 커맨드 실행
        const emptyPeriod = evaluationPeriodRepository.create({
          id: randomUUID(),
          name: '빈 평가기간',
          startDate: new Date('2024-01-01'),
          status: EvaluationPeriodStatus.IN_PROGRESS,
          currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
          maxSelfEvaluationRate: maxSelfEvaluationRate,
          createdBy: systemAdminId,
        });
        const savedEmptyPeriod = await evaluationPeriodRepository.save(emptyPeriod);

        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          savedEmptyPeriod.id,
        );
        const result = await handler.execute(command);

        testResult.assertions.push({
          description: '총 직원 수가 0이어야 함',
          expected: 0,
          actual: result.totalEmployees,
          passed: result.totalEmployees === 0,
        });

        testResult.assertions.push({
          description: '성공한 직원 수가 0이어야 함',
          expected: 0,
          actual: result.successCount,
          passed: result.successCount === 0,
        });

        testResult.assertions.push({
          description: '실패한 직원 수가 0이어야 함',
          expected: 0,
          actual: result.errorCount,
          passed: result.errorCount === 0,
        });

        expect(result.totalEmployees).toBe(0);
        expect(result.successCount).toBe(0);
        expect(result.errorCount).toBe(0);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = { result };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('복잡한 프로젝트 조합에서 가중치가 올바르게 재계산되어야 한다', async () => {
      const testResult = createTestResult('복잡한 프로젝트 조합에서 가중치가 올바르게 재계산되어야 한다');
      try {
        // 프로젝트 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        // WBS 아이템 생성
        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        const wbsItem2 = WbsItem.생성한다(
          {
            wbsCode: 'W1-2',
            title: 'WBS 1-2',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);

        // 직원1: 프로젝트1에 WBS 2개 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1_1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1_1);

        const wbsAssignment1_2 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem2.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 1,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1_2);

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.totalEmployees).toBe(1);
        expect(result.successCount).toBe(1);
        expect(result.errorCount).toBe(0);

        // 가중치 검증: 1A 등급(우선순위 6), WBS 2개 -> 각각 60 (6/2 = 3, 정규화 후 60)
        const updatedAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employee1Id },
          order: { displayOrder: 'ASC' },
        });

        const totalWeight = updatedAssignments.reduce(
          (sum, a) => sum + a.weight,
          0,
        );

        testResult.assertions.push({
          description: '직원1의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          totalWeight,
          weights: updatedAssignments.map((a) => ({
            wbsItemId: a.wbsItemId,
            weight: a.weight,
          })),
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('대량 직원(10명 이상)의 가중치가 올바르게 재계산되어야 한다', async () => {
      const testResult = createTestResult('대량 직원(10명 이상)의 가중치가 올바르게 재계산되어야 한다');
      try {
        const employeeCount = 15;
        const employeeIds: string[] = [];

        // 15명의 직원 생성
        for (let i = 0; i < employeeCount; i++) {
          const uniqueId = randomUUID().substring(0, 8);
          const employee = employeeRepository.create({
            id: randomUUID(),
            employeeNumber: `E${String(i + 1).padStart(3, '0')}_${uniqueId}`,
            name: `테스트 직원 ${i + 1}`,
            email: `test${i + 1}_${uniqueId}@example.com`,
            externalId: `EXT_EMP${String(i + 1).padStart(3, '0')}_${uniqueId}`,
            departmentId: departmentId,
            status: '재직중',
            createdBy: systemAdminId,
          });
          const savedEmployee = await employeeRepository.save(employee);
          employeeIds.push(savedEmployee.id);

          // 평가기간-직원 매핑 생성
          const mapping = mappingRepository.create({
            id: randomUUID(),
            evaluationPeriodId: evaluationPeriodId,
            employeeId: savedEmployee.id,
            createdBy: systemAdminId,
          });
          await mappingRepository.save(mapping);
        }

        // 프로젝트 생성 (다양한 등급)
        const projects = [
          { name: '프로젝트 1A', code: 'P1A', grade: ProjectGrade.GRADE_1A },
          { name: '프로젝트 1B', code: 'P1B', grade: ProjectGrade.GRADE_1B },
          { name: '프로젝트 2A', code: 'P2A', grade: ProjectGrade.GRADE_2A },
          { name: '프로젝트 2B', code: 'P2B', grade: ProjectGrade.GRADE_2B },
          { name: '프로젝트 3A', code: 'P3A', grade: ProjectGrade.GRADE_3A },
        ];

        const savedProjects: { id: string; grade: ProjectGrade }[] = [];
        for (const projectData of projects) {
          const project = Project.생성한다(
            {
              name: projectData.name,
              projectCode: projectData.code,
              grade: projectData.grade,
            },
            systemAdminId,
          );
          const savedProject = await projectRepository.save(project);
          savedProjects.push({ id: savedProject.id, grade: projectData.grade });

          // 각 프로젝트에 WBS 2개씩 생성
          for (let wbsIndex = 0; wbsIndex < 2; wbsIndex++) {
            const wbsItem = WbsItem.생성한다(
              {
                wbsCode: `${projectData.code}-W${wbsIndex + 1}`,
                title: `WBS ${wbsIndex + 1}`,
                projectId: savedProject.id,
                level: 1,
                status: WbsItemStatus.PENDING,
              },
              systemAdminId,
            );
            await wbsItemRepository.save(wbsItem);
          }
        }

        // 각 직원에게 랜덤하게 프로젝트 할당
        for (let i = 0; i < employeeIds.length; i++) {
          const projectIndex = i % savedProjects.length;
          const project = savedProjects[projectIndex];

          // 프로젝트 할당
          await projectAssignmentRepository.save(
            projectAssignmentRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeIds[i],
              projectId: project.id,
              assignedBy: systemAdminId,
              assignedDate: new Date(),
              displayOrder: 0,
              createdBy: systemAdminId,
            }),
          );

          // 해당 프로젝트의 WBS 할당
          const wbsItems = await wbsItemRepository.find({
            where: { projectId: project.id },
          });

          for (let j = 0; j < wbsItems.length; j++) {
            const wbsAssignment = wbsAssignmentRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeIds[i],
              projectId: project.id,
              wbsItemId: wbsItems[j].id,
              assignedBy: systemAdminId,
              assignedDate: new Date(),
              displayOrder: j,
              weight: 0,
              createdBy: systemAdminId,
            });
            await wbsAssignmentRepository.save(wbsAssignment);
          }
        }

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const startTime = Date.now();
        const result = await handler.execute(command);
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // 결과 검증
        testResult.assertions.push({
          description: `총 직원 수가 ${employeeCount}명이어야 함`,
          expected: employeeCount,
          actual: result.totalEmployees,
          passed: result.totalEmployees === employeeCount,
        });

        testResult.assertions.push({
          description: `성공한 직원 수가 ${employeeCount}명이어야 함`,
          expected: employeeCount,
          actual: result.successCount,
          passed: result.successCount === employeeCount,
        });

        testResult.assertions.push({
          description: '실패한 직원 수가 0이어야 함',
          expected: 0,
          actual: result.errorCount,
          passed: result.errorCount === 0,
        });

        expect(result.totalEmployees).toBe(employeeCount);
        expect(result.successCount).toBe(employeeCount);
        expect(result.errorCount).toBe(0);

        // 모든 직원의 가중치 검증
        const allAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId },
        });

        const employeeWeightMap = new Map<string, number>();
        allAssignments.forEach((assignment) => {
          const currentWeight = employeeWeightMap.get(assignment.employeeId) || 0;
          employeeWeightMap.set(assignment.employeeId, currentWeight + assignment.weight);
        });

        let correctWeightCount = 0;
        for (const [employeeId, totalWeight] of employeeWeightMap.entries()) {
          if (Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01) {
            correctWeightCount++;
          }
        }

        testResult.assertions.push({
          description: '모든 직원의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: employeeCount,
          actual: correctWeightCount,
          passed: correctWeightCount === employeeCount,
        });

        expect(correctWeightCount).toBe(employeeCount);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          employeeCount,
          executionTimeMs: executionTime,
          correctWeightCount,
          sampleWeights: Array.from(employeeWeightMap.entries())
            .slice(0, 5)
            .map(([id, weight]) => ({ employeeId: id, totalWeight: weight })),
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('직원당 여러 프로젝트 할당 시 가중치가 올바르게 재계산되어야 한다', async () => {
      const testResult = createTestResult('직원당 여러 프로젝트 할당 시 가중치가 올바르게 재계산되어야 한다');
      try {
        // 다양한 등급의 프로젝트 생성
        const projects = [
          { name: '프로젝트 1A', code: 'P1A', grade: ProjectGrade.GRADE_1A },
          { name: '프로젝트 1B', code: 'P1B', grade: ProjectGrade.GRADE_1B },
          { name: '프로젝트 2A', code: 'P2A', grade: ProjectGrade.GRADE_2A },
          { name: '프로젝트 2B', code: 'P2B', grade: ProjectGrade.GRADE_2B },
        ];

        const savedProjects: { id: string; grade: ProjectGrade; wbsItems: string[] }[] = [];

        for (const projectData of projects) {
          const project = Project.생성한다(
            {
              name: projectData.name,
              projectCode: projectData.code,
              grade: projectData.grade,
            },
            systemAdminId,
          );
          const savedProject = await projectRepository.save(project);

          const wbsItemIds: string[] = [];
          // 프로젝트별로 다른 수의 WBS 생성
          const wbsCount = projectData.grade === ProjectGrade.GRADE_1A ? 3 : 2;

          for (let i = 0; i < wbsCount; i++) {
            const wbsItem = WbsItem.생성한다(
              {
                wbsCode: `${projectData.code}-W${i + 1}`,
                title: `WBS ${i + 1}`,
                projectId: savedProject.id,
                level: 1,
                status: WbsItemStatus.PENDING,
              },
              systemAdminId,
            );
            const savedWbsItem = await wbsItemRepository.save(wbsItem);
            wbsItemIds.push(savedWbsItem.id);
          }

          savedProjects.push({
            id: savedProject.id,
            grade: projectData.grade,
            wbsItems: wbsItemIds,
          });
        }

        // 직원1: 프로젝트 1A, 1B 할당 (총 5개 WBS)
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: savedProjects[0].id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: savedProjects[1].id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 1,
            createdBy: systemAdminId,
          }),
        );

        for (let i = 0; i < savedProjects[0].wbsItems.length; i++) {
          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: savedProjects[0].id,
            wbsItemId: savedProjects[0].wbsItems[i],
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: i,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
        }

        for (let i = 0; i < savedProjects[1].wbsItems.length; i++) {
          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: savedProjects[1].id,
            wbsItemId: savedProjects[1].wbsItems[i],
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: savedProjects[0].wbsItems.length + i,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
        }

        // 직원2: 프로젝트 2A, 2B 할당 (총 4개 WBS)
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee2Id,
            projectId: savedProjects[2].id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee2Id,
            projectId: savedProjects[3].id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 1,
            createdBy: systemAdminId,
          }),
        );

        for (let i = 0; i < savedProjects[2].wbsItems.length; i++) {
          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee2Id,
            projectId: savedProjects[2].id,
            wbsItemId: savedProjects[2].wbsItems[i],
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: i,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
        }

        for (let i = 0; i < savedProjects[3].wbsItems.length; i++) {
          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee2Id,
            projectId: savedProjects[3].id,
            wbsItemId: savedProjects[3].wbsItems[i],
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: savedProjects[2].wbsItems.length + i,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
        }

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.totalEmployees).toBe(2);
        expect(result.successCount).toBe(2);
        expect(result.errorCount).toBe(0);

        // 가중치 검증
        const employee1Assignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employee1Id },
          order: { displayOrder: 'ASC' },
        });

        const employee2Assignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employee2Id },
          order: { displayOrder: 'ASC' },
        });

        const employee1TotalWeight = employee1Assignments.reduce(
          (sum, a) => sum + a.weight,
          0,
        );
        const employee2TotalWeight = employee2Assignments.reduce(
          (sum, a) => sum + a.weight,
          0,
        );

        testResult.assertions.push({
          description: '직원1의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: employee1TotalWeight,
          passed: Math.abs(employee1TotalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: '직원2의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: employee2TotalWeight,
          passed: Math.abs(employee2TotalWeight - maxSelfEvaluationRate) < 0.01,
        });

        expect(Math.abs(employee1TotalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(Math.abs(employee2TotalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          employee1: {
            totalWeight: employee1TotalWeight,
            wbsCount: employee1Assignments.length,
            weights: employee1Assignments.map((a) => ({
              projectId: a.projectId,
              wbsItemId: a.wbsItemId,
              weight: a.weight,
            })),
          },
          employee2: {
            totalWeight: employee2TotalWeight,
            wbsCount: employee2Assignments.length,
            weights: employee2Assignments.map((a) => ({
              projectId: a.projectId,
              wbsItemId: a.wbsItemId,
              weight: a.weight,
            })),
          },
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('모든 프로젝트 등급 조합(1A, 1B, 2A, 2B, 3A, 3B)에서 가중치가 올바르게 재계산되어야 한다', async () => {
      const testResult = createTestResult('모든 프로젝트 등급 조합(1A, 1B, 2A, 2B, 3A, 3B)에서 가중치가 올바르게 재계산되어야 한다');
      try {
        // 모든 등급의 프로젝트 생성
        const projectGrades = [
          ProjectGrade.GRADE_1A,
          ProjectGrade.GRADE_1B,
          ProjectGrade.GRADE_2A,
          ProjectGrade.GRADE_2B,
          ProjectGrade.GRADE_3A,
          ProjectGrade.GRADE_3B,
        ];

        const savedProjects: { id: string; grade: ProjectGrade }[] = [];

        for (let i = 0; i < projectGrades.length; i++) {
          const project = Project.생성한다(
            {
              name: `프로젝트 ${projectGrades[i]}`,
              projectCode: `P${projectGrades[i]}`,
              grade: projectGrades[i],
            },
            systemAdminId,
          );
          const savedProject = await projectRepository.save(project);
          savedProjects.push({ id: savedProject.id, grade: projectGrades[i] });

          // 각 프로젝트에 WBS 2개씩 생성
          for (let j = 0; j < 2; j++) {
            const wbsItem = WbsItem.생성한다(
              {
                wbsCode: `P${projectGrades[i]}-W${j + 1}`,
                title: `WBS ${j + 1}`,
                projectId: savedProject.id,
                level: 1,
                status: WbsItemStatus.PENDING,
              },
              systemAdminId,
            );
            await wbsItemRepository.save(wbsItem);
          }
        }

        // 각 등급별로 직원 할당
        for (let i = 0; i < savedProjects.length; i++) {
          const project = savedProjects[i];
          const employeeId = i === 0 ? employee1Id : i === 1 ? employee2Id : employee3Id;

          // 프로젝트 할당
          await projectAssignmentRepository.save(
            projectAssignmentRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              projectId: project.id,
              assignedBy: systemAdminId,
              assignedDate: new Date(),
              displayOrder: 0,
              createdBy: systemAdminId,
            }),
          );

          // WBS 할당
          const wbsItems = await wbsItemRepository.find({
            where: { projectId: project.id },
          });

          for (let j = 0; j < wbsItems.length; j++) {
            const wbsAssignment = wbsAssignmentRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              projectId: project.id,
              wbsItemId: wbsItems[j].id,
              assignedBy: systemAdminId,
              assignedDate: new Date(),
              displayOrder: j,
              weight: 0,
              createdBy: systemAdminId,
            });
            await wbsAssignmentRepository.save(wbsAssignment);
          }
        }

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.totalEmployees).toBe(3);
        expect(result.successCount).toBe(3);
        expect(result.errorCount).toBe(0);

        // 각 직원의 가중치 검증
        const allAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId },
        });

        const employeeWeightMap = new Map<string, number>();
        const employeeProjectMap = new Map<string, ProjectGrade[]>();

        allAssignments.forEach((assignment) => {
          const currentWeight = employeeWeightMap.get(assignment.employeeId) || 0;
          employeeWeightMap.set(assignment.employeeId, currentWeight + assignment.weight);

          // 프로젝트 등급 추적
          const project = savedProjects.find((p) => p.id === assignment.projectId);
          if (project) {
            const projects = employeeProjectMap.get(assignment.employeeId) || [];
            if (!projects.includes(project.grade)) {
              projects.push(project.grade);
              employeeProjectMap.set(assignment.employeeId, projects);
            }
          }
        });

        let correctWeightCount = 0;
        const weightDetails: Array<{ employeeId: string; totalWeight: number; projects: ProjectGrade[] }> = [];

        for (const [employeeId, totalWeight] of employeeWeightMap.entries()) {
          const projects = employeeProjectMap.get(employeeId) || [];
          weightDetails.push({ employeeId, totalWeight, projects });

          if (Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01) {
            correctWeightCount++;
          }
        }

        testResult.assertions.push({
          description: '모든 직원의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: 3,
          actual: correctWeightCount,
          passed: correctWeightCount === 3,
        });

        expect(correctWeightCount).toBe(3);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          weightDetails,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('프로젝트 등급이 없는 직원의 가중치는 0이어야 한다', async () => {
      const testResult = createTestResult('프로젝트 등급이 없는 직원의 가중치는 0이어야 한다');
      try {
        // 등급이 없는 프로젝트 생성
        const projectWithoutGrade = Project.생성한다(
          {
            name: '등급 없는 프로젝트',
            projectCode: 'P_NO_GRADE',
            grade: undefined,
          },
          systemAdminId,
        );
        const savedProject = await projectRepository.save(projectWithoutGrade);

        const wbsItem = WbsItem.생성한다(
          {
            wbsCode: 'W_NO_GRADE-1',
            title: 'WBS 1',
            projectId: savedProject.id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem = await wbsItemRepository.save(wbsItem);

        // 직원1에게 등급 없는 프로젝트 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: savedProject.id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: savedProject.id,
          wbsItemId: savedWbsItem.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment);

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.totalEmployees).toBe(1);
        expect(result.successCount).toBe(1);
        expect(result.errorCount).toBe(0);

        // 가중치 검증
        const assignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employee1Id },
        });

        const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

        testResult.assertions.push({
          description: '등급이 없는 프로젝트의 가중치는 0이어야 함',
          expected: 0,
          actual: totalWeight,
          passed: totalWeight === 0,
        });

        expect(totalWeight).toBe(0);
        expect(assignments[0].weight).toBe(0);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          totalWeight,
          assignments: assignments.map((a) => ({
            wbsItemId: a.wbsItemId,
            weight: a.weight,
          })),
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('성능 테스트: 직원 100명, 각 직원당 프로젝트 5개, 총 WBS 20개', async () => {
      const testResult = createTestResult('성능 테스트: 직원 100명, 각 직원당 프로젝트 5개, 총 WBS 20개');
      try {
        const employeeCount = 100;
        const projectsPerEmployee = 5;
        const wbsPerEmployee = 20;
        const wbsPerProject = wbsPerEmployee / projectsPerEmployee; // 프로젝트당 4개 WBS

        const employeeIds: string[] = [];

        // 100명의 직원 생성
        console.log(`📊 성능 테스트 시작: 직원 ${employeeCount}명 생성 중...`);
        const employeeStartTime = Date.now();
        for (let i = 0; i < employeeCount; i++) {
          const uniqueId = randomUUID().substring(0, 8);
          const employee = employeeRepository.create({
            id: randomUUID(),
            employeeNumber: `PERF_E${String(i + 1).padStart(3, '0')}_${uniqueId}`,
            name: `성능테스트 직원 ${i + 1}`,
            email: `perf_test${i + 1}_${uniqueId}@example.com`,
            externalId: `EXT_PERF_EMP${String(i + 1).padStart(3, '0')}_${uniqueId}`,
            departmentId: departmentId,
            status: '재직중',
            createdBy: systemAdminId,
          });
          const savedEmployee = await employeeRepository.save(employee);
          employeeIds.push(savedEmployee.id);

          // 평가기간-직원 매핑 생성
          const mapping = mappingRepository.create({
            id: randomUUID(),
            evaluationPeriodId: evaluationPeriodId,
            employeeId: savedEmployee.id,
            createdBy: systemAdminId,
          });
          await mappingRepository.save(mapping);
        }
        const employeeEndTime = Date.now();
        console.log(`✅ 직원 생성 완료: ${employeeEndTime - employeeStartTime}ms`);

        // 프로젝트 생성 (다양한 등급)
        console.log(`📊 프로젝트 생성 중...`);
        const projectStartTime = Date.now();
        const projectGrades = [
          ProjectGrade.GRADE_1A,
          ProjectGrade.GRADE_1B,
          ProjectGrade.GRADE_2A,
          ProjectGrade.GRADE_2B,
          ProjectGrade.GRADE_3A,
        ];

        const savedProjects: { id: string; grade: ProjectGrade; wbsItems: string[] }[] = [];

        // 각 등급별로 충분한 프로젝트 생성 (직원 수만큼)
        for (let gradeIndex = 0; gradeIndex < projectGrades.length; gradeIndex++) {
          const grade = projectGrades[gradeIndex];
          // 각 등급당 직원 수만큼 프로젝트 생성
          for (let projectIndex = 0; projectIndex < employeeCount; projectIndex++) {
            const project = Project.생성한다(
              {
                name: `프로젝트 ${grade}_${projectIndex + 1}`,
                projectCode: `P${grade}_${projectIndex + 1}`,
                grade: grade,
              },
              systemAdminId,
            );
            const savedProject = await projectRepository.save(project);

            const wbsItemIds: string[] = [];
            // 각 프로젝트에 WBS 생성
            for (let wbsIndex = 0; wbsIndex < wbsPerProject; wbsIndex++) {
              const wbsItem = WbsItem.생성한다(
                {
                  wbsCode: `P${grade}_${projectIndex + 1}_W${wbsIndex + 1}`,
                  title: `WBS ${wbsIndex + 1}`,
                  projectId: savedProject.id,
                  level: 1,
                  status: WbsItemStatus.PENDING,
                },
                systemAdminId,
              );
              const savedWbsItem = await wbsItemRepository.save(wbsItem);
              wbsItemIds.push(savedWbsItem.id);
            }

            savedProjects.push({
              id: savedProject.id,
              grade: grade,
              wbsItems: wbsItemIds,
            });
          }
        }
        const projectEndTime = Date.now();
        console.log(`✅ 프로젝트 생성 완료: ${projectEndTime - projectStartTime}ms`);

        // 각 직원에게 프로젝트 및 WBS 할당
        console.log(`📊 프로젝트 및 WBS 할당 중...`);
        const assignmentStartTime = Date.now();
        for (let i = 0; i < employeeIds.length; i++) {
          const employeeId = employeeIds[i];

          // 각 직원에게 5개의 프로젝트 할당 (다양한 등급)
          for (let j = 0; j < projectsPerEmployee; j++) {
            const projectIndex = (i * projectsPerEmployee + j) % savedProjects.length;
            const project = savedProjects[projectIndex];

            // 프로젝트 할당
            await projectAssignmentRepository.save(
              projectAssignmentRepository.create({
                id: randomUUID(),
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                projectId: project.id,
                assignedBy: systemAdminId,
                assignedDate: new Date(),
                displayOrder: j,
                createdBy: systemAdminId,
              }),
            );

            // 해당 프로젝트의 WBS 할당
            for (let k = 0; k < project.wbsItems.length; k++) {
              const wbsAssignment = wbsAssignmentRepository.create({
                id: randomUUID(),
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                projectId: project.id,
                wbsItemId: project.wbsItems[k],
                assignedBy: systemAdminId,
                assignedDate: new Date(),
                displayOrder: j * wbsPerProject + k,
                weight: 0,
                createdBy: systemAdminId,
              });
              await wbsAssignmentRepository.save(wbsAssignment);
            }
          }
        }
        const assignmentEndTime = Date.now();
        console.log(`✅ 프로젝트 및 WBS 할당 완료: ${assignmentEndTime - assignmentStartTime}ms`);

        // 할당 통계 확인
        const totalAssignments = await wbsAssignmentRepository.count({
          where: { periodId: evaluationPeriodId },
        });

        console.log(`📊 데이터 준비 완료:`);
        console.log(`   - 직원 수: ${employeeCount}명`);
        console.log(`   - 프로젝트 수: ${savedProjects.length}개`);
        console.log(`   - 총 WBS 할당 수: ${totalAssignments}개`);
        console.log(`   - 직원당 평균 WBS: ${totalAssignments / employeeCount}개`);

        // 커맨드 실행 및 성능 측정
        console.log(`🚀 가중치 재계산 시작...`);
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const executionStartTime = Date.now();
        const result = await handler.execute(command);
        const executionEndTime = Date.now();
        const executionTime = executionEndTime - executionStartTime;

        console.log(`✅ 가중치 재계산 완료: ${executionTime}ms`);

        // 결과 검증
        testResult.assertions.push({
          description: `총 직원 수가 ${employeeCount}명이어야 함`,
          expected: employeeCount,
          actual: result.totalEmployees,
          passed: result.totalEmployees === employeeCount,
        });

        testResult.assertions.push({
          description: `성공한 직원 수가 ${employeeCount}명이어야 함`,
          expected: employeeCount,
          actual: result.successCount,
          passed: result.successCount === employeeCount,
        });

        testResult.assertions.push({
          description: '실패한 직원 수가 0이어야 함',
          expected: 0,
          actual: result.errorCount,
          passed: result.errorCount === 0,
        });

        expect(result.totalEmployees).toBe(employeeCount);
        expect(result.successCount).toBe(employeeCount);
        expect(result.errorCount).toBe(0);

        // 샘플 직원들의 가중치 검증 (전체 검증은 시간이 오래 걸리므로 샘플만)
        const sampleEmployeeIds = employeeIds.slice(0, 10); // 처음 10명만 검증
        const sampleAssignments = await wbsAssignmentRepository.find({
          where: {
            periodId: evaluationPeriodId,
            employeeId: sampleEmployeeIds[0] as any, // 첫 번째 직원만 상세 검증
          },
        });

        const sampleTotalWeight = sampleAssignments.reduce(
          (sum, a) => sum + a.weight,
          0,
        );

        testResult.assertions.push({
          description: '샘플 직원의 총 가중치가 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: sampleTotalWeight,
          passed: Math.abs(sampleTotalWeight - maxSelfEvaluationRate) < 0.01,
        });

        expect(Math.abs(sampleTotalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);

        // 성능 메트릭 계산
        const avgTimePerEmployee = executionTime / employeeCount;
        const avgTimePerWbs = executionTime / totalAssignments;

        console.log(`📈 성능 메트릭:`);
        console.log(`   - 총 실행 시간: ${executionTime}ms`);
        console.log(`   - 직원당 평균 시간: ${avgTimePerEmployee.toFixed(2)}ms`);
        console.log(`   - WBS당 평균 시간: ${avgTimePerWbs.toFixed(2)}ms`);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          performance: {
            totalExecutionTimeMs: executionTime,
            avgTimePerEmployeeMs: avgTimePerEmployee,
            avgTimePerWbsMs: avgTimePerWbs,
            employeeCount,
            totalProjects: savedProjects.length,
            totalWbsAssignments: totalAssignments,
            wbsPerEmployee: wbsPerEmployee,
            projectsPerEmployee: projectsPerEmployee,
          },
          setupTime: {
            employeeCreationMs: employeeEndTime - employeeStartTime,
            projectCreationMs: projectEndTime - projectStartTime,
            assignmentCreationMs: assignmentEndTime - assignmentStartTime,
            totalSetupMs: assignmentEndTime - employeeStartTime,
          },
          sampleWeight: {
            employeeId: sampleEmployeeIds[0],
            totalWeight: sampleTotalWeight,
            wbsCount: sampleAssignments.length,
          },
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });

  describe('maxSelfEvaluationRate 감소 시 자기평가 점수 조정', () => {
    it('maxSelfEvaluationRate가 줄어들 때 초과하는 자기평가 점수가 제한되어야 한다', async () => {
      const testResult = createTestResult(
        'maxSelfEvaluationRate가 줄어들 때 초과하는 자기평가 점수가 제한되어야 한다',
      );
      try {
        // 프로젝트 및 WBS 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        // 프로젝트 및 WBS 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1);

        // 기존 maxSelfEvaluationRate(120)보다 높은 점수로 자기평가 생성
        const originalMaxRate = 120;
        const newMaxRate = 80;
        const highScore = 100; // 새로운 최대값(80)을 초과하는 점수

        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: highScore,
          selfEvaluationContent: '테스트 내용',
          createdBy: systemAdminId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        // 평가기간의 maxSelfEvaluationRate를 줄임
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: newMaxRate },
        );

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        testResult.assertions.push({
          description: '가중치 재계산이 성공해야 함',
          expected: 1,
          actual: result.successCount,
          passed: result.successCount === 1,
        });

        expect(result.successCount).toBe(1);

        // 자기평가 점수가 제한되었는지 확인
        const updatedSelfEvaluation = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluation1.id },
        });

        testResult.assertions.push({
          description: '자기평가 점수가 새로운 최대값으로 제한되어야 함',
          expected: newMaxRate,
          actual: updatedSelfEvaluation?.selfEvaluationScore,
          passed: updatedSelfEvaluation?.selfEvaluationScore === newMaxRate,
        });

        expect(updatedSelfEvaluation?.selfEvaluationScore).toBe(newMaxRate);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          originalScore: highScore,
          adjustedScore: updatedSelfEvaluation?.selfEvaluationScore,
          originalMaxRate,
          newMaxRate,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('maxSelfEvaluationRate가 늘어날 때는 자기평가 점수가 조정되지 않아야 한다', async () => {
      const testResult = createTestResult(
        'maxSelfEvaluationRate가 늘어날 때는 자기평가 점수가 조정되지 않아야 한다',
      );
      try {
        // 프로젝트 및 WBS 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        // 프로젝트 및 WBS 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1);

        // 기존 maxSelfEvaluationRate(120) 이하의 점수로 자기평가 생성
        const originalMaxRate = 120;
        const newMaxRate = 150;
        const originalScore = 100; // 원래 최대값(120) 이하이지만 새로운 최대값(150)보다 낮음

        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: originalScore,
          selfEvaluationContent: '테스트 내용',
          createdBy: systemAdminId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        // 평가기간의 maxSelfEvaluationRate를 늘림
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: newMaxRate },
        );

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.successCount).toBe(1);

        // 자기평가 점수가 변경되지 않았는지 확인
        const updatedSelfEvaluation = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluation1.id },
        });

        testResult.assertions.push({
          description: '자기평가 점수가 변경되지 않아야 함',
          expected: originalScore,
          actual: updatedSelfEvaluation?.selfEvaluationScore,
          passed: updatedSelfEvaluation?.selfEvaluationScore === originalScore,
        });

        expect(updatedSelfEvaluation?.selfEvaluationScore).toBe(originalScore);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          originalScore,
          unchangedScore: updatedSelfEvaluation?.selfEvaluationScore,
          originalMaxRate,
          newMaxRate,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('여러 직원의 자기평가 점수가 동시에 조정되어야 한다', async () => {
      const testResult = createTestResult(
        '여러 직원의 자기평가 점수가 동시에 조정되어야 한다',
      );
      try {
        // 프로젝트 및 WBS 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        // 각 직원에게 프로젝트 및 WBS 할당
        for (const employeeId of [employee1Id, employee2Id, employee3Id]) {
          await projectAssignmentRepository.save(
            projectAssignmentRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              projectId: project1Id,
              assignedBy: systemAdminId,
              assignedDate: new Date(),
              displayOrder: 0,
              createdBy: systemAdminId,
            }),
          );

          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            projectId: project1Id,
            wbsItemId: savedWbsItem1.id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
        }

        // 각 직원의 자기평가 생성 (모두 새로운 최대값을 초과)
        const originalMaxRate = 120;
        const newMaxRate = 80;
        const highScores = [100, 95, 90]; // 모두 새로운 최대값(80)을 초과

        const selfEvaluations: WbsSelfEvaluation[] = [];
        for (let i = 0; i < 3; i++) {
          const employeeId = [employee1Id, employee2Id, employee3Id][i];
          const selfEvaluation = wbsSelfEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            wbsItemId: savedWbsItem1.id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            evaluationDate: new Date(),
            selfEvaluationScore: highScores[i],
            selfEvaluationContent: `테스트 내용 ${i + 1}`,
            createdBy: systemAdminId,
          });
          const saved = await wbsSelfEvaluationRepository.save(selfEvaluation);
          selfEvaluations.push(saved);
        }

        // 평가기간의 maxSelfEvaluationRate를 줄임
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: newMaxRate },
        );

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        testResult.assertions.push({
          description: '모든 직원의 가중치 재계산이 성공해야 함',
          expected: 3,
          actual: result.successCount,
          passed: result.successCount === 3,
        });

        expect(result.successCount).toBe(3);

        // 모든 자기평가 점수가 제한되었는지 확인
        const evaluationIds = selfEvaluations.map((e) => e.id);
        const updatedSelfEvaluations = await wbsSelfEvaluationRepository
          .createQueryBuilder('evaluation')
          .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
          .andWhere('evaluation.id IN (:...ids)', { ids: evaluationIds })
          .getMany();

        const allAdjusted = updatedSelfEvaluations.every(
          (e) => e.selfEvaluationScore === newMaxRate,
        );

        testResult.assertions.push({
          description: '모든 자기평가 점수가 새로운 최대값으로 제한되어야 함',
          expected: true,
          actual: allAdjusted,
          passed: allAdjusted,
        });

        expect(allAdjusted).toBe(true);
        expect(updatedSelfEvaluations.length).toBe(3);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          originalScores: highScores,
          adjustedScores: updatedSelfEvaluations.map((e) => e.selfEvaluationScore),
          originalMaxRate,
          newMaxRate,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('이미 제출된 자기평가도 점수가 조정되어야 한다', async () => {
      const testResult = createTestResult(
        '이미 제출된 자기평가도 점수가 조정되어야 한다',
      );
      try {
        // 프로젝트 및 WBS 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        // 프로젝트 및 WBS 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1);

        // 제출된 자기평가 생성
        const originalMaxRate = 120;
        const newMaxRate = 80;
        const highScore = 100;

        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: highScore,
          selfEvaluationContent: '테스트 내용',
          submittedToEvaluator: true,
          submittedToEvaluatorAt: new Date(),
          submittedToManager: true,
          submittedToManagerAt: new Date(),
          createdBy: systemAdminId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        // 평가기간의 maxSelfEvaluationRate를 줄임
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: newMaxRate },
        );

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.successCount).toBe(1);

        // 제출된 자기평가 점수도 조정되었는지 확인
        const updatedSelfEvaluation = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluation1.id },
        });

        testResult.assertions.push({
          description: '제출된 자기평가 점수도 새로운 최대값으로 제한되어야 함',
          expected: newMaxRate,
          actual: updatedSelfEvaluation?.selfEvaluationScore,
          passed: updatedSelfEvaluation?.selfEvaluationScore === newMaxRate,
        });

        testResult.assertions.push({
          description: '제출 상태는 유지되어야 함',
          expected: true,
          actual: updatedSelfEvaluation?.submittedToEvaluator,
          passed: updatedSelfEvaluation?.submittedToEvaluator === true,
        });

        expect(updatedSelfEvaluation?.selfEvaluationScore).toBe(newMaxRate);
        expect(updatedSelfEvaluation?.submittedToEvaluator).toBe(true);
        expect(updatedSelfEvaluation?.submittedToManager).toBe(true);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          originalScore: highScore,
          adjustedScore: updatedSelfEvaluation?.selfEvaluationScore,
          originalMaxRate,
          newMaxRate,
          submittedToEvaluator: updatedSelfEvaluation?.submittedToEvaluator,
          submittedToManager: updatedSelfEvaluation?.submittedToManager,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });

    it('새로운 최대값 이하의 점수는 조정되지 않아야 한다', async () => {
      const testResult = createTestResult(
        '새로운 최대값 이하의 점수는 조정되지 않아야 한다',
      );
      try {
        // 프로젝트 및 WBS 생성
        const project1 = Project.생성한다(
          {
            name: '프로젝트 1A',
            projectCode: 'P1A',
            grade: ProjectGrade.GRADE_1A,
          },
          systemAdminId,
        );
        const savedProject1 = await projectRepository.save(project1);
        project1Id = savedProject1.id;

        const wbsItem1 = WbsItem.생성한다(
          {
            wbsCode: 'W1-1',
            title: 'WBS 1-1',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);

        // 프로젝트 및 WBS 할당
        await projectAssignmentRepository.save(
          projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employee1Id,
            projectId: project1Id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: 0,
            createdBy: systemAdminId,
          }),
        );

        const wbsAssignment1 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          projectId: project1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment1);

        // 새로운 최대값 이하의 점수로 자기평가 생성
        const originalMaxRate = 120;
        const newMaxRate = 80;
        const lowScore = 70; // 새로운 최대값(80) 이하

        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employee1Id,
          wbsItemId: savedWbsItem1.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: lowScore,
          selfEvaluationContent: '테스트 내용',
          createdBy: systemAdminId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        // 평가기간의 maxSelfEvaluationRate를 줄임
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: newMaxRate },
        );

        // 커맨드 실행
        const command = new RecalculateAllEmployeesWeightForPeriodCommand(
          evaluationPeriodId,
        );
        const result = await handler.execute(command);

        // 결과 검증
        expect(result.successCount).toBe(1);

        // 자기평가 점수가 변경되지 않았는지 확인
        const updatedSelfEvaluation = await wbsSelfEvaluationRepository.findOne({
          where: { id: selfEvaluation1.id },
        });

        testResult.assertions.push({
          description: '새로운 최대값 이하의 점수는 변경되지 않아야 함',
          expected: lowScore,
          actual: updatedSelfEvaluation?.selfEvaluationScore,
          passed: updatedSelfEvaluation?.selfEvaluationScore === lowScore,
        });

        expect(updatedSelfEvaluation?.selfEvaluationScore).toBe(lowScore);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          result,
          originalScore: lowScore,
          unchangedScore: updatedSelfEvaluation?.selfEvaluationScore,
          originalMaxRate,
          newMaxRate,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        testResults.push(testResult);
      }
    });
  });
});

