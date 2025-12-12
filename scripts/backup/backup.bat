@echo off
REM 데이터베이스 전체 백업 스크립트 (Windows)
REM 사용법: scripts\backup\backup.bat

setlocal enabledelayedexpansion

REM 백업 설정
set BACKUP_DIR=scripts\backup\dumps
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup-%TIMESTAMP%.sql

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

echo 📦 데이터베이스 백업 시작...
echo    호스트: %DATABASE_HOST%:%DATABASE_PORT%
echo    데이터베이스: %DATABASE_NAME%
echo    백업 파일: %BACKUP_FILE%
echo.

REM pg_dump 실행
set PGPASSWORD=%DATABASE_PASSWORD%
pg_dump -h %DATABASE_HOST% -p %DATABASE_PORT% -U %DATABASE_USERNAME% -d %DATABASE_NAME% --no-owner --no-acl --clean --if-exists -f %BACKUP_FILE%

if %errorlevel% equ 0 (
  echo.
  echo ✅ 백업 완료!
  echo    파일: %BACKUP_FILE%
  
  REM 30일 이상 된 백업 파일 자동 삭제
  echo.
  echo 🗑️  오래된 백업 파일 정리...
  forfiles /p %BACKUP_DIR% /m backup-*.sql /d -30 /c "cmd /c del @path" 2>nul
  echo    (30일 이상 된 파일 삭제 완료)
) else (
  echo.
  echo ❌ 백업 실패!
  exit /b 1
)

endlocal

