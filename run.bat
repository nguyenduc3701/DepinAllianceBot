@echo off
REM Check if the node_modules folder exists
IF NOT EXIST "node_modules" (
    echo "node_modules folder not found. Installing dependencies..."
    npm i
    
    echo isFarming=true>> auto_run.txt
    echo isDailyClaim=true>> auto_run.txt
    echo isDoTask=true>> auto_run.txt
    echo isAutoUpgradeGameResource=true>> auto_run.txt
    echo isAutoJoinLeague=true>> auto_run.txt

    node index.js
) ELSE (
    echo "node_modules folder found. Skipping npm install."
    echo isFarming=true>> auto_run.txt
    echo isDailyClaim=true>> auto_run.txt
    echo isDoTask=true>> auto_run.txt
    echo isAutoUpgradeGameResource=true>> auto_run.txt
    echo isAutoJoinLeague=true>> auto_run.txt

    node index.js
)