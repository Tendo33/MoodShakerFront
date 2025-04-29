"use server";

import fs from "fs";
import path from "path";

export async function organizeImages() {
  const publicDir = path.join(process.cwd(), "public");

  // 创建主要图片目录
  const directories = [
    "branding",
    "hero",
    "cocktails",
    "ui",
    "icons",
    "spirits",
    "tools",
    "mobile",
  ];

  for (const dir of directories) {
    const dirPath = path.join(publicDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  return { success: true, message: "图片目录已创建" };
}
