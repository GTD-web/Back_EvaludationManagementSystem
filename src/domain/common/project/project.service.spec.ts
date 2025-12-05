import { Test, TestingModule } from '@nestjs/testing';
import { Repository, IsNull } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { ProjectStatus } from './project.types';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let evaluationProjectAssignmentRepository: jest.Mocked<
    Repository<EvaluationProjectAssignment>
  >;

  const mockProject = {
    id: '1',
    name: '테스트 프로젝트',
    projectCode: 'TEST-001',
    status: ProjectStatus.ACTIVE,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    managerId: 'manager-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EvaluationProjectAssignment),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get(getRepositoryToken(Project));
    evaluationProjectAssignmentRepository = module.get(
      getRepositoryToken(EvaluationProjectAssignment),
    );
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('일괄_생성한다', () => {
    it('여러 프로젝트를 성공적으로 생성할 수 있다', async () => {
      // Given
      const projectsData = [
        {
          name: '프로젝트 1',
          projectCode: 'PROJ-001',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 2',
          projectCode: 'PROJ-002',
          status: ProjectStatus.ACTIVE,
        },
      ];

      const createdBy = 'user-001';

      // 중복 검사 - 중복 없음
      projectRepository.find.mockResolvedValue([]);

      // 프로젝트 저장 모킹
      projectRepository.save.mockImplementation((project: any) =>
        Promise.resolve({
          ...project,
          id: `id-${project.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any),
      );

      // ID로 조회 모킹 (manager 정보 포함)
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            id: 'test-id',
            name: '프로젝트 1',
            projectCode: 'PROJ-001',
            status: ProjectStatus.ACTIVE,
            startDate: null,
            endDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            managerId: null,
            manager_employee_id: null,
          });
        }),
      };
      projectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(projectRepository.save).toHaveBeenCalledTimes(2);
    });

    it('중복된 프로젝트 코드가 있는 경우 해당 항목은 실패 처리한다', async () => {
      // Given
      const projectsData = [
        {
          name: '프로젝트 1',
          projectCode: 'PROJ-001',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 2',
          projectCode: 'DUPLICATE',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 3',
          projectCode: 'PROJ-003',
          status: ProjectStatus.ACTIVE,
        },
      ];

      const createdBy = 'user-001';

      // 중복 검사 - DUPLICATE 코드가 이미 존재
      projectRepository.find.mockResolvedValue([
        {
          projectCode: 'DUPLICATE',
        } as Project,
      ]);

      // 프로젝트 저장 모킹
      projectRepository.save.mockImplementation((project: any) =>
        Promise.resolve({
          ...project,
          id: `id-${project.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any),
      );

      // ID로 조회 모킹
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            id: 'test-id',
            name: '프로젝트',
            projectCode: 'PROJ-001',
            status: ProjectStatus.ACTIVE,
            startDate: null,
            endDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            managerId: null,
            manager_employee_id: null,
          });
        }),
      };
      projectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(2); // 프로젝트 1, 3만 성공
      expect(result.failed).toHaveLength(1); // 프로젝트 2 실패
      expect(result.failed[0].index).toBe(1);
      expect(result.failed[0].data.projectCode).toBe('DUPLICATE');
      expect(result.failed[0].error).toContain('이미 사용 중입니다');
    });

    it('프로젝트 생성 중 오류 발생 시 해당 항목만 실패 처리한다', async () => {
      // Given
      const projectsData = [
        {
          name: '프로젝트 1',
          projectCode: 'PROJ-001',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 2',
          projectCode: 'PROJ-002',
          status: ProjectStatus.ACTIVE,
        },
      ];

      const createdBy = 'user-001';

      // 중복 검사 - 중복 없음
      projectRepository.find.mockResolvedValue([]);

      // 첫 번째 프로젝트는 성공, 두 번째는 실패
      projectRepository.save
        .mockResolvedValueOnce({
          id: 'id-1',
          name: '프로젝트 1',
          projectCode: 'PROJ-001',
          status: ProjectStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .mockRejectedValueOnce(new Error('데이터베이스 오류'));

      // ID로 조회 모킹 (첫 번째 프로젝트만)
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: 'id-1',
          name: '프로젝트 1',
          projectCode: 'PROJ-001',
          status: ProjectStatus.ACTIVE,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          managerId: null,
          manager_employee_id: null,
        }),
      };
      projectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].index).toBe(1);
      expect(result.failed[0].error).toContain('데이터베이스 오류');
    });

    it('빈 배열을 전달하면 빈 결과를 반환한다', async () => {
      // Given
      const projectsData: any[] = [];
      const createdBy = 'user-001';

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(projectRepository.find).not.toHaveBeenCalled();
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('프로젝트 코드가 없는 프로젝트도 생성할 수 있다', async () => {
      // Given
      const projectsData = [
        {
          name: '프로젝트 1',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 2',
          projectCode: 'PROJ-002',
          status: ProjectStatus.ACTIVE,
        },
      ];

      const createdBy = 'user-001';

      // 중복 검사 - PROJ-002만 검사
      projectRepository.find.mockResolvedValue([]);

      // 프로젝트 저장 모킹
      projectRepository.save.mockImplementation((project: any) =>
        Promise.resolve({
          ...project,
          id: `id-${project.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any),
      );

      // ID로 조회 모킹
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            id: 'test-id',
            name: '프로젝트',
            projectCode: null,
            status: ProjectStatus.ACTIVE,
            startDate: null,
            endDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            managerId: null,
            manager_employee_id: null,
          });
        }),
      };
      projectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      // projectCode가 있는 것만 중복 검사
      expect(projectRepository.find).toHaveBeenCalledWith({
        where: [{ projectCode: 'PROJ-002', deletedAt: IsNull() }],
      });
    });

    it('모든 프로젝트 생성이 실패하는 경우를 처리할 수 있다', async () => {
      // Given
      const projectsData = [
        {
          name: '프로젝트 1',
          projectCode: 'DUP-001',
          status: ProjectStatus.ACTIVE,
        },
        {
          name: '프로젝트 2',
          projectCode: 'DUP-002',
          status: ProjectStatus.ACTIVE,
        },
      ];

      const createdBy = 'user-001';

      // 모두 중복
      projectRepository.find.mockResolvedValue([
        { projectCode: 'DUP-001' } as Project,
        { projectCode: 'DUP-002' } as Project,
      ]);

      // When
      const result = await service.일괄_생성한다(projectsData, createdBy);

      // Then
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
      expect(projectRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('생성한다', () => {
    it('프로젝트를 성공적으로 생성할 수 있다', async () => {
      // Given
      const createData = {
        name: '테스트 프로젝트',
        projectCode: 'TEST-001',
        status: ProjectStatus.ACTIVE,
      };
      const createdBy = 'user-001';

      projectRepository.findOne.mockResolvedValue(null); // 중복 없음
      projectRepository.save.mockResolvedValue({
        ...createData,
        id: '1',
      } as any);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: '1',
          ...createData,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          managerId: null,
          manager_employee_id: null,
        }),
      };
      projectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.생성한다(createData, createdBy);

      // Then
      expect(result).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(projectRepository.save).toHaveBeenCalled();
    });

    it('중복된 프로젝트 코드로 생성 시 에러를 발생시킨다', async () => {
      // Given
      const createData = {
        name: '테스트 프로젝트',
        projectCode: 'DUPLICATE',
        status: ProjectStatus.ACTIVE,
      };
      const createdBy = 'user-001';

      projectRepository.findOne.mockResolvedValue({
        projectCode: 'DUPLICATE',
      } as Project);

      // When & Then
      await expect(service.생성한다(createData, createdBy)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

