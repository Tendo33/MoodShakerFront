"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useError } from "@/context/ErrorContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ErrorAlert() {
  const { message, clearError } = useError();
  const { theme } = useTheme();
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!message);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div
        className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden transform ease-out duration-300 transition ${
          isVisible
            ? "translate-y-0 opacity-100 sm:translate-x-0"
            : "translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        } ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p
                className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {locale === "en" ? "Error" : "错误"}
              </p>
              <p
                className={`mt-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={clearError}
                className={`inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150 ${
                  theme === "dark"
                    ? "hover:text-gray-300"
                    : "hover:text-gray-600"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
