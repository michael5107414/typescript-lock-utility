import { lock } from './lock';
import type { MutexInterface } from './types';

/**
 * ScopedLock is a synchronization primitive that provides a convenient RAII-style mechanism for owning a mutex for the duration of a scoped block.
 */
export class ScopedLock implements Disposable {
  /**
   * Creates a new ScopedLock instance and acquires the lock on the specified mutexes.
   *
   * @param mutexes The instances (Mutex or SharedMutex) to be locked.
   * @returns A Promise that resolves to a ScopedLock instance.
   *
   * usage: using lock = await ScopedLock.create(mutex1, mutex2);
   */
  static async create(...mutexes: MutexInterface[]): Promise<ScopedLock> {
    const scopedLock = new ScopedLock(...mutexes);
    await lock(...mutexes);

    return scopedLock;
  }

  private _mutexes: MutexInterface[];

  private constructor(..._mutexes: MutexInterface[]) {
    this._mutexes = _mutexes;
  }

  [Symbol.dispose](): void {
    this._mutexes.forEach((mtx) => mtx.unlock());
  }
}
