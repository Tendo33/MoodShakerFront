"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isEnglish] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }

    return document.documentElement.lang.startsWith("en");
  });

  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang={isEnglish ? "en" : "zh-CN"}>
      <body className="bg-black text-white font-mono flex items-center justify-center min-h-screen">
        <div className="text-center p-8 border-2 border-[#FF00FF] shadow-[0_0_16px_rgba(255,0,255,0.5)] bg-black/80 max-w-lg">
          <h2 className="text-3xl font-bold mb-4 text-[#00FFFF] drop-shadow-[0_0_10px_currentColor]">
            {isEnglish ? "System Failure" : "系统故障"}
          </h2>
          <p className="mb-6 opacity-80">
            {isEnglish
              ? "A critical error occurred in the atmospheric simulation matrix."
              : "模拟矩阵发生了严重错误。"}
          </p>
          <button
            className="px-6 py-2 border-2 border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900]/20 hover:shadow-[0_0_15px_rgba(255,153,0,0.5)] transition-all uppercase tracking-widest"
            onClick={() => reset()}
          >
            {isEnglish ? "Reboot System" : "重启系统"}
          </button>
        </div>
      </body>
    </html>
  );
}
