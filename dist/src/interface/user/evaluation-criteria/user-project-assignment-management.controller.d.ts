import { ProjectAssignmentBusinessService } from '@business/project-assignment/project-assignment-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AvailableProjectsResponseDto, CancelProjectAssignmentByProjectDto, ChangeProjectAssignmentOrderByProjectDto, CreateProjectAssignmentDto, GetAvailableProjectsQueryDto, ProjectAssignmentResponseDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
export declare class UserProjectAssignmentManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly projectAssignmentBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, projectAssignmentBusinessService: ProjectAssignmentBusinessService);
    createProjectAssignment(createDto: CreateProjectAssignmentDto, user: AuthenticatedUser): Promise<any>;
    getAvailableProjects(query: GetAvailableProjectsQueryDto): Promise<AvailableProjectsResponseDto>;
    cancelProjectAssignmentByProject(projectId: string, bodyDto: CancelProjectAssignmentByProjectDto, user: AuthenticatedUser): Promise<void>;
    changeProjectAssignmentOrderByProject(projectId: string, bodyDto: ChangeProjectAssignmentOrderByProjectDto, user: AuthenticatedUser): Promise<ProjectAssignmentResponseDto>;
}
