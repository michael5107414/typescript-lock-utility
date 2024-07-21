import { lock } from "./lock";
import { MutexInterface } from "./types";

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

  // @internal
  [Symbol.dispose](): void {
    this._mutexes.forEach((mtx) => mtx.unlock());
  }
}
