
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Project, Transaction } from "@/lib/types";
import { useEffect, useState } from "react";
import GlobalTransactionsTable from "./_components/global-transactions-table";

// This is an augmented transaction type that includes the project name
type GlobalTransaction = Transaction & { projectName: string; projectCurrency: string; };

export default function TransactionsPage() {
  const [user, userLoading, userError] = useAuthState(auth);
  const [transactions, setTransactions] = useState<GlobalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      // Not an error, just no user logged in
      return;
    }
    
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get all projects the user is part of
        const projectsQuery = query(collection(db, "projects"), where(`roles.${user.uid}`, "in", ["Owner", "Editor", "Viewer"]));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

        // 2. Fetch transactions for each project
        let allTransactions: GlobalTransaction[] = [];
        for (const project of projects) {
          const transactionsQuery = collection(db, "projects", project.id, "transactions");
          const transactionsSnapshot = await getDocs(transactionsQuery);
          const projectTransactions = transactionsSnapshot.docs.map(doc => ({
            ...(doc.data() as Transaction),
            id: doc.id,
            projectName: project.name,
            projectCurrency: project.currency,
          }));
          allTransactions = [...allTransactions, ...projectTransactions];
        }
        
        // 3. Sort all transactions by date
        allTransactions.sort((a, b) => {
           const dateA = a.clientDate?.toDate() || new Date(0);
           const dateB = b.clientDate?.toDate() || new Date(0);
           return dateB.getTime() - dateA.getTime();
        });

        setTransactions(allTransactions);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();

  }, [user, userLoading]);

  if (loading || userLoading) {
      return (
          <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              <h1 className="text-lg font-semibold md:text-2xl font-headline">All Transactions</h1>
              <div>Loading transactions...</div>
          </div>
      );
  }
  
  if (error || userError) {
      return <div>Error: {error || userError?.message}</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          All Transactions
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Global Transaction History</CardTitle>
          <CardDescription>
            A chronological view of all income and expenses across all your projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlobalTransactionsTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
