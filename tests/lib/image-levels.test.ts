import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { fadeEdges, frameSubject } from "@/lib/image-levels";

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

describe("frameSubject", () => {
  const on = (subject: { left: number; top: number; width: number; height: number }) =>
    sharp({ create: { width: 400, height: 400, channels: 3, background: "#ffffff" } })
      .composite([
        {
          input: { create: { width: subject.width, height: subject.height, channels: 3, background: "#203040" } },
          left: subject.left,
          top: subject.top,
        },
      ])
      .png()
      .toBuffer();

  async function box(buffer: Buffer) {
    const { data, info } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
    let [left, top, right, bottom] = [info.width, info.height, -1, -1];
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[y * info.width + x] > 128) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  }
  const near = (actual: number, expected: number, what: string) =>
    assert.ok(Math.abs(actual - expected) <= 3, `${what}: ${actual}, expected about ${expected}`);

  it("stands a small tall glass at the house height, in the middle", async () => {
    const framed = await box(await frameSubject(await on({ left: 20, top: 30, width: 60, height: 160 })));
    near(framed.height, 400 * 0.6, "height (held by the enlargement limit of 1.5)");
    near(framed.left + framed.width / 2, 200, "centre x");
    near(framed.top + framed.height / 2, 200, "centre y");
  });

  it("brings a glass that fills the frame back inside it", async () => {
    const framed = await box(await frameSubject(await on({ left: 100, top: 4, width: 180, height: 390 })));
    near(framed.height, 400 * 0.78, "height");
    near(framed.top + framed.height / 2, 200, "centre y");
  });

  it("holds a low wide glass to the width limit instead of the height", async () => {
    const framed = await box(await frameSubject(await on({ left: 10, top: 150, width: 380, height: 200 })));
    near(framed.width, 400 * 0.6, "width");
    assert.ok(framed.height < 400 * 0.4);
  });

  it("leaves a picture with no white backdrop alone", async () => {
    const full = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#404040" } })
      .png()
      .toBuffer();
    assert.equal(await frameSubject(full), full);
  });
});
