#!/bin/sh
# Docker 容器启动脚本
# 用途：在容器启动时自动初始化数据库并写入示例数据

set -e

echo "🚀 Starting MoodShaker application..."

# 等待数据库准备就绪
echo "⏳ Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until pnpm prisma db push --accept-data-loss > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Database not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Failed to connect to database after $MAX_RETRIES attempts"
  exit 1
fi

echo "✅ Database is ready!"

# 生成 Prisma 客户端
echo "🔧 Generating Prisma client..."
pnpm prisma:generate

# 同步数据库模式（使用 db push 而不是 migrate，更适合 Docker 环境）
echo "🔄 Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss

# 初始化示例数据（三种酒）
echo "🍸 Seeding database with sample cocktails (Mojito, Margarita, Cosmopolitan)..."
pnpm prisma:seed

echo "✅ Database initialization completed!"

# 启动应用
echo "🌟 Starting Next.js application..."
exec pnpm start

