import { BaseE2ETest } from '../../../base-e2e.spec';
import { StepApprovalScenario } from './step-approval.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsSelfEvaluationScenario } from '../performance-evaluation/wbs-self-evaluation/wbs-self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../performance-evaluation/downward-evaluation/downward-evaluation.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 단계 승인 관리 E2E 테스트
 *
 * 단계별 승인 상태 변경 및 승인 시 제출 상태 자동 변경을 검증합니다.
 */
describe('단계 승인 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let stepApprovalScenario: StepApprovalScenario;
  let seedDataScenario: SeedDataScenario;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  // ANSI 이스케이프 코드를 제거하는 헬퍼 함수
  function stripAnsiCodes(str: string): string {
    if (!str) return str;
    // ANSI 이스케이프 시퀀스 제거 (예: \u001b[2m, \u001b[31m 등)
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    // 에러 메시지 추출
    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    // ANSI 코드 제거
    message = stripAnsiCodes(message);

    // 스택 트레이스가 있으면 추가 (ANSI 코드 제거)
    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
      // 메시지와 스택이 다르면 스택 추가
      if (stack && !stack.includes(message)) {
        message = `${message}\n\nStack:\n${stack}`;
      }
    }

    return message;
  }

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    stepApprovalScenario = new StepApprovalScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(__dirname, 'step-approval-test-result.json');
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
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

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '단계 승인 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '단계 승인 E2E 테스트용 평가기간',
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

    const evaluationPeriod =
      await evaluationPeriodScenario.평가기간을_생성한다(createData);
    evaluationPeriodId = evaluationPeriod.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );

    // 초기 구성 데이터 생성 (프로젝트 할당, WBS 할당, 평가라인 구성)
    await stepApprovalScenario.초기_구성_데이터를_생성한다({
      evaluationPeriodId,
      employeeId: employeeIds[0], // 피평가자
      projectId: projectIds[0],
      wbsItemId: wbsItemIds[0],
      primaryEvaluatorId: employeeIds[1], // 1차 평가자
    });

    // 평가라인 조회하여 실제 평가자 설정
    const evaluationLineResponse = await testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeIds[0]}/period/${evaluationPeriodId}/settings`,
      )
      .expect(200);

    // 1차 평가자 조회 (wbsItemId가 null인 매핑)
    let primaryMapping =
      evaluationLineResponse.body.evaluationLineMappings?.find(
        (line: any) => line.wbsItemId === null,
      );

    // 1차 평가자 매핑이 없으면 wbsItemId가 있는 매핑 중 첫 번째를 사용 (임시)
    if (
      !primaryMapping &&
      evaluationLineResponse.body.evaluationLineMappings?.length > 0
    ) {
      primaryMapping = evaluationLineResponse.body.evaluationLineMappings[0];
    }

    if (primaryMapping) {
      primaryEvaluatorId = primaryMapping.evaluatorId;
    } else {
      // 평가라인이 없으면 기본값 사용
      primaryEvaluatorId = employeeIds[1];
    }

    // 2차 평가자 조회 (wbsItemId가 있는 매핑 중 첫 번째)
    const secondaryMapping =
      evaluationLineResponse.body.evaluationLineMappings?.find(
        (line: any) => line.wbsItemId === wbsItemIds[0],
      );
    if (secondaryMapping) {
      secondaryEvaluatorId = secondaryMapping.evaluatorId;
    } else {
      // 평가라인이 없으면 기본값 사용
      secondaryEvaluatorId = employeeIds[2];
    }
  });

  describe('단계 승인 기본 관리', () => {
    describe('평가기준 설정 단계 승인 상태 변경', () => {
      it('평가기준 설정을 pending에서 approved로 변경한다', async () => {
        let statusData: any;
        let error: any;
        const testName = '평가기준 설정을 pending에서 approved로 변경한다';

        try {
          // Given - 평가기준 제출
          await stepApprovalScenario.평가기준을_제출한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

          // When - 평가기준 설정 단계 승인 상태를 approved로 변경
          await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'approved',
          });

          // Then - 대시보드 API로 승인 상태 확인
          statusData =
            await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(statusData).toBeDefined();
          expect(statusData.stepApproval).toBeDefined();
          expect(statusData.stepApproval.criteriaSettingStatus).toBe(
            'approved',
          );

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              criteriaSettingStatus:
                statusData.stepApproval.criteriaSettingStatus,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              criteriaSettingStatus:
                statusData?.stepApproval?.criteriaSettingStatus,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });

      it('평가기준 설정을 revision_requested로 변경하고 평가기준만 재작성 요청이 생성된다', async () => {
        let statusData: any;
        let 재작성요청목록: any;
        let error: any;
        const testName =
          '평가기준 설정을 revision_requested로 변경하고 평가기준만 재작성 요청이 생성된다';

        try {
          // Given - 평가기준 제출
          await stepApprovalScenario.평가기준을_제출한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

          // When - 평가기준 설정 단계 승인 상태를 revision_requested로 변경
          await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'revision_requested',
            revisionComment: '평가기준 재작성 요청 코멘트입니다.',
          });

          // Then - 대시보드 API로 승인 상태 확인
          statusData =
            await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(statusData.stepApproval.criteriaSettingStatus).toBe(
            'revision_requested',
          );

          // Then - 평가기준(criteria)에 대한 재작성 요청만 생성되었는지 확인
          재작성요청목록 = await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

          const 평가기준_재작성요청 = 재작성요청목록.find(
            (req: any) => req.step === 'criteria',
          );
          const 자기평가_재작성요청 = 재작성요청목록.find(
            (req: any) => req.step === 'self',
          );
          const 일차하향평가_재작성요청 = 재작성요청목록.find(
            (req: any) => req.step === 'primary',
          );
          const 이차하향평가_재작성요청 = 재작성요청목록.find(
            (req: any) => req.step === 'secondary',
          );

          // 평가기준 재작성 요청만 생성되어야 함
          expect(평가기준_재작성요청).toBeDefined();
          expect(평가기준_재작성요청.comment).toBe(
            '평가기준 재작성 요청 코멘트입니다.',
          );
          expect(평가기준_재작성요청.isCompleted).toBe(false);

          // 다른 단계의 재작성 요청은 생성되지 않아야 함
          expect(자기평가_재작성요청).toBeUndefined();
          expect(일차하향평가_재작성요청).toBeUndefined();
          expect(이차하향평가_재작성요청).toBeUndefined();

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              criteriaSettingStatus:
                statusData.stepApproval.criteriaSettingStatus,
              평가기준_재작성요청: 평가기준_재작성요청
                ? {
                    step: 평가기준_재작성요청.step,
                    comment: 평가기준_재작성요청.comment,
                    isCompleted: 평가기준_재작성요청.isCompleted,
                  }
                : null,
              자기평가_재작성요청: 자기평가_재작성요청 ? '생성됨' : '없음',
              일차하향평가_재작성요청: 일차하향평가_재작성요청
                ? '생성됨'
                : '없음',
              이차하향평가_재작성요청: 이차하향평가_재작성요청
                ? '생성됨'
                : '없음',
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              criteriaSettingStatus:
                statusData?.stepApproval?.criteriaSettingStatus,
              재작성요청목록: 재작성요청목록 ? 재작성요청목록.length : 0,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });
    });

    describe('단계 승인 Enum 목록 조회', () => {
      it('단계 승인 Enum 목록을 조회한다', async () => {
        let result: any;
        let error: any;
        const testName = '단계 승인 Enum 목록을 조회한다';

        try {
          // When
          result = await stepApprovalScenario.단계승인_Enum목록을_조회한다();

          // Then
          expect(result).toBeDefined();
          expect(result.steps).toBeDefined();
          expect(result.steps).toContain('criteria');
          expect(result.steps).toContain('self');
          expect(result.steps).toContain('primary');
          expect(result.steps).toContain('secondary');
          expect(result.statuses).toBeDefined();
          expect(result.statuses).toContain('pending');
          expect(result.statuses).toContain('approved');
          expect(result.statuses).toContain('revision_requested');
          expect(result.statuses).toContain('revision_completed');

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              steps: result.steps,
              statuses: result.statuses,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              steps: result?.steps,
              statuses: result?.statuses,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });
    });

    describe('자기평가 단계 승인 상태 변경', () => {
      it('자기평가를 pending에서 approved로 변경한다', async () => {
        let statusData: any;
        let error: any;
        const testName = '자기평가를 pending에서 approved로 변경한다';

        try {
          // When
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'approved',
          });

          // Then - 대시보드 API로 승인 상태 확인
          statusData =
            await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(statusData).toBeDefined();
          expect(statusData.stepApproval).toBeDefined();
          expect(statusData.stepApproval.selfEvaluationStatus).toBe('approved');

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              selfEvaluationStatus:
                statusData.stepApproval.selfEvaluationStatus,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              selfEvaluationStatus:
                statusData?.stepApproval?.selfEvaluationStatus,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });

      it('자기평가를 approved에서 revision_requested로 변경한다', async () => {
        let statusData: any;
        let 피평가자_재작성요청: any;
        let error: any;
        const testName =
          '자기평가를 approved에서 revision_requested로 변경한다';

        try {
          // Given - 자기평가 저장 및 제출
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

          await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            },
          );

          await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
              projectId: projectIds[0],
            },
          );

          // Given - 먼저 approved로 변경
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'approved',
          });

          // When - revision_requested로 변경
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'revision_requested',
            revisionComment: '재작성 요청 코멘트입니다.',
          });

          // Then
          statusData =
            await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(statusData.stepApproval.selfEvaluationStatus).toBe(
            'revision_requested',
          );

          // Then - 재작성 요청 생성 검증 (내 재작성 요청 목록 조회)
          // 피평가자로 현재 사용자 설정
          const 피평가자 = await testSuite
            .getRepository('Employee')
            .findOne({ where: { id: employeeIds[0] } });

          if (피평가자) {
            testSuite.setCurrentUser({
              id: 피평가자.id,
              email: 피평가자.email || 'test@example.com',
              name: 피평가자.name,
              employeeNumber: 피평가자.employeeNumber,
            });

            const 피평가자_재작성요청목록 =
              await stepApprovalScenario.내_재작성요청_목록을_조회한다({
                evaluationPeriodId,
                step: 'self',
              });

            피평가자_재작성요청 = 피평가자_재작성요청목록.find(
              (req: any) =>
                req.employee.id === employeeIds[0] &&
                req.step === 'self' &&
                req.evaluationPeriod.id === evaluationPeriodId,
            );

            expect(피평가자_재작성요청).toBeDefined();
            expect(피평가자_재작성요청.comment).toBe(
              '재작성 요청 코멘트입니다.',
            );
            expect(피평가자_재작성요청.isCompleted).toBe(false);
            expect(피평가자_재작성요청.isRead).toBe(false);
            expect(피평가자_재작성요청.step).toBe('self');
          }

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              selfEvaluationStatus:
                statusData.stepApproval.selfEvaluationStatus,
              revisionRequest: 피평가자_재작성요청
                ? {
                    requestId: 피평가자_재작성요청.requestId,
                    step: 피평가자_재작성요청.step,
                    comment: 피평가자_재작성요청.comment,
                    isCompleted: 피평가자_재작성요청.isCompleted,
                    isRead: 피평가자_재작성요청.isRead,
                  }
                : null,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              selfEvaluationStatus:
                statusData?.stepApproval?.selfEvaluationStatus,
              revisionRequest: 피평가자_재작성요청
                ? {
                    requestId: 피평가자_재작성요청.requestId,
                    step: 피평가자_재작성요청.step,
                    comment: 피평가자_재작성요청.comment,
                    isCompleted: 피평가자_재작성요청.isCompleted,
                    isRead: 피평가자_재작성요청.isRead,
                  }
                : null,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });
    });
  });

  describe('승인 시 제출 상태 자동 변경 검증', () => {
    describe('자기평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 자기평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        let 저장결과: any;
        let 승인전_자기평가: any;
        let 승인후_자기평가: any;
        let 대시보드_상태: any;
        let 할당데이터: any;
        let error: any;
        const testName =
          '제출하지 않은 자기평가를 승인하면 제출 상태가 자동으로 변경된다';

        try {
          // Given - 자기평가 저장 (제출하지 않음)
          저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

          // 승인 전 제출 상태 확인
          const 승인전_제출상태 =
            await stepApprovalScenario.자기평가_제출상태를_조회한다({
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            });

          승인전_자기평가 = 승인전_제출상태.evaluations.find(
            (e: any) => e.id === 저장결과.id,
          );
          expect(승인전_자기평가.submittedToEvaluator).toBe(false);
          expect(승인전_자기평가.submittedToManager).toBe(false);

          // When - 자기평가 단계 승인
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'approved',
          });

          // Then - 제출 상태 자동 변경 확인 (자기평가 목록 API)
          const 승인후_제출상태 =
            await stepApprovalScenario.자기평가_제출상태를_조회한다({
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            });

          승인후_자기평가 = 승인후_제출상태.evaluations.find(
            (e: any) => e.id === 저장결과.id,
          );
          expect(승인후_자기평가.submittedToEvaluator).toBe(true);
          expect(승인후_자기평가.submittedToManager).toBe(true);
          expect(승인후_자기평가.submittedToEvaluatorAt).toBeDefined();
          expect(승인후_자기평가.submittedToManagerAt).toBeDefined();

          // Then - 대시보드 API로 제출 상태 확인
          대시보드_상태 =
            await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(대시보드_상태.selfEvaluation.isSubmittedToEvaluator).toBe(
            true,
          );

          // Then - 할당 데이터 API로 제출 상태 확인
          할당데이터 =
            await stepApprovalScenario.자기평가_제출상태를_할당데이터에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
          expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
            true,
          );
          expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
            true,
          );

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과.id,
              beforeApproval: {
                submittedToEvaluator: 승인전_자기평가.submittedToEvaluator,
                submittedToManager: 승인전_자기평가.submittedToManager,
              },
              afterApproval: {
                submittedToEvaluator: 승인후_자기평가.submittedToEvaluator,
                submittedToManager: 승인후_자기평가.submittedToManager,
                submittedToEvaluatorAt: 승인후_자기평가.submittedToEvaluatorAt,
                submittedToManagerAt: 승인후_자기평가.submittedToManagerAt,
              },
              dashboardStatus: {
                isSubmittedToEvaluator:
                  대시보드_상태.selfEvaluation.isSubmittedToEvaluator,
              },
              assignedDataStatus: {
                isSubmittedToEvaluator:
                  할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
                isSubmittedToManager:
                  할당데이터.summary.selfEvaluation.isSubmittedToManager,
              },
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과?.id,
              beforeApproval: 승인전_자기평가
                ? {
                    submittedToEvaluator: 승인전_자기평가.submittedToEvaluator,
                    submittedToManager: 승인전_자기평가.submittedToManager,
                  }
                : null,
              afterApproval: 승인후_자기평가
                ? {
                    submittedToEvaluator: 승인후_자기평가.submittedToEvaluator,
                    submittedToManager: 승인후_자기평가.submittedToManager,
                  }
                : null,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });

      it('이미 제출된 자기평가를 승인해도 에러 없이 처리된다 (idempotent)', async () => {
        // Given - 자기평가 저장 및 제출
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          },
        );

        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

        await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
            projectId: projectIds[0],
          },
        );

        // When - 이미 제출된 상태에서 승인
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 제출 상태는 이미 true이므로 변경되지 않음
        const 제출상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 자기평가 = 제출상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        expect(자기평가.submittedToEvaluator).toBe(true);
        expect(자기평가.submittedToManager).toBe(true);
      });
    });

    describe('1차 하향평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 1차 하향평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // Given - 1차 하향평가 저장 (제출하지 않음)
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // 승인 전 제출 상태 확인
        const 승인전_제출상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_조회한다({
            evaluatorId: primaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인전_하향평가 = 승인전_제출상태.evaluations?.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인전_하향평가).toBeDefined();
        expect(승인전_하향평가.isCompleted).toBe(false);

        // When - 1차 하향평가 단계 승인
        await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 제출 상태 자동 변경 확인
        const 승인후_제출상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_조회한다({
            evaluatorId: primaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인후_하향평가 = 승인후_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인후_하향평가.isCompleted).toBe(true);
        expect(승인후_하향평가.completedAt).toBeDefined();

        // Then - 대시보드 API로 제출 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(대시보드_상태.downwardEvaluation.primary.isSubmitted).toBe(true);

        // Then - 할당 데이터 API로 제출 상태 확인
        const 할당데이터 =
          await stepApprovalScenario.일차하향평가_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        const wbs = 할당데이터.projects[0].wbsList.find(
          (w: any) => w.wbsId === wbsItemIds[0],
        );
        expect(wbs.primaryDownwardEvaluation.isCompleted).toBe(true);

        // Then - 통합 조회 API로 제출 상태 확인
        const 통합조회 =
          await stepApprovalScenario.일차하향평가_제출상태를_통합조회에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(통합조회.primaryDownwardEvaluation.isSubmitted).toBe(true);
      });
    });

    describe('2차 하향평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 2차 하향평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // Given - 2차 하향평가 저장 (제출하지 않음)
        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // 승인 전 제출 상태 확인
        const 승인전_제출상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_조회한다({
            evaluatorId: secondaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인전_하향평가 = 승인전_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인전_하향평가).toBeDefined();
        expect(승인전_하향평가.isCompleted).toBe(false);

        // When - 2차 하향평가 단계 승인
        await stepApprovalScenario.이차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          evaluatorId: secondaryEvaluatorId,
          status: 'approved',
        });

        // Then - 제출 상태 자동 변경 확인
        const 승인후_제출상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_조회한다({
            evaluatorId: secondaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인후_하향평가 = 승인후_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인후_하향평가.isCompleted).toBe(true);
        expect(승인후_하향평가.completedAt).toBeDefined();

        // Then - 대시보드 API로 제출 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        const secondaryEvaluator =
          대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        expect(secondaryEvaluator.isSubmitted).toBe(true);
      });
    });
  });

  describe('재작성 요청 생성 시 제출 상태 초기화 검증', () => {
    describe('자기평가 재작성 요청 생성 시 제출 상태 초기화', () => {
      it('제출된 자기평가에 재작성 요청을 생성하면 제출 상태가 초기화된다', async () => {
        let 저장결과: any;
        let 제출전_자기평가: any;
        let 제출후_자기평가: any;
        let 할당데이터: any;
        let 피평가자_재작성요청: any;
        let error: any;
        const testName =
          '제출된 자기평가에 재작성 요청을 생성하면 제출 상태가 초기화된다';

        try {
          // Given - 자기평가 저장 및 제출
          저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

          await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            },
          );

          await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
              projectId: projectIds[0],
            },
          );

          // 제출 상태 확인
          const 제출전_상태 =
            await stepApprovalScenario.자기평가_제출상태를_조회한다({
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            });

          제출전_자기평가 = 제출전_상태.evaluations.find(
            (e: any) => e.id === 저장결과.id,
          );
          expect(제출전_자기평가.submittedToManager).toBe(true);

          // When - 재작성 요청 생성
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'revision_requested',
            revisionComment: '재작성 요청 코멘트입니다.',
          });

          // Then - 제출 상태 초기화 확인
          const 제출후_상태 =
            await stepApprovalScenario.자기평가_제출상태를_조회한다({
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            });

          제출후_자기평가 = 제출후_상태.evaluations.find(
            (e: any) => e.id === 저장결과.id,
          );
          expect(제출후_자기평가.submittedToManager).toBe(false);
          expect(제출후_자기평가.submittedToManagerAt).toBeNull();
          // 재작성 요청 생성 시 submittedToEvaluator도 초기화됨
          expect(제출후_자기평가.submittedToEvaluator).toBe(false);

          // Then - 할당 데이터 API로 제출 상태 확인
          할당데이터 =
            await stepApprovalScenario.자기평가_제출상태를_할당데이터에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
          expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
            false,
          );
          // 재작성 요청 생성 시 submittedToEvaluator도 초기화됨
          expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
            false,
          );

          // Then - 재작성 요청 생성 검증 (내 재작성 요청 목록 조회)
          // 피평가자로 현재 사용자 설정
          const 피평가자 = await testSuite
            .getRepository('Employee')
            .findOne({ where: { id: employeeIds[0] } });

          if (피평가자) {
            testSuite.setCurrentUser({
              id: 피평가자.id,
              email: 피평가자.email || 'test@example.com',
              name: 피평가자.name,
              employeeNumber: 피평가자.employeeNumber,
            });

            const 피평가자_재작성요청목록 =
              await stepApprovalScenario.내_재작성요청_목록을_조회한다({
                evaluationPeriodId,
                step: 'self',
              });

            피평가자_재작성요청 = 피평가자_재작성요청목록.find(
              (req: any) =>
                req.employee.id === employeeIds[0] &&
                req.step === 'self' &&
                req.evaluationPeriod.id === evaluationPeriodId,
            );

            expect(피평가자_재작성요청).toBeDefined();
            expect(피평가자_재작성요청.comment).toBe(
              '재작성 요청 코멘트입니다.',
            );
            expect(피평가자_재작성요청.isCompleted).toBe(false);
            expect(피평가자_재작성요청.isRead).toBe(false);
            expect(피평가자_재작성요청.step).toBe('self');
          }

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과.id,
              beforeRevisionRequest: {
                submittedToManager: 제출전_자기평가.submittedToManager,
                submittedToManagerAt: 제출전_자기평가.submittedToManagerAt,
              },
              afterRevisionRequest: {
                submittedToManager: 제출후_자기평가.submittedToManager,
                submittedToManagerAt: 제출후_자기평가.submittedToManagerAt,
                submittedToEvaluator: 제출후_자기평가.submittedToEvaluator,
              },
              assignedDataStatus: {
                isSubmittedToManager:
                  할당데이터.summary.selfEvaluation.isSubmittedToManager,
                isSubmittedToEvaluator:
                  할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
              },
              revisionRequest: 피평가자_재작성요청
                ? {
                    requestId: 피평가자_재작성요청.requestId,
                    step: 피평가자_재작성요청.step,
                    comment: 피평가자_재작성요청.comment,
                    isCompleted: 피평가자_재작성요청.isCompleted,
                    isRead: 피평가자_재작성요청.isRead,
                  }
                : null,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과?.id,
              beforeRevisionRequest: 제출전_자기평가
                ? {
                    submittedToManager: 제출전_자기평가.submittedToManager,
                    submittedToManagerAt: 제출전_자기평가.submittedToManagerAt,
                  }
                : null,
              afterRevisionRequest: 제출후_자기평가
                ? {
                    submittedToManager: 제출후_자기평가.submittedToManager,
                    submittedToManagerAt: 제출후_자기평가.submittedToManagerAt,
                    submittedToEvaluator: 제출후_자기평가.submittedToEvaluator,
                  }
                : null,
              revisionRequest: 피평가자_재작성요청
                ? {
                    requestId: 피평가자_재작성요청.requestId,
                    step: 피평가자_재작성요청.step,
                    comment: 피평가자_재작성요청.comment,
                    isCompleted: 피평가자_재작성요청.isCompleted,
                    isRead: 피평가자_재작성요청.isRead,
                  }
                : null,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });
    });

    describe('재작성 완료 응답 제출 시 완료 및 읽음 처리 검증', () => {
      it('재작성 완료 응답 제출 시 isCompleted와 isRead가 true로 설정된다', async () => {
        let 저장결과: any;
        let 재작성요청_제출전: any;
        let 재작성요청_제출후: any;
        let error: any;
        const testName =
          '재작성 완료 응답 제출 시 isCompleted와 isRead가 true로 설정된다';

        try {
          // Given - 자기평가 저장 및 제출
          저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

          await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
            },
          );

          await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
            {
              employeeId: employeeIds[0],
              periodId: evaluationPeriodId,
              projectId: projectIds[0],
            },
          );

          // Given - 재작성 요청 생성
          await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'revision_requested',
            revisionComment: '재작성 요청 코멘트입니다.',
          });

          // Given - 재작성 요청 조회 (제출 전 상태 확인)
          const 피평가자 = await testSuite
            .getRepository('Employee')
            .findOne({ where: { id: employeeIds[0] } });

          if (!피평가자) {
            throw new Error('피평가자를 찾을 수 없습니다.');
          }

          testSuite.setCurrentUser({
            id: 피평가자.id,
            email: 피평가자.email || 'test@example.com',
            name: 피평가자.name,
            employeeNumber: 피평가자.employeeNumber,
          });

          const 재작성요청목록_제출전 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'self',
            });

          재작성요청_제출전 = 재작성요청목록_제출전.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'self' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출전).toBeDefined();
          expect(재작성요청_제출전.isCompleted).toBe(false);
          expect(재작성요청_제출전.isRead).toBe(false);

          // When - 재작성 완료 응답 제출
          await stepApprovalScenario.재작성완료_응답을_제출한다({
            requestId: 재작성요청_제출전.id || 재작성요청_제출전.requestId,
            responseComment: '재작성 완료 응답 코멘트입니다.',
          });

          // Then - 재작성 요청 조회 (제출 후 상태 확인)
          const 재작성요청목록_제출후 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'self',
            });

          재작성요청_제출후 = 재작성요청목록_제출후.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'self' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출후).toBeDefined();
          // 제출 후 isCompleted와 isRead가 true로 설정되어야 함
          expect(재작성요청_제출후.isCompleted).toBe(true);
          expect(재작성요청_제출후.isRead).toBe(true);
          expect(재작성요청_제출후.completedAt).toBeDefined();
          expect(재작성요청_제출후.readAt).toBeDefined();
          expect(재작성요청_제출후.responseComment).toBe(
            '재작성 완료 응답 코멘트입니다.',
          );

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과.id,
              beforeComplete: {
                isCompleted: 재작성요청_제출전.isCompleted,
                isRead: 재작성요청_제출전.isRead,
              },
              afterComplete: {
                isCompleted: 재작성요청_제출후.isCompleted,
                isRead: 재작성요청_제출후.isRead,
                completedAt: 재작성요청_제출후.completedAt,
                readAt: 재작성요청_제출후.readAt,
                responseComment: 재작성요청_제출후.responseComment,
              },
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          // 테스트 결과 저장 (실패)
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluationId: 저장결과?.id,
              beforeComplete: 재작성요청_제출전
                ? {
                    isCompleted: 재작성요청_제출전.isCompleted,
                    isRead: 재작성요청_제출전.isRead,
                  }
                : null,
              afterComplete: 재작성요청_제출후
                ? {
                    isCompleted: 재작성요청_제출후.isCompleted,
                    isRead: 재작성요청_제출후.isRead,
                    completedAt: 재작성요청_제출후.completedAt,
                    readAt: 재작성요청_제출후.readAt,
                    responseComment: 재작성요청_제출후.responseComment,
                  }
                : null,
              passed: false,
              error: extractErrorMessage(error),
            },
          });
          throw e;
        }
      });
    });
  });

  describe('엣지 케이스 검증', () => {
    describe('재작성 요청 코멘트 누락', () => {
      it('revision_requested 상태인데 revisionComment를 누락하면 400 에러가 발생한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${evaluationPeriodId}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'revision_requested',
            // revisionComment 누락
          })
          .expect(400);
      });

      it('revisionComment가 빈 문자열이면 400 에러가 발생한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${evaluationPeriodId}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'revision_requested',
            revisionComment: '', // 빈 문자열
          })
          .expect(400);
      });
    });

    describe('존재하지 않는 리소스', () => {
      it('존재하지 않는 평가기간-직원 조합으로 요청하면 404 에러가 발생한다', async () => {
        // Given - 존재하지 않는 평가기간 ID
        const 존재하지않는_평가기간ID = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${존재하지않는_평가기간ID}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'approved',
          })
          .expect(404);
      });
    });
  });

  describe('하향평가 일괄 제출 시 재작성 요청 완료 처리 검증', () => {
    describe('1차 하향평가 일괄 제출 시 재작성 요청 완료 처리', () => {
      it('1차 하향평가 일괄 제출 시 재작성 요청이 자동으로 완료 처리된다', async () => {
        const testName =
          '1차 하향평가 일괄 제출 시 재작성 요청이 자동으로 완료 처리된다';
        let error: any = null;

        try {
          // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
          const 자기평가결과 =
            await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
              employeeId: employeeIds[0],
              wbsItemId: wbsItemIds[0],
              periodId: evaluationPeriodId,
              selfEvaluationContent: '자기평가 내용',
              selfEvaluationScore: 85,
            });

          // Given - 1차 하향평가 저장 (제출하지 않음)
          await downwardEvaluationScenario.일차하향평가를_저장한다({
            evaluateeId: employeeIds[0],
            periodId: evaluationPeriodId,
            wbsId: wbsItemIds[0],
            evaluatorId: primaryEvaluatorId,
            selfEvaluationId: 자기평가결과.id,
            downwardEvaluationContent: '1차 하향평가 내용',
            downwardEvaluationScore: 90,
          });

          // Given - 1차 하향평가 단계 재작성 요청 생성
          await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            status: 'revision_requested',
            revisionComment: '1차 하향평가 재작성 필요',
          });

          // Given - 재작성 요청 생성 검증
          // 1차 평가자로 현재 사용자 설정
          const 일차평가자 = await testSuite
            .getRepository('Employee')
            .findOne({ where: { id: primaryEvaluatorId } });

          if (!일차평가자) {
            throw new Error('1차 평가자를 찾을 수 없습니다.');
          }

          testSuite.setCurrentUser({
            id: 일차평가자.id,
            email: 일차평가자.email || 'test@example.com',
            name: 일차평가자.name,
            employeeNumber: 일차평가자.employeeNumber,
          });

          const 재작성요청목록_제출전 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'primary',
            });

          const 재작성요청_제출전 = 재작성요청목록_제출전.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'primary' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출전).toBeDefined();
          expect(재작성요청_제출전.isCompleted).toBe(false);

          // When - 1차 하향평가 일괄 제출
          const 일괄제출결과 =
            await downwardEvaluationScenario.피평가자의_모든_하향평가를_일괄_제출한다(
              {
                evaluateeId: employeeIds[0],
                periodId: evaluationPeriodId,
                evaluatorId: primaryEvaluatorId,
                evaluationType: 'primary',
              },
            );

          expect(일괄제출결과.submittedCount).toBeGreaterThanOrEqual(0);

          // Then - 재작성 요청 자동 완료 검증
          // 1차 평가자로 현재 사용자 재설정 (일괄 제출 후에도 평가자로 조회)
          testSuite.setCurrentUser({
            id: 일차평가자.id,
            email: 일차평가자.email || 'test@example.com',
            name: 일차평가자.name,
            employeeNumber: 일차평가자.employeeNumber,
          });

          const 재작성요청목록_제출후 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'primary',
            });

          const 재작성요청_제출후 = 재작성요청목록_제출후.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'primary' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출후).toBeDefined();
          expect(재작성요청_제출후.isCompleted).toBe(true);
          expect(재작성요청_제출후.completedAt).toBeDefined();
          expect(재작성요청_제출후.responseComment).toBeDefined();
          expect(재작성요청_제출후.responseComment).toContain(
            '1차 하향평가 일괄 제출로 인한 재작성 완료 처리',
          );

          // Then - 대시보드 상태 검증
          const 대시보드_상태 =
            await stepApprovalScenario.일차하향평가_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          expect(
            대시보드_상태.downwardEvaluation.primary.status ===
              'revision_completed' ||
              대시보드_상태.downwardEvaluation.primary.status === 'pending',
          ).toBe(true);
          expect(
            대시보드_상태.stepApproval.primaryEvaluationStatus ===
              'revision_completed' ||
              대시보드_상태.stepApproval.primaryEvaluationStatus === 'pending',
          ).toBe(true);

          // 테스트 결과 저장
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluatorId: primaryEvaluatorId,
              beforeBulkSubmit: {
                isCompleted: 재작성요청_제출전.isCompleted,
              },
              afterBulkSubmit: {
                isCompleted: 재작성요청_제출후.isCompleted,
                completedAt: 재작성요청_제출후.completedAt,
                responseComment: 재작성요청_제출후.responseComment,
                dashboardStatus:
                  대시보드_상태.downwardEvaluation.primary.status,
                stepApprovalStatus:
                  대시보드_상태.stepApproval.primaryEvaluationStatus,
              },
              bulkSubmitResult: 일괄제출결과,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          testResults.push({
            testName,
            result: {
              error: extractErrorMessage(e),
              passed: false,
            },
          });
          throw e;
        }
      });
    });

    describe('2차 하향평가 일괄 제출 시 재작성 요청 완료 처리', () => {
      it('2차 하향평가 일괄 제출 시 재작성 요청이 자동으로 완료 처리된다', async () => {
        const testName =
          '2차 하향평가 일괄 제출 시 재작성 요청이 자동으로 완료 처리된다';
        let error: any = null;

        try {
          // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
          const 자기평가결과 =
            await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
              employeeId: employeeIds[0],
              wbsItemId: wbsItemIds[0],
              periodId: evaluationPeriodId,
              selfEvaluationContent: '자기평가 내용',
              selfEvaluationScore: 85,
            });

          // Given - 2차 하향평가 저장 (제출하지 않음)
          await downwardEvaluationScenario.이차하향평가를_저장한다({
            evaluateeId: employeeIds[0],
            periodId: evaluationPeriodId,
            wbsId: wbsItemIds[0],
            evaluatorId: secondaryEvaluatorId,
            selfEvaluationId: 자기평가결과.id,
            downwardEvaluationContent: '2차 하향평가 내용',
            downwardEvaluationScore: 85,
          });

          // Given - 2차 하향평가 단계 재작성 요청 생성
          await stepApprovalScenario.이차하향평가_단계승인_상태를_변경한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
            evaluatorId: secondaryEvaluatorId,
            status: 'revision_requested',
            revisionComment: '2차 하향평가 재작성 필요',
          });

          // Given - 재작성 요청 생성 검증
          // 2차 평가자로 현재 사용자 설정
          const 이차평가자 = await testSuite
            .getRepository('Employee')
            .findOne({ where: { id: secondaryEvaluatorId } });

          if (!이차평가자) {
            throw new Error('2차 평가자를 찾을 수 없습니다.');
          }

          testSuite.setCurrentUser({
            id: 이차평가자.id,
            email: 이차평가자.email || 'test@example.com',
            name: 이차평가자.name,
            employeeNumber: 이차평가자.employeeNumber,
          });

          const 재작성요청목록_제출전 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'secondary',
            });

          const 재작성요청_제출전 = 재작성요청목록_제출전.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'secondary' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출전).toBeDefined();
          expect(재작성요청_제출전.isCompleted).toBe(false);

          // When - 2차 하향평가 일괄 제출
          const 일괄제출결과 =
            await downwardEvaluationScenario.피평가자의_모든_하향평가를_일괄_제출한다(
              {
                evaluateeId: employeeIds[0],
                periodId: evaluationPeriodId,
                evaluatorId: secondaryEvaluatorId,
                evaluationType: 'secondary',
              },
            );

          expect(일괄제출결과.submittedCount).toBeGreaterThanOrEqual(0);

          // Then - 재작성 요청 자동 완료 검증
          // 2차 평가자로 현재 사용자 재설정 (일괄 제출 후에도 평가자로 조회)
          testSuite.setCurrentUser({
            id: 이차평가자.id,
            email: 이차평가자.email || 'test@example.com',
            name: 이차평가자.name,
            employeeNumber: 이차평가자.employeeNumber,
          });

          const 재작성요청목록_제출후 =
            await stepApprovalScenario.내_재작성요청_목록을_조회한다({
              evaluationPeriodId,
              step: 'secondary',
            });

          const 재작성요청_제출후 = 재작성요청목록_제출후.find(
            (req: any) =>
              req.employee.id === employeeIds[0] &&
              req.step === 'secondary' &&
              req.evaluationPeriod.id === evaluationPeriodId,
          );

          expect(재작성요청_제출후).toBeDefined();
          expect(재작성요청_제출후.isCompleted).toBe(true);
          expect(재작성요청_제출후.completedAt).toBeDefined();
          expect(재작성요청_제출후.responseComment).toBeDefined();
          expect(재작성요청_제출후.responseComment).toContain(
            '2차 하향평가 일괄 제출로 인한 재작성 완료 처리',
          );

          // Then - 대시보드 상태 검증
          const 대시보드_상태 =
            await stepApprovalScenario.이차하향평가_제출상태를_대시보드에서_조회한다(
              {
                evaluationPeriodId,
                employeeId: employeeIds[0],
              },
            );

          const secondaryEvaluatorStatus =
            대시보드_상태.downwardEvaluation.secondary.evaluators.find(
              (e: any) => e.evaluator?.id === secondaryEvaluatorId,
            );

          expect(secondaryEvaluatorStatus).toBeDefined();
          expect(
            secondaryEvaluatorStatus.status === 'revision_completed' ||
              secondaryEvaluatorStatus.status === 'pending',
          ).toBe(true);

          const stepApprovalStatus =
            대시보드_상태.stepApproval.secondaryEvaluationStatuses.find(
              (s: any) => s.evaluatorId === secondaryEvaluatorId,
            );

          expect(stepApprovalStatus).toBeDefined();
          expect(
            stepApprovalStatus.status === 'revision_completed' ||
              stepApprovalStatus.status === 'pending',
          ).toBe(true);

          // 테스트 결과 저장
          testResults.push({
            testName,
            result: {
              employeeId: employeeIds[0],
              evaluatorId: secondaryEvaluatorId,
              beforeBulkSubmit: {
                isCompleted: 재작성요청_제출전.isCompleted,
              },
              afterBulkSubmit: {
                isCompleted: 재작성요청_제출후.isCompleted,
                completedAt: 재작성요청_제출후.completedAt,
                responseComment: 재작성요청_제출후.responseComment,
                dashboardStatus: secondaryEvaluatorStatus.status,
                stepApprovalStatus: stepApprovalStatus.status,
              },
              bulkSubmitResult: 일괄제출결과,
              passed: true,
            },
          });
        } catch (e) {
          error = e;
          testResults.push({
            testName,
            result: {
              error: extractErrorMessage(e),
              passed: false,
            },
          });
          throw e;
        }
      });
    });
  });
});
