import type { LockStrategy } from './lockOptions';
import type { SharedMutexInterface } from './types';

/**
 * SharedLock is a synchronization primitive that allows multiple callers to lock a shared resource.
 */
export class SharedLock implements Disposable {
  /**
   * Creates a new SharedLock instance and acquires the lock according to the specified strategy.
   * This method allows for flexible lock acquisition on a shared resource, enabling multiple concurrent reads.
   *
   * @param mutex The instance (SharedMutex) to be locked.
   * @param strategy The locking strategy to use. Defaults to "instant_lock".
   * - "instant_lock": Locks the mutex immediately.
   * - "try_to_lock": Attempts to lock the mutex without waiting.
   * - "adopt_lock": Assumes the mutex is already locked and takes ownership without locking.
   * - "defer_lock": Does not lock the mutex immediately.
   *
   * @returns A Promise that resolves to a SharedLock instance.
   *
   * usage: using lock = await SharedLock.create(mutex);
   */
  static async create(mutex: SharedMutexInterface, strategy: LockStrategy = 'instant_lock'): Promise<SharedLock> {
    const sharedLock = new SharedLock(mutex);
    switch (strategy) {
      case 'instant_lock':
        await sharedLock.lock();
        break;
      case 'try_to_lock':
        sharedLock.tryLock();
        break;
      case 'adopt_lock':
        sharedLock._owns = true;
    }
    return sharedLock;
  }

  private _mutex?: SharedMutexInterface;
  private _owns = false;

  private constructor(_mutex: SharedMutexInterface) {
    this._mutex = _mutex;
  }

  /**
   * Lock the mutex in shared mode.
   * @throws If the mutex is not set or the lock is already acquired.
   */
  async lock(): Promise<void> {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    } else if (this.ownsLock()) {
      throw new Error('lock already acquired');
    }
    await this._mutex.lockShared();
    this._owns = true;
  }

  /**
   * Try to lock the mutex in shared mode.
   * @returns true if the mutex is locked successfully, false otherwise.
   * @throws If the mutex is not set or the lock is already acquired.
   */
  tryLock(): boolean {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    } else if (this.ownsLock()) {
      throw new Error('lock already acquired');
    }
    this._owns = this._mutex.tryLockShared();
    return this._owns;
  }

  /**
   * Unlock the mutex.
   * @throws If the mutex is not set or the lock is already freed.
   */
  unlock(): void {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    } else if (!this.ownsLock()) {
      throw new Error('lock already freed');
    }
    this._mutex.unlockShared();
    this._owns = false;
  }

  /**
   * Release the mutex.
   * @returns The shared mutex instance.
   * @throws If the mutex is not set.
   */
  release(): SharedMutexInterface {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    }
    const ret = this._mutex;
    this._mutex = undefined;
    this._owns = false;
    return ret;
  }

  /**
   * Checks if the lock is acquired.
   * @returns true if the lock is acquired, false otherwise.
   */
  ownsLock(): boolean {
    return this._owns;
  }

  // @internal
  [Symbol.dispose](): void {
    if (this._mutex && this.ownsLock()) {
      this._mutex.unlockShared();
    }
  }
}
