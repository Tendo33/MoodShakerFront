/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 添加CORS配置
  async headers() {
    return [
      {
        // 允许所有来源访问API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
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
