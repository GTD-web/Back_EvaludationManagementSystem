import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProjectManager } from './project-manager.entity';
import {
  CreateProjectManagerDto,
  UpdateProjectManagerDto,
  ProjectManagerDto,
  ProjectManagerListOptions,
} from './project-manager.types';

/**
 * 프로젝트 매니저 도메인 서비스
 * 
 * PM으로 지정 가능한 직원 목록을 관리합니다.
 */
@Injectable()
export class ProjectManagerService {
  constructor(
    @InjectRepository(ProjectManager)
    private readonly projectManagerRepository: Repository<ProjectManager>,
  ) {}

  /**
   * 새로운 PM을 추가한다
   */
  async 생성한다(
    data: CreateProjectManagerDto,
    createdBy: string,
  ): Promise<ProjectManagerDto> {
    // 중복 체크
    const existing = await this.projectManagerRepository.findOne({
      where: { managerId: data.managerId },
    });

    if (existing) {
      throw new ConflictException(
        `이미 등록된 매니저 ID입니다: ${data.managerId}`,
      );
    }

    const manager = ProjectManager.생성한다(data, createdBy);
    const saved = await this.projectManagerRepository.save(manager);
    return saved.DTO로_변환한다();
  }

  /**
   * PM 목록을 조회한다
   */
  async 목록_조회한다(
    options: ProjectManagerListOptions = {},
  ): Promise<{
    managers: ProjectManagerDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.projectManagerRepository.createQueryBuilder('pm');

    // 삭제된 레코드 포함 여부 (기본값: false)
    if (!options.filter?.includeDeleted) {
      queryBuilder.where('pm.deletedAt IS NULL');
    }

    // 필터 적용
    if (options.filter?.isActive !== undefined) {
      queryBuilder.andWhere('pm.isActive = :isActive', {
        isActive: options.filter.isActive,
      });
    }

    if (options.filter?.search) {
      queryBuilder.andWhere(
        '(pm.name LIKE :search OR pm.email LIKE :search OR pm.employeeNumber LIKE :search)',
        { search: `%${options.filter.search}%` },
      );
    }

    // 정렬 및 페이징
    queryBuilder.orderBy('pm.name', 'ASC').skip(skip).take(limit);

    const [managers, total] = await queryBuilder.getManyAndCount();

    return {
      managers: managers.map((m) => m.DTO로_변환한다()),
      total,
      page,
      limit,
    };
  }

  /**
   * ID로 PM을 조회한다
   */
  async ID로_조회한다(id: string): Promise<ProjectManagerDto | null> {
    const manager = await this.projectManagerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return manager ? manager.DTO로_변환한다() : null;
  }

  /**
   * managerId로 PM을 조회한다
   */
  async managerId로_조회한다(
    managerId: string,
  ): Promise<ProjectManagerDto | null> {
    const manager = await this.projectManagerRepository.findOne({
      where: { managerId, deletedAt: IsNull() },
    });

    return manager ? manager.DTO로_변환한다() : null;
  }

  /**
   * PM 정보를 수정한다
   */
  async 수정한다(
    id: string,
    data: UpdateProjectManagerDto,
    updatedBy: string,
  ): Promise<ProjectManagerDto> {
    const manager = await this.projectManagerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!manager) {
      throw new NotFoundException(`ID ${id}에 해당하는 PM을 찾을 수 없습니다.`);
    }

    manager.업데이트한다(data, updatedBy);
    const saved = await this.projectManagerRepository.save(manager);
    return saved.DTO로_변환한다();
  }

  /**
   * PM을 삭제한다 (소프트 삭제)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    const manager = await this.projectManagerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!manager) {
      throw new NotFoundException(`ID ${id}에 해당하는 PM을 찾을 수 없습니다.`);
    }

    manager.삭제한다(deletedBy);
    await this.projectManagerRepository.save(manager);
  }

  /**
   * 활성화된 모든 PM의 managerId 목록을 조회한다
   */
  async 활성화된_managerId_목록_조회한다(): Promise<string[]> {
    const managers = await this.projectManagerRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      select: ['managerId'],
    });

    return managers.map((m) => m.managerId);
  }

  /**
   * managerId로 PM을 조회한다 (삭제된 레코드 포함)
   */
  async managerId로_조회한다_삭제포함(
    managerId: string,
  ): Promise<ProjectManagerDto | null> {
    const manager = await this.projectManagerRepository.findOne({
      where: { managerId },
    });

    return manager ? manager.DTO로_변환한다() : null;
  }

  /**
   * managerId로 PM 정보를 수정한다
   */
  async managerId로_수정한다(
    managerId: string,
    data: UpdateProjectManagerDto,
    updatedBy: string,
  ): Promise<ProjectManagerDto> {
    const manager = await this.projectManagerRepository.findOne({
      where: { managerId, deletedAt: IsNull() },
    });

    if (!manager) {
      throw new NotFoundException(
        `매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`,
      );
    }

    manager.업데이트한다(data, updatedBy);
    const saved = await this.projectManagerRepository.save(manager);
    return saved.DTO로_변환한다();
  }

  /**
   * managerId로 PM을 삭제한다 (소프트 삭제)
   */
  async managerId로_삭제한다(
    managerId: string,
    deletedBy: string,
  ): Promise<void> {
    const manager = await this.projectManagerRepository.findOne({
      where: { managerId, deletedAt: IsNull() },
    });

    if (!manager) {
      throw new NotFoundException(
        `매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`,
      );
    }

    manager.삭제한다(deletedBy);
    await this.projectManagerRepository.save(manager);
  }

  /**
   * soft delete된 PM을 복구한다
   */
  async managerId로_복구한다(
    managerId: string,
    restoredBy: string,
  ): Promise<ProjectManagerDto> {
    const manager = await this.projectManagerRepository.findOne({
      where: { managerId },
    });

    if (!manager) {
      throw new NotFoundException(
        `매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`,
      );
    }

    // soft delete 복구
    manager.deletedAt = undefined;
    manager.updatedBy = restoredBy;

    const saved = await this.projectManagerRepository.save(manager);
    return saved.DTO로_변환한다();
  }
}

