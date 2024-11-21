export function* batch<T>(arr: readonly T[], batchSize: number) {
  for (let i = 0; i < arr.length; i += batchSize) {
    yield arr.slice(i, i + batchSize);
  }
}
