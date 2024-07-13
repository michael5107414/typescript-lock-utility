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

  private constructor(private mutex: SharedMutexInterface) {
    this.mutex = mutex;
  }

  async lock(): Promise<void> {
    if (this.onwsLock()) {
      throw new Error("lock twice");
    }
    await this.mutex.lockShared();
  }

  tryLock(): boolean {
    return this.mutex.tryLockShared();
  }

  unlock(): void {
    if (!this.onwsLock()) {
      throw new Error("unlock twice");
    }
    this.mutex.unlockShared();
  }

  onwsLock(): boolean {
    return this._acquired;
  }

  [Symbol.dispose](): void {
    if (this.onwsLock()) {
      this.mutex.unlockShared();
    }
  }
}
