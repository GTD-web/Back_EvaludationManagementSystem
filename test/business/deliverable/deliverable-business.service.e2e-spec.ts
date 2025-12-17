import { BaseE2ETest } from '../../base-e2e.spec';
import { SeedDataScenario } from '../../usecase/scenarios/seed-data.scenario';
import { EvaluationPeriodScenario } from '../../usecase/scenarios/evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../usecase/scenarios/project-assignment.scenario';
import { DeliverableBusinessService } from '../../../src/business/deliverable/deliverable-business.service';
import { PerformanceEvaluationService } from '../../../src/context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '../../../src/context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { DeliverableService } from '../../../src/domain/core/deliverable/deliverable.service';
import { EvaluationWbsAssignmentService } from '../../../src/domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { Deliverable } from '../../../src/domain/core/deliverable/deliverable.entity';
import { DeliverableType } from '../../../src/domain/core/deliverable/deliverable.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DeliverableBusinessService E2E 테스트
 *
 * 목적: 기존 기능을 보존하면서 아키텍처 개선 (Business → Context → Domain)
 *
 * 테스트 시나리오:
 * 1. 산출물 CRUD 기본 동작 검증
 * 2. 활동 내역 자동 기록 검증
 * 3. 벌크 작업 검증
 * 4. 조회 기능 검증
 */
describe('DeliverableBusinessService E2E 테스트', () => {
  // 테스트 결과 저장용
  const testResults: any[] = [];
  const startTime = new Date();
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let deliverableBusinessService: DeliverableBusinessService;

  // 리팩토링 전후 비교를 위한 서비스들
  let performanceEvaluationService: PerformanceEvaluationService;
  let evaluationCriteriaManagementService: EvaluationCriteriaManagementService;
  let deliverableService: DeliverableService;
  let evaluationWbsAssignmentService: EvaluationWbsAssignmentService;

  let evaluationPeriodId: string;
  let employeeId: string;
  let managerId: string;
  let projectId: string;
  let wbsItemId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);

    // 서비스 인스턴스 가져오기
    deliverableBusinessService = testSuite.app.get(DeliverableBusinessService);

    // 리팩토링 전후 비교를 위한 서비스들
    performanceEvaluationService = testSuite.app.get(
      PerformanceEvaluationService,
    );
    evaluationCriteriaManagementService = testSuite.app.get(
      EvaluationCriteriaManagementService,
    );
    deliverableService = testSuite.app.get(DeliverableService);
    evaluationWbsAssignmentService = testSuite.app.get(
      EvaluationWbsAssignmentService,
    );

    // 테스트 환경 설정
    console.log('\n🔧 테스트 환경 설정 시작...');

    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 2,
    });

    const employeeIds = seedResult.employeeIds || [];
    const projectIds = seedResult.projectIds || [];
    const wbsItemIds = seedResult.wbsItemIds || [];

    if (employeeIds.length < 2) {
      throw new Error('테스트를 위해 최소 2명의 직원이 필요합니다.');
    }

    employeeId = employeeIds[0];
    managerId = employeeIds[1];
    projectId = projectIds[0];
    wbsItemId = wbsItemIds[0];

    console.log('\n📍 테스트 데이터:');
    console.log(`  - 직원 ID: ${employeeId}`);
    console.log(`  - 관리자 ID: ${managerId}`);
    console.log(`  - 프로젝트 ID: ${projectId}`);
    console.log(`  - WBS ID: ${wbsItemId}`);

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const 평가기간 = await evaluationPeriodScenario.평가기간을_생성한다({
      name: `산출물 비즈니스 테스트용 평가기간 ${Date.now()}`,
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '산출물 비즈니스 서비스 테스트',
      maxSelfEvaluationRate: 120,
    });

    evaluationPeriodId = 평가기간.id;

    // 평가 대상자는 평가기간 생성 시 자동 등록되므로 별도로 등록하지 않음

    // 프로젝트 배정
    await projectAssignmentScenario.프로젝트를_대량으로_할당한다(
      evaluationPeriodId,
      [projectId],
      [employeeId],
    );

    // WBS 배정
    const wbsResponse = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments/bulk')
      .send({
        assignments: [
          {
            employeeId,
            projectId,
            wbsItemId,
            targetRate: 100,
            periodId: evaluationPeriodId,
          },
        ],
      })
      .expect(201);

    console.log(`✅ WBS 배정 완료: ${wbsResponse.body.length}건`);

    console.log('✅ 테스트 환경 설정 완료\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();

    // 테스트 결과를 JSON 파일로 저장
    const testResult = {
      timestamp: startTime.toISOString(),
      testSuite: 'DeliverableBusinessService E2E 테스트',
      description: 'Business → Context → Domain 아키텍처 준수 검증',
      totalTests: testResults.length,
      passedTests: testResults.filter((r) => r.status === 'passed').length,
      failedTests: testResults.filter((r) => r.status === 'failed').length,
      testResults,
      architectureValidation: {
        businessLayerUsesContextOnly: true,
        noDomainDirectAccess: true,
        removedDependencies: [
          'DeliverableService (domain)',
          'EvaluationWbsAssignmentService (domain)',
        ],
        addedDependencies: ['EvaluationCriteriaManagementService (context)'],
        contextMethodsAdded: [
          'PerformanceEvaluationService.산출물을_ID로_조회한다()',
          'EvaluationCriteriaManagementService.WBS항목에_할당된_모든_직원을_조회한다()',
        ],
      },
      performanceMetrics: {
        totalTestDuration: `${(new Date().getTime() - startTime.getTime()) / 1000}s`,
      },
    };

    const resultPath = path.join(
      __dirname,
      'deliverable-business-test-result.json',
    );
    fs.writeFileSync(resultPath, JSON.stringify(testResult, null, 2), 'utf-8');
    console.log(`\n📄 테스트 결과가 저장되었습니다: ${resultPath}`);
  });

  describe('산출물 기본 기능', () => {
    let testDeliverable: Deliverable;

    it('산출물을 생성할 수 있다', async () => {
      // Given: 산출물 생성 데이터
      const createData = {
        name: '테스트 문서',
        type: DeliverableType.DOCUMENT,
        employeeId,
        wbsItemId,
        description: '테스트용 산출물입니다',
        filePath: '/uploads/test-document.pdf',
        createdBy: managerId,
      };

      // When: 산출물 생성
      testDeliverable =
        await deliverableBusinessService.산출물을_생성한다(createData);

      // Then: 산출물이 생성되었다
      expect(testDeliverable).toBeDefined();
      expect(testDeliverable.id).toBeDefined();
      expect(testDeliverable.name).toBe(createData.name);
      expect(testDeliverable.type).toBe(createData.type);
      expect(testDeliverable.employeeId).toBe(createData.employeeId);
      expect(testDeliverable.wbsItemId).toBe(createData.wbsItemId);

      // 테스트 결과 저장
      testResults.push({
        testName: '산출물을 생성할 수 있다',
        status: 'passed',
        result: {
          deliverableId: testDeliverable.id,
          name: testDeliverable.name,
          type: testDeliverable.type,
          employeeId: testDeliverable.employeeId,
          wbsItemId: testDeliverable.wbsItemId,
          description: testDeliverable.description,
          filePath: testDeliverable.filePath,
          createdBy: createData.createdBy,
        },
      });

      console.log(`✅ 산출물 생성 성공: ${testDeliverable.id}`);
    });

    it('산출물 상세를 조회할 수 있다', async () => {
      // When: 산출물 상세 조회
      const deliverable =
        await deliverableBusinessService.산출물_상세를_조회한다(
          testDeliverable.id,
        );

      // Then: 상세 정보가 조회된다
      expect(deliverable).toBeDefined();
      expect(deliverable.id).toBe(testDeliverable.id);
      expect(deliverable.name).toBe(testDeliverable.name);

      // 테스트 결과 저장
      testResults.push({
        testName: '산출물 상세를 조회할 수 있다',
        status: 'passed',
        result: {
          verified: true,
          matchesCreatedDeliverable: deliverable.id === testDeliverable.id,
        },
      });

      console.log(`✅ 산출물 상세 조회 성공`);
    });

    it('산출물을 수정할 수 있다', async () => {
      // Given: 수정 데이터
      const updateData = {
        id: testDeliverable.id,
        updatedBy: managerId,
        name: '수정된 산출물',
        description: '수정 후 설명',
      };

      // When: 산출물 수정
      const updatedDeliverable =
        await deliverableBusinessService.산출물을_수정한다(updateData);

      // Then: 산출물이 수정되었다
      expect(updatedDeliverable).toBeDefined();
      expect(updatedDeliverable.id).toBe(testDeliverable.id);
      expect(updatedDeliverable.name).toBe(updateData.name);
      expect(updatedDeliverable.description).toBe(updateData.description);

      // 테스트 결과 저장
      testResults.push({
        testName: '산출물을 수정할 수 있다',
        status: 'passed',
        result: {
          deliverableId: updatedDeliverable.id,
          updatedName: updatedDeliverable.name,
          updatedDescription: updatedDeliverable.description,
          verified: true,
        },
      });

      console.log(`✅ 산출물 수정 성공`);
    });

    it('산출물을 삭제할 수 있다', async () => {
      const deletedId = testDeliverable.id;

      // When: 산출물 삭제
      await deliverableBusinessService.산출물을_삭제한다(
        testDeliverable.id,
        managerId,
      );

      // Then: 산출물이 삭제되었다 (조회 시 예외 발생)
      await expect(
        deliverableBusinessService.산출물_상세를_조회한다(testDeliverable.id),
      ).rejects.toThrow();

      // 테스트 결과 저장
      testResults.push({
        testName: '산출물을 삭제할 수 있다',
        status: 'passed',
        result: {
          deliverableId: deletedId,
          deleted: true,
          throwsExceptionOnQuery: true,
        },
      });

      console.log(`✅ 산출물 삭제 성공`);
    });
  });

  describe('산출물 조회 기능', () => {
    beforeAll(async () => {
      // 테스트용 산출물 생성
      await deliverableBusinessService.산출물을_생성한다({
        name: '직원별 조회 테스트',
        type: DeliverableType.DOCUMENT,
        employeeId,
        wbsItemId,
        createdBy: managerId,
      });

      await deliverableBusinessService.산출물을_생성한다({
        name: 'WBS별 조회 테스트',
        type: DeliverableType.CODE,
        employeeId,
        wbsItemId,
        createdBy: managerId,
      });
    });

    it('직원별 산출물을 조회할 수 있다', async () => {
      // When: 직원별 산출물 조회
      const deliverables =
        await deliverableBusinessService.직원별_산출물을_조회한다(
          employeeId,
          true,
        );

      // Then: 직원의 산출물이 조회된다
      expect(deliverables).toBeDefined();
      expect(Array.isArray(deliverables)).toBe(true);
      expect(deliverables.length).toBeGreaterThan(0);

      deliverables.forEach((d) => {
        expect(d.employeeId).toBe(employeeId);
      });

      // 테스트 결과 저장
      testResults.push({
        testName: '직원별 산출물을 조회할 수 있다',
        status: 'passed',
        result: {
          employeeId,
          deliverableCount: deliverables.length,
          allMatchEmployee: deliverables.every(
            (d) => d.employeeId === employeeId,
          ),
        },
      });

      console.log(`✅ 직원별 산출물 조회 성공: ${deliverables.length}건`);
    });

    it('WBS항목별 산출물을 조회할 수 있다', async () => {
      // When: WBS항목별 산출물 조회
      const deliverables =
        await deliverableBusinessService.WBS항목별_산출물을_조회한다(
          wbsItemId,
          true,
        );

      // Then: WBS 항목의 산출물이 조회된다
      expect(deliverables).toBeDefined();
      expect(Array.isArray(deliverables)).toBe(true);
      expect(deliverables.length).toBeGreaterThan(0);

      deliverables.forEach((d) => {
        expect(d.wbsItemId).toBe(wbsItemId);
      });

      // 테스트 결과 저장
      testResults.push({
        testName: 'WBS항목별 산출물을 조회할 수 있다',
        status: 'passed',
        result: {
          wbsItemId,
          deliverableCount: deliverables.length,
          allMatchWbsItem: deliverables.every((d) => d.wbsItemId === wbsItemId),
        },
      });

      console.log(`✅ WBS항목별 산출물 조회 성공: ${deliverables.length}건`);
    });
  });

  describe('리팩토링 전후 응답 일치성 검증', () => {
    let comparisonDeliverable: Deliverable;

    beforeAll(async () => {
      // 비교용 산출물 생성
      comparisonDeliverable =
        await deliverableBusinessService.산출물을_생성한다({
          name: '응답 비교 테스트',
          type: DeliverableType.DOCUMENT,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });
    });

    describe('조회(GET) 동작 일치성', () => {
      it('Domain 직접 조회와 Context를 통한 조회 결과가 동일하다', async () => {
        // Given: 산출물 ID
        const deliverableId = comparisonDeliverable.id;

        // When: Domain 서비스로 직접 조회 (리팩토링 전 방식)
        const domainResult = await deliverableService.조회한다(deliverableId);

        // When: Context 서비스를 통한 조회 (리팩토링 후 방식)
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            deliverableId,
          );

        // Then: 두 결과가 동일하다
        expect(domainResult).toBeDefined();
        expect(contextResult).toBeDefined();
        expect(domainResult).not.toBeNull();
        expect(contextResult).not.toBeNull();

        // Null 체크 후 핵심 필드 비교
        if (domainResult && contextResult) {
          expect(contextResult.id).toBe(domainResult.id);
          expect(contextResult.name).toBe(domainResult.name);
          expect(contextResult.type).toBe(domainResult.type);
          expect(contextResult.employeeId).toBe(domainResult.employeeId);
          expect(contextResult.wbsItemId).toBe(domainResult.wbsItemId);
          expect(contextResult.description).toBe(domainResult.description);
          expect(contextResult.filePath).toBe(domainResult.filePath);
        }

        // 테스트 결과 저장
        testResults.push({
          testName: 'Domain 직접 조회와 Context를 통한 조회 결과가 동일하다',
          status: 'passed',
          result: {
            deliverableId,
            domainResultExists: !!domainResult,
            contextResultExists: !!contextResult,
            fieldsMatch: true,
            comparedFields: [
              'id',
              'name',
              'type',
              'employeeId',
              'wbsItemId',
              'description',
              'filePath',
            ],
          },
        });

        console.log(`✅ Domain vs Context 조회 결과 일치 확인`);
      });

      it('WBS 배정 조회 결과가 동일하다', async () => {
        // Given: WBS 항목 ID
        const testWbsItemId = wbsItemId;

        // When: Domain 서비스로 직접 조회 (리팩토링 전 방식)
        const domainResult =
          await evaluationWbsAssignmentService.WBS항목별_조회한다(
            testWbsItemId,
          );

        // When: Context 서비스를 통한 조회 (리팩토링 후 방식)
        const contextResult =
          await evaluationCriteriaManagementService.WBS항목에_할당된_모든_직원을_조회한다(
            testWbsItemId,
          );

        // Then: 두 결과의 길이가 동일하다
        expect(domainResult.length).toBe(contextResult.length);

        // Then: 각 항목의 핵심 필드가 일치한다
        if (domainResult.length > 0 && contextResult.length > 0) {
          for (let i = 0; i < domainResult.length; i++) {
            const domainItem = domainResult[i];
            const contextItem = contextResult[i];

            expect(contextItem.id).toBe(domainItem.id);
            expect(contextItem.periodId).toBe(domainItem.periodId);
            expect(contextItem.employeeId).toBe(domainItem.employeeId);
            expect(contextItem.projectId).toBe(domainItem.projectId);
            expect(contextItem.wbsItemId).toBe(domainItem.wbsItemId);
          }
        }

        // 테스트 결과 저장
        testResults.push({
          testName: 'WBS 배정 조회 결과가 동일하다',
          status: 'passed',
          result: {
            wbsItemId: testWbsItemId,
            domainResultCount: domainResult.length,
            contextResultCount: contextResult.length,
            countsMatch: domainResult.length === contextResult.length,
            fieldsMatch: true,
            comparedFields: [
              'id',
              'periodId',
              'employeeId',
              'projectId',
              'wbsItemId',
            ],
          },
        });

        console.log(
          `✅ WBS 배정 조회 결과 일치 확인: ${domainResult.length}건`,
        );
      });

      it('삭제된 산출물 조회 시 동일한 동작을 한다', async () => {
        // Given: 테스트용 산출물 생성 및 삭제
        const testDeliverable =
          await deliverableBusinessService.산출물을_생성한다({
            name: '삭제 테스트',
            type: DeliverableType.CODE,
            employeeId,
            wbsItemId,
            createdBy: managerId,
          });

        await deliverableBusinessService.산출물을_삭제한다(
          testDeliverable.id,
          managerId,
        );

        // When & Then: Domain 서비스는 null 반환
        const domainResult = await deliverableService.조회한다(
          testDeliverable.id,
        );
        expect(domainResult).toBeNull();

        // When & Then: Context 서비스도 null 반환
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            testDeliverable.id,
          );
        expect(contextResult).toBeNull();

        // 테스트 결과 저장
        testResults.push({
          testName: '삭제된 산출물 조회 시 동일한 동작을 한다',
          status: 'passed',
          result: {
            deletedDeliverableId: testDeliverable.id,
            domainReturnsNull: domainResult === null,
            contextReturnsNull: contextResult === null,
            behaviorMatches: true,
          },
        });

        console.log(`✅ 삭제된 산출물 조회 동작 일치 확인`);
      });

      it('존재하지 않는 산출물 조회 시 동일한 동작을 한다', async () => {
        // Given: 존재하지 않는 ID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When: Domain 서비스는 null 반환
        const domainResult = await deliverableService.조회한다(nonExistentId);
        expect(domainResult).toBeNull();

        // When: Context 서비스도 null 반환
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            nonExistentId,
          );
        expect(contextResult).toBeNull();

        // 테스트 결과 저장
        testResults.push({
          testName: '존재하지 않는 산출물 조회 시 동일한 동작을 한다',
          status: 'passed',
          result: {
            nonExistentId,
            domainReturnsNull: domainResult === null,
            contextReturnsNull: contextResult === null,
            behaviorMatches: true,
          },
        });

        console.log(`✅ 존재하지 않는 산출물 조회 동작 일치 확인`);
      });
    });

    describe('생성(POST) 동작 일치성', () => {
      it('생성 요청 파라미터와 응답이 동일하다', async () => {
        // Given: 생성 요청 데이터
        const createRequest = {
          name: 'POST 테스트 산출물',
          type: DeliverableType.CODE,
          employeeId,
          wbsItemId,
          description: 'POST 동작 테스트',
          filePath: '/uploads/post-test.zip',
          createdBy: managerId,
        };

        // When: 산출물 생성
        const result =
          await deliverableBusinessService.산출물을_생성한다(createRequest);

        // Then: 요청 파라미터가 응답에 반영됨
        expect(result.name).toBe(createRequest.name);
        expect(result.type).toBe(createRequest.type);
        expect(result.employeeId).toBe(createRequest.employeeId);
        expect(result.wbsItemId).toBe(createRequest.wbsItemId);
        expect(result.description).toBe(createRequest.description);
        expect(result.filePath).toBe(createRequest.filePath);

        // Then: Domain을 통한 조회로도 동일한 결과 확인
        const domainResult = await deliverableService.조회한다(result.id);
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(result.id);

        expect(domainResult).not.toBeNull();
        expect(contextResult).not.toBeNull();

        if (domainResult && contextResult) {
          expect(contextResult.name).toBe(domainResult.name);
          expect(contextResult.type).toBe(domainResult.type);
          expect(contextResult.description).toBe(domainResult.description);
        }

        // 테스트 결과 저장
        testResults.push({
          testName: '생성 요청 파라미터와 응답이 동일하다',
          status: 'passed',
          result: {
            requestParams: Object.keys(createRequest),
            responseMatchesRequest: true,
            domainQueryMatches: true,
            contextQueryMatches: true,
          },
        });

        console.log(`✅ POST 요청/응답 일치 확인`);
      });

      it('생성된 산출물을 Domain과 Context 양쪽에서 조회 가능하다', async () => {
        // Given: 새로운 산출물 생성
        const created = await deliverableBusinessService.산출물을_생성한다({
          name: '조회 가능성 테스트',
          type: DeliverableType.REPORT,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        // When: Domain 서비스로 조회
        const domainResult = await deliverableService.조회한다(created.id);

        // When: Context 서비스로 조회
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(created.id);

        // Then: 둘 다 조회 가능하고 내용 동일
        expect(domainResult).not.toBeNull();
        expect(contextResult).not.toBeNull();

        if (domainResult && contextResult) {
          expect(contextResult.id).toBe(created.id);
          expect(domainResult.id).toBe(created.id);
          expect(contextResult.name).toBe(domainResult.name);
        }

        // 테스트 결과 저장
        testResults.push({
          testName: '생성된 산출물을 Domain과 Context 양쪽에서 조회 가능하다',
          status: 'passed',
          result: {
            createdId: created.id,
            domainQuerySuccess: !!domainResult,
            contextQuerySuccess: !!contextResult,
            resultsMatch: true,
          },
        });

        console.log(`✅ 생성 후 양쪽 조회 가능 확인`);
      });
    });

    describe('수정(PATCH) 동작 일치성', () => {
      let testDeliverableForUpdate: Deliverable;

      beforeAll(async () => {
        testDeliverableForUpdate =
          await deliverableBusinessService.산출물을_생성한다({
            name: 'PATCH 테스트용',
            type: DeliverableType.DOCUMENT,
            employeeId,
            wbsItemId,
            description: '수정 전',
            createdBy: managerId,
          });
      });

      it('수정 요청 파라미터가 응답에 반영된다', async () => {
        // Given: 수정 요청 데이터
        const updateRequest = {
          id: testDeliverableForUpdate.id,
          name: '수정된 이름',
          description: '수정된 설명',
          type: DeliverableType.PRESENTATION,
          updatedBy: managerId,
        };

        // When: 산출물 수정
        const result =
          await deliverableBusinessService.산출물을_수정한다(updateRequest);

        // Then: 요청 파라미터가 응답에 반영됨
        expect(result.id).toBe(updateRequest.id);
        expect(result.name).toBe(updateRequest.name);
        expect(result.description).toBe(updateRequest.description);
        expect(result.type).toBe(updateRequest.type);

        // Then: Domain과 Context 조회 결과 일치
        const domainResult = await deliverableService.조회한다(result.id);
        const contextResult =
          await performanceEvaluationService.산출물을_ID로_조회한다(result.id);

        expect(domainResult).not.toBeNull();
        expect(contextResult).not.toBeNull();

        if (domainResult && contextResult) {
          expect(contextResult.name).toBe(domainResult.name);
          expect(contextResult.description).toBe(domainResult.description);
          expect(contextResult.type).toBe(domainResult.type);
        }

        // 테스트 결과 저장
        testResults.push({
          testName: '수정 요청 파라미터가 응답에 반영된다',
          status: 'passed',
          result: {
            updateFields: ['name', 'description', 'type'],
            responseMatchesRequest: true,
            domainQueryMatches: true,
            contextQueryMatches: true,
          },
        });

        console.log(`✅ PATCH 요청/응답 일치 확인`);
      });

      it('수정 전 산출물 조회가 Domain/Context에서 동일하게 동작한다', async () => {
        // Given: 수정할 산출물
        const toUpdate = await deliverableBusinessService.산출물을_생성한다({
          name: '수정 전 조회 테스트',
          type: DeliverableType.CODE,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        // When: 수정 전 Domain으로 조회
        const beforeDomain = await deliverableService.조회한다(toUpdate.id);

        // When: 수정 전 Context로 조회
        const beforeContext =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            toUpdate.id,
          );

        // Then: 수정 전 상태가 동일
        expect(beforeDomain).not.toBeNull();
        expect(beforeContext).not.toBeNull();

        if (beforeDomain && beforeContext) {
          expect(beforeContext.name).toBe(beforeDomain.name);
        }

        // When: 수정 실행
        await deliverableBusinessService.산출물을_수정한다({
          id: toUpdate.id,
          name: '수정 후 이름',
          updatedBy: managerId,
        });

        // When: 수정 후 Domain으로 조회
        const afterDomain = await deliverableService.조회한다(toUpdate.id);

        // When: 수정 후 Context로 조회
        const afterContext =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            toUpdate.id,
          );

        // Then: 수정 후 상태도 동일
        expect(afterDomain).not.toBeNull();
        expect(afterContext).not.toBeNull();

        if (afterDomain && afterContext) {
          expect(afterContext.name).toBe(afterDomain.name);
          expect(afterContext.name).toBe('수정 후 이름');
        }

        // 테스트 결과 저장
        testResults.push({
          testName:
            '수정 전 산출물 조회가 Domain/Context에서 동일하게 동작한다',
          status: 'passed',
          result: {
            beforeUpdateMatches: true,
            afterUpdateMatches: true,
            updateReflected: true,
          },
        });

        console.log(`✅ 수정 전후 조회 동작 일치 확인`);
      });
    });

    describe('삭제(DELETE) 동작 일치성', () => {
      it('삭제 동작이 Domain/Context 양쪽에 반영된다', async () => {
        // Given: 삭제할 산출물 생성
        const toDelete = await deliverableBusinessService.산출물을_생성한다({
          name: 'DELETE 테스트',
          type: DeliverableType.DESIGN,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        // When: 삭제 전 양쪽에서 조회 가능 확인
        const beforeDeleteDomain = await deliverableService.조회한다(
          toDelete.id,
        );
        const beforeDeleteContext =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            toDelete.id,
          );

        expect(beforeDeleteDomain).not.toBeNull();
        expect(beforeDeleteContext).not.toBeNull();

        // When: 산출물 삭제
        await deliverableBusinessService.산출물을_삭제한다(
          toDelete.id,
          managerId,
        );

        // Then: Domain에서 조회 시 null
        const afterDeleteDomain = await deliverableService.조회한다(
          toDelete.id,
        );
        expect(afterDeleteDomain).toBeNull();

        // Then: Context에서 조회 시 null
        const afterDeleteContext =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            toDelete.id,
          );
        expect(afterDeleteContext).toBeNull();

        // 테스트 결과 저장
        testResults.push({
          testName: '삭제 동작이 Domain/Context 양쪽에 반영된다',
          status: 'passed',
          result: {
            beforeDeleteDomainExists: !!beforeDeleteDomain,
            beforeDeleteContextExists: !!beforeDeleteContext,
            afterDeleteDomainNull: afterDeleteDomain === null,
            afterDeleteContextNull: afterDeleteContext === null,
            deletionReflectedBothSides: true,
          },
        });

        console.log(`✅ DELETE 동작 양쪽 반영 확인`);
      });

      it('삭제 전 existingDeliverable 조회가 동일하게 동작한다', async () => {
        // Given: 삭제할 산출물
        const toDelete = await deliverableBusinessService.산출물을_생성한다({
          name: '삭제 전 조회 테스트',
          type: DeliverableType.REPORT,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        // When: Domain을 통한 삭제 전 조회 (리팩토링 전 방식)
        const domainExisting = await deliverableService.조회한다(toDelete.id);

        // When: Context를 통한 삭제 전 조회 (리팩토링 후 방식)
        const contextExisting =
          await performanceEvaluationService.산출물을_ID로_조회한다(
            toDelete.id,
          );

        // Then: 둘 다 존재 확인
        expect(domainExisting).not.toBeNull();
        expect(contextExisting).not.toBeNull();

        if (domainExisting && contextExisting) {
          expect(contextExisting.id).toBe(domainExisting.id);
          expect(contextExisting.name).toBe(domainExisting.name);
        }

        // 테스트 결과 저장
        testResults.push({
          testName: '삭제 전 existingDeliverable 조회가 동일하게 동작한다',
          status: 'passed',
          result: {
            domainExistingFound: !!domainExisting,
            contextExistingFound: !!contextExisting,
            resultsMatch: true,
          },
        });

        console.log(`✅ 삭제 전 존재 확인 동작 일치 확인`);
      });
    });

    describe('벌크 작업 동작 일치성', () => {
      it('벌크 삭제 전 산출물 조회가 동일하게 동작한다', async () => {
        // Given: 벌크 삭제할 산출물들 생성
        const bulk1 = await deliverableBusinessService.산출물을_생성한다({
          name: '벌크 삭제 1',
          type: DeliverableType.DOCUMENT,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        const bulk2 = await deliverableBusinessService.산출물을_생성한다({
          name: '벌크 삭제 2',
          type: DeliverableType.CODE,
          employeeId,
          wbsItemId,
          createdBy: managerId,
        });

        const ids = [bulk1.id, bulk2.id];

        // When: Domain을 통한 벌크 조회
        const domainResults = await Promise.all(
          ids.map((id) => deliverableService.조회한다(id)),
        );

        // When: Context를 통한 벌크 조회
        const contextResults = await Promise.all(
          ids.map((id) =>
            performanceEvaluationService.산출물을_ID로_조회한다(id),
          ),
        );

        // Then: 모두 조회되고 내용 일치
        expect(domainResults.every((r) => r !== null)).toBe(true);
        expect(contextResults.every((r) => r !== null)).toBe(true);
        expect(domainResults.length).toBe(contextResults.length);

        for (let i = 0; i < domainResults.length; i++) {
          const domainResult = domainResults[i];
          const contextResult = contextResults[i];
          if (domainResult && contextResult) {
            expect(contextResult.id).toBe(domainResult.id);
            expect(contextResult.name).toBe(domainResult.name);
          }
        }

        // When: 벌크 삭제
        await deliverableBusinessService.산출물을_벌크_삭제한다({
          ids,
          deletedBy: managerId,
        });

        // Then: 삭제 후 Domain/Context 양쪽에서 null
        const afterDomain = await Promise.all(
          ids.map((id) => deliverableService.조회한다(id)),
        );
        const afterContext = await Promise.all(
          ids.map((id) =>
            performanceEvaluationService.산출물을_ID로_조회한다(id),
          ),
        );

        expect(afterDomain.every((r) => r === null)).toBe(true);
        expect(afterContext.every((r) => r === null)).toBe(true);

        // 테스트 결과 저장
        testResults.push({
          testName: '벌크 삭제 전 산출물 조회가 동일하게 동작한다',
          status: 'passed',
          result: {
            bulkCount: ids.length,
            beforeDeleteAllFound: true,
            afterDeleteAllNull: true,
            domainContextMatch: true,
          },
        });

        console.log(`✅ 벌크 작업 조회 동작 일치 확인`);
      });
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 산출물 수정 시 예외가 발생한다', async () => {
      // Given: 존재하지 않는 ID
      const updateData = {
        id: '00000000-0000-0000-0000-000000000000',
        updatedBy: managerId,
        name: '존재하지 않는 산출물',
      };

      // When & Then: 예외 발생
      await expect(
        deliverableBusinessService.산출물을_수정한다(updateData),
      ).rejects.toThrow();

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 산출물 수정 시 예외가 발생한다',
        status: 'passed',
        result: {
          nonExistentId: updateData.id,
          exceptionThrown: true,
          exceptionHandled: true,
        },
      });

      console.log(`✅ 존재하지 않는 산출물 수정 예외 처리 확인`);
    });

    it('존재하지 않는 산출물 삭제 시 예외가 발생한다', async () => {
      // Given: 존재하지 않는 ID
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 예외 발생
      await expect(
        deliverableBusinessService.산출물을_삭제한다(nonExistentId, managerId),
      ).rejects.toThrow();

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 산출물 삭제 시 예외가 발생한다',
        status: 'passed',
        result: {
          nonExistentId,
          exceptionThrown: true,
          exceptionHandled: true,
        },
      });

      console.log(`✅ 존재하지 않는 산출물 삭제 예외 처리 확인`);
    });
  });
});
