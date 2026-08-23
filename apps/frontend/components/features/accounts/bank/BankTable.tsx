"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { BankAddRow } from "./BankAddRow";
import { BankRow } from "./BankRow";
import {
  usePaymentAccounts,
  useCreatePaymentAccount,
  useUpdatePaymentAccount,
  useDeletePaymentAccount,
} from "@/hooks/usePaymentAccounts";
import { PaymentAccountType } from "@repo/shared";

export function BankTable() {
  const [highlightedAdd, setHighlightedAdd] = useState(false);

  const { data, isLoading } = usePaymentAccounts();
  const items = (data ?? []).filter(
    (item) => item.type === PaymentAccountType.BANK,
  );

  const { mutate: createAccount } = useCreatePaymentAccount();
  const { mutate: updateAccount } = useUpdatePaymentAccount();
  const { mutate: deleteAccount } = useDeletePaymentAccount();

  function handleAdd(name: string) {
    createAccount(
      { name },
      {
        onSuccess: () => {
          setHighlightedAdd(true);
          setTimeout(() => setHighlightedAdd(false), 1800);
        },
      },
    );
  }

  function handleSave(id: string, name: string) {
    updateAccount({ id, input: { name } });
  }

  function handleDelete(id: string) {
    deleteAccount(id);
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <Table
          className="min-w-full border-collapse rounded-none"
          rounded={false}
        >
          <TableHeader className="border-b border-[var(--color-border)] bg-[var(--color-background-muted)]">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-12 w-12 px-5 text-sm font-semibold text-[var(--color-text-secondary)]">
                #
              </TableHead>
              <TableHead className="h-12 px-5 text-sm font-semibold text-[var(--color-text-secondary)]">
                Name
              </TableHead>
              <TableHead
                align="center"
                className="h-12 w-30 px-5 text-center text-sm font-semibold text-[var(--color-text-secondary)]"
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <BankAddRow onAdd={handleAdd} isHighlighted={highlightedAdd} />

            {isLoading ? (
              <TableRow className="border-b-0">
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="border-b-0">
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                >
                  No bank accounts found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <BankRow
                  key={item.id}
                  index={index + 1}
                  item={item}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
