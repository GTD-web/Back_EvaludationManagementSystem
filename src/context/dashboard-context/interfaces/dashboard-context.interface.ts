/**
 * 대시보드 컨텍스트 인터페이스
 */

/**
 * 평가항목 설정 상태
 * - complete: 프로젝트와 WBS 모두 할당됨 (존재)
 * - in_progress: 프로젝트나 WBS 중 하나만 할당됨 (설정중)
 * - none: 프로젝트와 WBS 모두 미할당 (미존재)
 */
export type EvaluationCriteriaStatus = 'complete' | 'in_progress' | 'none';

/**
 * WBS 평가기준 설정 상태
 * - complete: 모든 WBS에 평가기준이 설정됨 (완료)
 * - in_progress: 일부 WBS에만 평가기준이 설정됨 (설정중)
 * - none: 평가기준이 설정된 WBS가 없음 (미존재)
 */
export type WbsCriteriaStatus = 'complete' | 'in_progress' | 'none';

/**
 * 평가라인 지정 완료 상태
 * - complete: PRIMARY와 SECONDARY 라인 모두에 평가자가 지정됨 (존재)
 * - in_progress: PRIMARY나 SECONDARY 중 하나만 평가자가 지정됨 (설정중)
 * - none: PRIMARY와 SECONDARY 모두 평가자가 미지정 (미존재)
 */
export type EvaluationLineStatus = 'complete' | 'in_progress' | 'none';

/**
 * 성과 입력 상태
 * - complete: 모든 WBS에 성과 입력이 완료됨 (완료)
 * - in_progress: 일부 WBS에만 성과 입력이 있음 (입력중)
 * - none: 모든 WBS에 성과 입력이 없음 (미존재)
 */
export type PerformanceInputStatus = 'complete' | 'in_progress' | 'none';

/**
 * 자기평가 진행 상태
 * - complete: 모든 WBS 자기평가가 완료됨 (완료)
 * - in_progress: 일부 WBS 자기평가만 완료되거나 진행중 (입력중)
 * - none: WBS 자기평가 매핑이 없음 (미존재)
 */
export type SelfEvaluationStatus = 'complete' | 'in_progress' | 'none';

/**
 * 하향평가 진행 상태
 * - complete: 하향평가가 완료됨 (완료)
 * - in_progress: 하향평가가 존재하나 완료되지 않음 (입력중)
 * - none: 하향평가가 존재하지 않음 (미존재)
 */
export type DownwardEvaluationStatus = 'complete' | 'in_progress' | 'none';

/**
 * 동료평가 진행 상태
 * - complete: 모든 동료평가가 완료됨 (완료)
 * - in_progress: 동료평가가 존재하나 일부만 완료되거나 진행중 (입력중)
 * - none: 동료평가 요청이 없음 (요청가능)
 */
export type PeerEvaluationStatus = 'complete' | 'in_progress' | 'none';

/**
 * 최종평가 진행 상태
 * - complete: 최종평가가 확정됨 (확정)
 * - in_progress: 최종평가가 존재하나 확정되지 않음 (작성중)
 * - none: 최종평가가 없음 (미작성)
 */
export type FinalEvaluationStatus = 'complete' | 'in_progress' | 'none';

/**
 * 직원 평가 기간 현황 DTO
 * 특정 평가기간에서 특정 직원의 참여 현황 정보
 */
export interface EmployeeEvaluationPeriodStatusDto {
  /** 맵핑 ID */
  mappingId: string;

  /** 직원 ID */
  employeeId: string;

  /** 평가 대상 여부 (제외되지 않고 삭제되지 않은 경우) */
  isEvaluationTarget: boolean;

  /** 평가기간 정보 */
  evaluationPeriod: {
    /** 평가기간 ID */
    id: string;
    /** 평가기간명 */
    name: string;
    /** 평가 기간 상태 */
    status: string;
    /** 현재 평가 단계 */
    currentPhase: string;
    /** 평가 시작일 */
    startDate: Date;
    /** 평가 종료일 */
    endDate?: Date;
    /** 수동 설정 상태 정보 */
    manualSettings: {
      /** 평가 기준 설정 수동 허용 여부 */
      criteriaSettingEnabled: boolean;
      /** 자기 평가 설정 수동 허용 여부 */
      selfEvaluationSettingEnabled: boolean;
      /** 하향/동료평가 설정 수동 허용 여부 */
      finalEvaluationSettingEnabled: boolean;
    };
  } | null;

  /** 직원 정보 */
  employee: {
    /** 직원 ID */
    id: string;
    /** 직원명 */
    name: string;
    /** 직원 사번 */
    employeeNumber: string;
    /** 이메일 */
    email: string;
    /** 부서명 */
    departmentName?: string;
    /** 직책명 */
    rankName?: string;
    /** 직원 상태 */
    status?: '재직중' | '휴직중' | '퇴사';
    /** 입사일 */
    hireDate?: Date | null;
  } | null;

  /** 평가 대상 제외 정보 */
  exclusionInfo: {
    /** 평가 대상 제외 여부 */
    isExcluded: boolean;
    /** 제외 사유 */
    excludeReason?: string | null;
    /** 제외 처리 일시 */
    excludedAt?: Date | null;
  };

  /** 평가항목 설정 정보 */
  evaluationCriteria: {
    /** 평가항목 설정 상태 */
    status: EvaluationCriteriaStatus;
    /** 할당된 프로젝트 수 */
    assignedProjectCount: number;
    /** 할당된 WBS 수 */
    assignedWbsCount: number;
  };

  /** WBS 평가기준 설정 정보 */
  wbsCriteria: {
    /** WBS 평가기준 설정 상태 */
    status: WbsCriteriaStatus;
    /** 평가기준이 설정된 WBS 수 */
    wbsWithCriteriaCount: number;
  };

  /** 평가라인 지정 정보 */
  evaluationLine: {
    /** 평가라인 지정 완료 상태 */
    status: EvaluationLineStatus;
    /** PRIMARY 라인 평가자 지정 여부 */
    hasPrimaryEvaluator: boolean;
    /** SECONDARY 라인 평가자 지정 여부 */
    hasSecondaryEvaluator: boolean;
  };

  /** 평가기준 설정 정보 (평가항목, WBS 평가기준, 평가라인을 통합) */
  criteriaSetup: {
    /** 평가기준 설정 상태 (계산된 상태) */
    status:
      | 'none'
      | 'in_progress'
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 평가항목 설정 정보 */
    evaluationCriteria: {
      /** 평가항목 설정 상태 */
      status: EvaluationCriteriaStatus;
      /** 할당된 프로젝트 수 */
      assignedProjectCount: number;
      /** 할당된 WBS 수 */
      assignedWbsCount: number;
    };
    /** WBS 평가기준 설정 정보 */
    wbsCriteria: {
      /** WBS 평가기준 설정 상태 */
      status: WbsCriteriaStatus;
      /** 평가기준이 설정된 WBS 수 */
      wbsWithCriteriaCount: number;
    };
    /** 평가기준 제출 상태 */
    criteriaSubmission: {
      /** 평가기준 제출 여부 */
      isSubmitted: boolean;
      /** 평가기준 제출 일시 */
      submittedAt?: Date | null;
      /** 평가기준 제출 처리자 ID */
      submittedBy?: string | null;
    };
  };

  /** 성과 입력 정보 */
  performanceInput: {
    /** 성과 입력 상태 */
    status: PerformanceInputStatus;
    /** 전체 WBS 수 */
    totalWbsCount: number;
    /** 성과가 입력된 WBS 수 */
    inputCompletedCount: number;
  };

  /** 자기평가 진행 정보 */
  selfEvaluation: {
    /** 자기평가 진행 상태 (재작성 요청 상태 포함) */
    status:
      | SelfEvaluationStatus
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 전체 WBS 자기평가 매핑 수 */
    totalMappingCount: number;
    /** 완료된 WBS 자기평가 수 */
    completedMappingCount: number;
    /** 피평가자가 1차 평가자에게 자기평가 제출 완료 여부 */
    isSubmittedToEvaluator: boolean;
    /** 1차 평가자가 관리자에게 자기평가 제출 완료 여부 */
    isSubmittedToManager: boolean;
    /** 가중치 기반 자기평가 총점 (0-100) */
    totalScore: number | null;
    /** 평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등) */
    grade: string | null;
  };

  /** 하향평가 진행 정보 */
  downwardEvaluation: {
    /** 1차 평가 정보 (1명) */
    primary: {
      /** 평가자 정보 */
      evaluator: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentName?: string;
        rankName?: string;
      } | null;
      /** 하향평가 통합 상태 (진행 상태 + 승인 상태) */
      status:
        | DownwardEvaluationStatus
        | 'pending'
        | 'approved'
        | 'revision_requested'
        | 'revision_completed';
      /** 할당된 WBS 수 */
      assignedWbsCount: number;
      /** 완료된 하향평가 수 */
      completedEvaluationCount: number;
      /** 모든 하향평가가 제출되었는지 여부 */
      isSubmitted: boolean;
      /** 가중치 기반 1차 하향평가 총점 (0-100) */
      totalScore: number | null;
      /** 평가기간 등급 기준에 따른 1차 하향평가 등급 (예: S+, A-, B 등) */
      grade: string | null;
    };
    /** 2차 평가 정보 (여러 명 가능) */
    secondary: {
      /** 2차 평가 전체 통합 상태 (모든 평가자 통합) */
      status:
        | DownwardEvaluationStatus
        | 'pending'
        | 'approved'
        | 'revision_requested'
        | 'revision_completed';
      /** 2차 평가자 목록 */
      evaluators: Array<{
        /** 평가자 정보 */
        evaluator: {
          id: string;
          name: string;
          employeeNumber: string;
          email: string;
          departmentName?: string;
          rankName?: string;
        };
        /** 하향평가 통합 상태 (진행 상태 + 승인 상태) */
        status:
          | DownwardEvaluationStatus
          | 'pending'
          | 'approved'
          | 'revision_requested'
          | 'revision_completed';
        /** 할당된 WBS 수 */
        assignedWbsCount: number;
        /** 완료된 하향평가 수 */
        completedEvaluationCount: number;
        /** 모든 하향평가가 제출되었는지 여부 */
        isSubmitted: boolean;
      }>;
      /** 모든 2차 평가자가 제출했는지 통합 상태 */
      isSubmitted: boolean;
      /** 가중치 기반 2차 하향평가 총점 (0-100) */
      totalScore: number | null;
      /** 평가기간 등급 기준에 따른 2차 하향평가 등급 (예: S+, A-, B 등) */
      grade: string | null;
    };
  };

  /** 동료평가 진행 정보 */
  peerEvaluation: {
    /** 동료평가 진행 상태 */
    status: PeerEvaluationStatus;
    /** 총 동료평가 요청 수 */
    totalRequestCount: number;
    /** 완료된 동료평가 수 */
    completedRequestCount: number;
  };

  /** 최종평가 정보 */
  finalEvaluation: {
    /** 최종평가 진행 상태 */
    status: FinalEvaluationStatus;
    /** 평가등급 (S, A, B, C, D 등) */
    evaluationGrade: string | null;
    /** 직무등급 (T1, T2, T3) */
    jobGrade: string | null;
    /** 직무 상세등급 (u, n, a) */
    jobDetailedGrade: string | null;
    /** 확정 여부 */
    isConfirmed: boolean;
    /** 확정일시 */
    confirmedAt: Date | null;
  };

  /** 단계별 확인 상태 정보 */
  stepApproval: {
    /** 평가기준 설정 확인 상태 */
    criteriaSettingStatus:
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 평가기준 설정 승인자 ID */
    criteriaSettingApprovedBy: string | null;
    /** 평가기준 설정 승인 일시 */
    criteriaSettingApprovedAt: Date | null;
    /** 자기평가 확인 상태 */
    selfEvaluationStatus:
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 자기평가 승인자 ID */
    selfEvaluationApprovedBy: string | null;
    /** 자기평가 승인 일시 */
    selfEvaluationApprovedAt: Date | null;
    /** 1차 하향평가 확인 상태 */
    primaryEvaluationStatus:
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 1차 하향평가 승인자 ID */
    primaryEvaluationApprovedBy: string | null;
    /** 1차 하향평가 승인 일시 */
    primaryEvaluationApprovedAt: Date | null;
    /** 2차 하향평가 확인 상태 (평가자별) */
    secondaryEvaluationStatuses: {
      /** 평가자 ID */
      evaluatorId: string;
      /** 평가자 이름 */
      evaluatorName: string;
      /** 평가자 사번 */
      evaluatorEmployeeNumber: string;
      /** 평가자 이메일 */
      evaluatorEmail: string;
      /** 확인 상태 */
      status:
        | 'pending'
        | 'approved'
        | 'revision_requested'
        | 'revision_completed';
      /** 승인자 ID */
      approvedBy: string | null;
      /** 승인 일시 */
      approvedAt: Date | null;
      /** 재작성 요청 ID */
      revisionRequestId: string | null;
      /** 재작성 요청 코멘트 */
      revisionComment: string | null;
      /** 재작성 완료 여부 */
      isRevisionCompleted: boolean;
      /** 재작성 완료 일시 */
      revisionCompletedAt: Date | null;
      /** 재작성 완료 응답 코멘트 */
      responseComment: string | null;
    }[];
    /** 2차 하향평가 확인 상태 (최종 상태, 모든 평가자 완료 여부 기반, 하위 호환성) */
    secondaryEvaluationStatus:
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
    /** 2차 하향평가 승인자 ID (하위 호환성) */
    secondaryEvaluationApprovedBy: string | null;
    /** 2차 하향평가 승인 일시 (하위 호환성) */
    secondaryEvaluationApprovedAt: Date | null;
  };
}

/**
 * 대시보드 컨텍스트 인터페이스
 */
export interface IDashboardContext {
  /**
   * 직원의 평가기간 현황을 조회한다
   */
  직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null>;

  /**
   * 평가기간의 모든 피평가자 현황을 조회한다 (제외된 직원 제외)
   */
  평가기간의_모든_피평가자_현황을_조회한다(
    evaluationPeriodId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]>;

  /**
   * 내가 담당하는 평가 대상자 현황을 조회한다
   */
  내가_담당하는_평가대상자_현황을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusDto[]>;
}

// ==================== 평가자 관점의 타입 정의 ====================

/**
 * 내가 담당하는 하향평가 현황
 */
export interface MyDownwardEvaluationStatus {
  /**
   * 1차 평가자 여부
   */
  isPrimary: boolean;

  /**
   * 2차 평가자 여부
   */
  isSecondary: boolean;

  /**
   * 1차와 2차 평가의 통합 상태
   * - none, none = none
   * - none, in_progress = in_progress
   * - in_progress, in_progress = in_progress
   * - in_progress, complete = complete
   * - complete, complete = complete
   */
  status: 'none' | 'in_progress' | 'complete';

  /**
   * 1차 평가 현황 (1차 평가자인 경우에만 제공)
   */
  primaryStatus: {
    /**
     * 평가 상태
     */
    status: 'none' | 'in_progress' | 'complete';

    /**
     * 평가 대상 WBS 수
     */
    assignedWbsCount: number;

    /**
     * 완료된 평가 수
     */
    completedEvaluationCount: number;

    /**
     * 가중치 기반 1차 하향평가 총점 (0-100)
     */
    totalScore: number | null;

    /**
     * 평가기간 등급 기준에 따른 1차 하향평가 등급 (예: S, A, B, C, D, F 등)
     */
    grade: string | null;
  } | null;

  /**
   * 2차 평가 현황 (2차 평가자인 경우에만 제공)
   */
  secondaryStatus: {
    /**
     * 평가 상태
     */
    status: 'none' | 'in_progress' | 'complete';

    /**
     * 평가 대상 WBS 수
     */
    assignedWbsCount: number;

    /**
     * 완료된 평가 수
     */
    completedEvaluationCount: number;

    /**
     * 가중치 기반 2차 하향평가 총점 (0-100)
     */
    totalScore: number | null;

    /**
     * 평가기간 등급 기준에 따른 2차 하향평가 등급 (예: S, A, B, C, D, F 등)
     */
    grade: string | null;

    /**
     * 2차 평가자가 1차평가 제출을 확인했는지 여부
     */
    primaryEvaluationViewed: boolean;
  } | null;
}

/**
 * 내가 담당하는 평가 대상자 현황
 */
export interface MyEvaluationTargetStatusDto {
  /**
   * 피평가자 ID
   */
  employeeId: string;

  /**
   * 평가 대상 여부
   */
  isEvaluationTarget: boolean;

  /**
   * 평가 대상 제외 정보
   */
  exclusionInfo: {
    isExcluded: boolean;
    excludeReason: string | null;
    excludedAt: Date | null;
  };

  /**
   * 평가항목 설정 정보
   */
  evaluationCriteria: {
    status: EvaluationCriteriaStatus;
    assignedProjectCount: number;
    assignedWbsCount: number;
  };

  /**
   * WBS 평가기준 설정 정보
   */
  wbsCriteria: {
    status: WbsCriteriaStatus;
    wbsWithCriteriaCount: number;
  };

  /**
   * 평가라인 지정 정보
   */
  evaluationLine: {
    status: EvaluationLineStatus;
    hasPrimaryEvaluator: boolean;
    hasSecondaryEvaluator: boolean;
  };

  /**
   * 평가기준 설정 통합 상태
   * (evaluationCriteria, wbsCriteria 상태 + 제출/승인 상태 통합)
   */
  setup: {
    status:
      | 'none'
      | 'in_progress'
      | 'pending'
      | 'approved'
      | 'revision_requested'
      | 'revision_completed';
  };

  /**
   * 성과 입력 정보
   */
  performanceInput: {
    status: PerformanceInputStatus;
    totalWbsCount: number;
    inputCompletedCount: number;
  };

  /**
   * 내가 담당하는 평가자 유형 목록
   */
  myEvaluatorTypes: string[];

  /**
   * 자기평가 제출 상태
   * 피평가자가 1차 평가자에게 자기평가를 제출했는지 여부
   */
  selfEvaluation: {
    /** 자기평가 진행 상태 */
    status: SelfEvaluationStatus;
    /** 전체 WBS 자기평가 매핑 수 */
    totalMappingCount: number;
    /** 완료된 WBS 자기평가 수 */
    completedMappingCount: number;
    /** 전체 WBS 자기평가 매핑 수 (totalMappingCount와 동일) */
    totalSelfEvaluations: number;
    /** 1차 평가자에게 제출된 자기평가 수 */
    submittedToEvaluatorCount: number;
    /** 모든 자기평가가 1차 평가자에게 제출되었는지 여부 */
    isSubmittedToEvaluator: boolean;
    /** 관리자에게 제출된 자기평가 수 */
    submittedToManagerCount: number;
    /** 모든 자기평가가 관리자에게 제출되었는지 여부 */
    isSubmittedToManager: boolean;
    /** 가중치 기반 자기평가 총점 (0-100) */
    totalScore: number | null;
    /** 평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등) */
    grade: string | null;
    /** 1차 평가자가 제출된 자기평가를 확인했는지 여부 */
    viewedByPrimaryEvaluator: boolean;
    /** 2차 평가자가 제출된 자기평가를 확인했는지 여부 */
    viewedBySecondaryEvaluator: boolean;
  };

  /**
   * 내가 담당하는 하향평가 현황
   */
  downwardEvaluation: MyDownwardEvaluationStatus;
}
