export class Semaphore {
  private _queue: Array<() => void> = [];

  constructor(private _desired: number) {}

  async acquire(): Promise<void> {
    if (this._desired > 0) {
      this._desired--;
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push(resolve);
      });
    }
  }

  tryAcquire(): boolean {
    if (this._desired > 0) {
      this._desired--;
      return true;
    }
    return false;
  }

  release(update = 1): void {
    if (update < 0 || !Number.isInteger(update)) {
      throw new Error("update must be a non-negative integer");
    }

    this._desired += update;
    if (this._queue.length === 0) {
      return;
    }

    const dispatchCnt = Math.min(this._desired, this._queue.length);
    this._desired += dispatchCnt;
    this._queue.splice(0, dispatchCnt).forEach((resolve) => resolve());
  }
}
