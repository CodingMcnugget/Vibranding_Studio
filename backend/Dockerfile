FROM node:20-alpine

# 安装必要的系统依赖（Stagehand可能需要）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 设置 Chromium 环境变量（如果使用 LOCAL 模式）
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript
RUN pnpm run build

# 删除 devDependencies 减小镜像大小
RUN pnpm prune --prod

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "dist/index.js"]
