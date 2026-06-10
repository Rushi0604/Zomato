@echo off
echo Compiling Server.java...
javac Server.java
if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed. Make sure JDK is installed and in PATH.
    pause
    exit /b 1
)
echo Starting FoodExpress Java Server...
java Server
