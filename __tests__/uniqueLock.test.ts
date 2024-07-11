import { Mutex, SharedMutex, UniqueLock } from "../src";
import { sleepFor } from "./support/util";

describe("UniqueLock with Mutex", () => {
  let mutex: Mutex;
  let value = 0;

  async function asyncFunc(): Promise<number> {
    using _ = await UniqueLock.create(mutex);
    value++;
    await sleepFor(100);
    return value;
  }

  beforeEach(() => {
    mutex = new Mutex();
    value = 0;
  });

  test("functions do not interfere with each other", async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("functions complete in the correct order", async () => {
    const length = 3;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));

    const resultPromise = asyncFunc();
    await sleepFor(10);
    const result2 = await asyncFunc();
    await sleepFor(10);
    const result1 = await resultPromise;
    expect(result1).toBe(length + 1);
    expect(result2).toBe(length + 2);
  });
});

describe("UniqueLock with SharedMutex", () => {
  let mutex: SharedMutex;
  let value = 0;

  async function asyncFunc(): Promise<number> {
    using _ = await UniqueLock.create(mutex);
    value++;
    await sleepFor(100);
    return value;
  }

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  test("functions do not interfere with each other", async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));
  });

  test("functions complete in the correct order", async () => {
    const length = 3;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results.sort()).toEqual(Array.from({ length }, (_, k) => k + 1));

    const resultPromise = asyncFunc();
    await sleepFor(10);
    const result2 = await asyncFunc();
    await sleepFor(10);
    const result1 = await resultPromise;
    expect(result1).toBe(length + 1);
    expect(result2).toBe(length + 2);
  });
});
