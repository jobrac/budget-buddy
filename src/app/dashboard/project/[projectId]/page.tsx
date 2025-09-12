
"use client";

import { collection, doc } from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddTransactionDialog } from "./_components/add-transaction-dialog";
import { TransactionsTable } from "./_components/transactions-table";
import type { Transaction, Project } from "@/lib/types";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [projectSnapshot, projectLoading, projectError] = useDocument(doc(db, "projects", projectId));
  const [transactionsSnapshot, transactionsLoading, transactionsError] = useCollection(
    collection(db, "projects", projectId, "transactions")
  );

  if (transactionsLoading || projectLoading) {
    return <div>Loading transactions...</div>;
  }

  if (transactionsError || projectError) {
    return <div>Error: {transactionsError?.message || projectError?.message}</div>;
  }

  if (!projectSnapshot?.exists()) {
      return <div>Project not found.</div>
  }

  const project = { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
  const transactions = transactionsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[] || [];


  return (
    <>
       <div className="flex items-center justify-between -mt-2">
          <h2 className="text-lg font-semibold md:text-xl font-headline">
            Transactions
          </h2>
          <div className="flex items-center gap-2">
            <AddTransactionDialog projectId={projectId} />
          </div>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Here are all the income and expense transactions for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} project={project} />
        </CardContent>
      </Card>
    </>
  );
}
