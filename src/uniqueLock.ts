import { MutexInterface } from "./mutex";

type LockStrategy = "instant_lock" | "defer_lock" | "try_to_lock";

export class UniqueLock implements Disposable {
  static async create(mutex: MutexInterface, strategy: LockStrategy = "instant_lock"): Promise<UniqueLock> {
    const lock = new UniqueLock(mutex);
    switch (strategy) {
      case "instant_lock":
        await mutex.lock();
        lock._acquired = true;
        break;
      case "try_to_lock":
        lock._acquired = mutex.tryLock();
    }
    return lock;
  }

  private _acquired = false;

  private constructor(private mutex: MutexInterface) {
    this.mutex = mutex;
  }

  async lock(): Promise<void> {
    if (this.ownsLock()) {
      throw new Error("lock twice");
    }
    await this.mutex.lock();
  }

  tryLock(): boolean {
    return this.mutex.tryLock();
  }

  unlock(): void {
    if (!this.ownsLock()) {
      throw new Error("unlock twice");
    }
    this.mutex.unlock();
  }

  ownsLock(): boolean {
    return this._acquired;
  }

  [Symbol.dispose](): void {
    if (this.ownsLock) {
      this.mutex.unlock();
    }
  }
}
