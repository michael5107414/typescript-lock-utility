import type { BasicLockableInteface } from './types';

/**
 * ConditionVariable is a synchronization primitive that allows caller to wait until a particular condition is met.
 */
export class ConditionVariable {
  private _queue: Array<() => void> = [];

  /**
   * Triggers the execution of the first waiting function in the queue.
   */
  notifyOne(): void {
    this._queue.shift()?.();
  }

  /**
   * Triggers the execution of all waiting functions in the queue.
   */
  notifyAll(): void {
    this._queue.forEach((resolve) => resolve());
    this._queue = [];
  }

  /**
   * Waits for the condition variable to be notified.
   * @param lock The lock which must be locked by the caller
   * @param predicate The predicate to check whether the waiting can be completed
   * @throws If the lock does not own the lock.
   */
  async wait(lock: BasicLockableInteface, predicate?: () => boolean | Promise<boolean>): Promise<void> {
    if (!lock.ownsLock()) {
      throw new Error('lock should own the lock by calling wait');
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
