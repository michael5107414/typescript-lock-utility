import { SharedMutexInterface } from "./types";

/**
 * SharedMutex is a synchronization primitive that allows multiple callers to lock it in shared mode or only one caller to lock it in exclusive mode.
 */
export class SharedMutex implements SharedMutexInterface {
  /** The flag indicate whether current mutex is acquired by SharedLock. It has no meaning when _acquiredCnt is 0. */
  private _isShared = true;
  private _acquiredCnt = 0;
  private _queue: Array<{ shared: boolean; resolve: () => void }> = [];

  /**
   * @param _sharedFirst Whether to give priority to lockShared over lock. Defaults to false.
   */
  constructor(private _sharedFirst = false) {}

  private acquire(): void {
    this._acquiredCnt++;
    this._isShared = false;
  }

  private acquireShared(): void {
    this._acquiredCnt++;
    this._isShared = true;
  }

  private canAcquire(): boolean {
    return this._acquiredCnt === 0;
  }

  private canAcquireShared(): boolean {
    return !((this._acquiredCnt > 0 && !this._isShared) || (!this._sharedFirst && this._queue.length > 0));
  }

  private release(): void {
    this._acquiredCnt--;
  }

  private dispatch(): void {
    if (this._queue.length === 0) {
      return;
    }

    if (!this._queue[0].shared) {
      this.acquire();
      this._queue.shift()?.resolve();
    } else if (this._sharedFirst) {
      this._queue
        .filter((elem) => elem.shared)
        .forEach((elem) => {
          this.acquireShared();
          elem.resolve();
        });
      this._queue = this._queue.filter((elem) => !elem.shared);
    } else {
      let firstUniqueIdx = this._queue.findIndex((elem) => !elem.shared);
      firstUniqueIdx = firstUniqueIdx !== -1 ? firstUniqueIdx : this._queue.length;
      this._queue.splice(0, firstUniqueIdx).forEach((elem) => {
        this.acquireShared();
        elem.resolve();
      });
    }
  }

  /**
   * Lock the mutex exclusively.
   * If the mutex is already locked, the caller will be blocked until the mutex is unlocked.
   */
  async lock(): Promise<void> {
    if (this.canAcquire()) {
      this.acquire();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push({ shared: false, resolve });
      });
    }
  }

  /**
   * Try to lock the mutex exclusively.
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

  /**
   * Lock the mutex in shared mode.
   * If the mutex is already locked in exclusive mode, the caller will be blocked until the mutex is unlocked.
   */
  async lockShared(): Promise<void> {
    if (this.canAcquireShared()) {
      this.acquireShared();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push({ shared: true, resolve });
      });
    }
  }

  /**
   * Try to lock the mutex in shared mode.
   * If the mutex is already locked in exclusive mode, the caller will not be blocked.
   * @returns true if the mutex is locked successfully, false otherwise.
   */
  tryLockShared(): boolean {
    if (this.canAcquireShared()) {
      this.acquireShared();
      return true;
    }
    return false;
  }

  /**
   * Unlock the mutex in shared mode.
   */
  unlockShared(): void {
    this.release();
    if (this.canAcquire()) {
      this.dispatch();
    }
  }
}
