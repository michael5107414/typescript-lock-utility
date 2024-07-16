import { LockStrategy } from "./lockOptions";
import { MutexInterface } from "./mutex";

export class UniqueLock implements Disposable {
  static async create(mutex: MutexInterface, strategy: LockStrategy = "instant_lock"): Promise<UniqueLock> {
    const uniqueLock = new UniqueLock(mutex);
    switch (strategy) {
      case "instant_lock":
        await uniqueLock.lock();
        break;
      case "try_to_lock":
        uniqueLock.tryLock();
    }
    return uniqueLock;
  }

  private _acquired = false;

  private constructor(private _mutex: MutexInterface) {}

  async lock(): Promise<void> {
    if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lock();
    this._acquired = true;
  }

  tryLock(): boolean {
    if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    this._acquired = this._mutex.tryLock();
    return this._acquired;
  }

  unlock(): void {
    if (!this.ownsLock()) {
      throw new Error("lock already released");
    }
    this._mutex.unlock();
    this._acquired = false;
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
