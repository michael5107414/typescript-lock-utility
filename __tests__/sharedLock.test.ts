import { SharedLock, SharedMutex, UniqueLock } from "../src";
import { SharedMutexInterface } from "../src/sharedMutex";
import { sleepFor } from "./support/util";

describe("SharedLock with SharedMutex", () => {
  let mutex: SharedMutexInterface;
  let value = 0;

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  test("lock and unlock", async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.onwsLock()).toBe(true);
    lock.unlock();
    expect(lock.onwsLock()).toBe(false);
  });

  test("tryLock acquired", async () => {
    using _lockInstant = await SharedLock.create(mutex);
    using lockTry = await SharedLock.create(mutex, "try_to_lock");
    expect(lockTry.onwsLock()).toBe(true);
  });

  test("tryLock not acquired", async () => {
    using _lockInstant = await UniqueLock.create(mutex);
    using lockTryTo = await SharedLock.create(mutex, "try_to_lock");
    expect(lockTryTo.onwsLock()).toBe(false);
  });

  test("lock after acquired", async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.onwsLock()).toBe(true);
    await expect(lock.lock()).rejects.toThrow("lock already acquired");
  });

  test("tryLock after acquired", async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.onwsLock()).toBe(true);
    expect(() => lock.tryLock()).toThrow("lock already acquired");
  });

  test("unlock after released", async () => {
    using lock = await SharedLock.create(mutex);
    expect(lock.onwsLock()).toBe(true);
    lock.unlock();
    expect(lock.onwsLock()).toBe(false);
    expect(() => lock.unlock()).toThrow("lock already released");
  });

  test("lock with lockOptions defer_lock", async () => {
    using lock = await SharedLock.create(mutex, "defer_lock");
    expect(lock.onwsLock()).toBe(false);
    await lock.lock();
    expect(lock.onwsLock()).toBe(true);
  });

  async function asyncFunc(): Promise<number> {
    using _ = await SharedLock.create(mutex);
    value++;
    await sleepFor(50);
    return value;
  }

  test("functions execute in prallel complete at the same time", async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results).toEqual(Array.from({ length }, () => length));
  });
});

describe("Mixed SharedLock and UniqueLock with SharedMutex", () => {
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

  test("real world scenario 1", async () => {
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

  test("real world scenario 2", async () => {
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

  test("real world scenario 3", async () => {
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult1 = await asyncShared();
    expect(sharedResult1).toBe(2);
  });
});

describe("Mixed SharedLock and UniqueLock with SharedMutex with sharedFirst option", () => {
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

  test("real world scenario 1", async () => {
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

  test("real world scenario 2", async () => {
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

  test("real world scenario 3", async () => {
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult1 = await asyncShared();
    expect(sharedResult1).toBe(2);
  });

  test("real world scenario 4", async () => {
    const sharedPromise1 = asyncShared();
    const _exclusivePromise1 = asyncExclusive();
    const sharedResult2 = await asyncShared();
    const sharedResult1 = await sharedPromise1;
    expect(sharedResult1).toBe(2);
    expect(sharedResult2).toBe(2);
  });
});
