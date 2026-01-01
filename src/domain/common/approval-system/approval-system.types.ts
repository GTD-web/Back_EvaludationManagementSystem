/**
 * 결재 시스템 연동 타입 정의
 */

/**
 * LIAS 서버 결재 상태 응답 DTO
 */
export interface LiasApprovalDocumentResponse {
  id: string;
  documentNumber: string;
  title: string;
  content: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'IMPLEMENTED';
  comment?: string;
  metadata?: any;
  drafterId: string;
  documentTemplateId: string;
  retentionPeriod?: number;
  retentionPeriodUnit?: string;
  retentionStartDate?: string;
  retentionEndDate?: string;
  submittedAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvalSteps: {
    id: string;
    documentId: string;
    stepOrder: number;
    stepType: 'AGREEMENT' | 'APPROVAL' | 'IMPLEMENTATION' | 'REFERENCE';
    approverId: string;
    approverSnapshot: {
      departmentId: string;
      departmentName: string;
      positionId: string;
      positionTitle: string;
      rankId: string;
      rankTitle: string;
      employeeName: string;
      employeeNumber: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    comment?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
  }[];
  drafter?: any;
  documentTemplate?: any;
  canCancelApproval?: boolean;
  canCancelSubmit?: boolean;
}

/**
 * 결재 문서 상태
 */
export type ApprovalDocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'IMPLEMENTED';
