import { MutexInterface } from "./mutex";

export interface SharedMutexInterface extends MutexInterface {
  lockShared(): Promise<void>;
  tryLockShared(): boolean;
  unlockShared(): void;
}

export class SharedMutex implements SharedMutexInterface {
  private _acquired = false;
  private _acquiredCnt = 0;
  private _isShared = true;
  private _queue = [] as Array<{ shared: boolean; resolve: () => void }>;

  async lock(): Promise<void> {
    if (this._acquired) {
      await new Promise<void>((resolve) =>
        this._queue.push({ shared: false, resolve }),
      );
    }
    this._acquired = true;
    this._acquiredCnt++;
    this._isShared = false;
  }

  tryLock(): boolean {
    if (this._acquired) {
      return false;
    }
    this._acquired = true;
    this._acquiredCnt++;
    this._isShared = false;
    return true;
  }

  unlock(): void {
    this._acquiredCnt--;
    console.log(this._queue);
    if (this._queue.length === 0) {
      this._isShared = true;
      this._acquired = false;
    } else if (!this._queue[0].shared) {
      this._isShared = false;
      this._queue.shift().resolve();
    } else {
      this._isShared = true;
      console.log(this._queue);
      while (this._queue.length > 0 && this._queue[0].shared) {
        this._queue.shift().resolve();
      }
    }
  }

  async lockShared(): Promise<void> {
    if ((this._acquired && !this._isShared) || this._queue.length > 0) {
      await new Promise<void>((resolve) =>
        this._queue.push({ shared: true, resolve }),
      );
    }
    this._acquired = true;
    this._acquiredCnt++;
  }

  tryLockShared(): boolean {
    if ((this._acquired && !this._isShared) || this._queue.length > 0) {
      return false;
    }
    this._acquired = true;
    this._acquiredCnt++;
    return true;
  }

  unlockShared(): void {
    this._acquiredCnt--;
    if (this._acquiredCnt !== 0) {
      return;
    } else if (this._queue.length === 0) {
      this._acquired = false;
    } else {
      this._isShared = false;
      this._queue.shift().resolve();
    }
  }
}
