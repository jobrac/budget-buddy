
"use client";

import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase/client";
import { collection, doc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Account, Project } from "@/lib/types";
import { useParams } from "next/navigation";
import { CreateAccountDialog } from "./_components/create-account-dialog";
import AccountsList from "./_components/accounts-list";
import { TransferFundsDialog } from "./_components/transfer-funds-dialog";

export default function AccountsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [projectSnapshot, projectLoading, projectError] = useDocument(doc(db, "projects", projectId));

  const [accountsSnapshot, accountsLoading, accountsError] = useCollection(
    collection(db, "projects", projectId, "accounts")
  );

  if (accountsLoading || projectLoading) {
    return <div>Loading accounts...</div>;
  }

  if (accountsError || projectError) {
    return <div>Error: {accountsError?.message || projectError?.message}</div>;
  }
  
  if (!projectSnapshot?.exists()) {
    return <div>Project not found.</div>
  }

  const accounts = accountsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[] || [];

  return (
    <>
      <div className="flex items-center justify-between -mt-2">
        <h2 className="text-lg font-semibold md:text-xl font-headline">
          Accounts
        </h2>
        <div className="flex items-center gap-2">
          <TransferFundsDialog projectId={projectId} />
          <CreateAccountDialog projectId={projectId} />
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Manage Accounts</CardTitle>
          <CardDescription>
            Here are all the accounts for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {accounts.length > 0 ? (
                <AccountsList accounts={accounts} />
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No accounts yet.</p>
                    <p>Create one to start tracking transactions.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
