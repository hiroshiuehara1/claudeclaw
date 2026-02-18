export class AsyncQueue<T> implements AsyncIterable<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<{
    resolve: (value: IteratorResult<T>) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private error: Error | null = null;
  private closed = false;

  push(value: T): void {
    if (this.closed || this.error) {
      return;
    }
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve({ done: false, value });
      return;
    }
    this.values.push(value);
  }

  fail(error: Error): void {
    if (this.closed || this.error) {
      return;
    }
    this.error = error;
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.reject(error);
    }
  }

  end(): void {
    if (this.closed || this.error) {
      return;
    }
    this.closed = true;
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.resolve({ done: true, value: undefined as never });
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.error) {
      throw this.error;
    }
    if (this.values.length > 0) {
      return { done: false, value: this.values.shift() as T };
    }
    if (this.closed) {
      return { done: true, value: undefined as never };
    }
    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.waiters.push({
        resolve: (result) => {
          if (this.error) {
            reject(this.error);
            return;
          }
          resolve(result);
        },
        reject
      });
    });
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => this.next()
    };
  }
}
