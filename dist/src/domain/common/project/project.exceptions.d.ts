import { ConflictException } from '@nestjs/common';
export declare class ProjectHasAssignmentsException extends ConflictException {
    constructor(projectId: string, assignmentCount: number);
}
