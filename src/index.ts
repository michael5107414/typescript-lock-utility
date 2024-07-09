class Mutex {
  private locked = false;
  private waitlist: Array<() => void> = [];

  async lock(): Promise<void> {
    if (this.locked) {
      await new Promise<void>((resolve) => this.waitlist.push(resolve));
    }
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
    this.waitlist.shift()?.();
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
