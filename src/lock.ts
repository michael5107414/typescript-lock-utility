import type { MutexInterface } from './types';
import { UniqueLock } from './uniqueLock';

/**
 * Lock multiple mutex at once and using a deadlock avoidance algorithm to avoid deadlock.
 * @param mutexes
 */
export async function lock(...mutexes: MutexInterface[]): Promise<void> {
  const mutexCnt = mutexes.length;
  if (mutexCnt === 0) {
    return;
  }

  // cannot use keyword using for this case
  // thus use const instead (Symbol.dispose won't be triggered)
  const lockList = await Promise.all([...mutexes.map((mtx) => UniqueLock.create(mtx, 'defer_lock'))]);

  let startIdx = 0;

  do {
    await lockList[startIdx].lock();
    for (let offset = 1; offset < mutexCnt; offset++) {
      const idx = (startIdx + offset) % mutexCnt;
      if (!lockList[idx].tryLock()) {
        for (let i = offset - 1; i >= 0; i--) {
          const idx = (startIdx + i) % mutexCnt;
          lockList[idx].unlock();
        }

        startIdx = idx;
        break;
      }
    }
  } while (!lockList[startIdx].ownsLock());

  lockList.forEach((lk) => lk.release());
}
