import * as motion from "motion/react-client";
import { reveal } from "@/lib/motion";
import Link from "next/link";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { MenuLink } from "@/components/MenuLink";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";
import { Button } from "@/components/action-button";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="frame flex h-[4.5rem] items-center justify-between gap-3 sm:h-20 sm:gap-6">
      <a href="#main" className="skip-link bg-ink px-4 py-2 text-bone">
        {dict.nav.skip}
      </a>
      <Link
        href={localizePath("/", locale)}
        aria-label={dict.nav.home}
        className="group flex items-baseline gap-2.5 py-2 text-[1.0625rem] font-medium tracking-[-0.035em] sm:gap-3 sm:text-lead"
      >
        {/* The footer's block wordmark, in three blocks: the shortest under the
            baseline, the tallest over it, so the mark sits on the same line as the name. */}
        <span aria-hidden className="flex translate-y-[-1px] items-end gap-[3px] self-center max-[419px]:hidden">
          <span className="h-[0.8125rem] w-[5px] origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-110" style={{ backgroundColor: MOOD_COLORS.unwind }} />
          <span className="h-[1.0625rem] w-[5px] origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-90" style={{ backgroundColor: MOOD_COLORS.celebrate }} />
          <span className="h-[0.6875rem] w-[5px] origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-125" style={{ backgroundColor: MOOD_COLORS.romantic }} />
        </span>
        <span>MoodShaker</span>
      </Link>
      <nav className="flex items-center gap-3 whitespace-nowrap sm:gap-7">
        <MenuLink href={localizePath("/gallery", locale)}>{dict.nav.menu}</MenuLink>
        <LanguageSwitch locale={locale} label={dict.nav.switchTo} ariaLabel={dict.nav.switchLabel} />
        <Button render={<Link href={localizePath("/questions", locale)} />} className="h-10 px-3 text-[0.9375rem] sm:h-11 sm:px-4 sm:text-base">
          {dict.nav.shake}
        </Button>
      </nav>
    </header>
  );
}

const LETTERS = "MOODSHAKER".split("");
const FIELDS = Object.values(MOOD_COLORS);
const HEIGHTS = [78, 100, 64, 88, 72, 96, 60, 84, 92, 70];
// Ten blocks of 98 and nine gaps of 4: whole numbers, so nothing lands on a half pixel.
const MARK_W = 1016;
const MARK_H = 230;
const GAP = 4;
const BLOCK_W = 98;

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
              y={MARK_H - 12}
              textAnchor="middle"
              fontSize={94}
              fontWeight={500}
              letterSpacing={-3}
              fill="#14120f"
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
        <motion.div {...reveal(0)}>
          <BlockMark />
        </motion.div>
        <div className="mt-14 grid gap-10 sm:grid-cols-12">
          <motion.nav {...reveal(0)} className="flex flex-col sm:col-span-4">
            <Link href={localizePath("/questions", locale)} className="link flex min-h-11 w-fit items-center">
              {dict.nav.shake}
            </Link>
            <Link href={localizePath("/gallery", locale)} className="link flex min-h-11 w-fit items-center">
              {dict.nav.menu}
            </Link>
          </motion.nav>
          <motion.div {...reveal(1)} className="space-y-3 text-bone/75 sm:col-span-6 sm:col-start-7">
            <p>{dict.footer.credit}</p>
            <p>{dict.footer.disclaimer}</p>
          </motion.div>
        </div>
        <motion.p {...reveal(2)} className="mt-14 text-small text-bone/60">© {new Date().getFullYear()} MoodShaker</motion.p>
      </div>
    </footer>
  );
}
