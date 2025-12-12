import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { AvailableProjectsResponseDto, GetAvailableProjectsQueryDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
export declare class UserProjectAssignmentManagementController {
    private readonly evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
    getAvailableProjects(query: GetAvailableProjectsQueryDto): Promise<AvailableProjectsResponseDto>;
}
