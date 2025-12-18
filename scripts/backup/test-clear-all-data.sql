-- 데이터 삭제 스크립트 (테스트용)
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!
-- 테이블 구조는 유지되며, 데이터만 삭제됩니다.

-- 생성일: 2025-12-12
-- 용도: 백업 복구 테스트

BEGIN;

-- Foreign Key 제약조건을 일시적으로 비활성화
SET session_replication_role = 'replica';

-- 모든 테이블의 데이터 삭제 (TRUNCATE - 빠르고 안전)
-- 알파벳 순서로 정렬

TRUNCATE TABLE "audit_log" CASCADE;
TRUNCATE TABLE "deliverable" CASCADE;
TRUNCATE TABLE "department" CASCADE;
TRUNCATE TABLE "downward_evaluation" CASCADE;
TRUNCATE TABLE "employee" CASCADE;
TRUNCATE TABLE "employee_evaluation_step_approval" CASCADE;
TRUNCATE TABLE "evaluation_activity_log" CASCADE;
TRUNCATE TABLE "evaluation_line_mappings" CASCADE;
TRUNCATE TABLE "evaluation_lines" CASCADE;
TRUNCATE TABLE "evaluation_period" CASCADE;
TRUNCATE TABLE "evaluation_period_employee_mapping" CASCADE;
TRUNCATE TABLE "evaluation_project_assignment" CASCADE;
TRUNCATE TABLE "evaluation_question" CASCADE;
TRUNCATE TABLE "evaluation_response" CASCADE;
TRUNCATE TABLE "evaluation_revision_request" CASCADE;
TRUNCATE TABLE "evaluation_revision_request_recipient" CASCADE;
TRUNCATE TABLE "evaluation_wbs_assignment" CASCADE;
TRUNCATE TABLE "final_evaluations" CASCADE;
TRUNCATE TABLE "peer_evaluation" CASCADE;
TRUNCATE TABLE "peer_evaluation_question_mapping" CASCADE;
TRUNCATE TABLE "project" CASCADE;
TRUNCATE TABLE "question_group" CASCADE;
TRUNCATE TABLE "question_group_mapping" CASCADE;
TRUNCATE TABLE "secondary_evaluation_step_approval" CASCADE;
TRUNCATE TABLE "system_setting" CASCADE;
TRUNCATE TABLE "wbs_evaluation_criteria" CASCADE;
TRUNCATE TABLE "wbs_item" CASCADE;
TRUNCATE TABLE "wbs_self_evaluation" CASCADE;

-- Foreign Key 제약조건 다시 활성화
SET session_replication_role = 'origin';

COMMIT;

-- 삭제 확인 쿼리
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename) as row_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

