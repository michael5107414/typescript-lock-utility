class Mutex {
  private acquired = false;
  private queue = [] as Array<() => void>;

  async lock(): Promise<void> {
    if (this.acquired) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.acquired = true;
  }

  unlock(): void {
    this.acquired = false;
    this.queue.shift()?.();
  }
}

class SharedMutex extends Mutex {
  private acquiredCnt = 0;
  private isShared = true;
  private sharedQueue = [] as Array<{ shared: boolean; resolve: () => void }>;

  override async lock(): Promise<void> {
    if (this.acquiredCnt > 0) {
      await new Promise<void>((resolve) =>
        this.sharedQueue.push({ shared: false, resolve }),
      );
    }
    this.acquiredCnt++;
    this.isShared = false;
  }

  async lockShared(): Promise<void> {
    if (!this.isShared) {
      await new Promise<void>((resolve) =>
        this.sharedQueue.push({ shared: true, resolve }),
      );
    }
    this.acquiredCnt++;
  }

  override unlock(): void {
    this.acquiredCnt--;
    this.isShared = true;
    while (this.sharedQueue.length > 0) {
      if (!this.sharedQueue[0].shared) {
        this.sharedQueue.shift()?.resolve();
        break;
      }
      this.sharedQueue.shift()?.resolve();
    }
  }

  unlockShared(): void {
    this.acquiredCnt--;
    if (this.acquiredCnt === 0) {
      this.sharedQueue.shift()?.resolve();
    }
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

export { Mutex, SharedMutex, LockGuard };
