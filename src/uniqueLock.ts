import type { LockStrategy } from './lockOptions';
import type { MutexInterface } from './types';

/**
 * UniqueLock is a synchronization primitive that allows only one caller to lock it.
 */
export class UniqueLock implements Disposable {
  /**
   * Creates a new UniqueLock instance and acquires the lock according to the specified strategy.
   *
   * @param mutex The instance (Mutex or SharedMutex) to be locked.
   * @param strategy The locking strategy to use. Defaults to "instant_lock".
   * - "instant_lock": Locks the mutex immediately.
   * - "try_to_lock": Attempts to lock the mutex without waiting.
   * - "adopt_lock": Assumes the mutex is already locked and takes ownership without locking.
   * - "defer_lock": Does not lock the mutex immediately.
   *
   * @returns A Promise that resolves to a UniqueLock instance.
   *
   * usage: using lock = await UniqueLock.create(mutex);
   */
  static async create(mutex: MutexInterface, strategy: LockStrategy = 'instant_lock'): Promise<UniqueLock> {
    const uniqueLock = new UniqueLock(mutex);
    switch (strategy) {
      case 'instant_lock':
        await uniqueLock.lock();
        break;
      case 'try_to_lock':
        uniqueLock.tryLock();
        break;
      case 'adopt_lock':
        uniqueLock._owns = true;
    }
    return uniqueLock;
  }

  private _mutex?: MutexInterface;
  private _owns = false;

  private constructor(_mutex: MutexInterface) {
    this._mutex = _mutex;
  }

  /**
   * Lock the mutex exclusively.
   * @throws If the mutex is not set or the lock is already acquired.
   */
  async lock(): Promise<void> {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    } else if (this.ownsLock()) {
      throw new Error('lock already acquired');
    }
    await this._mutex.lock();
    this._owns = true;
  }

  /**
   * Try to lock the mutex exclusively.
   * @returns true if the mutex is locked successfully, false otherwise.
   * @throws If the mutex is not set or the lock is already acquired.
   */
  tryLock(): boolean {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    } else if (this.ownsLock()) {
      throw new Error('lock already acquired');
    }
    this._owns = this._mutex.tryLock();
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
    this._mutex.unlock();
    this._owns = false;
  }

  /**
   * Release the mutex.
   * @returns The mutex instance.
   * @throws If the mutex is not set.
   */
  release(): MutexInterface {
    if (!this._mutex) {
      throw new Error('mutex is not set');
    }
    const ret = this._mutex;
    this._mutex = undefined;
    this._owns = false;
    return ret;
  }

  /**
   * Check if the lock is acquired.
   * @returns true if the lock is acquired, false otherwise.
   */
  ownsLock(): boolean {
    return this._owns;
  }

  [Symbol.dispose](): void {
    if (this._mutex && this.ownsLock()) {
      this._mutex.unlock();
    }
  }
}
