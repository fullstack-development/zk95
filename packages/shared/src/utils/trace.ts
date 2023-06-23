export function assert(msg: string, condition: unknown): asserts condition {
  if (!condition) throw new Error(msg);
}
