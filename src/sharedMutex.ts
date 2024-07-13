import { MutexInterface } from "./mutex";

export interface SharedMutexInterface extends MutexInterface {
  lockShared(): Promise<void>;
  tryLockShared(): boolean;
  unlockShared(): void;
}

export class SharedMutex implements SharedMutexInterface {
  private _acquiredCnt = 0;

  /** The flag indicate whether current mutex is acquired by SharedLock. It has no meaning when _acquiredCnt is 0. */
  private _isShared = true;
  private _queue = [] as Array<{ shared: boolean; resolve: () => void }>;

  private isAcquired(): boolean {
    return this._acquiredCnt > 0;
  }

  private acquire(): void {
    this._acquiredCnt++;
    this._isShared = false;
  }

  private acquireShared(): void {
    this._acquiredCnt++;
    this._isShared = true;
  }

  private release(): void {
    this._acquiredCnt--;
  }

  private tryDispatch(): void {
    if (this._queue.length === 0) {
      return;
    }

    if (!this._queue[0].shared) {
      this.acquire();
      this._queue.shift().resolve();
    } else {
      while (this._queue[0]?.shared) {
        this.acquireShared();
        this._queue.shift().resolve();
      }
    }
  }

  async lock(): Promise<void> {
    if (this.isAcquired()) {
      await new Promise<void>((resolve) =>
        this._queue.push({ shared: false, resolve }),
      );
    } else {
      this.acquire();
    }
  }

  tryLock(): boolean {
    if (this.isAcquired()) {
      return false;
    }
    this.acquire();
    return true;
  }

  unlock(): void {
    this.release();
    this.tryDispatch();
  }

  async lockShared(): Promise<void> {
    if ((this.isAcquired() && !this._isShared) || this._queue.length > 0) {
      await new Promise<void>((resolve) =>
        this._queue.push({ shared: true, resolve }),
      );
    } else {
      this.acquireShared();
    }
  }

  tryLockShared(): boolean {
    if ((this.isAcquired() && !this._isShared) || this._queue.length > 0) {
      return false;
    }
    this.acquireShared();
    return true;
  }

  unlockShared(): void {
    this.release();
    if (!this.isAcquired()) {
      this.tryDispatch();
    }
  }
}
