export function parseWholeNumberInput(value: string, minimum = 0) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return minimum;
  return Math.max(minimum, Number(digits));
}

export function toWholeNumber(value: unknown, minimum = 0) {
  const number = Math.trunc(Number(value) || 0);
  return Math.max(minimum, number);
}
