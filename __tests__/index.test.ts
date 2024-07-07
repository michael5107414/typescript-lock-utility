import { LockGuard, Mutex } from "../src";
import { sleepFor } from "./support/util";

describe("LockGuard", () => {
  let mutex: Mutex;
  let flag = false;
  let missCnt = 0;
  let executionCnt = 0;

  async function asyncFunc(): Promise<void> {
    using _ = await LockGuard.create(mutex);
    if (flag) {
      missCnt++;
    }
    flag = true;
    await sleepFor(100);
    if (!flag) {
      missCnt++;
    }
    flag = false;
    executionCnt++;
  }

  beforeEach(() => {
    mutex = new Mutex();
    missCnt = 0;
    executionCnt = 0;
  });

  test("functions do not interfere with each other", async () => {
    const length = 5;
    await Promise.allSettled(Array.from({ length }, asyncFunc));
    expect(executionCnt).toBe(length);
    expect(missCnt).toBe(0);
  });

  test("functions complete in the correct order", async () => {
    const length = 3;
    Promise.allSettled(Array.from({ length }, asyncFunc));
    expect(executionCnt).toBe(0);

    await asyncFunc();
    const promiseObj = asyncFunc();
    expect(executionCnt).toBe(length + 1);

    await promiseObj;
    expect(executionCnt).toBe(length + 2);
    expect(missCnt).toBe(0);
  });
});
