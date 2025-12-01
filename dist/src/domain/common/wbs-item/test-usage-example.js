"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsItemTestHelpers = exports.WbsItemTestUsageExample = void 0;
const wbs_item_types_1 = require("./wbs-item.types");
class WbsItemTestUsageExample {
    wbsItemTestService;
    constructor(wbsItemTestService) {
        this.wbsItemTestService = wbsItemTestService;
    }
    async 기본_테스트데이터_생성_예시(projectId) {
        const wbsItems = await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
        console.log('생성된 WBS 항목 수:', wbsItems.length);
        console.log('진행중인 WBS 항목들:', wbsItems.filter((w) => w.isInProgress));
        const customWbsItem = await this.wbsItemTestService.특정_WBS_테스트데이터를_생성한다({
            wbsCode: 'CUSTOM-001',
            title: '커스텀 WBS 작업',
            status: wbs_item_types_1.WbsItemStatus.IN_PROGRESS,
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-08-31'),
            progressPercentage: 50,
            assignedToId: 'custom-assignee',
            projectId,
            level: 1,
        });
        console.log('커스텀 WBS 항목 생성:', customWbsItem);
        const randomWbsItems = await this.wbsItemTestService.랜덤_테스트데이터를_생성한다(projectId, 5);
        console.log('랜덤 WBS 항목 생성:', randomWbsItems.length);
        const completedWbsItems = await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(projectId, wbs_item_types_1.WbsItemStatus.COMPLETED, 3);
        console.log('완료된 WBS 항목 생성:', completedWbsItems.length);
        const assigneeWbsItems = await this.wbsItemTestService.담당자별_WBS_테스트데이터를_생성한다(projectId, 'test-assignee-001', 2);
        console.log('담당자별 WBS 항목 생성:', assigneeWbsItems.length);
        const hierarchicalWbsItems = await this.wbsItemTestService.계층구조_WBS_테스트데이터를_생성한다(projectId, 3, 2);
        console.log('계층구조 WBS 항목 생성:', hierarchicalWbsItems.length);
        return {
            basic: wbsItems,
            custom: customWbsItem,
            random: randomWbsItems,
            completed: completedWbsItems,
            assignee: assigneeWbsItems,
            hierarchical: hierarchicalWbsItems,
        };
    }
    async 테스트데이터_정리_예시() {
        const deletedCount = await this.wbsItemTestService.테스트_데이터를_정리한다();
        console.log('삭제된 테스트 데이터 수:', deletedCount);
    }
    async 전체_테스트_시나리오(projectId) {
        try {
            console.log('=== 테스트 데이터 생성 시작 ===');
            const testData = await this.기본_테스트데이터_생성_예시(projectId);
            console.log('=== 테스트 완료 ===');
            console.log('생성된 WBS 항목 수:', testData.basic.length);
            console.log('진행중인 WBS 항목 수:', testData.basic.filter((w) => w.isInProgress).length);
            console.log('완료된 WBS 항목 수:', testData.basic.filter((w) => w.isCompleted).length);
            console.log('대기중인 WBS 항목 수:', testData.basic.filter((w) => w.isPending).length);
            return {
                testData,
            };
        }
        catch (error) {
            console.error('테스트 실행 중 오류:', error);
            throw error;
        }
        finally {
            console.log('=== 테스트 데이터 정리 ===');
            await this.테스트데이터_정리_예시();
        }
    }
}
exports.WbsItemTestUsageExample = WbsItemTestUsageExample;
class WbsItemTestHelpers {
    wbsItemTestService;
    constructor(wbsItemTestService) {
        this.wbsItemTestService = wbsItemTestService;
    }
    async E2E_테스트용_데이터_설정(projectId) {
        return await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
    }
    async E2E_테스트용_데이터_정리() {
        return await this.wbsItemTestService.테스트_데이터를_정리한다();
    }
    async 특정_테스트케이스용_데이터_생성(testCase, projectId) {
        switch (testCase) {
            case 'completed':
                return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(projectId, wbs_item_types_1.WbsItemStatus.COMPLETED, 5);
            case 'in_progress':
                return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(projectId, wbs_item_types_1.WbsItemStatus.IN_PROGRESS, 8);
            case 'pending':
                return await this.wbsItemTestService.상태별_WBS_테스트데이터를_생성한다(projectId, wbs_item_types_1.WbsItemStatus.PENDING, 3);
            case 'assignee':
                return await this.wbsItemTestService.담당자별_WBS_테스트데이터를_생성한다(projectId, 'test-assignee', 5);
            case 'hierarchical':
                return await this.wbsItemTestService.계층구조_WBS_테스트데이터를_생성한다(projectId, 4, 3);
            case 'random':
                return await this.wbsItemTestService.랜덤_테스트데이터를_생성한다(projectId, 15);
            case 'basic':
            default:
                return await this.wbsItemTestService.테스트용_목데이터를_생성한다(projectId);
        }
    }
}
exports.WbsItemTestHelpers = WbsItemTestHelpers;
//# sourceMappingURL=test-usage-example.js.map