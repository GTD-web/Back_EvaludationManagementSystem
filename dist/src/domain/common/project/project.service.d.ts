import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectDto, ProjectFilter, ProjectListOptions, ProjectStatus } from './project.types';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
export declare class ProjectService {
    private readonly projectRepository;
    private readonly evaluationProjectAssignmentRepository;
    constructor(projectRepository: Repository<Project>, evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>);
    생성한다(data: CreateProjectDto, createdBy: string): Promise<ProjectDto>;
    private 하위_프로젝트들_생성한다;
    일괄_생성한다(dataList: CreateProjectDto[], createdBy: string): Promise<{
        success: ProjectDto[];
        failed: Array<{
            index: number;
            data: CreateProjectDto;
            error: string;
        }>;
    }>;
    수정한다(id: string, data: UpdateProjectDto, updatedBy: string): Promise<ProjectDto>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    private 최상단_프로젝트_조회한다;
    private 모든_하위_프로젝트_조회한다;
    ID로_조회한다(id: string, includeChildren?: boolean): Promise<ProjectDto | null>;
    프로젝트코드로_조회한다(projectCode: string): Promise<ProjectDto | null>;
    프로젝트명으로_조회한다(name: string): Promise<ProjectDto | null>;
    필터_조회한다(filter: ProjectFilter): Promise<ProjectDto[]>;
    목록_조회한다(options?: ProjectListOptions): Promise<{
        projects: ProjectDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    전체_조회한다(): Promise<ProjectDto[]>;
    활성_조회한다(): Promise<ProjectDto[]>;
    매니저별_조회한다(managerId: string): Promise<ProjectDto[]>;
    존재하는가(id: string): Promise<boolean>;
    프로젝트코드가_존재하는가(projectCode: string, excludeId?: string): Promise<boolean>;
    상태_변경한다(id: string, status: ProjectStatus, updatedBy: string): Promise<ProjectDto>;
    완료_처리한다(id: string, updatedBy: string): Promise<ProjectDto>;
    취소_처리한다(id: string, updatedBy: string): Promise<ProjectDto>;
    하위_프로젝트_목록_조회한다(parentProjectId: string, depth?: number, maxDepth?: number): Promise<ProjectDto[]>;
    하위_프로젝트_수를_조회한다(parentProjectId: string): Promise<number>;
    계층구조_목록_조회한다(options?: ProjectListOptions): Promise<{
        projects: ProjectDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    하위_프로젝트들_일괄_삭제한다(forceDelete: boolean | undefined, hardDelete: boolean | undefined, deletedBy: string): Promise<{
        deletedCount: number;
        deleteType: 'soft' | 'hard';
        assignmentCheckPerformed: boolean;
        deletedProjects: Array<{
            id: string;
            name: string;
            projectCode: string;
            parentProjectId: string | null;
        }>;
        executionTimeSeconds: number;
    }>;
}
