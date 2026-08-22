"use client";

import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import Dropdown from "../ui/dropdown";
import { usePaymentOptions } from "@/hooks/usePaymentAccounts";

export interface PaymentOption {
  id: string;
  name: string;
}

interface PaymentSelectProps {
  value?: PaymentOption | null;
  onChange: (option: PaymentOption) => void;
  placeholder?: string;
  disabled?: boolean;
  placement?: "bottom" | "top";
}

export default function PaymentSelect({
  value,
  onChange,
  placeholder = "Select payment method",
  disabled = false,
  placement = "bottom",
}: PaymentSelectProps) {
  const { data: paymentOptions, isLoading } = usePaymentOptions();

  useEffect(() => {
    if (!isLoading && paymentOptions && !value) {
      onChange(paymentOptions.cash);
    }
  }, [paymentOptions, isLoading, value, onChange]);

  const handleSelect = (option: PaymentOption) => {
    onChange(option);
  };

  const sections = paymentOptions
    ? [
        {
          label: "Cash",
          items: [
            {
              label: paymentOptions.cash.name,
              onClick: () => handleSelect(paymentOptions.cash),
            },
          ],
        },
        {
          label: "Bank Accounts",
          items: paymentOptions.banks.map((bank) => ({
            label: bank.name,
            onClick: () => handleSelect(bank),
          })),
        },
      ]
    : [];

  const trigger = (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] transition-colors duration-150 ${
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-[var(--color-primary)] cursor-pointer"
      }`}
    >
      <span
        className={
          value
            ? "text-[var(--color-text-primary)]"
            : "text-[var(--color-text-muted)]"
        }
      >
        {isLoading ? "Loading..." : (value?.name ?? placeholder)}
      </span>
      <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
    </button>
  );

  return (
    <Dropdown
      trigger={trigger}
      sections={sections}
      width="md"
      placement={placement}
    />
  );
}
