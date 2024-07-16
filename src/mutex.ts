export interface MutexInterface {
  lock(): Promise<void>;
  tryLock(): boolean;
  unlock(): void;
}

export class Mutex implements MutexInterface {
  private _acquired = false;
  private _queue: Array<() => void> = [];

  private acquire(): void {
    this._acquired = true;
  }

  private canAcquire(): boolean {
    return !this._acquired;
  }

  private release(): void {
    this._acquired = false;
  }

  private dispatch(): void {
    if (this._queue.length === 0) {
      return;
    }

    this.acquire();
    this._queue.shift()?.();
  }

  async lock(): Promise<void> {
    if (this.canAcquire()) {
      this.acquire();
    } else {
      await new Promise<void>((resolve) => {
        this._queue.push(resolve);
      });
    }
  }

  tryLock(): boolean {
    if (this.canAcquire()) {
      this.acquire();
      return true;
    }
    return false;
  }

  unlock(): void {
    this.release();
    this.dispatch();
  }
}
