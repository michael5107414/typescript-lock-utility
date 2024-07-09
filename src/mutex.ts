export interface MutexInterface {
  lock(): Promise<void>;
  unlock(): void;
}

export class Mutex implements MutexInterface {
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
