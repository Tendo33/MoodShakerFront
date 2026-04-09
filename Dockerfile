# 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖 (OpenSSL 3.0 compatibility)
RUN apk add --no-cache openssl libc6-compat

# 安装 pnpm (锁定版本)
RUN npm install -g pnpm@10.9.0

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# postinstall 会执行 prisma generate，所以安装依赖前必须先提供 schema
COPY prisma ./prisma

# 安装依赖
RUN pnpm install --frozen-lockfile --shamefully-hoist

# 复制所有源代码
COPY . .

# 设置占位符环境变量用于构建时的 Prisma 客户端生成
# 这个 URL 只在构建时使用,运行时会被实际的 DATABASE_URL 替换
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public"

# 生成 Prisma 客户端
RUN npx prisma generate

# 验证 Prisma 客户端是否生成成功
RUN ls -la node_modules/.prisma/ || echo "Warning: .prisma directory not found"

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:22-alpine AS runner

WORKDIR /app

# 安装系统依赖 (OpenSSL 3.0 compatibility)
RUN apk add --no-cache openssl libc6-compat

# 安装 pnpm (锁定版本)
RUN npm install -g pnpm@10.9.0

# 复制必要的文件
COPY --from=builder --chown=node:node /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/next.config.mjs ./
# 注意：.env文件不复制，因为生产环境变量应该通过运行时传入

# 复制 Prisma schema 和种子数据脚本
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/api ./api
COPY --from=builder --chown=node:node /app/lib ./lib
COPY --from=builder --chown=node:node /app/tsconfig.json ./

# 复制启动脚本
COPY --from=builder --chown=node:node /app/scripts/docker-entrypoint.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh

# 安装生产依赖 (包含 @prisma/client)
# 注意: 使用 --prod 会排除 prisma CLI,所以我们需要单独安装
RUN pnpm install --frozen-lockfile --shamefully-hoist

# 设置占位符 DATABASE_URL 用于 Prisma 客户端生成
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public"

# 生成 Prisma 客户端
RUN npx prisma generate

# 验证 Prisma 客户端是否生成成功
RUN ls -la node_modules/.prisma/ || echo "Warning: .prisma directory not found in runner stage"

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
# 注意：环境变量应该在构建时通过 --build-arg 传入
# 或者在运行时通过 docker run -e 传入

# 使用非 root 用户运行应用（配合 COPY --chown=node:node）
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动应用（通过启动脚本，会自动初始化数据库并写入三种酒的示例数据）
CMD ["./scripts/docker-entrypoint.sh"]
