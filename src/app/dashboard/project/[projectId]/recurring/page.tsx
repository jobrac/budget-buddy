
"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecurringTransaction } from "@/lib/types";
import { useParams } from "next/navigation";
import { AddRecurringDialog } from "./_components/add-recurring-dialog";
import RecurringTransactionsList from "./_components/recurring-transactions-list";
import { Button } from "@/components/ui/button";
import { processRecurringTransactions } from "./_actions/process-recurring";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { RefreshCw } from "lucide-react";


export default function RecurringPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const [recurringSnapshot, recurringLoading, recurringError] = useCollection(
    query(collection(db, "projects", projectId, "recurringTransactions"), orderBy("nextDueDate", "asc"))
  );
  
  const handleProcess = async () => {
    setIsProcessing(true);
    try {
        const result = await processRecurringTransactions(projectId);
        toast({
            title: "Processing Complete",
            description: `${result.created} transaction(s) were created.`,
        });
    } catch(e) {
        console.error(e);
        toast({ title: "An error occurred", variant: "destructive"});
    } finally {
        setIsProcessing(false);
    }
  }


  if (recurringLoading) {
    return <div>Loading recurring transactions...</div>;
  }

  if (recurringError) {
    return <div>Error: {recurringError?.message}</div>;
  }

  const recurringTransactions = recurringSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecurringTransaction[] || [];

  return (
    <>
      <div className="flex items-center justify-between -mt-2">
        <h2 className="text-lg font-semibold md:text-xl font-headline">
          Recurring Transactions
        </h2>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleProcess} disabled={isProcessing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Check for due transactions"}
            </Button>
            <AddRecurringDialog projectId={projectId} />
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Manage Recurring Transactions</CardTitle>
          <CardDescription>
            Automate your regular income and expenses. Click "Check for due transactions" to create any pending entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {recurringTransactions.length > 0 ? (
                <RecurringTransactionsList projectId={projectId} recurringTransactions={recurringTransactions} />
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No recurring transactions yet.</p>
                    <p>Create a rule to automate your finances.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
