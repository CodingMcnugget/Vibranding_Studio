#!/bin/bash

# Vibranding Studio 自动部署脚本
# 使用方法: ./deploy.sh [backend|frontend|all]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/vibranding-frontend"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 检查必要的工具是否安装
check_prerequisites() {
    print_header "检查必要工具"
    
    local missing_tools=()
    
    if ! command -v pnpm &> /dev/null; then
        missing_tools+=("pnpm")
    else
        print_success "pnpm 已安装: $(pnpm --version)"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "缺少以下工具: ${missing_tools[*]}"
        print_info "请运行: npm install -g pnpm"
        exit 1
    fi
}

# 部署后端
deploy_backend() {
    print_header "构建后端"
    
    cd "$BACKEND_DIR"
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        print_error ".env 文件不存在"
        print_info "请创建 .env 文件并配置以下变量:"
        echo "  ANTHROPIC_API_KEY=..."
        echo "  BROWSERBASE_API_KEY=..."
        echo "  BROWSERBASE_PROJECT_ID=..."
        echo "  STAGEHAND_ENV=BROWSERBASE"
        echo "  PORT=3000"
        exit 1
    fi
    
    # 安装依赖
    print_info "安装后端依赖..."
    pnpm install
    
    # 构建
    print_info "构建后端..."
    pnpm run build
    
    print_success "后端构建成功！"
    print_info "生产构建位于: $BACKEND_DIR/dist"
    print_info ""
    print_info "部署建议:"
    echo "  1. 使用 Railway: railway up"
    echo "  2. 使用 Render: 连接 GitHub 仓库自动部署"
    echo "  3. 使用 Fly.io: fly deploy"
    echo "  4. 使用 AWS: 配置 EC2 或 Lambda"
    echo ""
    print_warning "记得在部署平台设置环境变量！"
}

# 部署前端
deploy_frontend() {
    print_header "部署前端到 Vercel"
    
    cd "$FRONTEND_DIR"
    
    # 检查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI 未安装"
        print_info "请运行: npm install -g vercel"
        exit 1
    fi
    
    # 检查登录状态
    if ! vercel whoami &> /dev/null; then
        print_warning "Vercel 未登录，开始登录流程..."
        vercel login
    fi
    
    # 安装依赖
    print_info "安装前端依赖..."
    pnpm install
    
    # 部署到生产环境
    print_info "部署到 Vercel 生产环境..."
    vercel --prod --yes
    
    print_success "前端部署成功！"
    print_info "查看部署: vercel inspect"
}

# 显示部署摘要
show_summary() {
    print_header "部署摘要"
    
    echo ""
    echo "🎉 部署任务完成！"
    echo ""
    echo "📱 前端: 部署到 Vercel"
    echo "   管理: cd frontend/vibranding-frontend && vercel"
    echo ""
    echo "🔧 后端: 构建完成"
    echo "   目录: backend/dist"
    echo "   启动: cd backend && pnpm start"
    echo ""
    echo "💡 技术栈:"
    echo "   • 后端: TypeScript + Fastify + Stagehand + Claude"
    echo "   • 前端: Next.js + React + Tailwind CSS"
    echo "   • 浏览器: Browserbase (云端浏览器)"
    echo ""
}

# 主函数
main() {
    local deploy_target="${1:-all}"
    
    print_header "🚀 Vibranding Studio 部署"
    
    print_info "部署目标: $deploy_target"
    
    # 检查前置条件
    check_prerequisites
    
    case "$deploy_target" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            echo ""
            deploy_frontend
            show_summary
            ;;
        *)
            print_error "未知的部署目标: $deploy_target"
            print_info "使用方法: ./deploy.sh [backend|frontend|all]"
            exit 1
            ;;
    esac
    
    print_success "所有部署任务完成！🎊"
}

# 运行主函数
main "$@"
