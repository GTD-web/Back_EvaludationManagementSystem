export declare class SimplifiedEvaluationPeriodDto {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
}
export declare class SimplifiedEmployeeDto {
    id: string;
    name: string;
    employeeNumber: string;
}
export declare class ProjectManagerInfoDto {
    id: string;
    name: string;
}
export declare class EvaluatorInfoDto {
    evaluatorId: string;
    evaluatorName: string;
}
export declare class WbsEvaluationCriterionDto {
    criterionId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
}
export declare class AssignedWbsItemDto {
    wbsId: string;
    wbsName: string;
    wbsCode: string;
    criteria: WbsEvaluationCriterionDto[];
    primaryDownwardEvaluation?: EvaluatorInfoDto;
    secondaryDownwardEvaluation?: EvaluatorInfoDto;
}
export declare class AssignedProjectDto {
    projectId: string;
    projectName: string;
    projectCode: string;
    projectManager?: ProjectManagerInfoDto;
    wbsList: AssignedWbsItemDto[];
}
export declare class EmployeePeriodAssignmentsResponseDto {
    evaluationPeriod: SimplifiedEvaluationPeriodDto;
    employee: SimplifiedEmployeeDto;
    projects: AssignedProjectDto[];
    totalProjects: number;
    totalWbs: number;
}
