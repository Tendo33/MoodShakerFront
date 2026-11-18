import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { fadeEdges } from "@/lib/image-levels";

describe("fadeEdges", () => {
  it("fades the rim to white and leaves the middle alone", async () => {
    const grey = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#808080" } })
      .png()
      .toBuffer();
    const { data, info } = await sharp(await fadeEdges(grey)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const red = (x: number, y: number) => data[(y * info.width + x) * info.channels];

    assert.ok(red(0, 100) > 245, "left edge is white");
    assert.ok(red(199, 100) > 245, "right edge is white");
    assert.ok(red(100, 0) > 245, "top edge is white");
    assert.ok(red(100, 199) > 245, "bottom edge is white");
    assert.equal(red(100, 100), 0x80, "the middle keeps its colour");
  });
});
