import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  LiasApprovalDocumentResponse,
  ApprovalDocumentStatus,
} from './approval-system.types';

/**
 * 결재 시스템 연동 서비스
 *
 * LIAS 결재관리시스템과 통신하여 결재 문서의 상태를 조회합니다.
 */
@Injectable()
export class ApprovalSystemService {
  private readonly logger = new Logger(ApprovalSystemService.name);
  private readonly liasBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.liasBaseUrl = this.configService.get<string>(
      'LIAS_URL',
      'http://localhost:3001',
    );
    this.logger.log(`LIAS 서버 URL: ${this.liasBaseUrl}`);
  }

  /**
   * LIAS 서버에서 결재 문서의 상태를 조회합니다.
   *
   * @param documentId 결재 문서 ID
   * @returns 결재 문서 상태 정보
   * @throws 네트워크 오류 또는 서버 오류
   */
  async 결재문서_상태를_조회한다(
    documentId: string,
  ): Promise<LiasApprovalDocumentResponse> {
    try {
      const url = `${this.liasBaseUrl}/api/approval-process/document/${documentId}/steps`;
      this.logger.debug(`LIAS 서버 요청: GET ${url}`);

      const response: AxiosResponse<LiasApprovalDocumentResponse> =
        await firstValueFrom(
          this.httpService.get<LiasApprovalDocumentResponse>(url, {
            timeout: 5000, // 5초 타임아웃
          }),
        );

      this.logger.debug(
        `결재 문서 ${documentId} 상태 조회 성공: ${response.data.documentStatus}`,
      );

      return response.data;
    } catch (error) {
      // HTTP 요청 실패 처리
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn(
          `LIAS 서버 연결 실패 (documentId: ${documentId}). 서버가 실행 중인지 확인하세요.`,
        );
        throw new Error('LIAS 서버에 연결할 수 없습니다.');
      } else if (error.response?.status === 404) {
        this.logger.warn(`결재 문서를 찾을 수 없음 (documentId: ${documentId})`);
        throw new Error('결재 문서를 찾을 수 없습니다.');
      } else {
        this.logger.error(
          `결재 문서 상태 조회 실패 (documentId: ${documentId}): ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  /**
   * 여러 결재 문서의 상태를 일괄 조회합니다.
   *
   * @param documentIds 결재 문서 ID 목록
   * @returns 결재 문서 상태 정보 목록
   */
  async 결재문서_상태를_일괄조회한다(
    documentIds: string[],
  ): Promise<Map<string, ApprovalDocumentStatus>> {
    const resultMap = new Map<string, ApprovalDocumentStatus>();

    for (const documentId of documentIds) {
      try {
        const response = await this.결재문서_상태를_조회한다(documentId);
        resultMap.set(documentId, response.documentStatus);
      } catch (error) {
        this.logger.error(
          `결재 문서 ${documentId} 조회 실패: ${error.message}`,
        );
        // 개별 실패는 전체를 멈추지 않음
        continue;
      }
    }

    return resultMap;
  }

  /**
   * LIAS 서버가 정상 작동 중인지 확인합니다.
   *
   * @returns LIAS 서버 정상 여부
   */
  async LIAS서버_상태를_확인한다(): Promise<boolean> {
    try {
      const url = `${this.liasBaseUrl}/api/health`;
      await firstValueFrom(
        this.httpService.get(url, {
          timeout: 3000,
        }),
      );
      return true;
    } catch (error) {
      this.logger.warn('LIAS 서버 상태 확인 실패');
      return false;
    }
  }
}

