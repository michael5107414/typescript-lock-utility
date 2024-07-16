import { lock } from "./lock";
import { MutexInterface } from "./mutex";

export class ScopedLock implements Disposable {
  static async create(...mutexes: MutexInterface[]): Promise<ScopedLock> {
    const scopedLock = new ScopedLock(mutexes);
    await lock(...mutexes);

    return scopedLock;
  }

  private constructor(private mutexes: MutexInterface[]) {}

  [Symbol.dispose](): void {
    this.mutexes.forEach((mtx) => {
      mtx.unlock();
    });
  }
}
