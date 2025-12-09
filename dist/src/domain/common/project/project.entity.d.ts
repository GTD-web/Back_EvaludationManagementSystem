import { BaseEntity } from '@libs/database/base/base.entity';
import { ProjectStatus, ProjectDto, CreateProjectDto, UpdateProjectDto } from './project.types';
import { IProject } from './project.interface';
export declare class Project extends BaseEntity<ProjectDto> implements IProject {
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    parentProjectId?: string;
    constructor(name?: string, projectCode?: string, status?: ProjectStatus, startDate?: Date, endDate?: Date, managerId?: string, parentProjectId?: string);
    DTO로_변환한다(): ProjectDto;
    static 생성한다(data: CreateProjectDto, createdBy: string): Project;
    업데이트한다(data: UpdateProjectDto, updatedBy: string): void;
    삭제한다(deletedBy: string): void;
}
