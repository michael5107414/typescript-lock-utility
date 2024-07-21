export interface MutexInterface {
  lock(): Promise<void>;
  tryLock(): boolean;
  unlock(): void;
}

export interface SharedMutexInterface extends MutexInterface {
  lockShared(): Promise<void>;
  tryLockShared(): boolean;
  unlockShared(): void;
}

export interface BasicLockableInteface {
  lock(): Promise<void>;
  unlock(): void;
  ownsLock(): boolean;
}
