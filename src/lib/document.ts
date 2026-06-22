export function onlyDocumentDigits(value: string, isLegalEntity: boolean) {
  return value.replace(/\D/g, "").slice(0, isLegalEntity ? 14 : 11);
}

export function formatDocument(value: string, isLegalEntity: boolean) {
  const digits = onlyDocumentDigits(value, isLegalEntity);

  if (!isLegalEntity) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function isDocumentComplete(value: string, isLegalEntity: boolean) {
  return onlyDocumentDigits(value, isLegalEntity).length === (isLegalEntity ? 14 : 11);
}
