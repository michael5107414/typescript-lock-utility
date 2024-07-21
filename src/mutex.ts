import type { MutexInterface } from "./types";

/**
 * Mutex is a synchronization primitive that allows only one caller to lock it.
 */
export class Mutex implements MutexInterface {
  private _acquired = false;
  private _queue: Array<() => void> = [];

  private acquire(): void {
    this._acquired = true;
  }

  private canAcquire(): boolean {
    return !this._acquired;
  }

  private release(): void {
    this._acquired = false;
  }

  private dispatch(): void {
    if (this._queue.length === 0) {
      return;
    }

    this.acquire();
    this._queue.shift()?.();
  }

  /**
   * Lock the mutex.
   * If the mutex is already locked, the caller will be blocked until the mutex is unlocked.
   */
  async lock(): Promise<void> {
    if (this.canAcquire()) {
      this.acquire();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push(resolve);
      });
    }
  }

  /**
   * Try to lock the mutex.
   * If the mutex is already locked, the caller will not be blocked.
   * @returns true if the mutex is locked successfully, false otherwise.
   */
  tryLock(): boolean {
    if (this.canAcquire()) {
      this.acquire();
      return true;
    }
    return false;
  }

  /**
   * Unlock the mutex.
   */
  unlock(): void {
    this.release();
    this.dispatch();
  }
}
