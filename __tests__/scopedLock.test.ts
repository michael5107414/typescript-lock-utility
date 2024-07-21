import { Mutex, ScopedLock } from "../src";
import { MutexInterface } from "../src/types";
import { sleepFor } from "./support/util";

describe("UniqueLock with Mutex", () => {
  let mutex1: Mutex;
  let mutex2: Mutex;
  let mutex3: Mutex;
  let value = 0;
  const sleepMs = 50;

  beforeEach(() => {
    mutex1 = new Mutex();
    mutex2 = new Mutex();
    mutex3 = new Mutex();
    value = 0;
  });

  async function asyncFunc(): Promise<number> {
    using _ = await ScopedLock.create(mutex1, mutex2);
    value++;
    await sleepFor(sleepMs);
    return value;
  }

  async function asyncFunc2(): Promise<number> {
    using _ = await ScopedLock.create(mutex2, mutex3);
    value++;
    await sleepFor(sleepMs);
    return value;
  }

  async function asyncFunc3(): Promise<number> {
    using _ = await ScopedLock.create(mutex1, mutex2, mutex3);
    value++;
    await sleepFor(sleepMs);
    return value;
  }

  test("async function lock same mutexes", async () => {
    const length = 3;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("async function lock common mutexes", async () => {
    const length = 2;
    const results = await Promise.all([asyncFunc(), asyncFunc2()]);
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("lock three mutexes", async () => {
    const length = 2;
    const results = await Promise.all(Array.from({ length }, asyncFunc3));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("lock 0 mutex without error", async () => {
    const mutexes: MutexInterface[] = [];
    using _ = await ScopedLock.create(...mutexes);
  });
});
