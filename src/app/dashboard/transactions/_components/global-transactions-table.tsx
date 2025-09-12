
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type GlobalTransaction = Transaction & { projectName: string; projectCurrency: string; };

interface GlobalTransactionsTableProps {
  transactions: GlobalTransaction[];
}

export default function GlobalTransactionsTable({ transactions }: GlobalTransactionsTableProps) {
  
  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No transactions found across any of your projects.
      </div>
    );
  }

  return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {transaction.clientDate ? format(transaction.clientDate.toDate(), "MMM d, yyyy") : 'N/A'}
                </TableCell>
                <TableCell>{transaction.projectName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell>{transaction.description || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-semibold whitespace-nowrap",
                  transaction.type === "Income" ? "text-green-600" : "text-red-600"
                )}>
                  {transaction.type === 'Income' ? '+' : '-'}
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.projectCurrency }).format(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  );
}
