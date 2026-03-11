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
      "relative rounded-none font-medium transition-all duration-200 flex items-center justify-center font-mono uppercase tracking-wider focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/90 focus-visible:ring-offset-2 focus-visible:ring-offset-background transform-gpu active:scale-95 disabled:active:scale-100 whitespace-nowrap";

    const variantStyles = {
      primary:
        "bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-black hover:shadow-[0_0_20px_var(--color-secondary)]",
      secondary:
        "bg-primary border-2 border-primary text-black hover:scale-105 hover:opacity-90 neon-glow-primary",
      outline:
        "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black",
      ghost:
        "bg-transparent text-foreground hover:bg-[rgba(0,255,255,0.1)] hover:text-secondary",
      link: "bg-transparent text-secondary hover:text-primary p-0 hover:underline font-medium hover:neon-glow-secondary",
      neon: "bg-transparent border-2 border-primary text-primary shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_40px_rgba(255,0,255,0.8)] hover:bg-primary hover:text-black",
      bubble:
        "bg-gradient-to-r from-accent via-primary to-secondary text-black hover:scale-105 shadow-[0_0_15px_rgba(255,0,255,0.5)]",
      shine:
        "bg-secondary border-2 border-secondary text-black hover:shadow-[0_0_30px_var(--color-secondary)]",
    };

    const effectStyles = {
      none: "",
      shine: "overflow-hidden hover:brightness-125",
      pulse: "animate-neon-pulse hover:animate-none",
      glow: "hover:shadow-[0_0_30px_currentColor] z-10",
      lift: "hover:-translate-y-2 hover:shadow-[0_15px_30px_-5px_var(--color-primary)]",
      ring: "hover:ring-2 hover:ring-offset-2 hover:ring-secondary",
    };

    const defaultTransform = "";

    const activeEffect = variant === 'shine' && effect === 'none' ? 'shine' : effect;

    const sizeStyles = {
      xs: "px-3 py-1 text-xs",
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
      xl: "px-10 py-4 text-lg",
    };

    const widthStyles = fullWidth ? "w-full" : "w-auto";
    const disabledStyles =
      props.disabled || isLoading
        ? "opacity-50 cursor-not-allowed pointer-events-none grayscale"
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
      <span className="inline-flex items-center">
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
            <span>{t("common.loading")}</span>
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="mr-2 flex items-center drop-shadow-[0_0_8px_currentColor]">{icon}</span>
            )}
            <span className="drop-shadow-[0_0_8px_currentColor]">{children}</span>
            {icon && iconPosition === "right" && (
              <span className="ml-2 flex items-center drop-shadow-[0_0_8px_currentColor]">{icon}</span>
            )}
            {external && <ExternalLink className="ml-1.5 h-3.5 w-3.5 drop-shadow-[0_0_8px_currentColor]" />}
          </>
        )}
      </span>
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
          className={`h-full w-px bg-primary/50 shadow-[0_0_10px_var(--color-primary)] mx-2 ${className}`}
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
          <div className="grow h-0.5 bg-linear-to-r from-transparent to-primary shadow-[0_0_10px_var(--color-primary)]" />
          <span className="px-4 text-sm font-mono tracking-widest text-primary uppercase">{label}</span>
          <div className="grow h-0.5 bg-linear-to-l from-transparent to-primary shadow-[0_0_10px_var(--color-primary)]" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`w-full h-0.5 bg-linear-to-r from-primary via-secondary to-accent shadow-[0_0_15px_var(--color-secondary)] my-4 ${className}`}
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
        className={`w-full px-4 md:px-6 lg:px-8 mx-auto ${sizeStyles[size]} ${centered ? "flex flex-col items-center" : ""} ${className}`}
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
        className={`gradient-text font-heading font-black tracking-tight ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
GradientText.displayName = "GradientText";
