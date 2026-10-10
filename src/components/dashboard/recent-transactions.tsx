"use client";

import { ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { transactions } from "./data";
import { cn } from "@/lib/utils";

export function RecentTransactions({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "ff-card flex flex-col rounded-2xl border border-neutral-200/70 bg-white p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-neutral-900">
          Recent Transactions
        </h3>
        <button
          type="button"
          className="group flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-coral-500"
        >
          View More
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="ff-scrollbar mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-9 rounded-l-lg bg-neutral-50 pl-4 text-xs font-medium text-neutral-400">
                Order Id
              </TableHead>
              <TableHead className="h-9 bg-neutral-50 text-xs font-medium text-neutral-400">
                Date
              </TableHead>
              <TableHead className="h-9 bg-neutral-50 text-xs font-medium text-neutral-400">
                Status
              </TableHead>
              <TableHead className="h-9 rounded-r-lg bg-neutral-50 pr-4 text-right text-xs font-medium text-neutral-400">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow
                key={tx.id}
                className="border-neutral-100 transition-colors hover:bg-neutral-50/70"
              >
                <TableCell className="py-3 pl-4 text-[13px] font-medium text-neutral-700">
                  {tx.id}
                </TableCell>
                <TableCell className="py-3 text-[13px] text-neutral-400">
                  {tx.date}
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      tx.status === "Paid"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-violet-100 text-violet-600"
                    )}
                  >
                    {tx.status}
                  </span>
                </TableCell>
                <TableCell className="py-3 pr-4 text-right text-[13px] font-semibold tabular-nums text-neutral-800">
                  {tx.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
