#!/bin/bash
set -e
cd /home/u555371370/domains/sortmyscene.fr/nodejs
pwd
echo "--- ls nodejs ---"
ls -la
if [ -f stderr.log ]; then
  echo "--- stderr.log ---"
  cat stderr.log
else
  echo "--- stderr.log missing ---"
fi
if [ -f console.log ]; then
  echo "--- console.log ---"
  cat console.log
else
  echo "--- console.log missing ---"
fi
if command -v ps >/dev/null 2>&1; then
  echo "--- ps ---"
  ps -ef | grep node | grep -v grep || true
fi
if command -v ss >/dev/null 2>&1; then
  echo "--- ss 3000 ---"
  ss -tulpn | grep 3000 || true
elif command -v netstat >/dev/null 2>&1; then
  echo "--- netstat 3000 ---"
  netstat -tulpn 2>/dev/null | grep 3000 || true
fi
if [ -f .env ]; then
  echo "--- .env ---"
  grep -E 'DATABASE_URL|PORT|NODE_ENV|APP_ORIGIN' .env
else
  echo "--- .env missing ---"
fi
