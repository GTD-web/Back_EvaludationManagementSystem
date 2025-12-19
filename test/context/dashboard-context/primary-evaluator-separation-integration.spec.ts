import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  GetEmployeeEvaluationPeriodStatusHandler,
  GetEmployeeEvaluationPeriodStatusQuery,
} from '@context/dashboard-context/handlers/queries/get-employee-evaluation-period-status';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { PrimaryEvaluationStepApprovalModule } from '@domain/sub/primary-evaluation-step-approval';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApproval } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.entity';
import { PrimaryEvaluationStepApproval } from '@domain/sub/primary-evaluation-step-approval/primary-evaluation-step-approval.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { RecipientType } from '@domain/sub/evaluation-revision-request';

/**
 * Dashboard Context - 1차 평가자별 분리 기능 통합 테스트
 *
 * dashboard-context에서 1차 평가자별 stepApproval 정보가 제대로 분리되어 반환되는지 검증합니다.
 * 1차 평가자가 여러 명일 때 각 평가자별로 독립적인 상태를 가지는지 확인합니다.
 */
describe('GetEmployeeEvaluationPeriodStatusHandler - 1차 평가자별 분리 기능 Integration', () => {
  let handler: GetEmployeeEvaluationPeriodStatusHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>;
  let primaryStepApprovalRepository: Repository<PrimaryEvaluationStepApproval>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;
  let revisionRequestRepository: Repository<EvaluationRevisionRequest>;
  let recipientRepository: Repository<EvaluationRevisionRequestRecipient>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;
  let adminId: string;
  let primaryEvaluatorId1: string;
  let primaryEvaluatorId2: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    // 모듈 초기화
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        EmployeeEvaluationStepApprovalModule,
        PrimaryEvaluationStepApprovalModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          EmployeeEvaluationStepApproval,
          PrimaryEvaluationStepApproval,
          EvaluationProjectAssignment,
          EvaluationWbsAssignment,
          WbsEvaluationCriteria,
          EvaluationLine,
          EvaluationLineMapping,
          WbsSelfEvaluation,
          DownwardEvaluation,
          PeerEvaluation,
          FinalEvaluation,
          EvaluationRevisionRequest,
          EvaluationRevisionRequestRecipient,
        ]),
      ],
      providers: [GetEmployeeEvaluationPeriodStatusHandler],
    }).compile();

    handler = module.get<GetEmployeeEvaluationPeriodStatusHandler>(
      GetEmployeeEvaluationPeriodStatusHandler,
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
    primaryStepApprovalRepository = dataSource.getRepository(
      PrimaryEvaluationStepApproval,
    );
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );
    revisionRequestRepository = dataSource.getRepository(
      EvaluationRevisionRequest,
    );
    recipientRepository = dataSource.getRepository(
      EvaluationRevisionRequestRecipient,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    adminId = systemAdminId;
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
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

    // 4. 평가기간-직원 매핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;
  }

  /**
   * 1차 평가자 포함 테스트 데이터 생성
   */
  async function 일차평가자_포함_테스트데이터를_생성한다(): Promise<void> {
    await 기본_테스트데이터를_생성한다();

    // 1차 평가자 1 생성
    const primaryEvaluator1 = employeeRepository.create({
      name: '이일차평가자1',
      employeeNumber: 'EMP002',
      email: 'primary1@test.com',
      externalId: 'EXT002',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator1 =
      await employeeRepository.save(primaryEvaluator1);
    primaryEvaluatorId1 = savedPrimaryEvaluator1.id;

    // 1차 평가자 2 생성
    const primaryEvaluator2 = employeeRepository.create({
      name: '박일차평가자2',
      employeeNumber: 'EMP003',
      email: 'primary2@test.com',
      externalId: 'EXT003',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedPrimaryEvaluator2 =
      await employeeRepository.save(primaryEvaluator2);
    primaryEvaluatorId2 = savedPrimaryEvaluator2.id;

    // 평가라인 생성 (1차 평가라인은 하나만 생성, 여러 평가자는 같은 라인을 사용)
    const primaryLine = evaluationLineRepository.create({
      evaluatorType: EvaluatorType.PRIMARY,
      order: 1,
      isRequired: true,
      isAutoAssigned: false,
      version: 1,
      createdBy: systemAdminId,
    });
    const savedPrimaryLine = await evaluationLineRepository.save(primaryLine);

    // 평가라인 매핑 생성 - 1차 평가자들은 같은 평가라인을 사용하지만 다른 평가자 ID
    const primaryLineMapping1 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId1,
      evaluationLineId: savedPrimaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(primaryLineMapping1);

    const primaryLineMapping2 = evaluationLineMappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      evaluatorId: primaryEvaluatorId2,
      evaluationLineId: savedPrimaryLine.id,
      version: 1,
      createdBy: systemAdminId,
    });
    await evaluationLineMappingRepository.save(primaryLineMapping2);
  }

  describe('1차 평가자별 분리 기능 검증', () => {
    it('여러 1차 평가자가 있을 때 primaryEvaluationStatuses 배열이 반환되어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      // 재작성 요청이 정말 없는지 확인
      const existingRequests = await revisionRequestRepository
        .createQueryBuilder('request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'primary' })
        .getMany();

      // 재작성 요청이 있으면 삭제
      if (existingRequests.length > 0) {
        for (const req of existingRequests) {
          await recipientRepository
            .createQueryBuilder()
            .delete()
            .from(EvaluationRevisionRequestRecipient)
            .where('revisionRequestId = :id', { id: req.id })
            .execute();
          await revisionRequestRepository.remove(req);
        }
      }

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();
      expect(result!.stepApproval.primaryEvaluationStatuses).toBeDefined();
      expect(
        Array.isArray(result!.stepApproval.primaryEvaluationStatuses),
      ).toBe(true);
      expect(result!.stepApproval.primaryEvaluationStatuses.length).toBe(2);

      // 각 평가자 정보 확인
      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.evaluatorName).toBe('이일차평가자1');
      expect(evaluator1Status!.evaluatorEmployeeNumber).toBe('EMP002');
      expect(evaluator1Status!.evaluatorEmail).toBe('primary1@test.com');
      expect(evaluator1Status!.status).toBe('pending');

      const evaluator2Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );
      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.evaluatorName).toBe('박일차평가자2');
      expect(evaluator2Status!.evaluatorEmployeeNumber).toBe('EMP003');
      expect(evaluator2Status!.evaluatorEmail).toBe('primary2@test.com');
      expect(evaluator2Status!.status).toBe('pending');
    });

    it('모든 1차 평가자가 승인 상태가 아닐 때는 최종 상태가 pending이어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.PENDING, // 승인 상태가 아님
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 모든 평가자가 승인 상태가 아니므로 최종 상태는 pending이어야 함
      expect(result!.stepApproval.primaryEvaluationStatus).toBe('pending');

      // 각 평가자 상태도 pending이어야 함
      result!.stepApproval.primaryEvaluationStatuses.forEach((status) => {
        expect(status.status).toBe('pending');
      });
    });

    it('재작성 요청이 있는 경우 상태가 revision_requested로 반환되어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      // 수신자 생성 (첫 번째 1차 평가자에게만)
      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: primaryEvaluatorId1,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 첫 번째 평가자는 revision_requested 상태
      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_requested');
      expect(evaluator1Status!.revisionRequestId).toBe(savedRevisionRequest.id);
      expect(evaluator1Status!.revisionComment).toBe(
        '1차 평가를 수정해주세요.',
      );
      expect(evaluator1Status!.isRevisionCompleted).toBe(false);

      // 두 번째 평가자는 pending 상태 (재작성 요청 없음)
      const evaluator2Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );
      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.status).toBe('pending');
      expect(evaluator2Status!.revisionRequestId).toBeNull();

      // 최종 상태는 revision_requested여야 함
      expect(result!.stepApproval.primaryEvaluationStatus).toBe(
        'revision_requested',
      );
    });

    it('재작성 요청이 완료된 경우 상태가 revision_completed로 반환되어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      // 수신자 생성 (재작성 완료)
      const completedAt = new Date();
      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: primaryEvaluatorId1,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: completedAt,
        responseComment: '수정 완료했습니다.',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 첫 번째 평가자는 revision_completed 상태
      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_completed');
      expect(evaluator1Status!.revisionRequestId).toBe(savedRevisionRequest.id);
      expect(evaluator1Status!.isRevisionCompleted).toBe(true);
      expect(evaluator1Status!.revisionCompletedAt).toBeDefined();
      expect(evaluator1Status!.responseComment).toBe('수정 완료했습니다.');
      expect(evaluator1Status!.revisionComment).toBe(
        '1차 평가를 수정해주세요.',
      );
    });

    it('모든 1차 평가자가 재작성 완료했을 때 최종 상태가 revision_completed여야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 첫 번째 1차 평가자에게 재작성 요청 생성 및 완료
      const revisionRequest1 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가자 1에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRequest1 =
        await revisionRequestRepository.save(revisionRequest1);

      const recipient1 = recipientRepository.create({
        revisionRequestId: savedRequest1.id,
        recipientId: primaryEvaluatorId1,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: new Date(now.getTime() + 1000),
        responseComment: '첫 번째 평가자 완료',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient1);

      // 두 번째 1차 평가자에게 재작성 요청 생성 및 완료
      const revisionRequest2 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가자 2에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRequest2 =
        await revisionRequestRepository.save(revisionRequest2);

      const recipient2 = recipientRepository.create({
        revisionRequestId: savedRequest2.id,
        recipientId: primaryEvaluatorId2,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: new Date(now.getTime() + 2000),
        responseComment: '두 번째 평가자 완료',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient2);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 모든 평가자가 revision_completed 상태
      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
      const evaluator2Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );

      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_completed');
      expect(evaluator1Status!.isRevisionCompleted).toBe(true);
      expect(evaluator1Status!.responseComment).toBe('첫 번째 평가자 완료');

      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.status).toBe('revision_completed');
      expect(evaluator2Status!.isRevisionCompleted).toBe(true);
      expect(evaluator2Status!.responseComment).toBe('두 번째 평가자 완료');

      // 최종 상태는 revision_completed여야 함
      expect(result!.stepApproval.primaryEvaluationStatus).toBe(
        'revision_completed',
      );
    });

    it('일부 1차 평가자만 재작성 완료했을 때 최종 상태는 revision_requested여야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 첫 번째 1차 평가자에게 재작성 요청 생성 및 완료
      const revisionRequest1 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가자 1에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRequest1 =
        await revisionRequestRepository.save(revisionRequest1);

      const recipient1 = recipientRepository.create({
        revisionRequestId: savedRequest1.id,
        recipientId: primaryEvaluatorId1,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: new Date(now.getTime() + 1000),
        responseComment: '첫 번째 평가자 완료',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient1);

      // 두 번째 1차 평가자에게 재작성 요청 생성 (미완료)
      const revisionRequest2 = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가자 2에게 재작성 요청',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRequest2 =
        await revisionRequestRepository.save(revisionRequest2);

      const recipient2 = recipientRepository.create({
        revisionRequestId: savedRequest2.id,
        recipientId: primaryEvaluatorId2,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: false,
        isCompleted: false,
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient2);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      // 첫 번째 평가자는 revision_completed 상태
      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_completed');
      expect(evaluator1Status!.isRevisionCompleted).toBe(true);

      // 두 번째 평가자는 revision_requested 상태
      const evaluator2Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );
      expect(evaluator2Status).toBeDefined();
      expect(evaluator2Status!.status).toBe('revision_requested');
      expect(evaluator2Status!.isRevisionCompleted).toBe(false);

      // 최종 상태는 revision_requested여야 함 (모든 평가자가 완료하지 않았으므로)
      expect(result!.stepApproval.primaryEvaluationStatus).toBe(
        'revision_requested',
      );
    });

    it('재작성 완료된 평가자의 모든 필드가 올바르게 반환되어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const completedAt = new Date(now.getTime() + 5000);
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.REVISION_REQUESTED,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // 재작성 요청 생성
      const revisionRequest = revisionRequestRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId,
        step: 'primary',
        comment: '1차 평가를 수정해주세요.',
        requestedBy: adminId,
        requestedAt: now,
        createdBy: systemAdminId,
      });
      const savedRevisionRequest =
        await revisionRequestRepository.save(revisionRequest);

      // 수신자 생성 (재작성 완료)
      const recipient = recipientRepository.create({
        revisionRequestId: savedRevisionRequest.id,
        recipientId: primaryEvaluatorId1,
        recipientType: RecipientType.PRIMARY_EVALUATOR,
        isRead: true,
        readAt: now,
        isCompleted: true,
        completedAt: completedAt,
        responseComment: '평가 완료했습니다. 모든 항목을 수정했습니다.',
        createdBy: systemAdminId,
      });
      await recipientRepository.save(recipient);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();

      const evaluator1Status =
        result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );

      expect(evaluator1Status).toBeDefined();
      expect(evaluator1Status!.status).toBe('revision_completed');
      expect(evaluator1Status!.revisionRequestId).toBe(savedRevisionRequest.id);
      expect(evaluator1Status!.revisionComment).toBe(
        '1차 평가를 수정해주세요.',
      );
      expect(evaluator1Status!.isRevisionCompleted).toBe(true);
      expect(evaluator1Status!.revisionCompletedAt).toBeDefined();
      expect(evaluator1Status!.revisionCompletedAt).toBeInstanceOf(Date);
      expect(evaluator1Status!.responseComment).toBe(
        '평가 완료했습니다. 모든 항목을 수정했습니다.',
      );
      // completedAt 시간이 올바르게 반환되는지 확인
      expect(new Date(evaluator1Status!.revisionCompletedAt!).getTime()).toBe(
        completedAt.getTime(),
      );
    });

    it('primaryEvaluationStatuses 배열의 각 항목이 올바른 필드를 가지고 있어야 한다', async () => {
      // Given
      await 일차평가자_포함_테스트데이터를_생성한다();

      const now = new Date();
      const stepApproval = stepApprovalRepository.create({
        evaluationPeriodEmployeeMappingId: mappingId,
        criteriaSettingStatus: StepApprovalStatus.PENDING,
        selfEvaluationStatus: StepApprovalStatus.PENDING,
        primaryEvaluationStatus: StepApprovalStatus.APPROVED,
        primaryEvaluationApprovedBy: adminId,
        primaryEvaluationApprovedAt: now,
        secondaryEvaluationStatus: StepApprovalStatus.PENDING,
        createdBy: systemAdminId,
      });
      await stepApprovalRepository.save(stepApproval);

      // When
      const query = new GetEmployeeEvaluationPeriodStatusQuery(
        evaluationPeriodId,
        employeeId,
      );
      const result = await handler.execute(query);

      // Then
      expect(result).toBeDefined();
      expect(result!.stepApproval).toBeDefined();
      expect(result!.stepApproval.primaryEvaluationStatuses.length).toBe(2);

      // 각 항목의 필수 필드 확인
      const requiredFields = [
        'evaluatorId',
        'evaluatorName',
        'evaluatorEmployeeNumber',
        'evaluatorEmail',
        'status',
        'approvedBy',
        'approvedAt',
        'revisionRequestId',
        'revisionComment',
        'isRevisionCompleted',
        'revisionCompletedAt',
      ];

      result!.stepApproval.primaryEvaluationStatuses.forEach((status) => {
        for (const field of requiredFields) {
          expect(status).toHaveProperty(field);
          expect((status as any)[field]).not.toBe(undefined);
        }

        // 타입 검증
        expect(typeof status.evaluatorId).toBe('string');
        expect(typeof status.evaluatorName).toBe('string');
        expect(typeof status.evaluatorEmployeeNumber).toBe('string');
        expect(typeof status.evaluatorEmail).toBe('string');
        expect([
          'pending',
          'approved',
          'revision_requested',
          'revision_completed',
        ]).toContain(status.status);
        expect(typeof status.isRevisionCompleted).toBe('boolean');
      });
    });

    describe('부분 승인 기능 검증 - primary_evaluation_step_approval 테이블 사용', () => {
      it('평가자별로 개별 승인 상태를 가질 수 있어야 한다 (부분 승인)', async () => {
        // Given
        await 일차평가자_포함_테스트데이터를_생성한다();

        const now = new Date();
        const stepApproval = stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        });
        await stepApprovalRepository.save(stepApproval);

        // 평가자 1만 승인 상태로 설정
        const primaryApproval1 = primaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: primaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
          createdBy: adminId,
        });
        await primaryStepApprovalRepository.save(primaryApproval1);

        // 평가자 2는 pending 상태 (승인 안됨)

        // When
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        // Then
        expect(result).toBeDefined();
        expect(result!.stepApproval).toBeDefined();
        expect(result!.stepApproval.primaryEvaluationStatuses.length).toBe(2);

        // 평가자 1은 approved 상태
        const status1 = result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
        expect(status1).toBeDefined();
        expect(status1!.status).toBe('approved');
        expect(status1!.approvedBy).toBe(adminId);
        expect(status1!.approvedAt).toBeInstanceOf(Date);

        // 평가자 2는 pending 상태
        const status2 = result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );
        expect(status2).toBeDefined();
        expect(status2!.status).toBe('pending');
        expect(status2!.approvedBy).toBeNull();
        expect(status2!.approvedAt).toBeNull();

        // 통합 상태는 pending (모든 평가자가 승인되지 않았으므로)
        expect(result!.stepApproval.primaryEvaluationStatus).toBe('pending');
      });

      it('모든 평가자가 승인되면 통합 상태가 approved가 되어야 한다', async () => {
        // Given
        await 일차평가자_포함_테스트데이터를_생성한다();

        const now = new Date();
        const stepApproval = stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        });
        await stepApprovalRepository.save(stepApproval);

        // 모든 평가자 승인
        const primaryApproval1 = primaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: primaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
          createdBy: adminId,
        });
        await primaryStepApprovalRepository.save(primaryApproval1);

        const primaryApproval2 = primaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: primaryEvaluatorId2,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
          createdBy: adminId,
        });
        await primaryStepApprovalRepository.save(primaryApproval2);

        // When
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        // Then
        expect(result).toBeDefined();
        expect(result!.stepApproval).toBeDefined();

        // 모든 평가자가 approved 상태
        result!.stepApproval.primaryEvaluationStatuses.forEach((status) => {
          expect(status.status).toBe('approved');
          expect(status.approvedBy).toBe(adminId);
          expect(status.approvedAt).toBeInstanceOf(Date);
        });

        // 통합 상태는 approved
        expect(result!.stepApproval.primaryEvaluationStatus).toBe('approved');
      });

      it('재작성 요청이 있는 평가자와 승인된 평가자가 함께 있을 수 있어야 한다', async () => {
        // Given
        await 일차평가자_포함_테스트데이터를_생성한다();

        const now = new Date();
        const stepApproval = stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        });
        await stepApprovalRepository.save(stepApproval);

        // 평가자 1은 승인 상태
        const primaryApproval1 = primaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: primaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: now,
          createdBy: adminId,
        });
        await primaryStepApprovalRepository.save(primaryApproval1);

        // 평가자 2에게 재작성 요청 생성
        const revisionRequest = revisionRequestRepository.create({
          evaluationPeriodId: evaluationPeriodId,
          employeeId: employeeId,
          step: 'primary',
          comment: '재작성 요청합니다.',
          requestedBy: adminId,
          requestedAt: now,
          createdBy: adminId,
        });
        const savedRevisionRequest =
          await revisionRequestRepository.save(revisionRequest);

        const recipient = recipientRepository.create({
          revisionRequestId: savedRevisionRequest.id,
          recipientId: primaryEvaluatorId2,
          recipientType: RecipientType.PRIMARY_EVALUATOR,
          isCompleted: false,
          createdBy: adminId,
        });
        await recipientRepository.save(recipient);

        // When
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        // Then
        expect(result).toBeDefined();
        expect(result!.stepApproval).toBeDefined();

        // 평가자 1은 approved 상태
        const status1 = result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
        expect(status1).toBeDefined();
        expect(status1!.status).toBe('approved');
        expect(status1!.revisionRequestId).toBeNull();

        // 평가자 2는 revision_requested 상태
        const status2 = result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId2,
        );
        expect(status2).toBeDefined();
        expect(status2!.status).toBe('revision_requested');
        expect(status2!.revisionRequestId).toBe(savedRevisionRequest.id);
        expect(status2!.revisionComment).toBe('재작성 요청합니다.');

        // 통합 상태는 revision_requested (재작성 요청이 하나라도 있으면)
        expect(result!.stepApproval.primaryEvaluationStatus).toBe(
          'revision_requested',
        );
      });

      it('primary_evaluation_step_approval 테이블에서 승인 정보를 올바르게 조회해야 한다', async () => {
        // Given
        await 일차평가자_포함_테스트데이터를_생성한다();

        const approvedAt = new Date('2024-01-15T10:00:00Z');
        const stepApproval = stepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          criteriaSettingStatus: StepApprovalStatus.PENDING,
          selfEvaluationStatus: StepApprovalStatus.PENDING,
          primaryEvaluationStatus: StepApprovalStatus.PENDING,
          secondaryEvaluationStatus: StepApprovalStatus.PENDING,
          createdBy: systemAdminId,
        });
        await stepApprovalRepository.save(stepApproval);

        // 평가자 1 승인 정보 생성
        const primaryApproval1 = primaryStepApprovalRepository.create({
          evaluationPeriodEmployeeMappingId: mappingId,
          evaluatorId: primaryEvaluatorId1,
          status: StepApprovalStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: approvedAt,
          createdBy: adminId,
        });
        await primaryStepApprovalRepository.save(primaryApproval1);

        // When
        const query = new GetEmployeeEvaluationPeriodStatusQuery(
          evaluationPeriodId,
          employeeId,
        );
        const result = await handler.execute(query);

        // Then
        expect(result).toBeDefined();
        const status1 = result!.stepApproval.primaryEvaluationStatuses.find(
          (s) => s.evaluatorId === primaryEvaluatorId1,
        );
        expect(status1).toBeDefined();
        expect(status1!.status).toBe('approved');
        expect(status1!.approvedBy).toBe(adminId);
        expect(status1!.approvedAt).toBeInstanceOf(Date);
        expect(status1!.approvedAt!.getTime()).toBe(approvedAt.getTime());
      });
    });
  });
});
