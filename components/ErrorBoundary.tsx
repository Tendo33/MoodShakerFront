"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { appLogger, safeLogger } from "@/utils/logger";
import { gradientStyles } from "@/utils/style-constants";
import { useLanguage } from "@/context/LanguageContext";

// Error fallback component that can use hooks
function ErrorFallback() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">{t("error.boundary.title")}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {t("error.boundary.description")}
      </p>
      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        className={`px-4 py-2 ${gradientStyles.primaryButton} text-white rounded-full transition-all`}
      >
        {t("error.boundary.refresh")}
      </button>
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
    // 使用安全日志记录器，不暴露敏感信息
    safeLogger.appError("ErrorBoundary");

    // 详细错误信息仅在开发环境记录
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
