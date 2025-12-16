@echo off
REM 데이터베이스 복구 스크립트 (Windows)
REM 사용법:
REM   scripts\backup\restore.bat                    # 최신 백업 파일로 복구
REM   scripts\backup\restore.bat <백업파일경로>      # 특정 백업 파일로 복구

setlocal enabledelayedexpansion

REM 백업 설정
set BACKUP_DIR=scripts\backup\dumps

REM 백업 파일 결정
if "%~1"=="" (
  REM 인자가 없으면 최신 백업 파일 사용
  set BACKUP_FILE=
  for /f "delims=" %%i in ('dir /b /o-d %BACKUP_DIR%\backup-*.sql 2^>nul') do (
    if not defined BACKUP_FILE set BACKUP_FILE=%BACKUP_DIR%\%%i
  )
  
  if not defined BACKUP_FILE (
    echo ❌ 백업 파일을 찾을 수 없습니다.
    echo    경로: %BACKUP_DIR%\
    exit /b 1
  )
  
  echo 📂 최신 백업 파일을 사용합니다: !BACKUP_FILE!
) else (
  set BACKUP_FILE=%~1
  
  if not exist "!BACKUP_FILE!" (
    echo ❌ 백업 파일이 존재하지 않습니다: !BACKUP_FILE!
    exit /b 1
  )
)

REM 데이터베이스 연결 정보 (.env에서 읽어오기)
if exist .env (
  for /f "tokens=1,2 delims==" %%a in (.env) do (
    set %%a=%%b
  )
)

if not defined DATABASE_HOST set DATABASE_HOST=localhost
if not defined DATABASE_PORT set DATABASE_PORT=5432
if not defined DATABASE_USERNAME set DATABASE_USERNAME=postgres
if not defined DATABASE_NAME set DATABASE_NAME=ems

echo.
echo ⚠️  경고: 이 작업은 기존 데이터베이스를 완전히 덮어씁니다!
echo.
echo    호스트: %DATABASE_HOST%:%DATABASE_PORT%
echo    데이터베이스: %DATABASE_NAME%
echo    백업 파일: !BACKUP_FILE!
echo.
set /p CONFIRM="계속하시겠습니까? (yes/no): "

if not "%CONFIRM%"=="yes" (
  echo 복구 작업이 취소되었습니다.
  exit /b 0
)

echo.
echo 🔄 데이터베이스 복구 시작...

REM psql 실행
set PGPASSWORD=%DATABASE_PASSWORD%
psql -h %DATABASE_HOST% -p %DATABASE_PORT% -U %DATABASE_USERNAME% -d %DATABASE_NAME% -f !BACKUP_FILE!

if %errorlevel% equ 0 (
  echo.
  echo ✅ 복구 완료!
  echo    데이터베이스가 성공적으로 복구되었습니다.
) else (
  echo.
  echo ❌ 복구 실패!
  exit /b 1
)

endlocal

