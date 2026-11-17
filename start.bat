@echo off
title Daily Hisab - App Server
echo ========================================================
echo        Daily Hisab (দৈনিক হিসাব খাতা) চালু হচ্ছে...
echo ========================================================
echo.
echo আপনার ব্রাউজারে http://localhost:3000 ওপেন হচ্ছে...
start http://localhost:3000
echo.
npm.cmd run dev
pause
