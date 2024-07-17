import { UniqueLock } from "./uniqueLock";

export class ConditionVariable {
  private _queue: Array<() => void> = [];

  notifyOne(): void {
    this._queue.shift()?.();
  }

  notifyAll(): void {
    this._queue.forEach((resolve) => resolve());
    this._queue = [];
  }

  async wait(lock: UniqueLock, predicate?: () => boolean | Promise<boolean>): Promise<void> {
    if (!lock.ownsLock()) {
      throw new Error("lock should own the lock by calling wait");
    }

    if (!predicate) {
      lock.unlock();
      await new Promise<void>((resolve) => {
        this._queue.push(resolve);
      });
      await lock.lock();
    } else {
      while (!(await predicate())) {
        await this.wait(lock);
      }
    }
  }
}
