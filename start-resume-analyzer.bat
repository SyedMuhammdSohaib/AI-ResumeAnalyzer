@echo off
title Resume Analyzer Launcher
echo Starting AI Resume Analyzer...

if not exist "%~dp0backend\venv" (
  echo Creating Python environment...
  python -m venv "%~dp0backend\venv"
)

start "Backend" /d "%~dp0backend" cmd /k "call venv\Scripts\activate && pip install -r requirements.txt -q && uvicorn app.main:app --reload"

start "Frontend" /d "%~dp0frontend" cmd /k "(if not exist node_modules npm install) && npm run dev"

echo Waiting for the app to be ready (first run can take a few minutes)...
powershell -NoProfile -Command "while(-not (Test-NetConnection localhost -Port 3000 -InformationLevel Quiet)){Start-Sleep 2}"

start http://localhost:3000
exit
