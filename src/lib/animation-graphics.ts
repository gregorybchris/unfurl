export type UpdateFuncType = (currentTime: number, deltaTime: number) => void;

export class AnimationGraphics {
  onUpdate: UpdateFuncType;

  constructor(onUpdate: UpdateFuncType) {
    this.onUpdate = onUpdate;
  }

  start(): void {
    let lastTime = 0;
    const animationUpdate = (currentTime?: number) => {
      currentTime = currentTime || 0;
      const deltaTime = currentTime - (lastTime || 0);
      lastTime = currentTime;
      this.onUpdate(currentTime, deltaTime);
      requestAnimationFrame(animationUpdate);
    };
    animationUpdate();
  }
}
