#!/bin/bash

# 快速构建后端
# 使用方法: ./deploy-backend-only.sh

set -e

echo "🔨 构建后端..."

cd "$(dirname "$0")/backend"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    echo "💡 请创建 .env 文件并配置环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建
echo "🔨 TypeScript 构建..."
pnpm run build

echo ""
echo "✅ 后端构建完成！"
echo ""
echo "📁 构建输出: backend/dist"
echo "🚀 启动命令: cd backend && pnpm start"
echo ""
echo "💡 部署建议:"
echo "   • Railway: railway up"
echo "   • Render: 连接 GitHub 自动部署"
echo "   • Fly.io: fly deploy"
echo "   • AWS EC2: 上传 dist 目录并运行"
