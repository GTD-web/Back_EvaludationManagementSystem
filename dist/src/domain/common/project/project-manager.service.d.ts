import { Repository } from 'typeorm';
import { ProjectManager } from './project-manager.entity';
import { CreateProjectManagerDto, UpdateProjectManagerDto, ProjectManagerDto, ProjectManagerListOptions } from './project-manager.types';
export declare class ProjectManagerService {
    private readonly projectManagerRepository;
    constructor(projectManagerRepository: Repository<ProjectManager>);
    생성한다(data: CreateProjectManagerDto, createdBy: string): Promise<ProjectManagerDto>;
    목록_조회한다(options?: ProjectManagerListOptions): Promise<{
        managers: ProjectManagerDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    ID로_조회한다(id: string): Promise<ProjectManagerDto | null>;
    managerId로_조회한다(managerId: string): Promise<ProjectManagerDto | null>;
    수정한다(id: string, data: UpdateProjectManagerDto, updatedBy: string): Promise<ProjectManagerDto>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    활성화된_managerId_목록_조회한다(): Promise<string[]>;
    managerId로_조회한다_삭제포함(managerId: string): Promise<ProjectManagerDto | null>;
    managerId로_수정한다(managerId: string, data: UpdateProjectManagerDto, updatedBy: string): Promise<ProjectManagerDto>;
    managerId로_삭제한다(managerId: string, deletedBy: string): Promise<void>;
    managerId로_복구한다(managerId: string, restoredBy: string): Promise<ProjectManagerDto>;
}
