import { LockStrategy } from "./lockOptions";
import { MutexInterface } from "./mutex";

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

  private constructor(private _mutex: MutexInterface) {}

  async lock(): Promise<void> {
    if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lock();
  }

  tryLock(): boolean {
    if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    return this._mutex.tryLock();
  }

  unlock(): void {
    if (!this.ownsLock()) {
      throw new Error("lock already released");
    }
    this._mutex.unlock();
  }

  ownsLock(): boolean {
    return this._acquired;
  }

  [Symbol.dispose](): void {
    if (this.ownsLock()) {
      this._mutex.unlock();
    }
  }
}
