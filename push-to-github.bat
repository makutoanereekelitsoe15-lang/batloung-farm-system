@echo off
title Push Batloung Farm System to GitHub
color 0B

echo =====================================================================
echo           PUSH BATLOUNG FARM SYSTEM TO GITHUB
echo =====================================================================
echo.

cd /d "%~dp0"

echo Repository: https://github.com/makutoanereekelitsoe15-lang/batloung-farm-system.git
echo.
echo Pushing branch 'main' to GitHub...
echo (If a browser window opens, click "Sign in with your browser" / "Authorize")
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Your code is now live on GitHub!
    echo View your repository at:
    echo https://github.com/makutoanereekelitsoe15-lang/batloung-farm-system
    echo =====================================================================
) else (
    echo.
    echo [ERROR] Push did not complete. If you need a Personal Access Token,
    echo you can generate one on GitHub under Settings -^> Developer Settings.
)

echo.
pause
