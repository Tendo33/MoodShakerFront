# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖 (OpenSSL 3.0 compatibility)
RUN apk add --no-cache openssl libc6-compat

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile --shamefully-hoist

# 复制所有源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS runner

WORKDIR /app

# 安装系统依赖 (OpenSSL 3.0 compatibility)
RUN apk add --no-cache openssl libc6-compat

# 安装 pnpm
RUN npm install -g pnpm

# 复制必要的文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
# 注意：.env文件不复制，因为生产环境变量应该通过运行时传入

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist

# 复制 Prisma 生成的客户端（必须在安装依赖之后）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
# 注意：环境变量应该在构建时通过 --build-arg 传入
# 或者在运行时通过 docker run -e 传入

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动应用
CMD ["pnpm", "start"]
