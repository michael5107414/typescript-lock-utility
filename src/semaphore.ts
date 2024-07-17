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

  release(): void {
    this._desired++;

    if (this._queue.length === 0) {
      return;
    }

    this._desired--;
    this._queue.shift()?.();
  }
}
