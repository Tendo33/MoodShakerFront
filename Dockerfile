# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制所有源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制必要的文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.env ./.env

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_OPENAI_API_KEY=
ENV NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1
ENV NEXT_PUBLIC_OPENAI_MODEL=deepseek-v3-250324
ENV NEXT_PUBLIC_IMAGE_API_URL=
ENV NEXT_PUBLIC_IMAGE_API_KEY=
ENV NEXT_PUBLIC_IMAGE_MODEL=Kwai-Kolors/Kolors

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动应用
CMD ["pnpm", "start"] 