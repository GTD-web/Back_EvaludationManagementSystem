/**
 * 산출물 정보
 */
export interface DeliverableInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  filePath?: string;
  employeeId?: string;
  mappedDate?: Date;
  mappedBy?: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * 할당된 프로젝트 정보 (WBS 목록 포함)
 */
export interface AssignedProjectWithWbs {
  projectId: string;
  projectName: string;
  projectCode: string;
  grade?: '1A' | '1B' | '2A' | '2B' | '3A';
  priority?: number;
  assignedAt: Date;
  projectStartDate?: Date;
  projectEndDate?: Date;
  projectManager?: {
    id: string;
    name: string;
  } | null;
  realPM?: string;
  wbsList: AssignedWbsInfo[];
}

/**
 * WBS 평가기준 정보
 */
export interface WbsEvaluationCriterion {
  criterionId: string;
  criteria: string;
  importance: number;
  subProject?: string | null;
  isAdditional: boolean;
  createdAt: Date;
}

/**
 * WBS 성과 정보
 */
export interface WbsPerformance {
  performanceResult?: string;
  score?: number;
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * WBS 하향평가 정보
 */
export interface WbsDownwardEvaluationInfo {
  evaluatorId?: string;
  evaluatorName?: string;
  evaluationContent?: string;
  score?: number;
  isCompleted: boolean;
  submittedAt?: Date;
}

/**
 * 할당된 WBS 정보 (평가기준, 성과, 자기평가, 산출물 포함)
 */
export interface AssignedWbsInfo {
  wbsId: string;
  wbsName: string;
  wbsCode: string;
  weight: number;
  assignedAt: Date;
  criteria: WbsEvaluationCriterion[];
  performance?: WbsPerformance | null;
  subProject?: string | null;
  primaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
  secondaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
  deliverables: DeliverableInfo[];
}

/**
 * 평가기간 정보
 */
export interface EvaluationPeriodInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  currentPhase?: string;
  description?: string;
  criteriaSettingEnabled: boolean;
  selfEvaluationSettingEnabled: boolean;
  finalEvaluationSettingEnabled: boolean;
  maxSelfEvaluationRate: number;
}

/**
 * 직원 정보
 */
export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  departmentId: string;
  departmentName?: string;
  status?: '재직중' | '휴직중' | '퇴사';
}

/**
 * 사용자 할당 정보 조회 결과
 */
export interface EmployeeAssignedDataResult {
  evaluationPeriod: EvaluationPeriodInfo;
  employee: EmployeeInfo;
  projects: AssignedProjectWithWbs[];
  summary: {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
    selfEvaluation: {
      totalScore: number | null;
      grade: string | null;
      /** 전체 WBS 자기평가 수 */
      totalSelfEvaluations: number;
      /** 1차 평가자에게 제출된 자기평가 수 */
      submittedToEvaluatorCount: number;
      /** 관리자에게 제출된 자기평가 수 */
      submittedToManagerCount: number;
      /** 모든 자기평가가 1차 평가자에게 제출되었는지 여부 */
      isSubmittedToEvaluator: boolean;
      /** 모든 자기평가가 관리자에게 제출되었는지 여부 */
      isSubmittedToManager: boolean;
    };
    primaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
      isSubmitted: boolean;
    };
    secondaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
      isSubmitted: boolean;
      evaluators: Array<{
        evaluatorId: string;
        evaluatorName: string;
        evaluatorEmployeeNumber: string;
        evaluatorEmail: string;
        assignedWbsCount: number;
        completedEvaluationCount: number;
        isSubmitted: boolean;
      }>;
    };
    criteriaSubmission: {
      isSubmitted: boolean;
      submittedAt: Date | null;
      submittedBy: string | null;
    };
  };
}
