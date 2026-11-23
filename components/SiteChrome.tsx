import Link from "next/link";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { MenuLink } from "@/components/MenuLink";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";
import { Button } from "@/components/action-button";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="frame flex h-20 items-center justify-between gap-2 sm:gap-6">
      <a href="#main" className="skip-link bg-ink px-4 py-2 text-bone">
        {dict.nav.skip}
      </a>
      <Link
        href={localizePath("/", locale)}
        aria-label={dict.nav.home}
        className="group flex items-center gap-3 py-2 text-lead font-medium tracking-[-0.03em]"
      >
        {/* The footer's block wordmark, in three blocks. */}
        <span aria-hidden className="flex items-end gap-[3px] max-[419px]:hidden">
          <span className="h-3.5 w-2 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-125" style={{ backgroundColor: MOOD_COLORS.unwind }} />
          <span className="h-5 w-2 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-75" style={{ backgroundColor: MOOD_COLORS.celebrate }} />
          <span className="h-3 w-2 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-150" style={{ backgroundColor: MOOD_COLORS.romantic }} />
        </span>
        MoodShaker
      </Link>
      <nav className="flex items-center gap-1 whitespace-nowrap sm:gap-6">
        <MenuLink href={localizePath("/gallery", locale)}>{dict.nav.menu}</MenuLink>
        <LanguageSwitch locale={locale} label={dict.nav.switchTo} ariaLabel={dict.nav.switchLabel} />
        <Button render={<Link href={localizePath("/questions", locale)} />} className="sm:h-11 px-4">
          {dict.nav.shake}
        </Button>
      </nav>
    </header>
  );
}

const LETTERS = "MOODSHAKER".split("");
const FIELDS = Object.values(MOOD_COLORS);
const HEIGHTS = [78, 100, 64, 88, 72, 96, 60, 84, 92, 70];
const MARK_W = 1000;
const MARK_H = 230;
const GAP = 4;
const BLOCK_W = (MARK_W - GAP * (LETTERS.length - 1)) / LETTERS.length;

/** The wordmark as ten blocks in the mood colours, each letter standing on the baseline. */
function BlockMark() {
  return (
    <svg viewBox={`0 0 ${MARK_W} ${MARK_H}`} role="img" aria-label="MoodShaker" className="block h-auto w-full">
      {LETTERS.map((letter, index) => {
        const height = (MARK_H * HEIGHTS[index]) / 100;
        const x = index * (BLOCK_W + GAP);
        return (
          <g key={index}>
            <rect x={x} y={MARK_H - height} width={BLOCK_W} height={height} fill={FIELDS[index % FIELDS.length]} />
            <text
              x={x + BLOCK_W / 2}
              y={MARK_H - 8}
              textAnchor="middle"
              fontSize={112}
              fontWeight={500}
              letterSpacing={-4}
              fill="#1a1a1a"
              style={{ fontFamily: "var(--font-hanken), sans-serif" }}
            >
              {letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** The name closes every page, built from blocks in the six mood colours. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="mt-32 bg-night text-bone">
      <div className="frame pt-16 pb-10">
        <div className="reveal">
          <BlockMark />
        </div>
        <div className="mt-14 grid gap-10 sm:grid-cols-12">
          <nav className="reveal flex flex-col sm:col-span-4">
            <Link href={localizePath("/questions", locale)} className="link flex min-h-11 w-fit items-center">
              {dict.nav.shake}
            </Link>
            <Link href={localizePath("/gallery", locale)} className="link flex min-h-11 w-fit items-center">
              {dict.nav.menu}
            </Link>
          </nav>
          <div className="reveal space-y-3 text-bone/75 sm:col-span-6 sm:col-start-7 [--i:1]">
            <p>{dict.footer.credit}</p>
            <p>{dict.footer.disclaimer}</p>
          </div>
        </div>
        <p className="reveal mt-14 text-small text-bone/60 [--i:2]">© {new Date().getFullYear()} MoodShaker</p>
      </div>
    </footer>
  );
}
