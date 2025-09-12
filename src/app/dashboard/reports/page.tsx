
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import type { Project, Transaction, UserPreferences } from "@/lib/types";
import { useEffect, useState } from "react";
import { startOfMonth, endOfMonth } from 'date-fns';
import { convertCurrency } from "@/ai/flows/currency-converter";


type ChartData = {
  name: string;
  income: number;
  expenses: number;
};

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const [user, loading, error] = useAuthState(auth);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [reportingCurrency, setReportingCurrency] = useState("USD");
  
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    user ? query(collection(db, "projects"), where(`roles.${user.uid}`, "in", ["Owner", "Editor", "Viewer"])) : undefined
  );
  
  const [preferencesSnapshot, preferencesLoading, preferencesError] = useDocument(
    user ? doc(db, "users", user.uid) : undefined
  );

  useEffect(() => {
    if (preferencesLoading) return;
    if (preferencesSnapshot?.exists()) {
        const prefs = preferencesSnapshot.data() as UserPreferences;
        setReportingCurrency(prefs.defaultCurrency || "USD");
    }
  }, [preferencesSnapshot, preferencesLoading]);

  useEffect(() => {
    if (projectsLoading || preferencesLoading) {
      setIsLoading(true);
      return;
    }
    if (projectsSnapshot && !preferencesLoading) {
      const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
      let allProjectsIncome = 0;
      let allProjectsExpenses = 0;
      const newChartData: ChartData[] = [];

      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);

      const fetchTransactions = async () => {
        setIsLoading(true);
        for (const project of projects) {
          const transactionsQuery = query(
            collection(db, "projects", project.id, "transactions"),
            where("clientDate", ">=", Timestamp.fromDate(startOfCurrentMonth)),
            where("clientDate", "<=", Timestamp.fromDate(endOfCurrentMonth))
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          const transactions = transactionsSnapshot.docs.map(doc => doc.data()) as Transaction[];
          
          let projectIncome = 0;
          let projectExpenses = 0;
          
          for(const t of transactions) {
             let convertedAmount = t.amount;
             if (project.currency !== reportingCurrency) {
                 const result = await convertCurrency({
                     amount: t.amount,
                     from: project.currency,
                     to: reportingCurrency,
                 });
                 convertedAmount = result.convertedAmount;
             }
             if(t.type === 'Income') {
                 projectIncome += convertedAmount;
             } else {
                 projectExpenses += convertedAmount;
             }
          }

          allProjectsIncome += projectIncome;
          allProjectsExpenses += projectExpenses;

          newChartData.push({
            name: project.name,
            income: projectIncome,
            expenses: projectExpenses,
          });
        }
        
        setChartData(newChartData);
        setTotals({
          income: allProjectsIncome,
          expenses: allProjectsExpenses,
          balance: allProjectsIncome - allProjectsExpenses,
        });
        setIsLoading(false);
      };

      fetchTransactions();
    }
  }, [projectsSnapshot, projectsLoading, preferencesLoading, reportingCurrency]);


  if (loading || isLoading || preferencesLoading) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div>Loading reports...</div>
        </div>
    );
  }

  if (error || projectsError || preferencesError) {
    return <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">Error: {error?.message || projectsError?.message || preferencesError?.message}</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Global Reports
        </h1>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income (This Month)
              </CardTitle>
              <span className="text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: reportingCurrency }).format(totals.income)}</div>
               <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses (This Month)
              </CardTitle>
              <span className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: reportingCurrency }).format(totals.expenses)}</div>
               <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Balance (This Month)</CardTitle>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 6h12l3-6H3zm2 12h14" />
                </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: reportingCurrency }).format(totals.balance)}</div>
               <p className="text-xs text-muted-foreground">Net income across all projects</p>
            </CardContent>
          </Card>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>All Projects Overview (This Month)</CardTitle>
          <CardDescription>
            A comparison of income vs. expenses for each project, shown in your default reporting currency ({reportingCurrency}).
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
           {chartData.length > 0 ? (
            <ChartContainer config={{
                  income: {
                    label: "Income",
                    color: "hsl(var(--chart-2))",
                  },
                  expenses: {
                    label: "Expenses",
                    color: "hsl(var(--chart-1))",
                  },
                }} className="min-h-[200px] w-full">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: reportingCurrency, notation: 'compact' }).format(value as number)} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value, name, props) => (
                        <div className="flex flex-col">
                            <span className="font-semibold">{props.payload.name}</span>
                            <span className="capitalize">{name}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: reportingCurrency }).format(value as number)}</span>
                        </div>
                    )} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
           ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No transaction data for this month to display.
              </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

    