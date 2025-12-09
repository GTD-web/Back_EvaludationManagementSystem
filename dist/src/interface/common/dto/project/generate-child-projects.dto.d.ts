export declare class GenerateChildProjectsDto {
    childCountPerProject?: number;
    skipIfExists?: boolean;
}
export declare class GenerateChildProjectsResultDto {
    success: boolean;
    processedParentProjects: number;
    skippedParentProjects: number;
    totalChildProjectsCreated: number;
    failedChildProjects: number;
    details?: GenerateChildProjectDetailDto[];
    errors?: string[];
    duration: number;
}
export declare class GenerateChildProjectDetailDto {
    parentProjectId: string;
    parentProjectName: string;
    childrenCreated: number;
    skipped: boolean;
    errors?: string[];
}
