export class Semaphore {
  private _queue: Array<() => void> = [];

  /**
   * @param _desired The number of permits that are available to be acquired.
   */
  constructor(private _desired: number) {}

  /**
   * Acquires a permit from this semaphore, blocking until one is available.
   */
  async acquire(): Promise<void> {
    if (this._desired > 0) {
      this._desired--;
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push(resolve);
      });
    }
  }

  /**
   * Try to acquires a permit from this semaphore
   * @returns true if a permit was acquired, false otherwise.
   */
  tryAcquire(): boolean {
    if (this._desired > 0) {
      this._desired--;
      return true;
    }
    return false;
  }

  /**
   * Releases a permit, returning it to the semaphore.
   * @param update The number of permits to release.
   * @throws If the update is negative or not an integer.
   */
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
