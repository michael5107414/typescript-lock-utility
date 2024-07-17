import { lock, Mutex, SharedMutex, UniqueLock } from "../src";
import { MutexInterface } from "../src/mutex";
import { sleepFor } from "./support/util";

describe.each([
  { description: "UniqueLock with Mutex", GenericMutex: Mutex },
  { description: "UniqueLock with SharedMutex", GenericMutex: SharedMutex },
])("$description", ({ GenericMutex }) => {
  let mutex: MutexInterface;
  let value = 0;

  beforeEach(() => {
    mutex = new GenericMutex();
    value = 0;
  });

  test("lock and unlock", async () => {
    using lock = await UniqueLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    lock.unlock();
    expect(lock.ownsLock()).toBe(false);
  });

  test("tryLock acquired", async () => {
    using lockInstant = await UniqueLock.create(mutex);
    lockInstant.unlock();
    using lockTry = await UniqueLock.create(mutex, "try_to_lock");
    expect(lockTry.ownsLock()).toBe(true);
  });

  test("tryLock not acquired", async () => {
    using _lockInstant = await UniqueLock.create(mutex);
    using lockTryTo = await UniqueLock.create(mutex, "try_to_lock");
    expect(lockTryTo.ownsLock()).toBe(false);
  });

  test("lock after acquired", async () => {
    using lock = await UniqueLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    await expect(lock.lock()).rejects.toThrow("lock already acquired");
  });

  test("tryLock after acquired", async () => {
    using lock = await UniqueLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    expect(() => lock.tryLock()).toThrow("lock already acquired");
  });

  test("unlock after released", async () => {
    using lock = await UniqueLock.create(mutex);
    expect(lock.ownsLock()).toBe(true);
    lock.unlock();
    expect(lock.ownsLock()).toBe(false);
    expect(() => lock.unlock()).toThrow("lock already freed");
  });

  test("lock with lockOptions defer_lock", async () => {
    using lock = await UniqueLock.create(mutex, "defer_lock");
    expect(lock.ownsLock()).toBe(false);
    await lock.lock();
    expect(lock.ownsLock()).toBe(true);
  });

  test("lock with lockOptions adopt_lock", async () => {
    {
      using lock1 = await UniqueLock.create(mutex);
      const releasedMutex = lock1.release();
      using lock2 = await UniqueLock.create(releasedMutex, "adopt_lock");
      expect(lock1.ownsLock()).toBe(false);
      expect(lock2.ownsLock()).toBe(true);
    }
    using lock3 = await UniqueLock.create(mutex);
    expect(lock3.ownsLock()).toBe(true);
  });

  test("lock after release", async () => {
    using lock = await UniqueLock.create(mutex, "defer_lock");
    lock.release();
    await expect(lock.lock()).rejects.toThrow("mutex is not set");
  });

  test("tryLock after release", async () => {
    using lock = await UniqueLock.create(mutex, "defer_lock");
    lock.release();
    expect(() => lock.tryLock()).toThrow("mutex is not set");
  });

  test("unlock after release", async () => {
    using lock = await UniqueLock.create(mutex);
    lock.release();
    expect(() => lock.unlock()).toThrow("mutex is not set");
  });

  test("release twice", async () => {
    using lock = await UniqueLock.create(mutex);
    lock.release();
    expect(() => lock.release()).toThrow("mutex is not set");
  });

  async function asyncFunc(): Promise<number> {
    using _ = await UniqueLock.create(mutex);
    value++;
    await sleepFor(50);
    return value;
  }

  test("functions execute in parallel complete in the correct order", async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("functions execute with complex senarios complete in the correct order", async () => {
    const result1Promise = asyncFunc();
    await sleepFor(10); // Ersure ordering
    const result2 = await asyncFunc();
    const result1 = await result1Promise;

    expect(result1).toBe(1);
    expect(result2).toBe(2);
  });

  test("real world scenario 1", async () => {
    await lock(mutex);
    using lock1 = await UniqueLock.create(mutex, "adopt_lock");
    using lock2 = await UniqueLock.create(lock1.release(), "adopt_lock");

    setTimeout(() => {
      lock2.unlock();
      value = 1;
    }, 100);
    expect(value).toBe(0);
    using lock3 = await UniqueLock.create(mutex);
    expect(value).toBe(1);
    expect(lock3.ownsLock()).toBe(true);
  });
});
