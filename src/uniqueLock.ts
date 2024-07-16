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
        break;
      case "adopt_lock":
        uniqueLock._owns = true;
    }
    return uniqueLock;
  }

  private _mutex?: MutexInterface;
  private _owns = false;

  private constructor(_mutex: MutexInterface) {
    this._mutex = _mutex;
  }

  async lock(): Promise<void> {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    await this._mutex.lock();
    this._owns = true;
  }

  tryLock(): boolean {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (this.ownsLock()) {
      throw new Error("lock already acquired");
    }
    this._owns = this._mutex.tryLock();
    return this._owns;
  }

  unlock(): void {
    if (!this._mutex) {
      throw new Error("mutex is not set");
    } else if (!this.ownsLock()) {
      throw new Error("lock already freed");
    }
    this._mutex.unlock();
    this._owns = false;
  }

  release(): MutexInterface {
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
      this._mutex.unlock();
    }
  }
}
