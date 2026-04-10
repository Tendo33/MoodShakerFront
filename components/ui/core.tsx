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
      "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-none border text-center leading-tight font-mono uppercase tracking-[0.18em] whitespace-normal sm:whitespace-nowrap transition-[transform,box-shadow,border-color,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/90 focus-visible:ring-offset-2 focus-visible:ring-offset-background transform-gpu active:scale-[0.985] disabled:active:scale-100";

    const variantStyles = {
      primary:
        "border-secondary/70 bg-secondary/8 text-secondary shadow-[0_0_0_1px_rgba(93,246,255,0.12),0_14px_32px_rgba(3,0,9,0.22)] hover:border-secondary hover:bg-secondary hover:text-[#091219] hover:shadow-[0_18px_38px_rgba(3,0,9,0.28),0_0_22px_rgba(93,246,255,0.28)]",
      secondary:
        "border-primary/70 bg-primary/16 text-primary shadow-[0_14px_32px_rgba(3,0,9,0.22)] hover:border-primary hover:bg-primary hover:text-[#180320] hover:shadow-[0_18px_38px_rgba(3,0,9,0.28),0_0_22px_rgba(255,79,216,0.26)]",
      outline:
        "border-primary/40 bg-transparent text-primary shadow-[0_12px_24px_rgba(3,0,9,0.14)] hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_16px_34px_rgba(3,0,9,0.22),0_0_18px_rgba(255,79,216,0.16)]",
      ghost:
        "border-transparent bg-transparent text-foreground/88 hover:border-white/10 hover:bg-white/5 hover:text-secondary",
      link:
        "border-transparent bg-transparent p-0 text-secondary hover:text-primary hover:underline font-medium shadow-none",
      neon:
        "border-primary/75 bg-[linear-gradient(135deg,rgba(255,79,216,0.18),rgba(19,10,37,0.68))] text-primary shadow-[0_18px_36px_rgba(3,0,9,0.24),0_0_16px_rgba(255,79,216,0.18)] hover:bg-primary hover:text-[#180320] hover:shadow-[0_22px_40px_rgba(3,0,9,0.28),0_0_28px_rgba(255,79,216,0.3)]",
      bubble:
        "border-transparent bg-linear-to-r from-accent via-primary to-secondary text-[#12071d] shadow-[0_18px_36px_rgba(3,0,9,0.28)] hover:brightness-105 hover:shadow-[0_24px_46px_rgba(3,0,9,0.32)]",
      shine:
        "border-secondary bg-secondary text-[#091219] shadow-[0_18px_36px_rgba(3,0,9,0.24),0_0_16px_rgba(93,246,255,0.16)] hover:shadow-[0_22px_42px_rgba(3,0,9,0.28),0_0_24px_rgba(93,246,255,0.26)]",
    };

    const effectStyles = {
      none: "",
      shine: "overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-full",
      pulse: "animate-neon-pulse hover:animate-none",
      glow: "hover:shadow-[0_18px_38px_rgba(3,0,9,0.28),0_0_18px_currentColor] z-10",
      lift: "hover:-translate-y-1.5 hover:shadow-[0_18px_38px_rgba(3,0,9,0.28)]",
      ring: "hover:ring-2 hover:ring-offset-2 hover:ring-secondary/65",
    };

    const defaultTransform = "";

    const activeEffect = variant === "shine" && effect === "none" ? "shine" : effect;

    const sizeStyles = {
      xs: "min-h-10 px-3 py-2 text-[11px]",
      sm: "min-h-10 px-4 py-2.5 text-xs",
      md: "min-h-11 px-5 py-3 text-sm",
      lg: "min-h-12 px-7 py-3.5 text-sm",
      xl: "min-h-14 px-9 py-4 text-base",
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
      <span className="relative z-10 inline-flex items-center">
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
            <span>{t("common.loading")}</span>
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="flex items-center opacity-90">{icon}</span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className="flex items-center opacity-90">{icon}</span>
            )}
            {external && <ExternalLink className="h-3.5 w-3.5 opacity-80" />}
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
