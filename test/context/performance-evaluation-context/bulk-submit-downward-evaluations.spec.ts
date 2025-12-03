import {
  BulkSubmitDownwardEvaluationsCommand,
  BulkSubmitDownwardEvaluationsHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/bulk-submit-downward-evaluations.handler';
import {
  SubmitDownwardEvaluationCommand,
  SubmitDownwardEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectStatus } from '@domain/common/project/project.types';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationModule } from '@domain/core/downward-evaluation/downward-evaluation.module';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.module';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { DatabaseModule } from '@libs/database/database.module';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, IsNull, Repository } from 'typeorm';

/**
 * Performance Evaluation Context - Bulk Submit Downward Evaluations 통합 테스트
 *
 * 피평가자의 모든 하향평가를 일괄 제출하는 기능을 검증합니다.
 */
describe('Performance Evaluation Context - Bulk Submit Downward Evaluations', () => {
  let bulkSubmitHandler: BulkSubmitDownwardEvaluationsHandler;
  let submitHandler: SubmitDownwardEvaluationHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let evaluatorId: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId1: string;
  let wbsItemId2: string;
  let wbsItemId3: string;
  let selfEvaluationId1: string;
  let selfEvaluationId2: string;
  let selfEvaluationId3: string;
  let primaryEvaluationId1: string;
  let primaryEvaluationId2: string;
  let primaryEvaluationId3: string;
  let secondaryEvaluationId1: string;
  let secondaryEvaluationId2: string;
  let secondaryEvaluationId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const submittedBy = 'test-user-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        DownwardEvaluationModule,
        EvaluationPeriodModule,
        WbsSelfEvaluationModule,
        EmployeeEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          EvaluationPeriodEmployeeMapping,
          Employee,
          Department,
          DownwardEvaluation,
          WbsSelfEvaluation,
          Project,
          WbsItem,
          EvaluationLineMapping,
          EvaluationLine,
          EvaluationWbsAssignment,
          EmployeeEvaluationStepApproval,
        ]),
      ],
      providers: [
        BulkSubmitDownwardEvaluationsHandler,
        SubmitDownwardEvaluationHandler,
      ],
    }).compile();

    bulkSubmitHandler = module.get<BulkSubmitDownwardEvaluationsHandler>(
      BulkSubmitDownwardEvaluationsHandler,
    );
    submitHandler = module.get<SubmitDownwardEvaluationHandler>(
      SubmitDownwardEvaluationHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);

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
      const evaluations = await downwardEvaluationRepository.find();
      await downwardEvaluationRepository.remove(evaluations);

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
      currentPhase: EvaluationPeriodPhase.PEER_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 피평가자 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: 'EMP001',
      email: 'employee@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 평가자 직원 생성
    const evaluator = employeeRepository.create({
      name: '이평가자',
      employeeNumber: 'EMP002',
      email: 'evaluator@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEvaluator = await employeeRepository.save(evaluator);
    evaluatorId = savedEvaluator.id;

    // 5. 프로젝트 생성
    const project = projectRepository.create({
      name: '테스트 프로젝트',
      projectCode: 'PROJ001',
      status: ProjectStatus.ACTIVE,
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // 6. WBS 항목 생성
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

    // 7. 자기평가 생성
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

    // 8. 1차 하향평가 생성
    const primaryEvaluation1 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId1,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId1,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 1',
      downwardEvaluationScore: 95,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation1 =
      await downwardEvaluationRepository.save(primaryEvaluation1);
    primaryEvaluationId1 = savedPrimaryEvaluation1.id;

    const primaryEvaluation2 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId2,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId2,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 2',
      downwardEvaluationScore: 90,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation2 =
      await downwardEvaluationRepository.save(primaryEvaluation2);
    primaryEvaluationId2 = savedPrimaryEvaluation2.id;

    const primaryEvaluation3 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId3,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId3,
      evaluationType: DownwardEvaluationType.PRIMARY,
      downwardEvaluationContent: '1차 하향평가 내용 3',
      downwardEvaluationScore: 88,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluation3 =
      await downwardEvaluationRepository.save(primaryEvaluation3);
    primaryEvaluationId3 = savedPrimaryEvaluation3.id;

    // 9. 2차 하향평가 생성
    const secondaryEvaluation1 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId1,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId1,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 1',
      downwardEvaluationScore: 85,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation1 =
      await downwardEvaluationRepository.save(secondaryEvaluation1);
    secondaryEvaluationId1 = savedSecondaryEvaluation1.id;

    const secondaryEvaluation2 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId2,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId2,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 2',
      downwardEvaluationScore: 80,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation2 =
      await downwardEvaluationRepository.save(secondaryEvaluation2);
    secondaryEvaluationId2 = savedSecondaryEvaluation2.id;

    const secondaryEvaluation3 = downwardEvaluationRepository.create({
      employeeId: employeeId,
      evaluatorId: evaluatorId,
      wbsId: wbsItemId3,
      periodId: evaluationPeriodId,
      selfEvaluationId: selfEvaluationId3,
      evaluationType: DownwardEvaluationType.SECONDARY,
      downwardEvaluationContent: '2차 하향평가 내용 3',
      downwardEvaluationScore: 75,
      evaluationDate: new Date(),
      isCompleted: false,
      createdBy: systemAdminId,
    });
    const savedSecondaryEvaluation3 =
      await downwardEvaluationRepository.save(secondaryEvaluation3);
    secondaryEvaluationId3 = savedSecondaryEvaluation3.id;
  }

  describe('BulkSubmitDownwardEvaluationsHandler - 1차 하향평가 일괄 제출', () => {
    it('평가자가 담당하는 피평가자의 모든 1차 하향평가를 일괄 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 제출 전 상태 확인
      const evaluationsBefore = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsBefore.length).toBe(3);
      expect(evaluationsBefore.every((e) => !e.isCompleted)).toBe(true);

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(3);
      expect(result.submittedIds).toContain(primaryEvaluationId1);
      expect(result.submittedIds).toContain(primaryEvaluationId2);
      expect(result.submittedIds).toContain(primaryEvaluationId3);

      // 제출 후 상태 확인
      const evaluationsAfter = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsAfter.every((e) => e.isCompleted)).toBe(true);
      expect(evaluationsAfter.every((e) => e.completedAt !== null)).toBe(true);
    });

    it('이미 완료된 평가는 건너뛰고 제출되지 않은 평가만 제출해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1번 평가만 먼저 제출
      const submitCommand1 = new SubmitDownwardEvaluationCommand(
        primaryEvaluationId1,
        submittedBy,
      );
      await submitHandler.execute(submitCommand1);

      // 제출 전 상태 확인
      const evaluation1 = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId1 },
      });
      expect(evaluation1?.isCompleted).toBe(true);

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(2); // 2번, 3번만 제출
      expect(result.skippedCount).toBe(1); // 1번은 건너뜀
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(2);
      expect(result.submittedIds).toContain(primaryEvaluationId2);
      expect(result.submittedIds).toContain(primaryEvaluationId3);
      expect(result.skippedIds).toContain(primaryEvaluationId1);

      // 모든 평가가 완료되었는지 확인
      const evaluationsAfter = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsAfter.every((e) => e.isCompleted)).toBe(true);
    });

    it('필수 항목(내용, 점수)이 없어도 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2번 평가의 내용과 점수 제거
      await downwardEvaluationRepository.update(
        { id: primaryEvaluationId2 },
        {
          downwardEvaluationContent: null as any,
          downwardEvaluationScore: null as any,
        },
      );

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(3); // 모든 평가 제출 가능
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0); // 필수 항목 없어도 제출 가능
      expect(result.failedItems.length).toBe(0);

      // 모든 평가가 완료 상태인지 확인
      const evaluation1 = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId1 },
      });
      const evaluation2 = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId2 },
      });
      const evaluation3 = await downwardEvaluationRepository.findOne({
        where: { id: primaryEvaluationId3 },
      });

      expect(evaluation1?.isCompleted).toBe(true);
      expect(evaluation2?.isCompleted).toBe(true); // content와 score 없어도 제출 성공
      expect(evaluation3?.isCompleted).toBe(true);
    });

    it('평가자가 담당하지 않는 피평가자의 평가는 조회되지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 다른 평가자 생성
      const otherEvaluator = employeeRepository.create({
        name: '다른평가자',
        employeeNumber: 'EMP003',
        email: 'otherevaluator@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedOtherEvaluator = await employeeRepository.save(otherEvaluator);
      const otherEvaluatorId = savedOtherEvaluator.id;

      // When - 다른 평가자로 일괄 제출 시도
      const command = new BulkSubmitDownwardEvaluationsCommand(
        otherEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then - 평가가 없어서 빈 결과 반환 (스킵)
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '평가자가 담당하지 않는 피평가자의 평가는 조회되지 않아야 한다',
        result: {
          evaluatorId: otherEvaluatorId,
          evaluateeId: employeeId,
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
        },
      });
    });

    it('존재하지 않는 평가기간으로 조회하면 빈 결과를 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentPeriodId = '99999999-9999-9999-9999-999999999999';

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        nonExistentPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then - 평가가 없어서 빈 결과 반환 (스킵)
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 평가기간으로 조회하면 빈 결과를 반환해야 한다',
        result: {
          periodId: nonExistentPeriodId,
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
        },
      });
    });

    it('하향평가가 없는 경우 빈 결과를 반환해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When - 존재하지 않는 피평가자로 조회
      const nonExistentEvaluateeId = '99999999-9999-9999-9999-999999999999';
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        nonExistentEvaluateeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then - 평가가 없어서 빈 결과 반환 (스킵)
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(0);
      expect(result.skippedIds.length).toBe(0);
      expect(result.failedItems.length).toBe(0);

      // 테스트 결과 저장
      testResults.push({
        testName: '하향평가가 없는 경우 빈 결과를 반환해야 한다',
        result: {
          evaluatorId,
          evaluateeId: nonExistentEvaluateeId,
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
        },
      });
    });
  });

  describe('BulkSubmitDownwardEvaluationsHandler - 2차 하향평가 일괄 제출', () => {
    it('평가자가 담당하는 피평가자의 모든 2차 하향평가를 일괄 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 제출 전 상태 확인
      const evaluationsBefore = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsBefore.length).toBe(3);
      expect(evaluationsBefore.every((e) => !e.isCompleted)).toBe(true);

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.submittedIds.length).toBe(3);
      expect(result.submittedIds).toContain(secondaryEvaluationId1);
      expect(result.submittedIds).toContain(secondaryEvaluationId2);
      expect(result.submittedIds).toContain(secondaryEvaluationId3);

      // 제출 후 상태 확인
      const evaluationsAfter = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          deletedAt: IsNull(),
        },
      });
      expect(evaluationsAfter.every((e) => e.isCompleted)).toBe(true);
      expect(evaluationsAfter.every((e) => e.completedAt !== null)).toBe(true);
    });

    it('1차와 2차 하향평가를 독립적으로 일괄 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When - 1차 하향평가 일괄 제출
      const primaryCommand = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        submittedBy,
      );
      const primaryResult = await bulkSubmitHandler.execute(primaryCommand);

      // 2차 하향평가 일괄 제출
      const secondaryCommand = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      const secondaryResult = await bulkSubmitHandler.execute(secondaryCommand);

      // Then
      expect(primaryResult.submittedCount).toBe(3);
      expect(secondaryResult.submittedCount).toBe(3);

      // 1차 평가 모두 완료 확인
      const primaryEvaluations = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });
      expect(primaryEvaluations.every((e) => e.isCompleted)).toBe(true);

      // 2차 평가 모두 완료 확인
      const secondaryEvaluations = await downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId,
          periodId: evaluationPeriodId,
          evaluationType: DownwardEvaluationType.SECONDARY,
          deletedAt: IsNull(),
        },
      });
      expect(secondaryEvaluations.every((e) => e.isCompleted)).toBe(true);
    });

    it('내용과 점수가 없어도 2차 하향평가를 일괄 제출할 수 있어야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 2번 평가의 내용 제거
      await downwardEvaluationRepository.update(
        { id: secondaryEvaluationId2 },
        {
          downwardEvaluationContent: null as any,
        },
      );

      // 3번 평가의 점수 제거
      await downwardEvaluationRepository.update(
        { id: secondaryEvaluationId3 },
        {
          downwardEvaluationScore: null as any,
        },
      );

      // When
      const command = new BulkSubmitDownwardEvaluationsCommand(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        submittedBy,
      );
      const result = await bulkSubmitHandler.execute(command);

      // Then - 모든 평가가 제출 가능
      expect(result).toBeDefined();
      expect(result.submittedCount).toBe(3); // 모두 제출 가능
      expect(result.failedCount).toBe(0); // 필수 항목 없어도 제출 가능
      expect(result.failedItems.length).toBe(0);
      expect(result.submittedIds).toContain(secondaryEvaluationId1);
      expect(result.submittedIds).toContain(secondaryEvaluationId2);
      expect(result.submittedIds).toContain(secondaryEvaluationId3);

      // 모든 평가가 완료 상태 확인
      const evaluation1 = await downwardEvaluationRepository.findOne({
        where: { id: secondaryEvaluationId1 },
      });
      const evaluation2 = await downwardEvaluationRepository.findOne({
        where: { id: secondaryEvaluationId2 },
      });
      const evaluation3 = await downwardEvaluationRepository.findOne({
        where: { id: secondaryEvaluationId3 },
      });

      expect(evaluation1?.isCompleted).toBe(true);
      expect(evaluation2?.isCompleted).toBe(true); // content 없어도 제출 성공
      expect(evaluation3?.isCompleted).toBe(true); // score 없어도 제출 성공
    });
  });

  afterAll(() => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'bulk-submit-downward-evaluations-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
  });
});
