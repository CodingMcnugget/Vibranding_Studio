#!/bin/bash

# 快速部署前端到 Vercel
# 使用方法: ./deploy-frontend-only.sh

set -e

echo "🚀 快速部署前端到 Vercel..."

cd "$(dirname "$0")/frontend/vibranding-frontend"

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "💡 请运行: npm install -g vercel"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 部署到生产环境
echo "🚀 部署到 Vercel 生产环境..."
vercel --prod --yes

echo ""
echo "✅ 前端部署完成！"
echo ""
echo "💡 查看详情: cd frontend/vibranding-frontend && vercel inspect"
