@echo off
title Import Batloung Farm Database
color 0B

echo =====================================================================
echo           BATLOUNG FARM - IMPORT MYSQL DATABASE
echo =====================================================================
echo.

cd /d "%~dp0"

:: Check for mysql executable in PATH or Program Files
set "MYSQL_CMD=mysql"
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    ) else (
        echo [ERROR] MySQL was not found in PATH or standard installation folder.
        echo Please make sure MySQL Server is installed.
        pause
        exit /b 1
    )
)

echo Found MySQL at: "%MYSQL_CMD%"
echo Importing database from: "%~dp0database\batloung_farm_db.sql"
echo.
echo Please enter your MySQL root password when prompted below:
echo.

"%MYSQL_CMD%" -u root -p < "%~dp0database\batloung_farm_db.sql"

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Database 'batloung_farm_db' imported successfully!
    echo All 8 tables, sample data, and SQL report views are ready.
    echo =====================================================================
) else (
    echo.
    echo [ERROR] Failed to import database. Please verify your password.
)

echo.
pause
