@echo off
echo =========================================================
echo   Starting PBL Portal FastAPI Backend Server
echo   Host: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo =========================================================
cd /d "%~dp0backend"
C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe run.py
pause

