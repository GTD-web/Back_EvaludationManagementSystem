import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AssignedEvaluateeDto, GetEvaluatorAssignedEvaluateesQueryDto, PeerEvaluationFilterDto, PeerEvaluationListResponseDto, UpsertPeerEvaluationAnswersDto, UpsertPeerEvaluationAnswersResponseDto } from '@interface/common/dto/performance-evaluation/peer-evaluation.dto';
export declare class UserPeerEvaluationManagementController {
    private readonly peerEvaluationBusinessService;
    constructor(peerEvaluationBusinessService: PeerEvaluationBusinessService);
    getPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getEvaluatorAssignedEvaluatees(evaluatorId: string, query: GetEvaluatorAssignedEvaluateesQueryDto): Promise<AssignedEvaluateeDto[]>;
    getPeerEvaluationDetail(id: string): Promise<PeerEvaluationDetailResult>;
    upsertPeerEvaluationAnswers(dto: UpsertPeerEvaluationAnswersDto, user: AuthenticatedUser): Promise<UpsertPeerEvaluationAnswersResponseDto>;
    submitPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
}
