"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const project_service_1 = require("../src/domain/common/project/project.service");
async function addChildProjectsToExistingProjects() {
    console.log('🚀 하위 프로젝트 생성 스크립트 시작...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const projectService = app.get(project_service_1.ProjectService);
    try {
        const parentProjects = await projectService.목록_조회한다({
            page: 1,
            limit: 100,
            filter: {
                hierarchyLevel: 'parent',
            },
        });
        console.log(`📋 상위 프로젝트 ${parentProjects.total}개 발견\n`);
        let totalChildCreated = 0;
        for (const parentProject of parentProjects.projects) {
            console.log(`\n📦 [${parentProject.name}] 하위 프로젝트 생성 중...`);
            const existingChildren = await projectService.하위_프로젝트_목록_조회한다(parentProject.id);
            if (existingChildren.length > 0) {
                console.log(`   ⚠️  이미 ${existingChildren.length}개의 하위 프로젝트가 있습니다. 건너뜀.`);
                continue;
            }
            const childCount = Math.floor(Math.random() * 3) + 3;
            for (let i = 1; i <= childCount; i++) {
                try {
                    const childProject = await projectService.생성한다({
                        name: `${parentProject.name} - ${i}차 하위 프로젝트`,
                        projectCode: `${parentProject.projectCode}-SUB${i}`,
                        status: parentProject.status,
                        startDate: parentProject.startDate,
                        endDate: parentProject.endDate,
                        managerId: parentProject.managerId,
                        parentProjectId: parentProject.id,
                    }, 'system');
                    console.log(`   ✅ ${i}번째 하위 프로젝트 생성: ${childProject.name}`);
                    totalChildCreated++;
                }
                catch (error) {
                    console.error(`   ❌ ${i}번째 하위 프로젝트 생성 실패:`, error.message);
                }
            }
        }
        console.log(`\n\n🎉 완료! 총 ${totalChildCreated}개의 하위 프로젝트가 생성되었습니다.`);
    }
    catch (error) {
        console.error('❌ 오류 발생:', error);
    }
    finally {
        await app.close();
    }
}
addChildProjectsToExistingProjects();
//# sourceMappingURL=add-child-projects.js.map