import { Deferred } from "ts-deferred";

class Mutex {
  private locked = false;
  private waitlist: Deferred<void>[] = [];

  async lock(): Promise<void> {
    if (this.locked) {
      const deferred = new Deferred<void>();
      this.waitlist.push(deferred);
      await deferred.promise;
    }
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
    this.waitlist.shift()?.resolve();
  }
}

class LockGuard implements Disposable {
  static async create(mutex: Mutex): Promise<LockGuard> {
    const lock = new LockGuard(mutex);
    await mutex.lock();
    return lock;
  }

  private constructor(private mutex: Mutex) {
    this.mutex = mutex;
  }

  [Symbol.dispose](): void {
    this.mutex.unlock();
  }
}

export { Mutex, LockGuard };
