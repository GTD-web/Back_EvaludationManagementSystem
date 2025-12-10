import { RevisionRequestBusinessService } from '@business/revision-request/revision-request-business.service';
import { RevisionRequestContextService } from '@context/revision-request-context';
import { CompleteRevisionRequestDto } from '@interface/common/dto/revision-request/complete-revision-request.dto';
import { GetRevisionRequestsQueryDto } from '@interface/common/dto/revision-request/get-revision-requests-query.dto';
import { RevisionRequestResponseDto, UnreadCountResponseDto } from '@interface/common/dto/revision-request/revision-request-response.dto';
export declare class UserRevisionRequestController {
    private readonly revisionRequestBusinessService;
    private readonly revisionRequestContextService;
    constructor(revisionRequestBusinessService: RevisionRequestBusinessService, revisionRequestContextService: RevisionRequestContextService);
    getMyRevisionRequests(query: GetRevisionRequestsQueryDto, recipientId: string): Promise<RevisionRequestResponseDto[]>;
    getMyUnreadCount(recipientId: string): Promise<UnreadCountResponseDto>;
    markAsRead(requestId: string, recipientId: string): Promise<void>;
    completeRevisionRequest(requestId: string, dto: CompleteRevisionRequestDto, recipientId: string): Promise<void>;
}
