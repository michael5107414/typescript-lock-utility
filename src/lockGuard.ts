import { MutexInterface } from "./mutex";

export class LockGuard implements Disposable {
  static async create(mutex: MutexInterface): Promise<LockGuard> {
    const lock = new LockGuard(mutex);
    await mutex.lock();
    return lock;
  }

  private constructor(private mutex: MutexInterface) {
    this.mutex = mutex;
  }

  [Symbol.dispose](): void {
    this.mutex.unlock();
  }
}
