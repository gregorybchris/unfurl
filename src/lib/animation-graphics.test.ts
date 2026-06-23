import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimationGraphics } from "./animation-graphics";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AnimationGraphics", () => {
  it("stores the update callback", () => {
    const onUpdate = vi.fn();
    expect(new AnimationGraphics(onUpdate).onUpdate).toBe(onUpdate);
  });

  it("invokes the callback with cumulative time and per-frame delta", () => {
    // capture the rAF callback so we can drive frames manually
    let frame: ((time?: number) => void) | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: (time?: number) => void) => {
      frame = cb;
      return 0;
    });

    const updates: Array<[number, number]> = [];
    const graphics = new AnimationGraphics((currentTime, deltaTime) => {
      updates.push([currentTime, deltaTime]);
    });

    graphics.start();
    // first synchronous tick: currentTime defaults to 0, delta 0
    expect(updates[0]).toEqual([0, 0]);

    frame!(16);
    expect(updates[1]).toEqual([16, 16]);

    frame!(20);
    expect(updates[2]).toEqual([20, 4]);
  });
});
