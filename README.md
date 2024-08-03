# TypeScript Lock Utility

[![Node.js version][nodejs-badge]][nodejs]
[![TypeScript version][ts-badge]][typescript-5-2]

This package offers a comprehensive suite of utilities for managing locks in TypeScript applications, leveraging the Resource Management feature introduced in TypeScript 5.2.

## Requirements

- Node.js version ^18.18, ^20.9, or >=21.1 is required to support `Symbol.dispose`.
- TypeScript version >=5.2 is required for using the `using` keyword.

## Installation

```bash
npm install typescript-lock-utility
```

## Features

### Table of Contents

- [UniqueLock](#uniquelock)
- [SharedLock](#sharedlock)
- [Reader-Writer Lock](#reader-writer-lock)
- [ScopedLock](#scopedlock)
- [Semaphore](#semaphore)
- [ConditionVariable](#conditionvariable)
- [lock](#lock)

### UniqueLock

Ensures exclusive access to a resource.

```typescript
// Sample code
class TestClass {
  private mutex = new Mutex();

  async function func(): Promise<void> {
    using _ = await UniqueLock.create(this.mutex);
    console.log('function entered');
    // execute for a period of time
    console.log('function leaved');
  } // when func finished, the lock would automatically released.
}

const obj = new TestClass();
await Promise.allSettled([obj.func(), obj.func()]);
```

```
// Result
function entered
function leaved
function entered
function leaved
```

### SharedLock

Allows multiple concurrent accesses.

```typescript
// Sample code
class TestClass {
  private mutex = new SharedMutex();

  async function func(): Promise<void> {
    using _ = await SharedLock.create(this.mutex);
    console.log('function entered');
    // execute for a period of time
    console.log('function leaved');
  } // when func finished, the lock would automatically released.
}

const obj = new TestClass();
await Promise.all([obj.func(), obj.func()]);
```

```
// Result
function entered
function entered
function leaved
function leaved
```

### Reader-Writer Lock

Combines UniqueLock and SharedLock for efficient read-write access.

```typescript
// Sample code
class TestClass {
  // When using new SharedMutex(true), lockShared() will be given higher priority over lock().
  private mutex = new SharedMutex();

  async function read(): Promise<void> {
    using _ = await UniqueLock.create(this.mutex);
    console.log('function read entered');
    // execute for a period of time
    console.log('function read leaved');
  }

  async function write(): Promise<void> {
    using _ = await UniqueLock.create(this.mutex);
    console.log('function write entered');
    // execute for a period of time
    console.log('function write leaved');
  }
}

const obj = new TestClass();
const readPromise1 = obj.read();
const readPromise2 = obj.read();
const writePromise1 = obj.write();
const readPromise3 = obj.read();
await readPromise3;
```

```
// Result
function read entered
function read entered
function read leaved
function read leaved
function write entered
function write leaved
function read entered
function read leaved
```

### ScopedLock

Manages multiple locks within the same scope.

```typescript
// Sample code
class TestClass {
  private mutex1 = new Mutex();
  private mutex2 = new Mutex();

  async function func1(): Promise<void> {
    using _ = await ScopedLock.create(this.mutex1);
    console.log('function func1 entered');
    // execute for a period of time
    console.log('function func1 leaved');
  }

  async function func2(): Promise<void> {
    using _ = await ScopedLock.create(this.mutex2);
    console.log('function func2 entered');
    // execute for a period of time
    console.log('function func2 leaved');
  }

  async function func12(): Promise<void> {
    using _ = await ScopedLock.create(this.mutex1, this.mutex2);
    console.log('function func12 entered');
    // execute for a period of time
    console.log('function func12 leaved');
  }
}

const obj = new TestClass();
const promise12 = obj.func12();
const promise1 = obj.func1();
const promise2 = obj.func2();
await Promise.all([promise12, promise1, promise2]);
```

```
// Result
function func12 entered
function func12 leaved
function func1 entered
function func2 entered
function func1 leaved
function func2 leaved
```

### Semaphore

Controls access to a resource based on the number of available permits.

```typescript
// Sample code
class TestClass {
  private sem1 = new Semaphore(0);
  private sem2 = new Semaphore(0);
  private sem3 = new Semaphore(1);

  async function func1(): Promise<void> {
    await this.sem1.acquire();
    console.log('execute func1');
    this.sem2.release();
  }

  async function func2(): Promise<void> {
    await this.sem2.acquire();
    console.log('execute func2');
    this.sem3.release();
  }

  async function func3(): Promise<void> {
    await this.sem3.acquire();
    console.log('execute func3');
    this.sem1.release();
  }
}

const obj = new TestClass();
await Promise.all([obj.func1(), obj.func2(), obj.func3()]);
```

```
// Result
execute func3
execute func1
execute func2
```

### ConditionVariable

Synchronizes async functions based on fulfilling a condition.

```typescript
// Sample code
class TestClass {
  private cv = new ConditionVariable();
  private mutex = new Mutex();
  private flag = false;

  async func1(): Promise<void> {
    using lk = await UniqueLock.create(this.mutex);
    await this.cv.wait(lk, () => this.flag);
    console.log("execute func1");
  }

  async func2(): Promise<void> {
    // execute for a period of time
    console.log("execute func2");
    this.flag = true;
    this.cv.notifyOne();
  }
}

const obj = new TestClass();
obj.func1();
// execute for a period of time
obj.func2();
```

```
// Result
execute func2
execute func1
```

### lock

```typescript
// Sample code
class TestClass {
  private mutex1 = new Mutex();
  private mutex2 = new Mutex();

  async function func(): Promise<void> {
    await lock(mutex1, mutex2);
    using _1 = await UniqueLock.create(mutex1, 'defer_lock');
    using _2 = await UniqueLock.create(mutex2, 'defer_lock');
    // equivalent to
    // using _ = await ScopedLock.create(this.mutex1, this.mutex2);
  }
}
```

[ts-badge]: https://img.shields.io/badge/TypeScript-5.2-blue.svg
[typescript-5-2]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/
[nodejs-badge]: https://img.shields.io/badge/Node.js-^18.18%20||%20^20.9%20||%20>=21.1-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v20.x/docs/api/
