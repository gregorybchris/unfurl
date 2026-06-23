export type UpdateFuncType = (currentTime: number, deltaTime: number) => void;

// Cap the per-frame delta so a paused tab (browsers throttle/suspend
// requestAnimationFrame when the window loses focus) doesn't hand the
// simulation a multi-second time step on resume, which would blow the
// integrator up and make the layout appear to restart.
const DEFAULT_MAX_DELTA_TIME = 32;

export class AnimationGraphics {
  onUpdate: UpdateFuncType;
  maxDeltaTime: number;

  constructor(onUpdate: UpdateFuncType, maxDeltaTime: number = DEFAULT_MAX_DELTA_TIME) {
    this.onUpdate = onUpdate;
    this.maxDeltaTime = maxDeltaTime;
  }

  start(): void {
    let lastTime = 0;
    const animationUpdate = (currentTime?: number) => {
      currentTime = currentTime || 0;
      const deltaTime = Math.min(currentTime - (lastTime || 0), this.maxDeltaTime);
      lastTime = currentTime;
      this.onUpdate(currentTime, deltaTime);
      requestAnimationFrame(animationUpdate);
    };
    animationUpdate();
  }
}
