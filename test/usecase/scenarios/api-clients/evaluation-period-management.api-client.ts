import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 평가기간 관리 API 클라이언트
 *
 * 평가기간 관리 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class EvaluationPeriodManagementApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== GET: 조회 ====================

  /**
   * 활성 평가기간 조회 API 호출
   *
   * @returns 활성 평가기간 목록
   */
  async getActiveEvaluationPeriods(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-periods/active')
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 목록 조회 API 호출
   *
   * @param config.page - 페이지 번호 (기본값: 1)
   * @param config.limit - 페이지 크기 (기본값: 10)
   * @returns 평가기간 목록 (페이징 정보 포함)
   */
  async getEvaluationPeriods(
    config: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const { page = 1, limit = 10 } = config;

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-periods')
      .query({ page, limit })
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 상세 조회 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 평가기간 상세 정보
   */
  async getEvaluationPeriodDetail(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가 기간 복제용 데이터 조회 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 평가기간 복제용 데이터 (평가기간, 평가항목, 평가라인 포함)
   */
  async getEvaluationPeriodForCopy(periodId: string): Promise<{
    evaluationPeriod: any;
    evaluationCriteria: any[];
    evaluationLines: any;
  }> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${periodId}/for-copy`)
      .expect(200);

    return response.body;
  }

  /**
   * 기본 등급 구간 조회 API 호출
   *
   * @returns 기본 등급 구간 목록
   */
  async getDefaultGradeRanges(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-periods/default-grade-ranges')
      .expect(200);

    return response.body;
  }

  /**
   * 기본 등급 구간 변경 API 호출
   *
   * @param gradeRanges - 변경할 등급 구간 목록
   * @returns 변경된 등급 구간 목록
   */
  async updateDefaultGradeRanges(
    gradeRanges: Array<{
      grade: string;
      minRange: number;
      maxRange: number;
    }>,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-periods/default-grade-ranges')
      .send({ gradeRanges })
      .expect(200);

    return response.body;
  }

  // ==================== POST: 생성 및 상태 변경 ====================

  /**
   * 평가기간 생성 API 호출
   *
   * @param createData - 평가기간 생성 데이터
   * @param createData.sourcePeriodId - 복사할 원본 평가기간 ID (선택적)
   * @returns 생성된 평가기간 정보
   */
  async createEvaluationPeriod(createData: {
    name: string;
    startDate: string;
    peerEvaluationDeadline: string;
    description?: string;
    maxSelfEvaluationRate?: number;
    gradeRanges?: Array<{
      grade: string;
      minRange: number;
      maxRange: number;
    }>;
    sourcePeriodId?: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    return response.body;
  }

  /**
   * 평가기간 시작 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 시작 결과
   */
  async startEvaluationPeriod(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/start`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 완료 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 완료 결과
   */
  async completeEvaluationPeriod(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/complete`)
      .expect(200);

    return response.body;
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 평가기간 기본 정보 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param updateData - 수정할 기본 정보
   * @returns 수정된 평가기간 정보
   */
  async updateEvaluationPeriodBasicInfo(
    periodId: string,
    updateData: {
      name?: string;
      description?: string;
      maxSelfEvaluationRate?: number;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/basic-info`)
      .send(updateData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 일정 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param scheduleData - 수정할 일정 정보
   * @returns 수정된 평가기간 정보
   */
  async updateEvaluationPeriodSchedule(
    periodId: string,
    scheduleData: {
      startDate?: string;
      evaluationSetupDeadline?: string;
      performanceDeadline?: string;
      selfEvaluationDeadline?: string;
      peerEvaluationDeadline?: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/schedule`)
      .send(scheduleData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 시작일 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param startDateData - 수정할 시작일
   * @returns 수정된 평가기간 정보
   */
  async updateEvaluationPeriodStartDate(
    periodId: string,
    startDateData: {
      startDate: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/start-date`)
      .send(startDateData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가설정 단계 마감일 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param deadlineData - 수정할 마감일
   * @returns 수정된 평가기간 정보
   */
  async updateEvaluationSetupDeadline(
    periodId: string,
    deadlineData: {
      evaluationSetupDeadline: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/evaluation-setup-deadline`)
      .send(deadlineData)
      .expect(200);

    return response.body;
  }

  /**
   * 업무 수행 단계 마감일 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param deadlineData - 수정할 마감일
   * @returns 수정된 평가기간 정보
   */
  async updatePerformanceDeadline(
    periodId: string,
    deadlineData: {
      performanceDeadline: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/performance-deadline`)
      .send(deadlineData)
      .expect(200);

    return response.body;
  }

  /**
   * 자기 평가 단계 마감일 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param deadlineData - 수정할 마감일
   * @returns 수정된 평가기간 정보
   */
  async updateSelfEvaluationDeadline(
    periodId: string,
    deadlineData: {
      selfEvaluationDeadline: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/self-evaluation-deadline`)
      .send(deadlineData)
      .expect(200);

    return response.body;
  }

  /**
   * 하향/동료평가 단계 마감일 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param deadlineData - 수정할 마감일
   * @returns 수정된 평가기간 정보
   */
  async updatePeerEvaluationDeadline(
    periodId: string,
    deadlineData: {
      peerEvaluationDeadline: string;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/peer-evaluation-deadline`)
      .send(deadlineData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 등급 구간 수정 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param gradeData - 수정할 등급 구간
   * @returns 수정된 평가기간 정보
   */
  async updateEvaluationPeriodGradeRanges(
    periodId: string,
    gradeData: {
      gradeRanges: Array<{
        grade: string;
        minRange: number;
        maxRange: number;
      }>;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-periods/${periodId}/grade-ranges`)
      .send(gradeData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가 기준 설정 수동 허용 변경 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param permissionData - 수정할 권한 설정
   * @returns 수정된 평가기간 정보
   */
  async updateCriteriaSettingPermission(
    periodId: string,
    permissionData: {
      allowManualSetting: boolean;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/settings/criteria-permission`,
      )
      .send(permissionData)
      .expect(200);

    return response.body;
  }

  /**
   * 자기 평가 설정 수동 허용 변경 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param permissionData - 수정할 권한 설정
   * @returns 수정된 평가기간 정보
   */
  async updateSelfEvaluationSettingPermission(
    periodId: string,
    permissionData: {
      allowManualSetting: boolean;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/settings/self-evaluation-permission`,
      )
      .send(permissionData)
      .expect(200);

    return response.body;
  }

  /**
   * 자기 평가 설정 수동 허용 변경 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param permissionData - 수정할 권한 설정
   * @returns 수정된 평가기간 정보
   */
  async updateSelfEvaluationPermission(
    periodId: string,
    permissionData: {
      allowManualSetting: boolean;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/settings/self-evaluation-permission`,
      )
      .send(permissionData)
      .expect(200);

    return response.body;
  }

  /**
   * 최종 평가 설정 수동 허용 변경 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param permissionData - 수정할 권한 설정
   * @returns 수정된 평가기간 정보
   */
  async updateFinalEvaluationPermission(
    periodId: string,
    permissionData: {
      allowManualSetting: boolean;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/settings/final-evaluation-permission`,
      )
      .send(permissionData)
      .expect(200);

    return response.body;
  }

  /**
   * 전체 수동 허용 설정 변경 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param permissionData - 수정할 권한 설정
   * @returns 수정된 평가기간 정보
   */
  async updateManualSettingPermissions(
    periodId: string,
    permissionData: {
      allowCriteriaManualSetting?: boolean;
      allowSelfEvaluationManualSetting?: boolean;
      allowFinalEvaluationManualSetting?: boolean;
    },
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${periodId}/settings/manual-permissions`,
      )
      .send(permissionData)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간 복제 API 호출
   *
   * @param targetPeriodId - 복사 대상 평가기간 ID
   * @param sourcePeriodId - 소스 평가기간 ID
   * @returns 복제된 평가기간 정보
   */
  async duplicateEvaluationPeriod(
    targetPeriodId: string,
    sourcePeriodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${targetPeriodId}/duplicate/${sourcePeriodId}`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== DELETE: 삭제 ====================

  /**
   * 평가기간 삭제 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 삭제 결과
   */
  async deleteEvaluationPeriod(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    return response.body;
  }
}
