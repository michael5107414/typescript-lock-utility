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
    }
    return sharedLock;
  }

  private _acquired = false;

  private constructor(private _mutex: SharedMutexInterface) {}

  async lock(): Promise<void> {
    if (this.onwsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lockShared();
    this._acquired = true;
  }

  tryLock(): boolean {
    if (this.onwsLock()) {
      throw new Error("lock already acquired");
    }
    this._acquired = this._mutex.tryLockShared();
    return this._acquired;
  }

  unlock(): void {
    if (!this.onwsLock()) {
      throw new Error("lock already released");
    }
    this._mutex.unlockShared();
    this._acquired = false;
  }

  onwsLock(): boolean {
    return this._acquired;
  }

  [Symbol.dispose](): void {
    if (this.onwsLock()) {
      this._mutex.unlockShared();
    }
  }
}
