export declare enum RevisionRequestStepEnum {
    CRITERIA = "criteria",
    SELF = "self",
    PRIMARY = "primary",
    SECONDARY = "secondary"
}
export declare class GetRevisionRequestsQueryDto {
    evaluationPeriodId?: string;
    employeeId?: string;
    requestedBy?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: RevisionRequestStepEnum;
}
