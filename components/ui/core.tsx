"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "neon"
    | "bubble"
    | "shine"; // Kept for backward compatibility
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  effect?: "none" | "shine" | "pulse" | "glow" | "lift" | "ring";
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
      effect = "none",
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
    const { t } = useLanguage();
    const baseStyles =
      "relative font-medium rounded-full transition-all duration-300 flex items-center justify-center font-source-sans focus-ring transform-gpu active:scale-95 disabled:active:scale-100 whitespace-nowrap";

    const variantStyles = {
      primary:
        "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.6)]",
      secondary:
        "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_4px_14px_0_hsl(var(--secondary)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--secondary)/0.6)]",
      outline:
        "bg-transparent border-2 border-border hover:bg-accent/10 hover:border-accent text-foreground hover:shadow-[0_0_15px_hsl(var(--accent)/0.2)]",
      ghost:
        "bg-transparent hover:bg-accent/10 text-foreground",
      link: "bg-transparent text-primary hover:text-secondary p-0 hover:underline font-medium",
      neon: "bg-transparent border-2 border-primary text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:bg-primary/10",
      bubble:
        "bg-gradient-to-r from-primary to-secondary text-white overflow-hidden before:content-[''] before:absolute before:inset-0 before:scale-0 hover:before:scale-100 before:rounded-full before:transition-transform before:duration-500 before:bg-white/20 shadow-lg hover:shadow-xl",
      shine:
        "bg-gradient-to-r from-primary to-secondary text-white overflow-hidden shadow-lg hover:shadow-xl", // Logic moved to effect="shine"
    };

    const effectStyles = {
      none: "",
      shine: "overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
      pulse: "animate-pulse",
      glow: "hover:shadow-[0_0_20px_currentColor] hover:border-current",
      lift: "hover:-translate-y-1 hover:shadow-lg",
      ring: "hover:ring-2 hover:ring-offset-2 hover:ring-primary",
    };

    // Apply default hover scale if no specific effect overrides it or if it's 'none'/'shine'/'glow' which usually pair well with scale
    // But 'lift' does its own transform.
    const defaultTransform = effect === "lift" ? "" : "hover:scale-105";
    
    // Compatibility: if variant is 'shine', force effect='shine' if not specified
    const activeEffect = variant === 'shine' && effect === 'none' ? 'shine' : effect;

    const sizeStyles = {
      xs: "px-3 py-1 text-xs",
      sm: "px-4 py-1.5 text-sm",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3 text-base",
      xl: "px-10 py-3.5 text-lg",
    };

    const widthStyles = fullWidth ? "w-full" : "w-auto";
    const disabledStyles =
      props.disabled || isLoading
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : "cursor-pointer";

    const buttonStyles = `
      ${baseStyles} 
      ${variantStyles[variant]} 
      ${effectStyles[activeEffect]}
      ${defaultTransform}
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
            <span>{t("common.loading")}</span>
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
    void from;
    void to;
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
