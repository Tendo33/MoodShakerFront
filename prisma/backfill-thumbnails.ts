import { PrismaClient } from "@prisma/client";

interface SharpTransformer {
  rotate(): SharpTransformer;
  resize(options: {
    width: number;
    withoutEnlargement: boolean;
    fit: "inside";
  }): SharpTransformer;
  webp(options: { quality: number }): SharpTransformer;
  toBuffer(): Promise<Buffer>;
}

type SharpFactory = (input: Buffer) => SharpTransformer;

let sharpFactory: SharpFactory | null | undefined;

async function getSharpFactory(): Promise<SharpFactory | null> {
  if (sharpFactory !== undefined) {
    return sharpFactory;
  }

  try {
    const dynamicImport = new Function(
      "moduleName",
      "return import(moduleName)",
    ) as (moduleName: string) => Promise<{ default?: SharpFactory }>;
    const loaded = await dynamicImport("sharp");
    sharpFactory = (loaded.default || loaded) as SharpFactory;
    return sharpFactory;
  } catch {
    sharpFactory = null;
    return null;
  }
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  if (!dataUrl.startsWith("data:")) {
    return null;
  }
  const parts = dataUrl.split(",");
  if (parts.length !== 2) {
    return null;
  }
  return Buffer.from(parts[1], "base64");
}

async function imageStringToBuffer(image: string): Promise<Buffer | null> {
  const dataUrlBuffer = dataUrlToBuffer(image);
  if (dataUrlBuffer) {
    return dataUrlBuffer;
  }

  if (!image.startsWith("http://") && !image.startsWith("https://")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(image, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function createThumbnail(
  sharp: SharpFactory,
  buffer: Buffer,
): Promise<string> {
  const output = await sharp(buffer)
    .rotate()
    .resize({
      width: 320,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 60 })
    .toBuffer();

  return `data:image/webp;base64,${output.toString("base64")}`;
}

async function main() {
  const prisma = new PrismaClient();
  const sharp = await getSharpFactory();

  try {
    const cocktails = await prisma.cocktail.findMany({
      where: {
        image: { not: null },
        thumbnail: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    console.log(`Found ${cocktails.length} cocktails to backfill.`);

    let updated = 0;
    for (const cocktail of cocktails) {
      if (!cocktail.image) {
        continue;
      }

      let thumbnail = cocktail.image;
      if (sharp) {
        const buffer = await imageStringToBuffer(cocktail.image);
        if (buffer) {
          try {
            thumbnail = await createThumbnail(sharp, buffer);
          } catch {
            thumbnail = cocktail.image;
          }
        }
      }

      await prisma.cocktail.update({
        where: { id: cocktail.id },
        data: { thumbnail },
      });
      updated += 1;
    }

    console.log(`Backfill done. Updated ${updated} rows.`);
    if (!sharp) {
      console.log("sharp not installed; copied original image as thumbnail.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Thumbnail backfill failed:", error);
  process.exit(1);
});
