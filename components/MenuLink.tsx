"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's link to the menu, marked when the menu is the page being read.
 * Split out so the header and footer stay on the server and the dictionary is
 * not sent to the browser with them.
 */
export function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`nav-link py-2 max-[379px]:hidden ${current ? "font-medium" : ""}`}
    >
      {children}
    </Link>
  );
}
