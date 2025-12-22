import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import { EvaluationLineApiClient } from '../../api-clients/evaluation-line.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsSelfEvaluationApiClient } from '../../api-clients/wbs-self-evaluation.api-client';

/**
 * 이전 평가기간 데이터 복사 E2E 테스트
 *
 * 시나리오:
 * 1. 원본 평가기간 생성
 * 2. 원본 평가기간에 직원 등록
 * 3. 원본 평가기간에 프로젝트 할당
 * 4. 원본 평가기간에 평가라인 매핑 추가
 * 5. 대상 평가기간 생성
 * 6. 이전 평가기간 데이터 복사 API 호출
 * 7. 나의 할당 정보 조회 API로 복사된 데이터 검증
 */
describe('이전 평가기간 데이터 복사 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let periodApiClient: EvaluationPeriodManagementApiClient;
  let lineApiClient: EvaluationLineApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let dashboardApiClient: DashboardApiClient;
  let selfEvalApiClient: WbsSelfEvaluationApiClient;

  let sourcePeriodId: string;
  let targetPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    periodApiClient = new EvaluationPeriodManagementApiClient(testSuite);
    lineApiClient = new EvaluationLineApiClient(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
    dashboardApiClient = new DashboardApiClient(testSuite);
    selfEvalApiClient = new WbsSelfEvaluationApiClient(testSuite);

    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 4,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    // 첫 번째 직원을 현재 로그인 사용자로 설정
    if (employeeIds.length > 0) {
      testSuite.setCurrentUser({
        id: employeeIds[0],
        email: 'test-user@example.com',
        name: '테스트 사용자',
        employeeNumber: 'TEST001',
        roles: ['admin', 'user'],
      });
      console.log(`🔐 현재 로그인 사용자 설정: ${employeeIds[0]}`);
    }

    console.log(
      `📝 시드 데이터 생성 완료: 직원 ${employeeIds.length}명, 프로젝트 ${projectIds.length}개, WBS ${wbsItemIds.length}개`,
    );
  });

  afterAll(async () => {
    // 정리 작업
    if (targetPeriodId) {
      try {
        await periodApiClient.deleteEvaluationPeriod(targetPeriodId);
      } catch (error) {
        console.log('대상 평가기간 삭제 중 오류:', error.message);
      }
    }

    if (sourcePeriodId) {
      try {
        await periodApiClient.deleteEvaluationPeriod(sourcePeriodId);
      } catch (error) {
        console.log('원본 평가기간 삭제 중 오류:', error.message);
      }
    }

    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('이전 평가기간 데이터 복사 기능 테스트', () => {
    it('1단계: 원본 평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '원본 평가기간 (데이터 복사용)',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '프로젝트 할당과 평가라인이 설정된 원본 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');

      sourcePeriodId = result.id;
      console.log(`✅ 원본 평가기간 생성 완료: ${result.id}`);
    });

    it('2단계: 원본 평가기간에 직원을 등록한다', async () => {
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${sourcePeriodId}/targets/bulk`)
        .send({
          employeeIds: [employeeIds[0], employeeIds[1]],
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      console.log(
        `✅ 원본 평가기간에 직원 2명 등록 완료 (${employeeIds[0]}, ${employeeIds[1]})`,
      );
    });

    it('3단계: 원본 평가기간에 프로젝트를 할당한다', async () => {
      // 직원 0에게 프로젝트 0, 1 할당
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[0],
        projectId: projectIds[0],
        periodId: sourcePeriodId,
      });

      await projectAssignmentApiClient.create({
        employeeId: employeeIds[0],
        projectId: projectIds[1],
        periodId: sourcePeriodId,
      });

      console.log(
        `✅ 원본 평가기간에 프로젝트 2개 할당 완료 (직원: ${employeeIds[0]})`,
      );
    });

    it('3.5단계: 원본 평가기간에 WBS를 할당한다', async () => {
      // 프로젝트 0의 WBS 2개 할당 (wbsItemIds[0], wbsItemIds[1])
      await wbsAssignmentApiClient.create({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: sourcePeriodId,
      });

      await wbsAssignmentApiClient.create({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[0],
        periodId: sourcePeriodId,
      });

      console.log(
        `✅ 원본 평가기간에 WBS 2개 할당 완료 (프로젝트: ${projectIds[0]})`,
      );
    });

    it('4단계: 원본 평가기간에 1차 평가자를 구성한다', async () => {
      // 평가자(employeeIds[1])가 피평가자(employeeIds[0])를 평가하도록 설정
      const result = await lineApiClient.configurePrimaryEvaluator({
        employeeId: employeeIds[0], // 피평가자
        periodId: sourcePeriodId,
        evaluatorId: employeeIds[1], // 평가자
      });

      expect(result).toBeDefined();
      console.log(
        `✅ 1차 평가자 구성 완료: 평가자=${employeeIds[1]}, 피평가자=${employeeIds[0]}`,
      );
    });

    it('5단계: 원본 평가기간에 2차 평가자를 구성한다', async () => {
      // WBS 기반 2차 평가자 매핑 추가
      const result = await lineApiClient.configureSecondaryEvaluator({
        employeeId: employeeIds[0], // 피평가자
        wbsItemId: wbsItemIds[0], // WBS 항목
        periodId: sourcePeriodId,
        evaluatorId: employeeIds[2], // 2차 평가자
      });

      expect(result).toBeDefined();
      console.log(
        `✅ 2차 평가자 구성 완료: 평가자=${employeeIds[2]}, 피평가자=${employeeIds[0]}, WBS=${wbsItemIds[0]}`,
      );
    });

    it('6단계: 원본 평가기간의 할당 데이터를 조회한다', async () => {
      const result = await dashboardApiClient.getEmployeeAssignedData({
        periodId: sourcePeriodId,
        employeeId: employeeIds[0],
      });

      expect(result.employee.id).toBe(employeeIds[0]);
      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalProjects).toBeGreaterThan(0);

      console.log(
        `✅ 원본 평가기간 할당 데이터 조회 완료: 프로젝트 ${result.summary.totalProjects}개`,
      );
    });

    it('6.5단계: 원본 평가기간에 WBS별 subProject 데이터를 설정한다', async () => {
      // WBS 자기평가 저장 (subProject 설정)
      await selfEvalApiClient.upsertWbsSelfEvaluation({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: sourcePeriodId,
        selfEvaluationContent: '테스트 자기평가 내용',
        selfEvaluationScore: 80,
        performanceResult: '테스트 성과 결과',
        subProject: '테스트 서브프로젝트 A',
      });

      await selfEvalApiClient.upsertWbsSelfEvaluation({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[1],
        periodId: sourcePeriodId,
        selfEvaluationContent: '테스트 자기평가 내용 2',
        selfEvaluationScore: 90,
        performanceResult: '테스트 성과 결과 2',
        subProject: '테스트 서브프로젝트 B',
      });

      console.log(
        `✅ WBS별 subProject 설정 완료: WBS ${wbsItemIds[0]}, ${wbsItemIds[1]}`,
      );
    });

    it('7단계: 대상 평가기간을 생성한다', async () => {
      const today = new Date();
      // 원본 평가기간과 겹치지 않도록 3개월 후 시작
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(today.getMonth() + 3);
      const fiveMonthsLater = new Date(today);
      fiveMonthsLater.setMonth(today.getMonth() + 5);

      const createData = {
        name: '대상 평가기간 (데이터 복사 대상)',
        startDate: threeMonthsLater.toISOString(),
        peerEvaluationDeadline: fiveMonthsLater.toISOString(),
        description: '원본 평가기간의 데이터를 복사받을 평가기간',
        maxSelfEvaluationRate: 150,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');

      targetPeriodId = result.id;
      console.log(`✅ 대상 평가기간 생성 완료: ${result.id}`);
    });

    it('8단계: 이전 평가기간 데이터를 복사한다 (Admin API)', async () => {
      console.log(`\n🔍 복사 API 호출 정보:`);
      console.log(`   - targetPeriodId: ${targetPeriodId}`);
      console.log(`   - employeeId: ${employeeIds[0]}`);
      console.log(`   - sourcePeriodId: ${sourcePeriodId}`);
      console.log(`   - 현재 로그인 사용자: JWT에서 자동 추출`);

      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${targetPeriodId}/employees/${employeeIds[0]}/copy-from/${sourcePeriodId}`,
        )
        .send({}); // 모든 프로젝트와 WBS 복사

      // 에러 발생 시 상세 정보 출력
      if (response.status !== 200) {
        console.error('\n❌ 복사 API 에러 발생!');
        console.error(`Status: ${response.status}`);
        console.error(`Response Body:`, JSON.stringify(response.body, null, 2));
        console.error(`Error:`, response.body.message || response.body.error);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.copiedProjectAssignments).toBeGreaterThanOrEqual(0);
      expect(response.body.copiedEvaluationLineMappings).toBeGreaterThanOrEqual(
        0,
      );

      console.log(
        `✅ 이전 평가기간 데이터 복사 완료: 프로젝트 할당 ${response.body.copiedProjectAssignments}개, 평가라인 매핑 ${response.body.copiedEvaluationLineMappings}개`,
      );
    });

    it('9단계: 나의 할당 정보 조회로 복사된 데이터를 확인한다', async () => {
      // 대상 평가기간의 할당 데이터 조회
      const result = await dashboardApiClient.getEmployeeAssignedData({
        periodId: targetPeriodId,
        employeeId: employeeIds[0],
      });

      // 검증: 직원 정보
      expect(result.employee.id).toBe(employeeIds[0]);

      // 검증: 프로젝트 할당
      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalProjects).toBeGreaterThan(0);

      // 검증: 평가기간 정보
      expect(result.evaluationPeriod.id).toBe(targetPeriodId);

      console.log(
        `✅ 대상 평가기간 할당 데이터 조회 성공: 프로젝트 ${result.summary.totalProjects}개`,
      );
      console.log(
        `   - 복사된 프로젝트: ${result.projects.map((p: any) => p.projectName).join(', ')}`,
      );
    });

    it('10단계: 원본과 대상의 프로젝트 할당이 일치하는지 확인한다', async () => {
      // 원본 평가기간 데이터
      const sourceData = await dashboardApiClient.getEmployeeAssignedData({
        periodId: sourcePeriodId,
        employeeId: employeeIds[0],
      });

      // 대상 평가기간 데이터
      const targetData = await dashboardApiClient.getEmployeeAssignedData({
        periodId: targetPeriodId,
        employeeId: employeeIds[0],
      });

      // 프로젝트 개수 일치 확인
      expect(targetData.summary.totalProjects).toBe(
        sourceData.summary.totalProjects,
      );
      expect(targetData.projects.length).toBe(sourceData.projects.length);

      // 프로젝트 ID 일치 확인
      const sourceProjectIds = sourceData.projects.map((p: any) => p.projectId);
      const targetProjectIds = targetData.projects.map((p: any) => p.projectId);

      expect(targetProjectIds.sort()).toEqual(sourceProjectIds.sort());

      console.log(
        `✅ 원본과 대상의 프로젝트 할당이 일치합니다: ${sourceProjectIds.length}개`,
      );
    });

    it('11단계: 평가라인 매핑이 복사되었는지 확인한다', async () => {
      // 원본 평가기간의 평가설정 조회
      const sourceSettings = await lineApiClient.getEmployeeEvaluationSettings({
        employeeId: employeeIds[0],
        periodId: sourcePeriodId,
      });

      // 대상 평가기간의 평가설정 조회
      const targetSettings = await lineApiClient.getEmployeeEvaluationSettings({
        employeeId: employeeIds[0],
        periodId: targetPeriodId,
      });

      // 평가라인 매핑 개수 일치 확인
      expect(targetSettings.evaluationLineMappings).toBeDefined();
      expect(targetSettings.evaluationLineMappings.length).toBe(
        sourceSettings.evaluationLineMappings.length,
      );

      // 평가자가 동일한지 확인
      const sourceEvaluatorIds = sourceSettings.evaluationLineMappings.map(
        (m: any) => m.evaluatorId,
      );
      const targetEvaluatorIds = targetSettings.evaluationLineMappings.map(
        (m: any) => m.evaluatorId,
      );

      expect(targetEvaluatorIds.sort()).toEqual(sourceEvaluatorIds.sort());

      console.log(
        `✅ 평가라인 매핑 복사 확인: ${targetSettings.evaluationLineMappings.length}개 매핑`,
      );
      console.log(`   - 원본 평가자: ${sourceEvaluatorIds.join(', ')}`);
      console.log(`   - 대상 평가자: ${targetEvaluatorIds.join(', ')}`);
    });

    it('12단계: subProject가 제대로 복사되었는지 확인한다', async () => {
      // 원본 평가기간의 할당 데이터 조회 (subProject 포함)
      const sourceData = await dashboardApiClient.getEmployeeAssignedData({
        periodId: sourcePeriodId,
        employeeId: employeeIds[0],
      });

      // 대상 평가기간의 할당 데이터 조회 (subProject 포함)
      const targetData = await dashboardApiClient.getEmployeeAssignedData({
        periodId: targetPeriodId,
        employeeId: employeeIds[0],
      });

      // 디버깅: 원본 데이터 확인
      console.log('\n📋 원본 평가기간 WBS 데이터:');
      console.log(`원본 프로젝트 개수: ${sourceData.projects.length}`);
      sourceData.projects.forEach((p: any, idx: number) => {
        console.log(`  [${idx}] 프로젝트: ${p.projectName}`);
        console.log(
          `      wbsList 존재 여부: ${!!p.wbsList}, 길이: ${p.wbsList?.length || 0}`,
        );
        p.wbsList?.forEach((wbs: any) => {
          console.log(
            `      WBS: ${wbs.wbsCode} (${wbs.wbsId}) - subProject: "${wbs.subProject}"`,
          );
        });
      });

      // 디버깅: 대상 데이터 확인
      console.log('\n📋 대상 평가기간 WBS 데이터:');
      console.log(`대상 프로젝트 개수: ${targetData.projects.length}`);
      targetData.projects.forEach((p: any, idx: number) => {
        console.log(`  [${idx}] 프로젝트: ${p.projectName}`);
        console.log(
          `      wbsList 존재 여부: ${!!p.wbsList}, 길이: ${p.wbsList?.length || 0}`,
        );
        p.wbsList?.forEach((wbs: any) => {
          console.log(
            `      WBS: ${wbs.wbsCode} (${wbs.wbsId}) - subProject: "${wbs.subProject}"`,
          );
        });
      });

      // 원본과 대상에서 subProject가 있는 WBS 찾기
      const sourceWbsWithSubProject = sourceData.projects
        .flatMap((p: any) => p.wbsList || [])
        .filter((wbs: any) => wbs.subProject);

      const targetWbsWithSubProject = targetData.projects
        .flatMap((p: any) => p.wbsList || [])
        .filter((wbs: any) => wbs.subProject);

      // subProject가 있는 WBS 개수 확인
      expect(targetWbsWithSubProject.length).toBeGreaterThan(0);
      expect(targetWbsWithSubProject.length).toBe(
        sourceWbsWithSubProject.length,
      );

      // 각 WBS의 subProject 값이 일치하는지 확인
      for (const sourceWbs of sourceWbsWithSubProject) {
        const targetWbs = targetWbsWithSubProject.find(
          (w: any) => w.wbsId === sourceWbs.wbsId,
        );
        expect(targetWbs).toBeDefined();
        expect(targetWbs.subProject).toBe(sourceWbs.subProject);
      }

      console.log(
        `✅ subProject 복사 확인: ${targetWbsWithSubProject.length}개 WBS`,
      );
      console.log(
        `   - WBS ${wbsItemIds[0]}: subProject="${targetWbsWithSubProject.find((w: any) => w.wbsId === wbsItemIds[0])?.subProject}"`,
      );
      console.log(
        `   - WBS ${wbsItemIds[1]}: subProject="${targetWbsWithSubProject.find((w: any) => w.wbsId === wbsItemIds[1])?.subProject}"`,
      );
    });
  });

  describe('User API를 통한 이전 평가기간 데이터 복사 테스트', () => {
    let userSourcePeriodId: string;
    let userTargetPeriodId: string;

    beforeAll(() => {
      // User API 테스트용으로 직원 2를 현재 사용자로 설정
      if (employeeIds.length > 2) {
        testSuite.setCurrentUser({
          id: employeeIds[2],
          email: 'user2@example.com',
          name: '사용자2',
          employeeNumber: 'USER002',
          roles: ['user'],
        });
        console.log(`🔐 User API 테스트용 현재 사용자 설정: ${employeeIds[2]}`);
      }
    });

    it('1단계: 사용자용 원본 평가기간을 생성한다', async () => {
      const today = new Date();
      const sixMonthsLater = new Date(today);
      sixMonthsLater.setMonth(today.getMonth() + 6);

      const createData = {
        name: '사용자용 원본 평가기간',
        startDate: sixMonthsLater.toISOString(),
        peerEvaluationDeadline: new Date(
          sixMonthsLater.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        description: '사용자가 직접 복사할 원본 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);
      userSourcePeriodId = result.id;

      console.log(`✅ 사용자용 원본 평가기간 생성: ${result.id}`);
    });

    it('2단계: 사용자용 원본 평가기간에 데이터를 설정한다', async () => {
      // 직원 등록
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${userSourcePeriodId}/targets/bulk`)
        .send({
          employeeIds: [employeeIds[2]],
        })
        .expect(201);

      // 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[2],
        projectId: projectIds[2],
        periodId: userSourcePeriodId,
      });

      // 1차 평가자 구성
      await lineApiClient.configurePrimaryEvaluator({
        employeeId: employeeIds[2],
        periodId: userSourcePeriodId,
        evaluatorId: employeeIds[3],
      });

      console.log(
        `✅ 사용자용 원본 평가기간 데이터 설정 완료 (직원: ${employeeIds[2]})`,
      );
    });

    it('3단계: 사용자용 대상 평가기간을 생성한다', async () => {
      const today = new Date();
      const nineMonthsLater = new Date(today);
      nineMonthsLater.setMonth(today.getMonth() + 9);

      const createData = {
        name: '사용자용 대상 평가기간',
        startDate: nineMonthsLater.toISOString(),
        peerEvaluationDeadline: new Date(
          nineMonthsLater.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        description: '사용자가 데이터를 복사받을 평가기간',
        maxSelfEvaluationRate: 150,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);
      userTargetPeriodId = result.id;

      console.log(`✅ 사용자용 대상 평가기간 생성: ${result.id}`);
    });

    it('4단계: User API로 나의 이전 평가기간 데이터를 복사한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/user/evaluation-periods/${userTargetPeriodId}/copy-my-previous-data/${userSourcePeriodId}`,
        )
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.copiedProjectAssignments).toBeGreaterThanOrEqual(0);
      expect(response.body.copiedEvaluationLineMappings).toBeGreaterThanOrEqual(
        0,
      );

      console.log(
        `✅ User API로 이전 평가기간 데이터 복사 완료: 프로젝트 ${response.body.copiedProjectAssignments}개, 평가라인 ${response.body.copiedEvaluationLineMappings}개`,
      );
    });

    it('5단계: 나의 할당 정보 조회 API로 복사된 데이터를 확인한다', async () => {
      // 대상 평가기간의 할당 데이터 조회
      const result = await testSuite
        .request()
        .get(`/user/dashboard/${userTargetPeriodId}/my-assigned-data`)
        .expect(200);

      expect(result.body.employee).toBeDefined();
      expect(result.body.projects).toBeDefined();
      expect(Array.isArray(result.body.projects)).toBe(true);
      expect(result.body.summary).toBeDefined();
      expect(result.body.evaluationPeriod.id).toBe(userTargetPeriodId);

      console.log(
        `✅ User API로 나의 할당 정보 조회 성공: 프로젝트 ${result.body.summary?.totalProjects || 0}개`,
      );
    });

    // 정리
    afterAll(async () => {
      if (userTargetPeriodId) {
        try {
          await periodApiClient.deleteEvaluationPeriod(userTargetPeriodId);
        } catch (error) {
          console.log('사용자용 대상 평가기간 삭제 중 오류:', error.message);
        }
      }

      if (userSourcePeriodId) {
        try {
          await periodApiClient.deleteEvaluationPeriod(userSourcePeriodId);
        } catch (error) {
          console.log('사용자용 원본 평가기간 삭제 중 오류:', error.message);
        }
      }
    });
  });

  describe('선택적 필터링 기능 테스트', () => {
    let filterSourcePeriodId: string;
    let filterTargetPeriodId: string;

    beforeAll(() => {
      // 필터링 테스트용으로 직원 3을 현재 사용자로 설정
      if (employeeIds.length > 3) {
        testSuite.setCurrentUser({
          id: employeeIds[3],
          email: 'user3@example.com',
          name: '사용자3',
          employeeNumber: 'USER003',
          roles: ['admin'],
        });
        console.log(`🔐 필터링 테스트용 현재 사용자 설정: ${employeeIds[3]}`);
      }
    });

    it('1단계: 필터링 테스트용 원본 평가기간을 생성한다', async () => {
      const today = new Date();
      const twelveMonthsLater = new Date(today);
      twelveMonthsLater.setMonth(today.getMonth() + 12);

      const createData = {
        name: '필터링 테스트용 원본 평가기간',
        startDate: twelveMonthsLater.toISOString(),
        peerEvaluationDeadline: new Date(
          twelveMonthsLater.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        description: '선택적 복사를 테스트할 원본 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);
      filterSourcePeriodId = result.id;

      console.log(`✅ 필터링 테스트용 원본 평가기간 생성: ${result.id}`);
    });

    it('2단계: 여러 프로젝트와 WBS를 설정한다', async () => {
      // 직원 등록
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${filterSourcePeriodId}/targets/bulk`)
        .send({
          employeeIds: [employeeIds[3]],
        })
        .expect(201);

      // 프로젝트 3개 할당
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[3],
        projectId: projectIds[0],
        periodId: filterSourcePeriodId,
      });

      await projectAssignmentApiClient.create({
        employeeId: employeeIds[3],
        projectId: projectIds[1],
        periodId: filterSourcePeriodId,
      });

      await projectAssignmentApiClient.create({
        employeeId: employeeIds[3],
        projectId: projectIds[2],
        periodId: filterSourcePeriodId,
      });

      // 1차 평가자 구성
      await lineApiClient.configurePrimaryEvaluator({
        employeeId: employeeIds[3],
        periodId: filterSourcePeriodId,
        evaluatorId: employeeIds[4],
      });

      console.log(
        `✅ 필터링 테스트용 원본 평가기간 데이터 설정 완료: 프로젝트 3개`,
      );
    });

    it('3단계: 필터링 테스트용 대상 평가기간을 생성한다', async () => {
      const today = new Date();
      const fifteenMonthsLater = new Date(today);
      fifteenMonthsLater.setMonth(today.getMonth() + 15);

      const createData = {
        name: '필터링 테스트용 대상 평가기간',
        startDate: fifteenMonthsLater.toISOString(),
        peerEvaluationDeadline: new Date(
          fifteenMonthsLater.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        description: '선택적으로 데이터를 복사받을 평가기간',
        maxSelfEvaluationRate: 150,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);
      filterTargetPeriodId = result.id;

      console.log(`✅ 필터링 테스트용 대상 평가기간 생성: ${result.id}`);
    });

    it('4단계: 특정 프로젝트만 선택하여 복사한다', async () => {
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${filterTargetPeriodId}/employees/${employeeIds[3]}/copy-from/${filterSourcePeriodId}`,
        )
        .send({
          projects: [
            { projectId: projectIds[0] }, // 프로젝트 1 전체 WBS
            { projectId: projectIds[1] }, // 프로젝트 2 전체 WBS
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.copiedProjectAssignments).toBe(2);

      console.log(
        `✅ 선택적 프로젝트 복사 완료: ${response.body.copiedProjectAssignments}개`,
      );
    });

    it('5단계: 복사된 프로젝트가 선택한 것만 있는지 확인한다', async () => {
      const result = await dashboardApiClient.getEmployeeAssignedData({
        periodId: filterTargetPeriodId,
        employeeId: employeeIds[3],
      });

      expect(result.summary.totalProjects).toBe(2);
      expect(result.projects.length).toBe(2);

      const copiedProjectIds = result.projects.map((p: any) => p.projectId);
      expect(copiedProjectIds).toContain(projectIds[0]);
      expect(copiedProjectIds).toContain(projectIds[1]);
      expect(copiedProjectIds).not.toContain(projectIds[2]);

      console.log(
        `✅ 선택적 복사 검증 성공: 프로젝트 2개만 복사됨 (${projectIds[0]}, ${projectIds[1]})`,
      );
    });

    it('6단계: 프로젝트별 특정 WBS만 선택하여 복사한다', async () => {
      // 새로운 대상 평가기간 생성 (WBS 필터링 테스트용)
      const today = new Date();
      const eighteenMonthsLater = new Date(today);
      eighteenMonthsLater.setMonth(today.getMonth() + 18);

      const createData = {
        name: 'WBS 필터링 테스트용 평가기간',
        startDate: eighteenMonthsLater.toISOString(),
        peerEvaluationDeadline: new Date(
          eighteenMonthsLater.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        description: 'WBS 필터링 테스트',
        maxSelfEvaluationRate: 150,
      };

      const periodResult =
        await periodApiClient.createEvaluationPeriod(createData);
      const wbsFilterTargetPeriodId = periodResult.id;

      // 프로젝트 0의 첫 번째 WBS만 복사
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-periods/${wbsFilterTargetPeriodId}/employees/${employeeIds[3]}/copy-from/${filterSourcePeriodId}`,
        )
        .send({
          projects: [
            {
              projectId: projectIds[0],
              wbsIds: [wbsItemIds[0]], // 프로젝트 0의 첫 번째 WBS만
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.copiedProjectAssignments).toBe(1);

      console.log(`✅ WBS 필터링 복사 완료: 프로젝트 1개, WBS 필터 적용`);

      // 정리
      try {
        await periodApiClient.deleteEvaluationPeriod(wbsFilterTargetPeriodId);
      } catch (error) {
        console.log(
          'WBS 필터링 테스트용 평가기간 삭제 중 오류:',
          error.message,
        );
      }
    });

    // 정리
    afterAll(async () => {
      if (filterTargetPeriodId) {
        try {
          await periodApiClient.deleteEvaluationPeriod(filterTargetPeriodId);
        } catch (error) {
          console.log(
            '필터링 테스트용 대상 평가기간 삭제 중 오류:',
            error.message,
          );
        }
      }

      if (filterSourcePeriodId) {
        try {
          await periodApiClient.deleteEvaluationPeriod(filterSourcePeriodId);
        } catch (error) {
          console.log(
            '필터링 테스트용 원본 평가기간 삭제 중 오류:',
            error.message,
          );
        }
      }
    });
  });
});
