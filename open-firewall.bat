@echo off
echo =========================================
echo  Opening port 3000 for RwandAir Dev App
echo =========================================
echo.

:: Remove old rule if exists
netsh advfirewall firewall delete rule name="RwandAir LunchLabs Port 3000" >nul 2>&1

:: Add inbound rule for TCP port 3000
netsh advfirewall firewall add rule ^
  name="RwandAir LunchLabs Port 3000" ^
  dir=in ^
  action=allow ^
  protocol=TCP ^
  localport=3000 ^
  description="Allows other machines on the local network to access the RwandAir prototype app on port 3000"

echo.
if %ERRORLEVEL% EQU 0 (
  echo SUCCESS! Port 3000 is now open.
  echo Other machines on your network can access:
  echo   http://10.1.0.138:3000/
  echo   http://172.22.35.159:3000/
  echo   http://192.168.192.1:3000/
) else (
  echo ERROR: Could not open firewall port.
  echo Please make sure you right-clicked and chose "Run as administrator".
)

echo.
pause
