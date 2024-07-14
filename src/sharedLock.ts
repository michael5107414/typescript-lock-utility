import { LockStrategy } from "./lockOptions";
import { SharedMutexInterface } from "./sharedMutex";

export class SharedLock implements Disposable {
  static async create(mutex: SharedMutexInterface, strategy: LockStrategy = "instant_lock"): Promise<SharedLock> {
    const lock = new SharedLock(mutex);
    switch (strategy) {
      case "instant_lock":
        await mutex.lockShared();
        lock._acquired = true;
        break;
      case "try_to_lock":
        lock._acquired = mutex.tryLockShared();
    }
    return lock;
  }

  private _acquired = false;

  private constructor(private _mutex: SharedMutexInterface) {}

  async lock(): Promise<void> {
    if (this.onwsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lockShared();
  }

  tryLock(): boolean {
    if (this.onwsLock()) {
      throw new Error("lock already acquired");
    }
    return this._mutex.tryLockShared();
  }

  unlock(): void {
    if (!this.onwsLock()) {
      throw new Error("lock already released");
    }
    this._mutex.unlockShared();
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
