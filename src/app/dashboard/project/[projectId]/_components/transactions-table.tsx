
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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Transaction, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileDown } from "lucide-react";

interface TransactionsTableProps {
  transactions: Transaction[];
  project: Project;
}

export function TransactionsTable({ transactions, project }: TransactionsTableProps) {
  const handleExportCSV = () => {
    const headers = [
      "Date", "Account", "Category", "Type", "Description", 
      "Amount (Project Currency)", "Amount (Account Currency)", "Account Currency"
    ];
    
    const rows = sortedTransactions.map(t => [
      t.clientDate ? format(t.clientDate.toDate(), "yyyy-MM-dd") : 'N/A',
      `"${t.accountName.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.type,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      (t.originalAmount ?? t.amount).toFixed(2),
      t.accountCurrency || project.currency,
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-s," 
      + headers.join(',') + "\n" 
      + rows.join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `${project.name.replace(/\s+/g, '_')}_transactions.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No transactions yet. Add one to get started!
      </div>
    );
  }
  
  // Sort transactions by date, most recent first
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = a.clientDate?.toDate() || new Date(0);
    const dateB = b.clientDate?.toDate() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });


  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.clientDate ? format(transaction.clientDate.toDate(), "MMM d, yyyy") : 'N/A'}
                </TableCell>
                <TableCell>{transaction.accountName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell>{transaction.description || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  transaction.type === "Income" ? "text-green-600" : "text-red-600"
                )}>
                  {transaction.type === 'Income' ? '+' : '-'}
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

