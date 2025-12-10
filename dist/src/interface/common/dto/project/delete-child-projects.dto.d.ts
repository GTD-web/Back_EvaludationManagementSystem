export declare class DeleteChildProjectsDto {
    forceDelete?: boolean;
    hardDelete?: boolean;
}
export declare class DeleteChildProjectsResultDto {
    deletedCount: number;
    deleteType: 'soft' | 'hard';
    assignmentCheckPerformed: boolean;
    deletedProjects: Array<{
        id: string;
        name: string;
        projectCode: string;
        parentProjectId: string | null;
    }>;
    executionTimeSeconds: number;
}
