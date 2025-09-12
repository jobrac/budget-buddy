
"use client";

import type { RecurringTransaction } from "@/lib/types";
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
import { Trash2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EditRecurringDialog } from "./edit-recurring-dialog";


interface RecurringTransactionsListProps {
  recurringTransactions: RecurringTransaction[];
  projectId: string;
}

export default function RecurringTransactionsList({ recurringTransactions, projectId }: RecurringTransactionsListProps) {
    const { toast } = useToast();

    const formatFrequency = (item: RecurringTransaction) => {
        if (item.interval > 1) {
            return `Every ${item.interval} ${item.frequency.slice(0,-2)}s`;
        }
        return item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1);
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "projects", projectId, "recurringTransactions", id));
            toast({ title: "Rule deleted" });
        } catch (error) {
            toast({ title: "Error deleting rule", variant: "destructive" });
        }
    }

    return (
        <div className="border rounded-md">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Next Due</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {recurringTransactions.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">
                        {format(item.nextDueDate.toDate(), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">{item.accountName}</div>
                    </TableCell>
                     <TableCell>{formatFrequency(item)}</TableCell>
                    <TableCell className={cn(
                        "text-right font-semibold",
                        item.type === "Income" ? "text-green-600" : "text-red-600"
                    )}>
                        {item.type === 'Income' ? '+' : '-'}
                        ${item.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                         <EditRecurringDialog projectId={projectId} recurringTransaction={item} />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the recurring transaction rule. It will not delete any transactions that have already been created by this rule.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
