import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProjectImportance } from './project-importance.entity';
import {
  ProjectImportanceDto,
  CreateProjectImportanceDto,
  UpdateProjectImportanceDto,
} from './project-importance.types';

/**
 * 프로젝트 중요도 도메인 서비스
 */
@Injectable()
export class ProjectImportanceService {
  constructor(
    @InjectRepository(ProjectImportance)
    private readonly importanceRepository: Repository<ProjectImportance>,
  ) {}

  /**
   * 새로운 프로젝트 중요도를 생성한다
   */
  async 생성한다(
    data: CreateProjectImportanceDto,
    createdBy: string,
  ): Promise<ProjectImportanceDto> {
    // 중복 코드 확인
    const existing = await this.importanceRepository.findOne({
      where: { code: data.code, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ConflictException(
        `중요도 코드 '${data.code}'는 이미 사용 중입니다.`,
      );
    }

    const importance = ProjectImportance.생성한다(data, createdBy);
    const saved = await this.importanceRepository.save(importance);
    return saved.DTO로_변환한다();
  }

  /**
   * 프로젝트 중요도 목록을 조회한다 (활성 중요도만)
   */
  async 목록_조회한다(): Promise<ProjectImportanceDto[]> {
    const importances = await this.importanceRepository.find({
      where: {
        deletedAt: IsNull(),
        isActive: true,
      },
      order: {
        displayOrder: 'ASC',
        code: 'ASC',
      },
    });

    return importances.map((i) => i.DTO로_변환한다());
  }

  /**
   * ID로 프로젝트 중요도를 조회한다
   */
  async ID로_조회한다(id: string): Promise<ProjectImportanceDto | null> {
    const importance = await this.importanceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!importance) {
      return null;
    }

    return importance.DTO로_변환한다();
  }

  /**
   * 프로젝트 중요도를 수정한다
   */
  async 수정한다(
    id: string,
    data: UpdateProjectImportanceDto,
    updatedBy: string,
  ): Promise<ProjectImportanceDto> {
    const importance = await this.importanceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!importance) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트 중요도를 찾을 수 없습니다.`,
      );
    }

    // 코드 변경 시 중복 확인
    if (data.code && data.code !== importance.code) {
      const existing = await this.importanceRepository.findOne({
        where: { code: data.code, deletedAt: IsNull() },
      });

      if (existing) {
        throw new ConflictException(
          `중요도 코드 '${data.code}'는 이미 사용 중입니다.`,
        );
      }
    }

    importance.업데이트한다(data, updatedBy);
    const saved = await this.importanceRepository.save(importance);
    return saved.DTO로_변환한다();
  }

  /**
   * 프로젝트 중요도를 삭제한다 (소프트 삭제)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    const importance = await this.importanceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!importance) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트 중요도를 찾을 수 없습니다.`,
      );
    }

    importance.deletedAt = new Date();
    await this.importanceRepository.save(importance);
  }

  /**
   * 기본 중요도 값들을 생성한다 (시드 데이터용)
   */
  async 기본값_생성한다(createdBy: string): Promise<void> {
    const defaultImportances = [
      { code: '1A', name: '1A', displayOrder: 1 },
      { code: '1B', name: '1B', displayOrder: 2 },
      { code: '2A', name: '2A', displayOrder: 3 },
      { code: '2B', name: '2B', displayOrder: 4 },
      { code: '3A', name: '3A', displayOrder: 5 },
    ];

    for (const data of defaultImportances) {
      const existing = await this.importanceRepository.findOne({
        where: { code: data.code, deletedAt: IsNull() },
      });

      if (!existing) {
        const importance = ProjectImportance.생성한다(data, createdBy);
        await this.importanceRepository.save(importance);
      }
    }
  }
}

