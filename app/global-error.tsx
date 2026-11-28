"use client";

import "./globals.css";
import { Button } from "@/components/action-button";

/**
 * Last resort, shown when the root layout itself fails. It replaces the whole
 * document, so it cannot know the locale or reach the dictionaries; both
 * languages are written out.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="frame flex min-h-dvh flex-col justify-center py-16">
          <h1 className="text-head">吧台出了点状况</h1>
          <p lang="en" className="mt-3 text-lead">
            Spilled behind the bar
          </p>
          <p className="measure mt-8">
            再试一次；还不行的话，刷新页面。
            <span lang="en" className="block">
              Try again. If it keeps happening, refresh the page.
            </span>
          </p>
          <div className="mt-10">
            <Button type="button" onClick={reset}>
              重试 · Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
