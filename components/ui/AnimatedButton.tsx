"use client";

import type React from "react";

import { useState } from "react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export default function AnimatedButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // 基础样式
  const baseStyles =
    "relative overflow-hidden font-medium rounded-full transition-all";

  // 变体样式
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white shadow-lg",
    secondary:
      "bg-white/10 hover:bg-white/20 border border-white/20 text-white",
    outline:
      "bg-transparent border border-gray-700/50 hover:bg-white/5 text-white",
    ghost: "bg-transparent hover:bg-white/5 text-white",
  };

  // 尺寸样式
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  // 禁用样式
  const disabledStyles =
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  // 动画样式
  const animationStyles = `
    after:content-[''] after:absolute after:h-full after:w-full after:top-0 after:left-0 
    after:bg-white after:opacity-0 after:transition-opacity after:duration-300
    hover:after:opacity-10 active:after:opacity-20
    transform transition-transform duration-150 
    ${isPressed ? "scale-95" : "scale-100"}
  `;

  // 组合所有样式
  const buttonStyles = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${disabledStyles}
    ${animationStyles}
    ${className}
  `;

  // 处理点击事件
  const handleClick = () => {
    if (disabled || isLoading) return;

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (onClick) onClick();
  };

  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      <span className="relative z-10 flex items-center justify-center">
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="mr-2">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="ml-2">{icon}</span>
            )}
          </>
        )}
      </span>
    </button>
  );
}
