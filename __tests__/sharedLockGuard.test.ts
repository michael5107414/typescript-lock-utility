import { SharedLockGuard, SharedMutex, UniqueLock } from "../src";
import { sleepFor } from "./support/util";

describe("SharedLockGuard with SharedMutex", () => {
  let mutex: SharedMutex;
  let value = 0;

  async function asyncFunc(): Promise<number> {
    using _ = await SharedLockGuard.create(mutex);
    value++;
    await sleepFor(100);
    return value;
  }

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  test("functions do interfere with each other", async () => {
    const length = 5;
    const results = await Promise.all(Array.from({ length }, asyncFunc));
    expect(results).toEqual(Array.from({ length }, () => length));
  });
});

describe("UniqueLock and SharedLockGuard with SharedMutex", () => {
  let mutex: SharedMutex;
  let value = 0;

  async function asyncShared(): Promise<number> {
    using _ = await SharedLockGuard.create(mutex);
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

  beforeEach(() => {
    mutex = new SharedMutex();
    value = 0;
  });

  test("using UniqueLock and SharedLockGuard in the same scope", async () => {
    const executeCnt = 2;
    const sharedResultsPromise1 = Promise.all(
      Array.from({ length: executeCnt }, asyncShared),
    );
    await sleepFor(10);
    const exclusiveResultsPromise1 = Promise.all(
      Array.from({ length: executeCnt }, asyncExclusive),
    );
    await sleepFor(10);
    const sharedResultsPromise2 = Promise.all(
      Array.from({ length: executeCnt }, asyncShared),
    );
    const sharedResults2 = await sharedResultsPromise2;
    const exclusiveResults1 = await exclusiveResultsPromise1;
    const sharedResults1 = await sharedResultsPromise1;
    expect(sharedResults1).toEqual(
      Array.from({ length: executeCnt }, () => executeCnt),
    );
    expect(exclusiveResults1.sort()).toEqual(
      Array.from({ length: executeCnt }, (_, k) => executeCnt + k + 1),
    );
    expect(sharedResults2).toEqual(
      Array.from({ length: executeCnt }, () => executeCnt * 3),
    );
  });
});
