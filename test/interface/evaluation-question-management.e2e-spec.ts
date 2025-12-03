import { BaseE2ETest } from '../base-e2e.spec';
import { HttpStatus } from '@nestjs/common';

/**
 * 평가 질문 관리 E2E 테스트
 *
 * 주요 테스트 시나리오:
 * 1. 그룹에 질문 추가 시 displayOrder 자동 설정
 * 2. 질문 순서 관리 (위/아래 이동)
 * 3. 여러 질문 일괄 추가
 */
describe('평가 질문 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('POST /admin/performance-evaluation/evaluation-questions/question-group-mappings - 그룹에 질문 추가', () => {
    let groupId: string;
    let questionId1: string;
    let questionId2: string;
    let questionId3: string;

    beforeAll(async () => {
      // 테스트용 그룹 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '테스트 질문 그룹 - displayOrder 자동 설정',
        })
        .expect(HttpStatus.CREATED);

      groupId = groupResponse.body.id;

      // 테스트용 질문 3개 생성
      const question1Response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '첫 번째 테스트 질문 - displayOrder 테스트',
          minScore: 1,
          maxScore: 5,
        })
        .expect(HttpStatus.CREATED);

      questionId1 = question1Response.body.id;

      const question2Response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '두 번째 테스트 질문 - displayOrder 테스트',
          minScore: 1,
          maxScore: 5,
        })
        .expect(HttpStatus.CREATED);

      questionId2 = question2Response.body.id;

      const question3Response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '세 번째 테스트 질문 - displayOrder 테스트',
          minScore: 1,
          maxScore: 5,
        })
        .expect(HttpStatus.CREATED);

      questionId3 = question3Response.body.id;
    });

    describe('displayOrder 자동 설정', () => {
      it('첫 번째 질문 추가 시 displayOrder가 0으로 설정되어야 한다', async () => {
        // When: displayOrder 없이 첫 번째 질문 추가
        const response = await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            questionId: questionId1,
            // displayOrder 생략
          })
          .expect(HttpStatus.CREATED);

        // Then: 응답 확인
        expect(response.body).toEqual({
          id: expect.any(String),
          message: expect.any(String),
        });

        // 추가된 질문의 displayOrder 확인
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`,
          )
          .expect(HttpStatus.OK);

        expect(groupQuestions.body).toHaveLength(1);
        expect(groupQuestions.body[0].displayOrder).toBe(0);
        expect(groupQuestions.body[0].questionId).toBe(questionId1);
      });

      it('두 번째 질문 추가 시 displayOrder가 1로 자동 설정되어야 한다', async () => {
        // When: displayOrder 없이 두 번째 질문 추가
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            questionId: questionId2,
            // displayOrder 생략 - 자동으로 마지막 순서(1)로 설정되어야 함
          })
          .expect(HttpStatus.CREATED);

        // Then: 그룹 질문 목록 조회하여 확인
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`,
          )
          .expect(HttpStatus.OK);

        expect(groupQuestions.body).toHaveLength(2);

        // displayOrder 순으로 정렬되어 있어야 함
        expect(groupQuestions.body[0].displayOrder).toBe(0);
        expect(groupQuestions.body[0].questionId).toBe(questionId1);

        expect(groupQuestions.body[1].displayOrder).toBe(1);
        expect(groupQuestions.body[1].questionId).toBe(questionId2);
      });

      it('세 번째 질문 추가 시 displayOrder가 2로 자동 설정되어야 한다', async () => {
        // When: displayOrder 없이 세 번째 질문 추가
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            questionId: questionId3,
            // displayOrder 생략 - 자동으로 마지막 순서(2)로 설정되어야 함
          })
          .expect(HttpStatus.CREATED);

        // Then: 그룹 질문 목록 조회하여 확인
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`,
          )
          .expect(HttpStatus.OK);

        expect(groupQuestions.body).toHaveLength(3);

        // displayOrder 순으로 정렬되어 있어야 함
        expect(groupQuestions.body[0].displayOrder).toBe(0);
        expect(groupQuestions.body[0].questionId).toBe(questionId1);

        expect(groupQuestions.body[1].displayOrder).toBe(1);
        expect(groupQuestions.body[1].questionId).toBe(questionId2);

        expect(groupQuestions.body[2].displayOrder).toBe(2);
        expect(groupQuestions.body[2].questionId).toBe(questionId3);
      });

      it('질문이 displayOrder 오름차순으로 정렬되어 조회되어야 한다', async () => {
        // When: 그룹의 질문 목록 조회
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId}/questions`,
          )
          .expect(HttpStatus.OK);

        // Then: 순서 확인
        expect(groupQuestions.body).toHaveLength(3);

        for (let i = 0; i < groupQuestions.body.length; i++) {
          expect(groupQuestions.body[i].displayOrder).toBe(i);
        }

        // 질문 정보도 함께 조회되어야 함
        groupQuestions.body.forEach((mapping: any) => {
          expect(mapping.question).toBeDefined();
          expect(mapping.question.text).toBeDefined();
          expect(mapping.question.minScore).toBeDefined();
          expect(mapping.question.maxScore).toBeDefined();
        });
      });
    });

    describe('displayOrder 명시적 지정', () => {
      let groupId2: string;
      let questionId4: string;
      let questionId5: string;

      beforeAll(async () => {
        // 새로운 테스트용 그룹 생성
        const groupResponse = await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-groups',
          )
          .send({
            name: '테스트 질문 그룹 - displayOrder 명시적 지정',
          })
          .expect(HttpStatus.CREATED);

        groupId2 = groupResponse.body.id;

        // 테스트용 질문 2개 생성
        const question4Response = await testSuite
          .request()
          .post('/admin/performance-evaluation/evaluation-questions')
          .send({
            text: '네 번째 테스트 질문 - 명시적 순서',
            minScore: 1,
            maxScore: 5,
          })
          .expect(HttpStatus.CREATED);

        questionId4 = question4Response.body.id;

        const question5Response = await testSuite
          .request()
          .post('/admin/performance-evaluation/evaluation-questions')
          .send({
            text: '다섯 번째 테스트 질문 - 명시적 순서',
            minScore: 1,
            maxScore: 5,
          })
          .expect(HttpStatus.CREATED);

        questionId5 = question5Response.body.id;
      });

      it('displayOrder를 명시적으로 지정하면 해당 순서로 추가되어야 한다', async () => {
        // When: displayOrder를 10으로 지정하여 질문 추가
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId: groupId2,
            questionId: questionId4,
            displayOrder: 10,
          })
          .expect(HttpStatus.CREATED);

        // Then: 지정한 순서로 추가되었는지 확인
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId2}/questions`,
          )
          .expect(HttpStatus.OK);

        expect(groupQuestions.body).toHaveLength(1);
        expect(groupQuestions.body[0].displayOrder).toBe(10);
        expect(groupQuestions.body[0].questionId).toBe(questionId4);
      });

      it('displayOrder를 명시한 후 생략하면 최대값+1로 자동 설정되어야 한다', async () => {
        // When: displayOrder 없이 추가 (이전 최대값이 10이므로 11이 되어야 함)
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId: groupId2,
            questionId: questionId5,
            // displayOrder 생략 - 자동으로 11로 설정되어야 함
          })
          .expect(HttpStatus.CREATED);

        // Then: displayOrder 확인
        const groupQuestions = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/evaluation-questions/question-groups/${groupId2}/questions`,
          )
          .expect(HttpStatus.OK);

        expect(groupQuestions.body).toHaveLength(2);
        expect(groupQuestions.body[0].displayOrder).toBe(10);
        expect(groupQuestions.body[1].displayOrder).toBe(11);
      });
    });

    describe('에러 케이스', () => {
      it('존재하지 않는 그룹에 질문 추가 시 404 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId: '00000000-0000-0000-0000-000000000000',
            questionId: questionId1,
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('존재하지 않는 질문을 그룹에 추가 시 404 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            questionId: '00000000-0000-0000-0000-000000000000',
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('필수 필드(groupId) 누락 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            // groupId 누락
            questionId: questionId1,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('필수 필드(questionId) 누락 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            // questionId 누락
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('잘못된 UUID 형식의 groupId로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId: 'invalid-uuid',
            questionId: questionId1,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('잘못된 UUID 형식의 questionId로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId,
            questionId: 'invalid-uuid',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /admin/performance-evaluation/evaluation-questions/question-group-mappings/batch - 여러 질문 일괄 추가', () => {
    let batchGroupId: string;
    let batchQuestion1: string;
    let batchQuestion2: string;
    let batchQuestion3: string;

    beforeAll(async () => {
      // 테스트용 그룹 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '테스트 질문 그룹 - 일괄 추가',
        })
        .expect(HttpStatus.CREATED);

      batchGroupId = groupResponse.body.id;

      // 테스트용 질문 3개 생성
      const q1 = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({ text: '일괄 추가 질문 1', minScore: 1, maxScore: 5 })
        .expect(HttpStatus.CREATED);
      batchQuestion1 = q1.body.id;

      const q2 = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({ text: '일괄 추가 질문 2', minScore: 1, maxScore: 5 })
        .expect(HttpStatus.CREATED);
      batchQuestion2 = q2.body.id;

      const q3 = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({ text: '일괄 추가 질문 3', minScore: 1, maxScore: 5 })
        .expect(HttpStatus.CREATED);
      batchQuestion3 = q3.body.id;
    });

    it('여러 질문을 일괄 추가하면 순차적으로 displayOrder가 할당되어야 한다', async () => {
      // When: 여러 질문 일괄 추가
      const response = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-group-mappings/batch',
        )
        .send({
          groupId: batchGroupId,
          questionIds: [batchQuestion1, batchQuestion2, batchQuestion3],
          startDisplayOrder: 0,
        })
        .expect(HttpStatus.CREATED);

      // Then: 응답 확인
      expect(response.body.ids).toHaveLength(3);
      expect(response.body.successCount).toBe(3);
      expect(response.body.totalCount).toBe(3);

      // displayOrder 순서 확인
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${batchGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(3);
      expect(groupQuestions.body[0].displayOrder).toBe(0);
      expect(groupQuestions.body[0].questionId).toBe(batchQuestion1);
      expect(groupQuestions.body[1].displayOrder).toBe(1);
      expect(groupQuestions.body[1].questionId).toBe(batchQuestion2);
      expect(groupQuestions.body[2].displayOrder).toBe(2);
      expect(groupQuestions.body[2].questionId).toBe(batchQuestion3);
    });

    it('startDisplayOrder를 지정하면 해당 순서부터 순차적으로 할당되어야 한다', async () => {
      // Given: 새 그룹 생성
      const newGroupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '테스트 질문 그룹 - startDisplayOrder 지정',
        })
        .expect(HttpStatus.CREATED);

      const newGroupId = newGroupResponse.body.id;

      // When: startDisplayOrder를 10으로 지정하여 일괄 추가
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-group-mappings/batch',
        )
        .send({
          groupId: newGroupId,
          questionIds: [batchQuestion1, batchQuestion2],
          startDisplayOrder: 10,
        })
        .expect(HttpStatus.CREATED);

      // Then: displayOrder가 10, 11로 설정되었는지 확인
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${newGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(2);
      expect(groupQuestions.body[0].displayOrder).toBe(10);
      expect(groupQuestions.body[1].displayOrder).toBe(11);
    });
  });

  describe('GET /admin/performance-evaluation/evaluation-questions/question-groups/:groupId/questions - 그룹의 질문 목록 조회', () => {
    it('빈 그룹의 경우 빈 배열을 반환해야 한다', async () => {
      // Given: 빈 그룹 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '빈 테스트 그룹',
        })
        .expect(HttpStatus.CREATED);

      const emptyGroupId = groupResponse.body.id;

      // When: 빈 그룹의 질문 목록 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${emptyGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      // Then: 빈 배열 반환
      expect(response.body).toEqual([]);
    });

    it('질문이 displayOrder 오름차순으로 정렬되어야 한다', async () => {
      // Given: 그룹과 질문 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '정렬 테스트 그룹',
        })
        .expect(HttpStatus.CREATED);

      const sortGroupId = groupResponse.body.id;

      // 질문 3개 생성 및 추가 (역순으로 displayOrder 지정)
      const questions: string[] = [];
      for (let i = 0; i < 3; i++) {
        const qResponse = await testSuite
          .request()
          .post('/admin/performance-evaluation/evaluation-questions')
          .send({
            text: `정렬 테스트 질문 ${i + 1}`,
            minScore: 1,
            maxScore: 5,
          })
          .expect(HttpStatus.CREATED);
        questions.push(qResponse.body.id);
      }

      // 역순으로 추가 (displayOrder: 2, 1, 0)
      for (let i = 0; i < 3; i++) {
        await testSuite
          .request()
          .post(
            '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
          )
          .send({
            groupId: sortGroupId,
            questionId: questions[i],
            displayOrder: 2 - i, // 2, 1, 0
          })
          .expect(HttpStatus.CREATED);
      }

      // When: 그룹의 질문 목록 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${sortGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      // Then: displayOrder 오름차순으로 정렬되어 있어야 함
      expect(response.body).toHaveLength(3);
      expect(response.body[0].displayOrder).toBe(0);
      expect(response.body[1].displayOrder).toBe(1);
      expect(response.body[2].displayOrder).toBe(2);

      // questionId도 역순이어야 함
      expect(response.body[0].questionId).toBe(questions[2]);
      expect(response.body[1].questionId).toBe(questions[1]);
      expect(response.body[2].questionId).toBe(questions[0]);
    });

    it('응답에 질문 상세 정보(question)가 포함되어야 한다', async () => {
      // Given: 그룹과 질문 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '질문 상세 정보 테스트 그룹',
        })
        .expect(HttpStatus.CREATED);

      const detailGroupId = groupResponse.body.id;

      const questionResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '질문 상세 정보 테스트',
          minScore: 1,
          maxScore: 5,
        })
        .expect(HttpStatus.CREATED);

      const detailQuestionId = questionResponse.body.id;

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-group-mappings',
        )
        .send({
          groupId: detailGroupId,
          questionId: detailQuestionId,
        })
        .expect(HttpStatus.CREATED);

      // When: 그룹의 질문 목록 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${detailGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      // Then: 질문 상세 정보 포함 확인
      expect(response.body).toHaveLength(1);
      expect(response.body[0].question).toBeDefined();
      expect(response.body[0].question.id).toBe(detailQuestionId);
      expect(response.body[0].question.text).toBe('질문 상세 정보 테스트');
      expect(response.body[0].question.minScore).toBe(1);
      expect(response.body[0].question.maxScore).toBe(5);
      expect(response.body[0].question.createdAt).toBeDefined();
      expect(response.body[0].question.updatedAt).toBeDefined();
    });
  });

  describe('POST /admin/performance-evaluation/evaluation-questions - 평가 질문 생성 시 그룹 자동 추가', () => {
    let autoGroupId: string;

    beforeAll(async () => {
      // 테스트용 그룹 생성
      const groupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '테스트 질문 그룹 - 질문 생성 시 자동 추가',
        })
        .expect(HttpStatus.CREATED);

      autoGroupId = groupResponse.body.id;
    });

    it('질문 생성 시 groupId를 포함하고 displayOrder를 생략하면 자동으로 0으로 설정되어야 한다', async () => {
      // When: groupId 포함, displayOrder 생략하여 질문 생성
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '자동 추가 테스트 질문 1 - displayOrder 자동 설정',
          minScore: 1,
          maxScore: 5,
          groupId: autoGroupId,
          // displayOrder 생략 - 자동으로 0이 되어야 함
        })
        .expect(HttpStatus.CREATED);

      const questionId = response.body.id;

      // Then: 그룹에 질문이 추가되고 displayOrder가 0이어야 함
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${autoGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(1);
      expect(groupQuestions.body[0].questionId).toBe(questionId);
      expect(groupQuestions.body[0].displayOrder).toBe(0);
    });

    it('질문 생성 시 groupId를 포함하고 displayOrder를 생략하면 자동으로 마지막 순서(1)로 설정되어야 한다', async () => {
      // When: 두 번째 질문 생성 (displayOrder 생략)
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '자동 추가 테스트 질문 2 - displayOrder 자동 설정',
          minScore: 1,
          maxScore: 5,
          groupId: autoGroupId,
          // displayOrder 생략 - 자동으로 1이 되어야 함
        })
        .expect(HttpStatus.CREATED);

      const questionId = response.body.id;

      // Then: 그룹에 질문이 추가되고 displayOrder가 1이어야 함
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${autoGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(2);
      expect(groupQuestions.body[1].questionId).toBe(questionId);
      expect(groupQuestions.body[1].displayOrder).toBe(1);
    });

    it('질문 생성 시 groupId를 포함하고 displayOrder를 생략하면 자동으로 마지막 순서(2)로 설정되어야 한다', async () => {
      // When: 세 번째 질문 생성 (displayOrder 생략)
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '자동 추가 테스트 질문 3 - displayOrder 자동 설정',
          minScore: 1,
          maxScore: 5,
          groupId: autoGroupId,
          // displayOrder 생략 - 자동으로 2가 되어야 함
        })
        .expect(HttpStatus.CREATED);

      const questionId = response.body.id;

      // Then: 그룹에 질문이 추가되고 displayOrder가 2여야 함
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${autoGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(3);
      expect(groupQuestions.body[2].questionId).toBe(questionId);
      expect(groupQuestions.body[2].displayOrder).toBe(2);

      // 모든 질문이 순서대로 정렬되어 있는지 확인
      for (let i = 0; i < groupQuestions.body.length; i++) {
        expect(groupQuestions.body[i].displayOrder).toBe(i);
      }
    });

    it('질문 생성 시 groupId와 displayOrder를 명시적으로 지정하면 해당 순서로 추가되어야 한다', async () => {
      // Given: 새 그룹 생성
      const newGroupResponse = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/evaluation-questions/question-groups',
        )
        .send({
          name: '테스트 질문 그룹 - displayOrder 명시',
        })
        .expect(HttpStatus.CREATED);

      const newGroupId = newGroupResponse.body.id;

      // When: displayOrder를 10으로 명시하여 질문 생성
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '명시적 displayOrder 테스트 질문',
          minScore: 1,
          maxScore: 5,
          groupId: newGroupId,
          displayOrder: 10,
        })
        .expect(HttpStatus.CREATED);

      const questionId = response.body.id;

      // Then: 지정한 순서로 추가되었는지 확인
      const groupQuestions = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/question-groups/${newGroupId}/questions`,
        )
        .expect(HttpStatus.OK);

      expect(groupQuestions.body).toHaveLength(1);
      expect(groupQuestions.body[0].questionId).toBe(questionId);
      expect(groupQuestions.body[0].displayOrder).toBe(10);
    });

    it('질문 생성 시 groupId 없이 생성하면 어떤 그룹에도 추가되지 않아야 한다', async () => {
      // When: groupId 없이 질문 생성
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/evaluation-questions')
        .send({
          text: '독립 질문 - 그룹 없음',
          minScore: 1,
          maxScore: 5,
          // groupId 생략
        })
        .expect(HttpStatus.CREATED);

      const questionId = response.body.id;

      // Then: 질문은 생성되었지만 어떤 그룹에도 속하지 않음
      const questionGroupsResponse = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/evaluation-questions/questions/${questionId}/groups`,
        )
        .expect(HttpStatus.OK);

      expect(questionGroupsResponse.body).toEqual([]);
    });
  });
});
