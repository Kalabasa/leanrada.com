export function nonNull(value) {
  if (value == null) throw new Error("Expected non-null!");
  return value;
}
