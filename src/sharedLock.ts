import { LockStrategy } from "./lockOptions";
import { SharedMutexInterface } from "./sharedMutex";

export class SharedLock implements Disposable {
  static async create(mutex: SharedMutexInterface, strategy: LockStrategy = "instant_lock"): Promise<SharedLock> {
    const sharedLock = new SharedLock(mutex);
    switch (strategy) {
      case "instant_lock":
        await sharedLock.lock();
        break;
      case "try_to_lock":
        sharedLock.tryLock();
        break;
      case "adopt_lock":
        sharedLock._owns = true;
    }
    return sharedLock;
  }

  private _mutex?: SharedMutexInterface;
  private _owns = false;

  private constructor(_mutex: SharedMutexInterface) {
    this._mutex = _mutex;
  }

  async lock(): Promise<void> {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lockShared();
    this._owns = true;
  }

  tryLock(): boolean {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    this._owns = this._mutex.tryLockShared();
    return this._owns;
  }

  unlock(): void {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (!this.ownsLock()) {
      throw new Error("lock already released");
    }
    this._mutex.unlockShared();
    this._owns = false;
  }

  release(): SharedMutexInterface {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    }
    const ret = this._mutex;
    this._mutex = undefined;
    this._owns = false;
    return ret;
  }

  ownsLock(): boolean {
    return this._owns;
  }

  [Symbol.dispose](): void {
    if (this._mutex && this.ownsLock()) {
      this._mutex.unlockShared();
    }
  }
}
