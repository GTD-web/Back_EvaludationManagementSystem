import {
  DeleteWbsSelfEvaluationsByAssignmentCommand,
  DeleteWbsSelfEvaluationsByAssignmentHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/delete-wbs-self-evaluations-by-assignment.handler';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectStatus } from '@domain/common/project/project.types';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { DatabaseModule } from '@libs/database/database.module';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, IsNull, Repository } from 'typeorm';

/**
 * Performance Evaluation Context - Delete WBS Self Evaluations By Assignment 통합 테스트
 *
 * WBS 할당 취소 시 관련 자기평가를 삭제하는 기능을 검증합니다.
 */
describe('Performance Evaluation Context - Delete WBS Self Evaluations By Assignment', () => {
  let deleteHandler: DeleteWbsSelfEvaluationsByAssignmentHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let selfEvaluationId1: string;
  let selfEvaluationId2: string;
  let selfEvaluationId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const deletedBy = 'test-user-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EvaluationPeriodModule,
        WbsSelfEvaluationModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          EvaluationPeriodEmployeeMapping,
          Employee,
          Department,
          WbsSelfEvaluation,
          Project,
          WbsItem,
        ]),
      ],
      providers: [DeleteWbsSelfEvaluationsByAssignmentHandler],
    }).compile();

    deleteHandler = module.get<DeleteWbsSelfEvaluationsByAssignmentHandler>(
      DeleteWbsSelfEvaluationsByAssignmentHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'delete-wbs-self-evaluations-by-assignment-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
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
      const selfEvaluations = await wbsSelfEvaluationRepository.find();
      await wbsSelfEvaluationRepository.remove(selfEvaluations);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 기본 테스트 데이터 생성
   */
  async function 기본_테스트데이터를_생성한다(): Promise<void> {
    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: 'DEV001',
      externalId: 'DEPT001',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 직원 생성
    const employee = employeeRepository.create({
      name: '김직원',
      employeeNumber: 'EMP001',
      email: 'employee@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 5. WBS 항목 생성
    const wbsItem1 = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem1 = await wbsItemRepository.save(wbsItem1);
    wbsItemId1 = savedWbsItem1.id;

    const wbsItem2 = wbsItemRepository.create({
      wbsCode: 'WBS002',
      title: 'WBS 항목 2',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem2 = await wbsItemRepository.save(wbsItem2);
    wbsItemId2 = savedWbsItem2.id;

    const wbsItem3 = wbsItemRepository.create({
      wbsCode: 'WBS003',
      title: 'WBS 항목 3',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem3 = await wbsItemRepository.save(wbsItem3);
    wbsItemId3 = savedWbsItem3.id;

    // 6. 자기평가 생성 (WBS 항목 1에 대해서만)
    const selfEvaluation1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId1,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 1',
      selfEvaluationContent: '자기평가 내용 1',
      selfEvaluationScore: 100,
      createdBy: systemAdminId,
    });
    const savedSelfEvaluation1 =
      await wbsSelfEvaluationRepository.save(selfEvaluation1);
    selfEvaluationId1 = savedSelfEvaluation1.id;

    const selfEvaluation2 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId2,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 2',
      selfEvaluationContent: '자기평가 내용 2',
      selfEvaluationScore: 110,
      createdBy: systemAdminId,
    });
    const savedSelfEvaluation2 =
      await wbsSelfEvaluationRepository.save(selfEvaluation2);
    selfEvaluationId2 = savedSelfEvaluation2.id;

    const selfEvaluation3 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId3,
      assignedBy: systemAdminId,
      assignedDate: new Date(),
      evaluationDate: new Date(),
      performanceResult: '성과 결과 3',
      selfEvaluationContent: '자기평가 내용 3',
      selfEvaluationScore: 105,
      createdBy: systemAdminId,
    });
    const savedSelfEvaluation3 =
      await wbsSelfEvaluationRepository.save(selfEvaluation3);
    selfEvaluationId3 = savedSelfEvaluation3.id;
  }

  describe('DeleteWbsSelfEvaluationsByAssignmentHandler - 기본 기능', () => {
    it('WBS 할당에 연결된 자기평가를 삭제할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 삭제 전 자기평가 확인
      const evaluationsBefore = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsBefore.length).toBe(1);
      expect(evaluationsBefore[0].id).toBe(selfEvaluationId1);

      // When
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(1);
      expect(result.deletedEvaluations.length).toBe(1);
      expect(result.deletedEvaluations[0].evaluationId).toBe(selfEvaluationId1);
      expect(result.deletedEvaluations[0].wbsItemId).toBe(wbsItemId1);

      // 삭제 후 자기평가 확인 (soft delete)
      const evaluationsAfter = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsAfter.length).toBe(0);

      // 삭제된 데이터 확인 (deletedAt이 설정되었는지)
      const deletedEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          id: selfEvaluationId1,
        },
        withDeleted: true,
      });
      expect(deletedEvaluations.length).toBe(1);
      expect(deletedEvaluations[0].deletedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: 'WBS 할당에 연결된 자기평가를 삭제할 수 있어야 한다',
        result: {
          deletedCount: result.deletedCount,
          deletedEvaluationIds: result.deletedEvaluations.map(
            (e) => e.evaluationId,
          ),
        },
      });
    });

    it('삭제할 자기평가가 없으면 빈 결과를 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 존재하지 않는 WBS 항목으로 삭제 시도
      const nonExistentWbsId = '99999999-9999-9999-9999-999999999999';

      // When
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        nonExistentWbsId,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(0);
      expect(result.deletedEvaluations.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제할 자기평가가 없으면 빈 결과를 반환해야 한다',
        result: {
          deletedCount: result.deletedCount,
          deletedEvaluations: result.deletedEvaluations,
        },
      });
    });

    it('여러 개의 자기평가를 가진 WBS 항목의 평가를 모두 삭제해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // WBS 항목 1에 추가 자기평가 생성 (같은 직원, 같은 기간)
      const additionalEvaluation1 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '추가 성과 결과 1',
        selfEvaluationContent: '추가 자기평가 내용 1',
        selfEvaluationScore: 95,
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(additionalEvaluation1);

      const additionalEvaluation2 = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '추가 성과 결과 2',
        selfEvaluationContent: '추가 자기평가 내용 2',
        selfEvaluationScore: 98,
        createdBy: systemAdminId,
      });
      await wbsSelfEvaluationRepository.save(additionalEvaluation2);

      // 삭제 전 확인 (3개여야 함)
      const evaluationsBefore = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsBefore.length).toBe(3);

      // When
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(3);
      expect(result.deletedEvaluations.length).toBe(3);

      // 삭제 후 확인 (0개여야 함)
      const evaluationsAfter = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsAfter.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '여러 개의 자기평가를 가진 WBS 항목의 평가를 모두 삭제해야 한다',
        result: {
          deletedCount: result.deletedCount,
          deletedEvaluationIds: result.deletedEvaluations.map(
            (e) => e.evaluationId,
          ),
        },
      });
    });

    it('특정 직원의 특정 WBS만 삭제하고 다른 WBS는 영향받지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 삭제 전 모든 자기평가 확인
      const allEvaluationsBefore = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(allEvaluationsBefore.length).toBe(3); // WBS 1, 2, 3

      // When - WBS 항목 1만 삭제
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result.deletedCount).toBe(1);

      // WBS 항목 1의 자기평가는 삭제됨
      const wbs1Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(wbs1Evaluations.length).toBe(0);

      // WBS 항목 2, 3의 자기평가는 그대로 유지
      const wbs2Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId2,
          deletedAt: IsNull(),
        },
      });
      expect(wbs2Evaluations.length).toBe(1);

      const wbs3Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId3,
          deletedAt: IsNull(),
        },
      });
      expect(wbs3Evaluations.length).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '특정 직원의 특정 WBS만 삭제하고 다른 WBS는 영향받지 않아야 한다',
        result: {
          deletedWbsId: wbsItemId1,
          deletedCount: result.deletedCount,
          remainingWbs2Count: wbs2Evaluations.length,
          remainingWbs3Count: wbs3Evaluations.length,
        },
      });
    });

    it('다른 직원의 같은 WBS 항목 자기평가는 영향받지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 다른 직원 생성
      const anotherEmployee = employeeRepository.create({
        name: '박직원',
        employeeNumber: 'EMP002',
        email: 'another@test.com',
        externalId: 'EXT002',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedAnotherEmployee =
        await employeeRepository.save(anotherEmployee);
      const anotherEmployeeId = savedAnotherEmployee.id;

      // 다른 직원의 자기평가 생성 (같은 WBS 항목 1)
      const anotherSelfEvaluation = wbsSelfEvaluationRepository.create({
        periodId: evaluationPeriodId,
        employeeId: anotherEmployeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '다른 직원 성과',
        selfEvaluationContent: '다른 직원 자기평가',
        selfEvaluationScore: 90,
        createdBy: systemAdminId,
      });
      const savedAnotherEvaluation = await wbsSelfEvaluationRepository.save(
        anotherSelfEvaluation,
      );

      // When - 첫 번째 직원의 WBS 항목 1 자기평가만 삭제
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result.deletedCount).toBe(1);

      // 첫 번째 직원의 자기평가는 삭제됨
      const employee1Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(employee1Evaluations.length).toBe(0);

      // 다른 직원의 자기평가는 그대로 유지
      const employee2Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId: anotherEmployeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(employee2Evaluations.length).toBe(1);
      expect(employee2Evaluations[0].id).toBe(savedAnotherEvaluation.id);

      // 테스트 결과 저장
      testResults.push({
        testName: '다른 직원의 같은 WBS 항목 자기평가는 영향받지 않아야 한다',
        result: {
          deletedEmployeeId: employeeId,
          deletedCount: result.deletedCount,
          anotherEmployeeId: anotherEmployeeId,
          anotherEmployeeEvaluationCount: employee2Evaluations.length,
        },
      });
    });

    it('다른 평가기간의 자기평가는 영향받지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 다른 평가기간 생성
      const anotherPeriod = evaluationPeriodRepository.create({
        name: '2024년 하반기 평가',
        description: '테스트용 평가기간 2',
        startDate: new Date('2024-07-01'),
        status: EvaluationPeriodStatus.IN_PROGRESS,
        currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
        criteriaSettingEnabled: true,
        selfEvaluationSettingEnabled: true,
        finalEvaluationSettingEnabled: true,
        maxSelfEvaluationRate: 120,
        createdBy: systemAdminId,
      });
      const savedAnotherPeriod =
        await evaluationPeriodRepository.save(anotherPeriod);
      const anotherPeriodId = savedAnotherPeriod.id;

      // 다른 평가기간의 자기평가 생성
      const anotherPeriodEvaluation = wbsSelfEvaluationRepository.create({
        periodId: anotherPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId1,
        assignedBy: systemAdminId,
        assignedDate: new Date(),
        evaluationDate: new Date(),
        performanceResult: '하반기 성과',
        selfEvaluationContent: '하반기 자기평가',
        selfEvaluationScore: 115,
        createdBy: systemAdminId,
      });
      const savedAnotherPeriodEvaluation =
        await wbsSelfEvaluationRepository.save(anotherPeriodEvaluation);

      // When - 첫 번째 평가기간의 자기평가만 삭제
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result.deletedCount).toBe(1);

      // 첫 번째 평가기간의 자기평가는 삭제됨
      const period1Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(period1Evaluations.length).toBe(0);

      // 다른 평가기간의 자기평가는 그대로 유지
      const period2Evaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: anotherPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(period2Evaluations.length).toBe(1);
      expect(period2Evaluations[0].id).toBe(savedAnotherPeriodEvaluation.id);

      // 테스트 결과 저장
      testResults.push({
        testName: '다른 평가기간의 자기평가는 영향받지 않아야 한다',
        result: {
          deletedPeriodId: evaluationPeriodId,
          deletedCount: result.deletedCount,
          anotherPeriodId: anotherPeriodId,
          anotherPeriodEvaluationCount: period2Evaluations.length,
        },
      });
    });
  });

  describe('DeleteWbsSelfEvaluationsByAssignmentHandler - 엣지 케이스', () => {
    it('존재하지 않는 직원 ID로 삭제 시도 시 빈 결과를 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentEmployeeId = '99999999-9999-9999-9999-999999999999';

      // When
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        nonExistentEmployeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result.deletedCount).toBe(0);
      expect(result.deletedEvaluations.length).toBe(0);

      // 기존 자기평가는 그대로 유지
      const existingEvaluations = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          wbsItemId: wbsItemId1,
          deletedAt: IsNull(),
        },
      });
      expect(existingEvaluations.length).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '존재하지 않는 직원 ID로 삭제 시도 시 빈 결과를 반환해야 한다',
        result: {
          nonExistentEmployeeId,
          deletedCount: result.deletedCount,
        },
      });
    });

    it('존재하지 않는 평가기간 ID로 삭제 시도 시 빈 결과를 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentPeriodId = '99999999-9999-9999-9999-999999999999';

      // When
      const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        nonExistentPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result = await deleteHandler.execute(command);

      // Then
      expect(result.deletedCount).toBe(0);
      expect(result.deletedEvaluations.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '존재하지 않는 평가기간 ID로 삭제 시도 시 빈 결과를 반환해야 한다',
        result: {
          nonExistentPeriodId,
          deletedCount: result.deletedCount,
        },
      });
    });

    it('이미 삭제된 자기평가는 다시 삭제되지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 삭제
      const command1 = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result1 = await deleteHandler.execute(command1);
      expect(result1.deletedCount).toBe(1);

      // When - 같은 조건으로 다시 삭제 시도
      const command2 = new DeleteWbsSelfEvaluationsByAssignmentCommand(
        employeeId,
        evaluationPeriodId,
        wbsItemId1,
        deletedBy,
      );
      const result2 = await deleteHandler.execute(command2);

      // Then - 이미 삭제되어 빈 결과 반환
      expect(result2.deletedCount).toBe(0);
      expect(result2.deletedEvaluations.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName: '이미 삭제된 자기평가는 다시 삭제되지 않아야 한다',
        result: {
          firstDeleteCount: result1.deletedCount,
          secondDeleteCount: result2.deletedCount,
        },
      });
    });
  });
});
