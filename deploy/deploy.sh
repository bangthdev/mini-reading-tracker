#!/usr/bin/env bash
# Deploy lên VPS. Chạy TRÊN VPS, trong thư mục repo đã clone.
#
#   ./deploy/deploy.sh
#
# Yêu cầu có sẵn trên VPS: git, node >= 20, npm, pm2, nginx, mysql.
# File backend/.env phải tồn tại và điền đúng thông tin DB (không nằm trong repo).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="/var/www/reading-tracker"

cd "$REPO_DIR"

echo "==> Lấy code mới nhất"
git pull --ff-only

echo "==> Backend: cài dependency và chạy migration"
cd "$REPO_DIR/backend"
if [ ! -f .env ]; then
  echo "LỖI: thiếu backend/.env — tạo từ .env.example rồi điền thông tin DB thật" >&2
  exit 1
fi
npm ci --omit=dev
npm run db:migrate

echo "==> Frontend: build ra file tĩnh"
cd "$REPO_DIR/frontend"
npm ci
npm run build

echo "==> Chép bản build sang thư mục Nginx phục vụ"
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r dist/* "$WEB_ROOT/"

echo "==> Khởi động lại backend bằng PM2"
cd "$REPO_DIR/backend"
mkdir -p logs
pm2 startOrReload ecosystem.config.js
pm2 save

echo "==> Kiểm tra"
sleep 2
curl -fsS http://127.0.0.1:3000/api/health && echo
echo "Xong."
