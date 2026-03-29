@echo off
cd /d "%~dp0"
echo Starting Flask with project virtualenv (statsmodels + OpenAI)...
".venv\Scripts\python.exe" server.py
pause
