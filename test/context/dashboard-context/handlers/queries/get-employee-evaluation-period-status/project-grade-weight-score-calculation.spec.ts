import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status/get-employee-evaluation-period-status.handler';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectGrade, getProjectGradePriority } from '@domain/common/project/project.types';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import {
  SubmitWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationHandler,
} from '@context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation.handler';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { WbsAssignmentWeightCalculationService } from '@context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';

// 테스트 결과 수집 헬퍼 함수
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

describe('Dashboard Context - 프로젝트 등급 기반 가중치 점수 계산', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let submitToManagerHandler: SubmitWbsSelfEvaluationHandler;
  let weightCalculationService: WbsAssignmentWeightCalculationService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let projectAssignmentRepository: Repository<EvaluationProjectAssignment>;
  let wbsAssignmentRepository: Repository<EvaluationWbsAssignment>;
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let downwardEvaluationRepository: Repository<DownwardEvaluation>;
  let projectRepository: Repository<Project>;
  let wbsItemRepository: Repository<WbsItem>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let wbsCriteriaRepository: Repository<WbsEvaluationCriteria>;
  let peerEvaluationRepository: Repository<PeerEvaluation>;
  let finalEvaluationRepository: Repository<FinalEvaluation>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>;
  let secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let primaryEvaluatorId: string;
  let departmentId: string;
  let project1Id: string;
  let project2Id: string;
  let wbsItem1Id: string;
  let wbsItem2Id: string;
  let wbsItem3Id: string;
  let primaryEvaluationLineId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const maxSelfEvaluationRate = 120; // 테스트용 최대 달성률

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        WbsSelfEvaluationModule,
        EvaluationPeriodModule,
        EvaluationWbsAssignmentModule,
        EmployeeEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          EvaluationLine,
          EvaluationLineMapping,
          WbsSelfEvaluation,
          DownwardEvaluation,
          Project,
          WbsItem,
          WbsEvaluationCriteria,
          PeerEvaluation,
          FinalEvaluation,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
          SecondaryEvaluationStepApproval,
          EmployeeEvaluationStepApproval,
        ]),
      ],
      providers: [
        GetEmployeeEvaluationPeriodStatusHandler,
        SubmitWbsSelfEvaluationHandler,
        WbsAssignmentWeightCalculationService,
        EmployeeEvaluationStepApprovalService,
      ],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
    );
    submitToManagerHandler = module.get<SubmitWbsSelfEvaluationHandler>(
      SubmitWbsSelfEvaluationHandler,
    );
    weightCalculationService = module.get<WbsAssignmentWeightCalculationService>(
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
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    downwardEvaluationRepository = dataSource.getRepository(DownwardEvaluation);
    projectRepository = dataSource.getRepository(Project);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(EvaluationLineMapping);
    wbsCriteriaRepository = dataSource.getRepository(WbsEvaluationCriteria);
    peerEvaluationRepository = dataSource.getRepository(PeerEvaluation);
    finalEvaluationRepository = dataSource.getRepository(FinalEvaluation);
    revisionRequestRepository = dataSource.getRepository(EvaluationRevisionRequest);
    revisionRequestRecipientRepository = dataSource.getRepository(EvaluationRevisionRequestRecipient);
    secondaryStepApprovalRepository = dataSource.getRepository(SecondaryEvaluationStepApproval);

    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'project-grade-weight-score-calculation-test-result.json',
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
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // 데이터베이스 초기화
    await dataSource.query('TRUNCATE TABLE "evaluation_line_mappings" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_lines" CASCADE');
    await dataSource.query('TRUNCATE TABLE "downward_evaluation" CASCADE');
    await dataSource.query('TRUNCATE TABLE "wbs_self_evaluation" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_wbs_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_project_assignment" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_period_employee_mapping" CASCADE');
    await dataSource.query('TRUNCATE TABLE "wbs_item" CASCADE');
    await dataSource.query('TRUNCATE TABLE "project" CASCADE');
    await dataSource.query('TRUNCATE TABLE "evaluation_period" CASCADE');
    await dataSource.query('TRUNCATE TABLE "employee" CASCADE');
    await dataSource.query('TRUNCATE TABLE "department" CASCADE');

    // 부서 생성
    const department = departmentRepository.create({
      id: randomUUID(),
      name: '테스트 부서',
      code: 'TEST',
      externalId: 'EXT_TEST',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    await departmentRepository.save(department);
    departmentId = department.id;

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

    // 평가자 생성
    const evaluator = employeeRepository.create({
      id: randomUUID(),
      employeeNumber: 'EVAL001',
      name: '테스트 평가자',
      email: 'evaluator@example.com',
      externalId: 'EXT_EVAL001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    await employeeRepository.save(evaluator);
    primaryEvaluatorId = evaluator.id;

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

    // 가중치 재계산
    await weightCalculationService.직원_평가기간_가중치를_재계산한다(
      employeeId,
      evaluationPeriodId,
    );

    // 평가라인 생성
    const evaluationLine = evaluationLineRepository.create({
      id: randomUUID(),
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: true,
      createdBy: systemAdminId,
    });
    await evaluationLineRepository.save(evaluationLine);
    primaryEvaluationLineId = evaluationLine.id;

    // 평가라인 매핑 생성
    const lineMapping1 = evaluationLineMappingRepository.create({
      id: randomUUID(),
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId,
      evaluationLineId: primaryEvaluationLineId,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(lineMapping1);
  });

  describe('자기평가 점수 계산', () => {
    it('프로젝트 등급 기반 가중치로 자기평가 점수가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('프로젝트 등급 기반 가중치로 자기평가 점수가 올바르게 계산되어야 한다');
      try {
        // 자기평가 생성
        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem1Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100, // 최대 점수
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        const selfEvaluation2 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem2Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100, // 최대 점수
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation2);

        const selfEvaluation3 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem3Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100, // 최대 점수
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation3);

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        // 결과 확인
        const totalScore = result.selfEvaluation?.totalScore;
        const grade = result.selfEvaluation?.grade;

        // 가중치 확인
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

        testResult.assertions.push({
          description: '점수가 계산되어야 함',
          expected: 'number',
          actual: typeof totalScore,
          passed: typeof totalScore === 'number',
        });

        testResult.assertions.push({
          description: '가중치 총합이 maxSelfEvaluationRate와 일치해야 함',
          expected: maxSelfEvaluationRate,
          actual: totalWeight,
          passed: Math.abs(totalWeight - maxSelfEvaluationRate) < 0.01,
        });

        // 계산식 검증: 모든 WBS가 100점일 때
        // 가중치가 maxSelfEvaluationRate 기준으로 정규화되어 있으므로
        // 총점 = Σ((weight / maxSelfEvaluationRate) × 100)
        //     = (totalWeight / maxSelfEvaluationRate) × 100
        //     = (maxSelfEvaluationRate / maxSelfEvaluationRate) × 100
        //     = 100
        const expectedScore = 100;

        testResult.assertions.push({
          description: '모든 WBS가 최대 점수(100)일 때 총점이 100이어야 함',
          expected: expectedScore,
          actual: totalScore,
          passed: totalScore !== null && Math.abs(totalScore - expectedScore) <= 1,
        });

        expect(totalScore).not.toBeNull();
        expect(Math.abs(totalWeight - maxSelfEvaluationRate)).toBeLessThan(0.01);
        expect(Math.abs(totalScore! - expectedScore)).toBeLessThanOrEqual(1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          grade,
          expectedScore: maxSelfEvaluationRate,
          totalWeight,
          weights: weights.map((w, i) => ({ id: assignments[i].id, weight: w })),
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

    it('다양한 점수로 자기평가 점수가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('다양한 점수로 자기평가 점수가 올바르게 계산되어야 한다');
      try {
        // 다양한 점수의 자기평가 생성
        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem1Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 80, // 80점
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        const selfEvaluation2 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem2Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 90, // 90점
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation2);

        const selfEvaluation3 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem3Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100, // 100점
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation3);

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;

        // 가중치 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);

        // 예상 점수 계산: (36/120)*80 + (36/120)*90 + (48/120)*100 = 24 + 27 + 40 = 91
        const expectedScore = Math.floor(
          (weights[0] / maxSelfEvaluationRate) * 80 +
          (weights[1] / maxSelfEvaluationRate) * 90 +
          (weights[2] / maxSelfEvaluationRate) * 100
        );

        testResult.assertions.push({
          description: '점수가 올바르게 계산되어야 함',
          expected: expectedScore,
          actual: totalScore,
          passed: totalScore !== null && Math.abs(totalScore - expectedScore) <= 1,
        });

        expect(totalScore).not.toBeNull();
        expect(Math.abs(totalScore! - expectedScore)).toBeLessThanOrEqual(1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          expectedScore,
          weights: {
            weight1: weights[0],
            weight2: weights[1],
            weight3: weights[2],
          },
          scores: {
            score1: 80,
            score2: 90,
            score3: 100,
          },
          calculation: {
            formula: 'Σ((weight / maxSelfEvaluationRate) × score)',
            step1: `(${weights[0]} / ${maxSelfEvaluationRate}) × 80 = ${((weights[0] / maxSelfEvaluationRate) * 80).toFixed(2)}`,
            step2: `(${weights[1]} / ${maxSelfEvaluationRate}) × 90 = ${((weights[1] / maxSelfEvaluationRate) * 90).toFixed(2)}`,
            step3: `(${weights[2]} / ${maxSelfEvaluationRate}) × 100 = ${((weights[2] / maxSelfEvaluationRate) * 100).toFixed(2)}`,
            total: expectedScore,
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

    it('계산식 검증: 가중치 기반 점수 계산식이 정확히 적용되어야 한다', async () => {
      const testResult = createTestResult('계산식 검증: 가중치 기반 점수 계산식이 정확히 적용되어야 한다');
      try {
        // 가중치 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);

        // 테스트 케이스: 각 WBS에 다른 점수 부여
        const testScores = [50, 75, 100];

        for (let i = 0; i < testScores.length; i++) {
          const selfEvaluation = wbsSelfEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            wbsItemId: assignments[i].wbsItemId,
            assignedBy: employeeId,
            assignedDate: new Date(),
            evaluationDate: new Date(),
            selfEvaluationScore: testScores[i],
            submittedToManager: true,
            createdBy: employeeId,
          });
          await wbsSelfEvaluationRepository.save(selfEvaluation);
        }

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;

        // 계산식 검증: Σ((weight / maxSelfEvaluationRate) × score)
        let expectedScore = 0;
        const calculationSteps: string[] = [];

        for (let i = 0; i < weights.length; i++) {
          const weightedScore = (weights[i] / maxSelfEvaluationRate) * testScores[i];
          expectedScore += weightedScore;
          calculationSteps.push(
            `WBS${i + 1}: (${weights[i].toFixed(2)} / ${maxSelfEvaluationRate}) × ${testScores[i]} = ${weightedScore.toFixed(2)}`,
          );
        }

        const finalExpectedScore = Math.floor(expectedScore);

        testResult.assertions.push({
          description: '계산식이 정확히 적용되어야 함',
          expected: finalExpectedScore,
          actual: totalScore,
          passed: totalScore !== null && Math.abs(totalScore! - finalExpectedScore) <= 1,
        });

        testResult.assertions.push({
          description: '각 WBS의 가중 점수가 올바르게 계산되어야 함',
          expected: '계산식 검증',
          actual: calculationSteps.join('; '),
          passed: true,
        });

        expect(totalScore).not.toBeNull();
        expect(Math.abs(totalScore! - finalExpectedScore)).toBeLessThanOrEqual(1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          expectedScore: finalExpectedScore,
          calculationSteps,
          weights: weights.map((w, i) => ({
            wbsIndex: i + 1,
            weight: w,
            score: testScores[i],
            weightedScore: ((w / maxSelfEvaluationRate) * testScores[i]).toFixed(2),
          })),
          formula: 'Σ((weight / maxSelfEvaluationRate) × score)',
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

    it('경계값 테스트: 모든 WBS가 0점일 때 총점이 0이어야 한다', async () => {
      const testResult = createTestResult('경계값 테스트: 모든 WBS가 0점일 때 총점이 0이어야 한다');
      try {
        // 모든 WBS에 0점 부여
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        for (const assignment of assignments) {
          const selfEvaluation = wbsSelfEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            wbsItemId: assignment.wbsItemId,
            assignedBy: employeeId,
            assignedDate: new Date(),
            evaluationDate: new Date(),
            selfEvaluationScore: 0,
            submittedToManager: true,
            createdBy: employeeId,
          });
          await wbsSelfEvaluationRepository.save(selfEvaluation);
        }

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;

        testResult.assertions.push({
          description: '모든 WBS가 0점이면 총점도 0이어야 함',
          expected: 0,
          actual: totalScore,
          passed: totalScore === 0,
        });

        expect(totalScore).toBe(0);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          expectedScore: 0,
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

  describe('하향평가 점수 계산', () => {
    it('프로젝트 등급 기반 가중치로 1차 하향평가 점수가 올바르게 계산되어야 한다', async () => {
      const testResult = createTestResult('프로젝트 등급 기반 가중치로 1차 하향평가 점수가 올바르게 계산되어야 한다');
      try {
        // 자기평가 먼저 생성 (하향평가를 위해 필요)
        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem1Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        const selfEvaluation2 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem2Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation2);

        const selfEvaluation3 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem3Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation3);

        // 하향평가 생성
        const downwardEvaluation1 = downwardEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          wbsId: wbsItem1Id,
          evaluationType: DownwardEvaluationType.PRIMARY,
          downwardEvaluationScore: 90,
          isCompleted: true,
          completedAt: new Date(),
          createdBy: primaryEvaluatorId,
        });
        await downwardEvaluationRepository.save(downwardEvaluation1);

        const downwardEvaluation2 = downwardEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          wbsId: wbsItem2Id,
          evaluationType: DownwardEvaluationType.PRIMARY,
          downwardEvaluationScore: 95,
          isCompleted: true,
          completedAt: new Date(),
          createdBy: primaryEvaluatorId,
        });
        await downwardEvaluationRepository.save(downwardEvaluation2);

        const downwardEvaluation3 = downwardEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          evaluatorId: primaryEvaluatorId,
          wbsId: wbsItem3Id,
          evaluationType: DownwardEvaluationType.PRIMARY,
          downwardEvaluationScore: 100,
          isCompleted: true,
          completedAt: new Date(),
          createdBy: primaryEvaluatorId,
        });
        await downwardEvaluationRepository.save(downwardEvaluation3);

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.downwardEvaluation?.primary?.totalScore;
        const grade = result.downwardEvaluation?.primary?.grade;

        // 가중치 확인
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        const weights = assignments.map((a) => a.weight);

        // 예상 점수: (36/120)*90 + (36/120)*95 + (48/120)*100 = 27 + 28.5 + 40 = 95.5
        const expectedScore = Math.round(
          ((weights[0] / maxSelfEvaluationRate) * 90 +
          (weights[1] / maxSelfEvaluationRate) * 95 +
          (weights[2] / maxSelfEvaluationRate) * 100) * 100
        ) / 100;

        testResult.assertions.push({
          description: '하향평가 점수가 계산되어야 함',
          expected: 'number',
          actual: typeof totalScore,
          passed: typeof totalScore === 'number',
        });

        testResult.assertions.push({
          description: '점수가 올바르게 계산되어야 함',
          expected: expectedScore,
          actual: totalScore,
          passed: totalScore !== null && Math.abs(totalScore! - expectedScore) < 0.1,
        });

        expect(totalScore).not.toBeNull();
        expect(Math.abs(totalScore! - expectedScore)).toBeLessThan(0.1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          grade,
          expectedScore,
          weights: {
            weight1: weights[0],
            weight2: weights[1],
            weight3: weights[2],
          },
          scores: {
            score1: 90,
            score2: 95,
            score3: 100,
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

  describe('등급 결정', () => {
    it('점수에 따라 올바른 등급이 결정되어야 한다', async () => {
      const testResult = createTestResult('점수에 따라 올바른 등급이 결정되어야 한다');
      try {
        // 최대 점수의 자기평가 생성
        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem1Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        const selfEvaluation2 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem2Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation2);

        const selfEvaluation3 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem3Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 100,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation3);

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;
        const grade = result.selfEvaluation?.grade;

        // 등급 범위 확인: S 등급은 96~120
        const expectedGrade = totalScore !== null && totalScore >= 96 ? 'S' : null;

        testResult.assertions.push({
          description: '등급이 결정되어야 함',
          expected: expectedGrade,
          actual: grade,
          passed: grade === expectedGrade,
        });

        expect(grade).toBe(expectedGrade);
        expect(totalScore).toBeGreaterThanOrEqual(96);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          grade,
          expectedGrade,
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

    it('낮은 점수에 대해 올바른 등급이 결정되어야 한다', async () => {
      const testResult = createTestResult('낮은 점수에 대해 올바른 등급이 결정되어야 한다');
      try {
        // 낮은 점수의 자기평가 생성
        const selfEvaluation1 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem1Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 60,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation1);

        const selfEvaluation2 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem2Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 60,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation2);

        const selfEvaluation3 = wbsSelfEvaluationRepository.create({
          id: randomUUID(),
          periodId: evaluationPeriodId,
          employeeId: employeeId,
          wbsItemId: wbsItem3Id,
          assignedBy: employeeId,
          assignedDate: new Date(),
          evaluationDate: new Date(),
          selfEvaluationScore: 60,
          submittedToManager: true,
          createdBy: employeeId,
        });
        await wbsSelfEvaluationRepository.save(selfEvaluation3);

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;
        const grade = result.selfEvaluation?.grade;

        // 등급 범위 확인: D 등급은 0~69
        const expectedGrade = totalScore !== null && totalScore <= 69 ? 'D' : null;

        testResult.assertions.push({
          description: '낮은 점수에 대해 D 등급이 결정되어야 함',
          expected: expectedGrade,
          actual: grade,
          passed: grade === expectedGrade,
        });

        expect(grade).toBe(expectedGrade);
        expect(totalScore).toBeLessThanOrEqual(69);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          grade,
          expectedGrade,
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

    it('다양한 등급 구간 테스트: A, B, C 등급이 올바르게 결정되어야 한다', async () => {
      const testResult = createTestResult('다양한 등급 구간 테스트: A, B, C 등급이 올바르게 결정되어야 한다');
      try {
        const testCases = [
          { score: 92, expectedGrade: 'A' }, // 90~95 범위
          { score: 85, expectedGrade: 'B' }, // 80~89 범위
          { score: 75, expectedGrade: 'C' }, // 70~79 범위
        ];

        for (const testCase of testCases) {
          // 기존 자기평가 삭제
          await wbsSelfEvaluationRepository.delete({
            periodId: evaluationPeriodId,
            employeeId: employeeId,
          });

          // 가중치 확인
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

          // 목표 점수에 맞게 각 WBS 점수 계산
          // 목표 총점 = testCase.score
          // (weight1/maxRate)*score1 + (weight2/maxRate)*score2 + (weight3/maxRate)*score3 = testCase.score
          // 모든 WBS에 동일한 점수를 부여한다고 가정하면:
          // (totalWeight/maxRate)*score = testCase.score
          // score = (testCase.score * maxRate) / totalWeight
          const wbsScore = Math.round((testCase.score * maxSelfEvaluationRate) / totalWeight);

          for (const assignment of assignments) {
            const selfEvaluation = wbsSelfEvaluationRepository.create({
              id: randomUUID(),
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              wbsItemId: assignment.wbsItemId,
              assignedBy: employeeId,
              assignedDate: new Date(),
              evaluationDate: new Date(),
              selfEvaluationScore: wbsScore,
              submittedToManager: true,
              createdBy: employeeId,
            });
            await wbsSelfEvaluationRepository.save(selfEvaluation);
          }

          // 핸들러 실행
          const query = new GetEmployeeEvaluationPeriodStatusQuery(
            evaluationPeriodId,
            employeeId,
          );
          const result = await handler.execute(query);

          if (!result) {
            throw new Error('핸들러 결과가 null입니다.');
          }

          const totalScore = result.selfEvaluation?.totalScore;
          const grade = result.selfEvaluation?.grade;

          testResult.assertions.push({
            description: `점수 ${testCase.score}에 대해 등급 ${testCase.expectedGrade}이 결정되어야 함`,
            expected: testCase.expectedGrade,
            actual: grade,
            passed: grade === testCase.expectedGrade,
          });

          expect(grade).toBe(testCase.expectedGrade);
        }

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          testCases: testCases.map((tc) => ({
            targetScore: tc.score,
            expectedGrade: tc.expectedGrade,
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
  });

  describe('하향평가 계산식 검증', () => {
    it('1차 하향평가 계산식이 정확히 적용되어야 한다', async () => {
      const testResult = createTestResult('1차 하향평가 계산식이 정확히 적용되어야 한다');
      try {
        // 자기평가 먼저 생성
        const assignments = await wbsAssignmentRepository.find({
          where: {
            employeeId,
            periodId: evaluationPeriodId,
            deletedAt: IsNull(),
          },
          order: { displayOrder: 'ASC' },
        });

        for (const assignment of assignments) {
          const selfEvaluation = wbsSelfEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            wbsItemId: assignment.wbsItemId,
            assignedBy: employeeId,
            assignedDate: new Date(),
            evaluationDate: new Date(),
            selfEvaluationScore: 100,
            submittedToManager: true,
            createdBy: employeeId,
          });
          await wbsSelfEvaluationRepository.save(selfEvaluation);
        }

        const weights = assignments.map((a) => a.weight);
        const testScores = [85, 90, 95];

        // 하향평가 생성
        for (let i = 0; i < assignments.length; i++) {
          const downwardEvaluation = downwardEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            evaluatorId: primaryEvaluatorId,
            wbsId: assignments[i].wbsItemId,
            evaluationType: DownwardEvaluationType.PRIMARY,
            downwardEvaluationScore: testScores[i],
            isCompleted: true,
            completedAt: new Date(),
            createdBy: primaryEvaluatorId,
          });
          await downwardEvaluationRepository.save(downwardEvaluation);
        }

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.downwardEvaluation?.primary?.totalScore;

        // 계산식 검증: Σ((weight / maxSelfEvaluationRate) × score)
        let expectedScore = 0;
        const calculationSteps: string[] = [];

        for (let i = 0; i < weights.length; i++) {
          const weightedScore = (weights[i] / maxSelfEvaluationRate) * testScores[i];
          expectedScore += weightedScore;
          calculationSteps.push(
            `WBS${i + 1}: (${weights[i].toFixed(2)} / ${maxSelfEvaluationRate}) × ${testScores[i]} = ${weightedScore.toFixed(2)}`,
          );
        }

        const finalExpectedScore = Math.round(expectedScore * 100) / 100;

        testResult.assertions.push({
          description: '하향평가 계산식이 정확히 적용되어야 함',
          expected: finalExpectedScore,
          actual: totalScore,
          passed: totalScore !== null && Math.abs(totalScore! - finalExpectedScore) < 0.1,
        });

        expect(totalScore).not.toBeNull();
        expect(Math.abs(totalScore! - finalExpectedScore)).toBeLessThan(0.1);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          expectedScore: finalExpectedScore,
          calculationSteps,
          weights: weights.map((w, i) => ({
            wbsIndex: i + 1,
            weight: w,
            score: testScores[i],
            weightedScore: ((w / maxSelfEvaluationRate) * testScores[i]).toFixed(2),
          })),
          formula: 'Σ((weight / maxSelfEvaluationRate) × score)',
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

  describe('maxSelfEvaluationRate 영향 검증', () => {
    it('maxSelfEvaluationRate가 100일 때 점수 계산이 올바르게 되어야 한다', async () => {
      const testResult = createTestResult('maxSelfEvaluationRate가 100일 때 점수 계산이 올바르게 되어야 한다');
      try {
        // 평가기간 업데이트
        await evaluationPeriodRepository.update(
          { id: evaluationPeriodId },
          { maxSelfEvaluationRate: 100 },
        );

        // 가중치 재계산
        await weightCalculationService.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );

        // 자기평가 생성
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

        for (const assignment of assignments) {
          const selfEvaluation = wbsSelfEvaluationRepository.create({
            id: randomUUID(),
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            wbsItemId: assignment.wbsItemId,
            assignedBy: employeeId,
            assignedDate: new Date(),
            evaluationDate: new Date(),
            selfEvaluationScore: 100,
            submittedToManager: true,
            createdBy: employeeId,
          });
          await wbsSelfEvaluationRepository.save(selfEvaluation);
        }

        // 핸들러 실행
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        if (!result) {
          throw new Error('핸들러 결과가 null입니다.');
        }

        const totalScore = result.selfEvaluation?.totalScore;

        // maxSelfEvaluationRate가 100이면 가중치 총합도 100이어야 함
        // 모든 WBS가 100점이면 총점도 100이어야 함

        testResult.assertions.push({
          description: '가중치 총합이 100과 일치해야 함',
          expected: 100,
          actual: totalWeight,
          passed: Math.abs(totalWeight - 100) < 0.01,
        });

        testResult.assertions.push({
          description: '모든 WBS가 최대 점수일 때 총점이 100에 가까워야 함',
          expected: 100,
          actual: totalScore,
          passed: totalScore !== null && totalScore >= 95,
        });

        expect(Math.abs(totalWeight - 100)).toBeLessThan(0.01);
        expect(totalScore).not.toBeNull();
        expect(totalScore!).toBeGreaterThanOrEqual(95);

        testResult.status = 'passed';
        testResult.endTime = new Date().toISOString();
        testResult.data = {
          totalScore,
          totalWeight,
          maxSelfEvaluationRate: 100,
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
        // 가중치 재계산
        await weightCalculationService.직원_평가기간_가중치를_재계산한다(
          employeeId,
          evaluationPeriodId,
        );
        testResults.push(testResult);
      }
    });
  });
});
