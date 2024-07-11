export interface MutexInterface {
  lock(): Promise<void>;
  tryLock(): boolean;
  unlock(): void;
}

export class Mutex implements MutexInterface {
  private _acquired = false;
  private _queue = [] as Array<() => void>;

  async lock(): Promise<void> {
    if (this._acquired) {
      await new Promise<void>((resolve) => this._queue.push(resolve));
    }
    this._acquired = true;
  }

  tryLock(): boolean {
    if (this._acquired) {
      return false;
    }
    this._acquired = true;
    return true;
  }

  unlock(): void {
    if (this._queue.length === 0) {
      this._acquired = false;
    } else {
      this._queue.shift()();
    }
  }
}
