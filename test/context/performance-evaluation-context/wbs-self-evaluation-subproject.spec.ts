import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Project } from '@domain/common/project/project.entity';
import { DatabaseModule } from '@libs/database/database.module';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';

/**
 * Performance Evaluation Context - WBS Self Evaluation SubProject 단위 테스트
 *
 * WbsSelfEvaluation의 subProject 필드가 올바르게 저장, 조회, 수정되는지 검증합니다.
 */
describe('Performance Evaluation Context - WBS Self Evaluation SubProject', () => {
  let wbsSelfEvaluationService: WbsSelfEvaluationService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let wbsItemRepository: Repository<WbsItem>;
  let projectRepository: Repository<Project>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let projectId: string;
  let wbsItemId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        WbsSelfEvaluationModule,
        TypeOrmModule.forFeature([
          WbsSelfEvaluation,
          EvaluationPeriod,
          Employee,
          Department,
          WbsItem,
          Project,
        ]),
      ],
    }).compile();

    wbsSelfEvaluationService = module.get<WbsSelfEvaluationService>(
      WbsSelfEvaluationService,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    wbsSelfEvaluationRepository = dataSource.getRepository(WbsSelfEvaluation);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    wbsItemRepository = dataSource.getRepository(WbsItem);
    projectRepository = dataSource.getRepository(Project);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await wbsSelfEvaluationRepository.query(
      'DELETE FROM wbs_self_evaluation',
    );
    await wbsItemRepository.query('DELETE FROM wbs_item');
    await projectRepository.query('DELETE FROM project');
    await employeeRepository.query('DELETE FROM employee');
    await departmentRepository.query('DELETE FROM department');
    await evaluationPeriodRepository.query('DELETE FROM evaluation_period');

    await module.close();
  });

  beforeEach(async () => {
    // 기존 테스트 데이터 정리
    await wbsSelfEvaluationRepository.query(
      'DELETE FROM wbs_self_evaluation',
    );
    await wbsItemRepository.query('DELETE FROM wbs_item');
    await projectRepository.query('DELETE FROM project');
    await employeeRepository.query('DELETE FROM employee');
    await departmentRepository.query('DELETE FROM department');
    await evaluationPeriodRepository.query('DELETE FROM evaluation_period');

    // 기본 테스트 데이터 생성

    // 부서 생성
    const department = departmentRepository.create({
      code: 'TEST_DEPT',
      name: '테스트 부서',
      externalId: 'EXT_TEST_DEPT',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      parentId: null,
      depth: 1,
      orderIndex: 1,
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 직원 생성
    const employee = employeeRepository.create({
      employeeNumber: 'TEST001',
      name: '테스트 직원',
      email: 'test@example.com',
      departmentId: departmentId,
      joinDate: new Date('2023-01-01'),
      isActive: true,
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 1분기 평가기간',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      peerEvaluationDeadline: new Date('2024-03-31'),
      description: 'subProject 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.PERIOD_SETUP,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 프로젝트 생성
    const project = projectRepository.create({
      code: 'TEST_PROJECT',
      name: '테스트 프로젝트',
      description: 'subProject 테스트용 프로젝트',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      createdBy: systemAdminId,
    });
    const savedProject = await projectRepository.save(project);
    projectId = savedProject.id;

    // WBS Item 생성
    const wbsItem = wbsItemRepository.create({
      projectId: projectId,
      code: 'WBS001',
      name: '테스트 WBS',
      description: 'subProject 테스트용 WBS',
      depth: 1,
      orderIndex: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem = await wbsItemRepository.save(wbsItem);
    wbsItemId = savedWbsItem.id;
  });

  describe('subProject 생성 테스트', () => {
    it('subProject 값을 포함하여 자기평가를 생성할 수 있다', async () => {
      // Given
      const subProjectValue = '모바일 앱 개발';

      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: 'subProject 테스트 자기평가',
        selfEvaluationScore: 100,
        performanceResult: '모바일 앱 개발 완료',
        subProject: subProjectValue,
        createdBy: systemAdminId,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.subProject).toBe(subProjectValue);
      expect(result.selfEvaluationContent).toBe('subProject 테스트 자기평가');
      expect(result.selfEvaluationScore).toBe(100);

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.subProject).toBe(subProjectValue);
    });

    it('subProject 없이 자기평가를 생성하면 null로 저장된다', async () => {
      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: 'subProject 없는 자기평가',
        selfEvaluationScore: 90,
        performanceResult: '일반 작업 완료',
        createdBy: systemAdminId,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.subProject).toBeUndefined();

      // DB 확인 - null로 저장되었는지 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.subProject).toBeNull();
    });

    it('subProject에 null을 명시적으로 전달하면 null로 저장된다', async () => {
      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: 'subProject null 테스트',
        selfEvaluationScore: 80,
        performanceResult: '작업 완료',
        subProject: null,
        createdBy: systemAdminId,
      });

      // Then
      expect(result).toBeDefined();
      expect(result.subProject).toBeNull();

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.subProject).toBeNull();
    });
  });

  describe('subProject 조회 테스트', () => {
    it('subProject가 포함된 자기평가를 조회할 수 있다', async () => {
      // Given
      const subProjectValue = '백엔드 API 개발';
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 95,
        performanceResult: 'API 개발 완료',
        subProject: subProjectValue,
        createdBy: systemAdminId,
      });

      // When
      const result = await wbsSelfEvaluationService.단건_조회한다(created.id);

      // Then
      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.subProject).toBe(subProjectValue);
      expect(result!.performanceResult).toBe('API 개발 완료');
    });

    it('subProject가 null인 자기평가를 조회하면 null로 반환된다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
        createdBy: systemAdminId,
      });

      // When
      const result = await wbsSelfEvaluationService.단건_조회한다(created.id);

      // Then
      expect(result).toBeDefined();
      expect(result!.subProject).toBeUndefined();
    });
  });

  describe('subProject 수정 테스트', () => {
    it('subProject 값을 수정할 수 있다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '초기 평가',
        selfEvaluationScore: 80,
        subProject: '백엔드 API',
        createdBy: systemAdminId,
      });

      expect(created.subProject).toBe('백엔드 API');

      // When
      const updated = await wbsSelfEvaluationService.수정한다(
        created.id,
        {
          selfEvaluationContent: '수정된 평가',
          selfEvaluationScore: 95,
          subProject: '프론트엔드 UI',
        },
        systemAdminId,
      );

      // Then
      expect(updated.id).toBe(created.id);
      expect(updated.subProject).toBe('프론트엔드 UI');
      expect(updated.version).toBeGreaterThan(created.version);

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: created.id },
      });
      expect(dbRecord!.subProject).toBe('프론트엔드 UI');
    });

    it('subProject를 null로 수정할 수 있다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '초기 평가',
        selfEvaluationScore: 90,
        subProject: '데이터베이스 설계',
        createdBy: systemAdminId,
      });

      expect(created.subProject).toBe('데이터베이스 설계');

      // When
      const updated = await wbsSelfEvaluationService.수정한다(
        created.id,
        {
          selfEvaluationContent: '수정된 평가',
          selfEvaluationScore: 85,
          subProject: null,
        },
        systemAdminId,
      );

      // Then
      expect(updated.id).toBe(created.id);
      expect(updated.subProject).toBeNull();

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: created.id },
      });
      expect(dbRecord!.subProject).toBeNull();
    });

    it('null인 subProject에 값을 추가할 수 있다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '초기 평가',
        selfEvaluationScore: 75,
        createdBy: systemAdminId,
      });

      expect(created.subProject).toBeUndefined();

      // When
      const updated = await wbsSelfEvaluationService.수정한다(
        created.id,
        {
          selfEvaluationContent: '수정된 평가',
          selfEvaluationScore: 90,
          subProject: '시스템 통합',
        },
        systemAdminId,
      );

      // Then
      expect(updated.id).toBe(created.id);
      expect(updated.subProject).toBe('시스템 통합');

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: created.id },
      });
      expect(dbRecord!.subProject).toBe('시스템 통합');
    });
  });

  describe('subProject 제출 상태와의 관계 테스트', () => {
    it('1차 평가자에게 제출 후에도 subProject가 유지된다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '제출 테스트',
        selfEvaluationScore: 100,
        subProject: '테스트 자동화',
        createdBy: systemAdminId,
      });

      // When - 1차 평가자 제출
      const submitted = await wbsSelfEvaluationService.일차평가자_제출한다(
        created.id,
        systemAdminId,
      );

      // Then
      expect(submitted.submittedToEvaluator).toBe(true);
      expect(submitted.subProject).toBe('테스트 자동화');

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: created.id },
      });
      expect(dbRecord!.subProject).toBe('테스트 자동화');
      expect(dbRecord!.submittedToEvaluator).toBe(true);
    });

    it('관리자에게 제출 후에도 subProject가 유지된다', async () => {
      // Given
      const created = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '제출 테스트',
        selfEvaluationScore: 110,
        subProject: 'CI/CD 파이프라인',
        createdBy: systemAdminId,
      });

      await wbsSelfEvaluationService.일차평가자_제출한다(
        created.id,
        systemAdminId,
      );

      // When - 관리자 제출
      const submitted = await wbsSelfEvaluationService.제출한다(
        created.id,
        systemAdminId,
      );

      // Then
      expect(submitted.submittedToManager).toBe(true);
      expect(submitted.subProject).toBe('CI/CD 파이프라인');

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: created.id },
      });
      expect(dbRecord!.subProject).toBe('CI/CD 파이프라인');
      expect(dbRecord!.submittedToManager).toBe(true);
    });
  });

  describe('subProject 특수 문자 및 길이 테스트', () => {
    it('긴 subProject 문자열을 저장할 수 있다', async () => {
      // Given
      const longSubProject =
        '매우 긴 프로젝트명을 가진 서브 프로젝트 - 모바일 앱 개발 및 백엔드 API 구축';

      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '긴 문자열 테스트',
        selfEvaluationScore: 90,
        subProject: longSubProject,
        createdBy: systemAdminId,
      });

      // Then
      expect(result.subProject).toBe(longSubProject);

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord!.subProject).toBe(longSubProject);
    });

    it('특수 문자가 포함된 subProject를 저장할 수 있다', async () => {
      // Given
      const specialCharsSubProject = '프로젝트 (Phase 1) - API 개발 & 테스트';

      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '특수 문자 테스트',
        selfEvaluationScore: 85,
        subProject: specialCharsSubProject,
        createdBy: systemAdminId,
      });

      // Then
      expect(result.subProject).toBe(specialCharsSubProject);

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord!.subProject).toBe(specialCharsSubProject);
    });

    it('빈 문자열 subProject를 저장하면 빈 문자열로 저장된다', async () => {
      // When
      const result = await wbsSelfEvaluationService.생성한다({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        selfEvaluationContent: '빈 문자열 테스트',
        selfEvaluationScore: 80,
        subProject: '',
        createdBy: systemAdminId,
      });

      // Then
      expect(result.subProject).toBe('');

      // DB 확인
      const dbRecord = await wbsSelfEvaluationRepository.findOne({
        where: { id: result.id },
      });
      expect(dbRecord!.subProject).toBe('');
    });
  });
});

