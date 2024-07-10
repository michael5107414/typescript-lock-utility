import { SharedMutexInterface } from "./sharedMutex";

export class SharedLockGuard implements Disposable {
  static async create(mutex: SharedMutexInterface): Promise<SharedLockGuard> {
    const lock = new SharedLockGuard(mutex);
    await mutex.lockShared();
    return lock;
  }

  private constructor(private mutex: SharedMutexInterface) {
    this.mutex = mutex;
  }

  [Symbol.dispose](): void {
    this.mutex.unlockShared();
  }
}
