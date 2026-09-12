"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { appLogger, safeLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

function ErrorFallback() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <CircleAlert className="mb-4 h-10 w-10 text-primary" />
      <h2 className="mb-2 font-heading text-xl font-bold tracking-wide text-primary">
        {t("error.boundary.title")}
      </h2>
      <p className="mb-4 max-w-md font-mono text-muted-foreground">
        {t("error.boundary.description")}
      </p>
      <Button
        variant="primary"
        type="button"
        onClick={() => {
          window.location.reload();
        }}
      >
        {t("error.boundary.refresh")}
      </Button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误本身，而不只是组件名。这段代码运行在浏览器里，错误对象
    // 用户在 devtools 里本来就能看到，所以这里不存在额外的信息暴露。
    // 之前生产环境只记 "Component error: ErrorBoundary"，没有 message
    // 也没有 stack，等于崩溃了但查不到原因。
    safeLogger.appError("ErrorBoundary", error);

    if (process.env.NODE_ENV === "development") {
      appLogger.error("Error caught by ErrorBoundary", {
        error,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || <ErrorFallback />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
