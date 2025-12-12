import { ProjectService } from '@domain/common/project/project.service';
import { GetProjectListQueryDto, ProjectResponseDto, ProjectListResponseDto } from '@interface/common/dto/project/project.dto';
export declare class UserProjectManagementController {
    private readonly projectService;
    constructor(projectService: ProjectService);
    getProjectList(query: GetProjectListQueryDto): Promise<ProjectListResponseDto>;
    getProjectDetail(id: string): Promise<ProjectResponseDto>;
    private mapProjectToResponseDto;
}
