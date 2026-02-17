/** Collect all items from an async generator into an array. */
export async function collectStream<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) {
    items.push(item);
  }
  return items;
}

/** Transform each item in an async generator. */
export async function* mapStream<T, U>(
  gen: AsyncGenerator<T>,
  fn: (item: T) => U,
): AsyncGenerator<U> {
  for await (const item of gen) {
    yield fn(item);
  }
}
