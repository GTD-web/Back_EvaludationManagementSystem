import { BaseE2ETest } from '../base-e2e.spec';
import { RevisionRequestApiClient } from '../usecase/scenarios/api-clients/revision-request.api-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 재작성 요청 API Query 파라미터 변환 E2E 테스트
 *
 * 실제 HTTP 요청을 통해 isCompleted=false가 올바르게 처리되는지 확인합니다.
 */
describe('재작성 요청 API Query 파라미터 변환 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let apiClient: RevisionRequestApiClient;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  // ANSI 이스케이프 코드를 제거하는 헬퍼 함수
  function stripAnsiCodes(str: string): string {
    if (!str) return str;
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    message = stripAnsiCodes(message);

    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
      if (stack && !stack.includes(message)) {
        message = `${message}\n\nStack:\n${stack}`;
      }
    }

    return message;
  }

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    apiClient = new RevisionRequestApiClient(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'revision-request-query-param-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

    await testSuite.closeApp();
  });

  describe('GET /admin/revision-requests/me - isCompleted 파라미터 변환', () => {
    it('isCompleted=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given - isCompleted=false로 요청
        result = await apiClient.getMyRevisionRequests({
          isCompleted: false,
        });

        // Then - 모든 결과가 isCompleted=false여야 함
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(false);
          expect(item.isCompleted).not.toBe(true); // ❌ true가 되어서는 안 됨
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given - isCompleted=true로 요청
        result = await apiClient.getMyRevisionRequests({
          isCompleted: true,
        });

        // Then - 모든 결과가 isCompleted=true여야 함
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(true);
          expect(item.isCompleted).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted 파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted 파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다';

      try {
        // Given - isCompleted 파라미터 없이 요청
        result = await apiClient.getMyRevisionRequests({});

        // Then - 결과가 반환되어야 함 (빈 배열일 수도 있음)
        expect(Array.isArray(result)).toBe(true);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: {},
            resultCount: result.length,
            isArray: Array.isArray(result),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: {},
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false와 isCompleted=false를 함께 사용할 때도 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isRead=false와 isCompleted=false를 함께 사용할 때도 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: false,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('GET /admin/revision-requests - 전체 재작성 요청 필터링', () => {
    it('파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] 파라미터 없이 요청했을 때 모든 상태의 요청이 반환되어야 한다';

      try {
        // Given - 파라미터 없이 요청
        result = await apiClient.getRevisionRequests({});

        // Then - 결과가 반환되어야 함 (빈 배열일 수도 있음)
        expect(Array.isArray(result)).toBe(true);

        // 다양한 상태가 섞여있는지 확인 (데이터가 있는 경우)
        if (result.length > 0) {
          const hasTrue = result.some((item: any) => item.isCompleted === true);
          const hasFalse = result.some(
            (item: any) => item.isCompleted === false,
          );

          // 테스트 결과 저장 (성공)
          testResults.push({
            testName,
            result: {
              requestParams: {},
              resultCount: result.length,
              isArray: Array.isArray(result),
              hasCompletedTrue: hasTrue,
              hasCompletedFalse: hasFalse,
              passed: true,
            },
          });
        } else {
          testResults.push({
            testName,
            result: {
              requestParams: {},
              resultCount: 0,
              isArray: true,
              passed: true,
            },
          });
        }
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: {},
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        'isCompleted=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(false);
          expect(item.isCompleted).not.toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isCompleted=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isCompleted=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isCompleted).toBe(true);
          expect(item.isCompleted).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isRead).not.toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isRead).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=true와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: true,
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isCompleted).toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=true와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: true,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=false와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: false,
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] isRead=false와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getRevisionRequests({
          isRead: false,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('GET /admin/revision-requests/me - 내 재작성 요청 추가 필터링', () => {
    it('isRead=true로 요청했을 때 true로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] isRead=true로 요청했을 때 true로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isRead).not.toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false로 요청했을 때 false로 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] isRead=false로 요청했을 때 false로 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isRead).not.toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] isRead=true와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: true,
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isCompleted).toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=true와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] isRead=true와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: true,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(true);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: false },
            resultCount: result.length,
            allItemsHaveIsReadTrue: result.every(
              (item: any) => item.isRead === true,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: true, isCompleted: false },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('isRead=false와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] isRead=false와 isCompleted=true를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given
        result = await apiClient.getMyRevisionRequests({
          isRead: false,
          isCompleted: true,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(true);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: true },
            resultCount: result.length,
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedTrue: result.every(
              (item: any) => item.isCompleted === true,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            requestParams: { isRead: false, isCompleted: true },
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('GET /admin/revision-requests - 다른 필터와의 조합', () => {
    it('evaluationPeriodId와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] evaluationPeriodId와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 evaluationPeriodId 얻기
        const allRequests = await apiClient.getRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const evaluationPeriodId = allRequests[0].evaluationPeriod.id;

        // When
        result = await apiClient.getRevisionRequests({
          evaluationPeriodId,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.evaluationPeriod.id).toBe(evaluationPeriodId);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { evaluationPeriodId, isCompleted: false },
            resultCount: result.length,
            allMatchEvaluationPeriod: result.every(
              (item: any) => item.evaluationPeriod.id === evaluationPeriodId,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('employeeId와 isRead=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] employeeId와 isRead=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 employeeId 얻기
        const allRequests = await apiClient.getRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const employeeId = allRequests[0].employee.id;

        // When
        result = await apiClient.getRevisionRequests({
          employeeId,
          isRead: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.employee.id).toBe(employeeId);
          expect(item.isRead).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { employeeId, isRead: false },
            resultCount: result.length,
            allMatchEmployee: result.every(
              (item: any) => item.employee.id === employeeId,
            ),
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('step과 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] step과 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 step 얻기
        const allRequests = await apiClient.getRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const step = allRequests[0].step;

        // When
        result = await apiClient.getRevisionRequests({
          step: step as any,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.step).toBe(step);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { step, isCompleted: false },
            resultCount: result.length,
            allMatchStep: result.every((item: any) => item.step === step),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('여러 필터를 동시에 사용할 때 모두 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[전체] 여러 필터(evaluationPeriodId, isRead, isCompleted)를 동시에 사용할 때 모두 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 evaluationPeriodId 얻기
        const allRequests = await apiClient.getRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const evaluationPeriodId = allRequests[0].evaluationPeriod.id;

        // When
        result = await apiClient.getRevisionRequests({
          evaluationPeriodId,
          isRead: false,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.evaluationPeriod.id).toBe(evaluationPeriodId);
          expect(item.isRead).toBe(false);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: {
              evaluationPeriodId,
              isRead: false,
              isCompleted: false,
            },
            resultCount: result.length,
            allMatchEvaluationPeriod: result.every(
              (item: any) => item.evaluationPeriod.id === evaluationPeriodId,
            ),
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('GET /admin/revision-requests/me - 다른 필터와의 조합', () => {
    it('evaluationPeriodId와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] evaluationPeriodId와 isCompleted=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 evaluationPeriodId 얻기
        const allRequests = await apiClient.getMyRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const evaluationPeriodId = allRequests[0].evaluationPeriod.id;

        // When
        result = await apiClient.getMyRevisionRequests({
          evaluationPeriodId,
          isCompleted: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.evaluationPeriod.id).toBe(evaluationPeriodId);
          expect(item.isCompleted).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { evaluationPeriodId, isCompleted: false },
            resultCount: result.length,
            allMatchEvaluationPeriod: result.every(
              (item: any) => item.evaluationPeriod.id === evaluationPeriodId,
            ),
            allItemsHaveIsCompletedFalse: result.every(
              (item: any) => item.isCompleted === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('step과 isRead=false를 함께 사용할 때 올바르게 필터링되어야 한다', async () => {
      let result: any[];
      let error: any;
      const testName =
        '[내꺼] step과 isRead=false를 함께 사용할 때 올바르게 필터링되어야 한다';

      try {
        // Given - 먼저 전체 조회로 step 얻기
        const allRequests = await apiClient.getMyRevisionRequests({});
        if (allRequests.length === 0) {
          // 데이터가 없으면 테스트 스킵
          testResults.push({
            testName,
            result: {
              skipped: true,
              reason: '테스트 데이터 없음',
              passed: true,
            },
          });
          return;
        }

        const step = allRequests[0].step;

        // When
        result = await apiClient.getMyRevisionRequests({
          step: step as any,
          isRead: false,
        });

        // Then
        result.forEach((item: any) => {
          expect(item.step).toBe(step);
          expect(item.isRead).toBe(false);
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            requestParams: { step, isRead: false },
            resultCount: result.length,
            allMatchStep: result.every((item: any) => item.step === step),
            allItemsHaveIsReadFalse: result.every(
              (item: any) => item.isRead === false,
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
