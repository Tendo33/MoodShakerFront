import Image from "next/image";
import type { Mood } from "@/lib/domain/vocabulary";
import { moodColor } from "@/lib/moods";

/**
 * A drink photographed on white, set on the colour of the mood it was poured
 * for. `multiply` drops the white backdrop into the field.
 */
export function Specimen({
  src,
  alt,
  mood,
  sizes,
  priority,
  className = "aspect-[4/5]",
  inset = "10%",
  children,
}: {
  src: string | null;
  alt: string;
  mood: Mood | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Space between the glass and the edge of its field. */
  inset?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: moodColor(mood) }}>
      {src ? (
        <div className="absolute" style={{ inset }}>
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="specimen" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
