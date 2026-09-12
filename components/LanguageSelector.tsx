"use client";

import { useMemo, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, type Locale } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  idBase?: string;
}

export default function LanguageSelector({
  idBase = "language-selector",
}: LanguageSelectorProps) {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // availableLanguages 是数组 ["cn", "en"]，不是对象。
  //
  // 这里原本是 Object.entries(availableLanguages)，在数组上得到的是
  // [["0", "cn"], ["1", "en"]] —— code 拿到的是下标字符串。后果有三个：
  // 点击后 setLanguage("0") 跳到 /0/questions（无效路由，语言切不动）；
  // selectedIndex 恒为 -1，当前语言永远不显示选中；
  // 显示名变成 "cn"/"en" 而不是「中文」/「English」，国旗判断也永不成立。
  const languageOptions = useMemo(
    () =>
      availableLanguages.map(
        (code) => [code, t(`language.${code}`)] as const,
      ),
    [availableLanguages, t],
  );

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        id={`${idBase}-trigger`}
        className={cn(
          "focus-ring flex min-h-11 items-center gap-2 border px-5 py-2.5 font-mono text-sm uppercase tracking-[0.18em] transition-all duration-300",
          isOpen
            ? "border-primary/55 bg-primary/16 text-primary shadow-[0_16px_28px_rgba(3,0,9,0.22)]"
            : "border-primary/28 bg-black/40 text-primary/80 hover:border-primary/45 hover:bg-black/65 hover:text-primary hover:shadow-[0_16px_28px_rgba(3,0,9,0.18)]",
        )}
        aria-label={t("language.select")}
      >
        <Globe className={cn("h-4 w-4", isOpen && "text-primary")} />
        <span className="hidden font-mono text-sm font-bold tracking-[0.18em] md:inline">
          {t(language === "en" ? "language.en" : "language.cn")}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-300",
            isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("language.select")}</DropdownMenuLabel>
        {languageOptions.map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLanguage(code as Locale)}
            className={
              language === code
                ? "bg-primary/18 font-bold text-primary shadow-[inset_3px_0_0_rgba(255,79,216,1)]"
                : undefined
            }
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{code === "en" ? "🇺🇸" : "🇨🇳"}</span>
              <span>{name}</span>
            </span>
            {language === code ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
