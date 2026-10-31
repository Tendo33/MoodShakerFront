import Link from "next/link";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import type { Dictionary } from "@/lib/dictionaries";
import { localizePath, type Locale } from "@/lib/i18n";
import { MOOD_COLORS } from "@/lib/moods";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="frame flex h-20 items-center justify-between gap-6">
      <Link href={localizePath("/", locale)} aria-label={dict.nav.home} className="text-lead font-medium tracking-[-0.03em]">
        MoodShaker
      </Link>
      <nav className="flex items-center gap-5 sm:gap-8">
        <Link href={localizePath("/gallery", locale)} className="link max-sm:hidden">
          {dict.nav.menu}
        </Link>
        <LanguageSwitch locale={locale} label={dict.nav.switchTo} ariaLabel={dict.nav.switchLabel} />
        <Link href={localizePath("/questions", locale)} className="btn btn-primary min-h-11 px-5">
          {dict.nav.shake}
        </Link>
      </nav>
    </header>
  );
}

const LETTERS = "MOODSHAKER".split("");
const FIELDS = Object.values(MOOD_COLORS);
const HEIGHTS = [78, 100, 64, 88, 72, 96, 60, 84, 92, 70];
const MARK_W = 1000;
const MARK_H = 340;
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
              fontSize={118}
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
        <BlockMark />
        <div className="mt-14 grid gap-10 sm:grid-cols-12">
          <nav className="flex flex-col gap-3 sm:col-span-4">
            <Link href={localizePath("/questions", locale)} className="link w-fit">
              {dict.nav.shake}
            </Link>
            <Link href={localizePath("/gallery", locale)} className="link w-fit">
              {dict.nav.menu}
            </Link>
          </nav>
          <div className="space-y-3 text-bone/75 sm:col-span-6 sm:col-start-7">
            <p>{dict.footer.credit}</p>
            <p>{dict.footer.disclaimer}</p>
          </div>
        </div>
        <p className="mt-14 text-small text-bone/60">© {new Date().getFullYear()} MoodShaker</p>
      </div>
    </footer>
  );
}
