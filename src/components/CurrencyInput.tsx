import { useEffect, useState } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function CurrencyInput({ value, onChange, className, readOnly, placeholder }: Props) {
  // Internal state stores formatted string; value prop is in reais (number)
  const [display, setDisplay] = useState<string>(() => formatBRL(Math.round((value || 0) * 100)));

  useEffect(() => {
    // Sync when external value changes (e.g. loaded from DB) and differs from current
    const currentCents = Math.round(parseDisplayToCents(display));
    const incomingCents = Math.round((value || 0) * 100);
    if (currentCents !== incomingCents) {
      setDisplay(formatBRL(incomingCents));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const parseDisplayToCents = (s: string) => {
    const digits = s.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = parseDisplayToCents(e.target.value);
    setDisplay(formatBRL(cents));
    onChange(cents / 100);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
    />
  );
}
