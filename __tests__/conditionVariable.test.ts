import { ConditionVariable, Mutex, UniqueLock } from '../src';
import { sleepFor } from './support/util';

describe('ConditionVariable', () => {
  let cv: ConditionVariable;
  let mutex: Mutex;
  let flag = false;

  beforeEach(() => {
    cv = new ConditionVariable();
    mutex = new Mutex();
    flag = false;
  });

  test('invoke wait without lock', async () => {
    using lk = await UniqueLock.create(mutex, 'defer_lock');
    await expect(cv.wait(lk)).rejects.toThrow('lock should own the lock by calling wait');
  });

  test('wait and notifyOne (without predicate)', async () => {
    const results: number[] = [];

    const promise1 = (async () => {
      using lk = await UniqueLock.create(mutex);
      expect(lk.ownsLock()).toBe(true);
      await cv.wait(lk);
      results.push(1);
    })();
    await sleepFor(50);
    results.push(2);
    cv.notifyOne();
    await promise1;
    results.push(3);
    expect(results).toEqual([2, 1, 3]);
  });

  test('wait and notifyOne (with predicate)', async () => {
    const results: number[] = [];

    const promise1 = (async () => {
      using lk = await UniqueLock.create(mutex);
      await cv.wait(lk, () => flag);
      expect(lk.ownsLock()).toBe(true);
      results.push(1);
    })();
    await sleepFor(50);
    results.push(2);
    flag = true;
    cv.notifyOne();
    await promise1;
    results.push(3);
    expect(results).toEqual([2, 1, 3]);
  });

  test('wait and notifyAll', async () => {
    const results: number[] = [];

    const mutex2 = new Mutex();

    const promise1 = (async () => {
      using lk = await UniqueLock.create(mutex);
      await cv.wait(lk);
      results.push(1);
    })();
    const promise2 = (async () => {
      using lk = await UniqueLock.create(mutex2);
      await cv.wait(lk);
      results.push(2);
    })();
    await sleepFor(50);
    results.push(3);
    cv.notifyAll();
    await Promise.all([promise1, promise2]);
    results.push(4);
    expect(results).toEqual([3, 1, 2, 4]);
  });
});
