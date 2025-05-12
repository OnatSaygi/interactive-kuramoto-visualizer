@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File "%kill-port.ps1" -port 8080
npm start
