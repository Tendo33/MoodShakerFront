"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Button Component with improved flexibility and consistency
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "neon"
    | "bubble"
    | "shine";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  href?: string;
  fullWidth?: boolean;
  external?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      href,
      fullWidth = false,
      external = false,
      ...props
    },
    ref,
  ) => {
    // Base styles
    const baseStyles =
      "relative font-medium rounded-full transition-all duration-300 flex items-center justify-center";

    // Variant styles - enhanced with more options and better contrast
    const variantStyles = {
      primary:
        "bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white shadow-md before:content-[''] before:absolute before:inset-0 before:rounded-full before:opacity-0 before:transition-opacity hover:before:opacity-20 before:bg-white active:scale-95",
      secondary:
        "bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-95",
      outline:
        "bg-transparent border border-gray-700/50 hover:bg-white/5 text-white active:scale-95",
      ghost: "bg-transparent hover:bg-white/5 text-white active:scale-95",
      link: "bg-transparent text-amber-500 hover:text-pink-500 p-0 hover:underline",
      // New styles inspired by uiverse.io
      neon: "bg-transparent border border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:shadow-[0_0_20px_rgba(245,158,11,0.7)] hover:bg-amber-500/10 active:scale-95",
      bubble:
        "bg-gradient-to-r from-amber-500 to-pink-500 text-white overflow-hidden before:content-[''] before:absolute before:inset-0 before:scale-0 hover:before:scale-100 before:rounded-full before:transition-transform before:duration-500 before:bg-white/20 active:scale-95",
      shine:
        "bg-gradient-to-r from-amber-500 to-pink-500 text-white overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 active:scale-95",
    };

    // Size styles - expanded with more options
    const sizeStyles = {
      xs: "px-2.5 py-1 text-xs",
      sm: "px-3.5 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
      xl: "px-8 py-4 text-xl",
    };

    // Width styles
    const widthStyles = fullWidth ? "w-full" : "w-auto";

    // Disabled styles
    const disabledStyles =
      props.disabled || isLoading
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";

    // Animation styles - improved focus states and animations
    const animationStyles = `
      focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
    `;

    // Combined styles
    const buttonStyles = `
      ${baseStyles} 
      ${variantStyles[variant]} 
      ${variant !== "link" ? sizeStyles[size] : ""} 
      ${disabledStyles}
      ${variant !== "link" ? animationStyles : ""}
      ${widthStyles}
      ${className}
    `;

    // Button content
    const buttonContent = (
      <>
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="mr-2 flex items-center">{icon}</span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className="ml-2 flex items-center">{icon}</span>
            )}
            {external && <ExternalLink className="ml-1.5 h-3.5 w-3.5" />}
          </>
        )}
      </>
    );

    // Render as Link if href is provided
    if (href) {
      return (
        <Link
          href={href}
          className={`${buttonStyles} inline-flex items-center justify-center`}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {buttonContent}
        </Link>
      );
    }

    // Otherwise render as button
    return (
      <button ref={ref} className={buttonStyles} {...props}>
        {buttonContent}
      </button>
    );
  },
);
Button.displayName = "Button";

// Card Components with improved flexibility
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  hoverEffect?: boolean;
  delay?: number;
  bordered?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      gradient = false,
      hoverEffect = true,
      delay = 0,
      bordered = true,
      padding = "md",
      ...props
    },
    ref,
  ) => {
    // Animation variants
    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: delay * 0.1 },
      },
    };

    // Padding styles
    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-7",
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants}
        className={`
          relative overflow-hidden rounded-xl 
          ${bordered ? "border border-gray-700" : ""} 
          bg-gray-800/90 backdrop-blur-sm
          ${hoverEffect ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" : ""}
          ${className}
        `}
        {...props}
      >
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-pink-500/5 pointer-events-none" />
        )}
        <div className={`relative z-10 ${paddingStyles[padding]}`}>
          {children}
        </div>
      </motion.div>
    );
  },
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <h3 ref={ref} className={`text-xl font-bold ${className}`} {...props}>
      {children}
    </h3>
  );
});
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <p ref={ref} className={`text-gray-400 text-sm ${className}`} {...props}>
      {children}
    </p>
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div ref={ref} className={`mt-4 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
});
CardFooter.displayName = "CardFooter";

// Form Components with improved accessibility and consistency
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ icon: Icon, label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              bg-gray-800 border border-gray-700 text-white text-sm rounded-lg 
              focus:ring-amber-500 focus:border-amber-500 block w-full 
              ${Icon ? "pl-10" : "pl-3"} p-3 
              ${error ? "border-red-500" : ""} 
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId =
      id || `password-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={`
              bg-gray-800 border border-gray-700 text-white text-sm rounded-lg 
              focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 pr-10 p-3 
              ${error ? "border-red-500" : ""} 
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

// Badge component for status indicators and labels
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  size?: "sm" | "md" | "lg";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, className = "", variant = "default", size = "md", ...props },
    ref,
  ) => {
    const variantStyles = {
      default: "bg-gray-700 text-gray-200",
      primary: "bg-gradient-to-r from-amber-500 to-pink-500 text-white",
      secondary: "bg-gray-600 text-white",
      success:
        "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30",
      warning: "bg-amber-500/20 text-amber-500 border border-amber-500/30",
      danger: "bg-red-500/20 text-red-500 border border-red-500/30",
      info: "bg-blue-500/20 text-blue-500 border border-blue-500/30",
    };

    const sizeStyles = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-0.5 text-sm",
      lg: "px-3 py-1 text-base",
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Badge.displayName = "Badge";

// Divider component for visual separation
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className = "", orientation = "horizontal", label, ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          className={`h-full w-px bg-gray-700 mx-2 ${className}`}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          className={`relative w-full flex items-center my-4 ${className}`}
          {...props}
        >
          <div className="flex-grow h-px bg-gray-700" />
          <span className="px-3 text-sm text-gray-400">{label}</span>
          <div className="flex-grow h-px bg-gray-700" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`w-full h-px bg-gray-700 my-4 ${className}`}
        {...props}
      />
    );
  },
);
Divider.displayName = "Divider";

// Container component for consistent layout
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  centered?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    { children, className = "", size = "lg", centered = false, ...props },
    ref,
  ) => {
    const sizeStyles = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={`w-full px-4 mx-auto ${sizeStyles[size]} ${centered ? "flex flex-col items-center" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Container.displayName = "Container";

// Gradient text component for consistent styling
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: React.ElementType;
  from?: string;
  to?: string;
}

export const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(
  (
    {
      as: Component = "span",
      children,
      className = "",
      from = "amber-500",
      to = "pink-500",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={`bg-gradient-to-r from-${from} to-${to} bg-clip-text text-transparent ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
GradientText.displayName = "GradientText";
