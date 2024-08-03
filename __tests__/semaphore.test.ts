import { Semaphore } from '../src';

describe('Semaphore (basic usage)', () => {
  let semaphore: Semaphore;
  let val = 0;

  beforeEach(() => {
    semaphore = new Semaphore(1);
    val = 0;
  });

  async function func1(): Promise<void> {
    await semaphore.acquire();
    val++;
    semaphore.release();
  }

  test('acquire and release', async () => {
    void func1();
    await func1();
    expect(val).toBe(2);
  });

  test('tryAcquire', () => {
    expect(semaphore.tryAcquire()).toBe(true);
    expect(semaphore.tryAcquire()).toBe(false);
    semaphore.release();
    expect(semaphore.tryAcquire()).toBe(true);
  });

  test('release with invalid update', () => {
    expect(() => semaphore.release(-1)).toThrow('update must be a non-negative integer');
    expect(() => semaphore.release(1.5)).toThrow('update must be a non-negative integer');
  });
});

describe('Semaphore (advanced usage)', () => {
  let sem1: Semaphore;
  let sem2: Semaphore;
  let sem3: Semaphore;

  beforeEach(() => {
    sem1 = new Semaphore(0);
    sem2 = new Semaphore(0);
    sem3 = new Semaphore(1);
  });

  async function func1(callback: () => void): Promise<void> {
    await sem1.acquire();
    callback();
    sem2.release();
  }

  async function func2(callback: () => void): Promise<void> {
    await sem2.acquire();
    callback();
    sem3.release();
  }

  async function func3(callback: () => void): Promise<void> {
    await sem3.acquire();
    callback();
    sem1.release();
  }

  test('ensure execution order', async () => {
    const results: number[] = [];

    await Promise.all([func1(() => results.push(1)), func2(() => results.push(2)), func3(() => results.push(3))]);

    expect(results).toEqual([3, 1, 2]);
  });
});
