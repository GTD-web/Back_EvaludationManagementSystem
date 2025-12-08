import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import { EvaluationLineApiClient } from '../../api-clients/evaluation-line.api-client';
import { WbsEvaluationCriteriaApiClient } from '../../api-clients/wbs-evaluation-criteria.api-client';

/**
 * 평가기간 복사 E2E 테스트
 *
 * 시나리오:
 * - 원본 평가기간 생성
 * - 원본 평가기간에 평가라인 매핑 추가
 * - 원본 평가기간에 WBS 평가 기준 추가
 * - sourcePeriodId를 포함하여 새 평가기간 생성
 * - 새 평가기간에 평가라인 매핑이 복사되었는지 확인
 * - 새 평가기간에 WBS 평가 기준이 복사되었는지 확인
 */
describe('평가기간 복사 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let periodApiClient: EvaluationPeriodManagementApiClient;
  let lineApiClient: EvaluationLineApiClient;
  let criteriaApiClient: WbsEvaluationCriteriaApiClient;

  let sourcePeriodId: string;
  let targetPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let evaluationLineIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    periodApiClient = new EvaluationPeriodManagementApiClient(testSuite);
    lineApiClient = new EvaluationLineApiClient(testSuite);
    criteriaApiClient = new WbsEvaluationCriteriaApiClient(testSuite);

    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

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

  describe('평가기간 복사 기능 테스트', () => {
    it('1단계: 원본 평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '원본 평가기간 (복사용)',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가항목과 평가라인이 설정된 원본 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');

      sourcePeriodId = result.id;
      console.log(`✅ 원본 평가기간 생성 완료: ${result.id}`);
    });

    it('2단계: 원본 평가기간에 1차 평가자를 구성한다', async () => {
      // 평가자(employeeIds[0])가 피평가자(employeeIds[1])를 평가하도록 설정
      const result = await lineApiClient.configurePrimaryEvaluator({
        employeeId: employeeIds[1], // 피평가자
        periodId: sourcePeriodId,
        evaluatorId: employeeIds[0], // 평가자
      });

      expect(result).toBeDefined();
      console.log(
        `✅ 1차 평가자 구성 완료: 평가자=${employeeIds[0]}, 피평가자=${employeeIds[1]}`,
      );
    });

    it('3단계: 원본 평가기간의 WBS에 평가 기준을 추가한다', async () => {
      const criteriaData = {
        wbsItemId: wbsItemIds[0],
        criteria: '업무 완성도 및 품질',
        importance: 5,
      };

      const result =
        await criteriaApiClient.upsertWbsEvaluationCriteria(criteriaData);

      expect(result.id).toBeDefined();
      expect(result.wbsItemId).toBe(wbsItemIds[0]);
      expect(result.criteria).toBe(criteriaData.criteria);
      expect(result.importance).toBe(5);

      console.log(
        `✅ WBS 평가 기준 추가 완료: WBS=${wbsItemIds[0]}, 기준="${criteriaData.criteria}"`,
      );
    });

    it('3-1단계: WBS 기반 평가라인 매핑을 추가한다 (2차 평가자)', async () => {
      // WBS 기반 평가라인 매핑 생성 (평가 기준을 복사하기 위해 필요)
      const result = await lineApiClient.configureSecondaryEvaluator({
        employeeId: employeeIds[1], // 피평가자
        wbsItemId: wbsItemIds[0], // WBS 항목
        periodId: sourcePeriodId,
        evaluatorId: employeeIds[0], // 평가자
      });

      expect(result).toBeDefined();
      console.log(`✅ WBS 기반 평가라인 매핑 추가 완료: WBS=${wbsItemIds[0]}`);
    });

    it('4단계: sourcePeriodId를 포함하여 새 평가기간을 생성한다 (복사)', async () => {
      const today = new Date();
      // 원본 평가기간과 겹치지 않도록 3개월 후 시작
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(today.getMonth() + 3);
      const fiveMonthsLater = new Date(today);
      fiveMonthsLater.setMonth(today.getMonth() + 5);

      const createData = {
        name: '복사된 평가기간',
        startDate: threeMonthsLater.toISOString(),
        peerEvaluationDeadline: fiveMonthsLater.toISOString(),
        description: '원본에서 복사된 평가기간',
        maxSelfEvaluationRate: 150,
        sourcePeriodId: sourcePeriodId, // 원본 평가기간 ID
      };

      const result = await periodApiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');

      targetPeriodId = result.id;
      console.log(`✅ 새 평가기간 생성 완료 (복사): ${result.id}`);
    });

    it('5단계: 새 평가기간에 평가라인 매핑이 복사되었는지 확인한다', async () => {
      // 원본 평가기간의 평가설정 조회
      const sourceSettings = await lineApiClient.getEmployeeEvaluationSettings({
        employeeId: employeeIds[1],
        periodId: sourcePeriodId,
      });

      expect(sourceSettings.evaluationLineMappings).toBeDefined();
      expect(sourceSettings.evaluationLineMappings.length).toBeGreaterThan(0);
      const sourceMappingCount = sourceSettings.evaluationLineMappings.length;
      console.log(`원본 평가기간 평가라인 매핑: ${sourceMappingCount}개`);

      // 새 평가기간의 평가설정 조회
      const targetSettings = await lineApiClient.getEmployeeEvaluationSettings({
        employeeId: employeeIds[1],
        periodId: targetPeriodId,
      });

      // 평가라인 매핑이 복사되었는지 확인
      expect(targetSettings.evaluationLineMappings).toBeDefined();
      expect(targetSettings.evaluationLineMappings.length).toBe(
        sourceMappingCount,
      );

      // 평가자가 동일한지 확인
      const sourceEvaluatorIds = sourceSettings.evaluationLineMappings.map(
        (m: any) => m.evaluatorId,
      );
      const targetEvaluatorIds = targetSettings.evaluationLineMappings.map(
        (m: any) => m.evaluatorId,
      );

      expect(targetEvaluatorIds).toEqual(
        expect.arrayContaining(sourceEvaluatorIds),
      );

      console.log(
        `✅ 평가라인 매핑 복사 확인: ${targetSettings.evaluationLineMappings.length}개 매핑`,
      );
    });

    it('6단계: 새 평가기간에서 WBS 평가 기준에 접근할 수 있는지 확인한다', async () => {
      // 원본 WBS의 평가 기준 조회
      const response = await criteriaApiClient.getWbsItemEvaluationCriteria(
        wbsItemIds[0],
      );

      expect(response.criteria).toBeDefined();
      expect(response.criteria.length).toBeGreaterThan(0);

      console.log(
        `WBS ${wbsItemIds[0]}의 평가 기준 개수: ${response.criteria.length}개`,
      );
      console.log(
        `평가 기준: "${response.criteria[0].criteria}" (중요도: ${response.criteria[0].importance})`,
      );

      // WBS 평가 기준은 WBS 항목당 하나만 존재하므로 (평가기간과 무관)
      // 새 평가기간에서도 동일한 평가 기준에 접근 가능
      expect(response.criteria[0].criteria).toBe('업무 완성도 및 품질');
      expect(response.criteria[0].importance).toBe(5);

      console.log(
        `✅ WBS 평가 기준 확인 완료: "${response.criteria[0].criteria}" (importance: ${response.criteria[0].importance})`,
      );
    });

    it('7단계: 복제용 데이터 조회 API로 확인한다', async () => {
      const copyData =
        await periodApiClient.getEvaluationPeriodForCopy(sourcePeriodId);

      expect(copyData.evaluationPeriod).toBeDefined();
      expect(copyData.evaluationPeriod.id).toBe(sourcePeriodId);
      expect(copyData.evaluationCriteria).toBeDefined();
      expect(copyData.evaluationLines).toBeDefined();
      expect(copyData.evaluationLines.lines).toBeDefined();
      expect(copyData.evaluationLines.mappings).toBeDefined();

      // 평가항목과 평가라인이 있는지 확인
      expect(copyData.evaluationCriteria.length).toBeGreaterThan(0);
      expect(copyData.evaluationLines.mappings.length).toBeGreaterThan(0);

      console.log(
        `✅ 복제용 데이터 조회 완료: 평가항목 ${copyData.evaluationCriteria.length}개, 평가라인 매핑 ${copyData.evaluationLines.mappings.length}개`,
      );
    });
  });
});
