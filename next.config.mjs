/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript 严格模式 - 不忽略构建错误
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bizyair-prod.oss-cn-shanghai.aliyuncs.com',
      },
    ],
  },
  // 添加重写规则，将静态资源请求重定向到根路径
  async rewrites() {
    return [
      {
        source: "/:lang/:path*",
        destination: "/:path*",
        has: [
          {
            type: "header",
            key: "accept",
            value: "image/.*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
