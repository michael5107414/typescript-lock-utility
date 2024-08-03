import { SharedLock, SharedMutex, UniqueLock } from '../src';
import type { SharedMutexInterface } from '../src/types';
import { sleepFor } from './support/util';

describe('SharedLock with SharedMutex', () => {
  let mutex: SharedMutexInterface;
  let value = 0;

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  test('lock and unlock', async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    lock.unlock();
    expect(lock.ownsLock()).toBe(false);
  });

  test('tryLock acquired', async () => {
    using _lockInstant = await SharedLock.create(mutex);
    using lockTry = await SharedLock.create(mutex, 'try_to_lock');
    expect(lockTry.ownsLock()).toBe(true);
  });

  test('tryLock not acquired', async () => {
    using _lockInstant = await UniqueLock.create(mutex);
    using lockTryTo = await SharedLock.create(mutex, 'try_to_lock');
    expect(lockTryTo.ownsLock()).toBe(false);
  });

  test('lock after acquired', async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    await expect(lock.lock()).rejects.toThrow('lock already acquired');
  });

  test('tryLock after acquired', async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    expect(() => lock.tryLock()).toThrow('lock already acquired');
  });

  test('unlock after freed', async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    lock.unlock();
    expect(lock.ownsLock()).toBe(false);
    expect(() => lock.unlock()).toThrow('lock already freed');
  });

  test('lock with lockOptions defer_lock', async () => {
    using lock = await SharedLock.create(mutex, 'defer_lock');
    expect(lock.ownsLock()).toBe(false);
    await lock.lock();
    expect(lock.ownsLock()).toBe(true);
  });

  test('lock with lockOptions adopt_lock', async () => {
    {
      using lock1 = await SharedLock.create(mutex);
      const releasedMutex = lock1.release();
      using lock2 = await SharedLock.create(releasedMutex, 'adopt_lock');
      expect(lock1.ownsLock()).toBe(false);
      expect(lock2.ownsLock()).toBe(true);
    }
    using lock3 = await SharedLock.create(mutex);
    expect(lock3.ownsLock()).toBe(true);
  });

  test('lock after release', async () => {
    using lock = await SharedLock.create(mutex, 'defer_lock');
    lock.release();
    await expect(lock.lock()).rejects.toThrow('mutex is not set');
  });

  test('tryLock after release', async () => {
    using lock = await SharedLock.create(mutex, 'defer_lock');
    lock.release();
    expect(() => lock.tryLock()).toThrow('mutex is not set');
  });

  test('unlock after release', async () => {
    using lock = await SharedLock.create(mutex);
    lock.release();
    expect(() => lock.unlock()).toThrow('mutex is not set');
  });

  test('release twice', async () => {
    using lock = await SharedLock.create(mutex);
    lock.release();
    expect(() => lock.release()).toThrow('mutex is not set');
  });

  async function asyncFunc(): Promise<number> {
    using _ = await SharedLock.create(mutex);
    value++;
    await sleepFor(50);
    return value;
  }

  test('functions execute in prallel complete at the same time', async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results).toEqual(Array.from({ length }, () => length));
  });
});

describe('Mixed SharedLock and UniqueLock with SharedMutex', () => {
  let mutex: SharedMutexInterface;
  let value = 0;

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  async function asyncShared(): Promise<number> {
    using _ = await SharedLock.create(mutex);
    value++;
    await sleepFor(50);
    return value;
  }

  async function asyncExclusive(): Promise<number> {
    using _ = await UniqueLock.create(mutex);
    value++;
    await sleepFor(50);
    return value;
  }

  test('real world scenario 1', async () => {
    const sharedPromise1 = asyncShared();
    const sharedPromise2 = asyncShared();
    const exclusivePromise1 = asyncExclusive();
    const sharedPromise3 = asyncShared();
    const sharedResult3 = await sharedPromise3;
    const exclusiveResult1 = await exclusivePromise1;
    const sharedResult1 = await sharedPromise1;
    const sharedResult2 = await sharedPromise2;
    expect(sharedResult1).toBe(2);
    expect(sharedResult2).toBe(2);
    expect(sharedResult3).toBe(4);
    expect(exclusiveResult1).toBe(3);
  });

  test('real world scenario 2', async () => {
    const exclusivePromise1 = asyncExclusive();
    const exclusivePromise2 = asyncExclusive();
    const sharedPromise1 = asyncShared();
    const exclusivePromise3 = asyncExclusive();
    const sharedPromise2 = asyncShared();
    const sharedPromise3 = asyncShared();
    const sharedResult1 = await sharedPromise1;
    const sharedResult2 = await sharedPromise2;
    const sharedResult3 = await sharedPromise3;
    const exclusiveResult1 = await exclusivePromise1;
    const exclusiveResult2 = await exclusivePromise2;
    const exclusiveResult3 = await exclusivePromise3;
    expect(sharedResult1).toBe(3);
    expect(sharedResult2).toBe(6);
    expect(sharedResult3).toBe(6);
    expect(exclusiveResult1).toBe(1);
    expect(exclusiveResult2).toBe(2);
    expect(exclusiveResult3).toBe(4);
  });

  test('real world scenario 3', async () => {
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult1 = await asyncShared();
    expect(sharedResult1).toBe(2);
  });
});

describe('Mixed SharedLock and UniqueLock with SharedMutex with sharedFirst option', () => {
  let mutex: SharedMutexInterface;
  let value = 0;

  beforeEach(() => {
    mutex = new SharedMutex(true);
    value = 0;
  });

  async function asyncShared(): Promise<number> {
    using _ = await SharedLock.create(mutex);
    value++;
    await sleepFor(100);
    return value;
  }

  async function asyncExclusive(): Promise<number> {
    using _ = await UniqueLock.create(mutex);
    value++;
    await sleepFor(100);
    return value;
  }

  test('real world scenario 1', async () => {
    const sharedPromise1 = asyncShared();
    const sharedPromise2 = asyncShared();
    const exclusivePromise1 = asyncExclusive();
    const sharedPromise3 = asyncShared();
    const sharedResult3 = await sharedPromise3;
    const exclusiveResult1 = await exclusivePromise1;
    const sharedResult1 = await sharedPromise1;
    const sharedResult2 = await sharedPromise2;
    expect(sharedResult1).toBe(3);
    expect(sharedResult2).toBe(3);
    expect(sharedResult3).toBe(3);
    expect(exclusiveResult1).toBe(4);
  });

  test('real world scenario 2', async () => {
    const exclusivePromise1 = asyncExclusive();
    const exclusivePromise2 = asyncExclusive();
    const sharedPromise1 = asyncShared();
    const exclusivePromise3 = asyncExclusive();
    const sharedPromise2 = asyncShared();
    const sharedPromise3 = asyncShared();
    const sharedResult1 = await sharedPromise1;
    const sharedResult2 = await sharedPromise2;
    const sharedResult3 = await sharedPromise3;
    const exclusiveResult1 = await exclusivePromise1;
    const exclusiveResult2 = await exclusivePromise2;
    const exclusiveResult3 = await exclusivePromise3;
    expect(sharedResult1).toBe(5);
    expect(sharedResult2).toBe(5);
    expect(sharedResult3).toBe(5);
    expect(exclusiveResult1).toBe(1);
    expect(exclusiveResult2).toBe(2);
    expect(exclusiveResult3).toBe(6);
  });

  test('real world scenario 3', async () => {
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult1 = await asyncShared();
    expect(sharedResult1).toBe(2);
  });

  test('real world scenario 4', async () => {
    const sharedPromise1 = asyncShared();
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult2 = await asyncShared();
    const sharedResult1 = await sharedPromise1;
    expect(sharedResult1).toBe(2);
    expect(sharedResult2).toBe(2);
  });

  test('real world scenario 5', async () => {
    const mutex = new SharedMutex();
    using lock1 = await SharedLock.create(mutex);
    using lock2 = await SharedLock.create(mutex);
    using lock3 = await SharedLock.create(lock2.release(), 'adopt_lock');
    using lock4 = await SharedLock.create(lock1.release(), 'adopt_lock');

    setTimeout(async () => {
      lock4.unlock();
      value = 1;
      await sleepFor(100);
      lock3.unlock();
      value = 2;
    }, 100);
    expect(value).toBe(0);
    using lock5 = await UniqueLock.create(mutex);
    expect(value).toBe(2);
    expect(lock5.ownsLock()).toBe(true);
  });
});
