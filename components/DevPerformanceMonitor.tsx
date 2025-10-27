"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

const NoopComponent: ComponentType = () => null;

const DevOnlyMonitor: ComponentType =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/PerformanceMonitor"), {
        ssr: false,
        loading: () => null,
      })
    : NoopComponent;

export default function DevPerformanceMonitor() {
  return <DevOnlyMonitor />;
}
