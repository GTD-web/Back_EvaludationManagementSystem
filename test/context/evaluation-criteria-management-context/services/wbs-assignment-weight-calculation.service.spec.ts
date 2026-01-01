import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DatabaseModule } from '@libs/database/database.module';
import { WbsAssignmentWeightCalculationService } from '@context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectGrade, getProjectGradePriority } from '@domain/common/project/project.types';
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

describe('WbsAssignmentWeightCalculationService - 프로젝트 등급 기반 가중치 계산', () => {
  let service: WbsAssignmentWeightCalculationService;
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

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let project1Id: string;
  let project2Id: string;
  let wbsItem1Id: string;
  let wbsItem2Id: string;
  let wbsItem3Id: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const maxSelfEvaluationRate = 120; // 테스트용 최대 달성률

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
        ]),
      ],
      providers: [WbsAssignmentWeightCalculationService],
    }).compile();

    service = module.get<WbsAssignmentWeightCalculationService>(
      WbsAssignmentWeightCalculationService,
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

    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'wbs-assignment-weight-calculation-test-result.json',
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
    // 데이터베이스 초기화
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
    const employee = employeeRepository.create({
      id: randomUUID(),
      employeeNumber: 'E001',
      name: '테스트 직원',
      email: 'test@example.com',
      externalId: 'EXT_EMP001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    await employeeRepository.save(employee);
    employeeId = employee.id;

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
    await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = evaluationPeriod.id;

    // 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      id: randomUUID(),
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    await mappingRepository.save(mapping);

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

    // WBS 항목 생성
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
    wbsItem1Id = savedWbsItem1.id;

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
    wbsItem2Id = savedWbsItem2.id;

    const wbsItem3 = WbsItem.생성한다(
      {
        wbsCode: 'W2-1',
        title: 'WBS 2-1',
        projectId: project2Id,
        level: 1,
        status: WbsItemStatus.PENDING,
      },
      systemAdminId,
    );
    const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);
    wbsItem3Id = savedWbsItem3.id;

    // 프로젝트 할당 생성
    const projectAssignment1 = projectAssignmentRepository.create({
      id: randomUUID(),
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: project1Id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment1);

    const projectAssignment2 = projectAssignmentRepository.create({
      id: randomUUID(),
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: project2Id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 1,
      createdBy: systemAdminId,
    });
    await projectAssignmentRepository.save(projectAssignment2);

    // WBS 할당 생성
    const wbsAssignment1 = wbsAssignmentRepository.create({
      id: randomUUID(),
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: project1Id,
      wbsItemId: wbsItem1Id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 0,
      weight: 0,
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment1);

    const wbsAssignment2 = wbsAssignmentRepository.create({
      id: randomUUID(),
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: project1Id,
      wbsItemId: wbsItem2Id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 1,
      weight: 0,
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment2);

    const wbsAssignment3 = wbsAssignmentRepository.create({
      id: randomUUID(),
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      projectId: project2Id,
      wbsItemId: wbsItem3Id,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      displayOrder: 2,
      weight: 0,
      createdBy: systemAdminId,
    });
    await wbsAssignmentRepository.save(wbsAssignment3);
  });

  describe('단일 프로젝트 가중치 계산', () => {
    it('1A 등급 프로젝트의 WBS 2개에 대해 가중치가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('1A 등급 프로젝트의 WBS 2개에 대해 가중치가 올바르게 계산되어야 한다');
      try {
        // 프로젝트 2 할당 제거 (단일 프로젝트 테스트)
        await projectAssignmentRepository.delete({ projectId: project2Id });
        await wbsAssignmentRepository.delete({ wbsItemId: wbsItem3Id });

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 1A 등급 우선순위 = 6
        // WBS 2개이므로 각각 6/2 = 3
        // 정규화: 3 / 6 * 120 = 60
        // 총합: 60 + 60 = 120

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: 'WBS 2개의 가중치가 동일해야 함',
          expected: '동일',
          actual: weights,
          passed: Math.abs(weights[0] - weights[1]) < 0.01,
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(Math.abs(weights[0] - weights[1])).toBeLessThan(0.01);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          maxSelfEvaluationRate,
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

  describe('다중 프로젝트 가중치 계산', () => {
    it('1A 등급 프로젝트(2개 WBS)와 2A 등급 프로젝트(1개 WBS)의 가중치가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('1A 등급 프로젝트(2개 WBS)와 2A 등급 프로젝트(1개 WBS)의 가중치가 올바르게 계산되어야 한다');
      try {
        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 계산식 검증:
        // 1A 등급 우선순위 = 6, WBS 2개 → 각 WBS 원시 가중치 = 6/2 = 3
        // 2A 등급 우선순위 = 4, WBS 1개 → WBS 원시 가중치 = 4/1 = 4
        // 총 원시 가중치 = 3 + 3 + 4 = 10
        // 정규화: (3/10)*120 = 36, (3/10)*120 = 36, (4/10)*120 = 48
        // 총합: 36 + 36 + 48 = 120

        const expectedWeight1 = (3 / 10) * maxSelfEvaluationRate; // 36
        const expectedWeight2 = (3 / 10) * maxSelfEvaluationRate; // 36
        const expectedWeight3 = (4 / 10) * maxSelfEvaluationRate; // 48

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: '1A 프로젝트 첫 번째 WBS 가중치가 올바르게 계산되어야 함',
          expected: expectedWeight1,
          actual: weights[0],
          passed: Math.abs(weights[0] - expectedWeight1) < 0.1,
        });

        testResult.assertions.push({
          description: '1A 프로젝트 두 번째 WBS 가중치가 올바르게 계산되어야 함',
          expected: expectedWeight2,
          actual: weights[1],
          passed: Math.abs(weights[1] - expectedWeight2) < 0.1,
        });

        testResult.assertions.push({
          description: '2A 프로젝트 WBS 가중치가 올바르게 계산되어야 함',
          expected: expectedWeight3,
          actual: weights[2],
          passed: Math.abs(weights[2] - expectedWeight3) < 0.1,
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(weights.length).toBe(3);
        expect(Math.abs(weights[0] - expectedWeight1)).toBeLessThan(0.1);
        expect(Math.abs(weights[1] - expectedWeight2)).toBeLessThan(0.1);
        expect(Math.abs(weights[2] - expectedWeight3)).toBeLessThan(0.1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          maxSelfEvaluationRate,
          expectedWeights: [expectedWeight1, expectedWeight2, expectedWeight3],
          calculation: {
            project1Priority: 6,
            project1WbsCount: 2,
            project1RawWeightPerWbs: 3,
            project2Priority: 4,
            project2WbsCount: 1,
            project2RawWeightPerWbs: 4,
            totalRawWeight: 10,
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

    it('1A 등급 프로젝트(3개 WBS)의 가중치가 각각 40으로 계산되어야 한다', async () => {
      const testResult = createTestResult('1A 등급 프로젝트(3개 WBS)의 가중치가 각각 40으로 계산되어야 한다');
      try {
        // 프로젝트 2 할당 제거
        await projectAssignmentRepository.delete({ projectId: project2Id });
        await wbsAssignmentRepository.delete({ wbsItemId: wbsItem3Id });

        // WBS 3개를 위해 추가 WBS 생성
        const wbsItem4 = WbsItem.생성한다(
          {
            wbsCode: 'W1-3',
            title: 'WBS 1-3',
            projectId: project1Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem4 = await wbsItemRepository.save(wbsItem4);

        const wbsAssignment4 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: project1Id,
          wbsItemId: savedWbsItem4.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 2,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment4);

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 계산식 검증:
        // 1A 등급 우선순위 = 6, WBS 3개 → 각 WBS 원시 가중치 = 6/3 = 2
        // 총 원시 가중치 = 2 + 2 + 2 = 6
        // 정규화: (2/6)*120 = 40, (2/6)*120 = 40, (2/6)*120 = 40
        // 총합: 40 + 40 + 40 = 120

        const expectedWeight = maxSelfEvaluationRate / 3; // 40

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: '모든 WBS 가중치가 동일해야 함',
          expected: expectedWeight,
          actual: weights[0],
          passed: weights.every((w) => Math.abs(w - expectedWeight) < 0.1),
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(weights.length).toBe(3);
        weights.forEach((weight) => {
          expect(Math.abs(weight - expectedWeight)).toBeLessThan(0.1);
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          maxSelfEvaluationRate,
          expectedWeight,
          calculation: {
            projectPriority: 6,
            wbsCount: 3,
            rawWeightPerWbs: 2,
            totalRawWeight: 6,
            normalizedWeightPerWbs: expectedWeight,
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

    it('1A(2개 WBS) + 2A(3개 WBS) 조합의 가중치가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('1A(2개 WBS) + 2A(3개 WBS) 조합의 가중치가 올바르게 계산되어야 한다');
      try {
        // 프로젝트 2에 WBS 2개 추가
        const wbsItem4 = WbsItem.생성한다(
          {
            wbsCode: 'W2-2',
            title: 'WBS 2-2',
            projectId: project2Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem4 = await wbsItemRepository.save(wbsItem4);

        const wbsItem5 = WbsItem.생성한다(
          {
            wbsCode: 'W2-3',
            title: 'WBS 2-3',
            projectId: project2Id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItem5 = await wbsItemRepository.save(wbsItem5);

        const wbsAssignment4 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: project2Id,
          wbsItemId: savedWbsItem4.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 3,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment4);

        const wbsAssignment5 = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: project2Id,
          wbsItemId: savedWbsItem5.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 4,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignment5);

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 계산식 검증:
        // 1A 등급 우선순위 = 6, WBS 2개 → 각 WBS 원시 가중치 = 6/2 = 3
        // 2A 등급 우선순위 = 4, WBS 3개 → 각 WBS 원시 가중치 = 4/3 = 1.333...
        // 총 원시 가중치 = 3 + 3 + 1.333 + 1.333 + 1.333 = 10
        // 정규화: (3/10)*120 = 36, (3/10)*120 = 36, (1.333/10)*120 = 16, (1.333/10)*120 = 16, (1.333/10)*120 = 16
        // 총합: 36 + 36 + 16 + 16 + 16 = 120

        const project1RawWeightPerWbs = 6 / 2; // 3
        const project2RawWeightPerWbs = 4 / 3; // 1.333...
        const totalRawWeight = project1RawWeightPerWbs * 2 + project2RawWeightPerWbs * 3; // 10

        const expectedWeight1A = (project1RawWeightPerWbs / totalRawWeight) * maxSelfEvaluationRate;
        const expectedWeight2A = (project2RawWeightPerWbs / totalRawWeight) * maxSelfEvaluationRate;

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: '1A 프로젝트 WBS 가중치가 올바르게 계산되어야 함',
          expected: expectedWeight1A,
          actual: weights[0],
          passed: Math.abs(weights[0] - expectedWeight1A) < 0.1,
        });

        testResult.assertions.push({
          description: '2A 프로젝트 WBS 가중치가 올바르게 계산되어야 함',
          expected: expectedWeight2A,
          actual: weights[2],
          passed: Math.abs(weights[2] - expectedWeight2A) < 0.1,
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(weights.length).toBe(5);
        // 1A 프로젝트의 두 WBS는 동일한 가중치를 가져야 함
        expect(Math.abs(weights[0] - weights[1])).toBeLessThan(0.1);
        // 2A 프로젝트의 세 WBS는 동일한 가중치를 가져야 함
        expect(Math.abs(weights[2] - weights[3])).toBeLessThan(0.1);
        expect(Math.abs(weights[3] - weights[4])).toBeLessThan(0.1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          maxSelfEvaluationRate,
          expectedWeights: {
            project1A: expectedWeight1A,
            project2A: expectedWeight2A,
          },
          calculation: {
            project1Priority: 6,
            project1WbsCount: 2,
            project1RawWeightPerWbs: project1RawWeightPerWbs,
            project2Priority: 4,
            project2WbsCount: 3,
            project2RawWeightPerWbs: project2RawWeightPerWbs,
            totalRawWeight: totalRawWeight,
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

  describe('예외 케이스 처리', () => {
    it('등급이 없는 프로젝트는 가중치가 0으로 설정되어야 한다', async () => {
      const testResult = createTestResult('등급이 없는 프로젝트는 가중치가 0으로 설정되어야 한다');
      try {
        // 등급이 없는 프로젝트 생성
        const projectNoGrade = Project.생성한다(
          {
            name: '등급 없는 프로젝트',
            projectCode: 'P_NO_GRADE',
            grade: undefined,
          },
          systemAdminId,
        );
        const savedProjectNoGrade = await projectRepository.save(projectNoGrade);

        const wbsItemNoGrade = WbsItem.생성한다(
          {
            wbsCode: 'W_NO_GRADE',
            title: 'WBS 등급 없음',
            projectId: savedProjectNoGrade.id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItemNoGrade = await wbsItemRepository.save(wbsItemNoGrade);

        const projectAssignmentNoGrade = projectAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: savedProjectNoGrade.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 2,
          createdBy: systemAdminId,
        });
        await projectAssignmentRepository.save(projectAssignmentNoGrade);

        const wbsAssignmentNoGrade = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: savedProjectNoGrade.id,
          wbsItemId: savedWbsItemNoGrade.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 3,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignmentNoGrade);

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const noGradeAssignment = assignments.find(
          (a) => a.wbsItemId === savedWbsItemNoGrade.id,
        );
        const otherAssignments = assignments.filter(
          (a) => a.wbsItemId !== savedWbsItemNoGrade.id,
        );

        const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

        testResult.assertions.push({
          description: '등급 없는 프로젝트의 WBS 가중치는 0이어야 함',
          expected: 0,
          actual: noGradeAssignment?.weight,
          passed: noGradeAssignment?.weight === 0,
        });

        testResult.assertions.push({
          description: '다른 프로젝트의 가중치는 정상적으로 계산되어야 함',
          expected: '> 0',
          actual: otherAssignments[0]?.weight,
          passed: (otherAssignments[0]?.weight || 0) > 0,
        });

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함 (등급 없는 프로젝트 제외)',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        expect(noGradeAssignment?.weight).toBe(0);
        expect(otherAssignments.length).toBeGreaterThan(0);
        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          noGradeWeight: noGradeAssignment?.weight,
          otherWeights: otherAssignments.map((a) => a.weight),
          totalWeight,
          maxSelfEvaluationRate,
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

    it('모든 프로젝트가 등급이 없으면 모든 가중치가 0으로 설정되어야 한다', async () => {
      const testResult = createTestResult('모든 프로젝트가 등급이 없으면 모든 가중치가 0으로 설정되어야 한다');
      try {
        // 기존 프로젝트 할당 제거
        const existingProjectAssignments = await projectAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employeeId },
        });
        if (existingProjectAssignments.length > 0) {
          await projectAssignmentRepository.remove(existingProjectAssignments);
        }

        const existingWbsAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employeeId },
        });
        if (existingWbsAssignments.length > 0) {
          await wbsAssignmentRepository.remove(existingWbsAssignments);
        }

        // 등급이 없는 프로젝트 생성
        const projectNoGrade = Project.생성한다(
          {
            name: '등급 없는 프로젝트',
            projectCode: 'P_NO_GRADE',
            grade: undefined,
          },
          systemAdminId,
        );
        const savedProjectNoGrade = await projectRepository.save(projectNoGrade);

        const wbsItemNoGrade = WbsItem.생성한다(
          {
            wbsCode: 'W_NO_GRADE',
            title: 'WBS 등급 없음',
            projectId: savedProjectNoGrade.id,
            level: 1,
            status: WbsItemStatus.PENDING,
          },
          systemAdminId,
        );
        const savedWbsItemNoGrade = await wbsItemRepository.save(wbsItemNoGrade);

        const projectAssignmentNoGrade = projectAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: savedProjectNoGrade.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          createdBy: systemAdminId,
        });
        await projectAssignmentRepository.save(projectAssignmentNoGrade);

        const wbsAssignmentNoGrade = wbsAssignmentRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          projectId: savedProjectNoGrade.id,
          wbsItemId: savedWbsItemNoGrade.id,
          assignedBy: systemAdminId,
          assignedDate: new Date(),
          displayOrder: 0,
          weight: 0,
          createdBy: systemAdminId,
        });
        await wbsAssignmentRepository.save(wbsAssignmentNoGrade);

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        testResult.assertions.push({
          description: '모든 가중치가 0이어야 함',
          expected: 0,
          actual: totalWeight,
          passed: totalWeight === 0,
        });

        testResult.assertions.push({
          description: '각 WBS 가중치가 0이어야 함',
          expected: 0,
          actual: weights[0],
          passed: weights.every((w) => w === 0),
        });

        expect(totalWeight).toBe(0);
        expect(weights.every((w) => w === 0)).toBe(true);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          weights,
          totalWeight,
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

  describe('다양한 프로젝트 등급 조합', () => {
    it('모든 등급(1A, 1B, 2A, 2B, 3A, 3B)의 가중치가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('모든 등급(1A, 1B, 2A, 2B, 3A, 3B)의 가중치가 올바르게 계산되어야 한다');
      try {
        // 기존 할당 제거
        const existingProjectAssignments = await projectAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employeeId },
        });
        if (existingProjectAssignments.length > 0) {
          await projectAssignmentRepository.remove(existingProjectAssignments);
        }

        const existingWbsAssignments = await wbsAssignmentRepository.find({
          where: { periodId: evaluationPeriodId, employeeId: employeeId },
        });
        if (existingWbsAssignments.length > 0) {
          await wbsAssignmentRepository.remove(existingWbsAssignments);
        }

        const grades = [
          ProjectGrade.GRADE_1A,
          ProjectGrade.GRADE_1B,
          ProjectGrade.GRADE_2A,
          ProjectGrade.GRADE_2B,
          ProjectGrade.GRADE_3A,
          ProjectGrade.GRADE_3B,
        ];

        const projects: Project[] = [];
        const wbsItems: WbsItem[] = [];
        const wbsAssignments: EvaluationWbsAssignment[] = [];

        // 각 등급별로 프로젝트와 WBS 생성
        for (let i = 0; i < grades.length; i++) {
          const grade = grades[i];
          const project = Project.생성한다(
            {
              name: `프로젝트 ${grade}`,
              projectCode: `P${grade}`,
              grade: grade,
            },
            systemAdminId,
          );
          const savedProject = await projectRepository.save(project);
          projects.push(savedProject);

          const projectAssignment = projectAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            projectId: savedProject.id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: i,
            createdBy: systemAdminId,
          });
          await projectAssignmentRepository.save(projectAssignment);

          const wbsItem = WbsItem.생성한다(
            {
              wbsCode: `W${grade}-1`,
              title: `WBS ${grade}-1`,
              projectId: savedProject.id,
              level: 1,
              status: WbsItemStatus.PENDING,
            },
            systemAdminId,
          );
          const savedWbsItem = await wbsItemRepository.save(wbsItem);
          wbsItems.push(savedWbsItem);

          const wbsAssignment = wbsAssignmentRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            projectId: savedProject.id,
            wbsItemId: savedWbsItem.id,
            assignedBy: systemAdminId,
            assignedDate: new Date(),
            displayOrder: i,
            weight: 0,
            createdBy: systemAdminId,
          });
          await wbsAssignmentRepository.save(wbsAssignment);
          wbsAssignments.push(wbsAssignment);
        }

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 계산식 검증:
        // 1A(6) + 1B(5) + 2A(4) + 2B(3) + 3A(2) + 3B(1) = 21 (총 원시 가중치)
        // 각 등급별 정규화: (priority / 21) * 120

        const priorities = [6, 5, 4, 3, 2, 1];
        const totalRawWeight = priorities.reduce((sum, p) => sum + p, 0); // 21
        const expectedWeights = priorities.map(
          (p) => (p / totalRawWeight) * maxSelfEvaluationRate,
        );

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        testResult.assertions.push({
          description: '각 등급별 가중치가 올바르게 계산되어야 함',
          expected: expectedWeights,
          actual: weights,
          passed: weights.every((w, i) => Math.abs(w - expectedWeights[i]) < 0.1),
        });

        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(weights.length).toBe(6);
        weights.forEach((weight, i) => {
          expect(Math.abs(weight - expectedWeights[i])).toBeLessThan(0.1);
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          expectedWeights,
          maxSelfEvaluationRate,
          calculation: {
            priorities,
            totalRawWeight,
            normalizedWeights: expectedWeights,
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

  describe('경계값 테스트', () => {
    it('maxSelfEvaluationRate가 100인 경우 가중치가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('maxSelfEvaluationRate가 100인 경우 가중치가 올바르게 계산되어야 한다');
      try {
        // 평가기간 업데이트
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: 100 },
        );

        // 프로젝트 2 할당 제거 (단일 프로젝트 테스트)
        await projectAssignmentRepository.delete({ projectId: project2Id });
        await wbsAssignmentRepository.delete({ wbsItemId: wbsItem3Id });

        // 가중치 재계산
        await service.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 결과 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
        });

        const weights = assignments.map((a) => a.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 계산식 검증:
        // 1A 등급 우선순위 = 6, WBS 2개 → 각 WBS 원시 가중치 = 6/2 = 3
        // 총 원시 가중치 = 3 + 3 = 6
        // 정규화: (3/6)*100 = 50, (3/6)*100 = 50
        // 총합: 50 + 50 = 100

        const expectedWeight = 100 / 2; // 50

        testResult.assertions.push({
          description: '가중치 총합이 100과 일치해야 함',
          expected: 100,
          actual: totalWeight,
          passed: Math.abs(totalWeight - 100) < 0.01,
        });

        testResult.assertions.push({
          description: '각 WBS 가중치가 50이어야 함',
          expected: expectedWeight,
          actual: weights[0],
          passed: Math.abs(weights[0] - expectedWeight) < 0.1,
        });

        expect(Math.abs(totalWeight - 100)).toBeLessThan(0.01);
        expect(weights.length).toBe(2);
        weights.forEach((weight) => {
          expect(Math.abs(weight - expectedWeight)).toBeLessThan(0.1);
        });

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalWeight,
          weights,
          maxSelfEvaluationRate: 100,
          expectedWeight,
        };
      } catch (error: any) {
        testResult.status = 'failed';
        testResult.endTime = new Date().toISOString();
        testResult.errors.push({ message: error.message, stack: error.stack });
        throw error;
      } finally {
        // 원래 값으로 복구
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: maxSelfEvaluationRate },
        );
        testResults.push(testResult);
      }
    });
  });
});
