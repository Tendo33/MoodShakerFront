"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { generateComponentId } from "@/utils/generateId";

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
    const baseStyles =
      "relative font-medium rounded-xl transition-all duration-300 flex items-center justify-center font-source-sans focus-ring";

    const variantStyles = {
      primary:
        "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/25 active:scale-95 glow-effect",
      secondary:
        "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl hover:shadow-secondary/25 active:scale-95",
      outline:
        "bg-transparent border-2 border-border hover:bg-accent/10 hover:border-accent text-foreground active:scale-95",
      ghost:
        "bg-transparent hover:bg-accent/10 text-foreground active:scale-95",
      link: "bg-transparent text-primary hover:text-secondary p-0 hover:underline font-medium",
      neon: "bg-transparent border-2 border-primary text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:bg-primary/10 active:scale-95",
      bubble:
        "bg-gradient-to-r from-primary to-secondary text-white overflow-hidden before:content-[''] before:absolute before:inset-0 before:scale-0 hover:before:scale-100 before:rounded-xl before:transition-transform before:duration-500 before:bg-white/20 active:scale-95",
      shine:
        "bg-gradient-to-r from-primary to-secondary text-white overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 active:scale-95",
    };

    const sizeStyles = {
      xs: "px-3 py-1.5 text-xs",
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      xl: "px-10 py-5 text-xl",
    };

    const widthStyles = fullWidth ? "w-full" : "w-auto";
    const disabledStyles =
      props.disabled || isLoading
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";

    const buttonStyles = `
      ${baseStyles} 
      ${variantStyles[variant]} 
      ${variant !== "link" ? sizeStyles[size] : ""} 
      ${disabledStyles}
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

interface CardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onDrag" | "onDragStart" | "onDragEnd"
  > {
  gradient?: boolean;
  hoverEffect?: boolean;
  delay?: number;
  bordered?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  glass?: boolean;
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
      glass = false,
      ...props
    },
    ref,
  ) => {
    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: delay * 0.1 },
      },
    };

    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants as any}
        className={`
          relative overflow-hidden rounded-xl 
          ${bordered ? "border border-border" : ""} 
          ${glass ? "glass-effect" : "bg-card"}
          ${hoverEffect ? "card-hover" : ""}
          ${gradient ? "glow-effect" : ""}
          ${className}
        `}
        {...props}
      >
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
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
    <h3
      ref={ref}
      className={`text-xl font-bold font-playfair ${className}`}
      {...props}
    >
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
    <p
      ref={ref}
      className={`text-muted-foreground text-sm font-source-sans leading-relaxed ${className}`}
      {...props}
    >
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

// Enhanced Form Components with improved accessibility and consistency
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ icon: Icon, label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || generateComponentId("input");

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
    const inputId = id || generateComponentId("password");

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
      default: "bg-muted text-muted-foreground",
      primary: "bg-primary text-primary-foreground shadow-sm",
      secondary: "bg-secondary text-secondary-foreground shadow-sm",
      success:
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      danger: "bg-red-500/20 text-red-400 border border-red-500/30",
      info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    };

    const sizeStyles = {
      sm: "px-2.5 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base",
    };

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={`inline-flex items-center rounded-full font-medium font-source-sans ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Badge.displayName = "Badge";

// Enhanced Divider component for visual separation
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

// Enhanced Container component for consistent layout
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
      from = "primary",
      to = "secondary",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={`gradient-text font-playfair font-bold ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
GradientText.displayName = "GradientText";
