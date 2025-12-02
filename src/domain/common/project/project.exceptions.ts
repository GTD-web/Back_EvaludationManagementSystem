import { ConflictException } from '@nestjs/common';

/**
 * 프로젝트에 할당이 존재하여 삭제할 수 없는 예외
 */
export class ProjectHasAssignmentsException extends ConflictException {
  constructor(projectId: string, assignmentCount: number) {
    super(
      `프로젝트에 ${assignmentCount}개의 할당이 존재하여 삭제할 수 없습니다. 프로젝트 ID: ${projectId}`,
    );
    this.name = 'ProjectHasAssignmentsException';
  }
}

