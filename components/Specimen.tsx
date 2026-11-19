import Image from "next/image";
import { DevelopedImage } from "@/components/DevelopedImage";
import type { Mood } from "@/lib/domain/vocabulary";
import { moodColor } from "@/lib/moods";

/**
 * A drink photographed on white, set on the colour of the mood it was poured
 * for. `multiply` drops the white backdrop into the field. The photograph is
 * already framed with its own margin (lib/image-levels.ts), so the field adds
 * little. Inside a link (`group`), the glass comes forward on hover while the
 * field stays where it is.
 */
export function Specimen({
  src,
  alt,
  mood,
  sizes,
  priority,
  develop,
  className = "aspect-[4/5]",
  inset = "2%",
  children,
}: {
  src: string | null;
  alt: string;
  mood: Mood | null;
  sizes: string;
  priority?: boolean;
  /** Fade the photograph in once it has loaded. Needs script, so only for pages rendered in the browser. */
  develop?: boolean;
  className?: string;
  /** Space between the glass and the edge of its field. */
  inset?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: moodColor(mood) }}>
      {src ? (
        <div className="absolute" style={{ inset }}>
          {develop ? (
            <DevelopedImage src={src} alt={alt} fill sizes={sizes} priority={priority} className="specimen transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
          ) : (
            <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="specimen transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
