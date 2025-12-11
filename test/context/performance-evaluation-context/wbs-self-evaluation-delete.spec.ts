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
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectStatus } from '@domain/common/project/project.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Performance Evaluation Context - WBS Self Evaluation Delete 통합 테스트
 *
 * WbsSelfEvaluationService.삭제한다() 메서드의 soft delete 동작을 검증합니다.
 */
describe('Performance Evaluation Context - WBS Self Evaluation Delete (Soft Delete)', () => {
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
  let selfEvaluationId1: string;
  let selfEvaluationId2: string;
  let selfEvaluationId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const deletedBy = 'test-admin-user-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

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
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'wbs-self-evaluation-delete-test-result.json',
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

      const wbsItems = await wbsItemRepository.find();
      await wbsItemRepository.remove(wbsItems);

      const projects = await projectRepository.find();
      await projectRepository.remove(projects);

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
      name: '김테스트',
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
    const wbsItem = wbsItemRepository.create({
      wbsCode: 'WBS001',
      title: 'WBS 항목 1',
      projectId: projectId,
      level: 1,
      createdBy: systemAdminId,
    });
    const savedWbsItem = await wbsItemRepository.save(wbsItem);
    wbsItemId = savedWbsItem.id;

    // 6. WBS 자기평가 생성 (3개)
    const selfEvaluation1 = wbsSelfEvaluationRepository.create({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
      wbsItemId: wbsItemId,
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
      wbsItemId: wbsItemId,
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
      wbsItemId: wbsItemId,
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

  describe('WbsSelfEvaluationService.삭제한다() - 기본 동작', () => {
    it('삭제 시 deletedAt이 현재 시간으로 설정되어야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const beforeDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
      });
      expect(beforeDelete).toBeDefined();
      expect(beforeDelete!.deletedAt).toBeNull();

      const beforeTime = new Date();

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      const afterTime = new Date();

      // Then
      const afterDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
        withDeleted: true,
      });

      expect(afterDelete).toBeDefined();
      expect(afterDelete!.deletedAt).not.toBeNull();
      expect(afterDelete!.deletedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(afterDelete!.deletedAt!.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제 시 deletedAt이 현재 시간으로 설정되어야 함',
        result: {
          selfEvaluationId: selfEvaluationId1,
          deletedAtSet: afterDelete!.deletedAt !== null,
          deletedAtValue: afterDelete!.deletedAt?.toISOString(),
        },
      });
    });

    it('삭제 시 물리적으로 데이터가 유지되어야 함 (Soft Delete)', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const deletedData = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
        withDeleted: true,
      });

      expect(deletedData).toBeDefined();
      expect(deletedData!.id).toBe(selfEvaluationId1);
      expect(deletedData!.selfEvaluationContent).toBe('자기평가 내용 1');
      expect(deletedData!.deletedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제 시 물리적으로 데이터가 유지되어야 함 (Soft Delete)',
        result: {
          selfEvaluationId: selfEvaluationId1,
          dataPreserved: deletedData !== null,
          originalContent: deletedData!.selfEvaluationContent,
        },
      });
    });

    it('삭제된 자기평가는 일반 조회에서 나오지 않아야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const beforeDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
      });
      expect(beforeDelete).toBeDefined();

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const afterDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
      });

      expect(afterDelete).toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제된 자기평가는 일반 조회에서 나오지 않아야 함',
        result: {
          selfEvaluationId: selfEvaluationId1,
          visibleAfterDelete: afterDelete !== null,
          expectedVisible: false,
        },
      });
    });

    it('삭제 시 updatedBy가 삭제자 ID로 설정되어야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const deletedData = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
        withDeleted: true,
      });

      expect(deletedData).toBeDefined();
      expect(deletedData!.updatedBy).toBe(deletedBy);

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제 시 updatedBy가 삭제자 ID로 설정되어야 함',
        result: {
          selfEvaluationId: selfEvaluationId1,
          updatedBy: deletedData!.updatedBy,
          expectedUpdatedBy: deletedBy,
        },
      });
    });
  });

  describe('WbsSelfEvaluationService.삭제한다() - 여러 개 삭제', () => {
    it('여러 자기평가를 순차적으로 삭제할 수 있어야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId2, deletedBy);

      // Then
      const deleted1 = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
      });
      const deleted2 = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId2 },
      });

      expect(deleted1).toBeNull();
      expect(deleted2).toBeNull();

      // withDeleted로는 조회 가능
      const withDeleted1 = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
        withDeleted: true,
      });
      const withDeleted2 = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId2 },
        withDeleted: true,
      });

      expect(withDeleted1).toBeDefined();
      expect(withDeleted2).toBeDefined();
      expect(withDeleted1!.deletedAt).not.toBeNull();
      expect(withDeleted2!.deletedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '여러 자기평가를 순차적으로 삭제할 수 있어야 함',
        result: {
          deletedIds: [selfEvaluationId1, selfEvaluationId2],
          visibleInNormalQuery: deleted1 !== null || deleted2 !== null,
          visibleWithDeleted: withDeleted1 !== null && withDeleted2 !== null,
        },
      });
    });

    it('필터_조회한다 메서드는 삭제된 자기평가를 반환하지 않아야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const beforeDelete = await wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId: evaluationPeriodId,
        wbsItemId,
      });
      expect(beforeDelete.length).toBe(3);

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const afterDelete = await wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId: evaluationPeriodId,
        wbsItemId,
      });
      expect(afterDelete.length).toBe(2);
      expect(
        afterDelete.find((e) => e.id === selfEvaluationId1),
      ).toBeUndefined();

      // 테스트 결과 저장
      testResults.push({
        testName: '필터_조회한다 메서드는 삭제된 자기평가를 반환하지 않아야 함',
        result: {
          countBeforeDelete: beforeDelete.length,
          countAfterDelete: afterDelete.length,
          deletedIdIncluded: afterDelete.some(
            (e) => e.id === selfEvaluationId1,
          ),
        },
      });
    });
  });

  describe('WbsSelfEvaluationService.삭제한다() - 에러 케이스', () => {
    it('존재하지 않는 자기평가 ID로 삭제 시도 시 예외가 발생해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      const nonExistentId = '00000000-0000-0000-0000-000000000999';

      // When & Then
      await expect(
        wbsSelfEvaluationService.삭제한다(nonExistentId, deletedBy),
      ).rejects.toThrow();

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 자기평가 ID로 삭제 시도 시 예외가 발생해야 함',
        result: {
          nonExistentId,
          errorThrown: true,
        },
      });
    });

    it('이미 삭제된 자기평가를 다시 삭제 시도 시 예외가 발생해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // When & Then
      await expect(
        wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy),
      ).rejects.toThrow();

      // 테스트 결과 저장
      testResults.push({
        testName: '이미 삭제된 자기평가를 다시 삭제 시도 시 예외가 발생해야 함',
        result: {
          selfEvaluationId: selfEvaluationId1,
          errorThrown: true,
        },
      });
    });
  });

  describe('WbsSelfEvaluationService.삭제한다() - 카운트 및 데이터 무결성', () => {
    it('삭제 후 활성 자기평가 카운트가 감소해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const beforeCount = await wbsSelfEvaluationRepository.count({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
        },
      });
      expect(beforeCount).toBe(3);

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const afterCount = await wbsSelfEvaluationRepository.count({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
        },
      });
      expect(afterCount).toBe(2);

      const withDeletedCount = await wbsSelfEvaluationRepository.count({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
        },
        withDeleted: true,
      });
      expect(withDeletedCount).toBe(3);

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제 후 활성 자기평가 카운트가 감소해야 함',
        result: {
          countBeforeDelete: beforeCount,
          countAfterDelete: afterCount,
          countWithDeleted: withDeletedCount,
        },
      });
    });

    it('삭제 후에도 원본 데이터의 모든 필드가 유지되어야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const beforeDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
      });
      expect(beforeDelete).toBeDefined();

      const originalContent = beforeDelete!.selfEvaluationContent;
      const originalScore = beforeDelete!.selfEvaluationScore;
      const originalResult = beforeDelete!.performanceResult;

      // When
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);

      // Then
      const afterDelete = await wbsSelfEvaluationRepository.findOne({
        where: { id: selfEvaluationId1 },
        withDeleted: true,
      });

      expect(afterDelete).toBeDefined();
      expect(afterDelete!.selfEvaluationContent).toBe(originalContent);
      expect(afterDelete!.selfEvaluationScore).toBe(originalScore);
      expect(afterDelete!.performanceResult).toBe(originalResult);
      expect(afterDelete!.employeeId).toBe(employeeId);
      expect(afterDelete!.periodId).toBe(evaluationPeriodId);
      expect(afterDelete!.wbsItemId).toBe(wbsItemId);

      // 테스트 결과 저장
      testResults.push({
        testName: '삭제 후에도 원본 데이터의 모든 필드가 유지되어야 함',
        result: {
          selfEvaluationId: selfEvaluationId1,
          contentPreserved:
            afterDelete!.selfEvaluationContent === originalContent,
          scorePreserved: afterDelete!.selfEvaluationScore === originalScore,
          resultPreserved: afterDelete!.performanceResult === originalResult,
        },
      });
    });

    it('모든 자기평가를 삭제해도 withDeleted로 조회 가능해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // When - 모든 자기평가 삭제
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId1, deletedBy);
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId2, deletedBy);
      await wbsSelfEvaluationService.삭제한다(selfEvaluationId3, deletedBy);

      // Then - 일반 조회는 빈 배열
      const normalQuery = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
          deletedAt: IsNull(),
        },
      });
      expect(normalQuery.length).toBe(0);

      // withDeleted로는 모두 조회 가능
      const withDeletedQuery = await wbsSelfEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
        },
        withDeleted: true,
      });
      expect(withDeletedQuery.length).toBe(3);
      expect(withDeletedQuery.every((e) => e.deletedAt !== null)).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '모든 자기평가를 삭제해도 withDeleted로 조회 가능해야 함',
        result: {
          normalQueryCount: normalQuery.length,
          withDeletedQueryCount: withDeletedQuery.length,
          allHaveDeletedAt: withDeletedQuery.every((e) => e.deletedAt !== null),
        },
      });
    });
  });
});
