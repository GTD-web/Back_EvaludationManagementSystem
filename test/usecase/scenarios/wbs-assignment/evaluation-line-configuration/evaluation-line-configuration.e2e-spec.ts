import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment.scenario';
import { EvaluationLineConfigurationScenario } from './evaluation-line-configuration.scenario';
import { DownwardEvaluationApiClient } from '../../api-clients/downward-evaluation.api-client';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';

/**
 * 평가라인 변경 관리 시나리오 E2E 테스트
 *
 * 테스트 목적:
 * - 1차/2차 평가자 구성 및 업데이트 검증
 * - 배치 평가자 구성 검증
 * - 평가라인 조회 검증
 * - 대시보드 API를 통한 평가라인 상태 검증
 * - 실패 케이스 검증
 */
describe('평가라인 변경 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let evaluationLineConfigurationScenario: EvaluationLineConfigurationScenario;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    evaluationLineConfigurationScenario =
      new EvaluationLineConfigurationScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 4,
      departmentCount: 1,
      employeeCount: 10,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성 (고유한 날짜를 위해 timestamp 사용)
    const timestamp = Date.now();
    const today = new Date();
    // 고유한 날짜를 위해 timestamp를 사용하여 일수 추가
    const uniqueDays = Math.floor(timestamp / (1000 * 60 * 60 * 24));
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + uniqueDays);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(startDate.getMonth() + 1);

    const createData = {
      name: `평가라인 변경 관리 테스트용 평가기간_${timestamp}`,
      startDate: startDate.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가라인 변경 관리 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(HttpStatus.CREATED);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(HttpStatus.OK);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      if (evaluationPeriodId) {
        // 평가기간 완료 (실제 API는 /complete 사용)
        await evaluationPeriodScenario.평가기간을_완료한다(evaluationPeriodId);
        // 평가기간 삭제
        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  describe('1차 평가자 구성 관리', () => {
    it('단일 직원의 1차 평가자를 구성하고 검증해야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const evaluatorId = employeeIds[1];

      console.log('\n📍 1차 평가자 구성 및 검증 시작');

      // 선행 조건: 프로젝트 할당 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 1차 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: evaluatorId,
      });

      console.log('📍 1차 평가자 구성 완료');

      // 구성 결과 검증 - 직원 평가설정 통합 조회
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      const 일차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === null,
      );

      expect(일차평가라인매핑).toBeDefined();
      expect(일차평가라인매핑.evaluatorId).toBe(evaluatorId);
      expect(일차평가라인매핑.employeeId).toBe(testEmployeeId);
      expect(일차평가라인매핑.evaluationLineId).toBeDefined();
      expect(일차평가라인매핑.wbsItemId).toBeNull();

      console.log('✅ 1차 평가자 구성 검증 완료');

      // 대시보드 API 검증
      const 직원현황 =
        await evaluationLineConfigurationScenario.직원_평가기간_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            employeeId: testEmployeeId,
          },
        );

      expect(직원현황.criteriaSetup?.evaluationLine).toBeDefined();
      expect(직원현황.criteriaSetup?.evaluationLine.hasPrimaryEvaluator).toBe(
        true,
      );
      expect(['in_progress', 'complete']).toContain(
        직원현황.criteriaSetup?.evaluationLine.status,
      );

      console.log('✅ 대시보드 API 검증 완료');
    });

    it('기존 1차 평가자를 업데이트할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 기존평가자Id = employeeIds[1];
      const 새로운평가자Id = employeeIds[2];

      console.log('\n📍 1차 평가자 업데이트 테스트 시작');

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 기존 1차 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 기존평가자Id,
      });

      // 새로운 평가자로 업데이트
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 새로운평가자Id,
      });

      // 업데이트 결과 검증
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      const 일차평가라인매핑들 = 평가설정.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === null,
      );

      expect(일차평가라인매핑들.length).toBe(1); // 중복 방지 확인
      expect(일차평가라인매핑들[0].evaluatorId).toBe(새로운평가자Id);
      expect(일차평가라인매핑들[0].evaluatorId).not.toBe(기존평가자Id);

      console.log('✅ 1차 평가자 업데이트 검증 완료');
    });

    it('여러 직원의 1차 평가자를 배치로 구성할 수 있어야 한다', async () => {
      const testEmployeeIds = [employeeIds[0], employeeIds[1], employeeIds[2]];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const evaluatorIds = [employeeIds[3], employeeIds[4], employeeIds[5]];

      console.log('\n📍 배치 1차 평가자 구성 시작');

      // 선행 조건
      for (const employeeId of testEmployeeIds) {
        await projectAssignmentScenario.프로젝트를_할당한다({
          employeeId: employeeId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        await wbsAssignmentScenario.WBS를_할당한다({
          employeeId: employeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      // 배치 1차 평가자 구성
      const 배치구성결과 =
        await evaluationLineConfigurationScenario.여러_직원의_일차_평가자를_배치_구성한다(
          {
            periodId: evaluationPeriodId,
            assignments: testEmployeeIds.map((employeeId, index) => ({
              employeeId: employeeId,
              evaluatorId: evaluatorIds[index],
            })),
          },
        );

      // 배치 구성 결과 검증
      expect(배치구성결과.totalCount).toBe(testEmployeeIds.length);
      expect(배치구성결과.successCount).toBe(testEmployeeIds.length);
      expect(배치구성결과.failureCount).toBe(0);
      expect(배치구성결과.results.length).toBe(testEmployeeIds.length);

      for (let i = 0; i < testEmployeeIds.length; i++) {
        const result = 배치구성결과.results[i];
        expect(result.status).toBe('success');
        expect(result.employeeId).toBe(testEmployeeIds[i]);
        expect(result.mapping).toBeDefined();
        expect(result.mapping.evaluatorId).toBe(evaluatorIds[i]);
      }

      console.log('✅ 배치 1차 평가자 구성 검증 완료');

      // 배치 구성 후 대시보드 검증
      const 모든직원현황 =
        await evaluationLineConfigurationScenario.모든_직원_평가기간_현황을_조회한다(
          evaluationPeriodId,
        );

      expect(Array.isArray(모든직원현황)).toBe(true);

      for (const employeeId of testEmployeeIds) {
        const 직원현황 = 모든직원현황.find(
          (emp: any) => emp.employeeId === employeeId,
        );
        expect(직원현황).toBeDefined();
        expect(직원현황.criteriaSetup?.evaluationLine.hasPrimaryEvaluator).toBe(
          true,
        );
      }

      console.log('✅ 배치 구성 후 대시보드 검증 완료');
    });
  });

  describe('2차 평가자 구성 관리', () => {
    it('단일 직원의 단일 WBS 항목에 대한 2차 평가자를 구성하고 검증해야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const evaluatorId = employeeIds[1];

      console.log('\n📍 2차 평가자 구성 및 검증 시작');

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 2차 평가자 구성
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: evaluatorId,
      });

      console.log('📍 2차 평가자 구성 완료');

      // 구성 결과 검증
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      const 이차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === testWbsItemId,
      );

      expect(이차평가라인매핑).toBeDefined();
      expect(이차평가라인매핑.evaluatorId).toBe(evaluatorId);
      expect(이차평가라인매핑.employeeId).toBe(testEmployeeId);
      expect(이차평가라인매핑.wbsItemId).toBe(testWbsItemId);
      expect(이차평가라인매핑.evaluationLineId).toBeDefined();

      console.log('✅ 2차 평가자 구성 검증 완료');

      // 대시보드 API 검증
      const 직원현황 =
        await evaluationLineConfigurationScenario.직원_평가기간_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            employeeId: testEmployeeId,
          },
        );

      expect(직원현황.criteriaSetup?.evaluationLine).toBeDefined();
      expect(직원현황.criteriaSetup?.evaluationLine.hasSecondaryEvaluator).toBe(
        true,
      );

      console.log('✅ 대시보드 API 검증 완료');
    });

    it('기존 2차 평가자를 업데이트할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 기존평가자Id = employeeIds[1];
      const 새로운평가자Id = employeeIds[2];

      console.log('\n📍 2차 평가자 업데이트 테스트 시작');

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 기존 2차 평가자 구성
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 기존평가자Id,
      });

      // 새로운 평가자로 업데이트
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 새로운평가자Id,
      });

      // 업데이트 결과 검증
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      const 이차평가라인매핑들 = 평가설정.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === testWbsItemId,
      );

      expect(이차평가라인매핑들.length).toBe(1); // WBS별 유일성 확인
      expect(이차평가라인매핑들[0].evaluatorId).toBe(새로운평가자Id);
      expect(이차평가라인매핑들[0].evaluatorId).not.toBe(기존평가자Id);

      console.log('✅ 2차 평가자 업데이트 검증 완료');
    });

    it('여러 직원의 여러 WBS 항목에 대한 2차 평가자를 배치로 구성할 수 있어야 한다', async () => {
      const testEmployeeIds = [employeeIds[0], employeeIds[1]];
      const testProjectId = projectIds[0];
      const testWbsItemIds = [wbsItemIds[0], wbsItemIds[1]];
      const evaluatorIds = [employeeIds[3], employeeIds[4]];

      console.log('\n📍 배치 2차 평가자 구성 시작');

      // 선행 조건
      for (const employeeId of testEmployeeIds) {
        await projectAssignmentScenario.프로젝트를_할당한다({
          employeeId: employeeId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        for (const wbsItemId of testWbsItemIds) {
          await wbsAssignmentScenario.WBS를_할당한다({
            employeeId: employeeId,
            wbsItemId: wbsItemId,
            projectId: testProjectId,
            periodId: evaluationPeriodId,
          });
        }
      }

      // 배치 2차 평가자 구성
      const assignments: Array<{
        employeeId: string;
        wbsItemId: string;
        evaluatorId: string;
      }> = [];

      for (let i = 0; i < testEmployeeIds.length; i++) {
        for (let j = 0; j < testWbsItemIds.length; j++) {
          assignments.push({
            employeeId: testEmployeeIds[i],
            wbsItemId: testWbsItemIds[j],
            evaluatorId: evaluatorIds[j],
          });
        }
      }

      const 배치구성결과 =
        await evaluationLineConfigurationScenario.여러_직원의_이차_평가자를_배치_구성한다(
          {
            periodId: evaluationPeriodId,
            assignments: assignments,
          },
        );

      // 배치 구성 결과 검증
      expect(배치구성결과.totalCount).toBe(assignments.length);
      expect(배치구성결과.successCount).toBe(assignments.length);
      expect(배치구성결과.failureCount).toBe(0);

      for (let i = 0; i < assignments.length; i++) {
        const result = 배치구성결과.results[i];
        expect(result.status).toBe('success');
        expect(result.employeeId).toBe(assignments[i].employeeId);
        expect(result.wbsItemId).toBe(assignments[i].wbsItemId);
        expect(result.mapping.evaluatorId).toBe(assignments[i].evaluatorId);
      }

      console.log('✅ 배치 2차 평가자 구성 검증 완료');

      // 배치 구성 후 대시보드 검증
      const 모든직원현황 =
        await evaluationLineConfigurationScenario.모든_직원_평가기간_현황을_조회한다(
          evaluationPeriodId,
        );

      for (const employeeId of testEmployeeIds) {
        const 직원현황 = 모든직원현황.find(
          (emp: any) => emp.employeeId === employeeId,
        );
        expect(직원현황).toBeDefined();
        expect(
          직원현황.criteriaSetup?.evaluationLine.hasSecondaryEvaluator,
        ).toBe(true);
      }

      console.log('✅ 배치 구성 후 대시보드 검증 완료');
    });
  });

  describe('1차/2차 평가자 통합 구성 관리', () => {
    it('1차 평가자 구성 후 2차 평가자 구성을 수행할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Id = employeeIds[1];
      const 이차평가자Id = employeeIds[2];

      console.log('\n📍 1차/2차 평가자 통합 구성 시작');

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 1차 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 일차평가자Id,
      });

      // 2차 평가자 구성
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 이차평가자Id,
      });

      // 통합 구성 결과 검증
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      const 일차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === null,
      );

      const 이차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === testWbsItemId,
      );

      expect(일차평가라인매핑).toBeDefined();
      expect(일차평가라인매핑.evaluatorId).toBe(일차평가자Id);
      expect(이차평가라인매핑).toBeDefined();
      expect(이차평가라인매핑.evaluatorId).toBe(이차평가자Id);

      // 대시보드 검증
      const 직원현황 =
        await evaluationLineConfigurationScenario.직원_평가기간_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            employeeId: testEmployeeId,
          },
        );

      expect(직원현황.criteriaSetup?.evaluationLine.hasPrimaryEvaluator).toBe(
        true,
      );
      expect(직원현황.criteriaSetup?.evaluationLine.hasSecondaryEvaluator).toBe(
        true,
      );
      expect(직원현황.criteriaSetup?.evaluationLine.status).toBe('complete');

      console.log('✅ 1차/2차 평가자 통합 구성 검증 완료');
    });

    it('배치 1차 평가자 구성 후 배치 2차 평가자 구성을 수행할 수 있어야 한다', async () => {
      const testEmployeeIds = [employeeIds[0], employeeIds[1]];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Ids = [employeeIds[3], employeeIds[4]];
      const 이차평가자Id = employeeIds[5];

      console.log('\n📍 배치 1차/2차 평가자 통합 구성 시작');

      // 선행 조건
      for (const employeeId of testEmployeeIds) {
        await projectAssignmentScenario.프로젝트를_할당한다({
          employeeId: employeeId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        await wbsAssignmentScenario.WBS를_할당한다({
          employeeId: employeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      // 배치 1차 평가자 구성
      await evaluationLineConfigurationScenario.여러_직원의_일차_평가자를_배치_구성한다(
        {
          periodId: evaluationPeriodId,
          assignments: testEmployeeIds.map((employeeId, index) => ({
            employeeId: employeeId,
            evaluatorId: 일차평가자Ids[index],
          })),
        },
      );

      // 배치 2차 평가자 구성
      await evaluationLineConfigurationScenario.여러_직원의_이차_평가자를_배치_구성한다(
        {
          periodId: evaluationPeriodId,
          assignments: testEmployeeIds.map((employeeId) => ({
            employeeId: employeeId,
            wbsItemId: testWbsItemId,
            evaluatorId: 이차평가자Id,
          })),
        },
      );

      // 통합 배치 구성 결과 검증
      const 평가자목록 =
        await evaluationLineConfigurationScenario.평가기간별_평가자_목록을_조회한다(
          {
            periodId: evaluationPeriodId,
            type: 'all',
          },
        );

      expect(평가자목록.evaluators).toBeDefined();
      const primaryEvaluators = 평가자목록.evaluators.filter(
        (e: any) => e.evaluatorType === 'primary',
      );
      const secondaryEvaluators = 평가자목록.evaluators.filter(
        (e: any) => e.evaluatorType === 'secondary',
      );

      expect(primaryEvaluators.length).toBeGreaterThan(0);
      expect(secondaryEvaluators.length).toBeGreaterThan(0);

      console.log('✅ 배치 1차/2차 평가자 통합 구성 검증 완료');
    });
  });

  describe('평가라인 조회 검증', () => {
    it('직원 평가설정 통합 조회를 통해 1차/2차 평가자를 확인할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Id = employeeIds[1];
      const 이차평가자Id = employeeIds[2];

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 일차평가자Id,
      });

      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 이차평가자Id,
      });

      // 직원 평가설정 통합 조회
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      // 검증
      expect(평가설정.employeeId).toBe(testEmployeeId);
      expect(평가설정.periodId).toBe(evaluationPeriodId);
      expect(평가설정.projectAssignments).toBeDefined();
      expect(Array.isArray(평가설정.projectAssignments)).toBe(true);
      expect(평가설정.wbsAssignments).toBeDefined();
      expect(Array.isArray(평가설정.wbsAssignments)).toBe(true);
      expect(평가설정.evaluationLineMappings).toBeDefined();
      expect(Array.isArray(평가설정.evaluationLineMappings)).toBe(true);

      const 일차평가라인매핑 = 평가설정.evaluationLineMappings.find(
        (mapping: any) => mapping.wbsItemId === null,
      );
      const 이차평가라인매핑 = 평가설정.evaluationLineMappings.find(
        (mapping: any) => mapping.wbsItemId === testWbsItemId,
      );

      expect(일차평가라인매핑).toBeDefined();
      expect(이차평가라인매핑).toBeDefined();

      console.log('✅ 직원 평가설정 통합 조회 검증 완료');
    });

    it('평가기간별 평가자 목록 조회에서 type 파라미터에 따라 필터링되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Id = employeeIds[1];
      const 이차평가자Id = employeeIds[2];

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 일차평가자Id,
      });

      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 이차평가자Id,
      });

      // type=primary 조회
      const primary평가자목록 =
        await evaluationLineConfigurationScenario.평가기간별_평가자_목록을_조회한다(
          {
            periodId: evaluationPeriodId,
            type: 'primary',
          },
        );

      expect(primary평가자목록.evaluators).toBeDefined();
      primary평가자목록.evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('primary');
      });

      // type=secondary 조회
      const secondary평가자목록 =
        await evaluationLineConfigurationScenario.평가기간별_평가자_목록을_조회한다(
          {
            periodId: evaluationPeriodId,
            type: 'secondary',
          },
        );

      expect(secondary평가자목록.evaluators).toBeDefined();
      secondary평가자목록.evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('secondary');
      });

      // type=all 조회
      const 전체평가자목록 =
        await evaluationLineConfigurationScenario.평가기간별_평가자_목록을_조회한다(
          {
            periodId: evaluationPeriodId,
            type: 'all',
          },
        );

      expect(전체평가자목록.evaluators).toBeDefined();
      expect(Array.isArray(전체평가자목록.evaluators)).toBe(true);

      // 평가자 목록이 있을 경우에만 검증
      if (전체평가자목록.evaluators.length > 0) {
        const hasPrimary = 전체평가자목록.evaluators.some(
          (e: any) => e.evaluatorType === 'primary',
        );
        const hasSecondary = 전체평가자목록.evaluators.some(
          (e: any) => e.evaluatorType === 'secondary',
        );

        // 평가자가 구성되었으므로 최소 하나의 타입은 있어야 함
        expect(hasPrimary || hasSecondary).toBe(true);
      }

      console.log('✅ 평가기간별 평가자 목록 조회 검증 완료');
    });
  });

  describe('대시보드 API를 통한 평가라인 상태 검증', () => {
    it('직원 평가기간 현황 조회를 통해 평가라인 정보를 확인할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Id = employeeIds[1];
      const 이차평가자Id = employeeIds[2];

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 일차평가자Id,
      });

      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 이차평가자Id,
      });

      // 직원 평가기간 현황 조회
      const 직원현황 =
        await evaluationLineConfigurationScenario.직원_평가기간_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            employeeId: testEmployeeId,
          },
        );

      // 검증
      expect(직원현황.employee).toBeDefined();
      expect(직원현황.employeeId).toBe(testEmployeeId);
      expect(직원현황.criteriaSetup?.evaluationLine).toBeDefined();
      expect(직원현황.criteriaSetup?.evaluationLine.status).toBe('complete');
      expect(직원현황.criteriaSetup?.evaluationLine.hasPrimaryEvaluator).toBe(
        true,
      );
      expect(직원현황.criteriaSetup?.evaluationLine.hasSecondaryEvaluator).toBe(
        true,
      );

      console.log('✅ 직원 평가기간 현황 조회 검증 완료');
    });

    it('평가자별 피평가자 현황 조회를 통해 평가라인 정보를 확인할 수 있어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const 일차평가자Id = employeeIds[1];
      const 이차평가자Id = employeeIds[2];

      // 선행 조건
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: testEmployeeId,
        periodId: evaluationPeriodId,
        evaluatorId: 일차평가자Id,
      });

      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 이차평가자Id,
      });

      // 1차 평가자로 피평가자 현황 조회
      const 일차평가자_대상자현황 =
        await evaluationLineConfigurationScenario.평가자별_피평가자_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            evaluatorId: 일차평가자Id,
          },
        );

      const 피평가자정보 = 일차평가자_대상자현황.find(
        (target: any) => target.employeeId === testEmployeeId,
      );

      expect(피평가자정보).toBeDefined();
      expect(피평가자정보.evaluationLine).toBeDefined();
      expect(피평가자정보.evaluationLine.status).toBe('complete');
      expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(피평가자정보.downwardEvaluation).toBeDefined();
      expect(피평가자정보.downwardEvaluation.isPrimary).toBe(true);
      expect(피평가자정보.downwardEvaluation.isSecondary).toBe(false);
      expect(피평가자정보.downwardEvaluation.primaryStatus).toBeDefined();

      // 2차 평가자로 피평가자 현황 조회
      const 이차평가자_대상자현황 =
        await evaluationLineConfigurationScenario.평가자별_피평가자_현황을_조회한다(
          {
            periodId: evaluationPeriodId,
            evaluatorId: 이차평가자Id,
          },
        );

      const 이차피평가자정보 = 이차평가자_대상자현황.find(
        (target: any) => target.employeeId === testEmployeeId,
      );

      expect(이차피평가자정보).toBeDefined();
      expect(이차피평가자정보.evaluationLine).toBeDefined();
      expect(이차피평가자정보.evaluationLine.hasSecondaryEvaluator).toBe(true);
      expect(이차피평가자정보.downwardEvaluation).toBeDefined();
      expect(이차피평가자정보.downwardEvaluation.isPrimary).toBe(false);
      expect(이차피평가자정보.downwardEvaluation.isSecondary).toBe(true);
      expect(이차피평가자정보.downwardEvaluation.secondaryStatus).toBeDefined();

      console.log('✅ 평가자별 피평가자 현황 조회 검증 완료');
    });
  });

  describe('평가자 변경 시 기존 하향평가 삭제 검증', () => {
    let downwardEvaluationApiClient: DownwardEvaluationApiClient;
    let dashboardApiClient: DashboardApiClient;

    beforeAll(() => {
      downwardEvaluationApiClient = new DownwardEvaluationApiClient(testSuite);
      dashboardApiClient = new DashboardApiClient(testSuite);
    });

    it('1차 평가자 변경 시 기존 평가자의 하향평가가 삭제되어야 한다', async () => {
      const 피평가자Id = employeeIds[0];
      const 기존평가자Id = employeeIds[1];
      const 새평가자Id = employeeIds[2];
      const 프로젝트Id = projectIds[0];
      const wbsItemId = wbsItemIds[0];

      console.log('\n📍 1차 평가자 변경 시 하향평가 삭제 테스트 시작');

      // 선행 조건: 프로젝트 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: 피평가자Id,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      // 1차 평가자 구성 (기존 평가자)
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: 피평가자Id,
        periodId: evaluationPeriodId,
        evaluatorId: 기존평가자Id,
      });

      // 기존 평가자가 하향평가 작성
      const 하향평가결과 = await downwardEvaluationApiClient.upsertPrimary({
        evaluateeId: 피평가자Id,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId,
        evaluatorId: 기존평가자Id,
        downwardEvaluationContent: '기존 평가자의 하향평가 내용입니다.',
        downwardEvaluationScore: 85,
      });

      expect(하향평가결과.id).toBeDefined();
      console.log('📍 기존 평가자 하향평가 저장 완료:', 하향평가결과.id);

      // 대시보드에서 하향평가 확인
      const 변경전_할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      const 변경전_wbs = 변경전_할당정보.projects[0]?.wbsList?.find(
        (wbs: any) => wbs.wbsId === wbsItemId,
      );
      expect(변경전_wbs?.primaryDownwardEvaluation?.evaluatorId).toBe(기존평가자Id);
      expect(변경전_wbs?.primaryDownwardEvaluation?.score).toBe(85);

      console.log('📍 1차 평가자 변경 실행');

      // 1차 평가자 변경 (새 평가자로)
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: 피평가자Id,
        periodId: evaluationPeriodId,
        evaluatorId: 새평가자Id,
      });

      // 대시보드에서 하향평가 삭제 확인
      const 변경후_할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      const 변경후_wbs = 변경후_할당정보.projects[0]?.wbsList?.find(
        (wbs: any) => wbs.wbsId === wbsItemId,
      );

      // 새 평가자로 변경되었고, 기존 하향평가는 삭제되었어야 함
      expect(변경후_wbs?.primaryDownwardEvaluation?.evaluatorId).toBe(새평가자Id);
      expect(변경후_wbs?.primaryDownwardEvaluation?.isCompleted).toBe(false);
      // 점수가 없거나 undefined 이어야 함 (삭제되었으므로)
      expect(변경후_wbs?.primaryDownwardEvaluation?.score).toBeUndefined();

      console.log('✅ 1차 평가자 변경 시 하향평가 삭제 검증 완료');
    });

    it('2차 평가자 변경 시 기존 평가자의 해당 WBS 하향평가가 삭제되어야 한다', async () => {
      const 피평가자Id = employeeIds[3];
      const 기존평가자Id = employeeIds[4];
      const 새평가자Id = employeeIds[5];
      const 프로젝트Id = projectIds[1];
      const wbsItemId = wbsItemIds[1];

      console.log('\n📍 2차 평가자 변경 시 하향평가 삭제 테스트 시작');

      // 선행 조건: 프로젝트 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: 피평가자Id,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      // 2차 평가자 구성 (기존 평가자)
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 기존평가자Id,
      });

      // 기존 평가자가 2차 하향평가 작성
      const 하향평가결과 = await downwardEvaluationApiClient.upsertSecondary({
        evaluateeId: 피평가자Id,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId,
        evaluatorId: 기존평가자Id,
        downwardEvaluationContent: '기존 2차 평가자의 하향평가 내용입니다.',
        downwardEvaluationScore: 90,
      });

      expect(하향평가결과.id).toBeDefined();
      console.log('📍 기존 2차 평가자 하향평가 저장 완료:', 하향평가결과.id);

      // 대시보드에서 하향평가 확인
      const 변경전_할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      const 변경전_wbs = 변경전_할당정보.projects[0]?.wbsList?.find(
        (wbs: any) => wbs.wbsId === wbsItemId,
      );
      expect(변경전_wbs?.secondaryDownwardEvaluation?.evaluatorId).toBe(기존평가자Id);
      expect(변경전_wbs?.secondaryDownwardEvaluation?.score).toBe(90);

      console.log('📍 2차 평가자 변경 실행');

      // 2차 평가자 변경 (새 평가자로)
      await evaluationLineConfigurationScenario.이차_평가자를_구성한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        periodId: evaluationPeriodId,
        evaluatorId: 새평가자Id,
      });

      // 대시보드에서 하향평가 삭제 확인
      const 변경후_할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      const 변경후_wbs = 변경후_할당정보.projects[0]?.wbsList?.find(
        (wbs: any) => wbs.wbsId === wbsItemId,
      );

      // 새 평가자로 변경되었고, 기존 하향평가는 삭제되었어야 함
      expect(변경후_wbs?.secondaryDownwardEvaluation?.evaluatorId).toBe(새평가자Id);
      expect(변경후_wbs?.secondaryDownwardEvaluation?.isCompleted).toBe(false);
      // 점수가 없거나 undefined 이어야 함 (삭제되었으므로)
      expect(변경후_wbs?.secondaryDownwardEvaluation?.score).toBeUndefined();

      console.log('✅ 2차 평가자 변경 시 하향평가 삭제 검증 완료');
    });

    it('동일한 평가자로 다시 구성 시 하향평가는 삭제되지 않아야 한다', async () => {
      // 이 테스트는 성공한 1차/2차 평가자 변경 테스트와 동일한 인덱스 패턴을 사용
      // 각 테스트마다 beforeEach에서 새로운 데이터가 생성되므로 충돌 없음
      const 피평가자Id = employeeIds[0];
      const 평가자Id = employeeIds[1];
      const 프로젝트Id = projectIds[0];
      const wbsItemId = wbsItemIds[0];

      console.log('\n📍 동일 평가자 재구성 시 하향평가 유지 테스트 시작');

      // 선행 조건: 프로젝트 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: 피평가자Id,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      // 1차 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: 피평가자Id,
        periodId: evaluationPeriodId,
        evaluatorId: 평가자Id,
      });

      // 평가자가 하향평가 작성
      const 하향평가결과 = await downwardEvaluationApiClient.upsertPrimary({
        evaluateeId: 피평가자Id,
        periodId: evaluationPeriodId,
        wbsId: wbsItemId,
        evaluatorId: 평가자Id,
        downwardEvaluationContent: '평가자의 하향평가 내용입니다.',
        downwardEvaluationScore: 88,
      });

      expect(하향평가결과.id).toBeDefined();
      console.log('📍 하향평가 저장 완료:', 하향평가결과.id);

      // 동일한 평가자로 다시 구성 (중복 구성 시도)
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: 피평가자Id,
        periodId: evaluationPeriodId,
        evaluatorId: 평가자Id, // 동일한 평가자
      });

      // 대시보드에서 하향평가 유지 확인
      const 할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      const wbs = 할당정보.projects[0]?.wbsList?.find(
        (w: any) => w.wbsId === wbsItemId,
      );

      // 동일 평가자이므로 하향평가가 유지되어야 함
      expect(wbs?.primaryDownwardEvaluation?.evaluatorId).toBe(평가자Id);
      expect(wbs?.primaryDownwardEvaluation?.score).toBe(88);

      console.log('✅ 동일 평가자 재구성 시 하향평가 유지 검증 완료');
    });
  });

  describe('대시보드 응답에서 downwardEvaluationId 필드 제거 검증', () => {
    let dashboardApiClient: DashboardApiClient;

    beforeAll(() => {
      dashboardApiClient = new DashboardApiClient(testSuite);
    });

    it('사용자 할당 정보 조회 응답에 downwardEvaluationId 필드가 없어야 한다', async () => {
      const 피평가자Id = employeeIds[0];
      const 평가자Id = employeeIds[1];
      const 프로젝트Id = projectIds[0];
      const wbsItemId = wbsItemIds[0];

      console.log('\n📍 downwardEvaluationId 필드 제거 검증 시작');

      // 선행 조건: 프로젝트 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: 피평가자Id,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: 피평가자Id,
        wbsItemId: wbsItemId,
        projectId: 프로젝트Id,
        periodId: evaluationPeriodId,
      });

      // 평가자 구성
      await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
        employeeId: 피평가자Id,
        periodId: evaluationPeriodId,
        evaluatorId: 평가자Id,
      });

      // 대시보드 조회
      const 할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: 피평가자Id,
      });

      // WBS의 하향평가 정보에서 downwardEvaluationId 필드가 없는지 확인
      for (const project of 할당정보.projects) {
        for (const wbs of project.wbsList) {
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation).not.toHaveProperty('downwardEvaluationId');
            // 다른 필수 필드들은 있어야 함
            expect(wbs.primaryDownwardEvaluation).toHaveProperty('evaluatorId');
            expect(wbs.primaryDownwardEvaluation).toHaveProperty('isCompleted');
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation).not.toHaveProperty('downwardEvaluationId');
            // 다른 필수 필드들은 있어야 함
            expect(wbs.secondaryDownwardEvaluation).toHaveProperty('evaluatorId');
            expect(wbs.secondaryDownwardEvaluation).toHaveProperty('isCompleted');
          }
        }
      }

      console.log('✅ downwardEvaluationId 필드 제거 검증 완료');
    });
  });

  describe('평가라인 변경 실패 케이스 검증', () => {
    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러를 반환해야 한다', async () => {
      const invalidPeriodId = 'invalid-uuid';

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeIds[0]}/period/${invalidPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: employeeIds[1],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      console.log('✅ 잘못된 UUID 형식 periodId 검증 완료');
    });

    it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러를 반환해야 한다', async () => {
      const invalidEmployeeId = 'invalid-uuid';

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${invalidEmployeeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: employeeIds[1],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      console.log('✅ 잘못된 UUID 형식 employeeId 검증 완료');
    });

    it('잘못된 UUID 형식의 evaluatorId를 body로 전달 시 400 에러를 반환해야 한다', async () => {
      const invalidEvaluatorId = 'invalid-uuid';

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employeeIds[0]}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: invalidEvaluatorId,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      console.log('✅ 잘못된 UUID 형식 evaluatorId 검증 완료');
    });

    it('배치 요청에서 assignments 필드가 누락된 경우 400 에러를 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/period/${evaluationPeriodId}/batch-primary-evaluator`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      console.log('✅ assignments 필드 누락 검증 완료');
    });

    it('배치 요청에서 일부 항목이 실패해도 성공한 항목은 처리되어야 한다', async () => {
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];
      const validEvaluatorId = employeeIds[1];

      // 선행 조건: 하나의 직원만 준비
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[0],
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 유효한 항목과 유효하지 않은 항목을 섞어서 전송
      const assignments = [
        {
          employeeId: employeeIds[0], // 유효한 직원
          evaluatorId: validEvaluatorId,
        },
        {
          employeeId: '00000000-0000-4000-8000-000000000000', // 존재하지 않는 직원
          evaluatorId: validEvaluatorId,
        },
      ];

      const 배치구성결과 =
        await evaluationLineConfigurationScenario.여러_직원의_일차_평가자를_배치_구성한다(
          {
            periodId: evaluationPeriodId,
            assignments: assignments,
          },
        );

      // 검증
      expect(배치구성결과.totalCount).toBe(2);
      expect(배치구성결과.successCount).toBeGreaterThan(0);
      expect(배치구성결과.results.length).toBe(2);

      // 성공한 항목은 처리되었는지 확인
      const successResult = 배치구성결과.results.find(
        (r: any) => r.status === 'success',
      );

      expect(successResult).toBeDefined();

      // 실패한 항목이 있는 경우에만 확인
      if (배치구성결과.failureCount > 0) {
        const failureResult = 배치구성결과.results.find(
          (r: any) => r.status === 'error',
        );

        expect(failureResult).toBeDefined();
        expect(failureResult.error).toBeDefined();
      }

      // 일부 실패 시에도 성공한 항목은 처리되어야 함 (이미 successResult 확인함)
      expect(successResult.employeeId).toBe(employeeIds[0]);

      console.log('✅ 배치 요청 일부 실패 처리 검증 완료');
    });
  });
});
