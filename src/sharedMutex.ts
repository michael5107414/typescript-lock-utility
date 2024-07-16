import { MutexInterface } from "./mutex";

export interface SharedMutexInterface extends MutexInterface {
  lockShared(): Promise<void>;
  tryLockShared(): boolean;
  unlockShared(): void;
}

export class SharedMutex implements SharedMutexInterface {
  /** The flag indicate whether current mutex is acquired by SharedLock. It has no meaning when _acquiredCnt is 0. */
  private _isShared = true;
  private _acquiredCnt = 0;
  private _queue: Array<{ shared: boolean; resolve: () => void }> = [];

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

  async lock(): Promise<void> {
    if (this.canAcquire()) {
      this.acquire();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push({ shared: false, resolve });
      });
    }
  }

  tryLock(): boolean {
    if (this.canAcquire()) {
      this.acquire();
      return true;
    }
    return false;
  }

  unlock(): void {
    this.release();
    this.dispatch();
  }

  async lockShared(): Promise<void> {
    if (this.canAcquireShared()) {
      this.acquireShared();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push({ shared: true, resolve });
      });
    }
  }

  tryLockShared(): boolean {
    if (this.canAcquireShared()) {
      this.acquireShared();
      return true;
    }
    return false;
  }

  unlockShared(): void {
    this.release();
    if (this.canAcquire()) {
      this.dispatch();
    }
  }
}
