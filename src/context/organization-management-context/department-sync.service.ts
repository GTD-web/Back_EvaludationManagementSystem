import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Department } from '../../domain/common/department/department.entity';
import { DepartmentService } from '../../domain/common/department/department.service';
import {
  DepartmentSyncResult,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../../domain/common/department/department.types';
import { Inject } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import type {
  ISSOService,
  DepartmentInfo,
} from '@domain/common/sso/interfaces';

/**
 * 부서 동기화 서비스
 *
 * SSO 서비스와 부서 데이터를 동기화합니다.
 * 히트미스 전략을 사용하여 캐시처럼 동작합니다.
 */
@Injectable()
export class DepartmentSyncService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentSyncService.name);
  private readonly syncEnabled: boolean;
  private readonly systemUserId = 'SYSTEM_SYNC'; // 시스템 동기화 사용자 ID

  constructor(
    private readonly departmentService: DepartmentService,
    private readonly configService: ConfigService,
    @Inject(SSOService) private readonly ssoService: ISSOService,
  ) {
    this.syncEnabled = this.configService.get<boolean>(
      'DEPARTMENT_SYNC_ENABLED',
      true,
    );
  }

  /**
   * 모듈 초기화 시 실행
   * 부서 데이터가 없으면 초기 동기화를 수행합니다.
   */
  async onModuleInit(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.log(
        '부서 동기화가 비활성화되어 있어 초기 동기화를 건너뜁니다.',
      );
      return;
    }

    try {
      this.logger.log('모듈 초기화: 부서 데이터 확인 중...');

      // 부서 데이터 개수 확인
      const stats = await this.departmentService.getDepartmentStats();

      if (stats.totalDepartments === 0) {
        this.logger.log('부서 데이터가 없습니다. 초기 동기화를 시작합니다...');
        const result = await this.syncDepartments(true);

        if (result.success) {
          this.logger.log(
            `초기 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트`,
          );
        } else {
          this.logger.error(`초기 동기화 실패: ${result.errors.join(', ')}`);
        }
      } else {
        this.logger.log(
          `기존 부서 데이터 ${stats.totalDepartments}개 확인됨. 초기 동기화를 건너뜁니다.`,
        );
      }
    } catch (error) {
      this.logger.error(`모듈 초기화 중 오류 발생: ${error.message}`);
      // 초기화 오류는 애플리케이션 시작을 막지 않습니다
    }
  }

  /**
   * SSO 서비스에서 부서 데이터 조회
   */
  async fetchExternalDepartments(): Promise<DepartmentInfo[]> {
    try {
      // SSO에서 모든 부서 정보를 평면 목록으로 조회
      const departments = await this.ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });

      this.logger.log(
        `SSO에서 ${departments.length}개의 부서 데이터를 조회했습니다.`,
      );

      return departments;
    } catch (error) {
      // 타임아웃 에러인 경우 더 자세한 로그
      if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        this.logger.error(
          `SSO 부서 API 조회 타임아웃: ${error.message}. SSO 서버 응답이 지연되고 있습니다.`,
        );
        throw new HttpException(
          'SSO 부서 데이터 조회가 타임아웃되었습니다. 잠시 후 다시 시도해주세요.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      this.logger.error('SSO 부서 API 조회 실패:', error.message);
      throw new HttpException(
        'SSO 부서 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * SSO 부서 정보를 내부 엔티티로 변환
   */
  private mapSSODepartmentToDto(
    ssoDepartment: DepartmentInfo,
    order: number = 0,
  ): CreateDepartmentDto {
    // departmentName이 없는 경우 기본값 설정
    const name =
      ssoDepartment.departmentName || ssoDepartment.departmentCode || '미분류';

    return {
      name: name,
      code: ssoDepartment.departmentCode,
      externalId: ssoDepartment.id,
      order: order,
      managerId: undefined, // SSO에서 제공하지 않음
      parentDepartmentId: ssoDepartment.parentDepartmentId,
      externalCreatedAt: new Date(), // SSO에서 제공하지 않으므로 현재 시간 사용
      externalUpdatedAt: new Date(),
    };
  }

  /**
   * 부서 데이터 동기화
   */
  async syncDepartments(
    forceSync: boolean = false,
  ): Promise<DepartmentSyncResult> {
    if (!this.syncEnabled && !forceSync) {
      this.logger.warn('부서 동기화가 비활성화되어 있습니다.');
      return {
        success: false,
        totalProcessed: 0,
        created: 0,
        updated: 0,
        errors: ['동기화가 비활성화되어 있습니다.'],
        syncedAt: new Date(),
      };
    }

    const syncStartTime = new Date();
    let totalProcessed = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    try {
      this.logger.log('부서 데이터 동기화를 시작합니다...');

      // 1. SSO에서 부서 데이터 조회
      const ssoDepartments = await this.fetchExternalDepartments();

      totalProcessed = ssoDepartments.length;

      // 2. 각 부서 데이터 처리
      const departmentsToSave: Department[] = [];
      let restoredCount = 0;

      for (let i = 0; i < ssoDepartments.length; i++) {
        const ssoDept = ssoDepartments[i];
        try {
          // 기존 부서 확인
          let existingDepartment =
            await this.departmentService.findByExternalId(ssoDept.id);

          // externalId로 못 찾으면 code로 조회
          if (!existingDepartment) {
            const departmentsByCode = await this.departmentService.findByFilter(
              {
                code: ssoDept.departmentCode,
              },
            );
            if (departmentsByCode.length > 0) {
              existingDepartment = departmentsByCode[0];
            }
          }

          const mappedData = this.mapSSODepartmentToDto(ssoDept, i);

          if (existingDepartment) {
            // 삭제된 부서가 SSO에 다시 나타난 경우 복원 처리
            const wasDeleted = existingDepartment.deletedAt !== null;
            const isRestored = wasDeleted;

            if (isRestored) {
              restoredCount++;
              this.logger.log(
                `부서 ${existingDepartment.name} (${existingDepartment.code}): 삭제된 상태에서 복원`,
              );
            }

            // 업데이트가 필요한지 확인 (복원인 경우 강제 업데이트)
            let needsUpdate = forceSync || isRestored;

            // 부서 정보가 변경된 경우
            if (
              existingDepartment.name !== mappedData.name ||
              existingDepartment.code !== mappedData.code ||
              existingDepartment.parentDepartmentId !==
                mappedData.parentDepartmentId
            ) {
              needsUpdate = true;
              this.logger.debug(
                `부서 ${existingDepartment.name}의 정보가 변경되어 업데이트합니다.`,
              );
            }

            if (needsUpdate) {
              // 기존 부서 업데이트
              Object.assign(existingDepartment, {
                name: mappedData.name,
                code: mappedData.code,
                order: mappedData.order,
                parentDepartmentId: mappedData.parentDepartmentId,
                externalUpdatedAt: mappedData.externalUpdatedAt,
                lastSyncAt: syncStartTime,
                updatedBy: this.systemUserId,
                deletedAt: null, // 복원: deletedAt을 null로 설정
              } as UpdateDepartmentDto);

              departmentsToSave.push(existingDepartment);
              updated++;
            }
          } else {
            // 새 부서 생성
            const newDepartment = new Department(
              mappedData.name,
              mappedData.code,
              mappedData.externalId,
              mappedData.order,
              mappedData.managerId,
              mappedData.parentDepartmentId,
              mappedData.externalCreatedAt,
              mappedData.externalUpdatedAt,
            );
            newDepartment.lastSyncAt = syncStartTime;
            newDepartment.createdBy = this.systemUserId;
            newDepartment.updatedBy = this.systemUserId;

            departmentsToSave.push(newDepartment);
            created++;
          }
        } catch (error) {
          const errorMsg = `부서 ${ssoDept.departmentName} 처리 실패: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // 3. 일괄 저장 (중복 키 에러 처리)
      if (departmentsToSave.length > 0) {
        try {
          await this.departmentService.saveMany(departmentsToSave);
          this.logger.log(
            `${departmentsToSave.length}개의 부서 데이터를 저장했습니다.`,
          );
        } catch (saveError) {
          // 중복 키 에러인 경우 개별 저장 시도
          if (
            saveError?.code === '23505' ||
            saveError?.message?.includes('duplicate key')
          ) {
            this.logger.warn(
              '일괄 저장 중 중복 키 에러 발생, 개별 저장으로 재시도합니다.',
            );

            let savedCount = 0;
            let skippedCount = 0;

            // 개별 저장
            for (const department of departmentsToSave) {
              try {
                await this.departmentService.save(department);
                savedCount++;
              } catch (individualError) {
                if (
                  individualError?.code === '23505' ||
                  individualError?.message?.includes('duplicate key')
                ) {
                  // 중복 키 에러 발생 시 기존 데이터를 찾아서 업데이트
                  this.logger.debug(
                    `부서 ${department.name} (${department.code}) 중복 발생, 재조회 후 업데이트 시도`,
                  );

                  try {
                    // externalId로 재조회
                    let existingDepartment: Department | null =
                      await this.departmentService.findByExternalId(
                        department.externalId,
                      );

                    if (!existingDepartment) {
                      // code로 재조회
                      const departmentsByCode =
                        await this.departmentService.findByFilter({
                          code: department.code,
                        });
                      if (departmentsByCode.length > 0) {
                        existingDepartment = departmentsByCode[0];
                      }
                    }

                    if (existingDepartment) {
                      // 기존 엔티티에 새 데이터 덮어쓰기
                      Object.assign(existingDepartment, {
                        name: department.name,
                        code: department.code,
                        order: department.order,
                        parentDepartmentId: department.parentDepartmentId,
                        externalId: department.externalId,
                        externalCreatedAt: department.externalCreatedAt,
                        externalUpdatedAt: department.externalUpdatedAt,
                        lastSyncAt: department.lastSyncAt,
                        updatedBy: this.systemUserId,
                      });

                      await this.departmentService.save(existingDepartment);
                      savedCount++;
                      this.logger.debug(
                        `부서 ${department.name} (${department.code}) 업데이트 완료`,
                      );
                    } else {
                      this.logger.warn(
                        `부서 ${department.name} (${department.code}) 재조회 실패, 건너뜀. ` +
                          `externalId=${department.externalId}, code=${department.code}`,
                      );
                      skippedCount++;
                    }
                  } catch (retryError) {
                    const errorMsg = `부서 ${department.name} 재조회/업데이트 실패: ${retryError.message}`;
                    this.logger.error(errorMsg);
                    errors.push(errorMsg);
                    skippedCount++;
                  }
                } else {
                  const errorMsg = `부서 ${department.name} 저장 실패: ${individualError.message}`;
                  this.logger.error(errorMsg);
                  errors.push(errorMsg);
                }
              }
            }

            this.logger.log(
              `개별 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뜀`,
            );
          } else {
            throw saveError;
          }
        }
      }

      // 4. SSO에 없는 부서를 삭제 처리
      let deletedCount = 0;
      try {
        deletedCount = await this.SSO에_없는_부서를_삭제한다(
          ssoDepartments,
          syncStartTime,
        );
        if (deletedCount > 0) {
          this.logger.log(`SSO에 없는 부서 ${deletedCount}개를 삭제했습니다.`);
        }
      } catch (deleteError) {
        this.logger.error(
          `SSO에 없는 부서 삭제 처리 중 오류 발생: ${deleteError.message}`,
        );
        errors.push(`부서 삭제 처리 실패: ${deleteError.message}`);
      }

      const result: DepartmentSyncResult = {
        success: true,
        totalProcessed,
        created,
        updated,
        errors,
        syncedAt: syncStartTime,
      };

      this.logger.log(
        `부서 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트, ${restoredCount}개 복원, ${deletedCount}개 삭제`,
      );

      return result;
    } catch (error) {
      // 타임아웃 에러인 경우 더 자세한 정보 제공
      let errorMsg: string;
      if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        errorMsg = `부서 동기화 타임아웃: SSO 서버 응답이 지연되어 동기화를 완료할 수 없습니다. (${error.message})`;
        this.logger.warn(
          errorMsg +
            ' 스케줄된 다음 동기화에서 재시도됩니다. SSO_TIMEOUT_MS 환경 변수를 늘려보세요.',
        );
      } else {
        errorMsg = `부서 동기화 실패: ${error.message}`;
        this.logger.error(errorMsg);
      }

      return {
        success: false,
        totalProcessed,
        created,
        updated,
        errors: [...errors, errorMsg],
        syncedAt: syncStartTime,
      };
    }
  }

  /**
   * SSO에 없는 부서를 삭제한다 (soft delete)
   *
   * @param ssoDepartments SSO에서 가져온 부서 목록
   * @param syncStartTime 동기화 시작 시간
   * @returns 삭제 처리된 부서 수
   */
  private async SSO에_없는_부서를_삭제한다(
    ssoDepartments: DepartmentInfo[],
    syncStartTime: Date,
  ): Promise<number> {
    // 환경 변수로 SSO에 없는 부서 삭제 기능 제어 (기본값: true)
    const syncDeleteMissing = this.configService.get<string | boolean>(
      'SYNC_DELETE_MISSING_DEPARTMENTS',
      'true',
    );
    const syncDeleteMissingEnabled =
      syncDeleteMissing === 'false' || syncDeleteMissing === false
        ? false
        : true;

    if (!syncDeleteMissingEnabled) {
      this.logger.debug(
        'SSO에 없는 부서 삭제가 비활성화되어 있습니다. (SYNC_DELETE_MISSING_DEPARTMENTS=false)',
      );
      return 0;
    }

    // SSO에서 가져온 부서의 externalId Set 생성
    const ssoExternalIds = new Set(
      ssoDepartments.map((dept) => dept.id).filter((id) => id),
    );

    // 현재 DB에 있는 모든 부서 조회 (삭제된 부서 포함)
    const allLocalDepartments = await this.departmentService.findAll();

    // SSO에 없고 아직 삭제되지 않은 부서 찾기
    // 단, 최근에 동기화된 부서만 대상으로 (백업 복구된 오래된 데이터 보호)
    const oneDayAgo = new Date(syncStartTime.getTime() - 24 * 60 * 60 * 1000);
    const departmentsToDelete = allLocalDepartments.filter(
      (dept) =>
        dept.externalId &&
        !ssoExternalIds.has(dept.externalId) &&
        !dept.deletedAt &&
        // lastSyncAt이 있고 최근 24시간 이내에 동기화된 경우만 삭제 처리
        dept.lastSyncAt &&
        new Date(dept.lastSyncAt) > oneDayAgo,
    );

    if (departmentsToDelete.length === 0) {
      return 0;
    }

    this.logger.log(
      `SSO에 없는 부서 ${departmentsToDelete.length}개를 삭제합니다.`,
    );

    // soft delete 처리
    let deletedCount = 0;
    const departmentsToSave: Department[] = [];

    for (const department of departmentsToDelete) {
      try {
        // soft delete: deletedAt 설정
        department.deletedAt = syncStartTime;
        department.lastSyncAt = syncStartTime;
        department.updatedBy = this.systemUserId;
        departmentsToSave.push(department);
        deletedCount++;

        this.logger.debug(
          `부서 ${department.name} (${department.code}, externalId: ${department.externalId})를 삭제합니다.`,
        );
      } catch (error) {
        this.logger.error(
          `부서 ${department.name} (${department.code}) 삭제 처리 실패: ${error.message}`,
        );
      }
    }

    // 일괄 저장
    if (departmentsToSave.length > 0) {
      try {
        await this.departmentService.saveMany(departmentsToSave);
        this.logger.log(`${deletedCount}개의 부서를 삭제했습니다.`);
      } catch (saveError) {
        this.logger.error(`삭제 처리된 부서 저장 실패: ${saveError.message}`);
        throw saveError;
      }
    }

    return deletedCount;
  }

  /**
   * 스케줄된 자동 동기화 (10분마다)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync(): Promise<void> {
    // 개발환경에서는 스케줄 동기화 비활성화 가능
    const scheduledSyncEnabledValue = this.configService.get<string | boolean>(
      'SCHEDULED_SYNC_ENABLED',
      'true', // 기본값: 활성화 (프로덕션 환경)
    );

    // 문자열 "false" 또는 boolean false 모두 처리
    const scheduledSyncEnabled =
      scheduledSyncEnabledValue === 'false' ||
      scheduledSyncEnabledValue === false
        ? false
        : true;

    if (!scheduledSyncEnabled) {
      this.logger.debug('스케줄된 부서 동기화가 비활성화되어 있습니다.');
      return;
    }

    this.logger.log('스케줄된 부서 동기화를 시작합니다...');
    await this.syncDepartments();
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(): Promise<DepartmentSyncResult> {
    this.logger.log('수동 부서 동기화를 시작합니다...');
    return this.syncDepartments(true);
  }

  /**
   * 부서 데이터 조회 (히트미스 전략)
   * 로컬 DB에서 먼저 조회하고, 없으면 외부 API에서 동기화
   */
  async getDepartments(forceRefresh: boolean = false): Promise<Department[]> {
    try {
      // 1. 강제 새로고침이 요청되었거나 로컬 데이터가 없는 경우
      const localDepartments = await this.departmentService.findAll();

      if (forceRefresh || localDepartments.length === 0) {
        this.logger.log('부서 데이터를 SSO에서 동기화합니다...');
        await this.syncDepartments(forceRefresh);
        return this.departmentService.findAll();
      }

      // 2. 마지막 동기화 시간 확인 (24시간 이상 경과시 백그라운드 동기화)
      const stats = await this.departmentService.getDepartmentStats();
      const lastSyncAt = stats.lastSyncAt;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
        this.logger.log(
          '24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...',
        );
        // 백그라운드에서 동기화 (응답을 기다리지 않음)
        this.syncDepartments().catch((error) => {
          this.logger.error('백그라운드 동기화 실패:', error.message);
        });
      }

      // 3. 로컬 데이터 반환
      return localDepartments;
    } catch (error) {
      this.logger.error('부서 데이터 조회 실패:', error.message);
      throw new HttpException(
        '부서 데이터 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 특정 부서 조회 (히트미스 전략)
   */
  async getDepartmentById(
    id: string,
    forceRefresh: boolean = false,
  ): Promise<Department | null> {
    try {
      // 1. 로컬에서 조회
      let department = await this.departmentService.findById(id);

      // 2. 없거나 강제 새로고침인 경우 동기화 후 재조회
      if (!department || forceRefresh) {
        await this.syncDepartments(forceRefresh);
        department = await this.departmentService.findById(id);
      }

      return department;
    } catch (error) {
      this.logger.error(`부서 ID ${id} 조회 실패:`, error.message);
      throw new HttpException(
        '부서 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 외부 ID로 부서 조회
   */
  async getDepartmentByExternalId(
    externalId: string,
    forceRefresh: boolean = false,
  ): Promise<Department | null> {
    try {
      let department =
        await this.departmentService.findByExternalId(externalId);

      if (!department || forceRefresh) {
        await this.syncDepartments(forceRefresh);
        department = await this.departmentService.findByExternalId(externalId);
      }

      return department;
    } catch (error) {
      this.logger.error(`외부 부서 ID ${externalId} 조회 실패:`, error.message);
      throw new HttpException(
        '부서 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
