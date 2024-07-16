import { lock } from "./lock";
import { MutexInterface } from "./mutex";

export class ScopedLock implements Disposable {
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
