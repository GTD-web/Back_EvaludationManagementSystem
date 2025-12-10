import { ProjectService } from '@domain/common/project/project.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CreateProjectDto, CreateProjectsBulkDto, UpdateProjectDto, GetProjectListQueryDto, GetProjectManagersQueryDto, ProjectResponseDto, ProjectListResponseDto, ProjectManagerListResponseDto, ProjectsBulkCreateResponseDto } from '@interface/common/dto/project/project.dto';
import { GenerateChildProjectsDto, GenerateChildProjectsResultDto } from '@interface/common/dto/project/generate-child-projects.dto';
import { DeleteChildProjectsDto, DeleteChildProjectsResultDto } from '@interface/common/dto/project/delete-child-projects.dto';
import type { ISSOService } from '@domain/common/sso/interfaces';
import { EmployeeService } from '@domain/common/employee/employee.service';
export declare class ProjectManagementController {
    private readonly projectService;
    private readonly ssoService;
    private readonly employeeService;
    constructor(projectService: ProjectService, ssoService: ISSOService, employeeService: EmployeeService);
    createProject(createDto: CreateProjectDto, user: AuthenticatedUser): Promise<ProjectResponseDto>;
    createProjectsBulk(bulkDto: CreateProjectsBulkDto, user: AuthenticatedUser): Promise<ProjectsBulkCreateResponseDto>;
    private mapProjectToResponseDto;
    getProjectList(query: GetProjectListQueryDto): Promise<ProjectListResponseDto>;
    getProjectManagers(query: GetProjectManagersQueryDto): Promise<ProjectManagerListResponseDto>;
    getProjectDetail(id: string): Promise<ProjectResponseDto>;
    updateProject(id: string, updateDto: UpdateProjectDto, user: AuthenticatedUser): Promise<ProjectResponseDto>;
    deleteProject(id: string, user: AuthenticatedUser): Promise<void>;
    generateChildProjects(dto: GenerateChildProjectsDto, user: AuthenticatedUser): Promise<GenerateChildProjectsResultDto>;
    deleteChildProjects(dto: DeleteChildProjectsDto, user: AuthenticatedUser): Promise<DeleteChildProjectsResultDto>;
}
