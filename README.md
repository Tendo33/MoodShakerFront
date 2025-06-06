# 🎭 MoodShaker - 你的心情调酒师

> "生活就像一杯鸡尾酒，有时候需要一点调味，有时候需要一点摇晃，但最重要的是要找到属于自己的配方。"

## 🎨 这是什么？

MoodShaker 是一个让你心情变好的神奇应用！就像一位专业的调酒师，它能够根据你的心情，为你调制出最适合的"心情鸡尾酒"。无论是开心、难过、焦虑还是兴奋，MoodShaker 都能帮你找到最合适的解决方案。

1. 经过几道选择：
![MoodShaker Banner](assert/img1.png)

2. 鸡尾酒配方详情页：
![MoodShaker Features](assert/img2.png)

3. 鸡尾酒制作步骤：
![Getting Started](assert/img3.png)

## ✨ 主要特点

- 🎯 基于 Next.js 15 的现代化前端架构
- 🎨 使用 Radix UI 打造的精致界面
- 🎭 响应式设计，让你的心情在任何设备上都能得到照顾
- 📊 使用 Recharts 实现的数据可视化，让你的心情变化一目了然
- 🌈 支持明暗主题切换，就像调酒师会根据场合选择不同的灯光
- 🎬 流畅的动画效果，让你的心情转换更加丝滑

## 🚀 快速开始

### 环境变量配置

在开始之前，你需要配置以下环境变量。将 `.env.example` 文件重命名为 `.env`，然后填写相应的值：

```bash
# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_OPENAI_MODEL=deepseek-v3-250324

# Image Generation Configuration(siliconflow)
NEXT_PUBLIC_IMAGE_API_URL=https://api.siliconflow.cn/v1/images/generations
NEXT_PUBLIC_IMAGE_API_KEY=your_image_api_key_here
NEXT_PUBLIC_IMAGE_MODEL=Kwai-Kolors/Kolors

# Application Configuration
HOST_PORT=3000
```

### 方法一：本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Tendo33/MoodShakerFront
cd MoodShakerFront

# 2. 配置环境变量
mv .env.example .env
# 编辑 .env 文件，填写必要的环境变量

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm dev
```

### 方法二：Docker 部署
```bash
# 1. 配置环境变量
mv .env.example .env
# 编辑 .env 文件，填写必要的环境变量

# 2. 一键启动所有服务
docker-compose up -d
```

## 🛠️ 开发工具箱

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 代码质量检查

## 🏗️ 项目结构

```
MoodShakerFront/
├── app/              # 主应用区域
├── components/       # 可复用组件
├── context/         # 状态管理
├── hooks/           # 自定义钩子
├── lib/             # 工具函数
├── public/          # 静态资源
├── services/        # API 服务
├── styles/          # 全局样式
└── utils/           # 辅助函数
```

## 🛠️ 技术栈

- **框架**: Next.js 15
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Radix UI

## 🤝 加入我们

想要成为我们的调酒师吗？欢迎提交 Pull Request！让我们一起调制出更多精彩的心情鸡尾酒！

## 📝 许可证

[MIT](https://opensource.org/licenses/MIT)

## 👨‍💻 作者

## [Tendo33](https://simonsun.cc)
