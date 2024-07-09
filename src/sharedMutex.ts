import { MutexInterface } from "./mutex";

export interface SharedMutexInterface extends MutexInterface {
  lockShared(): Promise<void>;
  unlockShared(): void;
}

export class SharedMutex implements SharedMutex {
  private acquiredCnt = 0;
  private isShared = true;
  private queue = [] as Array<{ shared: boolean; resolve: () => void }>;

  async lock(): Promise<void> {
    if (this.acquiredCnt > 0) {
      await new Promise<void>((resolve) =>
        this.queue.push({ shared: false, resolve }),
      );
    }
    this.acquiredCnt++;
    this.isShared = false;
  }

  async lockShared(): Promise<void> {
    if (!this.isShared) {
      await new Promise<void>((resolve) =>
        this.queue.push({ shared: true, resolve }),
      );
    }
    this.acquiredCnt++;
  }

  unlock(): void {
    this.acquiredCnt--;
    this.isShared = true;
    while (this.queue.length > 0) {
      if (!this.queue[0].shared) {
        this.queue.shift()?.resolve();
        break;
      }
      this.queue.shift()?.resolve();
    }
  }

  unlockShared(): void {
    this.acquiredCnt--;
    if (this.acquiredCnt === 0) {
      this.queue.shift()?.resolve();
    }
  }
}
