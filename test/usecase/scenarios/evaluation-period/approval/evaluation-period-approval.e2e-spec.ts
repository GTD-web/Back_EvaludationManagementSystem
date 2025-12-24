import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기간 결재 시스템 E2E 테스트
 *
 * 시나리오:
 * 1. 평가기간 생성
 * 2. 결재 문서 ID 설정 (approvalStatus: none → pending)
 * 3. approvalStatus 확인
 * 4. 다시 결재 문서 ID 설정 (덮어쓰기)
 */
describe('평가기간 결재 시스템 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let apiClient: EvaluationPeriodManagementApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);

    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 3,
    });

    employeeIds = seedResult.employeeIds || [];
    console.log(`📝 시드 데이터 생성 완료: 직원 ${employeeIds.length}명`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        await apiClient.deleteEvaluationPeriod(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 삭제 중 오류 (이미 삭제됨):', error.message);
      }
    }

    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('결재 문서 ID 설정 및 상태 변경', () => {
    it('평가기간을 생성하고 초기 approvalStatus가 "none"인지 확인한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '결재 테스트 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '결재 시스템 E2E 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S+', minRange: 95, maxRange: 100 },
          { grade: 'S', minRange: 90, maxRange: 94 },
          { grade: 'A+', minRange: 85, maxRange: 89 },
          { grade: 'A', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 70, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 69 },
        ],
      };

      const result = await apiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.approvalStatus).toBe('none'); // 초기 상태 확인
      expect(result.approvalDocumentId).toBeNull(); // 초기에는 결재문서ID 없음 (null)

      evaluationPeriodId = result.id;
      console.log(`✅ 평가기간 생성 완료: ${result.name} (${result.id})`);
      console.log(`   - 초기 approvalStatus: ${result.approvalStatus}`);
    });

    it('결재 문서 ID를 설정하면 approvalStatus가 "pending"으로 변경된다', async () => {
      const approvalDocumentId = '123e4567-e89b-12d3-a456-426614174000';

      const result = await apiClient.setApprovalDocumentId(
        evaluationPeriodId,
        approvalDocumentId,
      );

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.approvalDocumentId).toBe(approvalDocumentId);
      expect(result.approvalStatus).toBe('pending'); // none → pending

      console.log(`✅ 결재 문서 ID 설정 완료:`);
      console.log(`   - approvalDocumentId: ${result.approvalDocumentId}`);
      console.log(`   - approvalStatus: none → ${result.approvalStatus}`);
    });

    it('평가기간 상세 조회 시 approvalStatus와 approvalDocumentId가 유지된다', async () => {
      const result =
        await apiClient.getEvaluationPeriodDetail(evaluationPeriodId);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.approvalDocumentId).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result.approvalStatus).toBe('pending');

      console.log(`✅ 상세 조회 확인:`);
      console.log(`   - approvalDocumentId: ${result.approvalDocumentId}`);
      console.log(`   - approvalStatus: ${result.approvalStatus}`);
    });

    it('평가기간 목록 조회 시 approvalStatus가 포함된다', async () => {
      const result = await apiClient.getEvaluationPeriods({
        page: 1,
        limit: 10,
      });

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);

      const period = result.items.find((p: any) => p.id === evaluationPeriodId);
      expect(period).toBeDefined();
      expect(period.approvalStatus).toBe('pending');
      expect(period.approvalDocumentId).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      console.log(`✅ 목록 조회 확인:`);
      console.log(`   - 검색된 평가기간: ${period.name}`);
      console.log(`   - approvalStatus: ${period.approvalStatus}`);
    });

    it('결재 문서 ID를 다시 설정하면 덮어쓰기가 된다', async () => {
      const newApprovalDocumentId = 'aaaabbbb-cccc-dddd-eeee-111122223333';

      const result = await apiClient.setApprovalDocumentId(
        evaluationPeriodId,
        newApprovalDocumentId,
      );

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.approvalDocumentId).toBe(newApprovalDocumentId);
      expect(result.approvalStatus).toBe('pending'); // 여전히 pending

      console.log(`✅ 결재 문서 ID 덮어쓰기 완료:`);
      console.log(
        `   - 이전 approvalDocumentId: 123e4567-e89b-12d3-a456-426614174000`,
      );
      console.log(`   - 새 approvalDocumentId: ${result.approvalDocumentId}`);
      console.log(`   - approvalStatus: ${result.approvalStatus} (유지)`);
    });

    it('[에러 케이스] 존재하지 않는 평가기간에 결재 문서 ID를 설정하면 404 에러가 발생한다', async () => {
      const nonExistentPeriodId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const approvalDocumentId = '123e4567-e89b-12d3-a456-426614174000';

      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${nonExistentPeriodId}/approval-document`,
        )
        .send({ approvalDocumentId })
        .expect(404);

      console.log(`✅ 404 에러 케이스 확인: 존재하지 않는 평가기간`);
    });

    it('[에러 케이스] approvalDocumentId를 누락하면 400 에러가 발생한다', async () => {
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/approval-document`,
        )
        .send({}) // approvalDocumentId 누락
        .expect(400);

      console.log(`✅ 400 에러 케이스 확인: approvalDocumentId 누락`);
    });

    it('[에러 케이스] approvalDocumentId가 빈 문자열이면 400 에러가 발생한다', async () => {
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/approval-document`,
        )
        .send({ approvalDocumentId: '' }) // 빈 문자열
        .expect(400);

      console.log(`✅ 400 에러 케이스 확인: approvalDocumentId 빈 문자열`);
    });
  });

  describe('결재 상태 조회', () => {
    it('활성 평가기간 조회 시 approvalStatus가 포함된다', async () => {
      // 평가기간을 시작하여 활성 상태로 만들기
      await apiClient.startEvaluationPeriod(evaluationPeriodId);

      const result = await apiClient.getActiveEvaluationPeriods();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      const activePeriod = result.find((p: any) => p.id === evaluationPeriodId);
      expect(activePeriod).toBeDefined();
      expect(activePeriod.approvalStatus).toBe('pending');
      expect(activePeriod.approvalDocumentId).toBeDefined();

      console.log(`✅ 활성 평가기간 조회 확인:`);
      console.log(`   - 활성 평가기간: ${activePeriod.name}`);
      console.log(`   - approvalStatus: ${activePeriod.approvalStatus}`);
      console.log(`   - status: ${activePeriod.status}`);
    });
  });
});
