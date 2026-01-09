@echo off
REM 하위 프로젝트 일괄 삭제 테스트 스크립트 (Windows)
REM 사용법: scripts\test-delete-child-projects.bat [soft|hard|force-hard]

setlocal enabledelayedexpansion

REM 설정
if "%API_URL%"=="" set API_URL=http://localhost:3000
if "%TOKEN%"=="" set TOKEN=YOUR_BEARER_TOKEN

REM 삭제 모드 (기본값: soft)
set MODE=%1
if "%MODE%"=="" set MODE=soft

REM 헤더
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo     하위 프로젝트 일괄 삭제 테스트
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 모드별 설정
if "%MODE%"=="soft" (
    echo [모드: Soft Delete ^(안전^)]
    set BODY={"forceDelete":false,"hardDelete":false}
) else if "%MODE%"=="hard" (
    echo [모드: Hard Delete ^(영구 삭제^)]
    set BODY={"forceDelete":false,"hardDelete":true}
) else if "%MODE%"=="force-hard" (
    echo [모드: Force Hard Delete ^(⚠️ 매우 위험^)]
    set BODY={"forceDelete":true,"hardDelete":true}
    echo 경고: 할당 체크를 건너뛰고 영구 삭제합니다!
    set /p CONFIRM="계속하시겠습니까? (yes/no): "
    if not "!CONFIRM!"=="yes" (
        echo 취소되었습니다.
        exit /b 0
    )
) else (
    echo 올바르지 않은 모드: %MODE%
    echo 사용법: %0 [soft^|hard^|force-hard]
    exit /b 1
)

echo.
echo [1/3] 삭제 전 하위 프로젝트 확인...
echo.

REM 삭제 전 카운트 (curl과 jq가 설치되어 있어야 함)
curl -s -X GET "%API_URL%/admin/projects?limit=1000" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" > temp_before.json

echo 삭제 전 프로젝트 목록을 확인하세요: temp_before.json
echo.

echo [2/3] 하위 프로젝트 일괄 삭제 실행...
echo.

REM API 호출
curl -X DELETE "%API_URL%/admin/projects/children" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "%BODY%" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -o temp_delete_response.json

echo.
echo 삭제 결과를 확인하세요: temp_delete_response.json
echo.

echo [3/3] 삭제 후 하위 프로젝트 확인...
echo.

REM 삭제 후 카운트
curl -s -X GET "%API_URL%/admin/projects?limit=1000" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" > temp_after.json

echo 삭제 후 프로젝트 목록을 확인하세요: temp_after.json
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo     테스트 완료
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 생성된 임시 파일:
echo   - temp_before.json: 삭제 전 프로젝트 목록
echo   - temp_delete_response.json: 삭제 API 응답
echo   - temp_after.json: 삭제 후 프로젝트 목록
echo.

endlocal
