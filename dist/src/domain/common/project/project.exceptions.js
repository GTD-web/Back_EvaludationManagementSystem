"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectHasAssignmentsException = void 0;
const common_1 = require("@nestjs/common");
class ProjectHasAssignmentsException extends common_1.ConflictException {
    constructor(projectId, assignmentCount) {
        super(`프로젝트에 ${assignmentCount}개의 할당이 존재하여 삭제할 수 없습니다. 프로젝트 ID: ${projectId}`);
        this.name = 'ProjectHasAssignmentsException';
    }
}
exports.ProjectHasAssignmentsException = ProjectHasAssignmentsException;
//# sourceMappingURL=project.exceptions.js.map