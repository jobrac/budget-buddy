
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
import { PieChart, Pie, Cell, Label } from 'recharts';
import { collection, query, getDocs, doc, getDoc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Project, Transaction } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { startOfMonth, endOfMonth } from 'date-fns';

type ChartData = {
  name: string;
  value: number;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];


export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Project Details
        const projectDocRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectDocRef);
        if (projectDoc.exists()) {
            setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
        } else {
            throw new Error("Project not found");
        }

        // Fetch Transactions for the current month
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);

        const transactionsQuery = query(
            collection(db, "projects", projectId, "transactions"),
            where("clientDate", ">=", Timestamp.fromDate(startOfCurrentMonth)),
            where("clientDate", "<=", Timestamp.fromDate(endOfCurrentMonth))
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        setTransactions(transactionsData);

      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const { income, expenses, balance, expenseByCategory, budget, progress } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenseByCategory = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    
    const budget = project?.budget || 0;
    const progress = budget > 0 ? (expenses / budget) * 100 : 0;

    return { 
        income, 
        expenses, 
        balance: income - expenses,
        expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        budget,
        progress
    };
  }, [transactions, project]);

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const budgetData = [
    { name: 'Spent', value: expenses, fill: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.max(0, budget - expenses), fill: 'hsl(var(--muted))' }
  ];


  return (
    <div className="grid gap-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month's Income
              </CardTitle>
              <span className="text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${income.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month's Expenses
              </CardTitle>
              <span className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expenses.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">
                of ${budget.toFixed(2)} budget
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Net Balance</CardTitle>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 6h12l3-6H3zm2 12h14" />
                </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">
                Income minus expenses this month
              </p>
            </CardContent>
          </Card>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Breakdown</CardTitle>
          <CardDescription>
            A breakdown of expenses for the current month. The outer ring shows your progress against your monthly budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full flex justify-center">
            {expenseByCategory.length > 0 ? (
                 <ChartContainer config={{}} className="min-h-[200px] w-full max-w-sm">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                       <Pie data={budgetData} dataKey="value" cx="50%" cy="50%" outerRadius={120} innerRadius={105} cornerRadius={5} startAngle={90} endAngle={450}>
                         {budgetData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                         <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    >
                                    <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="text-3xl font-bold fill-foreground"
                                    >
                                        {progress.toFixed(0)}%
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 20}
                                        className="text-sm text-muted-foreground"
                                    >
                                        Budget Used
                                    </tspan>
                                    </text>
                                );
                                }
                            }}
                        />
                       </Pie>
                      <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={90}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={2}
                          nameKey="name"
                      >
                          {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No expense data for this month.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
