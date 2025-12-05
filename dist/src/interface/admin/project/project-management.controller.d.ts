import { ProjectService } from '@domain/common/project/project.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CreateProjectDto, CreateProjectsBulkDto, UpdateProjectDto, GetProjectListQueryDto, GetProjectManagersQueryDto, ProjectResponseDto, ProjectListResponseDto, ProjectManagerListResponseDto, ProjectsBulkCreateResponseDto } from '@interface/common/dto/project/project.dto';
import type { ISSOService } from '@domain/common/sso/interfaces';
export declare class ProjectManagementController {
    private readonly projectService;
    private readonly ssoService;
    constructor(projectService: ProjectService, ssoService: ISSOService);
    createProject(createDto: CreateProjectDto, user: AuthenticatedUser): Promise<ProjectResponseDto>;
    createProjectsBulk(bulkDto: CreateProjectsBulkDto, user: AuthenticatedUser): Promise<ProjectsBulkCreateResponseDto>;
    getProjectList(query: GetProjectListQueryDto): Promise<ProjectListResponseDto>;
    getProjectManagers(query: GetProjectManagersQueryDto): Promise<ProjectManagerListResponseDto>;
    getProjectDetail(id: string): Promise<ProjectResponseDto>;
    updateProject(id: string, updateDto: UpdateProjectDto, user: AuthenticatedUser): Promise<ProjectResponseDto>;
    deleteProject(id: string, user: AuthenticatedUser): Promise<void>;
}
