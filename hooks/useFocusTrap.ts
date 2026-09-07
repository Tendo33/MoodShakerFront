"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseFocusTrapOptions {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.tabIndex !== -1,
  );
}

export function useFocusTrap({
  isOpen,
  containerRef,
  initialFocusRef,
  onClose,
}: UseFocusTrapOptions) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // onClose 存进 ref，不进 effect 的依赖数组。
  //
  // 之前它在依赖数组里，而调用方传的是内联箭头（Header.tsx:26 的
  // `onClose: () => setIsMobileMenuOpen(false)`），每次渲染都是新引用，于是这个
  // effect 每次渲染都重跑一遍：cleanup 先把焦点还给打开按钮，重跑再 rAF 聚焦到
  // 第一个可聚焦元素。
  //
  // 实测：用户 Tab 到第三项后触发一次重渲染，焦点被拽回第一项。抽屉打开时页面
  // 滚动就会触发（Header.tsx:29 的滚动监听改 isScrolled），所以这在真实使用中
  // 可达 —— 键盘用户每滚一下就被踢回菜单开头。
  //
  // ref 里始终是最新的回调，所以 Escape 依然调到当前那一个。
  // 写入放在 effect 里而不是渲染期间：渲染期间改 ref 会被 react-hooks/refs 拦下，
  // 而且在并发渲染下渲染可能被丢弃或重放，写入时机没有保证。
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const focusInitialElement = () => {
      const focusableElements = getFocusableElements(container);
      const fallbackElement = focusableElements[0] ?? container;
      (initialFocusRef?.current ?? fallbackElement).focus();
    };

    const frame = window.requestAnimationFrame(focusInitialElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!activeElement || activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus();
    };
    // onClose 不在这里 —— 它经 onCloseRef 读取。containerRef 和 initialFocusRef
    // 是调用方用 useRef 建的 ref 对象，本身稳定。
  }, [containerRef, initialFocusRef, isOpen]);
}
